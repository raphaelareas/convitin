import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';

// Desabilitar rejeição de certificados TLS localmente em modo desenvolvimento para evitar erros de SSL
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function GET(request: Request) {
  let browser = null;
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    let cleanedUrl = targetUrl.trim();

    // Adiciona protocolo se não houver
    if (!/^https?:\/\//i.test(cleanedUrl)) {
      cleanedUrl = 'https://' + cleanedUrl;
    }

    // Identificar a plataforma de forma básica
    let platform: 'mercadolivre' | 'shopee' | 'amazon' | 'other' = 'other';
    if (/mercadolivre\.com/i.test(cleanedUrl) || /mercadolibre/i.test(cleanedUrl) || /meli\.(la|li)/i.test(cleanedUrl)) {
      platform = 'mercadolivre';
    } else if (/shopee\.com/i.test(cleanedUrl) || /shp\.ee/i.test(cleanedUrl)) {
      platform = 'shopee';
    } else if (/amazon\.com/i.test(cleanedUrl)) {
      platform = 'amazon';
    }

    // Identificar se parece uma busca
    const isSearchLink = 
      (/lista\.mercadolivre\.com\.br/i.test(cleanedUrl) || 
       /\/search/i.test(cleanedUrl) || 
       /&search/i.test(cleanedUrl) || 
       /\/s\?/i.test(cleanedUrl) || 
       /busca/i.test(cleanedUrl)) && !/\/p\/MLB[0-9]+/i.test(cleanedUrl);

    // No ambiente local e de produção, tentamos achar o executável do Chrome do sistema
    const chromePath = 
      process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : '/usr/bin/google-chrome';
    
    const options = {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        '--disable-blink-features=AutomationControlled',
      ],
      executablePath: chromePath,
      headless: true,
    };

    // Inicia o navegador
    browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    
    // Configura headers do Chrome real completo
    await page.setExtraHTTPHeaders({
      'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Sobrescrever a propriedade navigator.webdriver para burlar a detecção do Akamai/Cloudflare
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3],
      });
      Object.defineProperty(navigator, 'languages', {
        get: () => ['pt-BR', 'pt'],
      });
    });

    // Configura viewport padrão
    await page.setViewport({ width: 1920, height: 1080 });

    // Navega até a página de produto. Usamos 'domcontentloaded' para ler metatags mesmo com bloqueios
    let loadFailed = false;
    let pageTitle = '';
    let pageHtml = '';
    let finalUrl = cleanedUrl;

    try {
      const response = await page.goto(cleanedUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      // Se der 403 (bloqueado por Akamai no headless), tentamos ler metatags a partir da URL no fallback
      if (response && response.status() === 403) {
        loadFailed = true;
      }
      finalUrl = page.url();
      pageTitle = await page.title();
      pageHtml = await page.content();
    } catch(err) {
      loadFailed = true;
    }

    let title = '';
    let candidateImages: string[] = [];

    // Se o headless carregou a página com sucesso (200 OK)
    if (!loadFailed && pageHtml) {
      // Extrair título
      const metaTitle = await page.evaluate(() => {
        const og = document.querySelector('meta[property="og:title"]');
        if (og) return og.getAttribute('content');
        const h1 = document.querySelector('h1');
        if (h1) return h1.innerText;
        return null;
      });

      title = metaTitle || pageTitle || '';

      // Extrair imagens da página
      let images = await page.evaluate(() => {
        const list: string[] = [];
        const ogImg = document.querySelector('meta[property="og:image"]');
        if (ogImg && ogImg.getAttribute('content')) {
          const url = ogImg.getAttribute('content');
          if (url && url.startsWith('http')) list.push(url);
        }

        const imgs = Array.from(document.querySelectorAll('img'));
        for (const img of imgs) {
          const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy');
          if (src && src.startsWith('http')) {
            if (!/logo|favicon|brand|placeholder|banner|sprite|pixel|analytics|loading|icon/i.test(src)) {
              if (!list.includes(src)) {
                list.push(src);
              }
            }
          }
        }
        return list;
      });

      candidateImages = images;
    }

    // Se falhou (403/Timeout) ou não trouxe imagens/título, ativamos o fallback via nome de URL + busca
    if (loadFailed || !title || title === 'Produto sem Nome' || candidateImages.length === 0) {
      // Adivinhar nome do produto pela URL
      try {
        const urlObj = new URL(cleanedUrl);
        const paths = urlObj.pathname.split('/').filter(Boolean);
        let titlePart = '';
        
        const pIndex = paths.indexOf('p');
        const pdIndex = paths.indexOf('pd');
        if (pIndex !== -1 && pIndex > 0) {
          titlePart = paths[pIndex - 1];
        } else if (pdIndex !== -1 && pdIndex > 0) {
          titlePart = paths[pdIndex - 1];
        } else {
          titlePart = paths[paths.length - 1] || '';
          if (titlePart.includes('.')) {
            titlePart = titlePart.split('.')[0];
          }
        }

        if (titlePart) {
          const segments = titlePart.split('-');
          const filteredSegments = segments.filter(seg => {
            if (/^[A-Z0-9]{3,}$/.test(seg) && /[0-9]/.test(seg) && /[A-Z]/.test(seg)) return false;
            if (/^[0-9]{2,}$/.test(seg)) return false;
            return true;
          });
          
          let guessedTitle = decodeURIComponent(filteredSegments.join(' ')).replace(/_/g, ' ').trim();
          guessedTitle = guessedTitle
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          if (guessedTitle) {
            title = guessedTitle;
          }
        }
      } catch(e){}

      // Buscar imagens de fallback na Amazon
      if (title && title !== 'Produto sem Nome') {
        try {
          const amzSearchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(title)}`;
          const amzRes = await fetch(amzSearchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
              'Accept-Language': 'pt-BR,pt;q=0.9',
            }
          });
          if (amzRes.ok) {
            const amzHtml = await amzRes.text();
            const amzMatches = amzHtml.matchAll(/<img[^>]*class=["']s-image["'][^>]*src=["']([^"']+)["']/gi);
            for (const match of amzMatches) {
              if (candidateImages.length >= 3) break;
              const imgUrl = match[1];
              if (!candidateImages.includes(imgUrl)) candidateImages.push(imgUrl);
            }
          }
        } catch (e) {
          console.warn('Erro ao obter imagens no fallback do Puppeteer:', e);
        }
      }
    }

    // Sanitizar título final
    title = title
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s*[-\|]\s*(Mercado Livre|Amazon|Shopee|Casas Bahia|Extra|Ponto Frio).*$/i, '')
      .trim();

    // Ajusta imagens para alta resolução dependendo da plataforma
    let finalImages = candidateImages.map(url => {
      if (platform === 'mercadolivre') {
        return url.replace(/-(?:I|E)\.(jpg|webp|png)/, '-O.$1');
      }
      return url;
    });

    // Fechar navegador
    await browser.close();
    browser = null;

    return NextResponse.json({
      name: title || 'Produto sem Nome',
      image_url: finalImages[0] || null,
      images: finalImages.slice(0, 6),
      is_search_link: isSearchLink,
      platform,
      url: finalUrl
    });

  } catch (error: any) {
    console.error('Puppeteer scraper error:', error);
    if (browser) {
      try {
        await browser.close();
      } catch(e){}
    }
    return NextResponse.json(
      { error: 'Scraper failed to run browser engine' },
      { status: 500 }
    );
  }
}

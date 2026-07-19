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
      ],
      executablePath: chromePath,
      headless: true,
    };

    // Inicia o navegador
    browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    
    // Configura o User-Agent para evitar bloqueios simples
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Configura viewport padrão
    await page.setViewport({ width: 1280, height: 800 });

    // Navega até a página de produto
    await page.goto(cleanedUrl, { waitUntil: 'networkidle2', timeout: 20000 });

    // Aguarda um pequeno delay para carregar lazy components e imagens
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Extrair título real da página
    let title = await page.title();
    
    // Tentar extrair do og:title ou h1 se o título da página vier sujo ou genérico
    const metaTitle = await page.evaluate(() => {
      const og = document.querySelector('meta[property="og:title"]');
      if (og) return og.getAttribute('content');
      const h1 = document.querySelector('h1');
      if (h1) return h1.innerText;
      return null;
    });

    if (metaTitle) {
      title = metaTitle;
    }

    // Sanitizar título
    title = title
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s*[-\|]\s*(Mercado Livre|Amazon|Shopee|Casas Bahia|Extra|Ponto Frio).*$/i, '')
      .trim();

    // Extrair imagens da página analisando tags img
    let images = await page.evaluate((plat) => {
      const list: string[] = [];
      
      // 1. Prioriza og:image
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg && ogImg.getAttribute('content')) {
        const url = ogImg.getAttribute('content');
        if (url && url.startsWith('http')) list.push(url);
      }

      // 2. Extrai imagens do corpo do documento
      const imgs = Array.from(document.querySelectorAll('img'));
      for (const img of imgs) {
        const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy');
        if (src && src.startsWith('http')) {
          // Filtrar tracking/icones
          if (!/logo|favicon|brand|placeholder|banner|sprite|pixel|analytics|loading|icon/i.test(src)) {
            if (!list.includes(src)) {
              list.push(src);
            }
          }
        }
      }
      return list;
    }, platform);

    // Ajusta imagens para alta resolução dependendo da plataforma
    let finalImages = images.map(url => {
      if (platform === 'mercadolivre') {
        return url.replace(/-(?:I|E)\.(jpg|webp|png)/, '-O.$1');
      }
      return url;
    });

    // Se falhar em obter imagens da página, fazemos fallback de busca na Amazon
    if (finalImages.length === 0 && title && title !== 'Produto sem Nome') {
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
            if (finalImages.length >= 3) break;
            const imgUrl = match[1];
            if (!finalImages.includes(imgUrl)) finalImages.push(imgUrl);
          }
        }
      } catch (e) {
        console.warn('Erro ao obter imagens no fallback do Puppeteer:', e);
      }
    }

    // Fechar navegador
    await browser.close();
    browser = null;

    return NextResponse.json({
      name: title || 'Produto sem Nome',
      image_url: finalImages[0] || null,
      images: finalImages.slice(0, 6),
      is_search_link: isSearchLink,
      platform,
      url: page.url() // Devolve a URL final caso tenha ocorrido algum redirect no browser
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

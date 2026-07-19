import { NextResponse } from 'next/server';

// Desabilitar rejeição de certificados TLS localmente em modo desenvolvimento para evitar erros de SSL
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function GET(request: Request) {
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

    // Identificar links encurtados da Shopee (shp.ee ou br.shp.ee)
    if (/shp\.ee/i.test(cleanedUrl)) {
      try {
        const res = await fetch(cleanedUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
          }
        });
        if (res.ok) {
          const html = await res.text();
          // Procurar pela variável CONFIG.httpUrl no código script
          const configMatch = html.match(/httpUrl\s*:\s*["']([^"']+)["']/i);
          if (configMatch && configMatch[1]) {
            // Decodificar barras escapadas (\/)
            cleanedUrl = configMatch[1].replace(/\\/g, '');
          }
        }
      } catch (err) {
        console.warn('Erro ao ler link encurtado Shopee via regex:', err);
      }
    }

    // Identificar a plataforma
    let platform: 'mercadolivre' | 'shopee' | 'amazon' | 'other' = 'other';
    if (/mercadolivre\.com/i.test(cleanedUrl) || /mercadolibre/i.test(cleanedUrl)) {
      platform = 'mercadolivre';
    } else if (/shopee\.com/i.test(cleanedUrl) || /shp\.ee/i.test(cleanedUrl)) {
      platform = 'shopee';
    } else if (/amazon\.com/i.test(cleanedUrl)) {
      platform = 'amazon';
    }

    // Verificar se parece uma busca ou lista
    const isSearchLink = 
      /lista\.mercadolivre\.com\.br/i.test(cleanedUrl) || 
      /\/search/i.test(cleanedUrl) || 
      /&search/i.test(cleanedUrl) || 
      /\/s\?/i.test(cleanedUrl) || 
      /busca/i.test(cleanedUrl);

    // Se NÃO for link de busca, limpamos os parâmetros adicionais (query strings ?... e hashes #...)
    if (!isSearchLink) {
      cleanedUrl = cleanedUrl.split('?')[0].split('#')[0];
    }

    // =========================================================================
    // CASO 1: SHOPEE (Estratégia Especial de Bypass por URL + Busca na Amazon/ML)
    // =========================================================================
    if (platform === 'shopee' && !isSearchLink) {
      // Extrair título do produto diretamente da URL da Shopee (que é muito descritiva e limpa)
      const urlWithoutQuery = targetUrl.split('?')[0].split('#')[0];
      const pathPart = urlWithoutQuery.split('/').pop() || '';
      // A URL da Shopee pode ser: /nome-do-produto-i.123.456 ou /product/123/456 ou /nome-do-produto
      let titlePart = pathPart;
      if (pathPart.includes('-i.')) {
        titlePart = pathPart.split('-i.')[0];
      } else if (pathPart.includes('.')) {
        titlePart = pathPart.split('.')[0];
      }
      let extractedTitle = decodeURIComponent(titlePart).replace(/-/g, ' ').replace(/_/g, ' ').trim();
 
      // Sanitizar título se veio apenas IDs numéricos ou lixo
      if (!extractedTitle || /^\d+$/.test(extractedTitle) || extractedTitle.length < 3) {
        const parts = urlWithoutQuery.split('/');
        const penUlt = parts[parts.length - 2] || '';
        if (penUlt && !/^(product|item|shop|category|s|i|c)$/i.test(penUlt)) {
          extractedTitle = decodeURIComponent(penUlt).replace(/-/g, ' ').replace(/_/g, ' ').trim();
        } else {
          // Tentar adivinhar extraindo de parâmetros da URL caso existam
          const matchQueryParam = targetUrl.match(/utm_content=([^&]+)/) || targetUrl.match(/keyword=([^&]+)/);
          if (matchQueryParam && matchQueryParam[1]) {
            extractedTitle = decodeURIComponent(matchQueryParam[1]).replace(/-/g, ' ').replace(/_/g, ' ').trim();
          } else {
            extractedTitle = 'Produto da Shopee';
          }
        }
      }

      // Se for apenas número ou IDs e não pudermos adivinhar, damos fallback genérico
      if (/^\d+$/.test(extractedTitle)) {
        extractedTitle = 'Produto da Shopee';
      }

      // Capitalizar palavras
      if (extractedTitle !== 'Produto da Shopee') {
        extractedTitle = extractedTitle
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      // Buscar imagens de fallback
      const fallbackImages: string[] = [];
      if (extractedTitle !== 'Produto da Shopee') {
        try {
          const amzSearchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(extractedTitle)}`;
          const amzRes = await fetch(amzSearchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'pt-BR,pt;q=0.9',
            },
            next: { revalidate: 3600 }
          });
          if (amzRes.ok) {
            const amzHtml = await amzRes.text();
            const amzMatches = amzHtml.matchAll(/<img[^>]*class=["']s-image["'][^>]*src=["']([^"']+)["']/gi);
            for (const match of amzMatches) {
              if (fallbackImages.length >= 3) break;
              const imgUrl = match[1];
              if (!fallbackImages.includes(imgUrl)) fallbackImages.push(imgUrl);
            }
          }
        } catch (e) {
          console.warn('Erro ao pescar imagens da Shopee:', e);
        }
      }

      return NextResponse.json({
        name: extractedTitle,
        image_url: fallbackImages[0] || null,
        images: fallbackImages,
        is_search_link: false,
        platform,
      });
    }

    // =========================================================================
    // CASO 2: MERCADO LIVRE (Googlebot User-Agent Bypass para obter HTML completo)
    // =========================================================================
    if (platform === 'mercadolivre' && !isSearchLink) {
      try {
        const response = await fetch(cleanedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9',
          },
          next: { revalidate: 3600 }
        });

        if (response.ok) {
          const html = await response.text();

          // Extrair og:image
          const imageRegex = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i;
          const imageMatch = html.match(imageRegex);
          let imageUrl = imageMatch ? imageMatch[1] : '';

          // Extrair og:title ou title
          const titleRegex = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i;
          const altTitleRegex = /<title>([^<]+)<\/title>/i;
          const titleMatch = html.match(titleRegex) || html.match(altTitleRegex);
          let title = titleMatch ? titleMatch[1] : '';

          // Sanitizar título
          title = title
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s*[-\|]\s*(Mercado Livre|Amazon|Shopee).*$/i, '')
            .trim();

          // Se a imagem veio em resolução baixa (-I.jpg), converte para alta (-O.webp)
          if (imageUrl) {
            imageUrl = imageUrl.replace(/-(?:I|E)\.(jpg|webp|png)/, '-O.$1');
          }

          if (title && imageUrl) {
            return NextResponse.json({
              name: title,
              image_url: imageUrl,
              is_search_link: false,
              platform,
            });
          }
        }
      } catch (err) {
        console.warn('Erro ao raspar Mercado Livre com Googlebot:', err);
      }
    }

    // =========================================================================
    // CASO 3: OUTROS E AMAZON (Scraper HTML Padrão)
    // =========================================================================
    const headers: Record<string, string> = platform === 'mercadolivre'
      ? {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        }
      : {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        };

    const response = await fetch(cleanedUrl, {
      headers,
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      // Tentar adivinhar o nome do produto a partir da URL se o request falhar (por exemplo, 403 Cloudflare/Akamai)
      let extractedTitle = 'Produto sem Nome';
      try {
        const pathPart = cleanedUrl.split('/').pop() || '';
        let titlePart = pathPart;
        if (titlePart.includes('.')) {
          titlePart = titlePart.split('.')[0];
        }
        if (titlePart.includes('-')) {
          extractedTitle = decodeURIComponent(titlePart)
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .trim();
          // Capitalizar palavras
          extractedTitle = extractedTitle
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      } catch(e){}

      // Buscar imagens de fallback na Amazon usando o título do produto extraído
      const fallbackImages: string[] = [];
      if (extractedTitle !== 'Produto sem Nome') {
        try {
          const amzSearchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(extractedTitle)}`;
          const amzRes = await fetch(amzSearchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'pt-BR,pt;q=0.9',
            },
            next: { revalidate: 3600 }
          });
          if (amzRes.ok) {
            const amzHtml = await amzRes.text();
            const amzMatches = amzHtml.matchAll(/<img[^>]*class=["']s-image["'][^>]*src=["']([^"']+)["']/gi);
            for (const match of amzMatches) {
              if (fallbackImages.length >= 3) break;
              const imgUrl = match[1];
              if (!fallbackImages.includes(imgUrl)) fallbackImages.push(imgUrl);
            }
          }
        } catch (e) {
          console.warn('Erro na busca de imagem fallback:', e);
        }
      }

      return NextResponse.json({
        name: extractedTitle,
        image_url: fallbackImages[0] || null,
        images: fallbackImages,
        is_search_link: isSearchLink,
        platform,
      });
    }

    const html = await response.text();
    let imageUrl = '';
    let title = '';

    // Se for link de busca, tentamos extrair a primeira imagem de produto do grid da busca
    if (isSearchLink) {
      if (platform === 'mercadolivre') {
        const mlSearchImg = html.match(/<img[^>]*class=["'](?:ui-search-result-image__element|poly-component__picture)[^"']*["'][^>]*src=["']([^"']+)["']/i) ||
                            html.match(/<img[^>]*src=["']([^"']+)["'][^>]*class=["'](?:ui-search-result-image__element|poly-component__picture)[^"']*["']/i) ||
                            html.match(/data-src=["']([^"']+)["']/i);
        if (mlSearchImg && mlSearchImg[1]) imageUrl = mlSearchImg[1];
      } else if (platform === 'amazon') {
        const amzSearchImg = html.match(/<img[^>]*class=["']s-image["'][^>]*src=["']([^"']+)["']/i) ||
                             html.match(/<img[^>]*src=["']([^"']+)["'][^>]*class=["']s-image["']/i);
        if (amzSearchImg && amzSearchImg[1]) imageUrl = amzSearchImg[1];
      }

      return NextResponse.json({
        name: 'Resultado de Busca',
        image_url: imageUrl || null,
        is_search_link: true,
        platform,
      });
    }

    // Extração do Título
    const titleRegex = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i;
    const altTitleRegex = /<title>([^<]+)<\/title>/i;
    const titleMatch = html.match(titleRegex);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1];
    } else {
      const altMatch = html.match(altTitleRegex);
      if (altMatch && altMatch[1]) {
        title = altMatch[1];
      }
    }
    title = title
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
    title = title.replace(/\s*[-\|]\s*(Mercado Livre|Amazon|Shopee).*$/i, '');

    // Extração da Imagem via Metatags
    const imageRegex = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i;
    const twitterImageRegex = /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i;
    const imageMatch = html.match(imageRegex);
    if (imageMatch && imageMatch[1]) {
      imageUrl = imageMatch[1];
    } else {
      const twitterMatch = html.match(twitterImageRegex);
      if (twitterMatch && twitterMatch[1]) {
        imageUrl = twitterMatch[1];
      }
    }

    // Extração de múltiplas imagens do HTML
    const imageUrls: string[] = [];

    // Se for Amazon, tenta pescar prioritariamente as imagens da galeria no bloco de scripts/JSON
    if (platform === 'amazon') {
      const amzRegexDynamic = /"large":"([^"]+)"/g;
      const dynamicMatches = html.matchAll(amzRegexDynamic);
      for (const m of dynamicMatches) {
        if (imageUrls.length >= 6) break;
        const imgUrl = m[1];
        if (!imageUrls.includes(imgUrl) && !/logo|brand|sprite|favicon|placeholder/i.test(imgUrl)) {
          imageUrls.push(imgUrl);
        }
      }
    }

    if (imageUrl && !imageUrls.includes(imageUrl) && !/logo|brand|sprite|favicon|placeholder/i.test(imageUrl)) {
      imageUrls.push(imageUrl);
    }

    // Buscar imagens adicionais no HTML
    const imgMatches = html.matchAll(/<img[^>]*src=["'](https:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi);
    for (const match of imgMatches) {
      if (imageUrls.length >= 6) break;
      const imgUrl = match[1];
      // Ignorar logos, favicons, trackers ou imagens muito pequenas ou repetidas
      if (
        !/logo|favicon|brand|placeholder|banner|sprite|pixel|analytics|loading|icon/i.test(imgUrl) &&
        !imageUrls.includes(imgUrl)
      ) {
        imageUrls.push(imgUrl);
      }
    }

    // Converter imagens Mercado Livre para alta resolução
    let finalImages = imageUrls.map(url => 
      platform === 'mercadolivre' ? url.replace(/-(?:I|E)\.(jpg|webp|png)/, '-O.$1') : url
    );

    // Se a requisição funcionou, mas não retornou nenhuma imagem (bloqueio parcial de CDN ou lazyload)
    if (finalImages.length === 0 && title) {
      try {
        const amzSearchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(title)}`;
        const amzRes = await fetch(amzSearchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9',
          },
          next: { revalidate: 3600 }
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
        console.warn('Erro ao obter imagem de fallback no scraper principal:', e);
      }
    }

    return NextResponse.json({
      name: title || 'Produto sem Nome',
      image_url: finalImages[0] || null,
      images: finalImages,
      is_search_link: false,
      platform,
    });
  } catch (error: any) {
    console.error('Scraper error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape metadata' },
      { status: 500 }
    );
  }
}

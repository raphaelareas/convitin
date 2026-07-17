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

    // Identificar a plataforma
    let platform: 'mercadolivre' | 'shopee' | 'amazon' | 'other' = 'other';
    if (/mercadolivre\.com/i.test(cleanedUrl) || /mercadolibre/i.test(cleanedUrl)) {
      platform = 'mercadolivre';
    } else if (/shopee\.com/i.test(cleanedUrl)) {
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
      const pathPart = cleanedUrl.split('/').pop() || '';
      // A URL da Shopee pode ser: /nome-do-produto-i.123.456 ou /product/123/456 ou /nome-do-produto (sem query/id)
      let titlePart = pathPart;
      if (pathPart.includes('-i.')) {
        titlePart = pathPart.split('-i.')[0];
      } else if (pathPart.includes('.')) {
        titlePart = pathPart.split('.')[0];
      }
      let extractedTitle = decodeURIComponent(titlePart).replace(/-/g, ' ').replace(/_/g, ' ').trim();
 
      // Sanitizar título se veio apenas IDs numéricos ou lixo
      if (!extractedTitle || /^\d+$/.test(extractedTitle) || extractedTitle.length < 3) {
        // Tenta pegar a penúltima parte da URL
        const parts = cleanedUrl.split('/');
        const penUlt = parts[parts.length - 2] || '';
        if (penUlt && !/^(product|item|shop|category|s|i|c)$/i.test(penUlt)) {
          extractedTitle = decodeURIComponent(penUlt).replace(/-/g, ' ').replace(/_/g, ' ').trim();
        } else {
          extractedTitle = 'Produto da Shopee';
        }
      }
 
      let imageUrl: string | null = null;

      if (extractedTitle !== 'Produto da Shopee') {
        // 1. Tenta buscar primeiro na Amazon (onde produtos de marca/bebê possuem alta correspondência e fotos de fundo branco)
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
            const amzMatch = amzHtml.match(/<img[^>]*class=["']s-image["'][^>]*src=["']([^"']+)["']/i) ||
                             amzHtml.match(/<img[^>]*src=["']([^"']+)["'][^>]*class=["']s-image["']/i);
            if (amzMatch && amzMatch[1]) {
              imageUrl = amzMatch[1];
            }
          }
        } catch (e) {
          console.warn('Erro ao pescar imagem da Shopee na Amazon:', e);
        }

        // 2. Se falhar na Amazon, faz o fallback no Mercado Livre
        if (!imageUrl) {
          try {
            const mlSearchUrl = `https://lista.mercadolivre.com.br/${encodeURIComponent(extractedTitle)}`;
            const searchRes = await fetch(mlSearchUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9',
              },
              next: { revalidate: 3600 }
            });
            if (searchRes.ok) {
              const searchHtml = await searchRes.text();
              const mlSearchImg = searchHtml.match(/<img[^>]*class=["'](?:ui-search-result-image__element|poly-component__picture)[^"']*["'][^>]*src=["']([^"']+)["']/i) ||
                                  searchHtml.match(/<img[^>]*src=["']([^"']+)["'][^>]*class=["'](?:ui-search-result-image__element|poly-component__picture)[^"']*["']/i) ||
                                  searchHtml.match(/data-src=["']([^"']+)["']/i);
              if (mlSearchImg && mlSearchImg[1]) {
                imageUrl = mlSearchImg[1].replace(/-(?:I|E)\.(jpg|webp|png)/, '-O.$1');
              }
            }
          } catch (e) {
            console.warn('Erro ao pescar imagem da Shopee no Mercado Livre:', e);
          }
        }
      }

      return NextResponse.json({
        name: extractedTitle,
        image_url: imageUrl,
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
      return NextResponse.json({
        name: isSearchLink ? 'Resultado de Busca' : 'Produto da ' + platform.charAt(0).toUpperCase() + platform.slice(1),
        image_url: null,
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

    // Fallback específico da Amazon no HTML
    const isGenericLogoCheck = 
      !imageUrl ||
      /logo|favicon|brand|placeholder/i.test(imageUrl) ||
      (platform === 'amazon' && /amazon-logo/i.test(imageUrl));

    if (isGenericLogoCheck && platform === 'amazon') {
      const amzRegex1 = /<img[^>]*id=["']landingImage["'][^>]*src=["']([^"']+)["']/i;
      const amzRegex2 = /<img[^>]*src=["']([^"']+)["'][^>]*id=["']landingImage["']/i;
      const amzRegex3 = /<img[^>]*class=["'][^"']*a-dynamic-image[^"']*["'][^>]*src=["']([^"']+)["']/i;
      const amzRegex4 = /data-a-dynamic-image=["']([^"']+)["']/i;

      const amzMatch = html.match(amzRegex1) || html.match(amzRegex2) || html.match(amzRegex3);
      if (amzMatch && amzMatch[1]) {
        imageUrl = amzMatch[1];
      } else {
        const match4 = html.match(amzRegex4);
        if (match4 && match4[1]) {
          try {
            const cleanJson = match4[1].replace(/&quot;/g, '"');
            const urls = Object.keys(JSON.parse(cleanJson));
            if (urls.length > 0) imageUrl = urls[0];
          } catch (e) {}
        }
      }
    }

    return NextResponse.json({
      name: title || 'Produto sem Nome',
      image_url: imageUrl || null,
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

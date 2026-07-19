process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const query = 'Tenis Infantil Converse All Star First Star Plaid Menina';
async function test() {
  const searchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      }
    });
    console.log('Amazon Search status:', res.status);
    const html = await res.text();
    const fs = require('fs');
    fs.writeFileSync('scratch/amazon-search.html', html);
    
    // Procura por matches de imagens de grid da Amazon
    const urls = [];
    const matches = html.matchAll(/<img[^>]*class=["']s-image["'][^>]*src=["']([^"']+)["']/gi);
    for (const m of matches) {
      if (!urls.includes(m[1])) urls.push(m[1]);
    }
    console.log('Found Amazon grid images:', urls.length);
    console.log('Samples:', urls.slice(0, 5));
  } catch (err) {
    console.error('Error:', err);
  }
}
test();

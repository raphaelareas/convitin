process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const query = 'camiseta vans new left chest masculina';
async function test() {
  const amzSearchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(amzSearchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      }
    });
    const html = await res.text();
    const matches = html.matchAll(/<img[^>]*class=["']s-image["'][^>]*src=["']([^"']+)["']/gi);
    const urls = [];
    for (const match of matches) {
      if (!urls.includes(match[1])) urls.push(match[1]);
    }
    console.log('Safari 17 status:', res.status);
    console.log('Safari 17 matches:', urls.length);
    console.log('Samples:', urls.slice(0, 5));
  } catch (err) {
    console.error(err);
  }
}
test();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const url = 'https://www.netshoes.com.br/p/tenis-infantil-converse-all-star-first-star-plaid-menina-047-4724-162';
async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'pt-BR,pt;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };
  try {
    const res = await fetch(url, { headers });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('HTML Length:', text.length);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const url = 'https://www.mercadolivre.com.br/gravador-laser-12w-acmer-s2-corte-madeira-ac';
async function test() {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    const html = await res.text();
    console.log('HTML preview (first 1000 chars):');
    console.log(html.substring(0, 1000));
  } catch(e) {
    console.error(e);
  }
}
test();

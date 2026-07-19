const fs = require('fs');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const url = 'https://www.netshoes.com.br/p/tenis-infantil-adidas-tensaur-sport-FBA-833Z-028';
async function test() {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'WhatsApp/2.24.4.8 A',
      }
    });
    const html = await res.text();
    fs.writeFileSync('scratch/netshoes-whatsapp.html', html);
    console.log('Saved to scratch/netshoes-whatsapp.html');
  } catch(e) {
    console.error(e);
  }
}
test();

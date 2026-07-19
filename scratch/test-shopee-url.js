const fs = require('fs');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const url = 'https://shopee.com.br/product/1461262933/22893672283';
async function test() {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
      }
    });
    const html = await res.text();
    fs.writeFileSync('scratch/shopee.html', html);
    console.log('Saved to scratch/shopee.html');
  } catch(e) {
    console.error(e);
  }
}
test();

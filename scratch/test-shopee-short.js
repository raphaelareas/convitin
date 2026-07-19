process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const url = 'https://shopee.com.br/product/1461262933/22893672283?d_id=09c67&uls_trackid=56600js000kj&utm_content=2vdyJjRtX2PRdajRYheh9XVv57Q3';
async function test() {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'WhatsApp/2.24.4.8 A',
      }
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('HTML Length:', text.length);
    
    // Test matches para og:title
    const titleRegex = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i;
    const titleMatch = text.match(titleRegex);
    console.log('WhatsApp og:title:', titleMatch ? titleMatch[1] : 'Not found');

    const imageRegex = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i;
    const imageMatch = text.match(imageRegex);
    console.log('WhatsApp og:image:', imageMatch ? imageMatch[1] : 'Not found');
  } catch (err) {
    console.error('Error:', err);
  }
}
test();

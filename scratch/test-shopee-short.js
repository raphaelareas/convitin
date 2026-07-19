process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const url = 'https://br.shp.ee/PR7GjzM6';
async function test() {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'WhatsApp/2.24.4.8 A',
      }
    });
    console.log('Status:', res.status);
    console.log('Final URL:', res.url);
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

const fs = require('fs');
try {
  const html = fs.readFileSync('scratch/bing.html', 'utf8');
  // Procura por qualquer URL contendo .jpg ou .png ou .webp nas tags img do Bing ou links soltos
  const urls = [];
  const matches = html.match(/https?:\/\/[^\s"'<>]+/g) || [];
  for (const url of matches) {
    if (url.includes('th/id/') && !urls.includes(url)) {
      urls.push(url);
    }
  }
  console.log('Found th/id URLs:', urls.length);
  console.log('Sample:', urls.slice(0, 10));
} catch(e) {
  console.error(e);
}

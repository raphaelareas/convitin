const fs = require('fs');
try {
  const html = fs.readFileSync('scratch/google.html', 'utf8');
  // Encontrar todas as tags img
  const imgs = html.match(/<img[^>]*>/gi) || [];
  console.log('Total img tags:', imgs.length);
  for (let i = 0; i < Math.min(imgs.length, 10); i++) {
    console.log(`Img ${i}:`, imgs[i]);
  }
} catch (e) {
  console.error(e);
}

const fs = require('fs');
try {
  const html = fs.readFileSync('scratch/shopee.html', 'utf8');
  console.log('HTML preview (last 2000 chars):');
  console.log(html.substring(html.length - 2000));
} catch(e) {
  console.error(e);
}

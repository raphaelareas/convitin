const fs = require('fs');
try {
  const html = fs.readFileSync('scratch/ml-404.html', 'utf8');
  console.log('HTML (last 2000 chars):');
  console.log(html.substring(html.length - 2000));
} catch(e) {
  console.error(e);
}

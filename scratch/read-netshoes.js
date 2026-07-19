const fs = require('fs');
try {
  const html = fs.readFileSync('scratch/netshoes-whatsapp.html', 'utf8');
  console.log('HTML previews:');
  console.log(html.substring(0, 1500));
} catch(e) {
  console.error(e);
}

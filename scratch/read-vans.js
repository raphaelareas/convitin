const fs = require('fs');
try {
  const html = fs.readFileSync('scratch/amz-vans.html', 'utf8');
  console.log(html);
} catch(e) {
  console.error(e);
}

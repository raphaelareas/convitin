const fs = require('fs');
try {
  const html = fs.readFileSync('scratch/ml-search.html', 'utf8');
  console.log('ML Search HTML size:', html.length);
  // Procurar por qualquer url contendo mlstatic.com
  const matches = html.match(/https?:\/\/[^\s"'<>]+/g) || [];
  console.log('Total URLs found in ML search page:', matches.length);
  const mlstatic = matches.filter(url => url.includes('mlstatic.com'));
  console.log('mlstatic.com URLs:', mlstatic.length);
  console.log('Samples:', mlstatic.slice(0, 10));
} catch(e) {
  console.error(e);
}

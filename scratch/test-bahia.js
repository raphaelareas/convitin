const url = 'https://www.casasbahia.com.br/console-playstation-5-edicao-digital-825gb-astro-bot-e-gran-turismo-7/p/1582493592';
async function test() {
  const parts = url.split('/');
  const pIndex = parts.indexOf('p');
  console.log('pIndex:', pIndex);
  if (pIndex !== -1 && pIndex > 0) {
    const titlePart = parts[pIndex - 1];
    console.log('titlePart:', titlePart);
    const cleaned = titlePart.replace(/-/g, ' ');
    console.log('Cleaned title:', cleaned);
  }
}
test();

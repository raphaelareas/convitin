const url = 'https://www.mercadolivre.com.br/gravador-laser-12w-acmer-s2-corte-madeira-ac';
// O link no print do usuário termina com ...-s2-corte-madeira-ac (sem o /p/MLB no final)
// Vamos verificar o link do print: https://www.mercadolivre.com.br/gravador-laser-12w-acmer-s2-corte-madeira-ac (sem o ID de produto)
// Esse link é do catálogo geral deles e ele dá 404 se acessado diretamente sem o ID no final ou se não vier de um redirect mobile
// Mas no browser do usuário ele acessou de alguma forma. 
// De qualquer forma, o Convitin precisa extrair o título a partir da URL se der 404 no fetch.
// Vamos ver o que nosso adivinhador de título gerou para essa URL:
const pathPart = url.split('/').pop() || '';
console.log('pathPart:', pathPart);
let titlePart = pathPart.split('.')[0];
console.log('titlePart:', titlePart);
const segments = titlePart.split('-');
const filteredSegments = segments.filter(seg => {
  if (/^[A-Z0-9]{3,}$/.test(seg) && /[0-9]/.test(seg) && /[A-Z]/.test(seg)) return false;
  if (/^[0-9]{2,}$/.test(seg)) return false;
  return true;
});
console.log('filtered:', filteredSegments.join(' '));

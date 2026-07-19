const url1 = 'https://www.mercadolivre.com.br/gravador-laser-12w-acmer-s2-corte-madeira-ac';
const url2 = 'https://www.mercadolivre.com.br/bolsa-canguru-ergonmico-beb-me-premium-12-posicoes-4-em-1-baby-bear-cor-cinza/p/MLB45462711?pdp_filters=item_id%3AMLB5285316198';

function test(url) {
  let isSearchLink = false;
  let cleanedUrl = url.split('?')[0].split('#')[0];
  console.log('Cleaned:', cleanedUrl);
}
test(url1);
test(url2);

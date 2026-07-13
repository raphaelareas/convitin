const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = 'https://wdzaigmtxazczzhaussm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkemFpZ210eGF6Y3p6aGF1c3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3MTMzMjgsImV4cCI6MjA5OTI4OTMyOH0.DPnlLbqAzh78nrGjtsbepOCuqwhq8UpVv0QxqssCUow';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const csvContent = `ID,Nome Produto,Link Mercado Livre,Link Shopee,Link Amazon,Selecionado,Reservado Por
2,Mordedor,https://lista.mercadolivre.com.br/mordedor-bebe,https://shopee.com.br/search?keyword=mordedor%20bebe,https://www.amazon.com.br/s?k=mordedor+bebe,,
3,Capa Bebe Conforto,https://lista.mercadolivre.com.br/capa-bebe-conforto,https://shopee.com.br/search?keyword=capa%20bebe%20conforto,https://www.amazon.com.br/s?k=capa+bebe+conforto,,
4,Protetor Carrinho de Bebe,https://lista.mercadolivre.com.br/protetor-carrinho-bebe,https://shopee.com.br/search?keyword=protetor%20carrinho%20bebe,https://www.amazon.com.br/s?k=protetor+carrinho+bebe,,
5,Mamadeira Kit Avent Phillips Petala Rosa,https://lista.mercadolivre.com.br/mamadeira-kit-avent-phillips-petala-rosa,https://shopee.com.br/search?keyword=mamadeira%20kit%20avent%20phillips%20petala%20rosa,https://www.amazon.com.br/s?k=mamadeira+kit+avent+phillips+petala+rosa,,
6,Chupeta Avent Phillips 0-6 meses,https://lista.mercadolivre.com.br/chupeta-avent-phillips-0-6-meses,https://shopee.com.br/search?keyword=chupeta%20avent%20phillips%200-6%20meses,https://www.amazon.com.br/s?k=chupeta+avent+phillips+0+6+meses,,
7,Chupeta Avent Phillips 0-6 meses,https://lista.mercadolivre.com.br/chupeta-avent-phillips-0-6-meses,https://shopee.com.br/search?keyword=chupeta%20avent%20phillips%200-6%20meses,https://www.amazon.com.br/s?k=chupeta+avent+phillips+0+6+meses,,
8,Tapete de atividades,https://lista.mercadolivre.com.br/tapete-atividades-bebe,https://shopee.com.br/search?keyword=tapete%20atividades%20bebe,https://www.amazon.com.br/s?k=tapete+atividades+bebe,,
9,Mobile para carrinho de bebe,https://lista.mercadolivre.com.br/mobile-carrinho-bebe,https://shopee.com.br/search?keyword=mobile%20carrinho%20bebe,https://www.amazon.com.br/s?k=mobile+carrinho+bebe,,
10,Berço moises,https://lista.mercadolivre.com.br/berco-moises,https://shopee.com.br/search?keyword=berco%20moises,https://www.amazon.com.br/s?k=berco+moises,,
11,"Kit berço tema (Flores, borboleta ou jardim)",https://lista.mercadolivre.com.br/kit-berco-flores,https://shopee.com.br/search?keyword=kit%20berco%20flores,https://www.amazon.com.br/s?k=kit+berco+flores,,
12,Pano de boca,https://lista.mercadolivre.com.br/pano-de-boca-bebe,https://shopee.com.br/search?keyword=pano%20de%20boca%20bebe,https://www.amazon.com.br/s?k=pano+de+boca+bebe,,
13,Cueiro,https://lista.mercadolivre.com.br/cueiro-bebe,https://shopee.com.br/search?keyword=cueiro%20bebe,https://www.amazon.com.br/s?k=cueiro+bebe,,
14,Toalha de banho para bebe,https://lista.mercadolivre.com.br/toalha-banho-bebe,https://shopee.com.br/search?keyword=toalha%20banho%20bebe,https://www.amazon.com.br/s?k=toalha+banho+bebe,,
15,Fralda de Ombro,https://lista.mercadolivre.com.br/fralda-ombro-bebe,https://shopee.com.br/search?keyword=fralda%20ombro%20bebe,https://www.amazon.com.br/s?k=fralda+ombro+bebe,,
16,Trocador para comoda rosa,https://lista.mercadolivre.com.br/trocador-comoda-rosa,https://shopee.com.br/search?keyword=trocador%20comoda%20rosa,https://www.amazon.com.br/s?k=trocador+comoda+rosa,,
17,"Jogo de lençol (Flor, borboleta ou jardim)",https://lista.mercadolivre.com.br/jogo-lencol-berco-menina,https://shopee.com.br/search?keyword=jogo%20lencol%20berco%20menina,https://www.amazon.com.br/s?k=jogo+lencol+berco+menina,,
18,Bomba eletrica tira leite,https://lista.mercadolivre.com.br/bomba-eletrica-tira-leite,https://shopee.com.br/search?keyword=bomba%20eletrica%20tira%20leite,https://www.amazon.com.br/s?k=bomba+eletrica+tira+leite,,
19,Bomba manual tira leite,https://lista.mercadolivre.com.br/bomba-manual-tira-leite,https://shopee.com.br/search?keyword=bomba%20manual%20tira%20leite,https://www.amazon.com.br/s?k=bomba+manual+tira+leite,,
20,"Roupinhas (Vestido, body, sapatinho, etc) 5x",https://lista.mercadolivre.com.br/roupa-bebe-menina,https://shopee.com.br/search?keyword=roupa%20bebe%20menina,https://www.amazon.com.br/s?k=roupa+bebe+menina,,
21,Ruido branco,https://lista.mercadolivre.com.br/aparelho-ruido-branco-bebe,https://shopee.com.br/search?keyword=aparelho%20ruido%20branco%20bebe,https://www.amazon.com.br/s?k=aparelho+ruido+branco+bebe,,
22,Esterilizador de mamadeira,https://lista.mercadolivre.com.br/esterilizador-mamadeira,https://shopee.com.br/search?keyword=esterilizador%20mamadeira,https://www.amazon.com.br/s?k=esterilizador+mamadeira,,
23,Babador plastico,https://lista.mercadolivre.com.br/babador-plastico-bebe,https://shopee.com.br/search?keyword=babador%20plastico%20bebe,https://www.amazon.com.br/s?k=babador+plastico+bebe,,
24,Aquecedor mamadeira eletrico,https://lista.mercadolivre.com.br/aquecedor-mamadeira-eletrico,https://shopee.com.br/search?keyword=aquecedor%20mamadeira%20eletrico,https://www.amazon.com.br/s?k=aquecedor+mamadeira+eletrico,,
25,Manta,https://lista.mercadolivre.com.br/manta-bebe,https://shopee.com.br/search?keyword=manta%20bebe,https://www.amazon.com.br/s?k=manta+bebe,,
26,Utensilios bordados ou personalizados,https://lista.mercadolivre.com.br/enxoval-bebe-personalizado,https://shopee.com.br/search?keyword=enxoval%20bebe%20personalizado,https://www.amazon.com.br/s?k=enxoval+bebe+personalizado,,
27,Lenco umedecido Huggies ou Pampers,https://lista.mercadolivre.com.br/lenco-umedecido-huggies,https://shopee.com.br/search?keyword=lenco%20umedecido%20huggies,https://www.amazon.com.br/s?k=lenco+umedecido+huggies,,
28,Pomada de Assadura Bepantol Baby,https://lista.mercadolivre.com.br/pomada-assadura-bepantol-baby,https://shopee.com.br/search?keyword=pomada%20assadura%20bepantol%20baby,https://www.amazon.com.br/s?k=pomada+assadura+bepantol+baby,,
29,Sabonete Liquido Para Recem Nascido,https://lista.mercadolivre.com.br/sabonete-liquido-recem-nascido,https://shopee.com.br/search?keyword=sabonete%20liquido%20recem%20nascido,https://www.amazon.com.br/s?k=sabonete+liquido+recem+nascido,,
30,"Sabonete Líquido para Bebê (Granado, Mustela, Johnson's, Natura Mamãe e Bebê)",https://lista.mercadolivre.com.br/sabonete-liquido-bebe,https://shopee.com.br/search?keyword=sabonete%20liquido%20bebe,https://www.amazon.com.br/s?k=sabonete+liquido+bebe,,
31,Colônia para bebê,https://lista.mercadolivre.com.br/colonia-bebe,https://shopee.com.br/search?keyword=colonia%20bebe,https://www.amazon.com.br/s?k=colonia+bebe,,`;

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    let line = lines[i];
    if (!line.trim()) continue;

    // Lidar com aspas duplas no CSV simples
    const cells = [];
    let insideQuote = false;
    let currentCell = '';
    
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());

    if (cells.length >= headers.length) {
      result.push({
        id: cells[0],
        name: cells[1],
        link_ml: cells[2] || null,
        link_shopee: cells[3] || null,
        link_amazon: cells[4] || null
      });
    }
  }
  return result;
}

async function run() {
  try {
    // 1. Achar a lista pelo slug
    const { data: listData, error: listError } = await supabase
      .from('lists')
      .select('id, user_id')
      .eq('slug', 'cha-de-bebe-da-chloe-hthp')
      .single();

    if (listError || !listData) {
      console.error('Lista não encontrada:', listError);
      return;
    }

    console.log('Lista Encontrada! ID:', listData.id);

    // 2. Parsear produtos
    const products = parseCSV(csvContent);
    console.log(`Carregando ${products.length} presentes...`);

    // 3. Cadastrar cada um no banco
    for (const prod of products) {
      const giftData = {
        list_id: listData.id,
        name: prod.name,
        link_ml: prod.link_ml || null,
        link_shopee: prod.link_shopee || null,
        link_amazon: prod.link_amazon || null,
        status: 'disponivel',
        is_search_link: true // Todos os links na planilha são links de busca facilitada
      };

      const { data, error } = await supabase
        .from('gifts')
        .insert([giftData]);

      if (error) {
        console.error(`Erro ao inserir ${prod.name}:`, error);
      } else {
        console.log(`Sucesso: ${prod.name}`);
      }
    }

    console.log('Importação concluída com sucesso!');
  } catch (err) {
    console.error(err);
  }
}

run();

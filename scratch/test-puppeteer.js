const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1920,1080',
      ]
    });
    const page = await browser.newPage();
    
    // Simula cookies de uma sessão ativa humana real
    await page.setCookie({
      name: 'akaas_Nova_VP',
      value: '1784426530~2',
      domain: '.casasbahia.com.br',
      path: '/'
    });

    await page.setExtraHTTPHeaders({
      'accept-language': 'pt-BR,pt;q=0.9',
      'cache-control': 'max-age=0',
      'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1'
    });

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

    // Sobrescrever navigator
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
      Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt'] });
    });

    const url = 'https://www.casasbahia.com.br/console-playstation-5-edicao-digital-825gb-astro-bot-e-gran-turismo-7/p/1582493592';
    
    page.on('response', response => {
      if (response.url() === url) {
        console.log('Status code with full evasion headers:', response.status());
      }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const content = await page.content();
    console.log('Final HTML length:', content.length);
    console.log('Title:', await page.title());
    await browser.close();
  } catch (e) {
    console.error('Error:', e);
    if (browser) await browser.close();
  }
}
run();

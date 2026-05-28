import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    ignoreHTTPSErrors: true,
    acceptInsecureCerts: true,
    args: ['--ignore-certificate-errors'] 
  });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('Navigating to https://localhost:5175...');
  try {
    await page.goto('https://localhost:5175', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('Done navigating.');
    const html = await page.content();
    console.log("HTML:", html.substring(0, 1000));
  } catch (err) {
    console.error('Failed to navigate:', err.message);
  }
  
  await browser.close();
})();

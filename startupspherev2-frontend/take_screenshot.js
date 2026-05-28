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
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
  });
  page.on('response', response => {
    if (!response.ok()) {
      console.log('BAD RESPONSE:', response.url(), response.status());
    }
  });

  console.log('Navigating to https://localhost:5175...');
  try {
    page.goto('https://localhost:5175').catch(e => {});
    await new Promise(r => setTimeout(r, 4000));
    
  } catch (err) {
    console.error('Failed to capture:', err.message);
  }
  
  await browser.close();
})();

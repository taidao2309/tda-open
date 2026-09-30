const { chromium } = require('playwright-core');
const fs = require('fs');

const viewports = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'mobile-small', width: 360, height: 740 }
];

(async () => {
  fs.mkdirSync('test-results', { recursive: true });
  const browser = await chromium.launch({ executablePath: '/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
  let failed = false;
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewportSize: viewport, reducedMotion: 'reduce' });
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
    await page.screenshot({ path: `test-results/${viewport.name}.png`, fullPage: true });
    const issues = await page.evaluate(() => {
      const problems = [];
      const w = document.documentElement.clientWidth;
      if (document.documentElement.scrollWidth > w + 1) problems.push(`page overflow ${document.documentElement.scrollWidth - w}px`);
      document.querySelectorAll('h1,h2,h3,p,a,span,b,button,input').forEach((el) => {
        if (el.closest('.ticker')) return;
        const r = el.getBoundingClientRect();
        if (r.width && (r.left < -2 || r.right > w + 2)) problems.push(`${el.tagName}.${el.className || '-'} outside viewport: ${Math.round(r.left)}..${Math.round(r.right)}`);
      });
      return [...new Set(problems)].slice(0, 30);
    });
    console.log(`${viewport.name} ${viewport.width}x${viewport.height}: ${issues.length ? issues.join(' | ') : 'OK'}`);
    failed ||= issues.length > 0;
    await page.close();
  }
  await browser.close();
  process.exitCode = failed ? 1 : 0;
})().catch(error => { console.error(error); process.exit(1); });

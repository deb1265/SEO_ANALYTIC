import { test, expect } from '@playwright/test';

test('no-key import audit, evidence, export and mobile layout', async ({ page }) => {
  const errors: string[]=[]; page.on('pageerror', e=>errors.push(e.message));
  await page.goto('/');
  await page.getByLabel('Page URL',{exact:true}).fill('https://example.com');
  await page.getByLabel('Import saved HTML').check();
  await page.getByLabel('Or paste page source').fill('<html lang="en"><head><title>Example page</title></head><body><h1>Welcome</h1><p>Useful information about energy upgrades for your home.</p></body></html>');
  await page.getByRole('button',{name:'Analyze page',exact:true}).click();
  await expect(page.getByRole('heading',{name:'HTML audit complete'})).toBeVisible();
  await page.getByRole('button',{name:'Technical',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Performance: not measured'})).toBeVisible();
  await page.getByRole('button',{name:'Evidence & Insights'}).click();
  await expect(page.getByRole('heading',{name:'Evidence for all 15 checks'})).toBeVisible();
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export JSON'}).click();
  expect((await download).suggestedFilename()).toMatch(/seo-report-example.com.*json/);
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('clears legacy stored credentials and keeps only model preference',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('seo_analyzer_settings',JSON.stringify({openRouterKey:'test-secret',vercelToken:'test-token',aiModel:'example/model'})));
  await page.goto('/');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('seo_analyzer_settings')||'{}'));
  expect(stored).toEqual({aiModel:'example/model'});
  await expect(page.getByRole('button',{name:'Set up optional AI'})).toBeVisible();
});

test('failed network fetch never creates a report', async({page})=>{
  await page.route('https://example.com/**',r=>r.abort());
  await page.goto('/');await page.getByLabel('Page URL',{exact:true}).fill('https://example.com/');
  await page.getByRole('button',{name:'Analyze page',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('No audit was generated');
  await expect(page.getByRole('heading',{name:'HTML audit complete'})).toHaveCount(0);
});

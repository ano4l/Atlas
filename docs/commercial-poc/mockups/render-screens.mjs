import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const dir=path.dirname(fileURLToPath(import.meta.url));
await fs.mkdir(path.join(dir,'screens'),{recursive:true});
const browser=await chromium.launch({headless:false});
try{
 for(const screen of ['app-map','app-search','app-route','app-guidance','dashboard-analytics','dashboard-advertising','app-overview']){
  const mobile=screen.startsWith('app-')&&screen!=='app-overview';
  const viewport=mobile?{width:390,height:844}:screen==='app-overview'?{width:1792,height:1110}:{width:1440,height:900};
  const context=await browser.newContext({viewport,deviceScaleFactor:mobile?3:2});
  const page=await context.newPage();
  await page.goto(`${pathToFileURL(path.join(dir,'index.html'))}?screen=${screen}`,{waitUntil:'load'});
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:path.join(dir,'screens',`${screen}.png`),fullPage:false});
  console.log(`${screen}: ${viewport.width*(mobile?3:2)} x ${viewport.height*(mobile?3:2)}`);
  await context.close();
 }
}finally{await browser.close()}

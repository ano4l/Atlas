import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {FileBlob,SpreadsheetFile} from '@oai/artifact-tool';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(await fs.readFile(path.join(root,'model-results.json'),'utf8'));
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(path.join(root,'Atlas-36-Month-Cashflow.xlsx')));
wb.recalculate();
for(const[n,range]of[['Assumptions','C102:K143'],['Revenue','C28:K58'],['Summary','C2:U40']]){
 const img=await wb.render({sheetName:n,range,scale:1.4,format:'png'});await fs.writeFile(path.join(root,'qa',`${n}-saved.png`),new Uint8Array(await img.arrayBuffer()));
}
const a=wb.worksheets.getItem('Assumptions'),s=wb.worksheets.getItem('Summary');
for(let i=0;i<3;i++){
 a.getRange('E4').values=[[i+1]];wb.recalculate();
 const actual=s.getRange('G14').values[0][0],expected=data.cases[i].years[2].revenue;
 if(typeof actual!=='number'||Math.abs(actual-expected)>.01)throw Error(`Saved case ${i+1} revenue ${actual} vs ${expected}`);
 const required=s.getRange('E29').values[0][0];if(required!==data.cases[i].fundingTarget)throw Error(`Saved funding mismatch ${i+1}`);
 console.log(`Saved case ${i+1}: year-3 revenue and funding target recalculate correctly.`);
}
a.getRange('E4').values=[[1]];a.getRange('AN117').values=[[0]];wb.recalculate();
if(wb.worksheets.getItem('Revenue').getRange('AN47').values[0][0]!==0)throw Error('Saved later-period driver failed');
console.log('Saved workbook later-period input change recalculates correctly. Verification copy not exported.');

import fs from 'node:fs/promises';
import path from 'node:path';
import{fileURLToPath}from'node:url';
import{Workbook,SpreadsheetFile,FileBlob}from'@oai/artifact-tool';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const qa=path.join(root,'qa');await fs.mkdir(qa,{recursive:true});
const wb=Workbook.create(),s=wb.worksheets.add('12-month plan');const money='"R "#,##0;("R "#,##0);"-"';
const cols=Array.from({length:12},(_,i)=>String.fromCharCode(69+i));
const categories=[
 ['Cloud, hosting and monitoring',Array(12).fill(1000)],
 ['Site mapping, calibration and travel',[0,2000,2000,2000,2000,2000,2000,2000,2000,2000,0,0]],
 ['Test devices and accessories',[8000,6000,0,0,0,0,0,0,0,0,0,0]],
 ['Targeted technical specialist support',[0,0,0,4000,4000,4000,4000,4000,4000,0,0,0]],
 ['Privacy, agreements and documentation',[3000,2000,1000,0,0,0,2000,0,0,0,2000,0]],
 ['User recruitment and launch materials',[0,0,0,0,0,0,0,2000,2000,2000,1000,1000]]
];
const val=(a,x)=>s.getRange(a).values=[[x]],form=(a,x)=>s.getRange(a).formulas=[[x]];
s.showGridLines=false;s.tabColor='#152B3C';s.getRange('A1:Q46').format.font.name='Arial';s.getRange('A1:Q46').format.font.size=10;s.getRange('A1:Q46').format.rowHeight=22;s.getRange('A1:Q46').format.verticalAlignment='center';
s.getRange('A:B').format.columnWidth=2;s.getRange('C:C').format.columnWidth=46;s.getRange('D:D').format.columnWidth=3;s.getRange('E:Q').format.columnWidth=15;s.getRange('E5:Q40').setNumberFormat(money);
val('C2','ATLAS | R100,000 fund application');s.getRange('C2').format.font.size=16;s.getRange('C2').format.font.bold=true;
val('C3','12-month founder-led development plan | application pending | no award or revenue secured');
val('C5','Funding allocation');s.getRange('C5:H5').format.fill='#EAF1F5';
for(const[r,t,f]of[[6,'Requested grant','=E12'],[7,'Planned direct cash expenditure','=SUM(Q22:Q27)'],[8,'Unspent contingency reserve','=E14'],[9,'Unallocated / (overallocated) amount','=E6-SUM(E7:E8)']]){val(`C${r}`,t);form(`E${r}`,f);}
val('G6','Source: user brief, 28 October 2026. Fund rules and release terms are not yet supplied.');
val('G7','Indicative gross cash allowances, including VAT where charged. Replace with quotations.');
val('G8','Reserve is retained cash, not an expense or committed purchase.');
val('G9','Expected allocation difference is zero. Founder time is an in-kind contribution, not funded payroll.');
for(const[r,l,x]of[[12,'Requested amount',100000],[13,'Assumed receipt month (1-12)',1],[14,'Contingency held unspent',14000],[15,'Opening cash committed to this plan',0],[16,'Assume award received? 1 yes / 0 no',1]]){val(`C${r}`,l);val(`E${r}`,x);s.getRange(`E${r}`).format.fill='#FFF2CC';s.getRange(`E${r}`).format.font.color='#185ABD';}
s.getRange('E13').setNumberFormat('0');s.getRange('E16').setNumberFormat('0');s.getRange('E13').dataValidation={rule:{type:'list',values:Array.from({length:12},(_,i)=>String(i+1))}};s.getRange('E16').dataValidation={rule:{type:'list',values:['0','1']}};
val('G12','No paid full-time salaries, national deployment or new building-wide sensor installation are included.');
val('G13','Month 1 is the agreed project start after award. Receipt in month 1 is an editable cash assumption.');
val('G14','No reserve draw is forecast. New spending must be allocated before it is incurred.');
val('G16','The default shows the funded planning case. Set to 0 to expose the gap if the application is unsuccessful.');
val('C18','Blue / amber cells are editable. Months are relative to award; no calendar start or disbursement terms are confirmed.');
s.getRange('E21:P21').values=[cols.map((_,i)=>`Month ${i+1}`)];val('C21','Planned use of funds');val('Q21','12-month total');s.getRange('C21:Q21').format.fill='#152B3C';s.getRange('C21:Q21').format.font.color='#FFFFFF';
categories.forEach(([label,values],i)=>{const r=22+i;val(`C${r}`,label);s.getRange(`E${r}:P${r}`).values=[values];s.getRange(`E${r}:P${r}`).format.fill='#FFF2CC';s.getRange(`E${r}:P${r}`).format.font.color='#185ABD';form(`Q${r}`,`=SUM(E${r}:P${r})`);});
for(const[r,label]of[[28,'Total planned expenditure'],[30,'Opening project cash'],[31,'Assumed grant receipt'],[32,'Direct cash expenditure'],[33,'Closing project cash'],[34,'Contingency retained'],[35,'Cash available above reserve'],[38,'Cash roll-forward difference']])val(`C${r}`,label);
for(let i=0;i<12;i++){const c=cols[i],prev=cols[i-1];form(`${c}28`,`=SUM(${c}22:${c}27)`);form(`${c}30`,i?`=${prev}33`:'=$E$15');form(`${c}31`,`=IF(AND(${i+1}=$E$13,$E$16=1),$E$12,0)`);form(`${c}32`,`=${c}28`);form(`${c}33`,`=SUM(${c}30:${c}31)-${c}32`);form(`${c}34`,'=$E$14');form(`${c}35`,`=${c}33-${c}34`);form(`${c}38`,`=${c}33-(${c}30+${c}31-${c}32)`);}
for(const r of[28,31,32])form(`Q${r}`,`=SUM(E${r}:P${r})`);for(const r of[33,34,35])form(`Q${r}`,`=P${r}`);
for(const r of[28,33,35]){s.getRange(`C${r}:Q${r}`).format.font.bold=true;s.getRange(`C${r}:Q${r}`).format.borders={top:{style:'thin',color:'#A5B3BD'}};}
s.getRange('E38:P38').setNumberFormat('0.00');s.getRange('E33:P35').conditionalFormats.add('cellIs',{operator:'lessThan',formula:0,format:{font:{color:'#B42318',bold:true},fill:'#FCE8E6'}});
val('C40','Checks and planning limits');form('E40','=E6-E7-E8');s.getRange('E40').setNumberFormat('0.00');
val('C42','This is a use-of-funds cash plan, not grant income recognition, an award confirmation or a commercial profitability forecast.');
val('C43','Existing founder work and code are assumed available in kind. Availability, fund eligibility and quotes must be confirmed.');
val('C44','The earlier 36-month expansion workbook is a separate exploratory model and does not define this R100,000 application.');
s.freezePanes.freezeRows(21);s.freezePanes.freezeColumns(4);wb.recalculate();
const total=categories.flatMap(x=>x[1]).reduce((a,b)=>a+b,0);if(total!==86000||s.getRange('P33').values[0][0]!==14000||s.getRange('E9').values[0][0]!==0)throw Error('Allocation reconciliation failed');
val('E16',0);wb.recalculate();if(s.getRange('P33').values[0][0]!==-86000)throw Error('No-award boundary failed');val('E16',1);val('E13',3);wb.recalculate();if(s.getRange('F33').values[0][0]!==-23000)throw Error('Delayed receipt boundary failed');val('E13',1);wb.recalculate();
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!',options:{useRegex:true,maxResults:20},maxChars:1000});console.log(errors.ndjson);
const file=path.join(root,'Atlas-12-Month-Fund-Plan.xlsx');await(await SpreadsheetFile.exportXlsx(wb)).save(file);await fs.rename(file+'.inspect.ndjson',path.join(qa,'fund-plan-export.ndjson')).catch(e=>{if(e.code!=='ENOENT')throw e;});
const copy=await SpreadsheetFile.importXlsx(await FileBlob.load(file));copy.recalculate();if(copy.worksheets.getItemAt(0).getRange('P33').values[0][0]!==14000)throw Error('Saved cash reconciliation failed');
for(const[range,name]of[['C2:M18','fund-summary'],['C21:K38','fund-months']]){const img=await wb.render({sheetName:'12-month plan',range,scale:1.4,format:'png'});await fs.writeFile(path.join(qa,name+'.png'),new Uint8Array(await img.arrayBuffer()));}
await fs.writeFile(path.join(root,'fund-plan-results.json'),JSON.stringify({requested:100000,directSpend:total,reserve:14000,status:'Application pending; planning case assumes award',categories:categories.map(([name,monthly])=>({name,monthly,total:monthly.reduce((a,b)=>a+b,0)})),monthly:cols.map((c,i)=>({month:i+1,receipt:s.getRange(`${c}31`).values[0][0],spend:s.getRange(`${c}32`).values[0][0],closingCash:s.getRange(`${c}33`).values[0][0]}))},null,2));
console.log('12-month grant plan exported, reopened, reconciled and rendered.');

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const qa=path.join(root,'qa'); await fs.mkdir(qa,{recursive:true});
const wb=Workbook.create();
const names=['Summary','Assumptions','Revenue','Costs','Cashflow','Review'];
const sh=Object.fromEntries(names.map(n=>[n,wb.worksheets.add(n)]));
const navy='#152B3C', blue='#185ABD', green='#22734B', pale='#EAF1F5', amber='#FFF2CC';
const num='#,##0;(#,##0);"-"'; const money='"R "#,##0;("R "#,##0);"-"'; const pct='0.0%;(0.0%);"-"';
function col(n){let x='';for(;n;n=Math.floor((n-1)/26))x=String.fromCharCode(65+(n-1)%26)+x;return x;}
const cols=Array.from({length:36},(_,i)=>col(i+5)); const last=cols.at(-1);
function v(s,a,x){sh[s].getRange(a).values=[[x]];}
function f(s,a,x){sh[s].getRange(a).formulas=[[x]];}
function row(s,r,values,formula=false){sh[s].getRange(`E${r}:${last}${r}`)[formula?'formulas':'values']=[values];}
function label(s,r,x){v(s,`C${r}`,x);}
function band(s,r,text,end=last){label(s,r,text);const g=sh[s].getRange(`C${r}:${end}${r}`);g.format.fill=pale;g.format.font.bold=true;g.format.rowHeight=25;}
function total(s,r){const g=sh[s].getRange(`C${r}:${last}${r}`);g.format.font.bold=true;g.format.borders={top:{style:'thin',color:'#A5B3BD'}};sh[s].getRange(`E${r}:${last}${r}`).setNumberFormat(money);}
for(const [n,s]of Object.entries(sh)){
 s.showGridLines=false;
 s.getRange(`A1:${last}${n==='Assumptions'?154:n==='Summary'?80:82}`).format.font.name='Arial';
 s.getRange(`A1:${last}${n==='Assumptions'?154:n==='Summary'?80:82}`).format.font.size=10;
 s.getRange(`A1:${last}${n==='Assumptions'?154:n==='Summary'?80:82}`).format.verticalAlignment='center';
 s.getRange('A:B').format.columnWidth=2.2; s.getRange('C:C').format.columnWidth=43;
 s.getRange('D:D').format.columnWidth=3; s.getRange(`E:${last}`).format.columnWidth=14;
 s.getRange(`E1:${last}154`).setNumberFormat(num);s.getRange(`E1:${last}154`).format.horizontalAlignment='right';
 s.getRange(`C1:${last}154`).format.rowHeight=20;
 v(n,'C2',n==='Summary'?'ATLAS | 36-month commercial forecast':`ATLAS | ${n}`);s.getRange('C2').format.font.size=16;s.getRange('C2').format.font.bold=true;
 if(n!=='Assumptions'){v(n,'C4','Case selected');f(n,'E4',"=CHOOSE('Assumptions'!$E$4,\"Base\",\"Downside\",\"Upside\")");s.getRange('E4').format.font.color=green;s.getRange('E4').format.horizontalAlignment='center';s.getRange('E4').format.borders={preset:'outside',style:'dotted',color:'#889CAA'};}
 if(!['Assumptions','Summary'].includes(n)){
  v(n,'C5','ZAR, nominal; forecast only; revenue and expenses exclude VAT');
  row(n,7,cols.map((c,i)=>`=EDATE('Assumptions'!$E$5,${i})`),true);s.getRange(`E7:${last}7`).setNumberFormat('mmm-yy');
  s.getRange(`C7:${last}7`).format.fill=navy;s.getRange(`C7:${last}7`).format.font.color='#FFFFFF';
  s.freezePanes.freezeRows(7);s.freezePanes.freezeColumns(4);
 }
}
sh.Summary.tabColor=navy;sh.Assumptions.tabColor='#7092A8';
const A='Assumptions';label(A,4,'Case selector: 1 Base / 2 Downside / 3 Upside');v(A,'E4',1);
sh[A].getRange('E4').dataValidation={rule:{type:'list',values:['1','2','3']}};
v(A,'C5','Forecast start (editable date)');v(A,'E5',new Date('2026-11-01T00:00:00Z'));sh[A].getRange('E5').setNumberFormat('mmm-yy');
v(A,'C6','Opening cash');v(A,'E6',0);v(A,'C7','Planned equity funding in month 1');v(A,'E7',8300000);
sh[A].getRange('E4:E7').format.fill=amber;sh[A].getRange('E4:E7').format.font.color=blue;
v(A,'G4','Blue = editable; green = cross-sheet link; black = calculation.');
v(A,'G5','All prices, volumes and costs are unvalidated planning inputs. No actual trading data.');
v(A,'G6','Change one case selector. One set of schedules recalculates; no parallel case builds.');
const inputs={
 pilotFee:[10,90000,'Paid 12-week pilot, invoiced at start; not a signed contract.'],
 pilotMonths:[11,3,'Recognised evenly over 3 forecast months.'],core:[12,18000,'Per billable venue-month; proposed price, no customer validation.'],
 upgrade:[13,12000,'Incremental analytics upgrade per attached venue-month.'],onboard:[14,60000,'One-time fee per venue on commercial go-live; pilot fee is not credited.'],
 deployCost:[15,35000,'External mapping, calibration and commissioning per new venue.'],pilotMapping:[16,35000,'Pilot field mapping/calibration, per pilot start.'],
 pilotCounter:[17,15000,'Temporary independent counter/reference provision per pilot.'],hostVenue:[18,4000,'Cloud and external support per billable venue-month.'],
 sessionCost:[19,.025,'Incremental event processing cost per commercial app session.'],share:[20,.30,'Venue share of delivered gross media spend; no share on subscriptions.'],
 adFees:[21,.015,'Media billing/servicing fee; no payment fee on subscription bank transfers.'],commission:[22,.03,'Ongoing channel/sales fee on core + analytics subscriptions.'],
 searchSessions:[23,.60,'Share of commercial app sessions that contain eligible searches.'],searchCount:[24,2,'Eligible searches per searching session.'],searchSlots:[25,1,'Maximum sponsored card per search.'],
 searchView:[26,.65,'Fraction of candidate search cards meeting visibility threshold.'],routeSessions:[27,.45,'Share of sessions containing an eligible route preview.'],routeCount:[28,1,'Eligible route previews per routing session.'],
 routeSlots:[29,1,'Maximum sponsor card per route preview; no in-guidance popups.'],routeView:[30,.60,'Fraction of candidate route cards meeting visibility threshold.'],invalid:[31,.02,'Deduplicated/invalid delivery excluded before billing.'],
 searchMix:[32,.65,'Merchant media budgets allocated to search; remaining share to routes.'],priceGrowth:[33,.03,'Annual core and upgrade price increase after each 12 model months.'],
 costGrowth:[34,.05,'Annual salary and fixed overhead inflation.'],burden:[35,.15,'Planning employer/benefit load, not a statutory payroll calculation.'],founder:[36,35000,'One full-time founder monthly salary.'],
 engineerPay:[37,45000,'Monthly salary per engineering FTE.'],design:[38,20000,'Monthly fractional design/product salary allowance.'],sales:[39,30000,'Sales salary; starts model month 4.'],ops:[40,25000,'Venue operations salary; starts month 4.'],
 analyst:[41,35000,'Analyst salary; starts month 13.'],support:[42,25000,'Support salary; starts month 25.'],cloud:[43,8000,'Fixed platform/observability/security tools per month.'],
 admin:[44,12000,'Accounting, insurance and administration per month.'],marketing:[45,12000,'Monthly launch acquisition spend; 1.5x in year 2; 2x in year 3.'],legalSetup:[46,40000,'One-time month 1 privacy, contracting and setup allowance.'],
 legalMonthly:[47,2000,'Ongoing legal/compliance support per month.'],initialCapex:[48,60000,'Initial devices and test equipment in month 1.'],venueCapex:[49,8000,'Atlas-owned equipment per new commercial venue.'],
 vatRate:[50,.15,'SARS standard VAT rate; see source URL below.'],vatEnabled:[51,1,'1 assumes voluntary registration from start; 0 removes VAT schedule. Eligibility unconfirmed.'],
 inputVatShare:[52,.80,'Share of nonpayroll operating costs eligible for VAT deduction; validate invoices.'],taxReserve:[53,.27,'Conservative monthly cash tax allowance on positive EBITDA; ignores losses and D&A.'],
 buffer:[54,300000,'Minimum liquidity target for funding recommendation.'],contingency:[55,.15,'Contingency applied to peak cumulative cash deficit.'],winRate:[56,.25,'Qualified opportunity-to-go-live rate; implied pipeline only.'],
 halfBilling:[57,.5,'New venues start halfway through go-live month. Existing venues bill after expected churn.'],
 salesStart:[58,4,'Sales/venue operations hiring month.'],analystStart:[59,13,'Analyst hiring month.'],supportStart:[60,25,'Support hiring month.']
};
const ar=Object.fromEntries(Object.entries(inputs).map(([k,x])=>[k,x[0]]));
for(const [k,[r,value,note]]of Object.entries(inputs)){const name=k.replace(/([A-Z])/g,' $1');label(A,r,name[0].toUpperCase()+name.slice(1));v(A,`E${r}`,value);v(A,`G${r}`,note);sh[A].getRange(`E${r}`).format.font.color=blue;sh[A].getRange(`E${r}`).format.fill=amber;}
const friendly={pilotFee:'Pilot contract fee',pilotMonths:'Pilot recognition months',core:'Core platform / venue / month',upgrade:'Analytics upgrade / venue / month',onboard:'Commercial onboarding fee',deployCost:'Deployment contractor cost',hostVenue:'Cloud and support / venue / month',share:'Venue media revenue share',taxReserve:'Cash tax planning rate',halfBilling:'Go-live month billing fraction'};
for(const[k,t]of Object.entries(friendly))label(A,ar[k],t);
for(const k of ['share','adFees','commission','searchSessions','searchView','routeSessions','routeView','invalid','searchMix','priceGrowth','costGrowth','burden','vatRate','inputVatShare','taxReserve','contingency','winRate','halfBilling'])sh[A].getRange(`E${ar[k]}`).setNumberFormat(pct);
sh[A].getRange('E19').setNumberFormat('0.000');
const scalarGroups={churn:[64,[.005,.01,.003],'Monthly venue churn',pct],fill:[69,[.60,.40,.75],'Eligible inventory sell-through',pct],searchCpm:[74,[180,140,220],'Search price / 1,000 valid impressions',money],routeCpm:[79,[140,110,180],'Route price / 1,000 valid impressions',money],lag:[84,[1,2,1],'Collections lag (whole months)',num],collect:[89,[.98,.95,.99],'Invoice collection rate',pct]};
for(const[k,[r,vals,title,fmt]]of Object.entries(scalarGroups)){
 ar[k]=r;label(A,r,`${title} | active`);f(A,`E${r}`,`=IF(CHOOSE($E$4,ISBLANK(E${r+1}),ISBLANK(E${r+2}),ISBLANK(E${r+3})),NA(),CHOOSE($E$4,E${r+1},E${r+2},E${r+3}))`);sh[A].getRange(`C${r}:E${r}`).format.fill=pale;sh[A].getRange(`C${r}:E${r}`).format.font.bold=true;
 ['Base','Downside','Upside'].forEach((t,i)=>{label(A,r+i+1,`  ${t}`);v(A,`E${r+i+1}`,vals[i]);sh[A].getRange(`E${r+i+1}`).format.font.color=blue;sh[A].getRange(`E${r+i+1}`).format.fill=amber;});sh[A].getRange(`E${r}:E${r+3}`).setNumberFormat(fmt);
}
sh[A].getRange('E85:E87').dataValidation={rule:{type:'list',values:['0','1','2','3']}};
band(A,96,'Sources and scope','L');
v(A,'C97','VAT rate');v(A,'G97','https://www.sars.gov.za/types-of-tax/value-added-tax/');
v(A,'C98','Corporate standard rate');v(A,'G98','https://www.sars.gov.za/tax-rates/income-tax/companies-trusts-and-small-business-corporations-sbc/');
v(A,'C99','Financial scope');v(A,'G99','No debt, dividends, grants or terminal value. Development expensed; capex separate. No existing cash assumed.');
v(A,'C100','Tax timing');v(A,'G100','VAT invoice basis; two-month periods settled following month. Credits carried, no cash refunds. Tax allowance is not a return.');
row(A,102,cols.map((c,i)=>`=EDATE($E$5,${i})`),true);sh[A].getRange(`E102:${last}102`).setNumberFormat('mmm-yy');
sh[A].getRange(`C102:${last}102`).format.fill=navy;sh[A].getRange(`C102:${last}102`).format.font.color='#FFFFFF';
const newPlans=[
 [0,0,0,1,0,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,...Array(12).fill(1)],
 [0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1,0,0,1,0,0,1,0,1,0,0,1,0,1,0,1,0,1,0],
 [0,0,0,1,0,1,1,1,1,1,1,1,...Array(12).fill(1),...Array(12).fill(2)]
];
const stage=(i,a)=>a[Math.floor(i/12)];
const monthlyGroups={
 newVenues:[104,'New commercial venues going live',newPlans,num],
 pilots:[110,'New paid pilot starts',[...Array(3)].map(()=>Array.from({length:36},(_,i)=>i===0?1:0)),num],
 sessions:[116,'App sessions / billable venue-month',[ [8000,20000,40000],[4000,10000,20000],[15000,40000,75000] ].map(a=>cols.map((_,i)=>stage(i,a))),num],
 merchants:[122,'Active advertisers / venue',[ [8,15,25],[4,8,12],[12,25,40] ].map((a,j)=>cols.map((_,i)=>i<(j===1?7:4)?0:stage(i,a))),num],
 budget:[128,'Monthly budget ceiling / advertiser',[ [1000,1250,1500],[750,1000,1250],[1250,1500,2000] ].map(a=>cols.map((_,i)=>stage(i,a))),money],
 attach:[134,'Analytics upgrade adoption',[ [.30,.50,.65],[.15,.30,.45],[.40,.65,.80] ].map(a=>cols.map((_,i)=>stage(i,a))),pct],
 engineers:[140,'Engineering FTE',[ [2,3,3],[2,2,2],[2,3,4] ].map(a=>cols.map((_,i)=>stage(i,a))),'0.0']
};
for(const[k,[r,title,vals,fmt]]of Object.entries(monthlyGroups)){
 ar[k]=r;label(A,r,`${title} | active`);row(A,r,cols.map(c=>`=IF(CHOOSE($E$4,ISBLANK(${c}${r+1}),ISBLANK(${c}${r+2}),ISBLANK(${c}${r+3})),NA(),CHOOSE($E$4,${c}${r+1},${c}${r+2},${c}${r+3}))`),true);
 sh[A].getRange(`C${r}:${last}${r}`).format.fill=pale;sh[A].getRange(`C${r}:${last}${r}`).format.font.bold=true;
 ['Base','Downside','Upside'].forEach((t,i)=>{label(A,r+i+1,`  ${t}`);row(A,r+i+1,vals[i]);sh[A].getRange(`E${r+i+1}:${last}${r+i+1}`).format.font.color=blue;sh[A].getRange(`E${r+i+1}:${last}${r+i+1}`).format.fill=amber;});sh[A].getRange(`E${r}:${last}${r+3}`).setNumberFormat(fmt);
}
sh[A].freezePanes.freezeRows(7);sh[A].freezePanes.freezeColumns(4);
const a=k=>`'Assumptions'!$E$${ar[k]}`; const am=(k,c)=>`'Assumptions'!${c}${ar[k]}`;
const R='Revenue';const rlabels={8:'Forecast month',10:'Opening expected active venues',11:'New commercial venues',12:'Expected venues lost',13:'Closing expected active venues',14:'Billable venue-month equivalents',15:'Qualified opportunities needed (implied)',17:'App sessions / billable venue-month',18:'Commercial app sessions',20:'Paid pilot starts',21:'Pilot revenue recognised',22:'Core price / venue / month',23:'Core subscription revenue',24:'Analytics upgrade adoption',25:'Analytics upgrade price / month',26:'Analytics subscription revenue',27:'Onboarding revenue',29:'Active advertisers / venue',30:'Budget ceiling / advertiser / month',31:'Merchant media budget ceiling',32:'Search budget allocation',33:'Route budget allocation',35:'Candidate search impressions',36:'Valid, viewable search inventory',37:'Sellable search impressions',38:'Delivered search media revenue',39:'Billed search impressions',41:'Candidate route impressions',42:'Valid, viewable route inventory',43:'Sellable route impressions',44:'Delivered route media revenue',45:'Billed route impressions',47:'Gross delivered advertising revenue',48:'Unspent budget (no revenue)',49:'Total recognised revenue',50:'Total invoices excluding VAT',51:'Recurring revenue including gross media',52:'Exit subscription MRR (no advertising)',53:'Media budget delivery ratio',54:'Advertising / recognised revenue'};
for(const[r,l]of Object.entries(rlabels))label(R,r,l);band(R,9,'Venues and usage');band(R,19,'Subscriptions and pilot');band(R,28,'Retailer demand');band(R,34,'Search advertising');band(R,40,'Route advertising');band(R,46,'Revenue and billing');
for(let i=0;i<36;i++){const c=cols[i],p=cols[i-1],m=i+1;
 const forms={8:`=${m}`,10:i?`=${p}13`:'=0',11:`=${am('newVenues',c)}`,12:`=${c}10*${a('churn')}`,13:`=SUM(${c}10:${c}11)-${c}12`,14:`=${c}10-${c}12+${c}11*${a('halfBilling')}`,15:`=${c}11/${a('winRate')}`,17:`=${am('sessions',c)}`,18:`=${c}14*${c}17`,20:`=${am('pilots',c)}`,21:`=SUM(${cols[Math.max(0,i-2)]}20:${c}20)*${a('pilotFee')}/${a('pilotMonths')}`,22:`=${a('core')}*(1+${a('priceGrowth')})^INT((${c}8-1)/12)`,23:`=${c}14*${c}22`,24:`=${am('attach',c)}`,25:`=${a('upgrade')}*(1+${a('priceGrowth')})^INT((${c}8-1)/12)`,26:`=PRODUCT(${c}14,${c}24,${c}25)`,27:`=${c}11*${a('onboard')}`,29:`=${am('merchants',c)}`,30:`=${am('budget',c)}`,31:`=PRODUCT(${c}14,${c}29,${c}30)`,32:`=${c}31*${a('searchMix')}`,33:`=${c}31-${c}32`,35:`=PRODUCT(${c}18,${a('searchSessions')},${a('searchCount')},${a('searchSlots')})`,36:`=PRODUCT(${c}35,${a('searchView')},1-${a('invalid')})`,37:`=${c}36*${a('fill')}`,38:`=MIN(${c}32,${c}37*${a('searchCpm')}/1000)`,39:`=${c}38/${a('searchCpm')}*1000`,41:`=PRODUCT(${c}18,${a('routeSessions')},${a('routeCount')},${a('routeSlots')})`,42:`=PRODUCT(${c}41,${a('routeView')},1-${a('invalid')})`,43:`=${c}42*${a('fill')}`,44:`=MIN(${c}33,${c}43*${a('routeCpm')}/1000)`,45:`=${c}44/${a('routeCpm')}*1000`,47:`=SUM(${c}38,${c}44)`,48:`=MAX(0,${c}31-${c}47)`,49:`=SUM(${c}21,${c}23,${c}26,${c}27,${c}47)`,50:`=SUM(${c}20*${a('pilotFee')},${c}23,${c}26,${c}27,${c}47)`,51:`=SUM(${c}23,${c}26,${c}47)`,52:`=${c}13*SUM(${c}22,${c}24*${c}25)`,53:`=IF(${c}31=0,0,${c}47/${c}31)`,54:`=IF(${c}49=0,0,${c}47/${c}49)`};
 for(const[r,x]of Object.entries(forms))f(R,`${c}${r}`,x);
}
row(R,21,cols.map(c=>`=SUMIFS($E$20:$${last}$20,$E$8:$${last}$8,">="&(${c}8-${a('pilotMonths')}+1),$E$8:$${last}$8,"<="&${c}8)*${a('pilotFee')}/${a('pilotMonths')}`),true);
for(const r of[12,13,14,15])sh[R].getRange(`E${r}:${last}${r}`).setNumberFormat('0.0');
for(const r of[24,53,54]){sh[R].getRange(`E${r}:${last}${r}`).setNumberFormat(pct);sh[R].getRange(`C${r}:${last}${r}`).format.font.italic=true;}
for(const r of[23,26,27,38,44,47,49,50,51,52])total(R,r);
v(R,'C57','Route cards promote nearby stores; route geometry remains unchanged in proposed pilot.');v(R,'C58','Media spend = lower of allocated budget and sellable viewable impressions x CPM. Unspent budgets are not billed.');
const C='Costs';const clabels={8:'Forecast month',10:'Venue cloud and external support',11:'Session processing',12:'Venue advertising share',13:'Advertising servicing fees',14:'Commercial deployment contractors',15:'Pilot mapping and independent counters',16:'Subscription channel fees',17:'Total direct service costs',18:'Gross profit',20:'Founder salary',21:'Engineering FTE',22:'Engineering salaries',23:'Design / product allowance',24:'Sales salary',25:'Venue operations salary',26:'Analyst salary',27:'Support salary',28:'Employer / benefits load',29:'Total personnel cost',31:'Fixed cloud and platform tools',32:'Marketing and acquisition',33:'Administration and insurance',34:'Legal and compliance',35:'Total nonpayroll overhead',36:'Invoice bad-debt allowance',37:'EBITDA',38:'Recurring direct service costs',39:'Recurring EBITDA (no setup/pilot)',41:'Initial equipment capex',42:'New venue equipment capex',43:'Total capital expenditure',44:'Operating cash costs (no bad debt)',45:'VAT-eligible operating cost base',46:'Gross margin'};
for(const[r,l]of Object.entries(clabels))label(C,r,l);band(C,9,'Cost to serve');band(C,19,'Team');band(C,30,'Overheads and earnings');band(C,40,'Capital and cash costs');
for(let i=0;i<36;i++){const c=cols[i];const rv=r=>`'Revenue'!${c}${r}`;const infl=`(1+${a('costGrowth')})^INT((${c}8-1)/12)`;
 const forms={8:`=${i+1}`,10:`=${rv(14)}*${a('hostVenue')}`,11:`=${rv(18)}*${a('sessionCost')}`,12:`=${rv(47)}*${a('share')}`,13:`=${rv(47)}*${a('adFees')}`,14:`=${rv(11)}*${a('deployCost')}`,15:`=${rv(20)}*SUM(${a('pilotMapping')},${a('pilotCounter')})`,16:`=SUM(${rv(23)},${rv(26)})*${a('commission')}`,17:`=SUM(${c}10:${c}16)`,18:`=${rv(49)}-${c}17`,20:`=${a('founder')}*${infl}`,21:`=${am('engineers',c)}`,22:`=${c}21*${a('engineerPay')}*${infl}`,23:`=${a('design')}*${infl}`,24:`=IF(${c}8>=${a('salesStart')},${a('sales')}*${infl},0)`,25:`=IF(${c}8>=${a('salesStart')},${a('ops')}*${infl},0)`,26:`=IF(${c}8>=${a('analystStart')},${a('analyst')}*${infl},0)`,27:`=IF(${c}8>=${a('supportStart')},${a('support')}*${infl},0)`,28:`=SUM(${c}20,${c}22:${c}27)*${a('burden')}`,29:`=SUM(${c}20,${c}22:${c}28)`,31:`=${a('cloud')}*${infl}`,32:`=${a('marketing')}*CHOOSE(INT((${c}8-1)/12)+1,1,1.5,2)*${infl}`,33:`=${a('admin')}*${infl}`,34:`=${a('legalMonthly')}*${infl}+IF(${c}8=1,${a('legalSetup')},0)`,35:`=SUM(${c}31:${c}34)`,36:`=${rv(50)}*(1-${a('collect')})`,37:`=${c}18-SUM(${c}29,${c}35:${c}36)`,38:`=SUM(${c}10:${c}13,${c}16)`,39:`=${rv(51)}-SUM(${c}38,${c}29,${c}35)-${rv(51)}*(1-${a('collect')})`,41:`=IF(${c}8=1,${a('initialCapex')},0)`,42:`=${rv(11)}*${a('venueCapex')}`,43:`=SUM(${c}41:${c}42)`,44:`=SUM(${c}17,${c}29,${c}35)`,45:`=SUM(${c}17,${c}35)*${a('inputVatShare')}`,46:`=IF(${rv(49)}=0,0,${c}18/${rv(49)})`};
 for(const[r,x]of Object.entries(forms))f(C,`${c}${r}`,x);
}
for(const r of[17,18,29,35,37,39,43,44])total(C,r);sh[C].getRange(`E21:${last}21`).setNumberFormat('0.0');sh[C].getRange(`E46:${last}46`).setNumberFormat(pct);
v(C,'C49','Development salaries are expensed. EBITDA excludes depreciation; cash capex is deducted separately.');
const F='Cashflow';const flabels={8:'Forecast month',10:'Recognised revenue excluding VAT',11:'Invoiced revenue excluding VAT',12:'Uncollectible invoice allowance',13:'Collectible invoices excluding VAT',14:'Customer collections excluding VAT',15:'Opening net accounts receivable',16:'Closing net accounts receivable',18:'Opening deferred pilot revenue',19:'Closing deferred pilot revenue',21:'Output VAT on invoices',22:'Input VAT on eligible cash costs',23:'VAT received with collections',24:'VAT paid with supplier costs',25:'Opening net VAT liability / (credit)',26:'VAT remittance (no refund assumed)',27:'Closing net VAT liability / (credit)',29:'Operating cash before capex and taxes',30:'Capital expenditure excluding VAT',31:'Cash tax planning allowance',32:'Net cash before financing incl. VAT',34:'Opening cash before new funding',35:'Closing cash before new funding',36:'Planned equity injection',37:'Opening cash including funding',38:'Closing cash including funding',39:'Shortfall to minimum liquidity',42:'Recurring EBITDA',43:'Three-month recurring EBITDA positive',44:'Three-month net cash positive'};
for(const[r,l]of Object.entries(flabels))label(F,r,l);band(F,9,'Revenue to collections');band(F,17,'Pilot invoice / recognition bridge');band(F,20,'VAT cash timing');band(F,28,'Cash generation and investment');band(F,33,'Funding and liquidity');band(F,41,'Break-even tests');
for(let i=0;i<36;i++){const c=cols[i],p=cols[i-1];const rv=r=>`'Revenue'!${c}${r}`;const cs=r=>`'Costs'!${c}${r}`;
 const forms={8:`=${i+1}`,10:`=${rv(49)}`,11:`=${rv(50)}`,12:`=${rv(50)}*(1-${a('collect')})`,13:`=${c}11-${c}12`,14:`=IF(${c}8>${a('lag')},INDEX($E$13:$${last}$13,1,MAX(1,${c}8-${a('lag')})),0)`,15:i?`=${p}16`:'=0',16:`=SUM(${c}15,${c}13)-${c}14`,18:i?`=${p}19`:'=0',19:`=SUM(${c}18,${rv(20)}*${a('pilotFee')})-${rv(21)}`,21:`=${c}11*${a('vatRate')}*${a('vatEnabled')}`,22:`=SUM(${cs(45)},${cs(43)})*${a('vatRate')}*${a('vatEnabled')}`,23:`=${c}14*${a('vatRate')}*${a('vatEnabled')}`,24:`=${c}22`,25:i?`=${p}27`:'=0',26:`=IF(AND(${c}8>=3,MOD(${c}8,2)=1),MAX(0,${c}25),0)`,27:`=SUM(${c}25,${c}21)-SUM(${c}22,${c}26)`,29:`=${c}14-${cs(44)}`,30:`=${cs(43)}`,31:`=MAX(0,${cs(37)})*${a('taxReserve')}`,32:`=SUM(${c}29,${c}23)-SUM(${c}30:${c}31,${c}24,${c}26)`,34:i?`=${p}35`:"='Assumptions'!$E$6",35:`=SUM(${c}34,${c}32)`,36:i?'=0':"='Assumptions'!$E$7",37:i?`=${p}38`:"='Assumptions'!$E$6",38:`=SUM(${c}37,${c}32,${c}36)`,39:`=MAX(0,${a('buffer')}-${c}38)`,42:`=${cs(39)}`,43:i>=2?`=IF(MIN(${cols[i-2]}42:${c}42)>=0,1,0)`:'=0',44:i>=2?`=IF(MIN(${cols[i-2]}32:${c}32)>=0,1,0)`:'=0'};
 for(const[r,x]of Object.entries(forms))f(F,`${c}${r}`,x);
}
for(const r of[14,16,19,27,29,32,35,38,39])total(F,r);
for(const r of[35,38])sh[F].getRange(`E${r}:${last}${r}`).conditionalFormats.add('cellIs',{operator:'lessThan',formula:0,format:{fill:'#FCE8E6',font:{color:'#B42318',bold:true}}});
v(F,'C47','Negative cash indicates financing required. No automatic debt or funding plug is inserted.');v(F,'C48','Monthly tax allowance uses positive EBITDA with no loss relief. Actual provisional tax timing and depreciation require accountant review.');v(F,'C49','VAT credits carry forward; no refunds assumed. Registration at start is a planning switch, not confirmed eligibility.');
// Finance color conventions: formulas on working schedules are green only where cross-sheet references occur.
for(const n of['Revenue','Costs','Cashflow'])for(let r=8;r<=54;r++)if((n==='Revenue'?rlabels:n==='Costs'?clabels:flabels)[r]){
 const forms=sh[n].getRange(`E${r}:${last}${r}`).formulas[0]; forms.forEach((x,i)=>{if(x)sh[n].getRange(`${cols[i]}${r}`).format.font.color=x.includes('!')?green:'#111111';});
}
const S='Summary';v(S,'C5','Nov 2026 - Oct 2029 | ZAR | illustrative forecast; no signed customers or audited actuals');
v(S,'C7','Model years (12 months from forecast start)');
['Year 1','Year 2','Year 3'].forEach((x,i)=>v(S,`${col(i+5)}8`,x));
const metrics={9:['Core platform subscriptions','Revenue',23,'sum'],10:['Analytics upgrades','Revenue',26,'sum'],11:['Search advertising (gross)','Revenue',38,'sum'],12:['Route advertising (gross)','Revenue',44,'sum'],13:['Pilot and onboarding','Revenue',[21,27],'sum'],14:['Total recognised revenue','Revenue',49,'sum'],16:['Venue media share paid','Costs',12,'sum'],17:['Direct service costs (incl. media share)','Costs',17,'sum'],18:['Gross profit','Costs',18,'sum'],19:['Personnel + nonpayroll overhead','Costs',[29,35],'sum'],20:['Bad-debt allowance','Costs',36,'sum'],21:['EBITDA','Costs',37,'sum'],23:['Net cash before financing incl. VAT','Cashflow',32,'sum'],24:['Closing cash after planned funding','Cashflow',38,'end'],25:['Closing expected active venues','Revenue',13,'end'],26:['Exit subscription MRR (no media)','Revenue',52,'end']};
for(const[r,[title,s,rs,agg]]of Object.entries(metrics)){label(S,r,title);for(let y=0;y<3;y++){const start=cols[y*12],end=cols[y*12+11];const terms=(Array.isArray(rs)?rs:[rs]).map(rr=>agg==='end'?`'${s}'!${end}${rr}`:`SUM('${s}'!${start}${rr}:${end}${rr})`);f(S,`${col(y+5)}${r}`,`=${terms.join('+')}`);}}
sh[S].getRange('C8:G8').format.fill=navy;sh[S].getRange('C8:G8').format.font.color='#FFFFFF';sh[S].getRange('E9:G26').setNumberFormat(money);sh[S].getRange('E25:G25').setNumberFormat('0.0');
for(const r of[14,18,21,23,24,26]){sh[S].getRange(`C${r}:G${r}`).format.font.bold=true;sh[S].getRange(`C${r}:G${r}`).format.borders={top:{style:'thin',color:'#A5B3BD'}};}
label(S,28,'Peak cash deficit before new funding');f(S,'E28',`=MAX(0,-MIN('Cashflow'!E35:${last}35))`);
label(S,29,'Funding target incl. buffer + contingency');f(S,'E29',`=ROUNDUP((E28*(1+${a('contingency')})+${a('buffer')})/100000,0)*100000`);
label(S,30,'Planned raise (editable in Assumptions)');f(S,'E30',"='Assumptions'!E7");
label(S,31,'First 3-month recurring EBITDA run ends');f(S,'E31',`=IF(COUNTIFS('Cashflow'!E43:${last}43,1)=0,"Not in horizon",INDEX('Cashflow'!E7:${last}7,1,MATCH(1,'Cashflow'!E43:${last}43,0)))`);sh[S].getRange('E31').setNumberFormat('mmm-yy');
label(S,32,'First 3-month positive cash run ends');f(S,'E32',`=IF(COUNTIFS('Cashflow'!E44:${last}44,1)=0,"Not in horizon",INDEX('Cashflow'!E7:${last}7,1,MATCH(1,'Cashflow'!E44:${last}44,0)))`);sh[S].getRange('E32').setNumberFormat('mmm-yy');
label(S,33,'Minimum cash after planned funding');f(S,'E33',`=MIN('Cashflow'!E38:${last}38)`);sh[S].getRange('E28:E30').setNumberFormat(money);sh[S].getRange('E33').setNumberFormat(money);
v(S,'C35','Funding target is an estimate, not secured capital. Unfunded negative balances show the financing gap.');
v(S,'C36','Ad revenue is capped by delivered impressions and merchant budgets; fixed store fees are not added again.');
v(S,'C37','Gross media is reported as Atlas-principal planning. Agent accounting would report net media and remove venue share cost.');
v(S,'C38','One selected case recalculates live. PDF case comparisons are dated snapshots from this same build.');
const mh=['Month','Revenue','EBITDA','Cash before funding','Cash after funding','Recurring EBITDA'];sh[S].getRange('C41:H41').values=[mh];
sh[S].getRange('C41:H41').format.fill=navy;sh[S].getRange('C41:H41').format.font.color='#FFFFFF';
sh[S].getRange('D41:D77').format.columnWidth=17;sh[S].getRange('F41:H77').format.columnWidth=23;
for(let i=0;i<36;i++){const c=cols[i],r=i+42;v(S,`C${r}`,new Date(Date.UTC(2026,10+i,1)).toLocaleString('en-GB',{month:'short',year:'2-digit',timeZone:'UTC'}));for(const[dst,s,rr]of[['D','Revenue',49],['E','Costs',37],['F','Cashflow',35],['G','Cashflow',38],['H','Costs',39]])f(S,`${dst}${r}`,`='${s}'!${c}${rr}`);}
sh[S].getRange('D42:H77').setNumberFormat(money);
// Period labels respond to the single forecast date.
for(let i=0;i<36;i++)f(S,`C${i+42}`,`=TEXT('Revenue'!${cols[i]}7,"mmm-yy")`);
for(const [title,ranges,position,colors]of[
 ['Revenue and EBITDA (ZAR)', ['C41:C77','D41:D77','E41:E77'],['J7','U23'],['#185ABD','#D78E32']],
 ['Cash after funding (ZAR)', ['C41:C77','G41:G77'],['J25','U40'],['#22734B']]
]){const chart=sh[S].charts.add('line',ranges.map(r=>sh[S].getRange(r)));chart.title=title;chart.setPosition(...position);chart.titleTextStyle.fontSize=12;chart.titleTextStyle.typeface='Arial';chart.legend={position:'top',textStyle:{typeface:'Arial',fontSize:10}};chart.xAxis={axisType:'textAxis',textStyle:{typeface:'Arial',fontSize:9}};chart.yAxis={numberFormatCode:'0.0,,"m"',numberFormatSourceLinked:false,textStyle:{typeface:'Arial',fontSize:10}};chart.series.items.forEach((s,i)=>{s.line={fill:colors[i],style:'solid',width:2};});}
sh[S].getRange('E21:G24').conditionalFormats.add('cellIs',{operator:'lessThan',formula:0,format:{font:{color:'#B42318'}}});
const Q='Review';const qlabels={10:'Venue roll-forward difference',11:'Revenue / invoice / deferral difference',12:'Receivables roll-forward difference',13:'Cash roll-forward difference',14:'VAT roll-forward difference',15:'Media budget over-delivery',16:'Search impressions beyond sellable supply',17:'Route impressions beyond sellable supply',18:'Media share reconciliation difference',19:'Cash before funding reconciliation',20:'Negative net receivables',21:'Deferred pilot revenue negative',22:'Pilot recognition months: fixed window check'};for(const[r,l]of Object.entries(qlabels))label(Q,r,l);
for(let i=0;i<36;i++){const c=cols[i];const forms={10:`='Revenue'!${c}13-('Revenue'!${c}10+'Revenue'!${c}11-'Revenue'!${c}12)`,11:`='Cashflow'!${c}11-'Cashflow'!${c}10-('Cashflow'!${c}19-'Cashflow'!${c}18)`,12:`='Cashflow'!${c}16-('Cashflow'!${c}15+'Cashflow'!${c}13-'Cashflow'!${c}14)`,13:`='Cashflow'!${c}38-('Cashflow'!${c}37+'Cashflow'!${c}32+'Cashflow'!${c}36)`,14:`='Cashflow'!${c}27-('Cashflow'!${c}25+'Cashflow'!${c}21-'Cashflow'!${c}22-'Cashflow'!${c}26)`,15:`=MAX(0,'Revenue'!${c}47-'Revenue'!${c}31)`,16:`=MAX(0,'Revenue'!${c}39-'Revenue'!${c}37)`,17:`=MAX(0,'Revenue'!${c}45-'Revenue'!${c}43)`,18:`='Costs'!${c}12-'Revenue'!${c}47*${a('share')}`,19:`='Cashflow'!${c}38-'Cashflow'!${c}35-SUM('Cashflow'!$E$36:${c}36)`,20:`=MAX(0,-'Cashflow'!${c}16)`,21:`=MAX(0,-'Cashflow'!${c}19)`,22:`=${a('pilotMonths')}-3`};for(const[r,x]of Object.entries(forms))f(Q,`${c}${r}`,x);}
sh[Q].getRange(`E10:${last}22`).setNumberFormat('0.00');sh[Q].getRange(`E10:${last}22`).conditionalFormats.addCustom('ABS(E10)>0.01',{fill:'#FCE8E6',font:{color:'#B42318',bold:true}});
v(Q,'C25','Expected differences are 0.00. Review is terminal: no business formula depends on this sheet.');
label(Q,22,'Gross profit reconciliation difference');
row(Q,22,cols.map(c=>`='Costs'!${c}18-('Revenue'!${c}49-'Costs'!${c}17)`),true);
v(Q,'C26','Missing selected scenario inputs remain unavailable. An unused scenario may be incomplete without blocking the active case.');
// Keep long explanatory lines legible without altering numeric column widths.
for(const n of['Revenue','Costs','Cashflow'])sh[n].getRange(`C47:C58`).format.wrapText=false;
// Export-time verification against an independent scalar model, through the same case selector.
function independently(caseIndex){
 const sg=Object.fromEntries(Object.entries(scalarGroups).map(([k,x])=>[k,x[1][caseIndex]]));
 const mg=Object.fromEntries(Object.entries(monthlyGroups).map(([k,x])=>[k,x[2][caseIndex]]));
 const p=Object.fromEntries(Object.entries(inputs).map(([k,x])=>[k,x[1]]));
 let venues=0,arBalance=0,def=0,vat=0,unfunded=0,funded=8300000;const out=[];
 for(let i=0;i<36;i++){
  const m=i+1,year=Math.floor(i/12),add=mg.newVenues[i],lost=venues*sg.churn,bill=venues-lost+add*p.halfBilling;venues+=add-lost;
  const sessions=bill*mg.sessions[i],corePrice=p.core*(1+p.priceGrowth)**year,upPrice=p.upgrade*(1+p.priceGrowth)**year;
  const core=bill*corePrice,upgrade=bill*mg.attach[i]*upPrice,onboard=add*p.onboard,pilot=mg.pilots.slice(Math.max(0,i-2),i+1).reduce((a,b)=>a+b,0)*p.pilotFee/3;
  const demand=bill*mg.merchants[i]*mg.budget[i];
  const search=Math.min(demand*p.searchMix,sessions*p.searchSessions*p.searchCount*p.searchSlots*p.searchView*(1-p.invalid)*sg.fill*sg.searchCpm/1000);
  const route=Math.min(demand*(1-p.searchMix),sessions*p.routeSessions*p.routeCount*p.routeSlots*p.routeView*(1-p.invalid)*sg.fill*sg.routeCpm/1000);
  const ad=search+route,revenue=pilot+core+upgrade+onboard+ad,invoice=mg.pilots[i]*p.pilotFee+core+upgrade+onboard+ad;
  const recurringDirect=bill*p.hostVenue+sessions*p.sessionCost+ad*(p.share+p.adFees)+(core+upgrade)*p.commission;
  const direct=recurringDirect+add*p.deployCost+mg.pilots[i]*(p.pilotMapping+p.pilotCounter);
  const infl=(1+p.costGrowth)**year;const salary=(p.founder+mg.engineers[i]*p.engineerPay+p.design+(m>=p.salesStart?p.sales+p.ops:0)+(m>=p.analystStart?p.analyst:0)+(m>=p.supportStart?p.support:0))*infl*(1+p.burden);
  const overhead=(p.cloud+p.admin+p.marketing*[1,1.5,2][year]+p.legalMonthly)*infl+(i===0?p.legalSetup:0),ebitda=revenue-direct-salary-overhead-invoice*(1-sg.collect),recEbitda=core+upgrade+ad-recurringDirect-salary-overhead-(core+upgrade+ad)*(1-sg.collect);
  const capex=(i===0?p.initialCapex:0)+add*p.venueCapex,costCash=direct+salary+overhead,collected=i>=sg.lag?(sg.lag===0?invoice*sg.collect:out[i-sg.lag].invoice*sg.collect):0;
  arBalance+=invoice*sg.collect-collected;def+=mg.pilots[i]*p.pilotFee-pilot;
  const inputVat=((direct+overhead)*p.inputVatShare+capex)*p.vatRate,outputVat=invoice*p.vatRate,remit=m>=3&&m%2===1?Math.max(vat,0):0;vat+=outputVat-inputVat-remit;
  const cf=collected-costCash-capex-Math.max(ebitda,0)*p.taxReserve+collected*p.vatRate-inputVat-remit;unfunded+=cf;funded+=cf;
  out.push({m,venues,bill,sessions,core,upgrade,search,route,ad,pilot,onboard,revenue,invoice,direct,salary,overhead,ebitda,recEbitda,cf,unfunded,funded,arBalance,def,vat,exitMrr:venues*(corePrice+mg.attach[i]*upPrice),budget:demand});
 }
 return out;
}
const summaries=[];
for(let k=0;k<3;k++){
 v(A,'E4',k+1);wb.recalculate();const expected=independently(k);
 for(let i=0;i<36;i++)for(const[s,r,key]of[[R,49,'revenue'],[R,38,'search'],[R,44,'route'],[R,13,'venues'],[C,37,'ebitda'],[C,39,'recEbitda'],[F,32,'cf'],[F,38,'funded'],[F,16,'arBalance'],[F,19,'def'],[F,27,'vat']]){
  const actual=sh[s].getRange(`${cols[i]}${r}`).values[0][0];if(typeof actual!=='number'||Math.abs(actual-expected[i][key])>.01)throw Error(`Independent check ${k+1} ${s}!${cols[i]}${r}: ${actual} vs ${expected[i][key]}`);
 }
 const peak=Math.max(0,-Math.min(...expected.map(x=>x.unfunded)));const recRun=expected.findIndex((x,i)=>i>=2&&expected.slice(i-2,i+1).every(x=>x.recEbitda>=0));const cashRun=expected.findIndex((x,i)=>i>=2&&expected.slice(i-2,i+1).every(x=>x.cf>=0));
 summaries.push({case:['Base','Downside','Upside'][k],peakDeficit:peak,fundingTarget:Math.ceil((peak*1.15+300000)/100000)*100000,recurringBreakEvenRunEnd:recRun<0?null:recRun+1,cashBreakEvenRunEnd:cashRun<0?null:cashRun+1,years:[0,1,2].map(y=>{const rows=expected.slice(y*12,y*12+12),sum=key=>rows.reduce((a,b)=>a+b[key],0);return{revenue:sum('revenue'),core:sum('core'),upgrade:sum('upgrade'),search:sum('search'),route:sum('route'),ad:sum('ad'),pilotAndOnboard:sum('pilot')+sum('onboard'),ebitda:sum('ebitda'),cashflow:sum('cf'),venues:rows.at(-1).venues,cash:rows.at(-1).funded,exitMrr:rows.at(-1).exitMrr};}),monthly:expected});
 console.log(`Case ${k+1}: all monthly formulas agree with independent calculations.`);
}
// Boundary: no merchants means no media revenue; no sessions means no available inventory.
v(A,'E4',1);const merchantCell='I123',oldMerchant=sh[A].getRange(merchantCell).values[0][0];v(A,merchantCell,0);wb.recalculate();if(sh[R].getRange('I47').values[0][0]!==0)throw Error('Zero merchant boundary failed');v(A,merchantCell,oldMerchant);
const oldSessions=sh[A].getRange('AN117').values[0][0];const oldRevenue=sh[R].getRange('AN49').values[0][0];v(A,'AN117',0);wb.recalculate();if(sh[R].getRange('AN47').values[0][0]!==0||sh[R].getRange('AN49').values[0][0]===oldRevenue)throw Error('Later period input update failed');v(A,'AN117',oldSessions);
v(A,'E4',1);wb.recalculate();
// A blank unselected case must not block Base; selecting it must expose missing data.
const oldDownside=sh[A].getRange('AN118').values[0][0];v(A,'AN118',null);wb.recalculate();
if(typeof sh[R].getRange('AN49').values[0][0]!=='number')throw Error('Blank unselected case blocked Base');
v(A,'E4',2);wb.recalculate();if(typeof sh[R].getRange('AN49').values[0][0]==='number')throw Error('Selected missing input became a number');
v(A,'AN118',oldDownside);v(A,'E4',1);
v(A,'E11',4);wb.recalculate();if(Math.abs(sh[R].getRange('E21').values[0][0]-22500)>.01||Math.abs(sh[F].getRange('H19').values[0][0])>.01)throw Error('Pilot length update failed');v(A,'E11',3);
wb.recalculate();
for(const r of Object.keys(qlabels))for(const c of cols){const x=sh[Q].getRange(`${c}${r}`).values[0][0];if(typeof x!=='number'||Math.abs(x)>.01)throw Error(`Review failed ${c}${r}: ${x}`);}
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:50},summary:'Final formula error scan',maxChars:2000});
await fs.writeFile(path.join(qa,'formula-errors.ndjson'),errors.ndjson);console.log(errors.ndjson);
await fs.writeFile(path.join(root,'model-results.json'),JSON.stringify({asOf:'2026-10-28',start:'2026-11-01',currency:'ZAR',plannedRaise:8300000,assumptions:Object.fromEntries(Object.entries(inputs).map(([k,x])=>[k,x[1]])),cases:summaries},null,2));
const xlsx=await SpreadsheetFile.exportXlsx(wb);await xlsx.save(path.join(root,'Atlas-36-Month-Cashflow.xlsx'));
await fs.rename(path.join(root,'Atlas-36-Month-Cashflow.xlsx.inspect.ndjson'),path.join(qa,'workbook-export.inspect.ndjson')).catch(e=>{if(e.code!=='ENOENT')throw e;});
console.log((await wb.inspect({kind:'table',range:'Summary!C8:G33',include:'values,formulas',tableMaxRows:28,tableMaxCols:5,maxChars:5000})).ndjson);
for(const[n,range]of[['Summary','C2:U38'],['Assumptions','C2:L35'],['Revenue','C7:K27'],['Costs','C7:K29'],['Cashflow','C7:K39'],['Review','C7:K26']]){
 const img=await wb.render({sheetName:n,range,scale:1.4,format:'png'});await fs.writeFile(path.join(qa,`${n}.png`),new Uint8Array(await img.arrayBuffer()));
 console.log(`Rendered ${n}`);
}
console.log('Workbook exported, reconciled and rendered.');

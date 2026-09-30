(function(){
"use strict";
/* ================= helpers ================= */
const $=s=>document.querySelector(s);
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const pd=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const todayStr=()=>ymd(new Date());
const newId=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-5);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const round=(n,d)=>Math.round((+n||0)*10**d)/10**d;
const norm=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
const num=v=>{const n=parseFloat(String(v??'').replace(/,/g,'').replace(/[^\d.\-]/g,''));return isFinite(n)?n:0};
const sum=(a,f=x=>x)=>a.reduce((t,x)=>t+(+f(x)||0),0);
const dayDiff=(a,b)=>Math.round((pd(b)-pd(a))/864e5);
const fmtD=(s,o)=>pd(s).toLocaleDateString('en-GB',o);
const shortD=s=>fmtD(s,{day:'numeric',month:'short'});
const clone=o=>JSON.parse(JSON.stringify(o));

const PALETTE=['#E0782F','#3D7DD8','#8A5CD6','#D64F86','#2BA38A','#D9A514','#4F9A3A','#C2555A','#1FA5C9','#7D8B88','#B36B2C','#5B6EE1','#0E8F7E','#A0522D'];
const CURRENCIES=[['OMR',3],['AED',2],['SAR',2],['KWD',3],['BHD',3],['QAR',2],['USD',2],['EUR',2],['GBP',2],['INR',2],['PKR',2],['EGP',2],['JOD',3],['TRY',2],['THB',2],['MYR',2]];
const TYPE_LABEL={bank:'Bank account',card:'Credit card',cash:'Cash',wallet:'E‑wallet',savings:'Savings'};
const INV_TYPES={stocks:'Stocks',funds:'Funds / ETFs',gold:'Gold',crypto:'Crypto',property:'Property',deposit:'Fixed deposit',business:'Business',other:'Other'};
const INV_COLORS={stocks:'#3D7DD8',funds:'#2BA38A',gold:'#D9A514',crypto:'#8A5CD6',property:'#B36B2C',deposit:'#1FA5C9',business:'#D64F86',other:'#7D8B88'};
const DEBT_KIND={lent:['give','Lent to'],repaid_out:['give','Paid back'],borrowed:['receive','Borrowed from'],repaid_in:['receive','Paid you back:']};
const WIDGETS=[['recap','Monthly recap'],['today','Today\u2019s limit'],['quick','Quick add'],['subs','Subscriptions & fixed costs'],['trend','Spending chart'],['insights','What stands out'],['merchants','Where you spend'],['tags','Tags'],['paidFrom','Paid from (accounts)'],['people','Friends & debts'],['upcoming','Coming up'],['ask','Ask Claude']];

function defaultCategories(){return {
  expense:[
    {id:'food',name:'Food & dining',icon:'🍽️',color:'#E0782F',items:['Pizza','Burger','Rice & biryani','Shawarma','Chicken','Grills','Fish & seafood','Sandwich','Salad','Coffee','Tea & karak','Juice & drinks','Sweets & desserts','Restaurant','Delivery']},
    {id:'groceries',name:'Groceries',icon:'🛒',color:'#4F9A3A',items:['Vegetables','Fruits','Meat & chicken','Fish','Dairy & eggs','Bread & bakery','Rice & grains','Snacks','Drinks & water','Frozen food','Spices & sauces']},
    {id:'household',name:'Household',icon:'🧴',color:'#0E8F7E',items:['Cleaning','Laundry','Kitchen items','Tissues & paper','Home repair','Furniture']},
    {id:'bills',name:'Bills & utilities',icon:'🧾',color:'#3D7DD8',items:['Electricity','Water','Internet','Mobile','Rent','Gas','Housemaid']},
    {id:'transport',name:'Transport',icon:'🚗',color:'#8A5CD6',items:['Fuel','Taxi','Car service','Car wash','Parking','Car insurance','Car loan','Fines']},
    {id:'shopping',name:'Shopping',icon:'🛍️',color:'#D64F86',items:['Clothes','Shoes','Electronics','Accessories','Perfume','Personal care']},
    {id:'health',name:'Health',icon:'💊',color:'#2BA38A',items:['Pharmacy','Doctor','Dentist','Gym','Insurance']},
    {id:'fun',name:'Entertainment',icon:'🎬',color:'#D9A514',items:['Cinema','Games','Subscriptions','Outings','Sports']},
    {id:'education',name:'Education',icon:'📚',color:'#5B6EE1',items:['Courses','Books','School fees','Stationery']},
    {id:'family',name:'Family & giving',icon:'🎁',color:'#C2555A',items:['Gifts','Family support','Kids','Charity','Zakat']},
    {id:'travel',name:'Travel',icon:'✈️',color:'#1FA5C9',items:['Flights','Hotels','Visa','Activities']},
    {id:'fees',name:'Fees & taxes',icon:'🏛️',color:'#A0522D',items:['Bank fees','Government fees','Interest']},
    {id:'other',name:'Other',icon:'📦',color:'#7D8B88',items:['Miscellaneous']}
  ],
  income:[
    {id:'salary',name:'Salary',icon:'💼',color:'#2A7A4B',items:['Monthly salary','Bonus','Allowance','Overtime']},
    {id:'side',name:'Side income',icon:'💻',color:'#4F9A3A',items:['Freelance','Sales','Rental income']},
    {id:'returns',name:'Investment returns',icon:'📈',color:'#8A4FC4',items:['Dividends','Profit','Interest']},
    {id:'inc_other',name:'Other income',icon:'💰',color:'#1FA5C9',items:['Gift received','Refund','Cashback','Other']}
  ]};}
function defaultProfile(){
  return {v:2,currency:'OMR',decimals:3,weekStart:0,theme:'auto',
    accounts:[{id:'a_bank',name:'Main bank account',type:'bank',opening:0},{id:'a_card',name:'Credit card',type:'card',opening:0},{id:'a_cash',name:'Cash',type:'cash',opening:0},{id:'a_save',name:'Savings',type:'savings',opening:0}],
    categories:defaultCategories(),budgets:{},recurring:[],learned:{},
    people:[],investments:[],goals:[],quick:[],
    limits:{mode:'off',daily:0,monthly:0,scope:'daily',warnAt:80},
    widgets:Object.fromEntries(WIDGETS.map(w=>[w[0],true]))};
}
const KEYWORDS=[
  ['pizza','food','Pizza'],['domino','food','Pizza'],['papa john','food','Pizza'],['burger','food','Burger'],['mcdonald','food','Burger'],['hardee','food','Burger'],['five guys','food','Burger'],
  ['kfc','food','Chicken'],['broast','food','Chicken'],['biryani','food','Rice & biryani'],['majboos','food','Rice & biryani'],['shuwa','food','Rice & biryani'],['mandi','food','Rice & biryani'],
  ['shawarma','food','Shawarma'],['grill','food','Grills'],['kebab','food','Grills'],['mishkak','food','Grills'],['sandwich','food','Sandwich'],['subway','food','Sandwich'],['salad','food','Salad'],
  ['coffee','food','Coffee'],['starbucks','food','Coffee'],['costa','food','Coffee'],['tim horton','food','Coffee'],['cafe','food','Coffee'],['latte','food','Coffee'],
  ['karak','food','Tea & karak'],['chai','food','Tea & karak'],['juice','food','Juice & drinks'],['halwa','food','Sweets & desserts'],['cake','food','Sweets & desserts'],['ice cream','food','Sweets & desserts'],['kunafa','food','Sweets & desserts'],
  ['talabat','food','Delivery'],['restaurant','food','Restaurant'],
  ['lulu','groceries','Vegetables'],['carrefour','groceries','Vegetables'],['nesto','groceries','Vegetables'],['grocery','groceries','Vegetables'],['supermarket','groceries','Vegetables'],['hypermarket','groceries','Vegetables'],['bakery','groceries','Bread & bakery'],
  ['cleaning','household','Cleaning'],['detergent','household','Laundry'],['laundry','household','Laundry'],['tissue','household','Tissues & paper'],
  ['electric','bills','Electricity'],['nama','bills','Electricity'],['water bill','bills','Water'],['internet','bills','Internet'],['awasr','bills','Internet'],['fiber','bills','Internet'],['fibre','bills','Internet'],
  ['omantel','bills','Mobile'],['ooredoo','bills','Mobile'],['vodafone','bills','Mobile'],['recharge','bills','Mobile'],['rent','bills','Rent'],
  ['fuel','transport','Fuel'],['petrol','transport','Fuel'],['shell','transport','Fuel'],['oman oil','transport','Fuel'],['omanoil','transport','Fuel'],['al maha','transport','Fuel'],
  ['taxi','transport','Taxi'],['otaxi','transport','Taxi'],['careem','transport','Taxi'],['uber','transport','Taxi'],['parking','transport','Parking'],['car wash','transport','Car wash'],['fine','transport','Fines'],
  ['pharmacy','health','Pharmacy'],['clinic','health','Doctor'],['hospital','health','Doctor'],['dentist','health','Dentist'],['gym','health','Gym'],
  ['netflix','fun','Subscriptions'],['spotify','fun','Subscriptions'],['shahid','fun','Subscriptions'],['osn','fun','Subscriptions'],['youtube','fun','Subscriptions'],['cinema','fun','Cinema'],['vox','fun','Cinema'],['playstation','fun','Games'],['steam','fun','Games'],
  ['amazon','shopping','Electronics'],['noon','shopping','Electronics'],['perfume','shopping','Perfume'],['clothes','shopping','Clothes'],['shoes','shopping','Shoes'],['ikea','household','Furniture'],
  ['flight','travel','Flights'],['oman air','travel','Flights'],['salam air','travel','Flights'],['hotel','travel','Hotels'],['booking.com','travel','Hotels'],
  ['charity','family','Charity'],['zakat','family','Zakat'],['gift','family','Gifts'],['bank fee','fees','Bank fees'],['charges','fees','Bank fees'],
  ['salary','salary','Monthly salary'],['bonus','salary','Bonus'],['dividend','returns','Dividends'],['cashback','inc_other','Cashback'],['refund','inc_other','Refund']
].sort((a,b)=>b[0].length-a[0].length);

/* ================= state & storage ================= */
const state={profile:null,months:{},ready:false,
  ui:{tab:'home',period:'month',anchor:todayStr(),acct:'all',openCat:null,txMonth:todayStr().slice(0,7),txQ:'',txType:'all',txCat:'all'}};
// Everything lives in an encrypted vault on this phone (see "encrypted local vault" below).
// persist() just schedules one encrypted save of the whole state.
const canImages=true;
const downloadsNs={save:async({filename,data})=>{offerFile(filename,data,'text/csv','This CSV is NOT encrypted — anyone who opens the file can read it. Save it somewhere private.');return {status:'offered'};}};
const assetsNs={upload:async blob=>({id:await putReceipt(blob)})};
function persist(){ scheduleSave(); }
const persistMonth=()=>scheduleSave();

function fillProfile(){
  const p=state.profile,d=defaultProfile();
  for(const k of ['budgets','learned']) if(!p[k]||typeof p[k]!=='object') p[k]={};
  for(const k of ['recurring','people','investments','goals','quick']) if(!Array.isArray(p[k])) p[k]=[];
  if(!Array.isArray(p.accounts)||!p.accounts.length) p.accounts=d.accounts;
  for(const a of p.accounts){ if(!Array.isArray(a.roles)) a.roles=a.type==='savings'?['savings']:a.type==='bank'?['salary','spending']:['spending']; }
  if(!p.categories) p.categories=d.categories;
  if(!p.categories.income) p.categories.income=d.categories.income;
  if(p.v!==2){ // upgrade older data: add new default categories and items without touching the user's own
    for(const type of ['expense','income']) for(const dc of d.categories[type]){
      const ex=p.categories[type].find(c=>c.id===dc.id);
      if(!ex) p.categories[type].splice(Math.max(0,p.categories[type].length-1),0,dc);
      else for(const it of dc.items) if(!ex.items.includes(it)) ex.items.push(it);
    }
    p.v=2;
  }
  if(!p.limits) p.limits=d.limits; for(const k in d.limits) if(p.limits[k]==null) p.limits[k]=d.limits[k];
  if(!p.widgets) p.widgets={}; for(const k in d.widgets) if(p.widgets[k]==null) p.widgets[k]=true;
  if(p.decimals==null) p.decimals=3; if(p.weekStart==null) p.weekStart=0; if(!p.theme) p.theme='auto';
  applyTheme();
}
function applyTheme(){const t=state.profile&&state.profile.theme||'auto'; if(t==='auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme=t;}

/* ================= lookups ================= */
const P=()=>state.profile;
const acct=id=>P().accounts.find(a=>a.id===id);
const acctName=id=>(acct(id)||{name:'Deleted account'}).name;
function findCat(id){const c=P().categories;return c.expense.find(x=>x.id===id)||c.income.find(x=>x.id===id)}
const cat=id=>findCat(id)||{id,name:'Uncategorized',icon:'❔',color:'#7D8B88',items:[]};
const person=id=>P().people.find(x=>x.id===id);
const personName=id=>id==='me'?'You':(person(id)||{name:'Someone'}).name;
const holding=id=>P().investments.find(x=>x.id===id);
const cur=()=>P().currency;
const dec=()=>P().decimals;
function money(n,opt={}){
  const s=Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:dec(),maximumFractionDigits:dec()});
  return (n<0&&Math.abs(n)>=0.5*10**-dec()?'−':(opt.sign&&n>0?'+':''))+s;
}
const allTx=()=>Object.values(state.months).flat();
function monthKeysBetween(a,b){let [y,m]=a.split('-').map(Number);const [y2,m2]=b.split('-').map(Number);const out=[];while(y<y2||(y===y2&&m<=m2)){out.push(`${y}-${pad(m)}`);m++;if(m>12){m=1;y++}}return out}
function txBetween(a,b){return monthKeysBetween(a.slice(0,7),b.slice(0,7)).flatMap(k=>(state.months[k]||[]).filter(t=>t.date>=a&&t.date<=b))}
const isSavings=id=>hasRole(acct(id),'savings');
const avatarColor=id=>PALETTE[[...String(id)].reduce((t,c)=>t+c.charCodeAt(0),0)%PALETTE.length];

/* ================= money math ================= */
const lineTotal=l=>(num(l.qty)||1)*num(l.price);
function myShare(t){
  if(t.type!=='expense') return 0;
  if(t.refund) return -t.amount;
  if(!t.split) return t.amount;
  const s=t.split.shares.find(x=>x.who==='me'); return s?s.amount:0;
}
function paidByMe(t){return !(t.split&&t.split.paidBy&&t.split.paidBy!=='me')}
function allocs(t){
  const mine=myShare(t); if(!mine) return [];
  const L=t.lines;
  if(L&&L.length){
    const everyone=t.split?t.split.shares.map(s=>s.who):['me'];
    const w=L.map(l=>{const lt=lineTotal(l); if(t.split&&t.split.mode==='items'){const who=l.who&&l.who.length?l.who:everyone; return who.includes('me')?lt/who.length:0;} return lt;});
    const W=sum(w);
    if(W>0) return L.map((l,i)=>({catId:l.catId||t.catId,item:l.item||l.name||t.item||'Other',name:l.name||'',qty:num(l.qty)||1,amount:w[i]/W*mine})).filter(x=>x.amount>0);
  }
  return [{catId:t.catId,item:t.item||'Other',name:'',qty:1,amount:mine}];
}
function summarize(list){
  const s={spent:0,income:0,saved:0,invested:0,tax:0,shared:0,sharedTotal:0,byCat:{},byAcct:{},byDate:{},byMerchant:{},byTag:{},exp:[]};
  for(const t of list){
    if(t.type==='expense'){
      const m=myShare(t); if(!m) continue;
      s.spent+=m; if(m>0) s.exp.push(t);
      const seen=new Set();
      for(const a of allocs(t)){
        const c=s.byCat[a.catId]||(s.byCat[a.catId]={total:0,count:0,items:{}});
        c.total+=a.amount; if(!seen.has(a.catId)){c.count++;seen.add(a.catId);}
        const it=c.items[a.item]||(c.items[a.item]={total:0,count:0,names:{}});
        it.total+=a.amount; it.count+=1;
        if(a.name&&norm(a.name)!==norm(a.item)) it.names[a.name]=(it.names[a.name]||0)+a.qty;
      }
      const ak=paidByMe(t)?t.accountId:'__friend'; s.byAcct[ak]=(s.byAcct[ak]||0)+m;
      s.byDate[t.date]=(s.byDate[t.date]||0)+m;
      if(t.note){const k=norm(t.note); const b=s.byMerchant[k]||(s.byMerchant[k]={name:t.note,total:0,count:0}); b.total+=m; b.count++;}
      for(const tg of (t.tags||[])) s.byTag[tg]=(s.byTag[tg]||0)+m;
      if(t.amount>0) s.tax+=((+t.tax||0)+(+t.service||0))*m/t.amount;
      if(t.split){s.shared+=m; s.sharedTotal+=t.amount;}
    } else if(t.type==='income'){ s.income+=t.amount; for(const tg of (t.tags||[])) {} }
    else if(t.type==='transfer'){ const toS=isSavings(t.toAccountId),fromS=isSavings(t.accountId); if(toS&&!fromS) s.saved+=t.amount; else if(fromS&&!toS) s.saved-=t.amount; }
    else if(t.type==='invest'){ s.invested+=t.dir==='sell'?-t.amount:t.amount; }
  }
  return s;
}
function filterAcct(list){const a=state.ui.acct;return a==='all'?list:list.filter(t=>t.accountId===a||t.toAccountId===a)}
function balances(){
  const b={}; for(const a of P().accounts) b[a.id]=+a.opening||0;
  const add=(id,v)=>{if(id) b[id]=(b[id]||0)+v};
  for(const t of allTx()){
    if(t.type==='expense'){ if(paidByMe(t)) add(t.accountId,t.refund?t.amount:-t.amount); }
    else if(t.type==='income') add(t.accountId,t.amount);
    else if(t.type==='transfer'){add(t.accountId,-t.amount);add(t.toAccountId,t.amount);}
    else if(t.type==='debt') add(t.accountId,t.dir==='give'?-t.amount:t.amount);
    else if(t.type==='invest') add(t.accountId,t.dir==='sell'?t.amount:-t.amount);
  }
  return b;
}
function peopleBalances(){ // positive = they owe you
  const b={}; const add=(id,v)=>{if(id&&id!=='me') b[id]=(b[id]||0)+v};
  for(const t of allTx()){
    if(t.type==='expense'&&t.split){
      if(t.split.paidBy==='me'||!t.split.paidBy){ for(const s of t.split.shares) if(s.who!=='me') add(s.who,s.amount); }
      else add(t.split.paidBy,-myShare(t));
    } else if(t.type==='debt') add(t.personId,t.dir==='give'?t.amount:-t.amount);
  }
  return b;
}
function personTx(id){return allTx().filter(t=>(t.type==='debt'&&t.personId===id)||(t.type==='expense'&&t.split&&(t.split.paidBy===id||t.split.shares.some(s=>s.who===id)))).sort((a,b)=>a.date<b.date?1:-1)}
function personEffect(t,id){
  if(t.type==='debt') return t.dir==='give'?t.amount:-t.amount;
  if(t.split.paidBy===id) return -myShare(t);
  if(t.split.paidBy==='me'||!t.split.paidBy){const s=t.split.shares.find(x=>x.who===id);return s?s.amount:0}
  return 0;
}
function holdingStats(h){
  let contributed=+h.baseCost||0;
  for(const t of allTx()) if(t.type==='invest'&&t.investmentId===h.id) contributed+=t.dir==='sell'?-t.amount:t.amount;
  const last=(h.history||[]).slice().sort((a,b)=>a.date<b.date?-1:1).pop();
  let value=last?last.value:contributed;
  // buys/sells after the last valuation move the value too
  if(last) for(const t of allTx()) if(t.type==='invest'&&t.investmentId===h.id&&t.date>last.date) value+=t.dir==='sell'?-t.amount:t.amount;
  return {contributed,value,gain:value-contributed,pct:contributed>0?(value-contributed)/contributed*100:0,valuedOn:last?last.date:null};
}
function wealth(){
  const b=balances(); const pb=peopleBalances();
  const cash=sum(P().accounts.filter(a=>!hasRole(a,'savings')),a=>b[a.id]);
  const savings=sum(P().accounts.filter(a=>hasRole(a,'savings')),a=>b[a.id]);
  const inv=sum(P().investments,h=>holdingStats(h).value);
  const owed=sum(Object.values(pb).filter(v=>v>0)); const owe=-sum(Object.values(pb).filter(v=>v<0));
  return {b,pb,cash,savings,inv,owed,owe,total:cash+savings+inv+owed-owe};
}
/* ================= periods ================= */
function periodRange(period,anchorStr){
  const d=pd(anchorStr);
  if(period==='day') return [anchorStr,anchorStr];
  if(period==='week'){const off=(d.getDay()-P().weekStart+7)%7;const s=addDays(d,-off);return [ymd(s),ymd(addDays(s,6))]}
  if(period==='month') return [ymd(new Date(d.getFullYear(),d.getMonth(),1)),ymd(new Date(d.getFullYear(),d.getMonth()+1,0))];
  return [`${d.getFullYear()}-01-01`,`${d.getFullYear()}-12-31`];
}
function shiftAnchor(period,anchorStr,dir){
  const d=pd(anchorStr);
  if(period==='day') return ymd(addDays(d,dir));
  if(period==='week') return ymd(addDays(d,7*dir));
  if(period==='month') return ymd(new Date(d.getFullYear(),d.getMonth()+dir,1));
  return ymd(new Date(d.getFullYear()+dir,0,1));
}
function periodLabel(period,anchorStr){
  const [a,b]=periodRange(period,anchorStr); const d=pd(anchorStr);
  if(period==='day'){ if(a===todayStr()) return 'Today'; if(a===ymd(addDays(new Date(),-1))) return 'Yesterday'; return fmtD(a,{weekday:'short',day:'numeric',month:'short',year:'numeric'}); }
  if(period==='week') return shortD(a)+' – '+fmtD(b,{day:'numeric',month:'short',year:'numeric'});
  if(period==='month') return MONTHS[d.getMonth()]+' '+d.getFullYear();
  return String(d.getFullYear());
}
const PREV_WORD={day:'the day before',week:'last week',month:'last month',year:'last year'};
function daysElapsed(a,b){const t=todayStr();const end=b<t?b:t;if(end<a) return 0;return dayDiff(a,end)+1}

/* ================= daily limit ================= */
function countsForLimit(t){
  if(t.type!=='expense') return 0;
  const L=P().limits;
  if(L.scope==='daily'&&(t.recurringId||t.catId==='bills')) return 0;
  return myShare(t);
}
const countedOn=dateStr=>sum(state.months[dateStr.slice(0,7)]||[],t=>t.date===dateStr?countsForLimit(t):0);
function limitFor(dateStr){
  const L=P().limits;
  if(L.mode==='fixed') return L.daily>0?L.daily:null;
  if(L.mode==='smart'){
    if(!(L.monthly>0)) return null;
    const [a,b]=periodRange('month',dateStr);
    const before=sum(state.months[dateStr.slice(0,7)]||[],t=>t.date>=a&&t.date<dateStr?countsForLimit(t):0);
    const daysLeft=dayDiff(dateStr,b)+1;
    return Math.max(0,(L.monthly-before)/daysLeft);
  }
  return null;
}
function todayStatus(){
  const t=todayStr(); const limit=limitFor(t); const spent=countedOn(t);
  return {limit,spent,left:limit==null?null:limit-spent,pct:limit?spent/limit*100:(spent>0?999:0)};
}
function suggestMonthly(){
  // average income of the last 3 full months, minus repeating payments and savings/investing habits
  const now=new Date(); let inc=0,fixed=0,save=0,months=0;
  for(let i=1;i<=3;i++){const d=new Date(now.getFullYear(),now.getMonth()-i,1); const [a,b]=periodRange('month',ymd(d)); const list=txBetween(a,b); if(!list.length) continue; months++;
    const s=summarize(list); inc+=s.income; save+=Math.max(0,s.saved)+Math.max(0,s.invested);
    fixed+=sum(list,t=>t.type==='expense'&&(t.recurringId||t.catId==='bills')?myShare(t):0);}
  if(!months){ inc=sum(P().recurring.filter(r=>r.type==='income'&&r.freq==='monthly'),r=>r.amount); fixed=sum(P().recurring.filter(r=>r.type==='expense'&&r.freq==='monthly'),r=>r.amount); save=sum(P().recurring.filter(r=>(r.type==='transfer'&&isSavings(r.toAccountId))||r.type==='invest'),r=>r.amount); months=1; }
  const v=(inc-fixed-save)/months; return v>0?round(v*0.9,0):0;
}

/* ================= recurring ================= */
function advance(r,dateStr){
  const d=pd(dateStr);
  if(r.freq==='weekly') return ymd(addDays(d,7));
  if(r.freq==='yearly'){const y=d.getFullYear()+1;const last=new Date(y,d.getMonth()+1,0).getDate();return ymd(new Date(y,d.getMonth(),Math.min(r.day||d.getDate(),last)))}
  const m=d.getMonth()+1,y=d.getFullYear();const last=new Date(y,m+1,0).getDate();
  return ymd(new Date(y,m,Math.min(r.day||d.getDate(),last)));
}
const REC_FIELDS=['type','amount','accountId','toAccountId','catId','item','note','investmentId','dir','tags','refund'];
function runRecurring(){
  const t=todayStr();const touched=new Set();let added=0;
  for(const r of P().recurring){
    let g=0;
    while(r.next&&r.next<=t&&g<400){ g++;
      const tx={id:newId(),date:r.next,auto:true,recurringId:r.id,ts:Date.now()};
      for(const f of REC_FIELDS) if(r[f]!=null&&r[f]!=='') tx[f]=clone(r[f]);
      if(r.count){ r.done=(r.done||0)+1; tx.inst=`${r.done}/${r.count}`; }
      const k=r.next.slice(0,7);(state.months[k]||(state.months[k]=[])).push(tx);touched.add(k);
      r.next=advance(r,r.next);added++;
      if(r.count&&r.done>=r.count){ r.next=null; r.ended=true; break; }
    }
  }
  const before=P().recurring.length; P().recurring=P().recurring.filter(r=>!r.ended); if(P().recurring.length!==before) added=added||0;
  if(added){touched.forEach(persistMonth);persist('profile');setTimeout(()=>toast(`Added ${added} scheduled payment${added>1?'s':''} automatically`),700);}
}

/* ================= auto-categorize ================= */
const INCOME_CATS=()=>P().categories.income.map(c=>c.id);
function guessCategory(text,type){
  const n=norm(text); if(!n) return null;
  const want=c=>!type||type==='transfer'||(type==='income')===INCOME_CATS().includes(c);
  const L=P().learned[n]; if(L&&findCat(L.catId)&&want(L.catId)) return L;
  for(const [k,v] of Object.entries(P().learned)) if(k.length>3&&n.includes(k)&&findCat(v.catId)&&want(v.catId)) return v;
  for(const [kw,c,item] of KEYWORDS) if(n.includes(kw)&&findCat(c)&&want(c)) return {catId:c,item};
  // match an item name of any category ("margherita" won't, but "pizza" or a custom item will)
  for(const c of P().categories[type==='income'?'income':'expense']) for(const it of c.items) if(it.length>2&&n.includes(norm(it))) return {catId:c.id,item:it};
  return null;
}
function learn(text,catId,item){
  const n=norm(text); if(!n||n.length<2||!catId) return;
  const L=P().learned; L[n]={catId,item:item||''};
  const keys=Object.keys(L); if(keys.length>500) delete L[keys[0]];
}
function guessAcctFromText(text){
  const n=norm(text);
  const hit=P().accounts.find(a=>n.includes(norm(a.name)));
  if(hit) return hit.id;
  for(const [w,ty] of [['cash','cash'],['card','card'],['visa','card'],['bank','bank'],['wallet','wallet']]) if(new RegExp('\\b'+w+'\\b').test(n)){const a=P().accounts.find(x=>x.type===ty); if(a) return a.id;}
  return null;
}
const defaultAcct=()=>{ if(state.ui.acct!=='all'&&acct(state.ui.acct)) return state.ui.acct; const s=P().accounts.find(a=>hasRole(a,'spending')&&!hasRole(a,'savings')); return (s||P().accounts.find(a=>!hasRole(a,'savings'))||P().accounts[0]).id; };
const salaryAcct=()=>{ if(state.ui.acct!=='all'&&acct(state.ui.acct)) return state.ui.acct; const s=P().accounts.find(a=>hasRole(a,'salary')); return (s||acct(defaultAcct())).id; };
function parseQuick(text){
  const tags=[...text.matchAll(/#([\p{L}\p{N}_-]+)/gu)].map(m=>m[1].toLowerCase());
  let rest=text.replace(/#[\p{L}\p{N}_-]+/gu,' ');
  const m=rest.match(/(\d+(?:[.,]\d+)?)/); const amount=m?num(m[1].replace(',','.')):0;
  if(m) rest=rest.replace(m[0],' ');
  const accountId=guessAcctFromText(rest);
  if(accountId){ const a=acct(accountId); rest=rest.replace(new RegExp(a.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),' ').replace(/\b(cash|card|visa|bank|wallet)\b/i,' '); }
  const desc=rest.replace(/\s+/g,' ').trim();
  const isInc=/^(\+|income|got|received)/i.test(text.trim());
  const dd=desc.replace(/^\+\s*/,''); return {desc:dd.charAt(0).toUpperCase()+dd.slice(1),amount,accountId:accountId||defaultAcct(),tags,type:isInc?'income':'expense',guess:guessCategory(desc,isInc?'income':'expense')};
}
function quickSuggestions(){
  const from=ymd(addDays(new Date(),-75)); const counts={};
  for(const t of txBetween(from,todayStr())){
    if(t.type!=='expense'||t.refund||t.lines||t.split||t.recurringId||t.catId==='bills') continue;
    const k=[norm(t.note||t.item),t.amount,t.catId,t.item,t.accountId].join('|');
    const c=counts[k]||(counts[k]={label:t.note||t.item||cat(t.catId).name,amount:t.amount,catId:t.catId,item:t.item,accountId:t.accountId,n:0});c.n++;
  }
  const pinned=P().quick.map(q=>({...q,pinned:true}));
  const pk=new Set(pinned.map(q=>norm(q.label)+'|'+q.amount));
  const auto=Object.values(counts).filter(c=>c.n>=2&&!pk.has(norm(c.label)+'|'+c.amount)).sort((a,b)=>b.n-a.n).slice(0,Math.max(0,8-pinned.length));
  return [...pinned,...auto];
}
/* ================= rendering ================= */
const svgI=(d,w=2)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON={
  gear:svgI('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',1.8),
  camera:svgI('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>'),
  inbox:svgI('<path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9"/><path d="M3 15h5l1.5 3h5L16 15h5v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  search:svgI('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',2.2),
  down:svgI('<path d="M12 4v12M6 11l6 6 6-6M4 20h16"/>'),
  plus:svgI('<path d="M12 5v14M5 12h14"/>',2.4),
  swap:svgI('<path d="M7 7h13M16 3l4 4-4 4M17 17H4M8 13l-4 4 4 4"/>'),
  users:svgI('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.6a3.4 3.4 0 0 1 0 6.8M18.5 14.8c1.6.8 2.7 2.5 3 5.2"/>'),
  left:svgI('<path d="m15 18-6-6 6-6"/>',2.4),
  right:svgI('<path d="m9 18 6-6-6-6"/>',2.4),
  target:svgI('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  lock:svgI('<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>')
};
const pageHead=(title,sub,actions='',logo=false)=>`<div class="phead"><div class="brandrow">${logo?`<img class="brandmark" src="${LOGO_MARK}" alt="Masroof">`:''}<div>${sub?`<div class="psub">${sub}</div>`:''}<h1>${title}</h1></div></div><div class="pact">${actions}</div></div>`;
const gearBtn=()=>`<button class="round" data-act="tab" data-v="settings" aria-label="Settings">${ICON.gear}</button>`;
let lastTab=null,heroFrom=0;
function render(full=true){
  if(!state.ready) return;
  document.querySelectorAll('#tabs button[data-tab]').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===state.ui.tab?'page':'false'));
  const m=$('#main'); const tab=state.ui.tab; const sy=window.scrollY;
  const animate=full&&lastTab!==tab; lastTab=tab;
  if(tab==='home') m.innerHTML=viewHome();
  else if(tab==='tx'){ if(full||!$('#txList')) m.innerHTML=viewTxShell(); renderTxList(); }
  else if(tab==='people') m.innerHTML=viewPeople();
  else if(tab==='wealth') m.innerHTML=viewWealth();
  else m.innerHTML=viewSettings();
  if(animate){ const order=['home','tx','people','wealth','settings']; const dir=order.indexOf(tab)>=order.indexOf(render._prev||'home')?'r':'l'; render._prev=tab;
    m.classList.remove('anim','from-l','from-r'); void m.offsetWidth; m.classList.add('anim','from-'+dir); clearTimeout(render._t); render._t=setTimeout(()=>m.classList.remove('anim','from-l','from-r'),1000); }
  moveTabIndicator();
  if(!full) window.scrollTo(0,sy);
  if(tab==='tx'){ const mc=document.querySelector('#monthRow .chip[aria-pressed="true"]'); if(mc){ const r=$('#monthRow'); r.scrollLeft=mc.offsetLeft-r.offsetLeft-(r.clientWidth-mc.clientWidth)/2; } }

  const A=state.ui.acct!=='all'?acct(state.ui.acct):null; document.documentElement.style.setProperty('--acc',A?accColor(A):'#12B76A');
  runCountUps();
}
function runCountUps(){
  runOdometers();
  document.querySelectorAll('[data-count]').forEach(el=>{
    const to=+el.dataset.count, from=+el.dataset.from||0; if(matchMedia('(prefers-reduced-motion: reduce)').matches||from===to){el.textContent=money(to);return;}
    const t0=performance.now(), dur=650;
    const step=t=>{const k=Math.min(1,(t-t0)/dur); const e=1-Math.pow(1-k,3); el.textContent=money(from+(to-from)*e); if(k<1) requestAnimationFrame(step);};
    requestAnimationFrame(step);
  });
}
const greeting=()=>{const h=new Date().getHours(); return h<5?'Good night':h<12?'Good morning':h<17?'Good afternoon':'Good evening';};
const acctOptions=(sel,withAll)=>(withAll?`<option value="all"${sel==='all'?' selected':''}>All accounts</option>`:'')+P().accounts.map(a=>`<option value="${esc(a.id)}"${a.id===sel?' selected':''}>${esc(a.name)}</option>`).join('');
const peopleOptions=(sel,withMe)=>(withMe?`<option value="me"${sel==='me'?' selected':''}>Me</option>`:'')+P().people.map(p=>`<option value="${esc(p.id)}"${p.id===sel?' selected':''}>${esc(p.name)}</option>`).join('');
const avatar=(id,size=38)=>`<span class="avatar" style="background:${avatarColor(id)};width:${size}px;height:${size}px">${esc((personName(id)[0]||'?').toUpperCase())}</span>`;

/* ---------- Home ---------- */
function viewHome(){
  let h='';
  if(!allTx().length) h+=magicHeroHTML()+`<section class="welcome"><img class="wlogo" src="${LOGO_MARK}" alt=""><h2>Welcome to Masroof</h2><p>Record your first expense with the <b>+</b> button, scan a receipt, or load demo data to look around. Everything stays encrypted on this phone.</p>
    <div class="bar"><button class="btn primary" data-act="add">Add expense</button><button class="btn" data-act="demo">See a demo</button></div></section>`;
  else h+=magicHeroHTML();
  return h+`<div id="homeRest">${homeRestHTML()}</div>`;
}
function homeRestHTML(){
  const u=state.ui,W=P().widgets; const [a,b]=periodRange(u.period,u.anchor);
  const list=filterAcct(txBetween(a,b)); const s=summarize(list);
  const [pa,pb]=periodRange(u.period,shiftAnchor(u.period,u.anchor,-1)); const ps=summarize(filterAcct(txBetween(pa,pb)));
  const inRange=a<=todayStr()&&todayStr()<=b; const from=heroFrom; heroFrom=s.spent;
  const A=u.acct!=='all'?acct(u.acct):null; const fl=A?accFlows(list,A.id):null;
  let delta='';
  if(ps.spent>0){const pct=Math.round((s.spent-ps.spent)/ps.spent*100); delta=pct===0?`<span class="delta">same as ${PREV_WORD[u.period]}</span>`:`<span class="delta ${pct>0?'up':'down'}">${pct>0?'↑':'↓'} ${Math.abs(pct)}% vs ${PREV_WORD[u.period]}</span>`;}
  const st=todayStatus(); const L=P().limits;
  const lcls=st.left<0?'over':st.pct>=L.warnAt?'warn':'ok';
  const todayBar=W.today&&L.mode!=='off'&&st.limit!=null?`<button class="tbar ${lcls}" data-act="goLimits"><div class="tbar-t"><span>Today’s limit</span><b>${st.left<0?`${money(-st.left)} over`:`${money(st.left)} left`}</b></div><div class="tbar-b"><i style="width:${Math.min(100,st.pct)}%"></i></div><div class="tbar-s">Spent ${money(st.spent)} of ${money(st.limit)} today</div></button>`
    :W.today&&L.mode==='off'?`<button class="tbar setlim" data-act="goLimits"><span>${ICON.target}</span><span>Set a daily spending limit</span><span class="go">›</span></button>`:'';
  const stats=A?[['Money in',fl.inn,'in'],['Money out',fl.out,'out'],[hasRole(A,'savings')?'Saved':'Income',hasRole(A,'savings')?s.saved:s.income,hasRole(A,'savings')?'sav':'in']]
    :[['Income',s.income,'in'],['Saved',s.saved+s.invested,'sav'],['Left',s.income-s.spent-s.saved-s.invested,'left']];
  let h=`<section class="sum" id="homeHero">
    <div class="seg period" role="group" aria-label="Period">${['day','week','month','year'].map(p=>`<button data-act="period" data-v="${p}" aria-pressed="${u.period===p}">${p[0].toUpperCase()+p.slice(1)}</button>`).join('')}</div>
    <div class="sum-nav"><button class="nav-btn" data-act="shift" data-v="-1" aria-label="Previous">${ICON.left}</button><span class="sum-period">${esc(periodLabel(u.period,u.anchor))}</span><button class="nav-btn" data-act="shift" data-v="1" aria-label="Next">${ICON.right}</button>${inRange?'':'<button class="now" data-act="toToday">Now</button>'}</div>
    <div class="sum-cap">${A?esc(A.name)+' · spent':'You spent'}</div>
    <div class="sum-amt" id="heroAmt">${odoHTML(s.spent,from)}<small>${esc(cur())}</small></div>${delta}
    <div class="sum-stats">${stats.map(([l,v,c])=>`<div class="st st-${c}"><span><i></i>${l}</span><b class="${c==='left'&&v<0?'neg':''}${money(v).length>9?' sm':''}">${money(v)}</b></div>`).join('')}</div>
    ${todayBar}</section>`;
  if(W.quick) h+=quickCardHTML();
  h+=recentHTML();
  h+=budgetRingsHTML(s);
  const spending=`<h3 class="stitle">Where it went</h3><section class="panel">${donutHTML(s)}<ul class="cats">${catListHTML(s,ps)}</ul></section>`;
  const tips=W.insights?insightsHTML(u,s,ps,a,b,true):[];
  const cards=[W.trend&&allTx().length?weekBarsHTML():'',W.recap&&allTx().length?recapCardHTML():'',...tips.map(([k,t],i)=>`<div class="tip-card t${i%6}"><span class="k">${k}</span><p>${t}</p></div>`),W.upcoming?upcomingHTML():'',W.subs?subsHTML():'',W.people?peopleWidgetHTML():'',W.merchants?merchantsHTML(s):'',W.tags?tagsHTML(s):'',W.paidFrom?acctSpendHTML(s):''].filter(Boolean);
  const foryou=cards.length?`<div><h3 class="stitle">For you</h3><div class="fy" id="fy">${cards.map(c=>`<div class="fy-card">${c}</div>`).join('')}</div></div>`:'';
  h+=`<div class="grid" style="margin-top:16px"><div class="stack">${spending}</div><div class="stack">${foryou}${W.trend?areaChartHTML(u):''}</div></div>`;
  return h;
}
function quickCardHTML(){
  const chips=quickSuggestions();
  return `<section class="panel quick"><div class="qbox"><span class="qic">⚡</span><input id="quickIn" placeholder="Quick add: karak 0.2, lulu 23.5 card" autocomplete="off" aria-label="Quick add"><button class="qgo" data-act="quickAdd" aria-label="Add">＋</button></div>
    ${chips.length?`<div class="qchips">${chips.map((c,i)=>{const cc=cat(c.catId);return `<button class="qchip" data-act="quickChip" data-i="${i}" style="--cc:${cc.color}"><span class="qe">${cc.icon||'•'}</span><span class="ql">${esc(c.label)}</span><b>${money(c.amount)}</b></button>`}).join('')}</div>`:`<p class="hint" style="margin-top:10px">Things you buy often turn into one-tap buttons here.</p>`}</section>`;
}
function catListHTML(s,ps){
  const u=state.ui; const ents=Object.entries(s.byCat).sort((x,y)=>y[1].total-x[1].total);
  const showBudget=u.period==='month'&&u.acct==='all'; const budgets=P().budgets;
  if(showBudget) for(const id of Object.keys(budgets)) if(budgets[id]>0&&!s.byCat[id]&&findCat(id)) ents.push([id,{total:0,count:0,items:{}}]);
  const more=ents.length-4; const shown=u.allCats||ents.length<=5?ents:ents.slice(0,4);
  return shown.map(([id,v])=>{
    const c=cat(id); const open=u.openCat===id; const pct=s.spent?v.total/s.spent*100:0; const prev=(ps.byCat[id]||{}).total||0;
    let meta=`${v.count} purchase${v.count===1?'':'s'}`, trend='';
    if(prev>0){const d=Math.round((v.total-prev)/prev*100); if(d>300) trend='<span class="tr up">much more</span>'; else if(d!==0) trend=`<span class="tr ${d>0?'up':'down'}">${d>0?'▲':'▼'} ${Math.abs(d)}%</span>`;}
    let bud='';
    if(showBudget&&budgets[id]>0){const r=v.total/budgets[id];
      bud=`<div class="budget"><i style="width:${Math.min(100,r*100)}%;background:${r>1?'var(--spend)':c.color}"></i></div><div class="cat-meta">${r>1?`Over budget by ${money(v.total-budgets[id])}`:`${money(budgets[id]-v.total)} left of ${money(budgets[id])}`}</div>`;}
    let items='';
    if(open){ const its=Object.entries(v.items).sort((x,y)=>y[1].total-x[1].total); const max=its.length?its[0][1].total:1;
      items=`<div class="items">${its.length?its.map(([nm,iv])=>{const names=Object.entries(iv.names).sort((x,y)=>y[1]-x[1]).slice(0,4).map(([n,q])=>`${n}${q>1?' ×'+(+q.toFixed(2)):''}`).join(' · ');
        return `<div class="item"><span>${esc(nm)}</span><b>${money(iv.total)}</b><div class="bar-s"><i style="width:${iv.total/max*100}%;background:${c.color}"></i></div>
        <span class="n">${iv.count}× · avg ${money(iv.total/iv.count)}</span><span class="n">${(iv.total/v.total*100).toFixed(0)}%</span>${names?`<span class="names">${esc(names)}</span>`:''}</div>`}).join(''):'<p class="hint">Nothing spent here yet.</p>'}
        <button class="btn small" data-act="seeTx" data-v="${esc(id)}" style="margin-top:6px">See these transactions</button></div>`; }
    return `<li class="cat-row"><button class="cat-head" data-act="openCat" data-v="${esc(id)}" aria-expanded="${open}"><span class="cat-ico" style="background:color-mix(in srgb,${c.color} 16%,transparent)">${c.icon||'•'}</span>
      <span class="cat-mid"><span class="cat-top"><span class="cat-name">${esc(c.name)}</span><span class="cat-amt">${money(v.total)}</span></span>${bud||`<span class="share"><i style="width:${Math.max(2,pct)}%;background:${c.color}"></i></span><span class="cat-meta">${meta} · ${pct.toFixed(0)}% of spending ${trend}</span>`}</span></button>${items}</li>`;
  }).join('')+(ents.length>5?`<li><button class="more-btn" data-act="allCats">${u.allCats?'Show less':`Show all ${ents.length} categories`}</button></li>`:'');
}
function trendBuckets(u){
  const [a,b]=periodRange(u.period,u.anchor); const out=[];
  if(u.period==='year'){ const y=a.slice(0,4); const s=summarize(filterAcct(txBetween(a,b))); const byM={};
    for(const [d,v] of Object.entries(s.byDate)){const m=+d.slice(5,7);byM[m]=(byM[m]||0)+v}
    for(let m=1;m<=12;m++){const k=`${y}-${pad(m)}`; out.push({key:k,label:MONTHS[m-1].slice(0,3),full:MONTHS[m-1]+' '+y,value:byM[m]||0,cur:k===todayStr().slice(0,7)});}
    return out; }
  const start=u.period==='day'?ymd(addDays(pd(a),-13)):a; const s=summarize(filterAcct(txBetween(start,b)));
  const showLimit=P().limits.mode!=='off'&&u.period!=='year';
  for(let d=pd(start);ymd(d)<=b;d=addDays(d,1)){const k=ymd(d);
    out.push({key:k,label:u.period==='month'?String(d.getDate()):DOW[d.getDay()].slice(0,2),full:fmtD(k,{weekday:'short',day:'numeric',month:'short'}),value:s.byDate[k]||0,cur:(u.period==='day'&&k===u.anchor)||k===todayStr(),limit:showLimit&&k<=todayStr()?limitFor(k):null});}
  return out;
}
function insightsHTML(u,s,ps,a,b,asList){
  if(!s.exp.length) return asList?[]:'';
  const li=[]; const days=daysElapsed(a,b)||(dayDiff(a,b)+1);
  if(u.period!=='day') li.push(['📅',`<b>${money(s.spent/days)}</b> a day on average`]);
  if(u.period==='month'&&a<=todayStr()&&todayStr()<=b) li.push(['🔮',`At this pace, about <b>${money(s.spent/days*(dayDiff(a,b)+1))}</b> by month end`]);
  const big=s.exp.reduce((m,t)=>myShare(t)>myShare(m)?t:m,s.exp[0]);
  li.push(['💸',`Biggest: <b>${esc(big.note||big.item||cat(big.catId).name)}</b> ${money(myShare(big))} on ${shortD(big.date)}`]);
  const ic={}; for(const [cid,c] of Object.entries(s.byCat)) for(const [nm,iv] of Object.entries(c.items)){ic[nm]=ic[nm]||{c:0,t:0}; ic[nm].c+=iv.count; ic[nm].t+=iv.total;}
  const fav=Object.entries(ic).sort((x,y)=>y[1].c-x[1].c)[0];
  if(fav&&fav[1].c>1) li.push(['🔁',`Most frequent: <b>${esc(fav[0])}</b> — ${fav[1].c} times, ${money(fav[1].t)} in total`]);
  const pc=priceChange(a,b); if(pc) li.push([pc.now>pc.before?'🏷️':'🎉',`<b>${esc(pc.name)}</b> ${pc.now>pc.before?'got pricier':'got cheaper'}: ${money(pc.before)} → ${money(pc.now)} (${pc.now>pc.before?'+':''}${Math.round((pc.now-pc.before)/pc.before*100)}%)`]);
  const fromSav=sum(s.exp.filter(t=>paidByMe(t)&&hasRole(acct(t.accountId),'savings')),myShare);
  if(fromSav>0) li.push(['⚠️',`<b>${money(fromSav)}</b> was spent straight from savings (${esc([...new Set(s.exp.filter(t=>hasRole(acct(t.accountId),'savings')).map(t=>acctName(t.accountId)))].join(', '))})`]);
  if(s.tax>0) li.push(['🏛️',`Taxes & service charges: <b>${money(s.tax)}</b> (${(s.tax/s.spent*100).toFixed(1)}% of spending)`]);
  if(s.shared>0) li.push(['👥',`Shared bills: your part was <b>${money(s.shared)}</b> of ${money(s.sharedTotal)}`]);
  if(u.period!=='day'&&s.exp.length>3){const dw=[0,0,0,0,0,0,0]; for(const t of s.exp) dw[pd(t.date).getDay()]+=myShare(t); li.push(['📆',`You spend most on <b>${DOW[dw.indexOf(Math.max(...dw))]}s</b>`]);}
  let best=null; for(const [id,v] of Object.entries(s.byCat)){const p=(ps.byCat[id]||{}).total||0;const d=v.total-p; if(p>0&&(!best||Math.abs(d)>Math.abs(best.d))) best={id,d}}
  if(best&&Math.abs(best.d)>0) li.push([best.d>0?'📈':'📉',`<b>${esc(cat(best.id).name)}</b> is ${best.d>0?'up':'down'} ${money(Math.abs(best.d))} vs ${PREV_WORD[u.period]}`]);
  if(s.income>0){const r=Math.round((s.saved+s.invested)/s.income*100); li.push(['🏦',r>0?`You put <b>${r}%</b> of income into savings and investments`:`Nothing saved yet this period — a transfer to a Savings account counts`]);}
  if(asList) return li;
  return `<section class="panel"><h2>What stands out</h2><ul class="insights">${li.map(([k,t])=>`<li><span class="k">${k}</span><span>${t}</span></li>`).join('')}</ul></section>`;
}
function merchantsHTML(s){
  const e=Object.values(s.byMerchant).sort((a,b)=>b.total-a.total).slice(0,6); if(e.length<2) return '';
  const max=e[0].total;
  return `<section class="panel"><h2>Top places</h2><div class="rbars">${e.map(m=>`<div class="r"><span>${esc(m.name)} <span class="muted">· ${m.count}×</span></span><b>${money(m.total)}</b><div class="bar-s"><i style="width:${m.total/max*100}%"></i></div></div>`).join('')}</div></section>`;
}
function tagsHTML(s){
  const e=Object.entries(s.byTag).sort((a,b)=>b[1]-a[1]); if(!e.length) return '';
  return `<section class="panel"><h2>Tags</h2><div class="rows">${e.map(([t,v])=>`<button class="rw" data-act="tagSearch" data-v="${esc(t)}"><span>#${esc(t)}</span><b>${money(v)}</b></button>`).join('')}</div></section>`;
}
function acctSpendHTML(s){
  const e=Object.entries(s.byAcct).sort((x,y)=>y[1]-x[1]); if(e.length<2) return ''; const max=e[0][1];
  return `<section class="panel"><h2>Paid from</h2><div class="rbars">${e.map(([id,v])=>`<div class="r"><span>${id==='__friend'?'Friends paid (your share)':esc(acctName(id))}</span><b>${money(v)}</b><div class="bar-s"><i style="width:${v/max*100}%"></i></div></div>`).join('')}</div></section>`;
}
function peopleWidgetHTML(){
  const pb=peopleBalances(); const e=Object.entries(pb).filter(([,v])=>Math.abs(v)>=10**-dec()).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]));
  if(!e.length) return '';
  const owed=sum(e.filter(x=>x[1]>0),x=>x[1]), owe=-sum(e.filter(x=>x[1]<0),x=>x[1]);
  return `<section class="panel"><div class="panel-h"><h2>Friends</h2><button class="btn small" data-act="tab" data-v="people">Open</button></div>
    <div class="nw-parts" style="margin-bottom:8px">${owed?`<span>Owed to you <b class="amt pos">${money(owed)}</b></span>`:''}${owe?`<span>You owe <b class="amt neg">${money(owe)}</b></span>`:''}</div>
    <div class="rows">${e.slice(0,4).map(([id,v])=>`<button class="rw" data-act="person" data-v="${esc(id)}"><span>${esc(personName(id))}</span><b class="amt ${v>0?'pos':'neg'}">${v>0?'owes you ':'you owe '}${money(Math.abs(v))}</b></button>`).join('')}</div></section>`;
}
function upcomingHTML(){
  const lim=ymd(addDays(new Date(),31)); const up=P().recurring.filter(r=>r.next&&r.next<=lim).sort((a,b)=>a.next<b.next?-1:1);
  if(!up.length) return '';
  return `<section class="panel"><h2>Coming up</h2><div class="rows">${up.map(r=>`<div class="rw"><span class="dchip"><b>${pd(r.next).getDate()}</b>${MONTHS[pd(r.next).getMonth()].slice(0,3)}</span><span class="rwl">${esc(recLabel(r))}</span><b class="amt ${r.type}">${r.type==='income'?'+':''}${money(r.amount)}</b></div>`).join('')}</div>
    <p class="hint" style="margin-top:8px">Total going out: ${money(sum(up.filter(r=>r.type!=='income'),r=>r.amount))}</p></section>`;
}
const recLabel=r=>(r.count?`[${(r.done||0)+1}/${r.count}] `:'')+(r.note||r.item||(r.type==='transfer'?'Transfer to '+acctName(r.toAccountId):r.type==='invest'?'Invest in '+((holding(r.investmentId)||{}).name||'investment'):cat(r.catId).name));

/* ---------- Activity ---------- */
function viewTxShell(){
  const u=state.ui; const [y,m]=u.txMonth.split('-').map(Number); const cats=[...P().categories.expense,...P().categories.income];
  const acts=`${canImages?`<button class="round" data-act="scanNew" aria-label="Scan receipt">${ICON.camera}</button>`:''}<button class="round" data-act="import" aria-label="Import bank messages">${ICON.inbox}</button>${downloadsNs?`<button class="round" data-act="export" aria-label="Export CSV">${ICON.down}</button>`:''}`;
  const months=[]; for(let i=11;i>=0;i--){const dd=new Date(new Date().getFullYear(),new Date().getMonth()-i,1); months.push(`${dd.getFullYear()}-${pad(dd.getMonth()+1)}`);}
  if(!months.includes(u.txMonth)) months.unshift(u.txMonth);
  return pageHead('Activity','',acts)+`<div class="hscroll months" id="monthRow">${months.map(k=>{const [yy,mm]=k.split('-').map(Number);return `<button class="chip" data-act="pickMonth" data-v="${k}" aria-pressed="${u.txMonth===k}">${MONTHS[mm-1].slice(0,3)}${yy!==new Date().getFullYear()?' '+yy:''}</button>`}).join('')}</div>
  <div class="bar"><label class="searchbox">${ICON.search}<input type="search" placeholder="Search pizza, Lulu, Ali, #trip" value="${esc(u.txQ)}" data-input="txQ" aria-label="Search"></label></div>
  <div class="hscroll" style="margin-bottom:6px">
    <select class="sel" data-change="txType" aria-label="Type">${[['all','All types'],['expense','Expenses'],['income','Income'],['transfer','Transfers'],['debt','Lent / borrowed'],['invest','Investments'],['split','Split bills'],['itemized','With items']].map(([v,l])=>`<option value="${v}"${u.txType===v?' selected':''}>${l}</option>`).join('')}</select>
    <select class="sel" data-change="txCat" aria-label="Category"><option value="all">All categories</option>${cats.map(c=>`<option value="${esc(c.id)}"${u.txCat===c.id?' selected':''}>${esc(c.icon||'')} ${esc(c.name)}</option>`).join('')}</select>
</div>
  <div class="hscroll" style="margin-bottom:6px"><button class="chip" data-act="pickAcct" data-v="all" aria-pressed="${u.acct==='all'}">All accounts</button>${P().accounts.map(a=>`<button class="chip acchip" data-act="pickAcct" data-v="${esc(a.id)}" aria-pressed="${u.acct===a.id}" style="--cc:${accColor(a)}"><i class="dot" style="background:${accColor(a)}"></i>${esc(a.name)}</button>`).join('')}</div>
  <div id="txSum" class="hint" style="margin:6px 4px 0"></div><div id="txList"></div>`;
}
function renderTxList(){
  const u=state.ui; const q=norm(u.txQ);
  let list=filterAcct((state.months[u.txMonth]||[]).slice());
  if(u.txType==='split') list=list.filter(t=>t.split); else if(u.txType==='itemized') list=list.filter(t=>t.lines&&t.lines.length); else if(u.txType!=='all') list=list.filter(t=>t.type===u.txType);
  if(u.txCat!=='all') list=list.filter(t=>t.catId===u.txCat||(t.lines||[]).some(l=>l.catId===u.txCat));
  if(q) list=list.filter(t=>norm([t.note,t.item,cat(t.catId).name,acctName(t.accountId),(t.tags||[]).map(x=>'#'+x).join(' '),(t.lines||[]).map(l=>l.name+' '+l.item).join(' '),t.personId?personName(t.personId):'',t.split?t.split.shares.map(s=>personName(s.who)).join(' '):'',t.investmentId?(holding(t.investmentId)||{}).name:''].join(' ')).includes(q));
  list.sort((a,b)=>a.date===b.date?(b.ts||0)-(a.ts||0):(a.date<b.date?1:-1));
  const s=summarize(list);
  $('#txSum').textContent=list.length?`${list.length} transaction${list.length>1?'s':''} · you spent ${money(s.spent)} · income ${money(s.income)} ${cur()}`:'';
  if(!list.length){$('#txList').innerHTML=`<div class="empty"><span class="big-emoji">🧾</span>Nothing here yet.<br><button class="btn primary" data-act="add" style="margin-top:14px">Add a transaction</button></div>`;return;}
  const groups={}; for(const t of list)(groups[t.date]||(groups[t.date]=[])).push(t);
  $('#txList').innerHTML=Object.entries(groups).map(([d,ts])=>{const sp=sum(ts,myShare);
    const lim=limitFor(d); const over=lim!=null&&countedOn(d)>lim;
    return `<div class="day-h"><span>${fmtD(d,{weekday:'long',day:'numeric',month:'long'})}${over?' <span class="pill" style="color:var(--spend)">over limit</span>':''}</span><span>${sp?'−'+money(sp):''}</span></div><div class="tx-group">${ts.map(txRow).join('')}</div>`;}).join('');
}
function txRow(t){
  let ico,color,title,sub,amt,cls=t.type,extra='';
  const pills=[t.refund?'refund':'',t.inst?t.inst:'',t.lines&&t.lines.length?`${t.lines.length} items`:'',t.split?'split':'',t.fx?t.fx.cur:''].filter(Boolean);
  if(t.type==='transfer'){ico='↔️';color='#3450AE';title=`${acctName(t.accountId)} → ${acctName(t.toAccountId)}`;sub=t.note||(isSavings(t.toAccountId)?'Moved to savings':'Transfer');amt=money(t.amount);}
  else if(t.type==='debt'){const k=DEBT_KIND[t.debtKind]||[t.dir,t.dir==='give'?'Lent to':'Borrowed from'];ico='🤝';color='#B7791F';title=`${k[1]} ${personName(t.personId)}`;sub=[t.note,acctName(t.accountId)].filter(Boolean).join(' · ');amt=(t.dir==='give'?'−':'+')+money(t.amount);}
  else if(t.type==='invest'){const h=holding(t.investmentId);ico='📈';color='#8A4FC4';title=`${t.dir==='sell'?'Sold':'Invested in'} ${h?h.name:'investment'}`;sub=[t.units?t.units+' units':'',t.note,acctName(t.accountId)].filter(Boolean).join(' · ');amt=(t.dir==='sell'?'+':'−')+money(t.amount);}
  else { const c=cat(t.catId);ico=c.icon||'•';color=c.color;title=t.note||t.item||c.name;
    sub=[c.name+(t.item&&t.note?' · '+t.item:''),t.split&&t.split.paidBy!=='me'?'paid by '+personName(t.split.paidBy):acctName(t.accountId),(t.tags||[]).map(x=>'#'+x).join(' ')].filter(Boolean).join(' · ');
    amt=(t.type==='expense'&&!t.refund?'−':'+')+money(t.type==='expense'&&t.split?myShare(t):t.amount); if(t.refund) cls='income';
    if(t.split) extra=`<small>of ${money(t.amount)}</small>`; }
  const id=esc(t.id);
  return `<div class="swipe" data-id="${id}"><div class="acts"><div><button class="dup" data-act="rowDup" data-v="${id}" tabindex="-1">↻<span>Again</span></button></div><div><button class="edit" data-act="edit" data-v="${id}" tabindex="-1">✎<span>Edit</span></button><button class="del" data-act="rowDel" data-v="${id}" tabindex="-1">🗑<span>Delete</span></button></div></div>
    <button class="tx" data-act="edit" data-v="${id}">${rowAvatar(t,ico,color)}
    <span><div class="t1">${esc(title)}${pills.map(p=>`<span class="pill">${esc(p)}</span>`).join('')}</div><div class="t2">${t.accountId&&acct(t.accountId)?`<i class="adot" style="background:${accColor(acct(t.accountId))}"></i>`:''}${esc(sub)}</div></span><span class="amt ${cls}">${amt}${extra}</span></button></div>`;
}

/* ---------- People ---------- */
function viewPeople(){
  const pb=peopleBalances(); const ppl=P().people.slice().sort((a,b)=>Math.abs(pb[b.id]||0)-Math.abs(pb[a.id]||0));
  const owed=sum(Object.values(pb).filter(v=>v>0)), owe=-sum(Object.values(pb).filter(v=>v<0));
  return pageHead('Friends','Split & settle up',gearBtn())+`<section class="hero"><div class="hero-split"><div><span>They owe you</span><b>${money(owed)}</b></div><div><span>You owe</span><b>${money(owe)}</b></div></div>
    <div class="hero-acts"><button class="btn light" data-act="add" data-preset="split">${ICON.users}Split a bill</button><button class="btn glass" data-act="add" data-preset="lend">${ICON.swap}Lend or borrow</button></div></section>
  <section class="panel"><div class="panel-h"><h2>People</h2></div>
    ${ppl.length?`<p class="hint" style="margin:-4px 0 10px">Swipe a name right to settle up, left for more.</p><div class="tx-group">${ppl.map(p=>{const v=pb[p.id]||0;return `<div class="swipe" data-id="${esc(p.id)}" data-right="settle"><div class="acts"><div><button class="dup" data-act="rowNoop" tabindex="-1">✓<span>Settle</span></button></div><div><button class="edit" data-act="pSplitQuick" data-v="${esc(p.id)}" tabindex="-1">👥<span>Split</span></button><button class="del" style="background:var(--warn)" data-act="pRemindQuick" data-v="${esc(p.id)}" tabindex="-1">🔔<span>Remind</span></button></div></div>
      <button class="tx" data-act="person" data-v="${esc(p.id)}">${avatar(p.id,42)}<span><div class="t1">${esc(p.name)}</div><div class="t2">${personTx(p.id).length} shared</div></span><span class="amt ${v>0.0001?'pos':v<-0.0001?'neg':''}">${Math.abs(v)<10**-dec()?'Settled':(v>0?'owes you<br>':'you owe<br>')+money(Math.abs(v))}</span></button></div>`}).join('')}</div>`:'<div class="empty"><span class="big-emoji">🤝</span>Add the friends and family you share costs with.</div>'}
    <div class="addrow"><input class="inp" id="newPerson" placeholder="Add a friend’s name" autocomplete="off"><button class="btn primary" data-act="addPerson">Add</button></div></section>`;
}

/* ---------- Wealth ---------- */
function viewWealth(){
  const w=wealth(); const b=w.b;
  const hs=P().investments.map(h=>({h,s:holdingStats(h)})); const invC=sum(hs,x=>x.s.contributed),invV=sum(hs,x=>x.s.value);
  const byType={}; for(const x of hs) byType[x.h.type]=(byType[x.h.type]||0)+Math.max(0,x.s.value);
  const parts=[['Accounts',w.cash,'#3E7BFA'],['Savings',w.savings,'#1FA2A0'],['Investments',w.inv,'#7C5CFC'],['Owed to you',w.owed,'#3CCB6E']].filter(x=>x[1]>0); const ptot=sum(parts,x=>x[1])||1;
  return pageHead('Wealth','Net worth & goals',gearBtn())+`<section class="hero"><div class="hero-k">Your net worth</div>
    <div class="hero-amt"><span data-count="${w.total}" data-from="0">${money(w.total)}</span><small>${esc(cur())}</small></div>
    ${parts.length?`<div class="hero-bar">${parts.map(([,v,c])=>`<i style="flex:${v/ptot};background:${c}"></i>`).join('')}</div>`:''}
    <div class="hero-parts">${[['Accounts',w.cash,'#3E7BFA'],['Savings',w.savings,'#1FA2A0'],['Investments',w.inv,'#7C5CFC']].map(([l,v,c])=>`<div><span><i style="background:${c}"></i>${l}</span><b>${money(v)}</b></div>`).join('')}${w.owed?`<div><span><i style="background:#3CCB6E"></i>Owed to you</span><b>${money(w.owed)}</b></div>`:''}${w.owe?`<div><span><i style="background:#F2555A"></i>You owe</span><b>−${money(w.owe)}</b></div>`:''}</div></section>
  <div class="grid"><div class="stack">
  <section class="panel"><div class="panel-h"><h2>Your wallet</h2><button class="btn small" data-act="add" data-preset="transfer">Move money</button></div>
    <div class="wallet">${P().accounts.map(x=>`<button class="wcard" style="background:${accGrad(accColor(x))};color:${accInk(accColor(x))}" data-act="accView" data-v="${esc(x.id)}"><span class="chip-g"></span><span class="ty">${esc(x.bank||TYPE_LABEL[x.type]||x.type)}</span><span class="nm">${esc(x.name)}</span><span class="aroles" style="margin-top:6px">${roleChips(x)}</span><span class="bal">${money(b[x.id]||0)}</span></button>`).join('')}
      <button class="wcard add" data-act="editAcct" data-v="">+ Add account</button></div>
    <p class="hint" style="margin-top:10px">For a credit card, enter what you owe as a negative opening balance. Paying the card is a transfer from your bank to the card.</p></section>
  <section class="panel"><div class="panel-h"><h2>Investments</h2><button class="btn small primary" data-act="newHolding">Add investment</button></div>
    ${hs.length?`<div class="nw-parts" style="margin-bottom:12px"><span>Value <b>${money(invV)}</b></span><span>Put in <b>${money(invC)}</b></span><span>Gain <b class="amt ${invV-invC>=0?'pos':'neg'}">${money(invV-invC,{sign:true})} ${invC>0?`(${((invV-invC)/invC*100).toFixed(1)}%)`:''}</b></span></div>
      ${invV>0?`<div class="strip" style="height:14px;margin:4px 0 12px">${Object.entries(byType).filter(([,v])=>v>0).map(([t,v])=>`<button style="flex:${v} 1 0;background:${INV_COLORS[t]}" title="${INV_TYPES[t]}: ${money(v)}" aria-label="${INV_TYPES[t]}"></button>`).join('')}</div>
      <div class="chips" style="margin-bottom:8px">${Object.entries(byType).filter(([,v])=>v>0).map(([t,v])=>`<span class="chip"><span class="dot" style="background:${INV_COLORS[t]}"></span>${INV_TYPES[t]} ${(v/invV*100).toFixed(0)}%</span>`).join('')}</div>`:''}
      <div class="rows">${hs.map(({h,s})=>`<button class="rw" data-act="holding" data-v="${esc(h.id)}"><span><b>${esc(h.name)}</b><br><span class="muted" style="font-size:13px">${INV_TYPES[h.type]||h.type}${h.units?` · ${+h.units} units`:''}${s.valuedOn?` · valued ${shortD(s.valuedOn)}`:''}</span></span>
        <span style="text-align:right"><b>${money(s.value)}</b><br><span class="amt ${s.gain>=0?'pos':'neg'}" style="font-size:13px">${money(s.gain,{sign:true})} (${s.pct.toFixed(1)}%)</span></span></button>`).join('')}</div>`
    :'<p class="muted">Track stocks, funds, gold, crypto, property or deposits. Record what you put in and update the value when it changes — Masroof shows your gain or loss.</p>'}
  </section>

  </div><div class="stack">
  <section class="panel"><div class="panel-h"><h2>Savings goals</h2><button class="btn small primary" data-act="goal" data-v="">Add goal</button></div>
    ${P().goals.length?P().goals.map(g=>{const saved=goalSaved(g);const pct=g.target>0?saved/g.target*100:0;const mLeft=g.date?Math.max(1,(pd(g.date).getFullYear()-new Date().getFullYear())*12+pd(g.date).getMonth()-new Date().getMonth()):null;
      return `<button class="goal" data-act="goal" data-v="${esc(g.id)}" style="display:block;width:100%;background:none;border-left:0;border-right:0;border-bottom:0;text-align:left;padding:12px 0"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(g.name)}</b><span>${money(saved)} / ${money(g.target)}</span></div>
      <div class="prog"><i style="width:${Math.min(100,pct)}%"></i></div><span class="hint">${pct>=100?'Reached 🎉':`${pct.toFixed(0)}%${mLeft&&g.target>saved?` · save ${money((g.target-saved)/mLeft)} a month to reach it by ${fmtD(g.date,{month:'short',year:'numeric'})}`:''}`}${g.accountId?` · tracks ${esc(acctName(g.accountId))}`:''}</span></button>`}).join('')
    :'<p class="muted">A car, Hajj, a wedding, an emergency fund — set a target and see how much to put aside each month.</p>'}
  </section></div></div>`;
}
const goalSaved=g=>g.accountId&&acct(g.accountId)?(balances()[g.accountId]||0):(+g.saved||0);

/* ---------- Settings ---------- */
function viewSettings(){
  const p=P(),L=p.limits; const freqL={weekly:'Every week',monthly:'Every month',yearly:'Every year'};
  const rec=p.recurring.slice().sort((a,b)=>a.next<b.next?-1:1);
  const accOpen=(k,title,id)=>`<details class="panel acc"${id?` id="${id}"`:''} data-k="${k}"${(state.ui.sOpen||{})[k]?' open':''}><summary>${title}</summary>`;
  return `<div class="phead back-row"><button class="back" data-act="tab" data-v="home">${ICON.left} Home</button></div>`+pageHead('Settings','Make it yours',`<button class="round" data-act="lockNow" aria-label="Lock now">${ICON.lock}</button>`)+`<div class="plan">
  ${accOpen("Daily spending limit","Daily spending limit","limitsPanel")}<div class="acc-b">
    <div class="seg" role="group" style="margin-bottom:12px">${[['off','Off'],['fixed','Fixed amount'],['smart','Smart']].map(([v,l])=>`<button data-act="limMode" data-v="${v}" aria-pressed="${L.mode===v}">${l}</button>`).join('')}</div>
    ${L.mode==='fixed'?`<div class="field"><label for="limD">Daily limit (${esc(cur())})</label><input id="limD" class="inp" inputmode="decimal" value="${L.daily||''}" data-lim="daily" style="max-width:160px"></div>`:''}
    ${L.mode==='smart'?`<div class="field"><label for="limM">Monthly spending budget (${esc(cur())})</label><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="limM" class="inp" inputmode="decimal" value="${L.monthly||''}" data-lim="monthly" style="max-width:160px"><button class="btn small" data-act="limSuggest">Suggest from my income</button></div>
      <p class="hint">Each day’s limit = what’s left of this budget ÷ days left in the month. Spend less today and tomorrow’s limit grows; overspend and it shrinks.</p></div>`:''}
    ${L.mode!=='off'?`<div class="rows" style="margin-top:8px"><div class="rw"><span>What counts</span><select class="sel" data-lim="scope"><option value="daily"${L.scope==='daily'?' selected':''}>Day-to-day only (not bills or repeating payments)</option><option value="all"${L.scope==='all'?' selected':''}>All spending</option></select></div>
      <div class="rw"><span>Warn me at</span><select class="sel" data-lim="warnAt">${[50,70,80,90].map(v=>`<option value="${v}"${L.warnAt===v?' selected':''}>${v}% of the limit</option>`).join('')}</select></div></div>`:''}
  </div></details>
  ${accOpen("Repeats automatically","Repeats automatically")}<div class="acc-b">
    <p class="hint" style="margin-bottom:10px">Rent, bills, salary, savings and monthly investing. Added on their date without you doing anything.</p>
    ${rec.length?`<div class="rows">${rec.map(r=>`<div class="rw"><span><b>${esc(recLabel(r))}</b> <span class="amt ${r.type}">${money(r.amount)}</span><br><span class="muted">${freqL[r.freq]} · next ${fmtD(r.next,{day:'numeric',month:'short',year:'numeric'})}</span></span><button class="btn small danger" data-act="delRec" data-v="${esc(r.id)}">Stop</button></div>`).join('')}</div>`:'<p class="muted">Nothing scheduled yet.</p>'}
    <button class="btn" data-act="add" data-preset="repeat" style="margin-top:12px">Schedule a repeating payment</button></div></details>
  ${accOpen("Monthly budgets per category","Monthly budgets per category")}<div class="acc-b">
    <div class="rows">${p.categories.expense.map(c=>`<div class="rw"><span><span class="dot" style="background:${c.color}"></span> ${esc(c.name)}</span><input class="inp" style="width:110px;text-align:right" inputmode="decimal" placeholder="No limit" value="${p.budgets[c.id]||''}" data-budget="${esc(c.id)}" aria-label="Budget for ${esc(c.name)}"></div>`).join('')}</div></div></details>
  ${accOpen("Quick-add buttons","Quick-add buttons")}<div class="acc-b">
    <p class="hint" style="margin-bottom:8px">Pinned buttons always show on Home. Frequent purchases are added automatically next to them.</p>
    ${p.quick.length?`<div class="chips" style="margin-bottom:10px">${p.quick.map((q,i)=>`<span class="chip">${esc(q.label)} · ${money(q.amount)}<button class="x" data-act="unpin" data-i="${i}" aria-label="Remove">×</button></span>`).join('')}</div>`:''}
    <div class="two"><input class="inp" id="qpLabel" placeholder="Label, e.g. Karak"><input class="inp" id="qpAmt" inputmode="decimal" placeholder="Amount"></div>
    <div class="two" style="margin-top:8px"><select class="sel" id="qpCat">${p.categories.expense.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select><select class="sel" id="qpAcct">${acctOptions(defaultAcct())}</select></div>
    <button class="btn" data-act="pinQuick" style="margin-top:8px">Pin button</button></div></details>
  ${accOpen("Categories and items","Categories and items")}<div class="acc-b">
    <p class="hint">Rename, change the emoji or colour, add items (Pizza, Burger… inside Food). Everything here is yours to shape.</p>
    ${['expense','income'].map(type=>`<h3 style="font:600 14px var(--body);color:var(--muted);margin:16px 0 4px">${type==='expense'?'Spending':'Income'}</h3>`+p.categories[type].map(c=>`<div class="catblock"><div class="hd">
      <input class="inp ic" value="${esc(c.icon||'')}" data-catf="icon" data-type="${type}" data-v="${esc(c.id)}" aria-label="Emoji"><input class="inp nm" value="${esc(c.name)}" data-catf="name" data-type="${type}" data-v="${esc(c.id)}" aria-label="Name"><input type="color" value="${esc(c.color)}" data-catf="color" data-type="${type}" data-v="${esc(c.id)}" aria-label="Colour">
      <button class="btn small danger" data-act="delCat" data-type="${type}" data-v="${esc(c.id)}">Remove</button></div>
      <div class="chips">${c.items.map((it,i)=>`<span class="chip">${esc(it)}<button class="x" data-act="delItem" data-type="${type}" data-v="${esc(c.id)}" data-i="${i}" aria-label="Remove ${esc(it)}">×</button></span>`).join('')}
      <span class="inline-add"><input class="inp" placeholder="New item" data-newitem="${esc(c.id)}"><button class="btn small" data-act="addItem" data-v="${esc(c.id)}">Add</button></span></div></div>`).join('')+
      `<div class="inline-add" style="margin-top:10px"><input class="inp" style="width:190px" placeholder="New ${type==='expense'?'spending':'income'} category" data-newcat="${type}"><button class="btn small" data-act="addCat" data-type="${type}">Add category</button></div>`).join('')}</div></details>
    ${accOpen("Privacy & security","Privacy & security")}<div class="acc-b">
    <p class="hint" style="margin-bottom:8px">Your data is encrypted on this iPhone with AES‑256, using a key made from your passcode. Nothing is sent anywhere — the app works with no internet.</p>
    <div class="rows">
      <div class="rw"><span>Lock automatically</span><select class="sel" data-sec="autoLock">${[['0','When I leave the app'],['1','After 1 minute'],['5','After 5 minutes'],['15','After 15 minutes']].map(([v,l])=>`<option value="${v}"${String(secMeta.autoLock)===v?' selected':''}>${l}</option>`).join('')}</select></div>
      <div class="rw"><span>Too many wrong passcodes</span><select class="sel" data-sec="wipeAfter">${[['0','Slow down retries'],['10','Erase all data after 10']].map(([v,l])=>`<option value="${v}"${String(secMeta.wipeAfter)===v?' selected':''}>${l}</option>`).join('')}</select></div>
    </div>
    <div class="bar" style="margin:12px 0 0"><button class="btn" data-act="changePass">Change passcode</button><button class="btn" data-act="lockNow">Lock now</button></div></div></details>
  ${accOpen("Backups","Backups")}<div class="acc-b">
    <p class="hint" style="margin-bottom:8px">If you delete the app, lose the phone or forget the passcode, the data is gone. Save an encrypted backup to Files or iCloud Drive now and then — it opens only with the passcode you have when you make it.</p>
    <div class="rows"><div class="rw"><span>Last backup</span><span class="muted">${secMeta.lastBackup?fmtD(secMeta.lastBackup,{day:'numeric',month:'short',year:'numeric'}):'Never'}</span></div>
      <label class="rw"><span>Include receipt photos</span><input type="checkbox" id="bkReceipts"></label></div>
    <div class="bar" style="margin:12px 0 0"><button class="btn primary" data-act="backup">Save encrypted backup</button><button class="btn" data-act="restore">Restore a backup</button></div></div></details>

  ${accOpen("Home screen","Home screen")}<div class="acc-b"><p class="hint" style="margin-bottom:6px">Show or hide sections.</p>
    ${WIDGETS.map(([k,l])=>`<label class="toggle-row"><span>${l}</span><input type="checkbox" data-widget="${k}"${p.widgets[k]?' checked':''}></label>`).join('')}</div></details>
  ${accOpen("General","General")}<div class="acc-b"><div class="rows">
    <div class="rw"><span>Currency</span><select class="sel" data-change="currency">${CURRENCIES.map(([c])=>`<option${p.currency===c?' selected':''}>${c}</option>`).join('')}</select></div>
    <div class="rw"><span>Week starts on</span><select class="sel" data-change="weekStart">${[[0,'Sunday'],[6,'Saturday'],[1,'Monday']].map(([v,l])=>`<option value="${v}"${p.weekStart===v?' selected':''}>${l}</option>`).join('')}</select></div>
    <div class="rw"><span>Appearance</span><select class="sel" data-change="theme">${[['auto','Match device'],['light','Light'],['dark','Dark']].map(([v,l])=>`<option value="${v}"${p.theme===v?' selected':''}>${l}</option>`).join('')}</select></div>
    <div class="rw"><span>Data stored</span><span class="muted" style="text-align:right">Encrypted on this iPhone · ${esc(storageNote())}</span></div>
    <div class="rw"><span>Learned descriptions</span><span><span class="muted">${Object.keys(p.learned).length}</span> <button class="btn small" data-act="clearLearned">Forget</button></span></div></div>
    <div class="bar" style="margin:12px 0 0"><button class="btn" data-act="export">Export CSV</button>
      ${allTx().some(t=>t.demo)||p.people.some(x=>x.demo)?'<button class="btn" data-act="clearDemo">Remove demo data</button>':'<button class="btn" data-act="demo">Load demo data</button>'}
      <button class="btn danger" data-act="wipe">Erase everything</button></div></div></details>
  ${accOpen("About","About")}<div class="acc-b"><div class="about-wrap"><img class="about-logo" src="${LOGO_FULL()}" alt="Masroof — SMS money manager"></div><p class="hint" style="margin-top:10px">Masroof · your money, every account, in one place. Private by design: no accounts, no servers, no tracking.</p></div></details></div>`;
}

/* ===== v4 widgets ===== */
function donutHTML(s){
  const ents=Object.entries(s.byCat).filter(([,v])=>v.total>0).sort((x,y)=>y[1].total-x[1].total);
  const tot=sum(ents,e=>e[1].total);
  if(!tot) return `<div class="empty"><span class="big-emoji">🌱</span>Nothing spent in this period</div>`;
  const R=72,C=2*Math.PI*R,gap=ents.length>1?3:0; let off=0; const selId=state.ui.openCat;
  const arcs=ents.map(([id,v])=>{const c=cat(id); const len=v.total/tot*C; const dash=Math.max(.6,len-gap);
    const el=`<circle class="arc${selId===id?' sel':''}" cx="100" cy="100" r="${R}" stroke="${c.color}" stroke-dasharray="${dash.toFixed(2)} ${(C-dash).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" style="--c:${C.toFixed(1)}" transform="rotate(-90 100 100)" data-act="openCat" data-v="${esc(id)}"><title>${esc(c.name)} ${money(v.total)}</title></circle>`; off+=len; return el;}).join('');
  const sel=selId&&s.byCat[selId]; const sc=sel?cat(selId):null;
  const center=sel?`<text x="100" y="88" text-anchor="middle" font-size="22">${sc.icon||''}</text><text x="100" y="114" text-anchor="middle" font-family="ui-rounded,-apple-system,sans-serif" font-weight="800" font-size="21" fill="var(--ink)">${money(sel.total)}</text><text x="100" y="134" text-anchor="middle" font-size="12" fill="var(--muted)" font-weight="600">${Math.round(sel.total/tot*100)}% · ${esc(sc.name.split(' ')[0])}</text>`
    :`<text x="100" y="94" text-anchor="middle" font-size="12.5" fill="var(--muted)" font-weight="600">Spent</text><text x="100" y="118" text-anchor="middle" font-family="ui-rounded,-apple-system,sans-serif" font-weight="800" font-size="23" fill="var(--ink)">${money(tot)}</text>`;
  const top=ents.slice(0,5), rest=ents.slice(5);
  const leg=top.map(([id,v])=>{const c=cat(id);return `<button data-act="openCat" data-v="${esc(id)}"><span class="dot" style="background:${c.color}"></span><span>${esc(c.name)}</span><b>${Math.round(v.total/tot*100)}%</b></button>`}).join('')+(rest.length?`<div class="hint" style="padding-left:20px">+${rest.length} more below</div>`:'');
  return `<div class="donut-wrap"><svg class="donut${sel?' has-sel':''}" viewBox="0 0 200 200" role="img" aria-label="Spending by category">${arcs}${center}</svg><div class="legend">${leg}</div></div>`;
}
function smoothPath(pts){
  if(pts.length<2) return pts.length?`M${pts[0][0]},${pts[0][1]}`:'';
  let d=`M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2; const t=.18;
    const c1=[p1[0]+(p2[0]-p0[0])*t,p1[1]+(p2[1]-p0[1])*t], c2=[p2[0]-(p3[0]-p1[0])*t,p2[1]-(p3[1]-p1[1])*t];
    d+=` C${c1[0].toFixed(1)},${Math.max(0,c1[1]).toFixed(1)} ${c2[0].toFixed(1)},${Math.max(0,c2[1]).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;}
  return d;
}
function areaChartHTML(u){
  const [a,b]=periodRange(u.period,u.anchor); const t=todayStr();
  let main=[],prev=null,budget=null,labels=[],ticks=[],title,mode='plain';
  if(u.period==='month'){
    mode='cum'; title='This month vs last';
    const s=summarize(filterAcct(txBetween(a,b))).byDate; const n=dayDiff(a,b)+1;
    const [pa,pb]=periodRange('month',shiftAnchor('month',u.anchor,-1)); const ps=summarize(filterAcct(txBetween(pa,pb))).byDate; const pn=dayDiff(pa,pb)+1;
    let c=0,pc=0; prev=[];
    for(let i=0;i<n;i++){const k=ymd(addDays(pd(a),i)); c+=s[k]||0; main.push(k<=t?c:null); const pk=ymd(addDays(pd(pa),Math.min(i,pn-1))); if(i<pn) pc+=ps[pk]||0; prev.push(pc); labels.push(fmtD(k,{day:'numeric',month:'short'}));}
    const L=P().limits; if(L.mode==='smart'&&L.monthly>0&&L.scope==='all') budget=main.map((_,i)=>L.monthly*(i+1)/n);
    ticks=[0,Math.floor(n/2),n-1];
  } else {
    const bk=trendBuckets(u); main=bk.map(x=>x.key<=t.slice(0,x.key.length)?Math.max(0,x.value):null); labels=bk.map(x=>x.full);
    title={day:'Last 14 days',week:'This week, day by day',year:'Month by month'}[u.period]; ticks=bk.length>7?[0,Math.floor(bk.length/2),bk.length-1]:bk.map((_,i)=>i);
    state._tickLabels=bk.map(x=>x.label);
  }
  const vals=[...main,...(prev||[]),...(budget||[])].filter(v=>v!=null); const max=Math.max(1e-9,...vals);
  if(!main.some(v=>v>0)&&!(prev||[]).some(v=>v>0)) return `<section class="panel"><h2>${title}</h2><div class="empty"><span class="big-emoji">📈</span>Your chart appears once you record spending.</div></section>`;
  const W=340,H=160,pl=6,pr=6,pt=10,pb=24,n=main.length;
  const X=i=>pl+(n===1?0:i*(W-pl-pr)/(n-1)), Y=v=>pt+(H-pt-pb)*(1-v/max);
  const mp=main.map((v,i)=>v==null?null:[X(i),Y(v)]).filter(Boolean);
  const line=smoothPath(mp); const area=mp.length?line+` L${mp[mp.length-1][0].toFixed(1)},${H-pb} L${mp[0][0].toFixed(1)},${H-pb} Z`:'';
  const prevLine=prev?smoothPath(prev.map((v,i)=>[X(i),Y(v)])):''; const budLine=budget?`M${X(0)},${Y(budget[0])} L${X(n-1)},${Y(budget[n-1])}`:'';
  const tl=u.period==='month'?(i=>String(i+1)):(i=>state._tickLabels[i]);
  const lastI=main.reduce((m,v,i)=>v!=null?i:m,0);
  state._chart={n,W,main,prev,budget,labels,mode,max,pt,pb,H,pl,pr,lastI};
  return `<section class="panel"><h2>${title}</h2><div class="tip" id="chartTip">${chartTip(lastI)}</div>
    <div class="achart" id="achart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--brand-2)" stop-opacity=".35"/><stop offset="1" stop-color="var(--brand-2)" stop-opacity="0"/></linearGradient></defs>
      ${[.25,.5,.75].map(f=>`<line x1="${pl}" x2="${W-pr}" y1="${pt+(H-pt-pb)*f}" y2="${pt+(H-pt-pb)*f}" stroke="var(--line)" stroke-dasharray="3 5"/>`).join('')}
      ${budLine?`<path d="${budLine}" class="line" stroke="var(--gold)" stroke-width="2" stroke-dasharray="6 6" fill="none"/>`:''}
      ${prevLine?`<path d="${prevLine}" class="line" stroke="var(--muted)" stroke-opacity=".55" stroke-width="2" stroke-dasharray="2 5" fill="none"/>`:''}
      <path d="${area}" class="fill" fill="url(#ag)"/>
      <path d="${line}" class="line main" pathLength="1" stroke="var(--brand-2)"/>
      ${ticks.map(i=>`<text x="${X(i)}" y="${H-6}" font-size="11" text-anchor="${i===0?'start':i===n-1?'end':'middle'}" fill="var(--muted)">${esc(tl(i))}</text>`).join('')}
      <line id="cLine" x1="${X(lastI)}" x2="${X(lastI)}" y1="${pt}" y2="${H-pb}" stroke="var(--ink)" stroke-opacity=".25" stroke-width="1.5"/>
      <circle id="cDot" cx="${X(lastI)}" cy="${Y(main[lastI]||0)}" r="6" fill="var(--surface)" stroke="var(--brand-2)" stroke-width="3"/>
    </svg></div>
    ${mode==='cum'?`<div class="legend-inline"><span><i style="background:var(--brand-2)"></i>This month</span><span><i style="background:var(--muted)"></i>Last month</span>${budget?'<span><i style="background:var(--gold)"></i>Budget pace</span>':''}</div>`:''}
    <p class="hint" style="margin-top:6px">Drag across the chart to explore.</p></section>`;
}
function chartTip(i){
  const c=state._chart; if(!c) return ''; const v=c.main[i];
  if(c.mode==='cum') return `<b>${v==null?'—':money(v)}</b><span>spent by ${esc(c.labels[i])}${c.prev?`<br>last month: ${money(c.prev[i])}`:''}${c.budget?` · pace ${money(c.budget[i])}`:''}</span>`;
  return `<b>${money(v||0)}</b><span>${esc(c.labels[i])}</span>`;
}
function scrubChart(clientX){
  const c=state._chart, el=$('#achart'); if(!c||!el) return;
  const r=el.getBoundingClientRect(); const x=(clientX-r.left)/r.width*c.W;
  let i=Math.round((x-c.pl)/((c.W-c.pl-c.pr)/Math.max(1,c.n-1))); i=Math.max(0,Math.min(c.n-1,i)); if(c.main[i]==null) i=c.lastI;
  const X=c.pl+(c.n===1?0:i*(c.W-c.pl-c.pr)/(c.n-1)); const Y=c.pt+(c.H-c.pt-c.pb)*(1-(c.main[i]||0)/c.max);
  const ln=$('#cLine'),dt=$('#cDot'); ln.setAttribute('x1',X); ln.setAttribute('x2',X); dt.setAttribute('cx',X); dt.setAttribute('cy',Y);
  $('#chartTip').innerHTML=chartTip(i);
}
function priceChange(a,b){
  const now={},before={}; const from=ymd(addDays(pd(a),-150)), upto=ymd(addDays(pd(a),-1));
  const add=(map,t)=>{for(const l of (t.lines||[])){const k=norm(l.name); if(k.length<3||!(l.price>0)) continue; (map[k]||(map[k]={name:l.name,p:[]})).p.push(+l.price);}};
  for(const t of txBetween(a,b)) if(t.type==='expense') add(now,t);
  for(const t of txBetween(from,upto)) if(t.type==='expense') add(before,t);
  let best=null;
  for(const [k,v] of Object.entries(now)){ const bf=before[k]; if(!bf) continue; const n=sum(v.p)/v.p.length, o=sum(bf.p)/bf.p.length; const ch=(n-o)/o;
    if(Math.abs(ch)>=.08&&(!best||Math.abs(ch)>Math.abs(best.ch))) best={name:v.name,now:n,before:o,ch}; }
  return best;
}
function recapMonth(){ const d=new Date(); if(d.getDate()<=3){ const p=new Date(d.getFullYear(),d.getMonth()-1,1); return ymd(p).slice(0,7);} return todayStr().slice(0,7); }
function recapCardHTML(){
  const m=recapMonth(); const [y,mo]=m.split('-').map(Number); const cur=m===todayStr().slice(0,7);
  return `<button class="recap-card" data-act="recap" data-v="${m}"><span class="play">▶</span><span><b>Your ${MONTHS[mo-1]}${cur?' so far':''}</b><span>Tap to play your money story</span></span></button>`;
}
function subsHTML(){
  const mEq=r=>r.freq==='weekly'?r.amount*52/12:r.freq==='yearly'?r.amount/12:r.amount;
  const rec=P().recurring.filter(r=>r.type==='expense').sort((x,y)=>mEq(y)-mEq(x));
  const from=ymd(new Date(new Date().getFullYear(),new Date().getMonth()-3,1)); const groups={};
  for(const t of txBetween(from,todayStr())){ if(t.type!=='expense'||t.recurringId||t.refund||t.lines||t.split||!t.note) continue; const k=norm(t.note);
    const g=groups[k]||(groups[k]={months:new Set(),amts:[],last:t}); g.months.add(t.date.slice(0,7)); g.amts.push(t.amount); if(t.date>g.last.date) g.last=t; }
  const known=new Set(rec.map(r=>norm(r.note)));
  const sugg=Object.entries(groups).filter(([k,g])=>g.months.size>=3&&g.amts.length<=g.months.size+1&&Math.max(...g.amts)/Math.min(...g.amts)<=1.25&&!known.has(k)).map(([,g])=>g.last).slice(0,4);
  if(!rec.length&&!sugg.length) return '';
  const tot=sum(rec,mEq);
  return `<section class="panel subs"><h2>Subscriptions${rec.length?`<span class="aside">${money(tot)} a month · ${money(tot*12)} a year</span>`:''}</h2>
    ${rec.length?`<div class="rows">${rec.map(r=>`<div class="rw"><span>${esc(recLabel(r))}<small>${r.freq==='monthly'?'Monthly':r.freq==='weekly'?'Weekly':'Yearly'} · next ${r.next?shortD(r.next):'—'}</small></span><b>${money(r.amount)}</b></div>`).join('')}</div>`:''}
    ${sugg.length?`<p class="hint" style="margin:12px 0 4px">These look like they repeat every month:</p><div class="rows">${sugg.map(t=>`<div class="rw"><span>${esc(t.note)}<small>${money(t.amount)} · last on ${shortD(t.date)}</small></span><button class="btn small primary" data-act="makeRec" data-v="${esc(t.id)}">Auto-add</button></div>`).join('')}</div>`:''}</section>`;
}
/* ================= transaction dialog ================= */
let draft=null;
const blankLine=catId=>({name:'',qty:'1',price:'',catId:catId||P().categories.expense[0].id,item:'',who:[]});
function openTx(id,preset){
  if(id){ const t=allTx().find(x=>x.id===id); if(!t) return;
    draft={id:t.id,type:t.type,amount:String(t.amount),catId:t.catId||null,item:t.item||'',accountId:t.accountId,toAccountId:t.toAccountId,date:t.date,note:t.note||'',tags:(t.tags||[]).join(', '),
      manual:true,repeat:false,freq:'monthly',itemized:!!(t.lines&&t.lines.length),lines:clone(t.lines||[]).map(l=>({...l,qty:String(l.qty),price:String(l.price),who:l.who||[]})),
      tax:t.tax?String(t.tax):'',taxMode:'amt',service:t.service?String(t.service):'',serviceMode:'amt',discount:t.discount?String(t.discount):'',
      split:t.split?{on:true,paidBy:t.split.paidBy||'me',who:t.split.shares.map(s=>s.who),mode:t.split.mode||'equal',custom:Object.fromEntries(t.split.shares.map(s=>[s.who,String(s.amount)]))}:{on:false,paidBy:'me',who:['me'],mode:'equal',custom:{}},
      fx:t.fx?{on:true,cur:t.fx.cur,orig:String(t.fx.orig),rate:String(t.fx.rate)}:{on:false,cur:'USD',orig:'',rate:''},
      personId:t.personId||'',debtKind:t.debtKind||(t.dir==='receive'?'borrowed':'lent'),investmentId:t.investmentId||'',invDir:t.dir||'buy',units:t.units?String(t.units):'',
      receipt:t.receipt||null,auto:t.auto,demo:t.demo,recurringId:t.recurringId,ts:t.ts,imported:t.imported,refund:!!t.refund,inst:t.inst,repeatCount:''};
  } else {
    const acc=defaultAcct(); const save=(P().accounts.find(a=>hasRole(a,'savings')&&a.id!==acc)||P().accounts.find(a=>a.id!==acc)||{}).id;
    draft={id:null,type:'expense',amount:'',catId:null,item:'',accountId:acc,toAccountId:save,date:todayStr(),note:'',tags:'',manual:false,repeat:false,freq:'monthly',
      itemized:false,lines:[],tax:'',taxMode:'pct',service:'',serviceMode:'pct',discount:'',split:{on:false,paidBy:'me',who:['me'],mode:'equal',custom:{}},fx:{on:false,cur:cur()==='USD'?'AED':'USD',orig:'',rate:''},
      personId:(P().people[0]||{}).id||'',debtKind:'lent',investmentId:(P().investments[0]||{}).id||'',invDir:'buy',units:'',receipt:null,refund:false,repeatCount:''};
    if(preset==='split'){draft.split.on=true;}
    else if(preset==='lend'){draft.type='debt';}
    else if(preset==='transfer'){draft.type='transfer';}
    else if(preset==='repeat'){draft.repeat=true;}
    else if(preset&&typeof preset==='object') Object.assign(draft,preset);
  }
  renderTxDlg(); const d=$('#dlg'); if(!d.open) d.showModal();
  if(!id&&!preset) setTimeout(()=>{const a=$('#amt');if(a)a.focus()},60);
}
function calc(d){
  const dp=dec(); const r={subtotal:0,taxAmt:0,serviceAmt:0,disc:0,total:0,shares:{},lineTotals:[]};
  if(d.type==='expense'&&d.itemized){
    r.lineTotals=d.lines.map(lineTotal); r.subtotal=sum(r.lineTotals);
    r.taxAmt=d.taxMode==='pct'?r.subtotal*num(d.tax)/100:num(d.tax);
    r.serviceAmt=d.serviceMode==='pct'?r.subtotal*num(d.service)/100:num(d.service);
    r.disc=num(d.discount); r.total=round(r.subtotal+r.taxAmt+r.serviceAmt-r.disc,dp);
  } else if(d.fx.on&&d.type!=='transfer'&&d.type!=='debt'){ r.total=round(num(d.fx.orig)*num(d.fx.rate),dp); }
  else r.total=round(num(d.amount),dp);
  if(d.type==='expense'&&d.split.on&&d.split.who.length){
    const who=d.split.who; const S={};
    if(d.split.mode==='custom') for(const w of who) S[w]=round(num(d.split.custom[w]),dp);
    else if(d.split.mode==='items'&&d.itemized&&r.subtotal>0){
      for(const w of who) S[w]=0;
      d.lines.forEach((l,i)=>{const lw=(l.who&&l.who.length?l.who:who).filter(x=>who.includes(x)); const per=r.lineTotals[i]/(lw.length||1); for(const w of lw) S[w]+=per;});
      const k=r.total/r.subtotal; for(const w of who) S[w]=round(S[w]*k,dp);
    } else { const each=round(r.total/who.length,dp); for(const w of who) S[w]=each; }
    if(d.split.mode!=='custom'){ const diff=round(r.total-sum(Object.values(S)),dp); if(Math.abs(diff)>0){const tgt=who.includes(d.split.paidBy)?d.split.paidBy:who[0]; S[tgt]=round(S[tgt]+diff,dp);} }
    r.shares=S;
  }
  return r;
}
function catSelect(type,sel,attrs){return `<select class="sel" ${attrs}>${P().categories[type].map(c=>`<option value="${esc(c.id)}"${c.id===sel?' selected':''}>${esc(c.icon||'')} ${esc(c.name)}</option>`).join('')}</select>`}
function renderTxDlg(){
  const d=draft; const body=$('#dlg .dlg-b'); const sc=body?body.scrollTop:0;
  const title=d.id?'Edit':'New';
  const typeSeg=`<div class="seg types" role="group" aria-label="Type">${[['expense','Expense'],['income','Income'],['transfer','Transfer'],['debt','Lend'],['invest','Invest']].map(([v,l])=>`<button data-act="dType" data-v="${v}" aria-pressed="${d.type===v}">${l}</button>`).join('')}</div>`;
  let h='';
  if(d.type==='expense') h+=expenseBody(d);
  else if(d.type==='income') h+=incomeBody(d);
  else if(d.type==='transfer') h+=transferBody(d);
  else if(d.type==='debt') h+=debtBody(d);
  else h+=investBody(d);
  if(d.id) h+=`<div class="chips">${d.type==='expense'?'<button class="btn small" data-act="dPin">⭐ Make a quick button</button>':''}<button class="btn small" data-act="dCopy">Duplicate for today</button><button class="btn small danger" data-act="dDelete">Delete</button></div>`;
  h+=`<p class="err" id="dErr"></p>`;
  $('#dlg').innerHTML=`<div class="dlg"><div class="dlg-h"><h3>${title}</h3><button class="icon-btn" data-act="close" aria-label="Close">×</button></div>
    <div class="dlg-b">${typeSeg}${h}</div>
    <div class="dlg-f"><span class="spacer"></span><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="dSave" id="dSaveBtn">${d.id?'Save changes':'Save ✓'}</button></div></div>`;
  const nb=$('#dlg .dlg-b'); if(nb) nb.scrollTop=sc;
  updateCalc();
}
function repeatBlock(d){ let h='';
  if(!d.id&&d.type!=='debt'){ h+=`<label class="switch"><input type="checkbox" data-f="repeat" data-rr${d.repeat?' checked':''}> Repeat this automatically</label>`;
    if(d.repeat) h+=`<div class="sect"><div class="seg small" role="group" aria-label="How often" style="align-self:flex-start">${[['weekly','Weekly'],['monthly','Monthly'],['yearly','Yearly']].map(([v,l])=>`<button data-act="dFreq" data-v="${v}" aria-pressed="${d.freq===v}">${l}</button>`).join('')}</div>
      <div class="two"><div class="field"><label>Number of payments</label><input class="inp" inputmode="numeric" placeholder="Keeps going" value="${esc(d.repeatCount)}" data-f="repeatCount"></div><p class="hint" style="align-self:end">For installments or “buy now, pay later”, e.g. 6. Leave empty for rent, salary, subscriptions.</p></div></div><p class="hint">Added on ${shortD(d.date)} and then ${d.freq==='weekly'?'every week':d.freq==='monthly'?'on day '+pd(d.date).getDate()+' of every month':'every year'}${d.date>todayStr()?' (nothing recorded until then)':''}.</p>`; }
  return h; }

function acctChips(d,field,label){
  return `<div class="field"><span class="lab">${label}</span><div class="hscroll">${P().accounts.map(a=>`<button class="achipbtn" data-act="dAcct" data-field="${field}" data-v="${esc(a.id)}" aria-pressed="${d[field]===a.id}" style="--cc:${accColor(a)}"><i style="background:${accGrad(accColor(a))}"></i><span>${esc(a.name)}</span></button>`).join('')}</div></div>`;
}
function dateChips(d){
  const t=todayStr(), y=ymd(addDays(new Date(),-1));
  return `<div class="field"><span class="lab">When</span><div class="hscroll"><button class="chip" data-act="dDate" data-v="${t}" aria-pressed="${d.date===t}">Today</button><button class="chip" data-act="dDate" data-v="${y}" aria-pressed="${d.date===y}">Yesterday</button>
    <label class="chip datechip${d.date!==t&&d.date!==y?' on':''}">📅 ${d.date!==t&&d.date!==y?shortD(d.date):'Other day'}<input type="date" value="${esc(d.date)}" data-f="date" data-rr></label></div></div>`;
}
function moreBlock(d,inner,count){
  return `<button class="more-toggle" data-act="dMore" aria-expanded="${!!d._more}"><span>More options</span><small>${count}</small><i>⌄</i></button>${d._more?`<div class="more-body">${inner}</div>`:''}`;
}
const amountField=(d,ro,label)=>`<div class="field"><label for="amt">${label||'Amount'} (${esc(cur())})</label><input id="amt" class="amount-in" inputmode="decimal" autocomplete="off" placeholder="0.${'0'.repeat(dec())}" value="${esc(d.amount)}" data-f="amount"${ro?' readonly tabindex="-1"':''}></div>`;
const noteField=(d,label,ph)=>`<div class="field"><label for="note">${label}</label><input id="note" class="inp" placeholder="${ph}" value="${esc(d.note)}" data-f="note" autocomplete="off" list="dl-notes"></div>
  <datalist id="dl-notes">${[...new Set(allTx().map(t=>t.note).filter(Boolean))].slice(-60).map(n=>`<option value="${esc(n)}">`).join('')}</datalist>`;
const tagsField=d=>`<div class="field"><label for="tags">Tags <span class="muted" style="font-weight:400">— optional, e.g. trip, ramadan, work</span></label><input id="tags" class="inp" value="${esc(d.tags)}" data-f="tags" autocomplete="off"></div>`;
function catPicker(d,type){
  const cats=P().categories[type]; const c=d.catId?findCat(d.catId):null;
  let h=`<div class="field"><span class="lab">Category${!d.manual&&d.catId?' · picked for you':''}</span><div class="catrow">${cats.map(x=>`<button data-act="dCat" data-v="${esc(x.id)}" aria-pressed="${d.catId===x.id}" style="--cc:${x.color}"><span class="e">${x.icon||'•'}</span><span class="n">${esc(x.name.split(' ')[0].replace(/,$/,''))}</span></button>`).join('')}</div></div>`;
  if(c) h+=`<div class="hscroll itemrow">${c.items.map(it=>`<button class="chip" data-act="dItem" data-v="${esc(it)}" aria-pressed="${d.item===it}">${esc(it)}</button>`).join('')}<span class="inline-add"><input class="inp" id="newItemIn" placeholder="+ other"><button class="btn small" data-act="dNewItem">Add</button></span></div>`;
  return h;
}
function fxBlock(d){
  return `<label class="switch"><input type="checkbox" data-f="fx.on" data-rr${d.fx.on?' checked':''}> 💱 Paid in another currency</label>
  ${d.fx.on?`<div class="three"><div class="field"><label>Currency</label><select class="sel" data-f="fx.cur">${CURRENCIES.filter(c=>c[0]!==cur()).map(([c])=>`<option${d.fx.cur===c?' selected':''}>${c}</option>`).join('')}</select></div>
  <div class="field"><label>Amount in ${esc(d.fx.cur)}</label><input class="inp" inputmode="decimal" value="${esc(d.fx.orig)}" data-f="fx.orig"></div>
  <div class="field"><label>1 ${esc(d.fx.cur)} = ? ${esc(cur())}</label><input class="inp" inputmode="decimal" value="${esc(d.fx.rate)}" data-f="fx.rate" placeholder="rate"></div></div>`:''}`;
}
function expenseBody(d){
  const ro=d.itemized||d.fx.on; let h='';
  const showScan=canImages||d.receipt||d._blobUrl;
  if(showScan) h+=`<div class="scan">${canImages?`<button class="btn small" data-act="scan">📷 Scan receipt</button>`:''}<span class="hint" id="scanMsg" style="flex:1">${esc(d._scanMsg||'Read on your phone — the photo never leaves it')}</span>${d.receipt||d._blobUrl?`<button class="btn small" data-act="viewReceipt">View</button>`:''}</div>`;
  if(d._showReceipt&&d._blobUrl) h+=`<img class="receipt-img" src="${esc(d._blobUrl)}" alt="Receipt photo">`;
  h+=amountField(d,ro,ro?'Total':(d.refund?'Refund amount':'Amount'));
  h+=noteField(d,'What / where','e.g. Pizza Hut, Lulu, Omantel');
  if(d.itemized) h+=linesEditor(d); else h+=catPicker(d,'expense');
  h+=acctChips(d,'accountId',d.split.on&&d.split.paidBy!=='me'?'Your account':'Paid from');
  h+=dateChips(d);
  const on=[d.itemized&&'items',d.split.on&&'split',d.refund&&'refund',d.fx.on&&'currency',d.repeat&&'repeat',d.tags&&'tags'].filter(Boolean);
  if(on.length) d._more=true;
  const inner=`<div class="opts"><label class="switch"><input type="checkbox" data-f="itemized" data-rr${d.itemized?' checked':''}> 🧾 List items, tax & service</label>
    ${d.refund?'':`<label class="switch"><input type="checkbox" data-f="split.on" data-rr${d.split.on?' checked':''}> 👥 Split with friends</label>`}
    <label class="switch"><input type="checkbox" data-f="refund" data-rr${d.refund?' checked':''}> ↩️ Refund or return</label>
    ${d.itemized?'':fxBlock(d)}</div>
    ${d.split.on&&!d.refund?splitBlock(d,true):''}${repeatBlock(d)}${tagsField(d)}`;
  h+=moreBlock(d,inner,on.length?on.join(' · '):'items, split, refund, repeat…');
  return h;
}
function linesEditor(d){
  const splitItems=d.split.on&&d.split.mode==='items';
  const dl=P().categories.expense.map(c=>`<datalist id="dl-${esc(c.id)}">${c.items.map(i=>`<option value="${esc(i)}">`).join('')}</datalist>`).join('');
  return `<div class="sect"><div class="field"><span class="lab">Items on the bill</span>
    <div class="ln" style="font-size:12px;color:var(--muted);font-weight:600;padding-bottom:0"><span>Item</span><span>Qty</span><span>Price each</span><span style="text-align:right">Total</span><span></span></div>
    ${d.lines.map((l,i)=>`<div class="ln"><input class="inp" placeholder="e.g. Margherita large" value="${esc(l.name)}" data-f="lines.${i}.name" data-guess="${i}">
      <input class="inp" inputmode="decimal" value="${esc(l.qty)}" data-f="lines.${i}.qty" aria-label="Quantity"><input class="inp" inputmode="decimal" value="${esc(l.price)}" data-f="lines.${i}.price" placeholder="0.000" aria-label="Price each">
      <span class="lt" id="lt-${i}"></span><button class="x" data-act="lnDel" data-i="${i}" aria-label="Remove line">×</button>
      <div class="ln2">${catSelect('expense',l.catId||d.catId,`data-f="lines.${i}.catId" aria-label="Category"`)}<input class="inp" list="dl-${esc(l.catId||d.catId||'food')}" placeholder="Type (e.g. Pizza)" value="${esc(l.item)}" data-f="lines.${i}.item" style="width:140px" aria-label="Type">
      ${splitItems?`<span class="hint">for:</span>${d.split.who.map(w=>`<button class="chip" style="padding:2px 8px;font-size:12px" data-act="lnWho" data-i="${i}" data-v="${esc(w)}" aria-pressed="${(l.who&&l.who.length?l.who:d.split.who).includes(w)}">${esc(w==='me'?'Me':personName(w))}</button>`).join('')}`:''}</div></div>`).join('')}
    <button class="btn small" data-act="lnAdd" style="align-self:flex-start;margin-top:6px">+ Add item</button></div>${dl}
    <div class="tot"><span>Subtotal</span><b id="subT"></b>
      <span>Tax / VAT <span class="seg small" style="vertical-align:middle"><button data-act="taxMode" data-v="pct" aria-pressed="${d.taxMode==='pct'}">%</button><button data-act="taxMode" data-v="amt" aria-pressed="${d.taxMode==='amt'}">${esc(cur())}</button></span></span><span><input class="inp" inputmode="decimal" value="${esc(d.tax)}" data-f="tax" placeholder="0"> <span class="hint" id="taxT"></span></span>
      <span>Service charge <span class="seg small" style="vertical-align:middle"><button data-act="svcMode" data-v="pct" aria-pressed="${d.serviceMode==='pct'}">%</button><button data-act="svcMode" data-v="amt" aria-pressed="${d.serviceMode==='amt'}">${esc(cur())}</button></span></span><span><input class="inp" inputmode="decimal" value="${esc(d.service)}" data-f="service" placeholder="0"> <span class="hint" id="svcT"></span></span>
      <span>Discount (${esc(cur())})</span><input class="inp" inputmode="decimal" value="${esc(d.discount)}" data-f="discount" placeholder="0">
      <span class="grand">Total</span><b class="grand" id="totT"></b></div>
    <p class="hint" id="scanTotHint" style="color:var(--warn)"></p></div>`;
}
function splitBlock(d,noSwitch){
  let h=noSwitch?'':`<label class="switch"><input type="checkbox" data-f="split.on" data-rr${d.split.on?' checked':''}> Split with friends</label>`;
  if(!d.split.on) return h;
  const everyone=['me',...P().people.map(p=>p.id)];
  h+=`<div class="sect"><div class="field"><span class="lab">Who was in?</span><div class="chips">${everyone.map(w=>`<button class="chip" data-act="spWho" data-v="${esc(w)}" aria-pressed="${d.split.who.includes(w)}">${esc(w==='me'?'Me':personName(w))}</button>`).join('')}
    <span class="inline-add"><input class="inp" id="spNew" placeholder="New person"><button class="btn small" data-act="spAddPerson">Add</button></span></div></div>
    <div class="two"><div class="field"><label>Who paid?</label><select class="sel" data-f="split.paidBy" data-rr>${peopleOptions(d.split.paidBy,true)}</select></div>
    <div class="field"><span class="lab">How to split</span><div class="seg small">${[['equal','Equally'],['custom','Amounts'],...(d.itemized?[['items','By item']]:[])].map(([v,l])=>`<button data-act="spMode" data-v="${v}" aria-pressed="${d.split.mode===v}">${l}</button>`).join('')}</div></div></div>
    ${d.split.mode==='custom'?`<div class="rows">${d.split.who.map(w=>`<div class="rw"><span>${esc(w==='me'?'Me':personName(w))}</span><input class="inp" style="width:110px;text-align:right" inputmode="decimal" value="${esc(d.split.custom[w]||'')}" data-f="split.custom.${w}"></div>`).join('')}</div>`:''}
    ${d.split.mode==='items'?'<p class="hint">Tap names under each item to say who had it. Tax and service are shared in proportion.</p>':''}
    <p class="hint" id="shareSum" style="font-size:13.5px;color:var(--ink)"></p></div>`;
  return h;
}
function incomeBody(d){ const inner=`<div class="opts">${fxBlock(d)}</div>${repeatBlock(d)}${tagsField(d)}`;
  return amountField(d,d.fx.on)+noteField(d,'From','e.g. September salary')+catPicker(d,'income')+acctChips(d,'accountId','Into account')+dateChips(d)+moreBlock(d,inner,d.repeat?'repeat':'repeat, currency, tags'); }
function transferBody(d){ return amountField(d)+acctChips(d,'accountId','From')+acctChips(d,'toAccountId','To')+`<p class="hint">Moving money into a Savings account counts as saved. Paying a credit card or ATM cash is a transfer — not spending.</p>`+dateChips(d)+noteField(d,'Note','optional')+moreBlock(d,repeatBlock(d),d.repeat?'repeat':'repeat'); }
function debtBody(d){
  return `<div class="field"><span class="lab">What happened?</span><div class="seg small">${[['lent','I lent money'],['repaid_in','They paid me back'],['borrowed','I borrowed'],['repaid_out','I paid them back']].map(([v,l])=>`<button data-act="dKind" data-v="${v}" aria-pressed="${d.debtKind===v}">${l}</button>`).join('')}</div></div>
  <div class="field"><label>Person</label><div style="display:flex;gap:8px;flex-wrap:wrap">${P().people.length?`<select class="sel" data-f="personId" style="flex:1">${peopleOptions(d.personId)}</select>`:''}<span class="inline-add"><input class="inp" id="dbNew" placeholder="New person"><button class="btn small" data-act="dbAddPerson">Add</button></span></div></div>
  ${amountField(d)}${acctChips(d,'accountId',DEBT_KIND[d.debtKind][0]==='give'?'From account':'Into account')}${dateChips(d)}
  ${noteField(d,'Note','e.g. for the car repair')}<p class="hint">This isn’t counted as spending or income — it just moves money and updates what you and ${d.personId?esc(personName(d.personId)):'they'} owe each other.</p>`;
}
function investBody(d){
  return `<div class="field"><span class="lab">Buy or sell</span><div class="seg small">${[['buy','Put money in'],['sell','Take money out']].map(([v,l])=>`<button data-act="dInv" data-v="${v}" aria-pressed="${d.invDir===v}">${l}</button>`).join('')}</div></div>
  <div class="field"><label>Investment</label><div style="display:flex;gap:8px;flex-wrap:wrap">${P().investments.length?`<select class="sel" data-f="investmentId" style="flex:1">${P().investments.map(h=>`<option value="${esc(h.id)}"${h.id===d.investmentId?' selected':''}>${esc(h.name)}</option>`).join('')}</select>`:''}<span class="inline-add"><input class="inp" id="invNew" placeholder="New, e.g. Gold"><button class="btn small" data-act="invAdd">Add</button></span></div></div>
  ${amountField(d)}${acctChips(d,'accountId',d.invDir==='buy'?'Paid from':'Into account')}${dateChips(d)}<div class="field"><label>Units (optional)</label><input class="inp" inputmode="decimal" value="${esc(d.units)}" data-f="units" placeholder="e.g. grams, shares"></div>${noteField(d,'Note','optional')}${moreBlock(d,repeatBlock(d),'repeat')}`;
}
function updateCalc(){
  const d=draft; if(!d||!$('#dlg').open&&!$('#dlg .dlg')) return;
  const c=calc(d);
  const amt=$('#amt'); if(amt&&amt.readOnly) amt.value=c.total?money(c.total).replace(/,/g,''):'';
  if(d.itemized&&d.type==='expense'){ c.lineTotals.forEach((v,i)=>{const e=$('#lt-'+i); if(e) e.textContent=v?money(v):'';});
    const set=(id,v)=>{const e=$(id); if(e) e.textContent=v}; set('#subT',money(c.subtotal)); set('#taxT',d.taxMode==='pct'&&c.taxAmt?'= '+money(c.taxAmt):''); set('#svcT',d.serviceMode==='pct'&&c.serviceAmt?'= '+money(c.serviceAmt):''); set('#totT',money(c.total)+' '+cur());
    const hint=$('#scanTotHint'); if(hint) hint.textContent=d._scanTotal&&Math.abs(d._scanTotal-c.total)>10**-dec()*5?`The receipt says ${money(d._scanTotal)} — check the items, tax or discount.`:''; }
  const ss=$('#shareSum');
  if(ss&&d.split.on){ const sh=c.shares; const mine=sh.me||0; const payer=d.split.paidBy;
    let t=`Your share: ${money(mine)}. `;
    if(payer==='me') { const o=d.split.who.filter(w=>w!=='me').map(w=>`${personName(w)} owes you ${money(sh[w]||0)}`); t+=o.join(', ')+(o.length?'.':''); }
    else t+=mine?`You owe ${personName(payer)} ${money(mine)}.`:'';
    if(d.split.mode==='custom'){const diff=round(c.total-sum(Object.values(sh)),dec()); if(Math.abs(diff)>0) t+=` (${money(Math.abs(diff))} ${diff>0?'not assigned yet':'too much assigned'})`;}
    ss.textContent=t; }
}
function setPath(o,path,v){const ks=path.split('.');let x=o;for(let i=0;i<ks.length-1;i++){x=x[ks[i]]}x[ks[ks.length-1]]=v}

function alertSnapshot(){
  const t=todayStr(); const [a,b]=periodRange('month',t); const s=summarize(txBetween(a,b));
  return {day:todayStatus(),cats:Object.fromEntries(Object.entries(s.byCat).map(([k,v])=>[k,v.total]))};
}
function checkAlerts(pre,tx){
  if(!tx||tx.type!=='expense') return;
  const post=alertSnapshot(); const L=P().limits; const msgs=[];
  if(tx.date===todayStr()&&post.day.limit!=null){
    if(pre.day.left>=0&&post.day.left<0) return showOverAlert(post.day);
    if(post.day.left<0&&post.day.spent>pre.day.spent) msgs.push(`Now ${money(-post.day.left)} over today’s limit`);
    else if(pre.day.pct<L.warnAt&&post.day.pct>=L.warnAt) msgs.push(`${Math.round(post.day.pct)}% of today’s limit used — ${money(post.day.left)} left`);
  }
  if(tx.date.slice(0,7)===todayStr().slice(0,7)) for(const [id,bud] of Object.entries(P().budgets)){ if(!(bud>0)) continue; const b4=pre.cats[id]||0, af=post.cats[id]||0;
    if(b4<=bud&&af>bud) msgs.push(`${cat(id).name} is over its monthly budget by ${money(af-bud)}`);
    else if(b4<bud*.9&&af>=bud*.9&&af<=bud) msgs.push(`${cat(id).name}: 90% of the monthly budget used`); }
  if(msgs.length) setTimeout(()=>toast(msgs.join(' · '),{bad:post.day.left<0}),250);
}
function showOverAlert(st){
  const L=P().limits; let tomorrow='';
  if(L.mode==='smart'){ const t=ymd(addDays(new Date(),1)); if(t.slice(0,7)===todayStr().slice(0,7)) tomorrow=`Tomorrow’s limit drops to <b>${money(limitFor(t))}</b> so you stay inside this month’s budget.`; }
  const d=$('#askDlg');
  d.innerHTML=`<div class="dlg"><div class="dlg-b" style="padding-top:22px"><div class="muted" style="font-weight:600">You’ve gone over today’s limit</div><div class="alert-big">${money(-st.left)} ${esc(cur())} over</div>
    <p style="margin:0">Spent ${money(st.spent)} today against a limit of ${money(st.limit)}.</p>${tomorrow?`<p style="margin:0">${tomorrow}</p>`:''}</div>
    <div class="dlg-f"><button class="btn" data-a="undo">Undo last entry</button><span class="spacer"></span><button class="btn primary" data-a="ok">Got it</button></div></div>`;
  d.onclick=e=>{const b=e.target.closest('[data-a]'); if(!b) return; d.close(); if(b.dataset.a==='undo'&&lastUndo){lastUndo();lastUndo=null;toast('Removed');}};
  d.oncancel=null; d.showModal();
}

async function saveDraft(){
  const d=draft; const dp=dec(); const c=calc(d); const err=m=>{const e=$('#dErr'); if(e){e.textContent=m; e.scrollIntoView({block:'nearest'});}};
  if(!(c.total>0)) return err(d.itemized?'Add at least one item with a price.':'Enter an amount above zero.');
  if(!d.date) return err('Pick a date.');
  let catId=d.catId;
  if(d.type==='expense'&&d.itemized){ const lines=d.lines.filter(l=>lineTotal(l)>0); if(!lines.length) return err('Add at least one item with a price.');
    const byC={}; for(const l of lines){const k=l.catId||d.catId||'other'; byC[k]=(byC[k]||0)+lineTotal(l);} catId=Object.entries(byC).sort((a,b)=>b[1]-a[1])[0][0]; }
  if((d.type==='expense'||d.type==='income')&&!catId) return err('Pick a category.');
  if(d.type==='transfer'&&(!d.toAccountId||d.toAccountId===d.accountId)) return err('Choose two different accounts.');
  if(d.type==='debt'&&!person(d.personId)) return err('Add or choose a person.');
  if(d.type==='invest'&&!holding(d.investmentId)) return err('Add or choose an investment.');
  if(d.type==='expense'&&d.split.on){ if(d.split.who.length<2&&d.split.paidBy==='me') return err('Pick at least one friend to split with.');
    if(d.split.paidBy!=='me'&&!d.split.who.includes('me')) return err('Include yourself, or it isn\u2019t your expense.');
    if(Math.abs(round(sum(Object.values(c.shares))-c.total,dp))>0) return err('Shares need to add up to the total.'); }
  const pre=alertSnapshot();
  const tx={id:d.id||newId(),type:d.type,amount:c.total,date:d.date,accountId:d.accountId,note:(d.note||'').trim(),ts:d.ts||Date.now()};
  const tags=String(d.tags||'').split(/[,#]/).map(s=>norm(s).replace(/\s+/g,'-')).filter(Boolean); if(tags.length) tx.tags=[...new Set(tags)];
  if(d.type==='expense'||d.type==='income'){ tx.catId=catId; tx.item=d.itemized?'':(d.item||''); }
  if(d.type==='expense'&&d.itemized){
    tx.lines=d.lines.filter(l=>lineTotal(l)>0).map(l=>{const o={name:l.name.trim(),qty:num(l.qty)||1,price:round(num(l.price),dp+1),catId:l.catId||catId,item:(l.item||'').trim()}; if(d.split.on&&d.split.mode==='items'&&l.who&&l.who.length) o.who=l.who.filter(w=>d.split.who.includes(w)); return o;});
    if(c.taxAmt) tx.tax=round(c.taxAmt,dp); if(c.serviceAmt) tx.service=round(c.serviceAmt,dp); if(c.disc) tx.discount=round(c.disc,dp);
  }
  if(d.type==='expense'&&d.split.on) tx.split={paidBy:d.split.paidBy,mode:d.split.mode==='items'&&!d.itemized?'equal':d.split.mode,shares:d.split.who.map(w=>({who:w,amount:c.shares[w]||0}))};
  if(d.fx.on&&(d.type==='expense'&&!d.itemized||d.type==='income')) tx.fx={cur:d.fx.cur,orig:num(d.fx.orig),rate:num(d.fx.rate)};
  if(d.type==='transfer') tx.toAccountId=d.toAccountId;
  if(d.type==='debt'){ tx.personId=d.personId; tx.debtKind=d.debtKind; tx.dir=DEBT_KIND[d.debtKind][0]; }
  if(d.type==='invest'){ tx.investmentId=d.investmentId; tx.dir=d.invDir; if(num(d.units)) tx.units=num(d.units); }
  for(const k of ['auto','demo','recurringId','imported','inst']) if(d[k]) tx[k]=d[k];
  if(d.type==='expense'&&d.refund){ tx.refund=true; delete tx.split; }
  tx.receipt=d.receipt||undefined; if(!tx.receipt) delete tx.receipt;
  if(d._blob&&assetsNs){ const btn=$('#dSaveBtn'); if(btn){btn.disabled=true;btn.textContent='Saving receipt…';}
    try{const r=await assetsNs.upload(d._blob,{type:'image/jpeg'}); tx.receipt=r.id;}catch(e){toast('Receipt photo couldn\u2019t be stored — the details are saved');} }
  let profileChanged=false;
  if(d.repeat&&!d.id){
    const r={id:newId(),freq:d.freq,day:pd(d.date).getDate()}; for(const f of REC_FIELDS) if(tx[f]!=null) r[f]=clone(tx[f]);
    const cnt=Math.round(num(d.repeatCount)); if(cnt>1){ r.count=cnt; r.done=d.date>todayStr()?0:1; if(r.done) tx.inst=`1/${cnt}`; }
    P().recurring.push(r); profileChanged=true;
    if(d.date>todayStr()){ r.next=d.date; persist('profile'); $('#dlg').close(); toast('Scheduled — first on '+shortD(d.date)); render(); return; }
    r.next=advance(r,d.date); tx.recurringId=r.id;
  }
  const touched=new Set(); let old=null;
  if(d.id) for(const [k,arr] of Object.entries(state.months)){const i=arr.findIndex(t=>t.id===d.id); if(i>=0){old=arr.splice(i,1)[0];touched.add(k);}}
  const k=d.date.slice(0,7); (state.months[k]||(state.months[k]=[])).push(tx); touched.add(k);
  if(tx.note&&tx.catId&&!tx.lines){learn(tx.note,tx.catId,tx.item); profileChanged=true;}
  if(tx.lines) for(const l of tx.lines){ if(l.name&&l.item) learn(l.name,l.catId,l.item); const cc=findCat(l.catId); if(cc&&l.item&&!cc.items.includes(l.item)) cc.items.push(l.item); profileChanged=true; }
  touched.forEach(persistMonth); if(profileChanged) persist('profile');
  lastUndo=()=>{ for(const [kk,arr] of Object.entries(state.months)){const i=arr.findIndex(t=>t.id===tx.id); if(i>=0){arr.splice(i,1);persistMonth(kk);}} if(old){(state.months[old.date.slice(0,7)]||(state.months[old.date.slice(0,7)]=[])).push(old);persistMonth(old.date.slice(0,7));} render(); };
  if(d._blobUrl) URL.revokeObjectURL(d._blobUrl);
  $('#dlg').close();
  celebrate(); toast(d.id?'Changes saved':(tx.refund?'Refund saved':({expense:'Expense saved',income:'Income saved',transfer:'Transfer saved',debt:'Saved',invest:'Investment saved'})[d.type]),{undo:lastUndo});
  render(); checkAlerts(pre,tx);
}

/* ================= small dialogs ================= */
let fd=null; // generic form data
function dlg(title,body,foot){ $('#dlg').innerHTML=`<div class="dlg"><div class="dlg-h"><h3>${title}</h3><button class="icon-btn" data-act="close" aria-label="Close">×</button></div><div class="dlg-b">${body}<p class="err" id="fErr"></p></div><div class="dlg-f">${foot}</div></div>`; if(!$('#dlg').open) $('#dlg').showModal(); }
const fErr=m=>{const e=$('#fErr'); if(e) e.textContent=m};

function openPerson(id){
  const p=person(id); if(!p) return; const v=peopleBalances()[id]||0; const list=personTx(id);
  fd={kind:'person',id,name:p.name,phone:p.phone||''};
  dlg(esc(p.name),`<div><div class="muted" style="font-weight:600">${Math.abs(v)<10**-dec()?'All settled':v>0?`${esc(p.name)} owes you`:`You owe ${esc(p.name)}`}</div><div class="alert-big" style="color:${v>0?'var(--earn)':v<0?'var(--spend)':'var(--ink)'}">${money(Math.abs(v))} ${esc(cur())}</div></div>
    <div class="chips">${v>0?`<button class="btn small primary" data-act="pSettle" data-v="in">They paid me back</button><button class="btn small" data-act="pRemind">Copy reminder</button>`:''}${v<0?`<button class="btn small primary" data-act="pSettle" data-v="out">I paid them back</button>`:''}
      <button class="btn small" data-act="pLend">Lend</button><button class="btn small" data-act="pBorrow">Borrow</button><button class="btn small" data-act="pSplit">Split a bill</button></div>
    <div class="field"><span class="lab">History</span>${list.length?`<div class="rows">${list.map(t=>{const e=personEffect(t,id);return `<button class="rw" data-act="edit" data-v="${esc(t.id)}"><span>${esc(t.type==='debt'?(DEBT_KIND[t.debtKind]||['','Money'])[1].replace(':','')+' ':'')}${esc(t.note||t.item||cat(t.catId).name)} <span class="muted">· ${shortD(t.date)}${t.split?' · bill '+money(t.amount):''}</span></span><b class="amt ${e>0?'pos':'neg'}">${e>0?'+':'−'}${money(Math.abs(e))}</b></button>`}).join('')}</div><p class="hint">+ means they owe you more, − means less.</p>`:'<p class="muted">Nothing shared yet.</p>'}</div>
    <div class="field"><label>Name</label><input class="inp" value="${esc(fd.name)}" data-fd="name"></div>`,
    `<button class="btn danger" data-act="pDelete">Delete</button><span class="spacer"></span><button class="btn" data-act="close">Close</button><button class="btn primary" data-act="pSave">Save name</button>`);
}
function openHolding(id){
  const h=id?holding(id):null;
  if(!h){ fd={kind:'hold',id:null,name:'',type:'stocks',units:'',base:'',from:'owned',accountId:defaultAcct(),date:todayStr()};
    dlg('Add investment',`<div class="two"><div class="field"><label>Name</label><input class="inp" data-fd="name" placeholder="e.g. Gold 50g, Apple shares, Bank deposit"></div><div class="field"><label>Type</label><select class="sel" data-fd="type">${Object.entries(INV_TYPES).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></div></div>
      <div class="two"><div class="field"><label>Amount you put in (${esc(cur())})</label><input class="inp" inputmode="decimal" data-fd="base"></div><div class="field"><label>Units (optional)</label><input class="inp" inputmode="decimal" data-fd="units" placeholder="grams, shares…"></div></div>
      <div class="field"><span class="lab">Where did the money come from?</span><select class="sel" data-fd="from"><option value="owned">I already own it — don’t touch my accounts</option><option value="account">Pay from an account now</option></select></div>
      <div class="two"><div class="field"><label>Account</label><select class="sel" data-fd="accountId">${acctOptions(fd.accountId)}</select></div><div class="field"><label>Date</label><input type="date" class="inp" value="${fd.date}" data-fd="date"></div></div>`,
      `<span class="spacer"></span><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="hCreate">Add investment</button>`);
    return; }
  const s=holdingStats(h); fd={kind:'hold',id:h.id,name:h.name,type:h.type,units:h.units?String(h.units):'',value:'',price:''};
  const hist=(h.history||[]).slice().sort((a,b)=>a.date<b.date?1:-1);
  const txs=allTx().filter(t=>t.type==='invest'&&t.investmentId===h.id).sort((a,b)=>a.date<b.date?1:-1);
  dlg(esc(h.name),`<div class="nw-parts"><span>Value <b>${money(s.value)}</b></span><span>Put in <b>${money(s.contributed)}</b></span><span>Gain <b class="amt ${s.gain>=0?'pos':'neg'}">${money(s.gain,{sign:true})} (${s.pct.toFixed(1)}%)</b></span></div>
    <div class="sect"><div class="field"><span class="lab">Update today’s value</span><div class="two"><input class="inp" inputmode="decimal" data-fd="value" placeholder="Total value now">${h.units?`<input class="inp" inputmode="decimal" data-fd="price" placeholder="or price per unit">`:'<span></span>'}</div>
      <button class="btn small primary" data-act="hValue" style="align-self:flex-start">Save value</button></div></div>
    <div class="chips"><button class="btn small" data-act="hBuy">Put more in</button><button class="btn small" data-act="hSell">Take money out</button><button class="btn small" data-act="hMonthly">Invest monthly</button></div>
    ${hist.length||txs.length?`<div class="field"><span class="lab">History</span><div class="rows">${[...hist.map(x=>({d:x.date,t:'Valued at',v:money(x.value)})),...txs.map(t=>({d:t.date,t:t.dir==='sell'?'Took out':'Put in',v:money(t.amount)}))].sort((a,b)=>a.d<b.d?1:-1).map(r=>`<div class="rw"><span>${r.t} <span class="muted">· ${shortD(r.d)}</span></span><b>${r.v}</b></div>`).join('')}</div></div>`:''}
    <div class="two"><div class="field"><label>Name</label><input class="inp" value="${esc(fd.name)}" data-fd="name"></div><div class="field"><label>Units</label><input class="inp" inputmode="decimal" value="${esc(fd.units)}" data-fd="units"></div></div>
    <div class="field"><label>Type</label><select class="sel" data-fd="type">${Object.entries(INV_TYPES).map(([v,l])=>`<option value="${v}"${fd.type===v?' selected':''}>${l}</option>`).join('')}</select></div>`,
    `<button class="btn danger" data-act="hDelete">Delete</button><span class="spacer"></span><button class="btn" data-act="close">Close</button><button class="btn primary" data-act="hSave">Save details</button>`);
}
function openGoal(id){
  const g=id?P().goals.find(x=>x.id===id):null;
  fd=g?{kind:'goal',...g,target:String(g.target),saved:String(g.saved||''),add:''}:{kind:'goal',id:null,name:'',target:'',date:'',accountId:'',saved:'',add:''};
  dlg(g?esc(g.name):'New savings goal',`<div class="field"><label>Goal</label><input class="inp" value="${esc(fd.name)}" data-fd="name" placeholder="e.g. New car, Emergency fund"></div>
    <div class="two"><div class="field"><label>Target (${esc(cur())})</label><input class="inp" inputmode="decimal" value="${esc(fd.target)}" data-fd="target"></div><div class="field"><label>By (optional)</label><input type="date" class="inp" value="${esc(fd.date||'')}" data-fd="date"></div></div>
    <div class="field"><label>Track progress with</label><select class="sel" data-fd="accountId"><option value="">Amounts I add by hand</option>${P().accounts.map(a=>`<option value="${esc(a.id)}"${a.id===fd.accountId?' selected':''}>Balance of ${esc(a.name)}</option>`).join('')}</select></div>
    ${g&&!g.accountId?`<div class="sect"><div class="field"><label>Add to this goal (${esc(cur())})</label><div style="display:flex;gap:8px"><input class="inp" inputmode="decimal" data-fd="add" style="flex:1"><button class="btn small primary" data-act="gAdd">Add</button></div><p class="hint">Saved so far: ${money(+g.saved||0)}</p></div></div>`:''}`,
    `${g?'<button class="btn danger" data-act="gDelete">Delete</button>':''}<span class="spacer"></span><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="gSave">Save</button>`);
}
function addPerson(name){ name=(name||'').trim(); if(!name) return null; const ex=P().people.find(p=>norm(p.name)===norm(name)); if(ex) return ex.id; const id='p_'+newId(); P().people.push({id,name}); persist('profile'); return id; }
function addHolding(name,type){ name=(name||'').trim(); if(!name) return null; const id='h_'+newId(); P().investments.push({id,name,type:type||'other',history:[],baseCost:0}); persist('profile'); return id; }

/* ================= bank message import ================= */
let imp={text:'',rows:[],busy:false,ctl:null,msg:''};
function openImport(){imp={text:'',rows:[],busy:false,ctl:null,msg:''};renderImport();if(!$('#dlg').open)$('#dlg').showModal()}
function renderImport(){
  const catOpts=(type,sel)=>P().categories[type==='income'?'income':'expense'].map(c=>`<option value="${esc(c.id)}"${c.id===sel?' selected':''}>${esc(c.name)}</option>`).join('');
  $('#dlg').innerHTML=`<div class="dlg"><div class="dlg-h"><h3>Import from bank messages</h3><button class="icon-btn" data-act="close" aria-label="Close">×</button></div><div class="dlg-b">
    ${imp.rows.length?`<p class="hint">Check each one, adjust if needed, then import. Duplicates of things you already recorded are unticked.</p><div style="display:flex;flex-direction:column;gap:8px">${imp.rows.map((r,i)=>`<div class="rv"><input type="checkbox" data-imp="on" data-i="${i}"${r.on?' checked':''} aria-label="Include">
      <span><b>${esc(r.merchant||'Transaction')}</b>${r.dup?' <span class="pill">already recorded?</span>':''}<br><span class="muted" style="font-size:13px">${fmtD(r.date,{day:'numeric',month:'short',year:'numeric'})}</span></span><b class="amt ${r.type}">${r.type==='income'?'+':'−'}${money(r.amount)}</b>
      <div class="sub"><select class="sel" data-imp="catId" data-i="${i}">${catOpts(r.type,r.catId)}</select><input class="inp" data-imp="item" data-i="${i}" value="${esc(r.item)}" placeholder="Type" style="width:120px"><select class="sel" data-imp="accountId" data-i="${i}">${acctOptions(r.accountId)}</select></div></div>`).join('')}</div>`
    :`<p class="hint">Paste the SMS alerts your bank sends, or rows copied from a statement — many at once is fine.</p><textarea class="inp" rows="9" data-imptext placeholder="Your card ending 1234 was used for OMR 4.200 at PIZZA HUT MUSCAT on 28/09/2026">${esc(imp.text)}</textarea>`}
    <p class="hint">${esc(imp.msg)}</p></div>
    <div class="dlg-f">${imp.rows.length?`<button class="btn" data-act="impBack">Back</button><span class="spacer"></span><button class="btn primary" data-act="impDo">Import ${imp.rows.filter(r=>r.on).length}</button>`
    :`<span class="spacer"></span><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="impLocal">Read messages</button>`}</div></div>`;
}
function markDups(rows){ const ex=allTx(); for(const r of rows){ r.dup=ex.some(t=>t.date===r.date&&Math.abs(t.amount-r.amount)<1e-6); if(r.dup) r.on=false; } return rows; }
function localParse(text){
  // messages separated by blank lines keep their line breaks together; otherwise each line is one message (statement rows)
  const chunks=(/\n\s*\n/.test(text)?text.split(/\n\s*\n/):text.split(/\r?\n/)).map(s=>s.replace(/\s+/g,' ').trim()).filter(Boolean); const out=[];
  const amtRe=/(?:OMR|RO|R\.O\.?|AED|SAR|USD|KWD|BHD|QAR|EUR|GBP|INR|\$)\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s*(?:OMR|RO|R\.O\.?|AED|SAR|USD|KWD|BHD|QAR)/i;
  for(const c of chunks){ const m=c.match(amtRe); if(!m||/\botp\b|one.?time|password|declined/i.test(c)) continue;
    const amount=num((m[1]||m[2])); if(!(amount>0)) continue;
    const type=/credited|received|deposit|salary|refund|credit of/i.test(c)&&!/debited|purchase|spent|used|paid/i.test(c)?'income':'expense';
    let date=todayStr(); const dm=c.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
    if(dm){let y=+dm[3];if(y<100)y+=2000;const dd=new Date(y,+dm[2]-1,+dm[1]);if(!isNaN(dd)) date=ymd(dd);} else {const im=c.match(/\d{4}-\d{2}-\d{2}/); if(im) date=im[0];}
    let merchant=''; const mm=c.match(/\b(?:at|to|from)\s+([A-Za-z0-9&'.\- ]{2,40}?)(?:\s+on\b|\s+dated|[.,]|$)/i); if(mm) merchant=mm[1].replace(/\s*\b(?:OMR|RO|R\.O|AED|SAR|USD|KWD|BHD|QAR|EUR|GBP|INR)\b.*$/i,'').trim();
    if(type==='income'&&/salary/i.test(c)) merchant='Salary'; if(!merchant) merchant=c.slice(0,40);
    const g=guessCategory(merchant+' '+c,type)||{catId:type==='income'?'inc_other':'other',item:''};
    out.push({on:true,date,type,amount:round(amount,dec()),merchant,catId:g.catId,item:g.item||'',accountId:guessAcctFromText(c)||defaultAcct()}); }
  return markDups(out);
}
function doImport(){
  const rows=imp.rows.filter(r=>r.on); if(!rows.length) return; const touched=new Set(); const ids=[];
  for(const r of rows){ const tx={id:newId(),type:r.type,amount:r.amount,date:r.date,accountId:r.accountId,catId:r.catId,item:r.item||'',note:r.merchant,ts:Date.now(),imported:true};
    ids.push(tx.id); const k=r.date.slice(0,7);(state.months[k]||(state.months[k]=[])).push(tx);touched.add(k);
    const c=findCat(r.catId); if(c&&r.item&&!c.items.includes(r.item)) c.items.push(r.item); learn(r.merchant,r.catId,r.item); }
  touched.forEach(persistMonth); persist('profile'); $('#dlg').close(); celebrate();
  toast(`Imported ${rows.length} transaction${rows.length>1?'s':''}`,{undo:()=>{removeIds(ids);render();}}); render();
}
function removeIds(ids){const set=new Set(ids); for(const [k,arr] of Object.entries(state.months)){const n=arr.length; state.months[k]=arr.filter(t=>!set.has(t.id)); if(state.months[k].length!==n) persistMonth(k);}}

/* ================= demo, export, confirm, toast ================= */
function loadDemo(){
  const dp=dec(); const rnd=(a,b)=>round(a+Math.random()*(b-a),dp); const pick=a=>a[Math.floor(Math.random()*a.length)];
  const A=P().accounts; const id=t=>(A.find(a=>a.type===t)||A[0]).id; const bank=id('bank'),card=id('card'),cash=id('cash'),save=(A.find(a=>a.type==='savings')||{}).id;
  const themes={bank:['Bank Muscat','#C8102E',['salary','spending']],card:['Bank Muscat','#15325B',['spending']],cash:['Cash','#C99A2E',['spending']],savings:['Sohar International','#141414',['savings']]};
  for(const a of A){ const th=themes[a.type]; if(th&&!a.bank){ a.bank=th[0]; a.color=th[1]; a.roles=th[2]; a.demoTheme=true; } }
  const ali={id:'p_demo_ali',name:'Ali',demo:true},sara={id:'p_demo_sara',name:'Sara',demo:true},khalid={id:'p_demo_khalid',name:'Khalid',demo:true};
  for(const x of [ali,sara,khalid]) if(!person(x.id)) P().people.push(x);
  const gold={id:'h_demo_gold',name:'Gold (50 g)',type:'gold',units:50,baseCost:1100,history:[{date:ymd(addDays(new Date(),-20)),value:1260}],demo:true};
  const fund={id:'h_demo_fund',name:'MSX index fund',type:'funds',baseCost:0,history:[],demo:true};
  for(const h of [gold,fund]) if(!holding(h.id)) P().investments.push(h);
  if(!P().goals.some(g=>g.demo)) P().goals.push({id:'g_demo',name:'Emergency fund',target:3000,accountId:save||'',date:ymd(new Date(new Date().getFullYear()+1,5,1)),demo:true});
  const food=[['Pizza','Pizza Hut',3,6],['Burger','McDonald\u2019s',1.5,3.5],['Rice & biryani','Biryani house',1.5,3],['Shawarma','Shawarma stand',.5,1.2],['Coffee','Starbucks',1.2,2.2],['Tea & karak','Karak',.1,.3],['Chicken','KFC',2,4]];
  const touched=new Set(); const push=t=>{t.id=newId();t.demo=true;t.ts=Date.now();const k=t.date.slice(0,7);(state.months[k]||(state.months[k]=[])).push(t);touched.add(k)};
  const end=new Date(); let d=addDays(end,-120);
  for(;ymd(d)<=ymd(end);d=addDays(d,1)){ const ds=ymd(d),day=d.getDate(),dow=d.getDay();
    const n=Math.random()<.25?0:1+Math.floor(Math.random()*2); for(let i=0;i<n;i++){const [it,nt,a,b]=pick(food); push({type:'expense',amount:rnd(a,b),date:ds,accountId:Math.random()<.4?cash:card,catId:'food',item:it,note:nt});}
    if(dow===5){ const lines=[['Tomatoes 1kg','groceries','Vegetables',1,.45],['Chicken breast','groceries','Meat & chicken',2,1.9],['Milk 2L','groceries','Dairy & eggs',2,.95],['Arabic bread','groceries','Bread & bakery',3,.25],['Basmati rice 5kg','groceries','Rice & grains',1,4.2],['Dettol spray','household','Cleaning',1,1.35],['Tissues','household','Tissues & paper',1,1.1],['Shampoo','shopping','Personal care',1,2.3],['Water 6-pack','groceries','Drinks & water',1,.9]].filter(()=>Math.random()<.8)
        .map(([name,catId,item,qty,price])=>({name,catId,item,qty,price:round(price*(0.9+Math.random()*.2),dp)}));
      const sub=sum(lines,lineTotal); const tax=round(sub*0.05,dp); push({type:'expense',amount:round(sub+tax,dp),date:ds,accountId:card,catId:'groceries',item:'',note:pick(['Lulu','Carrefour','Nesto']),lines,tax}); }
    if(dow===3) push({type:'expense',amount:rnd(7,11),date:ds,accountId:card,catId:'transport',item:'Fuel',note:pick(['Shell','Oman Oil','Al Maha'])});
    if(dow===4&&Math.random()<.6){ const lines=[{name:'Mixed grill platter',catId:'food',item:'Grills',qty:1,price:9.5},{name:'Chicken biryani',catId:'food',item:'Rice & biryani',qty:2,price:3.2},{name:'Fresh lemon mint',catId:'food',item:'Juice & drinks',qty:3,price:1.1},{name:'Kunafa',catId:'food',item:'Sweets & desserts',qty:1,price:2.5}];
      const sub=sum(lines,lineTotal); const tax=round(sub*.05,dp),service=round(sub*.05,dp); const total=round(sub+tax+service,dp); const each=round(total/3,dp);
      const who=pick([[ali.id,sara.id],[ali.id,khalid.id],[sara.id,khalid.id]]); const paidBy=Math.random()<.7?'me':who[0];
      push({type:'expense',amount:total,date:ds,accountId:card,catId:'food',item:'',note:'Dinner at Bin Ateeq',lines,tax,service,split:{paidBy,mode:'equal',shares:[{who:'me',amount:round(total-each*2,dp)},{who:who[0],amount:each},{who:who[1],amount:each}]},tags:['friends']}); }
    if(day===1) push({type:'expense',amount:250,date:ds,accountId:bank,catId:'bills',item:'Rent',note:'Apartment rent'});
    if(day===5){ push({type:'expense',amount:rnd(18,45),date:ds,accountId:bank,catId:'bills',item:'Electricity',note:'Nama electricity'}); push({type:'expense',amount:rnd(7,14),date:ds,accountId:bank,catId:'bills',item:'Water',note:'Water bill'}); }
    if(day===8){ push({type:'expense',amount:20,date:ds,accountId:bank,catId:'bills',item:'Internet',note:'Awasr fibre'}); push({type:'expense',amount:10,date:ds,accountId:card,catId:'bills',item:'Mobile',note:'Omantel'}); }
    if(day===12) push({type:'expense',amount:3.5,date:ds,accountId:card,catId:'fun',item:'Subscriptions',note:'Netflix'});
    if(Math.random()<.05) push({type:'expense',amount:rnd(8,45),date:ds,accountId:card,catId:'shopping',item:pick(['Clothes','Electronics','Perfume','Shoes']),note:pick(['City Centre','Amazon','Noon'])});
    if(Math.random()<.04) push({type:'expense',amount:rnd(2,12),date:ds,accountId:cash,catId:'health',item:'Pharmacy',note:'Muscat Pharmacy'});
    if(day===24) push({type:'income',amount:1200,date:ds,accountId:bank,catId:'salary',item:'Monthly salary',note:'Salary'});
    if(day===25&&save) push({type:'transfer',amount:200,date:ds,accountId:bank,toAccountId:save,note:'Monthly saving'});
    if(day===10||day===26) push({type:'transfer',amount:40,date:ds,accountId:bank,toAccountId:cash,note:'ATM withdrawal'});
    if(day===20) push({type:'transfer',amount:round(200+Math.random()*60,dp),date:ds,accountId:bank,toAccountId:card,note:'Credit card payment'});
    if(day===26) push({type:'invest',amount:100,date:ds,accountId:bank,investmentId:fund.id,dir:'buy',note:'Monthly investing'});
  }
  push({type:'debt',amount:50,date:ymd(addDays(end,-18)),accountId:cash,personId:khalid.id,debtKind:'lent',dir:'give',note:'Car repair'});
  push({type:'debt',amount:20,date:ymd(addDays(end,-6)),accountId:cash,personId:khalid.id,debtKind:'repaid_in',dir:'receive',note:'Part payment'});
  fund.history=[{date:ymd(addDays(end,-3)),value:round(sum(allTx().filter(t=>t.investmentId===fund.id),t=>t.amount)*1.04,dp)}];
  if(P().limits.mode==='off'){P().limits.mode='smart';P().limits.monthly=450;}
  if(!Object.keys(P().budgets).length){ P().budgets={food:120,groceries:110,shopping:60,transport:50}; P().demoBudgets=true; }
  touched.forEach(persistMonth); persist('profile'); toast('Demo data added — remove it any time in Settings'); render();
}
function clearDemo(){
  for(const [k,arr] of Object.entries(state.months)){const n=arr.length;state.months[k]=arr.filter(t=>!t.demo);if(state.months[k].length!==n)persistMonth(k);}
  const p=P(); if(p.demoBudgets){ p.budgets={}; delete p.demoBudgets; }
  for(const a of p.accounts) if(a.demoTheme){ delete a.bank; delete a.demoTheme; delete a.color; a.roles=a.type==='savings'?['savings']:['spending']; }
  p.people=p.people.filter(x=>!x.demo); p.investments=p.investments.filter(x=>!x.demo); p.goals=p.goals.filter(x=>!x.demo); persist('profile');
  toast('Demo data removed'); render();
}
async function exportCSV(){
  if(!downloadsNs) return; const q=v=>{let x=String(v??''); if(typeof v==='string'&&/^[=+\-@\t\r]/.test(x)) x="'"+x; return `"${x.replace(/"/g,'""')}"`;}; // a leading ' stops spreadsheets running text as a formula
  const rows=[['Date','Type','Total','Your share','Currency','Category','Item / line','Description','Account','Other side','Tax','Service','Tags']];
  for(const t of allTx().sort((a,b)=>a.date<b.date?-1:1)){
    const other=t.toAccountId?acctName(t.toAccountId):t.personId?personName(t.personId):t.investmentId?(holding(t.investmentId)||{}).name:t.split?t.split.shares.filter(s=>s.who!=='me').map(s=>personName(s.who)).join(' + '):'';
    rows.push([t.date,t.type,t.amount,t.type==='expense'?round(myShare(t),dec()):'',cur(),t.catId?cat(t.catId).name:'',t.item||'',t.note||'',acctName(t.accountId),other,t.tax||'',t.service||'',(t.tags||[]).join(' ')]);
    for(const l of (t.lines||[])) rows.push([t.date,'line',round(lineTotal(l),dec()),'',cur(),cat(l.catId).name,l.item||'',`${l.name} × ${l.qty}`,'','','','','']);
  }
  try{const r=await downloadsNs.save({filename:`masroof-${todayStr()}.csv`,data:rows.map(r=>r.map(q).join(',')).join('\n')}); if(r&&r.status==='saved') toast('CSV saved');}catch(e){}
}
function ask(msg,ok){return new Promise(res=>{const d=$('#askDlg');
  d.innerHTML=`<div class="dlg"><div class="dlg-b" style="padding-top:20px"><p style="margin:0;font-size:16px">${esc(msg)}</p></div><div class="dlg-f"><span class="spacer"></span><button class="btn" data-a="no">Cancel</button><button class="btn primary" data-a="yes">${esc(ok)}</button></div></div>`;
  d.onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;d.close();res(b.dataset.a==='yes')}; d.oncancel=()=>res(false); d.showModal();})}
let tt,lastUndo=null;
function toast(m,o={}){const t=$('#toast'); t.innerHTML=`<span>${esc(m)}</span>${o.undo?'<button data-act="undo">Undo</button>':''}`; t.classList.toggle('bad',!!o.bad); t._undo=o.undo||null; t.classList.add('on'); clearTimeout(tt); tt=setTimeout(()=>t.classList.remove('on'),o.undo?6000:3200);}
async function copyText(s){ try{await navigator.clipboard.writeText(s);return true}catch(e){ const ta=document.createElement('textarea');ta.value=s;document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(_){}ta.remove();return ok;} }

/* quick add */
function quickAddText(text){
  text=(text||'').trim(); if(!text) return;
  const q=parseQuick(text);
  if(!(q.amount>0)||!q.guess){ openTx(null,{type:q.type,amount:q.amount?String(q.amount):'',note:q.desc,accountId:q.accountId,tags:q.tags.join(', '),catId:q.guess?q.guess.catId:null,item:q.guess?q.guess.item:'',manual:false}); return; }
  saveQuick({label:q.desc,amount:q.amount,catId:q.guess.catId,item:q.guess.item,accountId:q.accountId,tags:q.tags,type:q.type});
}
function saveQuick(c){
  const pre=alertSnapshot();
  const tx={id:newId(),type:c.type||'expense',amount:round(c.amount,dec()),date:todayStr(),accountId:acct(c.accountId)?c.accountId:defaultAcct(),catId:c.catId,item:c.item||'',note:c.label||'',ts:Date.now()};
  if(c.tags&&c.tags.length) tx.tags=c.tags;
  const k=tx.date.slice(0,7);(state.months[k]||(state.months[k]=[])).push(tx);persistMonth(k);
  if(tx.note){learn(tx.note,tx.catId,tx.item);persist('profile');}
  lastUndo=()=>{removeIds([tx.id]);render();};
  celebrate(); toast(`${tx.note||tx.item} · ${money(tx.amount)} saved to ${cat(tx.catId).name}${tx.item?' › '+tx.item:''}`,{undo:lastUndo});
  render(false); checkAlerts(pre,tx);
}
const LOGO_MARK='./images/logo-mark.jpg';
const LOGO_FULL=()=>'./images/logo.jpg';
/* ================= v5: accounts as themed cards ================= */
const CARD_COLORS=[['Red','#C8102E'],['Black','#141414'],['Emerald','#0A8F5B'],['Navy','#15325B'],['Royal blue','#1D4ED8'],['Teal','#0F766E'],['Purple','#6D28D9'],['Maroon','#7A1F2B'],['Orange','#EA580C'],['Gold','#C99A2E'],['Silver','#9AA4B2'],['Rose','#DB2777']];
const TYPE_COLOR={bank:'#0A8F5B',card:'#15325B',cash:'#C99A2E',wallet:'#6D28D9',savings:'#1D4ED8'};
const ROLES=[['salary','💼 Salary comes in'],['spending','🛒 Daily spending'],['savings','🏦 Savings'],['bills','🧾 Bills'],['investing','📈 Investing'],['travel','✈️ Travel']];
const BANKS=['Bank Muscat','Sohar International','Bank Dhofar','National Bank of Oman','Oman Arab Bank','HSBC Oman','Ahli Bank','Bank Nizwa','Alizz Islamic Bank','Oman Housing Bank','Cash','Other'];
function hexRgb(h){h=String(h||'#0A8F5B').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return [n>>16&255,n>>8&255,n&255]}
const rgbHex=([r,g,b])=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const mix=(h,to,k)=>{const a=hexRgb(h),b=hexRgb(to);return rgbHex(a.map((v,i)=>v+(b[i]-v)*k))};
const lum=h=>{const [r,g,b]=hexRgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b};
const accColor=a=>a&&a.color||TYPE_COLOR[a&&a.type]||'#0A8F5B';
function accGrad(c){ const dark=lum(c)<.03; const c2=dark?mix(c,'#ffffff',.22):mix(c,'#000000',.42); const c3=dark?mix(c,'#ffffff',.08):mix(c,'#ffffff',.12);
  return `radial-gradient(90% 80% at 100% 0%,${c3} 0%,transparent 60%),linear-gradient(145deg,${c} 0%,${c2} 100%)`; }
const accInk=c=>lum(c)>.45?'#0B1220':'#FFFFFF';
const ALL_GRAD='radial-gradient(90% 70% at 105% -5%,rgba(60,203,110,.45) 0%,transparent 60%),radial-gradient(70% 60% at -10% 110%,rgba(31,162,160,.35) 0%,transparent 60%),linear-gradient(155deg,#071A33,#15457A)';
const hasRole=(a,r)=>!!a&&((a.roles||[]).includes(r)||(r==='savings'&&a.type==='savings'));
function accFlows(list,id){ // money into / out of one account
  let inn=0,out=0;
  for(const t of list){
    if(t.type==='expense'){ if(t.accountId===id&&paidByMe(t)){ if(t.refund) inn+=t.amount; else out+=t.amount; } }
    else if(t.type==='income'){ if(t.accountId===id) inn+=t.amount; }
    else if(t.type==='transfer'){ if(t.accountId===id) out+=t.amount; if(t.toAccountId===id) inn+=t.amount; }
    else if(t.type==='debt'){ if(t.accountId===id){ if(t.dir==='give') out+=t.amount; else inn+=t.amount; } }
    else if(t.type==='invest'){ if(t.accountId===id){ if(t.dir==='sell') inn+=t.amount; else out+=t.amount; } }
  }
  return {inn,out};
}
function balanceSeries(id,days){ // end-of-day balance for the last N days
  const b=balances(); let bal=id==='all'?sum(P().accounts,a=>b[a.id]||0):(b[id]||0);
  const out=[]; const byDay={};
  const from=ymd(addDays(new Date(),-days+1));
  for(const t of txBetween(from,todayStr())){ let d=0;
    const f=(aid,v)=>{ if(id==='all'||aid===id) d+=v; };
    if(t.type==='expense'){ if(paidByMe(t)) f(t.accountId,t.refund?t.amount:-t.amount); }
    else if(t.type==='income') f(t.accountId,t.amount);
    else if(t.type==='transfer'){ f(t.accountId,-t.amount); f(t.toAccountId,t.amount); }
    else if(t.type==='debt') f(t.accountId,t.dir==='give'?-t.amount:t.amount);
    else if(t.type==='invest') f(t.accountId,t.dir==='sell'?t.amount:-t.amount);
    byDay[t.date]=(byDay[t.date]||0)+d; }
  for(let i=0;i<days;i++){ const k=ymd(addDays(new Date(),-i)); out.unshift(bal); bal-=byDay[k]||0; }
  return out;
}
function sparkSVG(vals,color){
  const W=300,H=64,min=Math.min(...vals),max=Math.max(...vals),r=max-min||1;
  const pts=vals.map((v,i)=>[i*(W/(vals.length-1||1)),6+(H-12)*(1-(v-min)/r)]);
  const d='M'+pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' L');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".45"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    <path d="${d} L${W},${H} L0,${H} Z" fill="url(#sg)"/><path d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" pathLength="1" class="spark"/></svg>`;
}
function roleChips(a,light){ return (a.roles||[]).map(r=>{const x=ROLES.find(z=>z[0]===r); return x?`<span class="rchip">${x[1]}</span>`:''}).join(''); }
/* account detail sheet */
function openAccountSheet(id){
  const a=acct(id); if(!a) return; const c=accColor(a); const b=balances(); const [ma,mb]=periodRange('month',todayStr());
  const fl=accFlows(txBetween(ma,mb),id); const ser=balanceSeries(id,30);
  const recent=allTx().filter(t=>t.accountId===id||t.toAccountId===id).sort((x,y)=>x.date===y.date?(y.ts||0)-(x.ts||0):(x.date<y.date?1:-1)).slice(0,6);
  const spentHere=sum(txBetween(ma,mb).filter(t=>t.type==='expense'&&t.accountId===id&&paidByMe(t)),t=>t.refund?-t.amount:t.amount);
  fd={kind:'accview',id};
  dlg(esc(a.name),`<div class="acard big" style="background:${accGrad(c)};color:${accInk(c)}"><span class="achip"></span><span class="abank">${esc(a.bank||TYPE_LABEL[a.type])}</span><span class="aname">${esc(a.name)}${a.last4?` · •••• ${esc(a.last4)}`:''}</span><span class="abal"><small>${esc(cur())}</small>${money(b[id]||0)}</span><span class="aroles">${roleChips(a)}</span></div>
    <div class="panel" style="padding:14px"><div class="panel-h" style="margin-bottom:4px"><h2 style="font-size:16px">Last 30 days</h2><span class="hint">${money(ser[0])} → ${money(ser[ser.length-1])}</span></div>${sparkSVG(ser,lum(c)<.03?'var(--ink)':c)}</div>
    <div class="two"><div class="panel" style="padding:14px"><span class="hint">In this month</span><div style="font:800 22px var(--display);color:var(--earn)">${fl.inn?'+':''}${money(fl.inn)}</div></div><div class="panel" style="padding:14px"><span class="hint">Out this month</span><div style="font:800 22px var(--display);color:var(--spend)">${fl.out?'−':''}${money(fl.out)}</div></div></div>
    ${hasRole(a,'savings')&&spentHere>0?`<p class="hint" style="color:var(--warn);font-weight:600">⚠️ ${money(spentHere)} was spent directly from this savings account this month.</p>`:''}
    <div class="chips"><button class="chip" data-act="accAdd" data-v="${esc(id)}">＋ Expense from here</button><button class="chip" data-act="accIncome" data-v="${esc(id)}">＋ Money in</button><button class="chip" data-act="accMove" data-v="${esc(id)}">↔ Move money</button><button class="chip" data-act="accShow" data-v="${esc(id)}">Show on Home</button></div>
    <div class="field"><span class="lab">Recent</span>${recent.length?`<div class="tx-group">${recent.map(txRow).join('')}</div>`:'<p class="hint">Nothing yet.</p>'}</div>`,
    `<span class="spacer"></span><button class="btn" data-act="editAcct" data-v="${esc(id)}">Edit card</button><button class="btn primary" data-act="close">Done</button>`);
}
/* account editor with live preview */
function openAcct(id){
  const a=id?acct(id):null;
  fd=a?{kind:'acct',...clone(a),opening:String(a.opening||0),roles:(a.roles||[]).slice(),color:accColor(a)}:{kind:'acct',id:null,name:'',bank:'',type:'bank',opening:'0',roles:['spending'],color:CARD_COLORS[P().accounts.length%CARD_COLORS.length][1],last4:''};
  renderAcctEditor(!!a);
}
function renderAcctEditor(isEdit){
  const f=fd; const body=$('#dlg .dlg-b'); const sc=body?body.scrollTop:0;
  dlg(isEdit?'Edit card':'New account',`<div class="acard big" id="accPreview" style="background:${accGrad(f.color)};color:${accInk(f.color)}"><span class="achip"></span><span class="abank" id="pvBank">${esc(f.bank||TYPE_LABEL[f.type])}</span><span class="aname" id="pvName">${esc(f.name||'Account name')}${f.last4?` · •••• ${esc(f.last4)}`:''}</span><span class="abal"><small>${esc(cur())}</small>${money(previewBal(f))}</span><span class="aroles">${roleChips(f)}</span></div>
    <div class="field"><label>Bank</label><input class="inp" list="bankList" value="${esc(f.bank||'')}" placeholder="e.g. Bank Muscat" data-fd="bank" data-live><datalist id="bankList">${BANKS.map(b=>`<option value="${esc(b)}">`).join('')}</datalist></div>
    <div class="two"><div class="field"><label>Account name</label><input class="inp" value="${esc(f.name)}" placeholder="e.g. Salary account" data-fd="name" data-live></div><div class="field"><label>Last 4 digits</label><input class="inp" inputmode="numeric" maxlength="4" value="${esc(f.last4||'')}" placeholder="optional" data-fd="last4" data-live></div></div>
    <div class="field"><span class="lab">Card colour</span><div class="swatches">${CARD_COLORS.map(([n,c])=>`<button data-act="accColor" data-v="${c}" aria-label="${n}" aria-pressed="${f.color.toLowerCase()===c.toLowerCase()}" style="background:${accGrad(c)}"></button>`).join('')}<label class="swatch-custom" aria-label="Custom colour"><input type="color" value="${esc(f.color)}" data-fd="color" data-live>🎨</label></div></div>
    <div class="field"><span class="lab">What do you use it for?</span><div class="chips">${ROLES.map(([r,l])=>`<button class="chip" data-act="accRole" data-v="${r}" aria-pressed="${f.roles.includes(r)}">${l}</button>`).join('')}</div>
      <p class="hint">Money moved into an account marked Savings counts as saved. Spending straight from it is flagged.</p></div>
    <div class="two"><div class="field"><label>Type</label><select class="sel" data-fd="type" data-live>${Object.entries(TYPE_LABEL).map(([v,l])=>`<option value="${v}"${f.type===v?' selected':''}>${l}</option>`).join('')}</select></div>
    <div class="field"><label>Opening balance</label><input class="inp" inputmode="decimal" value="${esc(f.opening)}" data-fd="opening" data-live></div></div>
    <p class="hint">Opening balance = what it held before you started tracking. For a credit card, enter what you owe as a negative number.</p>`,
    `${isEdit?'<button class="btn danger" data-act="aDelete">Delete</button>':''}<span class="spacer"></span><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="aSave">Save</button>`);
  const nb=$('#dlg .dlg-b'); if(nb) nb.scrollTop=sc;
}
const previewBal=f=>f.id&&acct(f.id)?(balances()[f.id]||0)-(+acct(f.id).opening||0)+num(f.opening):num(f.opening);
function updateAcctPreview(){
  const f=fd, p=$('#accPreview'); if(!p||!f) return;
  p.style.background=accGrad(f.color); p.style.color=accInk(f.color);
  $('#pvBank').textContent=f.bank||TYPE_LABEL[f.type]; $('#pvName').textContent=(f.name||'Account name')+(f.last4?` · •••• ${f.last4}`:'');
  p.querySelector('.abal').innerHTML=`<small>${esc(cur())}</small>${money(previewBal(f))}`;
}
/* ================= v10: living details ================= */
/* rolling odometer numbers */
function odoHTML(v,from){
  const t=money(v); let f=money(from==null?v:from);
  if(f.length>t.length) f=f.slice(f.length-t.length); else f=f.padStart(t.length,'0');
  const strip='<span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>';
  return `<span class="odo" role="text" aria-label="${t}">${[...t].map((ch,i)=>/\d/.test(ch)?`<span class="od" aria-hidden="true"><span class="od-s" data-to="${ch}" style="transform:translateY(-${(/\d/.test(f[i])?+f[i]:0)*10}%)">${strip}</span></span>`:`<span class="od-p" aria-hidden="true">${ch}</span>`).join('')}</span>`;
}
function runOdometers(){
  const els=[...document.querySelectorAll('.od-s[data-to]')]; if(!els.length) return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    els.forEach((el,i)=>{ const n=el.closest('.odo'); const idx=[...n.querySelectorAll('.od-s')].indexOf(el);
      el.style.transition=reduce?'none':`transform ${0.7+idx*0.07}s cubic-bezier(.2,.9,.25,1.02)`; el.style.transform=`translateY(-${el.dataset.to*10}%)`; el.removeAttribute('data-to'); });
  }));
}
/* sliding tab indicator */
function moveTabIndicator(){
  const bar=$('#tabs .in'); if(!bar) return; let ind=bar.querySelector('.tab-ind'); if(!ind){ ind=document.createElement('span'); ind.className='tab-ind'; bar.prepend(ind); }
  const b=bar.querySelector('button[aria-current="page"]'); if(!b){ ind.style.opacity='0'; return; }
  ind.style.opacity='1'; ind.style.width=b.offsetWidth-12+'px'; ind.style.transform=`translateX(${b.offsetLeft+6}px)`;
}
window.addEventListener('resize',()=>moveTabIndicator());
/* merchant-style avatars */
function initials(s){ const w=String(s||'').replace(/[^\p{L}\p{N} ]/gu,'').trim().split(/\s+/).filter(Boolean); if(!w.length) return '•'; return (w[0][0]+(w[1]?w[1][0]:(w[0][1]||''))).toUpperCase(); }
function nameColor(s){ let h=0; for(const c of String(s)) h=(h*31+c.charCodeAt(0))>>>0; const hues=[152,205,265,330,20,40,185,230,290,0]; return `hsl(${hues[h%hues.length]} 62% 46%)`; }
function rowAvatar(t,ico,color){
  if(t.type==='transfer'){ const a=acct(t.toAccountId); const c=a?accColor(a):'#3450AE'; return `<span class="mav" style="background:${accGrad(c)}">↔</span>`; }
  if(t.type==='debt') return `<span class="mav" style="background:${avatarColor(t.personId)}">${esc(initials(personName(t.personId)))}<span class="bdg">🤝</span></span>`;
  if(t.type==='invest') return `<span class="mav" style="background:linear-gradient(135deg,#8B6CFA,#4A2FBD)">📈</span>`;
  const label=t.note||t.item||cat(t.catId).name; const c=cat(t.catId);
  if(!t.note) return `<span class="mav" style="background:color-mix(in srgb,${c.color} 18%,var(--surface));font-size:20px">${c.icon||'•'}</span>`;
  return `<span class="mav" style="background:${nameColor(norm(label))}">${esc(initials(label))}<span class="bdg">${c.icon||'•'}</span></span>`;
}
/* recent activity on Home */
function recentHTML(){
  const list=filterAcct(allTx()).sort((a,b)=>a.date===b.date?(b.ts||0)-(a.ts||0):(a.date<b.date?1:-1)).slice(0,5);
  if(!list.length) return '';
  return `<h3 class="stitle">Recent<button class="see" data-act="tab" data-v="tx">See all</button></h3><div class="tx-group recent">${list.map(txRow).join('')}</div>`;
}
/* budget rings (Monzo / Apple style) */
function budgetRingsHTML(s){
  const u=state.ui; if(u.period!=='month') return '';
  const B=Object.entries(P().budgets).filter(([id,v])=>v>0&&findCat(id)); if(!B.length) return '';
  const R=26,C=2*Math.PI*R;
  return `<h3 class="stitle">Budgets</h3><div class="rings">${B.map(([id,bud])=>{const c=cat(id); const sp=(s.byCat[id]||{}).total||0; const r=sp/bud; const col=r>1?'var(--spend)':r>.85?'var(--warn)':c.color;
    return `<button class="ring-card" data-act="openCat" data-v="${esc(id)}"><svg viewBox="0 0 64 64" class="bring"><circle cx="32" cy="32" r="${R}" fill="none" stroke="var(--sunk)" stroke-width="7"/><circle class="bring-a" cx="32" cy="32" r="${R}" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(Math.min(1,r)*C).toFixed(1)} ${C.toFixed(1)}" style="--c:${C.toFixed(1)}" transform="rotate(-90 32 32)"/><text x="32" y="38" text-anchor="middle" font-size="18">${c.icon||''}</text></svg>
      <span class="rn">${esc(c.name.split(' ')[0])}</span><span class="rv ${r>1?'neg':''}">${r>1?money(sp-bud)+' over':money(bud-sp)+' left'}</span></button>`}).join('')}</div>`;
}
/* last 7 days, stacked by category (Apple Card style) */
function weekBarsHTML(){
  const days=[]; for(let i=6;i>=0;i--) days.push(ymd(addDays(new Date(),-i)));
  const list=filterAcct(txBetween(days[0],days[6])); const per=days.map(d=>summarize(list.filter(t=>t.date===d)));
  const max=Math.max(1e-9,...per.map(p=>p.spent)); state._wk={days,per};
  return `<section class="panel wk"><h2>Last 7 days</h2><div class="wk-cap" id="wkCap"><b>${money(sum(per,p=>p.spent))}</b><span>this week · tap a day</span></div>
    <div class="wk-bars">${per.map((p,i)=>{const cats=Object.entries(p.byCat).filter(([,v])=>v.total>0).sort((a,b)=>b[1].total-a[1].total);
      return `<button class="wk-col${i===6?' today':''}" data-act="wkBar" data-i="${i}"><span class="wk-stack" style="height:${Math.max(p.spent>0?6:2,p.spent/max*100)}%">${cats.map(([id,v])=>`<i style="flex:${v.total};background:${cat(id).color}"></i>`).join('')}</span><span class="wk-d">${DOW[pd(days[i]).getDay()].slice(0,1)}</span></button>`}).join('')}</div></section>`;
}
function wkTap(i){ const w=state._wk; if(!w) return; const p=w.per[i]; const top=Object.entries(p.byCat).sort((a,b)=>b[1].total-a[1].total)[0];
  document.querySelectorAll('.wk-col').forEach((c,k)=>c.classList.toggle('sel',k===+i));
  $('#wkCap').innerHTML=`<b>${money(p.spent)}</b><span>${fmtD(w.days[i],{weekday:'long',day:'numeric',month:'short'})}${top?` · mostly ${esc(cat(top[0]).name)}`:''}</span>`; buzz(5); }
/* ================= v11: Home as a real bank card ================= */
const accIds=()=>['all',...P().accounts.map(a=>a.id)];
function heroData(id){
  const b=balances();
  if(id==='all'){ const total=sum(P().accounts,a=>b[a.id]||0);
    return {id,all:true,grad:ALL_GRAD,ink:'#fff',accent:'#3CCB6E',glow:'#1FA2A0',bank:'Masroof',name:'All accounts',num:`${P().accounts.length} accounts`,bal:total,roles:''}; }
  const a=acct(id); const c=accColor(a);
  return {id,grad:accGrad(c),ink:accInk(c),accent:lum(c)<.03?'#9AA4B2':c,glow:lum(c)<.03?'#5B6470':c,bank:a.bank||TYPE_LABEL[a.type]||'Account',name:a.name,num:a.last4?`••••  ••••  ••••  ${a.last4}`:`••••  ${TYPE_LABEL[a.type]||''}`,bal:b[id]||0,roles:roleChips(a),type:a.type};
}
const CONTACTLESS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8.5 8.5a5 5 0 0 1 0 7"/><path d="M12 6a8.5 8.5 0 0 1 0 12"/><path d="M15.5 3.5a12 12 0 0 1 0 17"/></svg>';
function allStripes(){ const b=balances(); const acc=P().accounts; const tot=sum(acc,a=>Math.max(0,b[a.id]||0))||1;
  return `<div class="bc-stripes">${acc.map(a=>`<i style="flex:${Math.max(.04,Math.max(0,b[a.id]||0)/tot)};background:${accColor(a)}"></i>`).join('')}</div>`; }
function cardFrontHTML(d,fromBal){
  return `<div class="bc-face bc-front" style="background:${d.grad};color:${d.ink}"><span class="bc-sheen"></span>
    <div class="bc-top"><span class="bc-bank">${esc(d.bank)}</span>${d.all?`<img class="bc-mark" src="${LOGO_MARK}" alt="">`:`<span class="bc-cl">${CONTACTLESS}</span>`}</div>
    ${d.all?'':'<span class="bc-chip"><i></i><i></i><i></i></span>'}
    <div class="bc-bal"><small>${d.all?'Total balance':'Balance'}</small><div class="bc-amt"><span class="bc-cur">${esc(cur())}</span>${odoHTML(d.bal,fromBal==null?d.bal:fromBal)}</div></div>
    ${d.all?allStripes():''}
    <div class="bc-bottom"><span class="bc-num">${esc(d.num)}</span><span class="bc-name">${esc(d.name)}</span></div></div>`;
}
function cardBackHTML(d){
  const [a,b]=periodRange('month',todayStr()); const list=txBetween(a,b);
  if(d.all){ const bal=balances();
    return `<div class="bc-face bc-back" style="background:${d.grad};color:${d.ink}"><span class="bc-strip"></span>
      <div class="bc-list">${P().accounts.map(x=>`<button data-act="accView" data-v="${esc(x.id)}"><i style="background:${accColor(x)}"></i><span>${esc(x.name)}</span><b>${money(bal[x.id]||0)}</b></button>`).join('')}</div>
      <div class="bc-acts"><button data-act="editAcct" data-v="">＋ Add account</button><button data-act="flipCard">↺ Flip</button></div></div>`; }
  const f=accFlows(list,d.id);
  return `<div class="bc-face bc-back" style="background:${d.grad};color:${d.ink}"><span class="bc-strip"></span>
    <div class="bc-flows"><div><small>In this month</small><b>${f.inn?'+':''}${money(f.inn)}</b></div><div><small>Out this month</small><b>${f.out?'−':''}${money(f.out)}</b></div></div>
    <div class="bc-roles">${d.roles}</div>
    <div class="bc-acts"><button data-act="accView" data-v="${esc(d.id)}">Details</button><button data-act="accMove" data-v="${esc(d.id)}">↔ Move</button><button data-act="flipCard">↺ Flip</button></div></div>`;
}
function cardHTML(d,fromBal){ return `<div class="bcard" id="bcard" role="group" aria-roledescription="bank card" aria-label="${esc(d.bank)} ${esc(d.name)}"><div class="bc-inner">${cardFrontHTML(d,fromBal)}${cardBackHTML(d)}</div></div>`; }
function quickActionsHTML(){
  const acts=[['add',ICON.plus,'Add',''],['scanNew',ICON.camera,'Scan',''],['add',ICON.swap,'Move','transfer'],['add',ICON.users,'Split','split'],['import',ICON.inbox,'SMS','']];
  return `<div class="qa">${acts.map(([a,i,l,p])=>`<button data-act="${a}"${p?` data-preset="${p}"`:''}><span>${i}</span>${l}</button>`).join('')}</div>`;
}
function heroSub(i,n){ const ids=accIds();
  return `<span class="hdots" aria-hidden="true">${ids.map((id,k)=>`<i class="${k===i?'on':''}"${id!=='all'&&acct(id)?` style="--dc:${accColor(acct(id))}"`:''}></i>`).join('')}</span><span class="ht-hint">${P().seenSwipe?'Tap the card to flip it':'Swipe the card to switch accounts'}</span>`; }
function magicHeroHTML(){ const first=!heroData._first; heroData._first=true;
  const id=acct(state.ui.acct)?state.ui.acct:'all'; state.ui.acct=id; const d=heroData(id);
  const n=accIds().length, i=accIds().indexOf(id);
  return `<section class="home-top" id="magic" style="--glow:${d.glow}">
    <div class="ht-head"><img class="brandmark" src="${LOGO_MARK}" alt="Masroof"><div><div class="psub">${fmtD(todayStr(),{weekday:'long',day:'numeric',month:'long'})}</div><div class="mg-greet">${greeting()}</div></div>
      <button class="round" data-act="tab" data-v="settings" aria-label="Settings">${ICON.gear}</button></div>
    <div class="stage" id="stage"><span class="glow"></span>${cardHTML(d,first?0:null)}</div>
    <div class="ht-sub" id="htSub">${heroSub(i,n)}</div>
    <button class="sr" data-act="mgPrev" aria-label="Previous account"></button><button class="sr" data-act="mgNext" aria-label="Next account"></button>
    ${quickActionsHTML()}</section>`;
}
let mgBusy=false;
function switchAccount(dir){
  if(mgBusy) return; const ids=accIds(); if(ids.length<2) return;
  const i=Math.max(0,ids.indexOf(state.ui.acct)); const next=ids[(i+dir+ids.length)%ids.length];
  const prev=heroData(state.ui.acct), d=heroData(next);
  const stage=$('#stage'), card=$('#bcard'), rest=$('#homeRest'), top=$('#magic');
  if(!stage||!card){ state.ui.acct=next; render(false); return; }
  mgBusy=true; buzz(10);
  if(!P().seenSwipe){ P().seenSwipe=true; persist('profile'); }
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  card.style.transition=reduce?'none':'transform .26s cubic-bezier(.4,0,1,1), opacity .26s';
  card.style.transform=`translateX(${-dir*115}%) rotate(${-dir*14}deg) scale(.92)`; card.style.opacity='0';
  top.style.setProperty('--glow',d.glow); document.documentElement.style.setProperty('--acc',d.accent);
  if(rest){ rest.style.transition='opacity .2s'; rest.style.opacity='.3'; }
  setTimeout(()=>{
    state.ui.acct=next; state.ui.openCat=null;
    const wrap=document.createElement('div'); wrap.innerHTML=cardHTML(d,prev.bal); const nc=wrap.firstElementChild;
    nc.style.transition='none'; nc.style.transform=`translateX(${dir*115}%) rotate(${dir*14}deg) scale(.92)`; nc.style.opacity='0';
    card.replaceWith(nc); void nc.offsetWidth;
    nc.style.transition=reduce?'none':'transform .55s cubic-bezier(.2,.9,.25,1.12), opacity .3s'; nc.style.transform=''; nc.style.opacity='1';
    const sub=$('#htSub'); if(sub) sub.innerHTML=heroSub(ids.indexOf(next),ids.length);
    if(rest){ rest.innerHTML=homeRestHTML(); rest.style.transition='opacity .35s ease-out'; rest.style.opacity='1'; }
    runCountUps(); setTimeout(()=>{ nc.style.transition=''; mgBusy=false; },420);
  },reduce?0:250);
}
/* drag the card: it follows your finger and tilts */
(function(){
  let g=null;
  document.addEventListener('pointerdown',e=>{
    const card=e.target.closest('#bcard'); if(!card||e.target.closest('button')||mgBusy) return;
    g={x0:e.clientX,y0:e.clientY,dx:0,dir:null,card};
  },{passive:true});
  document.addEventListener('pointermove',e=>{
    if(!g) return; g.dx=e.clientX-g.x0; const dy=e.clientY-g.y0;
    if(!g.dir){ if(Math.abs(g.dx)<8&&Math.abs(dy)<8) return; g.dir=Math.abs(g.dx)>Math.abs(dy)?'h':'v'; }
    if(g.dir==='h'){ g.card.style.transition='none'; g.card.style.transform=`translateX(${g.dx*.8}px) rotate(${g.dx*.04}deg)`; }
  },{passive:true});
  const end=()=>{
    if(!g) return; const s=g; g=null;
    if(s.dir==='h'){ suppressClick=true; setTimeout(()=>suppressClick=false,60);
      if(Math.abs(s.dx)>55) switchAccount(s.dx<0?1:-1);
      else { s.card.style.transition='transform .45s cubic-bezier(.2,.9,.25,1.2)'; s.card.style.transform=''; } }
  };
  document.addEventListener('pointerup',end,{passive:true}); document.addEventListener('pointercancel',end,{passive:true});
  document.addEventListener('keydown',e=>{ if(state.ui.tab!=='home'||document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||'')) return;
    if(e.key==='ArrowRight') switchAccount(1); if(e.key==='ArrowLeft') switchAccount(-1); });
  // tap = flip the card
  document.addEventListener('click',e=>{ const c=e.target.closest('#bcard'); if(!c||e.target.closest('button')) return; if(suppressClick) return; c.classList.toggle('flipped'); buzz(6); });
})();
/* ================= v4: feedback ================= */
function buzz(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms||12); }catch(e){} }
function celebrate(){
  const d=$('#done'); buzz(15);
  d.innerHTML=`<div class="ok"><svg viewBox="0 0 60 60" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><circle cx="30" cy="30" r="25" pathLength="1"/><path d="M19 31l7.5 7.5L42 23" pathLength="1"/></svg></div>`;
  d.hidden=false; d.classList.remove('out'); clearTimeout(celebrate._t); clearTimeout(celebrate._t2);
  celebrate._t=setTimeout(()=>d.classList.add('out'),850); celebrate._t2=setTimeout(()=>{d.hidden=true;d.innerHTML='';},1200);
}

/* ================= v4: gestures ================= */
let drag=null, suppressClick=false, openRow=null;
function closeRow(except){ if(openRow&&openRow!==except){ openRow.classList.add('snap'); openRow.style.transform=''; openRow=null; } }
document.addEventListener('pointerdown',e=>{
  if(e.button>0) return;
  const tx=e.target.closest('.swipe .tx');
  const hero=!tx&&e.target.closest('#homeHero')&&!e.target.closest('button,select,input');
  const sheet=!tx&&!hero&&e.target.closest('dialog .dlg-h')&&!e.target.closest('button');
  const chart=e.target.closest('#achart');
  if(chart){ drag={kind:'chart'}; scrubChart(e.clientX); return; }
  if(!tx&&!hero&&!sheet){ if(openRow&&!e.target.closest('.swipe .acts')) closeRow(); return; }
  const el=tx||(hero&&e.target.closest('#homeHero'))||e.target.closest('dialog');
  const base=tx&&tx===openRow?(parseFloat((tx.style.transform.match(/-?[\d.]+/)||[0])[0])||0):0;
  drag={kind:tx?'row':hero?'hero':'sheet',el,x0:e.clientX,y0:e.clientY,dx:0,dy:0,base,dir:null};
  el.classList.remove('snap');
},{passive:true});
document.addEventListener('pointermove',e=>{
  if(!drag) return;
  if(drag.kind==='chart'){ scrubChart(e.clientX); return; }
  drag.dx=e.clientX-drag.x0; drag.dy=e.clientY-drag.y0;
  if(!drag.dir){ if(Math.abs(drag.dx)<8&&Math.abs(drag.dy)<8) return; drag.dir=Math.abs(drag.dx)>Math.abs(drag.dy)?'h':'v'; }
  if(drag.kind==='row'&&drag.dir==='h'){ const x=Math.max(-160,Math.min(110,drag.base+drag.dx)); drag.el.style.transform=`translateX(${x}px)`; }
  else if(drag.kind==='hero'&&drag.dir==='h'){ drag.el.style.transform=`translateX(${drag.dx*.35}px) rotate(${drag.dx*.008}deg)`; }
  else if(drag.kind==='sheet'&&drag.dir==='v'&&drag.dy>0){ drag.el.style.transform=`translateY(${drag.dy}px)`; }
},{passive:true});
function endDrag(){
  const d=drag; drag=null; if(!d||d.kind==='chart') return;
  if(d.dir) { suppressClick=true; setTimeout(()=>suppressClick=false,60); }
  if(d.kind==='row'){
    const x=d.base+d.dx; d.el.classList.add('snap');
    if(d.dir!=='h'){ return; }
    if(x<-60){ d.el.style.transform='translateX(-156px)'; closeRow(d.el); openRow=d.el; buzz(8); }
    else if(x>80){ d.el.style.transform=''; openRow=null; const sw=d.el.closest('.swipe'); const id=sw.dataset.id; buzz(10); if(sw.dataset.right==='settle') settleSwipe(id); else duplicateTx(id); }
    else { d.el.style.transform=''; if(openRow===d.el) openRow=null; }
  } else if(d.kind==='hero'){
    d.el.style.transition='transform .3s var(--spring)'; d.el.style.transform=''; setTimeout(()=>{ if(d.el) d.el.style.transition=''; },320);
    if(d.dir==='h'&&Math.abs(d.dx)>55){ const dir=d.dx<0?1:-1; state.ui.anchor=shiftAnchor(state.ui.period,state.ui.anchor,dir); buzz(8); render(false); const h=$('#heroAmt'); if(h) h.classList.add(dir>0?'slideL':'slideR'); }
  } else if(d.kind==='sheet'){
    if(d.dir==='v'&&d.dy>110){ d.el.style.transition='transform .22s ease-in'; d.el.style.transform='translateY(100%)'; setTimeout(()=>{ d.el.close(); d.el.style.transition=''; d.el.style.transform=''; },210); }
    else { d.el.style.transition='transform .3s var(--spring)'; d.el.style.transform=''; setTimeout(()=>{ d.el.style.transition=''; },310); }
  }
}
document.addEventListener('pointerup',endDrag,{passive:true});
document.addEventListener('pointercancel',endDrag,{passive:true});
document.addEventListener('click',e=>{
  if(suppressClick){ e.stopPropagation(); e.preventDefault(); suppressClick=false; return; }
  const tx=e.target.closest('.swipe .tx'); if(openRow&&tx&&tx===openRow){ e.stopPropagation(); e.preventDefault(); closeRow(); }
},true);

function duplicateTx(id){
  const t=allTx().find(x=>x.id===id); if(!t) return;
  const pre=alertSnapshot();
  const c=clone(t); c.id=newId(); c.date=todayStr(); c.ts=Date.now(); delete c.auto; delete c.recurringId; delete c.inst; delete c.receipt; delete c.imported;
  const k=c.date.slice(0,7); (state.months[k]||(state.months[k]=[])).push(c); persistMonth(k);
  lastUndo=()=>{removeIds([c.id]);render(false);};
  celebrate(); toast(`Added again for today · ${money(c.amount)}`,{undo:lastUndo}); render(false); checkAlerts(pre,c);
}
function deleteRow(id){
  const row=document.querySelector(`.swipe[data-id="${CSS.escape(id)}"]`); const t=allTx().find(x=>x.id===id); if(!t) return;
  const finish=()=>{ removeIds([id]); openRow=null; toast('Deleted',{undo:()=>{const k=t.date.slice(0,7);(state.months[k]||(state.months[k]=[])).push(t);persistMonth(k);render(false);}}); render(false); };
  if(row&&!matchMedia('(prefers-reduced-motion: reduce)').matches){ row.style.height=row.offsetHeight+'px'; requestAnimationFrame(()=>{ row.style.height='0px'; row.style.opacity='0'; }); setTimeout(finish,280); }
  else finish();
  buzz(20);
}
function makeRecurringFrom(id){
  const t=allTx().find(x=>x.id===id); if(!t) return;
  const r={id:newId(),freq:'monthly',day:pd(t.date).getDate()}; for(const f of REC_FIELDS) if(t[f]!=null) r[f]=clone(t[f]);
  let next=advance(r,t.date); while(next<=todayStr()) next=advance(r,next); r.next=next;
  P().recurring.push(r); persist('profile'); celebrate(); toast(`${t.note} will be added automatically every month`); render(false);
}

/* ================= v4: monthly recap stories ================= */
let story=null;
const STORY_BG=['linear-gradient(160deg,#061529,#15457A 60%,#1FA2A0)','linear-gradient(160deg,#4A2FBD,#7A5AF8 55%,#EE46BC)','linear-gradient(160deg,#C26A06,#F79009 55%,#F4B740)','linear-gradient(160deg,#05603A,#0FA968 60%,#6CE9A6)','linear-gradient(160deg,#1849A9,#2E90FA 60%,#7CD4FD)','linear-gradient(160deg,#9E165F,#EE46BC 55%,#F79009)','linear-gradient(160deg,#101828,#344054)'];
function buildRecap(m){
  const [y,mo]=m.split('-').map(Number); const a=`${m}-01`, b=ymd(new Date(y,mo,0)); const cur=m===todayStr().slice(0,7);
  const s=summarize(txBetween(a,b)); const [pa,pb]=periodRange('month',ymd(new Date(y,mo-2,1))); const ps=summarize(txBetween(pa,pb));
  const name=MONTHS[mo-1]; const slides=[];
  const diff=ps.spent>0?Math.round((s.spent-ps.spent)/ps.spent*100):null;
  slides.push(`<div class="kicker">${name} ${y}${cur?' · so far':''}</div><div class="huge">${money(s.spent)}</div><p>${esc(cur_())} spent${diff==null?'.':diff===0?', the same as the month before.':`, ${Math.abs(diff)}% ${diff>0?'more':'less'} than ${MONTHS[(mo+10)%12]}.`}</p>${diff!=null&&diff<0?'<div class="emoji">👏</div>':''}`);
  const cats=Object.entries(s.byCat).filter(([,v])=>v.total>0).sort((x,y2)=>y2[1].total-x[1].total);
  if(cats.length){ const [id,v]=cats[0]; const c=cat(id);
    slides.push(`<div class="kicker">Your top category</div><div class="emoji">${c.icon||'💸'}</div><div class="big2">${esc(c.name)}</div><div class="huge" style="font-size:56px">${money(v.total)}</div><p>${Math.round(v.total/s.spent*100)}% of everything you spent, over ${v.count} purchase${v.count>1?'s':''}.</p>`);
    slides.push(`<div class="kicker">Where the rest went</div>${cats.slice(0,4).map(([cid,cv])=>`<div class="srow"><span>${cat(cid).icon||''} ${esc(cat(cid).name)}</span><span>${money(cv.total)}</span></div>`).join('')}`); }
  const items=[]; for(const [cid,c] of Object.entries(s.byCat)) for(const [nm,iv] of Object.entries(c.items)) if(iv.total>0) items.push({nm,cid,...iv});
  const fav=items.sort((x,y2)=>y2.count-x.count)[0];
  if(fav&&fav.count>2) slides.push(`<div class="kicker">Your favourite</div><div class="emoji">${cat(fav.cid).icon||'⭐'}</div><div class="big2">${esc(fav.nm)} × ${fav.count}</div><p>That’s ${money(fav.total)} in total — about ${money(fav.total/fav.count)} each time.</p>`);
  const days=Object.entries(s.byDate).sort((x,y2)=>y2[1]-x[1]);
  if(days.length) slides.push(`<div class="kicker">Biggest day</div><div class="big2">${fmtD(days[0][0],{weekday:'long',day:'numeric',month:'long'})}</div><div class="huge" style="font-size:56px">${money(days[0][1])}</div><p>On a typical day you spent ${money(s.spent/Math.max(1,daysElapsed(a,b)))}.</p>`);
  if(P().limits.mode!=='off'){ let within=0,total=0; for(let d=pd(a);ymd(d)<=b&&ymd(d)<=todayStr();d=addDays(d,1)){const k=ymd(d); const l=limitFor(k); if(l==null) continue; total++; if(countedOn(k)<=l+1e-9) within++;}
    if(total) slides.push(`<div class="kicker">Daily limit</div><div class="emoji">${within/total>=.8?'🏆':within/total>=.5?'💪':'🎯'}</div><div class="big2">${within} of ${total} days</div><p>${within/total>=.8?'You stayed within your limit almost every day. Brilliant.':'You stayed within your limit on these days. Next month, aim for one more.'}</p>`); }
  if(s.tax>0) slides.push(`<div class="kicker">Taxes & service</div><div class="emoji">🏛️</div><div class="huge" style="font-size:56px">${money(s.tax)}</div><p>Paid on top of prices this month — ${(s.tax/s.spent*100).toFixed(1)}% of your spending.</p>`);
  if(s.income>0) slides.push(`<div class="kicker">Money in, money kept</div><div class="srow"><span>💼 Income</span><span>${money(s.income)}</span></div><div class="srow"><span>🏦 Saved</span><span>${money(s.saved)}</span></div><div class="srow"><span>📈 Invested</span><span>${money(s.invested)}</span></div><p>${s.saved+s.invested>0?`You kept ${Math.round((s.saved+s.invested)/s.income*100)}% of what you earned.`:'Try moving even a little to savings on payday.'}</p>`);
  const pb2=peopleBalances(); const owed=sum(Object.values(pb2).filter(v=>v>0)); if(owed>0) slides.push(`<div class="kicker">Friends</div><div class="emoji">🤝</div><div class="big2">${money(owed)} owed to you</div><p>Open Friends to send a friendly reminder.</p>`);
  const pc=priceChange(a,b); if(pc) slides.push(`<div class="kicker">Price watch</div><div class="emoji">🏷️</div><div class="big2">${esc(pc.name)}</div><p>${pc.now>pc.before?'Went up':'Went down'} from ${money(pc.before)} to ${money(pc.now)}.</p>`);
  const top=cats[0]?cat(cats[0][0]).name:'your top category';
  slides.push(`<div class="kicker">Next month</div><div class="emoji">🌱</div><div class="big2">One small change</div><p>Cutting ${esc(top)} by 10% would keep about ${money((cats[0]?cats[0][1].total:0)*.1)} in your pocket.</p><button class="btn" style="background:#fff;color:#0B1220;margin-top:10px;align-self:flex-start" data-story="close">Done</button>`);
  return {m,title:`${name} recap`,slides};
}
const cur_=()=>cur();
function openStory(m){
  story=buildRecap(m); story.i=0; const el=$('#story'); el.hidden=false; document.body.style.overflow='hidden'; showSlide(0);
}
function showSlide(i){
  if(!story) return; story.i=Math.max(0,Math.min(story.slides.length-1,i)); const el=$('#story'); clearTimeout(story.t);
  el.style.background=STORY_BG[story.i%STORY_BG.length];
  el.innerHTML=`<div class="bars">${story.slides.map((_,k)=>`<i class="${k<story.i?'done':k===story.i?'cur':''}" style="--dur:6s"><b></b></i>`).join('')}</div>
    <div class="top"><span>${esc(story.title)}</span><button data-story="close" aria-label="Close">×</button></div><div class="slide">${story.slides[story.i]}</div>`;
  if(story.i<story.slides.length-1) story.t=setTimeout(()=>showSlide(story.i+1),6000);
}
function closeStory(){ if(!story) return; clearTimeout(story.t); story=null; const el=$('#story'); el.hidden=true; el.innerHTML=''; document.body.style.overflow=''; }
(function(){
  const el=$('#story'); let sx=0,sy=0,t0=0;
  el.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;t0=Date.now(); if(story) clearTimeout(story.t); el.querySelectorAll('.bars i.cur b').forEach(b=>b.style.animationPlayState='paused');});
  el.addEventListener('pointerup',e=>{
    if(!story) return; if(e.target.closest('[data-story="close"]')){ closeStory(); return; }
    const dx=e.clientX-sx, dy=e.clientY-sy;
    if(dy>90&&Math.abs(dy)>Math.abs(dx)) return closeStory();
    if(Math.abs(dx)>50) return showSlide(story.i+(dx<0?1:-1));
    if(Date.now()-t0>400){ showSlide(story.i); return; } // long press = pause, release resumes
    const w=el.clientWidth; if(e.clientX<w*.3) showSlide(story.i-1); else if(story.i===story.slides.length-1) closeStory(); else showSlide(story.i+1);
  });
  document.addEventListener('keydown',e=>{ if(!story) return; if(e.key==='Escape') closeStory(); if(e.key==='ArrowRight') showSlide(story.i+1); if(e.key==='ArrowLeft') showSlide(story.i-1); });
})();

function settleSwipe(pid){ const bal=peopleBalances()[pid]||0; if(Math.abs(bal)<10**-dec()) return toast(`All settled with ${personName(pid)} ✓`); openTx(null,{type:'debt',personId:pid,debtKind:bal>0?'repaid_in':'repaid_out',amount:String(round(Math.abs(bal),dec()))}); }
/* ================= events ================= */
document.addEventListener('click',async e=>{
  const bk=e.target.closest('.bk');
  if(bk&&state._bk){const x=state._bk[+bk.dataset.i];const c=$('#chartCap');if(c&&x)c.textContent=`${x.full}: ${money(x.value)} ${cur()}${x.limit!=null?` · limit ${money(x.limit)}`:''}`;return;}
  const tb=e.target.closest('#tabs button[data-tab]'); if(tb){state.ui.tab=tb.dataset.tab;render();window.scrollTo(0,0);return;}
  const el=e.target.closest('[data-act]'); if(!el) return;
  const a=el.dataset.act,v=el.dataset.v,u=state.ui,p=P(),d=draft;
  switch(a){
    /* navigation & home */
    case 'tab': u.tab=v; render(); window.scrollTo(0,0); break;
    case 'rowDup': closeRow(); duplicateTx(v); break;
    case 'rowNoop': break;
    case 'wkBar': wkTap(el.dataset.i); break;
    case 'mgPrev': switchAccount(-1); break;
    case 'flipCard': { const c=$('#bcard'); if(c) c.classList.toggle('flipped'); break; }
    case 'mgNext': switchAccount(1); break;
    case 'dAcct': d[el.dataset.field]=v; buzz(5); renderTxDlg(); break;
    case 'dDate': d.date=v; renderTxDlg(); break;
    case 'dMore': d._more=!d._more; renderTxDlg(); if(d._more) setTimeout(()=>{const m=$('.more-body'); if(m) m.scrollIntoView({block:'nearest',behavior:'smooth'});},30); break;
    case 'allCats': u.allCats=!u.allCats; render(false); break;
    case 'pickMonth': u.txMonth=v; { const y=window.scrollY; render(); window.scrollTo(0,y); } break;
    case 'pRemindQuick': { closeRow(); const x=person(v); const bal=peopleBalances()[v]||0; if(bal<=0) return toast(`${x.name} doesn’t owe you anything`); const ok=await copyText(`Hi ${x.name}, just a friendly reminder: you owe me ${cur()} ${money(bal)}. Thanks!`); toast(ok?'Reminder copied — paste it in WhatsApp':'Couldn’t copy'); break; }
    case 'pSplitQuick': closeRow(); openTx(null,{split:{on:true,paidBy:'me',who:['me',v],mode:'equal',custom:{}},_more:true}); break;
    case 'rowDel': deleteRow(v); break;
    case 'makeRec': makeRecurringFrom(v); break;
    case 'recap': openStory(v); break;
    case 'add': openTx(null,el.dataset.preset); break;
    case 'undo': { const t=$('#toast'); if(t._undo){t._undo(); t._undo=null; lastUndo=null; t.classList.remove('on');} break; }
    case 'period': u.period=v; u.openCat=null; render(); break;
    case 'shift': u.anchor=shiftAnchor(u.period,u.anchor,+v); render(); break;
    case 'toToday': u.anchor=todayStr(); render(); break;
    case 'openCat': u.openCat=u.openCat===v?null:v; render(false); break;
    case 'seeTx': u.tab='tx'; u.txCat=v; u.txType='all'; u.txQ=''; u.txMonth=(u.period==='month'?u.anchor:todayStr()).slice(0,7); render(); window.scrollTo(0,0); break;
    case 'tagSearch': u.tab='tx'; u.txQ='#'+v; u.txCat='all'; u.txType='all'; render(); window.scrollTo(0,0); break;
    case 'txMonth': {const [y,m]=u.txMonth.split('-').map(Number);const dd=new Date(y,m-1+(+v),1);u.txMonth=`${dd.getFullYear()}-${pad(dd.getMonth()+1)}`;render();break;}
    case 'quickAdd': { const i=$('#quickIn'); quickAddText(i.value); i.value=''; break; }
    case 'quickChip': saveQuick(quickSuggestions()[+el.dataset.i]); break;
    case 'setQuickLimit': { const val=num(($('#quickLimit')||{}).value); if(!(val>0)) return toast('Enter an amount above zero'); p.limits.mode='fixed'; p.limits.daily=round(val,dec()); persist('profile'); render(); toast('Daily limit set'); break; }
    case 'goLimits': state.ui.sOpen=state.ui.sOpen||{}; state.ui.sOpen['Daily spending limit']=true; u.tab='settings'; if(p.limits.mode==='off'){p.limits.mode='smart'; if(!p.limits.monthly) p.limits.monthly=suggestMonthly(); persist('profile');} render(); setTimeout(()=>{const x=$('#limitsPanel'); if(x) x.scrollIntoView({block:'start'});},30); break;
    case 'scanNew': openTx(null); $('#receiptFile').click(); break;
    /* tx dialog */
    case 'edit': openTx(v); break;
    case 'close': $('#dlg').close(); break;
    case 'dType': if(v==='income'&&d.type!=='income'&&state.ui.acct==='all') d.accountId=salaryAcct(); if(v==='expense'&&d.type==='income'&&state.ui.acct==='all') d.accountId=defaultAcct(); d.type=v; d.catId=null; d.item=''; d.manual=false; if(d.type==='transfer'&&d.toAccountId===d.accountId) d.toAccountId=(p.accounts.find(x=>x.id!==d.accountId)||{}).id;
      if(d.note&&(v==='expense'||v==='income')){const g=guessCategory(d.note,v); if(g){d.catId=g.catId;d.item=g.item||'';}} renderTxDlg(); break;
    case 'dCat': if(d.catId!==v){d.catId=v;d.item='';} d.manual=true; renderTxDlg(); break;
    case 'dItem': d.item=d.item===v?'':v; d.manual=true; renderTxDlg(); break;
    case 'dNewItem': {const nv=($('#newItemIn').value||'').trim(); const c=findCat(d.catId); if(nv&&c){ if(!c.items.includes(nv)){c.items.push(nv);persist('profile');} d.item=nv; d.manual=true; renderTxDlg(); } break;}
    case 'dFreq': d.freq=v; renderTxDlg(); break;
    case 'dKind': d.debtKind=v; renderTxDlg(); break;
    case 'dInv': d.invDir=v; renderTxDlg(); break;
    case 'dSave': saveDraft(); break;
    case 'dDelete': if(await ask('Delete this transaction?','Delete')){ const t=allTx().find(x=>x.id===d.id); removeIds([d.id]); $('#dlg').close(); toast('Deleted',{undo:()=>{const k=t.date.slice(0,7);(state.months[k]||(state.months[k]=[])).push(t);persistMonth(k);render();}}); render(); } break;
    case 'dCopy': { const t=allTx().find(x=>x.id===d.id); $('#dlg').close(); openTx(t.id); draft.id=null; draft.date=todayStr(); draft.auto=false; draft.recurringId=null; draft.receipt=t.receipt||null; renderTxDlg(); break; }
    case 'dPin': { p.quick.push({label:d.note||d.item||cat(d.catId).name,amount:num(d.amount),catId:d.catId,item:d.item,accountId:d.accountId}); persist('profile'); toast('Pinned to Quick add'); break; }
    case 'scan': $('#receiptFile').click(); break;
    case 'viewReceipt': if(!d._blobUrl&&d.receipt){ d._blobUrl=await receiptURL(d.receipt); if(!d._blobUrl) return toast('Receipt photo not found'); } d._showReceipt=!d._showReceipt; renderTxDlg(); break;
    case 'lnAdd': d.lines.push(blankLine(d.catId)); renderTxDlg(); setTimeout(()=>{const x=document.querySelector(`[data-f="lines.${d.lines.length-1}.name"]`); if(x) x.focus();},30); break;
    case 'lnDel': d.lines.splice(+el.dataset.i,1); renderTxDlg(); break;
    case 'lnWho': { const l=d.lines[+el.dataset.i]; let w=l.who&&l.who.length?l.who.slice():d.split.who.slice(); w=w.includes(v)?w.filter(x=>x!==v):[...w,v]; if(!w.length) return; l.who=w.length===d.split.who.length?[]:w; renderTxDlg(); break; }
    case 'taxMode': d.taxMode=v; renderTxDlg(); break;
    case 'svcMode': d.serviceMode=v; renderTxDlg(); break;
    case 'spWho': { const w=d.split.who; d.split.who=w.includes(v)?w.filter(x=>x!==v):[...w,v]; renderTxDlg(); break; }
    case 'spMode': d.split.mode=v; renderTxDlg(); break;
    case 'spAddPerson': { const id=addPerson($('#spNew').value); if(id&&!d.split.who.includes(id)) d.split.who.push(id); renderTxDlg(); break; }
    case 'dbAddPerson': { const id=addPerson($('#dbNew').value); if(id) d.personId=id; renderTxDlg(); break; }
    case 'invAdd': { const id=addHolding($('#invNew').value,'other'); if(id) d.investmentId=id; renderTxDlg(); break; }
    /* accounts */
    case 'editAcct': openAcct(v||null); break;
    case 'aSave': { const name=(fd.name||'').trim()||(fd.bank||'').trim(); if(!name) return fErr('Give the account a name or pick a bank.'); const opening=round(num(fd.opening),dec());
      const data={name,bank:(fd.bank||'').trim(),type:fd.type,opening,color:fd.color,roles:fd.roles.slice(),last4:String(fd.last4||'').replace(/\D/g,'').slice(0,4)};
      if(fd.id){ const x=acct(fd.id); Object.assign(x,data); delete x.demoTheme; } else { const nid='a_'+newId(); p.accounts.push({id:nid,...data}); u.acct=nid; }
      persist('profile'); $('#dlg').close(); celebrate(); toast('Card saved'); render(); break; }
    case 'accColor': fd.color=v; renderAcctEditor(!!fd.id); break;
    case 'accRole': fd.roles=fd.roles.includes(v)?fd.roles.filter(r=>r!==v):[...fd.roles,v]; renderAcctEditor(!!fd.id); break;
    case 'accView': openAccountSheet(v); break;
    case 'accAdd': openTx(null,{accountId:v}); break;
    case 'accIncome': openTx(null,{type:'income',accountId:v}); break;
    case 'accMove': openTx(null,{type:'transfer',accountId:v,toAccountId:(p.accounts.find(x=>x.id!==v&&hasRole(x,'savings'))||p.accounts.find(x=>x.id!==v)||{}).id}); break;
    case 'accShow': $('#dlg').close(); u.acct=v; u.tab='home'; render(); window.scrollTo(0,0); break;
    case 'pickAcct': u.acct=v; buzz(6); { const y=window.scrollY; render(); window.scrollTo(0,y); } break;
    case 'aDelete': { if(p.accounts.length<2) return fErr('Keep at least one account.'); const used=allTx().some(t=>t.accountId===fd.id||t.toAccountId===fd.id);
      if(await ask(used?'This account has transactions. They stay in your history. Delete it?':'Delete this account?','Delete')){ p.accounts=p.accounts.filter(x=>x.id!==fd.id); if(u.acct===fd.id) u.acct='all'; persist('profile'); $('#dlg').close(); render(); } break; }
    /* people */
    case 'addPerson': { const i=$('#newPerson'); if(addPerson(i.value)){ render(); } break; }
    case 'person': openPerson(v); break;
    case 'pSave': { const x=person(fd.id); if(x&&fd.name.trim()){x.name=fd.name.trim(); persist('profile'); toast('Saved'); render(); openPerson(fd.id);} break; }
    case 'pDelete': { const used=personTx(fd.id).length; if(await ask(used?'This person has shared history. Past entries stay but show as “Someone”. Delete?':'Delete this person?','Delete')){ p.people=p.people.filter(x=>x.id!==fd.id); persist('profile'); $('#dlg').close(); render(); } break; }
    case 'pSettle': { const bal=Math.abs(peopleBalances()[fd.id]||0); openTx(null,{type:'debt',personId:fd.id,debtKind:v==='in'?'repaid_in':'repaid_out',amount:String(round(bal,dec()))}); break; }
    case 'pLend': openTx(null,{type:'debt',personId:fd.id,debtKind:'lent'}); break;
    case 'pBorrow': openTx(null,{type:'debt',personId:fd.id,debtKind:'borrowed'}); break;
    case 'pSplit': openTx(null,{split:{on:true,paidBy:'me',who:['me',fd.id],mode:'equal',custom:{}}}); break;
    case 'pRemind': { const x=person(fd.id); const bal=peopleBalances()[fd.id]||0; const msg=`Hi ${x.name}, just a friendly reminder: you owe me ${cur()} ${money(bal)}. Thanks!`;
      const ok=await copyText(msg); toast(ok?'Reminder copied — paste it in WhatsApp or SMS':'Couldn\u2019t copy — '+msg); break; }
    /* investments */
    case 'newHolding': openHolding(null); break;
    case 'holding': openHolding(v); break;
    case 'hCreate': { const name=(fd.name||'').trim(); if(!name) return fErr('Give it a name.'); const amt=round(num(fd.base),dec());
      const h={id:'h_'+newId(),name,type:fd.type,units:num(fd.units)||null,baseCost:fd.from==='owned'?amt:0,history:[]}; p.investments.push(h);
      if(fd.from==='account'&&amt>0){const tx={id:newId(),type:'invest',dir:'buy',amount:amt,date:fd.date||todayStr(),accountId:fd.accountId,investmentId:h.id,ts:Date.now()}; if(h.units) tx.units=h.units; const k=tx.date.slice(0,7);(state.months[k]||(state.months[k]=[])).push(tx);persistMonth(k);}
      persist('profile'); $('#dlg').close(); toast('Investment added'); render(); break; }
    case 'hValue': { const h=holding(fd.id); let val=num(fd.value); if(!(val>0)&&num(fd.price)>0&&h.units) val=num(fd.price)*h.units; if(!(val>0)) return fErr('Enter the value, or the price per unit.');
      h.history=(h.history||[]).filter(x=>x.date!==todayStr()); h.history.push({date:todayStr(),value:round(val,dec())}); if(h.history.length>200) h.history.shift(); persist('profile'); toast('Value updated'); render(); openHolding(h.id); break; }
    case 'hSave': { const h=holding(fd.id); if(!fd.name.trim()) return fErr('Give it a name.'); h.name=fd.name.trim(); h.type=fd.type; h.units=num(fd.units)||null; persist('profile'); $('#dlg').close(); render(); break; }
    case 'hBuy': openTx(null,{type:'invest',investmentId:fd.id,invDir:'buy'}); break;
    case 'hSell': openTx(null,{type:'invest',investmentId:fd.id,invDir:'sell'}); break;
    case 'hMonthly': openTx(null,{type:'invest',investmentId:fd.id,invDir:'buy',repeat:true}); break;
    case 'hDelete': if(await ask('Delete this investment? Its buy/sell entries stay in your history.','Delete')){ p.investments=p.investments.filter(x=>x.id!==fd.id); persist('profile'); $('#dlg').close(); render(); } break;
    /* goals */
    case 'goal': openGoal(v||null); break;
    case 'gSave': { const name=(fd.name||'').trim(), target=round(num(fd.target),dec()); if(!name||!(target>0)) return fErr('Add a name and a target.');
      const g={id:fd.id||'g_'+newId(),name,target,date:fd.date||'',accountId:fd.accountId||'',saved:round(num(fd.saved),dec()),demo:fd.demo};
      if(fd.id){const i=p.goals.findIndex(x=>x.id===fd.id); p.goals[i]=g;} else p.goals.push(g); persist('profile'); $('#dlg').close(); render(); break; }
    case 'gAdd': { const g=p.goals.find(x=>x.id===fd.id); const add=num(fd.add); if(!(add>0)) return fErr('Enter an amount.'); g.saved=round((+g.saved||0)+add,dec()); persist('profile'); toast(`Added to ${g.name}`); render(); openGoal(g.id); break; }
    case 'gDelete': if(await ask('Delete this goal?','Delete')){ p.goals=p.goals.filter(x=>x.id!==fd.id); persist('profile'); $('#dlg').close(); render(); } break;
    /* import & data */
    case 'import': openImport(); break;
    case 'impLocal': imp.text=($('[data-imptext]')||{}).value||imp.text; imp.rows=localParse(imp.text); imp.msg=imp.rows.length?'':'No amounts found. Messages need an amount with a currency, like "OMR 4.200".'; renderImport(); break;
    case 'impBack': imp.rows=[]; imp.msg=''; renderImport(); break;
    case 'impDo': doImport(); break;
    case 'demo': loadDemo(); break;
    case 'clearDemo': clearDemo(); break;
    case 'export': exportCSV(); break;
    case 'clearLearned': p.learned={}; persist('profile'); render(false); break;
    case 'wipe': if(await ask('Erase all transactions, accounts, people, investments and settings? This cannot be undone.','Erase everything')){
      for(const k of Object.keys(state.months)){state.months[k]=[];persistMonth(k);} state.profile=defaultProfile(); fillProfile(); persist('profile'); u.acct='all'; toast('Everything erased'); render(); } break;
    /* settings */
    case 'limMode': p.limits.mode=v; if(v==='smart'&&!p.limits.monthly) p.limits.monthly=suggestMonthly(); persist('profile'); render(false); break;
    case 'limSuggest': { const s=suggestMonthly(); if(s>0){p.limits.monthly=s; persist('profile'); render(false); toast(`Suggested ${money(s)} — 90% of income left after bills and savings`);} else toast('Record some income and bills first, or type a budget'); break; }
    case 'delRec': if(await ask('Stop this repeating payment? Past entries stay.','Stop it')){ p.recurring=p.recurring.filter(r=>r.id!==v); persist('profile'); render(false); } break;
    case 'pinQuick': { const label=($('#qpLabel').value||'').trim(), amount=num($('#qpAmt').value); if(!label||!(amount>0)) return toast('Add a label and an amount');
      const catId=$('#qpCat').value; const g=guessCategory(label,'expense'); p.quick.push({label,amount:round(amount,dec()),catId,item:g&&g.catId===catId?g.item:'',accountId:$('#qpAcct').value}); persist('profile'); render(false); break; }
    case 'unpin': p.quick.splice(+el.dataset.i,1); persist('profile'); render(false); break;
    case 'addItem': case 'addCat': case 'delItem': case 'delCat': catEdit(a,el); break;
    /* privacy, lock & backups */
    case 'lockNow': lockNow(); break;
    case 'changePass': changePass(); break;
    case 'backup': makeBackup(!!($('#bkReceipts')||{}).checked); break;
    case 'restore': $('#backupFile').click(); break;
    case 'lkCreate': if(!busyLock) lkCreate(); break;
    case 'lkUnlock': lkUnlock(); break;
    case 'lkRestore': lkRestore(); break;
    case 'lkCancelRestore': pendingRestore=null; boot(); break;
    case 'lkForgot': { const L=$('#lock .lockbox'); L.innerHTML=`<div class="shield">🔑</div><h1>Forgot your passcode?</h1><p>Your data is encrypted with it and there is no back door — not even the app’s maker can open it. You can restore an encrypted backup (if you remember its passcode) or erase everything and start fresh.</p>
        <button class="btn" data-act="restore">Restore from a backup</button><input class="inp" id="eraseConfirm" placeholder="Type ERASE to delete all data" autocomplete="off"><button class="btn danger" data-act="lkErase">Erase and start over</button><button class="btn link" data-act="lkBack">Back</button>`; break; }
    case 'lkErase': if(($('#eraseConfirm').value||'').trim().toUpperCase()==='ERASE'){ await eraseAll(); showLock('setup','Everything was erased.'); } else toast('Type ERASE to confirm',{bad:true}); break;
    case 'lkBack': showLock('unlock'); break;
  }
});
async function catEdit(a,el){
  const p=P(),type=el.dataset.type,id=el.dataset.v;
  if(a==='addItem'){const inp=document.querySelector(`[data-newitem="${CSS.escape(id)}"]`);const nv=(inp.value||'').trim();const c=findCat(id);if(nv&&c&&!c.items.includes(nv)){c.items.push(nv);persist('profile');render(false);}}
  if(a==='delItem'){findCat(id).items.splice(+el.dataset.i,1);persist('profile');render(false);}
  if(a==='addCat'){const inp=document.querySelector(`[data-newcat="${type}"]`);const nm=(inp.value||'').trim();if(!nm)return;
    const used=new Set([...p.categories.expense,...p.categories.income].map(c=>c.color));const color=PALETTE.find(c=>!used.has(c))||PALETTE[p.categories[type].length%PALETTE.length];
    p.categories[type].push({id:'c_'+newId(),name:nm,icon:'🏷️',color,items:[]});persist('profile');render(false);}
  if(a==='delCat'){ if(p.categories[type].length<2) return toast('Keep at least one category');
    if(await ask('Remove this category? Past transactions will show as Uncategorized.','Remove')){p.categories[type]=p.categories[type].filter(c=>c.id!==id);delete p.budgets[id];persist('profile');render(false);} }
}
document.addEventListener('keydown',e=>{
  const t=e.target; if(e.key!=='Enter') return;
  if(t.id==='pu'){e.preventDefault(); lkUnlock(); return;}
  if(t.id==='p1'){e.preventDefault(); $('#p2').focus(); return;}
  if(t.id==='p2'){e.preventDefault(); if(!busyLock) lkCreate(); return;}
  if(t.id==='rp'){e.preventDefault(); lkRestore(); return;}
  if(t.id==='quickIn'){e.preventDefault(); quickAddText(t.value); t.value=''; return;}
  if(t.id==='quickLimit'){e.preventDefault(); $('[data-act="setQuickLimit"]').click(); return;}
  if(t.id==='newPerson'){e.preventDefault(); $('[data-act="addPerson"]').click(); return;}
  if(t.matches('[data-newitem]')){e.preventDefault(); catEdit('addItem',{dataset:{v:t.dataset.newitem}}); return;}
  if(t.matches('[data-newcat]')){e.preventDefault(); catEdit('addCat',{dataset:{type:t.dataset.newcat}}); return;}
  if(t.id==='newItemIn'){e.preventDefault(); $('[data-act="dNewItem"]').click(); return;}
  if(t.id==='spNew'){e.preventDefault(); $('[data-act="spAddPerson"]').click(); return;}
  if(t.id==='dbNew'){e.preventDefault(); $('[data-act="dbAddPerson"]').click(); return;}
  if(t.id==='invNew'){e.preventDefault(); $('[data-act="invAdd"]').click(); return;}
  if(t.dataset.f&&t.dataset.f.startsWith('lines.')&&t.dataset.f.endsWith('.price')){ e.preventDefault(); $('[data-act="lnAdd"]').click(); return; }
  if(t.id==='amt'||t.id==='note'){e.preventDefault(); saveDraft();}
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='p1'){ const st=strengthOf(t.value); const bar=$('#pStr'); if(bar){bar.style.width=(t.value?Math.max(8,st*25):0)+'%'; bar.style.background=['var(--spend)','var(--spend)','var(--warn)','var(--brand)','var(--earn)'][st];} return; }
  if(t.dataset.f&&draft){ if(t.type==='checkbox') return; setPath(draft,t.dataset.f,t.value);
    if(t.dataset.f==='note'&&!draft.manual&&(draft.type==='expense'||draft.type==='income')&&!draft.itemized){ const g=guessCategory(t.value,draft.type); const before=draft.catId+'|'+draft.item;
      if(g){draft.catId=g.catId;draft.item=g.item||'';} if(before!==draft.catId+'|'+draft.item){const pos=t.selectionStart;renderTxDlg();const n=$('#note');n.focus();n.setSelectionRange(pos,pos);return;} }
    updateCalc(); return; }
  if(t.dataset.fd&&fd){ fd[t.dataset.fd]=t.value; if(t.hasAttribute('data-live')) updateAcctPreview(); return; }
  if(t.dataset.input==='txQ'){ state.ui.txQ=t.value; renderTxList(); return; }
  if(t.matches('[data-imptext]')){ imp.text=t.value; return; }
  if(t.dataset.imp==='item'){ imp.rows[+t.dataset.i].item=t.value; return; }
});
document.addEventListener('change',e=>{
  const t=e.target,u=state.ui,p=P();
  if(t.dataset.f&&draft){ const val=t.type==='checkbox'?t.checked:t.value; setPath(draft,t.dataset.f,val);
    if(t.dataset.f==='itemized'&&val&&!draft.lines.length){ draft.lines=[{...blankLine(draft.catId),name:draft.note||'',price:draft.amount||'',item:draft.item||''}]; draft.fx.on=false; }
    if(t.dataset.f==='split.paidBy'&&!draft.split.who.includes(val)) draft.split.who.push(val);
    if(/^lines\.\d+\.name$/.test(t.dataset.f)){ const i=+t.dataset.f.split('.')[1]; const l=draft.lines[i]; if(!l.item){const g=guessCategory(l.name,'expense'); if(g){l.catId=g.catId;l.item=g.item||'';
      const sel=document.querySelector(`[data-f="lines.${i}.catId"]`), it=document.querySelector(`[data-f="lines.${i}.item"]`); if(sel) sel.value=l.catId; if(it){it.value=l.item; it.setAttribute('list','dl-'+l.catId);} }} updateCalc(); return; }
    if(/^lines\.\d+\.catId$/.test(t.dataset.f)){ const i=+t.dataset.f.split('.')[1]; draft.lines[i].item=''; const it=document.querySelector(`[data-f="lines.${i}.item"]`); if(it){it.value='';it.setAttribute('list','dl-'+t.value);} return; }
    if(t.hasAttribute('data-rr')||t.dataset.f==='date'&&draft.repeat||t.dataset.f==='accountId'&&draft.type==='debt') renderTxDlg(); else updateCalc();
    return; }
  if(t.dataset.fd&&fd){ fd[t.dataset.fd]=t.value; if(t.hasAttribute('data-live')) updateAcctPreview(); if(t.dataset.fd==='color'&&fd.kind==='acct') renderAcctEditor(!!fd.id); return; }
  if(t.dataset.imp){ const r=imp.rows[+t.dataset.i]; if(t.dataset.imp==='on'){r.on=t.checked;renderImport();} else r[t.dataset.imp]=t.value; return; }
  if(t.dataset.budget){ const v=num(t.value); if(v>0) p.budgets[t.dataset.budget]=round(v,dec()); else delete p.budgets[t.dataset.budget]; persist('profile'); toast('Budget saved'); return; }
  if(t.dataset.lim){ const k=t.dataset.lim; p.limits[k]=k==='scope'?t.value:round(num(t.value),dec()); if(k==='warnAt') p.limits[k]=+t.value; persist('profile'); toast('Limit saved'); return; }
  if(t.dataset.sec){ secMeta[t.dataset.sec]=+t.value; saveSec(); toast('Saved'); return; }
  if(t.dataset.widget){ p.widgets[t.dataset.widget]=t.checked; persist('profile'); return; }
  if(t.dataset.catf){ const c=findCat(t.dataset.v); if(c){ const val=t.value.trim(); if(t.dataset.catf==='name'&&!val) return; c[t.dataset.catf]=t.dataset.catf==='icon'?[...val].slice(0,2).join(''):val; persist('profile'); } return; }
  switch(t.dataset.change){
    case 'acctFilter': u.acct=t.value; render(); break;
    case 'txType': u.txType=t.value; renderTxList(); break;
    case 'txCat': u.txCat=t.value; renderTxList(); break;
    case 'currency': p.currency=t.value; p.decimals=(CURRENCIES.find(c=>c[0]===t.value)||[0,2])[1]; persist('profile'); render(); break;
    case 'weekStart': p.weekStart=+t.value; persist('profile'); render(); break;
    case 'theme': p.theme=t.value; applyTheme(); persist('profile'); break;
  }
});
document.addEventListener('toggle',e=>{ const t=e.target; if(t.matches&&t.matches('details.acc')){ state.ui.sOpen=state.ui.sOpen||{}; state.ui.sOpen[t.dataset.k]=t.open; } },true);
$('#receiptFile').addEventListener('change',e=>{ const f=e.target.files&&e.target.files[0]; e.target.value=''; if(f) scanReceipt(f); });
$('#backupFile').addEventListener('change',e=>{ const f=e.target.files&&e.target.files[0]; e.target.value=''; if(f) readBackupFile(f); });


/* ================= encrypted local vault =================
   Data key (random AES-256-GCM) encrypts everything. It is itself encrypted ("wrapped")
   with a key derived from the passcode (PBKDF2-SHA256, 600k iterations, random salt).
   Only ciphertext is ever written to storage. Keys live in memory only while unlocked. */
const TE=new TextEncoder(),TD=new TextDecoder();
const b64=buf=>{let s='';const b=buf instanceof Uint8Array?buf:new Uint8Array(buf);for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s)};
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const ITER=600000;
let idb=null,DEK=null,DEKraw=null,vaultRec=null;
let secMeta={autoLock:1,wipeAfter:0,fails:0,lockUntil:0,lastBackup:null};

function idbOpen(){return new Promise((res,rej)=>{const r=indexedDB.open('masroof-vault',1);r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('kv');d.createObjectStore('receipts')};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function idbDo(store,mode,fn){return new Promise((res,rej)=>{const tx=idb.transaction(store,mode);const r=fn(tx.objectStore(store));tx.oncomplete=()=>res(r&&r.result);tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error)})}
const kvGet=k=>idbDo('kv','readonly',s=>s.get(k));
const kvSet=(k,v)=>idbDo('kv','readwrite',s=>s.put(v,k));
const kvDel=k=>idbDo('kv','readwrite',s=>s.delete(k));
const rcGet=k=>idbDo('receipts','readonly',s=>s.get(k));
const rcSet=(k,v)=>idbDo('receipts','readwrite',s=>s.put(v,k));
const rcDel=k=>idbDo('receipts','readwrite',s=>s.delete(k));
const rcKeys=()=>idbDo('receipts','readonly',s=>s.getAllKeys());
const rcClear=()=>idbDo('receipts','readwrite',s=>s.clear());
const saveSec=()=>kvSet('meta',secMeta).catch(()=>{});

async function kekFrom(pass,salt,iter){const base=await crypto.subtle.importKey('raw',TE.encode(pass.normalize('NFC')),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:iter,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function sealB64(key,bytes){const iv=crypto.getRandomValues(new Uint8Array(12));const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes);return {iv:b64(iv),ct:b64(ct)}}
async function openB64(key,o){return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(o.iv)},key,unb64(o.ct)))}
async function wrapWith(pass,raw){const salt=crypto.getRandomValues(new Uint8Array(16));const kek=await kekFrom(pass,salt,ITER);return {salt:b64(salt),iter:ITER,wrap:await sealB64(kek,raw)}}
async function unwrapWith(pass,rec){const kek=await kekFrom(pass,unb64(rec.salt),rec.iter||ITER);return openB64(kek,rec.wrap)} // throws if wrong passcode
const importDEK=raw=>crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);

let saveTimer=null,saving=Promise.resolve();
function scheduleSave(){ if(!DEK) return; clearTimeout(saveTimer); saveTimer=setTimeout(saveNow,350); }
function saveNow(){
  clearTimeout(saveTimer); if(!DEK||!vaultRec) return saving;
  const key=DEK, payload=TE.encode(JSON.stringify({profile:state.profile,months:state.months}));
  saving=saving.then(async()=>{ vaultRec.data=await sealB64(key,payload); vaultRec.updated=Date.now(); await kvSet('vault',vaultRec); })
    .catch(()=>toast('Couldn\u2019t save — is the phone out of storage?',{bad:true}));
  return saving;
}
async function putReceipt(blob){
  if(!DEK) throw new Error('locked'); const id='r_'+newId(); const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},DEK,await blob.arrayBuffer()); await rcSet(id,{iv,ct,type:blob.type||'image/jpeg'}); return id;
}
async function receiptURL(id){ const r=await rcGet(id); if(!r||!DEK) return null; const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:r.iv},DEK,r.ct); return URL.createObjectURL(new Blob([pt],{type:r.type})); }
async function cleanReceipts(){ try{ const used=new Set(allTx().map(t=>t.receipt).filter(Boolean)); for(const k of await rcKeys()) if(!used.has(k)) await rcDel(k); }catch(e){} }

/* ---------- lock screen ---------- */
let lockMode='unlock',busyLock=false,lastActive=Date.now(),hiddenAt=null,lockTick=null;
function showLock(kind,msg){
  lockMode=kind; document.body.classList.add('locked'); $('#main').hidden=true; $('#lock').hidden=false; applyTheme();
  const L=$('#lock'); const wait=Math.max(0,Math.ceil((secMeta.lockUntil-Date.now())/1000));
  if(kind==='setup') L.innerHTML=`<div class="lockbox"><img class="lock-logo" src="./images/logo-mark.jpg" alt=""><h1>Keep your money private</h1>
    <p>Choose a passcode. Everything you record is encrypted with it and stays on this iPhone — nothing is uploaded, and nobody (including the app’s maker) can read it.</p>
    <input type="text" autocomplete="username" value="Masroof" hidden aria-hidden="true">
    <input class="inp" id="p1" type="password" autocomplete="new-password" placeholder="New passcode, 6+ characters" aria-label="New passcode">
    <div class="strength"><i id="pStr" style="width:0"></i></div><p class="hint" id="pHint">Longer is stronger. Six random digits is the minimum; a short phrase is better.</p>
    <input class="inp" id="p2" type="password" autocomplete="new-password" placeholder="Type it again" aria-label="Repeat passcode">
    <label class="check"><input type="checkbox" class="tick" id="pAck"> I understand that if I forget this passcode, my data can’t be recovered by anyone.</label>
    <p class="err" id="lockErr">${esc(msg||'')}</p>
    <button class="btn primary" data-act="lkCreate">Create passcode</button>
    <button class="btn link" data-act="restore" style="align-self:center">Restore from a backup file instead</button></div>`;
  else if(kind==='restorePass') L.innerHTML=`<div class="lockbox"><div class="shield">📦</div><h1>Open the backup</h1>
    <p>Enter the passcode that was in use when this backup was made. After restoring, that becomes your passcode.</p>
    <input type="text" autocomplete="username" value="Masroof" hidden aria-hidden="true">
    <input class="inp" id="rp" type="password" autocomplete="current-password" placeholder="Backup passcode" aria-label="Backup passcode">
    <p class="err" id="lockErr">${esc(msg||'')}</p><button class="btn primary" data-act="lkRestore">Restore</button>
    <button class="btn link" data-act="lkCancelRestore" style="align-self:center">Cancel</button></div>`;
  else L.innerHTML=`<div class="lockbox"><img class="lock-logo" src="./images/logo-mark.jpg" alt=""><h1>Welcome back</h1>
    <p>Enter your passcode to open Masroof.</p>
    <input type="text" autocomplete="username" value="Masroof" hidden aria-hidden="true">
    <input class="inp" id="pu" type="password" autocomplete="current-password" placeholder="Passcode" aria-label="Passcode"${wait?' disabled':''}>
    <p class="err" id="lockErr">${wait?`Too many tries. Wait ${wait} seconds.`:esc(msg||'')}</p>
    <button class="btn primary" data-act="lkUnlock"${wait?' disabled':''}>Unlock</button>
    <button class="btn link" data-act="lkForgot" style="align-self:center">Forgot passcode?</button></div>`;
  if(wait&&kind==='unlock') setTimeout(()=>{ if(lockMode==='unlock'&&!DEK) showLock('unlock'); },1000*Math.min(wait,5));
  setTimeout(()=>{const i=L.querySelector('input.inp:not([disabled])'); if(i) i.focus();},80);
}
function strengthOf(p){ let s=0; if(p.length>=6)s++; if(p.length>=10)s++; if(p.length>=14)s++; if(/[a-z]/i.test(p)&&/\d/.test(p))s++; if(/[^a-z0-9]/i.test(p))s++; if(/^(\d)\1+$|^(012345|123456|654321|111111|000000)/.test(p)) s=0; return Math.min(4,s); }
function lockErr(m){const e=$('#lockErr'); if(e) e.textContent=m;}
async function lkCreate(){
  const p1=$('#p1').value,p2=$('#p2').value;
  if(p1.length<6) return lockErr('Use at least 6 characters.');
  if(strengthOf(p1)===0) return lockErr('That passcode is too easy to guess.');
  if(p1!==p2) return lockErr('The two passcodes don\u2019t match.');
  if(!$('#pAck').checked) return lockErr('Tick the box to confirm you understand.');
  busyLock=true; lockErr('Securing…');
  const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
  DEKraw=new Uint8Array(await crypto.subtle.exportKey('raw',key)); DEK=await importDEK(DEKraw);
  vaultRec={v:1,...await wrapWith(p1,DEKraw),data:null,created:Date.now()};
  state.profile=defaultProfile(); state.months={};
  await saveNow(); busyLock=false; secMeta.fails=0; saveSec(); afterUnlock(true);
}
async function lkUnlock(){
  const inp=$('#pu'); if(!inp||busyLock) return; const pass=inp.value; if(!pass) return;
  busyLock=true; lockErr('Checking…');
  try{
    const rec=await kvGet('vault'); const raw=await unwrapWith(pass,rec);
    const key=await importDEK(raw); const data=JSON.parse(TD.decode(await openB64(key,rec.data)));
    DEKraw=raw; DEK=key; vaultRec=rec; state.profile=data.profile; state.months=data.months||{};
    secMeta.fails=0; secMeta.lockUntil=0; saveSec(); busyLock=false; afterUnlock(false);
  }catch(e){
    busyLock=false; secMeta.fails=(secMeta.fails||0)+1;
    if(secMeta.wipeAfter>0&&secMeta.fails>=secMeta.wipeAfter){ await eraseAll(); return showLock('setup','Too many wrong passcodes — all data was erased.'); }
    if(secMeta.fails>=5) secMeta.lockUntil=Date.now()+30000*2**Math.min(6,secMeta.fails-5);
    await saveSec(); inp.value='';
    const left=secMeta.wipeAfter>0?` ${secMeta.wipeAfter-secMeta.fails} tries left before everything is erased.`:'';
    showLock('unlock','Wrong passcode.'+left);
  }
}
function afterUnlock(isNew){
  document.body.classList.remove('locked'); $('#lock').hidden=true; $('#lock').innerHTML=''; $('#main').hidden=false;
  fillProfile(); state.ready=true; lastActive=Date.now(); openDay=todayStr();
  if(!isNew) runRecurring();
  state.ui.tab='home'; render(); window.scrollTo(0,0);
  if(navigator.storage&&navigator.storage.persist) navigator.storage.persist().then(v=>{persistGranted=v;}).catch(()=>{});
  setTimeout(cleanReceipts,3000);
  if(!isNew&&(!secMeta.lastBackup||dayDiff(secMeta.lastBackup,todayStr())>30)&&allTx().length>20) setTimeout(()=>toast('It\u2019s been a while — save an encrypted backup in Settings'),1500);
}
let persistGranted=null;
const storageNote=()=>persistGranted===true?'Protected from automatic clean-up':persistGranted===false?'Add to Home Screen so iOS keeps it':'On this device only';
async function lockNow(){
  if(!DEK) return; await saveNow();
  DEK=null; DEKraw=null; state.ready=false; state.profile=null; state.months={}; closeStory();
  draft=null; fd=null; imp={text:'',rows:[],busy:false,ctl:null,msg:''};
  for(const id of ['#dlg','#askDlg']){const d=$(id); if(d.open) d.close(); d.innerHTML='';}
  $('#main').innerHTML=''; $('#toast').classList.remove('on');
  showLock('unlock');
}
async function eraseAll(){
  DEK=null; DEKraw=null; vaultRec=null; state.ready=false; state.profile=null; state.months={};
  try{ await kvDel('vault'); await rcClear(); }catch(e){}
  secMeta={autoLock:secMeta.autoLock,wipeAfter:0,fails:0,lockUntil:0,lastBackup:null}; await saveSec();
}
async function changePass(){
  const d=$('#askDlg');
  d.innerHTML=`<div class="dlg"><div class="dlg-h"><h3>Change passcode</h3></div><div class="dlg-b">
    <input type="text" autocomplete="username" value="Masroof" hidden aria-hidden="true">
    <input class="inp" id="cp0" type="password" autocomplete="current-password" placeholder="Current passcode">
    <input class="inp" id="cp1" type="password" autocomplete="new-password" placeholder="New passcode (6+ characters)">
    <input class="inp" id="cp2" type="password" autocomplete="new-password" placeholder="New passcode again"><p class="err" id="cpErr"></p></div>
    <div class="dlg-f"><span class="spacer"></span><button class="btn" data-a="no">Cancel</button><button class="btn primary" data-a="yes">Change</button></div></div>`;
  d.oncancel=null;
  d.onclick=async e=>{const b=e.target.closest('[data-a]'); if(!b) return; if(b.dataset.a==='no') return d.close();
    const err=m=>{$('#cpErr').textContent=m}; const o=$('#cp0').value,n1=$('#cp1').value,n2=$('#cp2').value;
    if(n1.length<6||strengthOf(n1)===0) return err('Choose a stronger new passcode (6+ characters).'); if(n1!==n2) return err('The new passcodes don\u2019t match.');
    err('Checking…'); try{ await unwrapWith(o,vaultRec); }catch(_){ return err('Current passcode is wrong.'); }
    Object.assign(vaultRec,await wrapWith(n1,DEKraw)); await kvSet('vault',vaultRec); d.close(); toast('Passcode changed. Older backups still open with the old one.'); };
  d.showModal();
}

/* ---------- files: backups & CSV ---------- */
function offerFile(name,data,type,note){
  const file=new File([data],name,{type});
  const d=$('#askDlg');
  d.innerHTML=`<div class="dlg"><div class="dlg-h"><h3>File ready</h3></div><div class="dlg-b"><p style="margin:0"><b>${esc(name)}</b> · ${(file.size/1024/1024).toFixed(file.size>1e6?1:2)} MB</p>
    <p class="hint">${note||'Choose “Save to Files” to keep it in iCloud Drive or on the phone.'}</p></div>
    <div class="dlg-f"><span class="spacer"></span><button class="btn" data-a="no">Close</button><button class="btn primary" data-a="save">Save…</button></div></div>`;
  d.oncancel=null;
  d.onclick=async e=>{const b=e.target.closest('[data-a]'); if(!b) return; if(b.dataset.a==='no') return d.close();
    try{ if(navigator.canShare&&navigator.canShare({files:[file]})){ await navigator.share({files:[file],title:name}); d.close(); return; } }catch(err){ if(err&&err.name==='AbortError') return; }
    const url=URL.createObjectURL(file); const a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),60000); d.close(); };
  d.showModal();
}
async function makeBackup(withReceipts){
  await saveNow(); toast('Preparing backup…');
  const out={app:'masroof',kind:'encrypted-backup',v:1,created:new Date().toISOString(),vault:clone(vaultRec)};
  if(withReceipts){ out.receipts={}; for(const k of await rcKeys()){const r=await rcGet(k); if(r) out.receipts[k]={iv:b64(r.iv),ct:b64(r.ct),type:r.type};} }
  secMeta.lastBackup=todayStr(); saveSec();
  offerFile(`masroof-backup-${todayStr()}.json`,JSON.stringify(out),'application/json','Encrypted — it opens only with your current passcode. Choose “Save to Files” and keep it in iCloud Drive or on a computer.');
}
let pendingRestore=null;
async function readBackupFile(file){
  try{ const j=JSON.parse(await file.text()); if(j.app!=='masroof'||!j.vault||!j.vault.wrap) throw 0; pendingRestore=j;
    if(DEK){ if(!(await ask('Restoring replaces everything on this phone with the backup. Continue?','Continue'))){pendingRestore=null;return;} await lockNow(); }
    showLock('restorePass');
  }catch(e){ toast('That file isn\u2019t a Masroof backup',{bad:true}); }
}
async function lkRestore(){
  const pass=($('#rp')||{}).value; if(!pass||!pendingRestore||busyLock) return; busyLock=true; lockErr('Opening…');
  try{ const rec=pendingRestore.vault; const raw=await unwrapWith(pass,rec); const key=await importDEK(raw); const data=JSON.parse(TD.decode(await openB64(key,rec.data)));
    await rcClear(); for(const [k,r] of Object.entries(pendingRestore.receipts||{})) await rcSet(k,{iv:unb64(r.iv),ct:unb64(r.ct).buffer,type:r.type});
    await kvSet('vault',rec); vaultRec=rec; DEKraw=raw; DEK=key; state.profile=data.profile; state.months=data.months||{}; pendingRestore=null; busyLock=false;
    secMeta.fails=0; secMeta.lockUntil=0; saveSec(); afterUnlock(false); toast('Backup restored');
  }catch(e){ busyLock=false; lockErr('That passcode doesn\u2019t open this backup.'); }
}

/* ---------- auto-lock ---------- */
['pointerdown','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,()=>{lastActive=Date.now()},{passive:true,capture:true}));
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){ hiddenAt=Date.now(); saveNow(); if(DEK&&+secMeta.autoLock===0) lockNow(); }
  else { if(DEK&&hiddenAt&&Date.now()-hiddenAt>Math.max(1,+secMeta.autoLock)*60000) lockNow(); hiddenAt=null; newDayCheck(); }
});
// the app can stay open past midnight: catch up repeating payments and move "today" along
let openDay=todayStr();
function newDayCheck(){
  const t=todayStr(); if(t===openDay) return; const was=openDay; openDay=t;
  if(!DEK||!state.ready) return;
  const u=state.ui; if(u.anchor===was) u.anchor=t; if(u.txMonth===was.slice(0,7)) u.txMonth=t.slice(0,7);
  runRecurring(); if(!$('#dlg').open) render(false);
}
setInterval(newDayCheck,60000);
window.addEventListener('pagehide',()=>{ saveNow(); });
setInterval(()=>{ if(DEK&&+secMeta.autoLock>0&&Date.now()-lastActive>secMeta.autoLock*60000&&!$('#dlg').open) lockNow(); },15000);

/* ================= on-device receipt reading =================
   Uses a bundled copy of Tesseract (in ./ocr). The photo is processed on the phone. */
let ocrWorker=null,ocrProgress=null,scanBusy=false;
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('Missing '+src));document.head.appendChild(s)})}
async function getOcr(){
  if(ocrWorker) return ocrWorker;
  if(!window.Tesseract) await loadScript('./ocr/tesseract.min.js');
  const baseUrl=new URL('./',location.href).href;
  ocrWorker=await Tesseract.createWorker('eng',1,{workerPath:baseUrl+'ocr/worker.min.js',corePath:baseUrl+'ocr/',langPath:baseUrl+'ocr/lang',workerBlobURL:false,cacheMethod:'none',logger:m=>ocrProgress&&ocrProgress(m)});
  await ocrWorker.setParameters({tessedit_pageseg_mode:'6',preserve_interword_spaces:'1'});
  return ocrWorker;
}
async function prepImage(file){
  const bmp=await createImageBitmap(file);
  const maxSide=2200; let s=Math.min(1,maxSide/Math.max(bmp.width,bmp.height)); if(Math.max(bmp.width,bmp.height)<1000) s=2;
  const cv=document.createElement('canvas'); cv.width=Math.round(bmp.width*s); cv.height=Math.round(bmp.height*s);
  const cx=cv.getContext('2d'); cx.drawImage(bmp,0,0,cv.width,cv.height);
  const store=await new Promise(r=>{ const c2=document.createElement('canvas'); const k=Math.min(1,1600/Math.max(cv.width,cv.height)); c2.width=Math.round(cv.width*k); c2.height=Math.round(cv.height*k); c2.getContext('2d').drawImage(cv,0,0,c2.width,c2.height); c2.toBlob(b=>r(b),'image/jpeg',.82); });
  // greyscale + contrast stretch for reading
  const im=cx.getImageData(0,0,cv.width,cv.height),px=im.data; let lo=255,hi=0; const g=new Uint8ClampedArray(px.length/4);
  for(let i=0,j=0;i<px.length;i+=4,j++){const v=0.299*px[i]+0.587*px[i+1]+0.114*px[i+2]; g[j]=v; if(v<lo)lo=v; if(v>hi)hi=v;}
  const r=Math.max(1,hi-lo); for(let i=0,j=0;i<px.length;i+=4,j++){const v=Math.min(255,Math.max(0,(g[j]-lo)*255/r*1.15-10)); px[i]=px[i+1]=px[i+2]=v;}
  cx.putImageData(im,0,0);
  return {canvas:cv,store};
}
const PRICE_RE=/(-?\d{1,5}[.,]\d{2,3})\s*(?:[A-Z]{1,3}|[*#])?\s*$/;
function parseReceiptText(text){
  const raw=text.split(/\r?\n/).map(l=>l.replace(/\s+/g,' ').trim()).filter(Boolean);
  const out={merchant:'',date:null,lines:[],tax:0,service:0,discount:0,total:null,subtotal:null};
  for(const l of raw.slice(0,5)){ if(/[a-z]{3}/i.test(l)&&!/\d{2}[\/.-]\d{2}|tel|phone|vat no|cr no|www|@/i.test(l)){ out.merchant=l.replace(/[^\p{L}\p{N}&'. -]/gu,'').trim(); break; } }
  const dm=text.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/)||null;
  if(dm){ let y=+dm[3]; if(y<100) y+=2000; const d=new Date(y,+dm[2]-1,+dm[1]); if(!isNaN(d)&&y>2000) out.date=ymd(d); }
  else { const im=text.match(/(20\d{2})-(\d{2})-(\d{2})/); if(im) out.date=im[0]; }
  let pending=null;
  for(const l of raw){
    const low=l.toLowerCase(); const m=l.match(PRICE_RE);
    if(!m){ if(/[a-z]{3}/i.test(l)&&!/(thank|welcome|tel|phone|www|vat no|tax no|receipt|invoice|cashier|table|date|time|bill no|order)/i.test(l)) pending=l; continue; }
    const amt=Math.abs(num(m[1].replace(',','.'))); let label=l.slice(0,m.index).trim();
    if(/sub\s*-?\s*total/.test(low)){ out.subtotal=amt; pending=null; continue; }
    if(/\b(vat|tax)\b/.test(low)){ out.tax+=amt; pending=null; continue; }
    if(/service/.test(low)){ out.service+=amt; pending=null; continue; }
    if(/(discount|disc\b|savings|promo|offer|coupon)/.test(low)){ out.discount+=amt; pending=null; continue; }
    if(/(grand total|net total|total|net amount|amount due|net payable|to pay|balance due)/.test(low)){ out.total=amt; pending=null; continue; }
    if(/(cash|change|card|visa|master|paid|tender|rounding|points|auth|approval|balance|tip)/.test(low)){ pending=null; continue; }
    let qty=1,unit=null;
    const q=label.match(/(\d+(?:[.,]\d+)?)\s*(?:x|X|@|\*)\s*(\d+[.,]\d{2,3})?\s*$/)||label.match(/^(\d+)\s*(?:x|X|@|\*)\s*/);
    if(q){ qty=num(q[1].replace(',','.'))||1; if(q[2]) unit=num(q[2].replace(',','.')); label=label.replace(q[0],' ').trim(); }
    if(!/[a-z]{2}/i.test(label)){ if(pending){ label=pending; } else continue; }
    else if(pending&&label.length<3){ label=pending; }
    pending=null;
    label=label.replace(/^[\d#*\-.:]+\s+/,'').replace(/\s{2,}/g,' ').trim();
    if(label.length<2) continue;
    const price=unit!=null?unit:(qty>0?amt/qty:amt);
    out.lines.push({name:label.charAt(0).toUpperCase()+label.slice(1).toLowerCase(),qty,price});
  }
  return out;
}
async function scanReceipt(file){
  if(!file||!draft||scanBusy) return; const d=draft; scanBusy=true;
  d._scanMsg='Preparing the photo…'; renderTxDlg();
  try{
    const {canvas,store}=await prepImage(file);
    d._blob=store; if(d._blobUrl) URL.revokeObjectURL(d._blobUrl); d._blobUrl=URL.createObjectURL(store);
    const setMsg=m=>{ d._scanMsg=m; const e=$('#scanMsg'); if(e&&draft===d) e.textContent=m; };
    setMsg(ocrWorker?'Reading the receipt…':'Starting the reader (first time takes a few seconds)…');
    ocrProgress=m=>{ if(m.status==='recognizing text') setMsg(`Reading… ${Math.round(m.progress*100)}%`); };
    const w=await getOcr(); const res=await w.recognize(canvas);
    if(draft!==d) return;
    const r=parseReceiptText(res.data.text||'');
    const fallbackCat=(d.catId)||((r.merchant&&guessCategory(r.merchant,'expense'))||{}).catId||'food';
    const lines=r.lines.map(l=>{const g=guessCategory(l.name,'expense')||{}; return {name:l.name.slice(0,60),qty:String(+l.qty.toFixed(3)),price:String(round(l.price,dec()+1)),catId:g.catId||fallbackCat,item:g.item||'',who:[]};});
    if(!lines.length){ d._scanMsg='No priced lines found. Try a flat, well-lit photo filling the screen — or type the items.'; d.itemized=true; if(!d.lines.length) d.lines=[blankLine(fallbackCat)]; return; }
    d.type='expense'; d.itemized=true; d.fx.on=false; d.lines=d.lines.filter(l=>lineTotal(l)>0).concat(lines);
    const sub=sum(lines,lineTotal);
    d.taxMode='amt'; d.tax=r.tax?String(r.tax):''; d.serviceMode='amt'; d.service=r.service?String(r.service):''; d.discount=r.discount?String(r.discount):'';
    if(r.merchant&&!d.note) d.note=r.merchant.slice(0,60);
    if(r.date&&r.date<=todayStr()) d.date=r.date;
    d._scanTotal=r.total||null; d.catId=d.catId||lines[0].catId; d.manual=true;
    const checkSub=r.subtotal&&Math.abs(r.subtotal-sub)>10**-dec()*5;
    d._scanMsg=`Found ${lines.length} item${lines.length>1?'s':''}${r.merchant?' at '+r.merchant:''}. Please check the numbers${checkSub?` — the receipt’s subtotal is ${money(r.subtotal)}, items add up to ${money(sub)}`:''}.`;
  }catch(e){ d._scanMsg='Couldn\u2019t read that photo. Try again, or type the items.'; }
  finally{ scanBusy=false; ocrProgress=null; if(draft===d) renderTxDlg(); }
}

/* ---------- start ---------- */
let booted=false;
async function boot(){
  if(!window.crypto||!crypto.subtle||!window.indexedDB){ $('#main').innerHTML='<div class="loading">This browser can\u2019t encrypt data. Open the app in Safari.</div>'; return; }
  try{ idb=await idbOpen(); }catch(e){ $('#main').innerHTML='<div class="loading">Storage is blocked. In Safari, turn off Private Browsing.</div>'; return; }
  const m=await kvGet('meta').catch(()=>null); if(m) secMeta={...secMeta,...m};
  const v=await kvGet('vault').catch(()=>null);
  $('#main').innerHTML='';
  showLock(v?'unlock':'setup'); booted=true;
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
}

boot();
(function(){const sp=$('#splash'); if(!sp) return; const t0=performance.now(); const hide=()=>{ sp.classList.add('gone'); setTimeout(()=>sp.remove(),600); };
  sp.addEventListener('click',hide); const wait=()=>{ if(booted&&performance.now()-t0>900) hide(); else setTimeout(wait,100); }; wait(); setTimeout(hide,5000); })();
})();

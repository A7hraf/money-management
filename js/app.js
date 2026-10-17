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
// the version shown in Settings › About; version.json on the site holds the newest one
const APP_VERSION='4.0';
// language: English or Arabic (the Arabic words live in js/i18n.js). Day/month names switch in place.
let LANG='en';
const MONTHS_EN=MONTHS.slice(), MONTHS_AR=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const DOW_AR=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'], DOW1_AR=['ح','ن','ث','ر','خ','ج','س'], DOW2_AR=['أحد','اثن','ثلا','أرب','خمي','جمع','سبت'];
const monS=i=>LANG==='ar'?MONTHS[i]:MONTHS[i].slice(0,3);
const dowS=(i,n)=>LANG==='ar'?(n===1?DOW1_AR:DOW2_AR)[i]:DOW[i].slice(0,n);
const dayPl=i=>LANG==='ar'?'أيام '+DOW[i]:DOW[i]+'s';
const DOW=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']; const DOW_EN=DOW.slice();
const round=(n,d)=>Math.round((+n||0)*10**d)/10**d;
const norm=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
const num=v=>{const n=parseFloat(String(v??'').replace(/,/g,'').replace(/[^\d.\-]/g,''));return isFinite(n)?n:0};
const sum=(a,f=x=>x)=>a.reduce((t,x)=>t+(+f(x)||0),0);
const dayDiff=(a,b)=>Math.round((pd(b)-pd(a))/864e5);
const fmtD=(s,o)=>pd(s).toLocaleDateString(LANG==='ar'?'ar-OM-u-nu-latn':'en-GB',o);
const shortD=s=>fmtD(s,{day:'numeric',month:'short'});
const clone=o=>JSON.parse(JSON.stringify(o));

const PALETTE=['#E0782F','#3D7DD8','#8A5CD6','#D64F86','#2BA38A','#D9A514','#4F9A3A','#C2555A','#1FA5C9','#7D8B88','#B36B2C','#5B6EE1','#0E8F7E','#A0522D'];
/* ---------- currencies ----------
   js/fx.js lists the currencies Masroof recognises, with their country and an approximate rate.
   A transaction paid in another currency is stored in your currency, and keeps the original
   amount, the currency and the rate used in tx.fx ({cur, orig, rate, est} — est: rate looked up, not the bank's). */
const FX=window.MASROOF_FX||{asOf:'',list:[{code:'OMR',dec:3,flag:'🇴🇲',country:'Oman',countryAr:'عُمان',iso:'OM',city:'Muscat',cityAr:'مسقط',lat:23.588,lng:58.383,perUSD:0.384497,words:'OMR'}],extra:[]};
const FXC=Object.fromEntries(FX.list.map(c=>[c.code,c]));
const fxInfo=code=>FXC[code]||null;
const CURRENCIES=FX.list.map(c=>[c.code,c.dec]).sort((a,b)=>a[0]<b[0]?-1:1);
const CUR_RE=FX.list.map(c=>c.words).join('|');
const CUR_ONE=FX.list.map(c=>({code:c.code,re:new RegExp('^(?:'+c.words+')$','iu')}));
// words several countries use ("riyal", "dinar", "$"…) mean your own currency when it's one of them
const CUR_AMBIG=[[/^(?:riyals?|rials?|ريال)$/i,['OMR','SAR','QAR']],[/^(?:dinars?|دينار)$/i,['KWD','BHD','JOD','IQD','TND']],[/^(?:dirhams?|dhs?\.?|درهم)$/i,['AED','MAD']],
  [/^(?:\$|dollars?|bucks|دولار)$/i,['USD','SGD','AUD','CAD','HKD','NZD']],[/^(?:pounds?|جنيه)$/i,['GBP','EGP']],[/^(?:rupees?|rs\.?|روبية)$/i,['INR','PKR','LKR','NPR']],[/^(?:pesos?)$/i,['PHP','MXN']]];
const curCode=s=>{ s=String(s||'').replace(/\s+/g,' ').trim(); const a=CUR_AMBIG.find(([re])=>re.test(s)); if(a&&a[1].includes(cur())) return cur();
  const c=CUR_ONE.find(x=>x.re.test(s)); return c?c.code:null; };
const isLocalCur=c=>curCode(c)===cur();
const FX_ISO=Object.fromEntries([...FX.list.filter(c=>c.iso!=='EU'),...FX.extra].map(c=>[c.iso,c]));
const FX_CITY_AR=Object.fromEntries([...FX.list,...FX.extra].map(c=>[c.city,c.cityAr]));
const ctryName=c=>LANG==='ar'?c.countryAr:c.country;
function fxRates(){ const r={}; for(const c of FX.list) r[c.code]=c.perUSD; const L=P().fxLive; if(L&&L.rates) for(const k in L.rates) if(r[k]&&L.rates[k]>0) r[k]=L.rates[k]; return r; }
// how much of `to` (your currency by default) one unit of `from` is worth
function fxRate(from,to){ to=to||cur(); if(from===to) return 1; const mine=to===cur()&&(P().fxMine||{})[from]; if(mine>0) return mine; const r=fxRates(); return r[from]&&r[to]?r[to]/r[from]:0; }
const fxRound=x=>x>0?+x.toPrecision(6):0;
const fxConv=(v,from)=>round(v*fxRate(from),dec());
const fxSourceText=()=>{ const L=P().fxLive; return L&&L.at?`Rates from ${fmtD(L.date||ymd(new Date(L.at)),{day:'numeric',month:'short',year:'numeric'})}`:'Built-in rates'; };
const curFmt=(v,code)=>{ if(P().hide) return '•••• '+code; const c=fxInfo(code), d=c?c.dec:2; return Number(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})+' '+code; };
function fxLine(fx,iso){ const c=(iso&&FX_ISO[iso])||fxInfo(fx.cur); return `<b data-notr>${c?c.flag+' ':''}${curFmt(fx.orig,fx.cur)}</b>${c?` <span data-notr>· ${esc(ctryName(c))}</span>`:''}`; }
// the country a transaction was made in: from the card SMS's country code, else its currency
function countryOf(t){ const c=(t.ctry&&FX_ISO[t.ctry])||(t.fx&&fxInfo(t.fx.cur)); const home=fxInfo(cur()); return c&&!(home&&c.iso===home.iso)?c:null; }
const TYPE_LABEL={bank:'Bank account',card:'Credit card',cash:'Cash',wallet:'E‑wallet',savings:'Savings'};
const INV_TYPES={stocks:'Stocks',funds:'Funds / ETFs',gold:'Gold',crypto:'Crypto',property:'Property',deposit:'Fixed deposit',business:'Business',other:'Other'};
const INV_COLORS={stocks:'#3D7DD8',funds:'#2BA38A',gold:'#D9A514',crypto:'#8A5CD6',property:'#B36B2C',deposit:'#1FA5C9',business:'#D64F86',other:'#7D8B88'};
const DEBT_KIND={lent:['give','Lent to'],repaid_out:['give','Paid back'],borrowed:['receive','Borrowed from'],repaid_in:['receive','Paid you back:']};
const WIDGETS=[['recap','Monthly recap'],['today','Today\u2019s limit'],['quick','Quick add'],['subs','Subscriptions & fixed costs'],['trend','Spending chart'],['insights','What stands out'],['merchants','Where you spend'],['tags','Tags'],['paidFrom','Paid from (accounts)'],['people','Friends & debts'],['upcoming','Coming up'],['forecast','Month-end forecast'],['map','Spending map']];

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
  return {v:2,currency:'OMR',decimals:3,weekStart:0,theme:'dark',
    accounts:[{id:'a_bank',name:'Main bank account',type:'bank',opening:0},{id:'a_card',name:'Credit card',type:'card',opening:0},{id:'a_cash',name:'Cash',type:'cash',opening:0},{id:'a_save',name:'Savings',type:'savings',opening:0}],
    categories:defaultCategories(),budgets:{},recurring:[],learned:{},
    people:[],investments:[],goals:[],quick:[],
    limits:{mode:'off',daily:0,monthly:0,scope:'daily',warnAt:80},
    widgets:Object.fromEntries(WIDGETS.map(w=>[w[0],true]))};
}
const KEYWORDS=[
  // Arabic words people type or see in bank messages
  ['كرك','food','Tea & karak'],['شاي','food','Tea & karak'],['قهوة','food','Coffee'],['كوفي','food','Coffee'],['مطعم','food','Restaurant'],['بيتزا','food','Pizza'],['برجر','food','Burger'],
  ['شاورما','food','Shawarma'],['مشاوي','food','Grills'],['برياني','food','Rice & biryani'],['مجبوس','food','Rice & biryani'],['شواء','food','Rice & biryani'],['حلويات','food','Sweets & desserts'],['عصير','food','Juice & drinks'],
  ['لولو','groceries',''],['كارفور','groceries',''],['نستو','groceries',''],['خضار','groceries','Vegetables'],['فواكه','groceries','Fruits'],['خبز','groceries','Bread & bakery'],['حليب','groceries','Dairy & eggs'],
  ['بترول','transport','Fuel'],['وقود','transport','Fuel'],['بنزين','transport','Fuel'],['المها','transport','Fuel'],['نفط عمان','transport','Fuel'],['تاكسي','transport','Taxi'],['مواقف','transport','Parking'],
  ['كهرباء','bills','Electricity'],['نماء','bills','Electricity'],['مياه','bills','Water'],['إنترنت','bills','Internet'],['انترنت','bills','Internet'],['عمانتل','bills','Mobile'],['أوريدو','bills','Mobile'],['اوريدو','bills','Mobile'],['إيجار','bills','Rent'],['ايجار','bills','Rent'],
  ['صيدلية','health','Pharmacy'],['مستشفى','health','Doctor'],['عيادة','health','Doctor'],['ملابس','shopping','Clothes'],['عطور','shopping','Perfume'],['هدية','family','Gifts'],['صدقة','family','Charity'],['زكاة','family','Zakat'],
  ['راتب','salary','Monthly salary'],
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
const downloadsNs={save:async({filename,data})=>{offerFile(filename,data,'text/csv','This CSV is NOT encrypted — anyone who opens the file can read it. Save it somewhere private.');return {status:'offered'};}};
function persist(){ budCache.clear(); scheduleSave(); }
const persistMonth=()=>{ budCache.clear(); scheduleSave(); };
/* monthly budget for a category in the month containing `anchor`. With rollover on, what you
   didn't spend (or overspent) in earlier months since rollover started is added (or taken off). */
const budCache=new Map();
function budgetInfo(id,anchor){
  const base=+P().budgets[id]||0; if(!(base>0)) return null; const R=P().rollover;
  if(!R||!R.from) return {base,carry:0,total:base};
  const [a]=periodRange('month',anchor||todayStr()); const key=id+'|'+a; if(budCache.has(key)) return budCache.get(key);
  let carry=0, d=R.from, g=0;
  while(d<a&&g++<36){ const [ca,cb]=periodRange('month',d); const sp=(summarize(txBetween(ca,cb)).byCat[id]||{}).total||0; carry=carry+base-sp; d=ymd(addDays(pd(cb),1)); }
  const info={base,carry:round(carry,dec()),total:Math.max(0,round(base+carry,dec()))}; budCache.set(key,info); return info;
}
const budgetFor=(id,anchor)=>{ const b=budgetInfo(id,anchor); return b?b.total:0; };

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
function applyTheme(){const t=state.profile&&state.profile.theme||secMeta.theme||'dark'; document.documentElement.dataset.theme=t; document.documentElement.style.setProperty('--blend',(t==='light'||(t==='auto'&&matchMedia('(prefers-color-scheme: light)').matches))?'multiply':'screen');}

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
  if(!opt.show&&state.profile&&state.profile.hide) return '•••';
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
// when an open loan is due: the latest pay-back date on a loan in the same direction as what's owed now
function personDue(id){
  const bal=peopleBalances()[id]||0; if(Math.abs(bal)<10**-dec()) return null;
  const kind=bal>0?'lent':'borrowed'; const L=allTx().filter(t=>t.type==='debt'&&t.personId===id&&t.debtKind===kind&&t.due).sort((a,b)=>a.date<b.date?1:-1)[0];
  return L?{date:L.due,bal,late:L.due<todayStr()}:null;
}
const dueText=x=>x.late?`overdue since ${shortD(x.date)}`:x.date===todayStr()?'due today':`due ${shortD(x.date)}`;
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
// "Month" can start on payday (Settings → General), e.g. 25 Sep – 24 Oct
const mStart=()=>Math.min(28,Math.max(1,Math.round(+P().monthStart)||1));
function cycleOf(d){ const s=mStart(); let y=d.getFullYear(),m=d.getMonth(); if(d.getDate()<s) m--; return [new Date(y,m,s),new Date(y,m+1,s-1)]; }
const inThisCycle=ds=>{ const [a,b]=periodRange('month',todayStr()); return ds>=a&&ds<=b; };
function periodRange(period,anchorStr){
  const d=pd(anchorStr);
  if(period==='day') return [anchorStr,anchorStr];
  if(period==='week'){const off=(d.getDay()-P().weekStart+7)%7;const s=addDays(d,-off);return [ymd(s),ymd(addDays(s,6))]}
  if(period==='month'){ const [s,e]=cycleOf(d); return [ymd(s),ymd(e)]; }
  return [`${d.getFullYear()}-01-01`,`${d.getFullYear()}-12-31`];
}
function shiftAnchor(period,anchorStr,dir){
  const d=pd(anchorStr);
  if(period==='day') return ymd(addDays(d,dir));
  if(period==='week') return ymd(addDays(d,7*dir));
  if(period==='month'){ const [s]=cycleOf(d); return ymd(new Date(s.getFullYear(),s.getMonth()+dir,s.getDate())); }
  return ymd(new Date(d.getFullYear()+dir,0,1));
}
function periodLabel(period,anchorStr){
  const [a,b]=periodRange(period,anchorStr); const d=pd(anchorStr);
  if(period==='day'){ if(a===todayStr()) return 'Today'; if(a===ymd(addDays(new Date(),-1))) return 'Yesterday'; return fmtD(a,{weekday:'short',day:'numeric',month:'short',year:'numeric'}); }
  if(period==='week') return shortD(a)+' – '+fmtD(b,{day:'numeric',month:'short',year:'numeric'});
  if(period==='month') return mStart()===1?MONTHS[d.getMonth()]+' '+d.getFullYear():shortD(a)+' – '+fmtD(b,{day:'numeric',month:'short',year:'numeric'});
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
    const before=sum(txBetween(a,dateStr),t=>t.date<dateStr?countsForLimit(t):0);
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
const REC_FIELDS=['type','amount','accountId','toAccountId','catId','item','note','investmentId','dir','tags','refund','goalId'];
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
  for(const [w,ty] of [['cash','cash'],['card','card'],['visa','card'],['bank','bank'],['wallet','wallet'],['نقد','cash'],['نقدا','cash'],['نقدًا','cash'],['كاش','cash'],['بطاقة','card'],['فيزا','card'],['بنك','bank']]) if(new RegExp('(^|[^\\p{L}])'+w+'([^\\p{L}]|$)','u').test(n)){const a=P().accounts.find(x=>x.type===ty); if(a) return a.id;}
  return null;
}
const defaultAcct=()=>{ if(state.ui.acct!=='all'&&acct(state.ui.acct)) return state.ui.acct; const s=P().accounts.find(a=>hasRole(a,'spending')&&!hasRole(a,'savings')); return (s||P().accounts.find(a=>!hasRole(a,'savings'))||P().accounts[0]).id; };
const salaryAcct=()=>{ if(state.ui.acct!=='all'&&acct(state.ui.acct)) return state.ui.acct; const s=P().accounts.find(a=>hasRole(a,'salary')); return (s||acct(defaultAcct())).id; };
function parseQuick(text){
  const tags=[...text.matchAll(/#([\p{L}\p{N}_-]+)/gu)].map(m=>m[1].toLowerCase());
  let rest=text.replace(/#[\p{L}\p{N}_-]+/gu,' ');
  // the amount, and a currency written next to it: "coffee 15 aed", "$12 uber", "taxi 200 baht"
  const m=rest.match(new RegExp(`(?:(?<![\\p{L}])(${CUR_RE})\\s*)?(\\d+(?:[.,]\\d+)?)(?:\\s*(${CUR_RE})(?![\\p{L}]))?`,'iu'));
  let amount=m?num(m[2].replace(',','.')):0, fx=null;
  if(m){ rest=rest.replace(m[0],' '); const code=curCode(m[1]||m[3]);
    if(code&&code!==cur()&&amount>0&&fxRate(code)>0){ fx={cur:code,orig:amount,rate:fxRound(fxRate(code)),est:true}; amount=fxConv(amount,code); } }
  const accountId=guessAcctFromText(rest);
  if(accountId){ const a=acct(accountId); rest=rest.replace(new RegExp(a.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),' ').replace(/\b(cash|card|visa|bank|wallet)\b/i,' ').replace(/(^|\s)(نقدًا|نقدا|نقد|كاش|بطاقة|فيزا|بنك)(?=\s|$)/u,' '); }
  const desc=rest.replace(/\s+/g,' ').trim();
  const isInc=/^(\+|income|got|received|دخل|راتب|استلمت)/i.test(text.trim());
  const dd=desc.replace(/^\+\s*/,''); return {desc:dd.charAt(0).toUpperCase()+dd.slice(1),amount,accountId:accountId||defaultAcct(),tags,fx,type:isInc?'income':'expense',guess:guessCategory(desc,isInc?'income':'expense')};
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
/* ================= Arabic =================
   The screens are written in English. In Arabic mode every text the app shows is looked up in
   the dictionary in js/i18n.js as it appears: exact phrases, phrases with numbers ({#}), a few
   phrases around names, and "a · b" style lists piece by piece. Numbers stay in Western digits. */
const AR=window.MASROOF_AR||{dict:{},patterns:[]};
const AR_MON='يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر', AR_DAY='الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت';
const TOK_BASE=`(?:(?:${AR_DAY})،?\\s)?\\d{1,2}\\s(?:${AR_MON})(?:\\s\\d{4})?|(?:${AR_MON})(?:\\s\\d{4})?|[−+-]?\\d(?:[\\d,]*\\d)?(?:\\.\\d+)?%?|•••`;
let tokRe=null, tokCur=null;
function tokenRe(){ const c=state.profile&&state.profile.currency||'OMR'; if(!tokRe||tokCur!==c){ tokCur=c; tokRe=new RegExp(`\\b${c.replace(/[^A-Z]/g,'')}\\b|${TOK_BASE}`,'g'); } tokRe.lastIndex=0; return tokRe; }
const arTok=t=>t==='OMR'?'ر.ع':t;
function trFill(tpl,toks){ let i=0; return tpl.replace(/\{(#|\d)\}/g,(_,k)=>arTok(k==='#'?(toks[i++]??''):(toks[+k-1]??''))); }
function trS(s,depth=0){
  if(s&&/^\s*→\s*$/.test(s)) return s.replace('→','←'); // arrows between steps point the reading way
  if(!s||depth>4||!/[A-Za-z]/.test(s)) return s;
  const lead=s.match(/^\s*/)[0], tail=s.match(/\s*$/)[0], t=s.trim(), D=AR.dict; if(!t) return s;
  const wrap=x=>lead+x+tail;
  if(D[t]!=null) return wrap(D[t]);
  const toks=[]; const key=t.replace(tokenRe(),m=>{toks.push(m);return '{#}';});
  if(toks.length&&D[key]!=null) return wrap(trFill(D[key],toks));
  for(const [re,out] of AR.patterns){ const m=t.match(re); if(m) return wrap(out.replace(/\$(\d)/g,(_,i)=>trS(m[+i]||'',depth+1))); }
  let m=t.match(/^([^A-Za-z0-9{(“"\s−+-]+)\s*(.+)$/u); if(m){ const r=trS(m[2],depth+1); if(r!==m[2]) return wrap(m[1]+(/\s$/.test(m[1])||!/\S/.test(m[1])?'':' ')+r); }
  m=t.match(/^(.*[A-Za-z.)?”"])\s*([^A-Za-z0-9.)?”"]+)$/u); if(m){ const r=trS(m[1],depth+1); if(r!==m[1]) return wrap(r+' '+m[2]); }
  for(const sep of [' · ',' — ',' → ',' › ','. ',': ',' – ',', ']){ if(!t.includes(sep)) continue;
    const parts=t.split(sep); const out=parts.map(p=>trS(p,depth+1));
    if(out.some((x,i)=>x!==parts[i])) return wrap(out.join(sep===' → '?' ← ':sep===', '?'، ':sep)); }
  m=t.match(/^(.+?)\s+(\{#\}|[−+-]?\d[\d,.]*%?)$/); if(m){ const r=trS(m[1],depth+1); if(r!==m[1]) return wrap(r+' '+m[2]); }
  return s;
}
const trOrig=new WeakMap();
function trText(n){ const p=n.parentElement; if(!p||p.closest('[data-notr],script,style,textarea')) return; if(p.tagName==='OPTION'&&!p.hasAttribute('value')) return;
  let v=trS(n.data);
  // keep "−12.500" and "+3.100" reading left to right inside Arabic text (sign before the number)
  if(/(^|[^\w])[−+]\s?\d/.test(v)&&!v.includes('\u2066')) v=v.replace(/(^|[^\w])([−+]\s?\d[\d,]*(?:\.\d+)?%?)/g,'$1\u2066$2\u2069');
  if(v!==n.data){ if(!trOrig.has(n)) trOrig.set(n,n.data); n.data=v; } }
function trAttrs(el){ if(el.closest('[data-notr]')) return; for(const a of ['placeholder','aria-label','title']){ const v=el.getAttribute(a); if(v&&/[A-Za-z]/.test(v)){ const t=trS(v); if(t!==v){ el.setAttribute('data-en-'+a,v); el.setAttribute(a,t); } } } }
function trTree(root){ if(LANG!=='ar'||!root) return;
  if(root.nodeType===3){ trText(root); return; } if(root.nodeType!==1) return;
  if(root.matches('[placeholder],[aria-label],[title]')) trAttrs(root);
  root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(trAttrs);
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); let n; while((n=w.nextNode())) trText(n); }
const trObs=new MutationObserver(ms=>{ if(LANG!=='ar') return; for(const m of ms){ if(m.type==='characterData') trText(m.target); else if(m.type==='attributes') trAttrs(m.target); else m.addedNodes.forEach(trTree); } });
function setLang(l,rerender){
  LANG=l==='ar'?'ar':'en'; const H=document.documentElement; H.lang=LANG; H.dir=LANG==='ar'?'rtl':'ltr';
  MONTHS.splice(0,12,...(LANG==='ar'?MONTHS_AR:MONTHS_EN)); DOW.splice(0,7,...(LANG==='ar'?DOW_AR:DOW_EN));
  trObs.disconnect();
  if(LANG==='ar'){ trTree(document.body); trObs.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']}); }
  else { const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n; while((n=w.nextNode())) if(trOrig.has(n)){ n.data=trOrig.get(n); trOrig.delete(n); }
    document.querySelectorAll('[data-en-placeholder],[data-en-aria-label],[data-en-title]').forEach(el=>{ for(const a of ['placeholder','aria-label','title']) if(el.hasAttribute('data-en-'+a)){ el.setAttribute(a,el.getAttribute('data-en-'+a)); el.removeAttribute('data-en-'+a); } }); }
  if(rerender){ if(state.ready) render(); else if(!$('#lock').hidden) showLock(lockMode); }
}
const tr=s=>LANG==='ar'?trS(s):s;

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
  lock:svgI('<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
  eye:svgI('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  eyeOff:svgI('<path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3 3.9M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18"/>')
};
// eye button: hides every amount on screen (for using the app in public)
const hideBtn=()=>`<button class="round" data-act="toggleHide" aria-pressed="${!!P().hide}" aria-label="${P().hide?'Show amounts':'Hide amounts'}">${P().hide?ICON.eyeOff:ICON.eye}</button>`;
const pageHead=(title,sub,actions='',logo=false)=>`<div class="phead"><div class="brandrow">${logo?`<img class="brandmark" src="${LOGO_MARK}" alt="Masroof">`:''}<div>${sub?`<div class="psub">${sub}</div>`:''}<h1>${title}</h1></div></div><div class="pact">${actions}</div></div>`;
const gearBtn=()=>`<button class="round" data-act="tab" data-v="settings" aria-label="Settings">${ICON.gear}</button>`;
let lastTab=null,heroFrom=0;
function render(full=true){
  if(!state.ready) return;
  const m=$('#main'); const tab=state.ui.tab; const sy=window.scrollY;
  $('#tabs').innerHTML=tabbarHTML(); const pushed=PUSH4.includes(tab); document.body.classList.toggle('pushed',pushed);
  const animate=full&&lastTab!==tab; lastTab=tab;
  if(tab==='home') m.innerHTML=viewHome4();
  else if(tab==='tx'){ if(full||!$('#txList')) m.innerHTML=viewTxShell(); renderTxList(); }
  else if(tab==='people') m.innerHTML=viewPeople();
  else if(tab==='wealth') m.innerHTML=viewWealth();
  else if(tab==='you') m.innerHTML=viewYou4();
  else if(tab==='accounts') m.innerHTML=viewAccounts4();
  else if(tab==='sms') m.innerHTML=viewSms4();
  else if(tab==='goalnew') m.innerHTML=viewGoalNew4();
  else m.innerHTML=viewSettings();
  if(animate){ m.classList.remove('anim','push'); void m.offsetWidth; m.classList.add(pushed?'push':'anim'); clearTimeout(render._t); render._t=setTimeout(()=>m.classList.remove('anim','push'),800); }
  if(!full) window.scrollTo(0,sy);
  if(tab==='tx'){ const mc=document.querySelector('#monthRow .chip[aria-pressed="true"]'); if(mc){ const r=$('#monthRow'); r.scrollLeft=mc.offsetLeft-r.offsetLeft-(r.clientWidth-mc.clientWidth)/2; } }

  setTimeout(()=>{ const sp=$('#dlg[open] [data-setk]'); if(sp) openSetPanel(sp.dataset.setk); },0);
  const A=state.ui.acct!=='all'?acct(state.ui.acct):null; document.documentElement.style.setProperty('--acc',A?accColor(A):'#12B76A');
  runCountUps();
}
function runCountUps(){
  runOdometers(); runCountUps4();
  if(state.ui.tab==='home') mountMiniGlobe(); else if(miniGlobe){ miniGlobe.stop(); miniGlobe=null; }
  document.querySelectorAll('[data-count]').forEach(el=>{
    const to=+el.dataset.count, from=+el.dataset.from||0; if(matchMedia('(prefers-reduced-motion: reduce)').matches||from===to){el.textContent=money(to);return;}
    const t0=performance.now(), dur=650;
    const step=t=>{if(!state.profile) return; const k=Math.min(1,(t-t0)/dur); const e=1-Math.pow(1-k,3); el.textContent=money(from+(to-from)*e); if(k<1) requestAnimationFrame(step);};
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
  if(!allTx().length) h+=magicHeroHTML()+`<section class="welcome"><img class="wlogo" src="${LOGO_MARK}" alt=""><h2>Welcome to Masroof</h2><p>Record your first expense with the <b>+</b> button, paste a bill, or load demo data to look around. Everything stays encrypted on this phone.</p>
    <div class="bar"><button class="btn primary" data-act="acctBulk">Add my bank accounts</button><button class="btn" data-act="add">Add expense</button><button class="btn" data-act="demo">See a demo</button></div></section>`;
  else h+=magicHeroHTML();
  return h+`<div id="homeRest">${homeRestHTML()}</div>`;
}
function homeRestHTML(){
  const u=state.ui,W=P().widgets; const [a,b]=periodRange(u.period,u.anchor);
  const list=filterAcct(txBetween(a,b)); const s=summarize(list);
  const inRange=a<=todayStr()&&todayStr()<=b;
  // while a period is still running, compare with the same point in the previous one (day 10 vs day 10), not the whole of it
  const [pa,pbFull]=periodRange(u.period,shiftAnchor(u.period,u.anchor,-1)); const sofar=inRange&&u.period!=='day';
  const pb=sofar?[pbFull,ymd(addDays(pd(pa),dayDiff(a,todayStr())))].sort()[0]:pbFull; const ps=summarize(filterAcct(txBetween(pa,pb)));
  const prevWord=(sofar?'this point ':'')+PREV_WORD[u.period]; const from=heroFrom; heroFrom=s.spent;
  const A=u.acct!=='all'?acct(u.acct):null; const fl=A?accFlows(list,A.id):null;
  let delta='';
  if(ps.spent>0){const pct=Math.round((s.spent-ps.spent)/ps.spent*100); delta=pct===0?`<span class="delta">same as ${prevWord}</span>`:`<span class="delta ${pct>0?'up':'down'}">${pct>0?'↑':'↓'} ${Math.abs(pct)}% vs ${prevWord}</span>`;}
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
  h+=smsBannerHTML();
  if(W.quick) h+=quickCardHTML();
  h+=recentHTML();
  h+=budgetRingsHTML(s);
  if(W.forecast) h+=forecastHTML();
  if(W.map!==false) h+=mapCardHTML();
  const spending=`<h3 class="stitle">Where it went</h3><section class="panel">${donutHTML(s)}<ul class="cats">${catListHTML(s,ps)}</ul></section>`;
  const tips=W.insights?insightsHTML(u,s,ps,a,b,true):[];
  const cards=[W.trend&&allTx().length?weekBarsHTML():'',W.recap&&allTx().length?recapCardHTML():'',...tips.map(([k,t],i)=>`<div class="tip-card t${i%6}"><span class="k">${k}</span><p>${t}</p></div>`),W.upcoming?upcomingHTML():'',W.subs?subsHTML():'',W.people?peopleWidgetHTML():'',W.merchants?merchantsHTML(s):'',W.tags?tagsHTML(s):'',W.paidFrom?acctSpendHTML(s):''].filter(Boolean);
  const foryou=cards.length?`<div><h3 class="stitle">For you</h3><div class="fy" id="fy">${cards.map(c=>`<div class="fy-card">${c}</div>`).join('')}</div></div>`:'';
  h+=`<div class="grid" style="margin-top:16px"><div class="stack">${spending}</div><div class="stack">${foryou}${W.trend?areaChartHTML(u):''}</div></div>`;
  return h;
}
// Home nudge: new bank messages have probably arrived since the last import
function smsBannerHTML(){
  const S=P().sms||{};
  if(S.setup){ if(S.last&&Date.now()-S.last<12*3600000) return '';
    return `<button class="smsbar" data-act="smsFile"><span class="sb-i">${ICON.inbox}</span><span class="sb-t"><b>Bring in your bank messages</b><small>Last import ${ago(S.last)} · only new ones are added</small></span><span class="sb-go">Import</span></button>`; }
  if(S.dismissed||P().accounts.length<2) return '';
  return `<div class="smsbar promo"><button class="sb-main" data-act="smsGuide"><span class="sb-i">✉️</span><span class="sb-t"><b>Record spending from bank SMS</b><small>Set up once, then import in one tap</small></span></button><button class="sb-x" data-act="smsDismiss" aria-label="Hide">×</button></div>`;
}
function quickCardHTML(){
  const chips=quickSuggestions();
  return `<section class="panel quick"><div class="qbox"><span class="qic">⚡</span><input id="quickIn" placeholder="Quick add: karak 0.2, lulu 23.5 card" autocomplete="off" aria-label="Quick add"><button class="qgo" data-act="quickAdd" aria-label="Add">＋</button></div>
    ${chips.length?`<div class="qchips">${chips.map((c,i)=>{const cc=cat(c.catId);return `<button class="qchip" data-act="quickChip" data-i="${i}" style="--cc:${cc.color}"><span class="qe">${cc.icon||'•'}</span><span class="ql">${esc(c.label)}</span><b>${money(c.amount)}</b></button>`}).join('')}</div>`:`<p class="hint" style="margin-top:10px">Things you buy often turn into one-tap buttons here.</p>`}</section>`;
}
function catListHTML(s,ps){
  const u=state.ui; const ents=Object.entries(s.byCat).sort((x,y)=>y[1].total-x[1].total);
  const showBudget=u.period==='month'&&u.acct==='all'; const budgets=Object.fromEntries(Object.keys(P().budgets).filter(id=>P().budgets[id]>0).map(id=>[id,budgetFor(id,u.anchor)||1e-9]));
  if(showBudget) for(const id of Object.keys(budgets)) if(budgets[id]>0&&!s.byCat[id]&&findCat(id)) ents.push([id,{total:0,count:0,items:{}}]);
  const more=ents.length-4; const shown=u.allCats||ents.length<=5?ents:ents.slice(0,4);
  return shown.map(([id,v])=>{
    const c=cat(id); const open=u.openCat===id; const pct=s.spent?v.total/s.spent*100:0; const prev=(ps.byCat[id]||{}).total||0;
    let meta=`${v.count} purchase${v.count===1?'':'s'}`, trend='';
    if(prev>0){const d=Math.round((v.total-prev)/prev*100); if(d>300) trend='<span class="tr up">much more</span>'; else if(d!==0) trend=`<span class="tr ${d>0?'up':'down'}">${d>0?'▲':'▼'} ${Math.abs(d)}%</span>`;}
    let bud='';
    if(showBudget&&budgets[id]>0){const r=v.total/budgets[id];
      bud=`<div class="budget"><i style="width:${Math.min(100,r*100)}%;background:${r>1?'var(--spend)':c.color}"></i></div><div class="cat-meta">${r>1?`Over budget by ${money(v.total-budgets[id])}`:`${money(budgets[id]-v.total)} left of ${money(budgets[id])}`}${(b=>b&&b.carry?` <span class="carry ${b.carry<0?'neg':''}">${b.carry>0?'+':'−'}${money(Math.abs(b.carry))} carried</span>`:'')(budgetInfo(id,u.anchor))}</div>`;}
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
    for(let m=1;m<=12;m++){const k=`${y}-${pad(m)}`; out.push({key:k,label:monS(m-1),full:MONTHS[m-1]+' '+y,value:byM[m]||0,cur:k===todayStr().slice(0,7)});}
    return out; }
  const start=u.period==='day'?ymd(addDays(pd(a),-13)):a; const s=summarize(filterAcct(txBetween(start,b)));
  const showLimit=P().limits.mode!=='off'&&u.period!=='year';
  for(let d=pd(start);ymd(d)<=b;d=addDays(d,1)){const k=ymd(d);
    out.push({key:k,label:u.period==='month'?String(d.getDate()):dowS(d.getDay(),2),full:fmtD(k,{weekday:'short',day:'numeric',month:'short'}),value:s.byDate[k]||0,cur:(u.period==='day'&&k===u.anchor)||k===todayStr(),limit:showLimit&&k<=todayStr()?limitFor(k):null});}
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
  if(u.period!=='day'&&s.exp.length>3){const dw=[0,0,0,0,0,0,0]; for(const t of s.exp) dw[pd(t.date).getDay()]+=myShare(t); li.push(['📆',`You spend most on <b>${dayPl(dw.indexOf(Math.max(...dw)))}</b>`]);}
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
/* month-end forecast: money in everyday accounts now, plus scheduled income, minus scheduled
   payments, minus everyday spending at your recent pace */
function forecast(){
  const t=todayStr(); const [,end]=periodRange('month',t); const daysLeft=dayDiff(t,end)+1; // including today
  const b=balances(); const now=sum(P().accounts.filter(a=>!hasRole(a,'savings')),a=>b[a.id]||0);
  let inc=0,out=0; const items=[];
  for(const r of P().recurring){ let d=r.next,n=r.done||0,g=0;
    while(d&&d<=end&&g++<60){ if(d>t){ let v=0;
        if(r.type==='income') v=r.amount; else if(r.type==='expense') v=-r.amount;
        else if(r.type==='invest') v=r.dir==='sell'?r.amount:-r.amount;
        else if(r.type==='transfer'){ const fs=isSavings(r.accountId),ts=isSavings(r.toAccountId); v=ts&&!fs?-r.amount:fs&&!ts?r.amount:0; }
        if(v>0) inc+=v; else out-=v; if(v) items.push({date:d,label:recLabel(r),v}); }
      n++; if(r.count&&n>=r.count) break; d=advance(r,d); } }
  const from=ymd(addDays(new Date(),-30)); const hist=txBetween(from,ymd(addDays(new Date(),-1)));
  const first=allTx().reduce((m,x)=>x.date<m?x.date:m,t); const days=Math.max(7,Math.min(30,dayDiff(first,t)));
  const pace=Math.max(0,sum(hist,x=>x.type==='expense'&&!x.recurringId&&x.catId!=='bills'?myShare(x):0)/days);
  const today=sum(state.months[t.slice(0,7)]||[],x=>x.date===t&&x.type==='expense'&&!x.recurringId&&x.catId!=='bills'?myShare(x):0);
  const everyday=Math.max(0,pace-today)+pace*(daysLeft-1);
  return {end,daysLeft,now,inc,out,pace,everyday,left:now+inc-out-everyday,items};
}
function forecastHTML(){
  if(!allTx().length) return '';
  const f=forecast(); const neg=f.left<0;
  const safe=f.daysLeft>0?(f.now+f.inc-f.out)/f.daysLeft:0;
  const row=(l,v,c)=>`<div class="fc-r"><span>${l}</span><b class="${c||''}">${v}</b></div>`;
  const tip=neg?(safe>0?`To finish the month above zero, keep everyday spending under <b>${money(safe)}</b> a day.`:'Scheduled payments are more than what’s in your accounts — move money in or pause something.')
    :`You’re on track. At this pace about <b>${money(f.left)}</b> will be spare — a good amount to move to savings.`;
  return `<h3 class="stitle">Month-end forecast</h3><section class="panel fc${neg?' neg':''}">
    <div class="fc-top"><div><div class="muted">Expected left on ${shortD(f.end)}</div><div class="fc-big">${neg?'−':''}${money(Math.abs(f.left))}<small>${esc(cur())}</small></div></div><span class="fc-days"><b>${f.daysLeft}</b>${f.daysLeft===1?'last day':'days left'}</span></div>
    <div class="fc-rows">${row('In your everyday accounts',money(f.now))}${f.inc?row('Scheduled income','+'+money(f.inc),'pos'):''}${f.out?row('Bills & payments due','−'+money(f.out),'neg'):''}${row(`Everyday spending (≈ ${money(f.pace)}/day)`,'−'+money(f.everyday),'neg')}</div>
    <p class="hint fc-tip">${tip}</p></section>`;
}
function upcomingHTML(){
  const lim=ymd(addDays(new Date(),31)); const up=P().recurring.filter(r=>r.next&&r.next<=lim).sort((a,b)=>a.next<b.next?-1:1);
  const loans=P().people.map(x=>({x,d:personDue(x.id)})).filter(o=>o.d&&o.d.date<=lim).sort((a,b)=>a.d.date<b.d.date?-1:1);
  const cards=P().accounts.map(a=>({a,c:cardStatus(a)})).filter(o=>o.c&&o.c.due>0&&o.c.dueDate<=lim);
  if(!up.length&&!loans.length&&!cards.length) return '';
  const dchip=ds=>`<span class="dchip"><b>${pd(ds).getDate()}</b>${monS(pd(ds).getMonth())}</span>`;
  return `<section class="panel"><h2>Coming up</h2><div class="rows">${cards.map(({a,c})=>`<button class="rw" data-act="accView" data-v="${esc(a.id)}">${dchip(c.dueDate)}<span class="rwl">Pay ${esc(a.name)}${c.late?' <span class="pill late">overdue</span>':''}</span><b class="amt expense">${money(c.due)}</b></button>`).join('')}${loans.map(({x,d})=>`<button class="rw" data-act="person" data-v="${esc(x.id)}">${dchip(d.date)}<span class="rwl">${d.bal>0?`${esc(x.name)} pays you back`:`Pay back ${esc(x.name)}`}${d.late?' <span class="pill late">overdue</span>':''}</span><b class="amt ${d.bal>0?'income':'expense'}">${d.bal>0?'+':''}${money(Math.abs(d.bal))}</b></button>`).join('')}${up.map(r=>`<div class="rw">${dchip(r.next)}<span class="rwl">${esc(recLabel(r))}</span><b class="amt ${r.type}">${r.type==='income'?'+':''}${money(r.amount)}</b></div>`).join('')}</div>
    ${up.some(r=>r.type!=='income')?`<p class="hint" style="margin-top:8px">Total going out: ${money(sum(up.filter(r=>r.type!=='income'),r=>r.amount))}</p>`:''}</section>`;
}
const recLabel=r=>(r.count?`[${(r.done||0)+1}/${r.count}] `:'')+(r.note||r.item||(r.type==='transfer'?'Transfer to '+acctName(r.toAccountId):r.type==='invest'?'Invest in '+((holding(r.investmentId)||{}).name||'investment'):cat(r.catId).name));

/* ---------- Activity ----------
   One list, newest first: search, four filter pills and this month's two totals on top. The slider
   button opens the finer filters (type, category, account, month and the spending calendar). */
function viewTxShell(){
  const u=state.ui, mk=todayStr().slice(0,7), Mn=monthName(mk), s=summarize(txBetween(mk+'-01',todayStr()));
  const cats=[...P().categories.expense,...P().categories.income];
  const advOn=u.txType!=='all'||u.txCat!=='all'||u.acct!=='all'||(u.txM&&u.txM!=='all')||u.txCal;
  const months=['all']; for(let i=0;i<12;i++){const dd=new Date(new Date().getFullYear(),new Date().getMonth()-i,1); months.push(`${dd.getFullYear()}-${pad(dd.getMonth()+1)}`);}
  if(u.txM&&!months.includes(u.txM)) months.push(u.txM);
  const adv=u.txAdv?`<div class="a4-adv">
    <div class="w-chips">${months.map(k=>{ if(k==='all') return `<button class="w-chip" data-act="pickMonth" data-v="all" aria-pressed="${!u.txM||u.txM==='all'}">All months</button>`; const [yy,mm]=k.split('-').map(Number); return `<button class="w-chip" data-act="pickMonth" data-v="${k}" aria-pressed="${u.txM===k}">${monS(mm-1)}${yy!==new Date().getFullYear()?' '+yy:''}</button>`; }).join('')}</div>
    <div class="a4-sels"><select class="sel" data-change="txType" aria-label="Type">${[['all','All types'],['expense','Expenses'],['income','Income'],['transfer','Transfers'],['debt','Lent / borrowed'],['invest','Investments'],['split','Split bills'],['itemized','With items']].map(([v,l])=>`<option value="${v}"${u.txType===v?' selected':''}>${l}</option>`).join('')}</select>
      <select class="sel" data-change="txCat" aria-label="Category"><option value="all">All categories</option>${cats.map(c=>`<option value="${esc(c.id)}"${u.txCat===c.id?' selected':''}>${esc(c.icon||'')} ${esc(c.name)}</option>`).join('')}</select></div>
    <div class="w-chips"><button class="w-chip" data-act="pickAcct" data-v="all" aria-pressed="${u.acct==='all'}">All accounts</button>${P().accounts.map(a=>`<button class="w-chip" data-act="pickAcct" data-v="${esc(a.id)}" aria-pressed="${u.acct===a.id}"><i class="a4-cc" style="background:${cardBg(accColor(a))}"></i>${esc(a.name)}</button>`).join('')}</div>
    <div class="a4-advf"><button class="w-chip" data-act="txCal" aria-pressed="${!!u.txCal}">${ic('calendar-blank')}Calendar</button>${downloadsNs?`<button class="w-chip" data-act="export">${ic('export')}Export CSV</button>`:''}${advOn?`<button class="w-chip" data-act="txClear">${ic('x')}Clear filters</button>`:''}</div></div>`:'';
  return `<div class="a4-head"><div class="w-title">Activity</div><button class="w-sq a4-advb${advOn?' on':''}" data-act="txAdv" aria-expanded="${!!u.txAdv}" aria-label="More filters">${ic('sliders-horizontal')}</button></div>
  <label class="a4-search">${ic('magnifying-glass')}<input type="search" data-input="txQ" value="${esc(u.txQ)}" placeholder="Search shops, notes, amounts" aria-label="Search" autocomplete="off"></label>
  <div class="w-chips a4-f">${[['all','All'],['out','Spent'],['in','Received'],['bill','With bills']].map(([k,l])=>`<button class="w-chip" data-act="txF" data-v="${k}" aria-pressed="${(u.txF||'all')===k}">${l}</button>`).join('')}</div>
  ${adv}
  <div class="a4-sum"><div><span>Spent in ${Mn}</span>${nb(money(s.spent))}</div><div><span>Received in ${Mn}</span>${nb(`<span class="mi">${money(s.income)}</span>`)}</div></div>
  <div id="txCal"></div><div id="txSum" class="a4-note"></div><div id="txList"></div>`;
}
function renderTxList(){
  const u=state.ui, q=norm(u.txQ), F=u.txF||'all', mo=u.txM&&u.txM!=='all'?u.txM:null;
  // a search looks through every month, so "when did I last pay X?" just works
  let list=filterAcct(mo&&!q?(state.months[mo]||[]).slice():allTx().slice());
  if(F==='out') list=list.filter(t=>t.type==='expense'&&!t.refund||t.type==='debt'&&t.dir==='give'||t.type==='invest'&&t.dir!=='sell');
  else if(F==='in') list=list.filter(t=>t.type==='income'||t.refund||t.type==='debt'&&t.dir!=='give'||t.type==='invest'&&t.dir==='sell');
  else if(F==='bill') list=list.filter(t=>t.lines&&t.lines.length||t.bill);
  if(u.txType==='split') list=list.filter(t=>t.split); else if(u.txType==='itemized') list=list.filter(t=>t.lines&&t.lines.length); else if(u.txType!=='all') list=list.filter(t=>t.type===u.txType);
  if(u.txCat!=='all') list=list.filter(t=>t.catId===u.txCat||(t.lines||[]).some(l=>l.catId===u.txCat));
  if(q) list=list.filter(t=>norm([t.note,t.item,cat(t.catId).name,acctName(t.accountId),(t.tags||[]).map(x=>'#'+x).join(' '),(t.lines||[]).map(l=>l.name+' '+l.item).join(' '),t.personId?personName(t.personId):'',t.split?t.split.shares.map(s=>personName(s.who)).join(' '):'',t.investmentId?(holding(t.investmentId)||{}).name:'',String(t.amount),money(t.amount),t.fx?t.fx.orig+' '+t.fx.cur:''].join(' ')).includes(q));
  list.sort((a,b)=>a.date===b.date?(b.at||b.ts||0)-(a.at||a.ts||0):(a.date<b.date?1:-1));
  const calM=mo||todayStr().slice(0,7);
  const cal=$('#txCal'); if(cal) cal.innerHTML=u.txCal&&!q?`<div class="a4-cal">${calendarHTML(calM,summarize(list.filter(t=>t.date.startsWith(calM))).byDate,u.txDay)}</div>`:'';
  if(u.txCal&&!q&&u.txDay) list=list.filter(t=>t.date===u.txDay);
  const s=summarize(list), filtered=q||F!=='all'||u.txType!=='all'||u.txCat!=='all'||u.acct!=='all'||mo||u.txDay;
  $('#txSum').textContent=filtered&&list.length?`${list.length} transaction${list.length>1?'s':''} · spent ${money(s.spent)} · received ${money(s.income)} ${cur()}`:'';
  if(!list.length){ $('#txList').innerHTML=q||filtered?`<div class="a4-empty">${ic('magnifying-glass')}<span>Nothing matches your search.</span></div>`
    :`<div class="a4-empty">${ic('receipt')}<span>Nothing here yet.</span><button class="w-pill" data-act="add">${ic('plus')}Add a transaction</button></div>`; return; }
  const N=u.txN||60, shown=list.slice(0,N);
  const groups={}; for(const t of shown)(groups[t.date]||(groups[t.date]=[])).push(t);
  const t0=todayStr(), y0=ymd(addDays(new Date(),-1));
  $('#txList').innerHTML=Object.entries(groups).map(([d,ts])=>{ const sp=sum(ts.filter(t=>t.type==='expense'),t=>t.refund?-myShare(t):myShare(t));
    const lim=limitFor(d), over=lim!=null&&countedOn(d)>lim;
    const lab=d===t0?'Today':d===y0?'Yesterday':fmtD(d,{weekday:'short',day:'numeric',month:'short',...(d.slice(0,4)!==t0.slice(0,4)?{year:'numeric'}:{})});
    return `<div class="a4-day"><span>${lab}${over?' <span class="a4-over">over limit</span>':''}</span>${sp>0?nb('−'+money(sp)):''}</div><div class="w-group tx-group a4-g">${ts.map(txRow).join('')}</div>`; }).join('')
    +(list.length>N?`<button class="w-btn sec a4-more" data-act="txMore4">Show more · ${list.length-N}</button>`:'');
}
// month grid: each day tinted by how much you spent; tap a day to see just that day
function calendarHTML(month,byDate,sel){
  const [y,m]=month.split('-').map(Number); const n=new Date(y,m,0).getDate(); const ws=P().weekStart;
  const lead=(new Date(y,m-1,1).getDay()-ws+7)%7; const vals=Object.values(byDate); const max=Math.max(1e-9,...vals,0); const t=todayStr();
  let cells=''; for(let i=0;i<lead;i++) cells+='<span></span>';
  for(let d=1;d<=n;d++){ const k=`${month}-${pad(d)}`, v=byDate[k]||0, lim=limitFor(k);
    const over=lim!=null&&v>0&&countedOn(k)>lim; const heat=v>0?(.14+.66*Math.sqrt(v/max)).toFixed(2):0;
    cells+=`<button class="cd${k===t?' today':''}${k===sel?' sel':''}${over?' over':''}${k>t?' future':''}" data-act="txDay" data-v="${k}" style="--h:${heat}" aria-pressed="${k===sel}" aria-label="${fmtD(k,{day:'numeric',month:'long'})}: ${v?money(v)+' spent':'nothing spent'}"><b>${d}</b>${v?`<small>${compact(v)}</small>`:''}</button>`; }
  const dow=[...Array(7)].map((_,i)=>dowS((ws+i)%7,1));
  const total=sum(vals), days=vals.filter(v=>v>0).length;
  return `<section class="panel cal"><div class="cal-g cal-h">${dow.map(x=>`<span>${x}</span>`).join('')}</div><div class="cal-g">${cells}</div>
    <div class="cal-f"><span>${days} spending day${days===1?'':'s'} · ${n-days} without</span><span>avg ${money(days?total/days:0)} / day</span></div></section>`;
}
const compact=v=>P().hide?'•':v>=1000?(v/1000).toFixed(v>=10000?0:1)+'k':v>=100?Math.round(v)+'':v>=10?v.toFixed(1):v.toFixed(v>=1?1:2).replace(/^0/,'');
function txRow(t){
  const r=row4(t), id=esc(t.id), nl=t.lines&&t.lines.length;
  const pills=[t.refund?'Refund':'',t.inst||'',nl?`Bill · ${nl} item${nl>1?'s':''}`:t.bill?'Bill':'',t.split?'Split':'',t.recurringId?'Repeats':'',
    t.fx?`${(countryOf(t)||fxInfo(t.fx.cur)||{}).flag||''} ${curFmt(t.fx.orig,t.fx.cur)}`.trim():'',...(t.tags||[]).map(x=>'#'+x)].filter(Boolean);
  return `<div class="swipe" data-id="${id}"><div class="acts"><div><button class="dup" data-act="rowDup" data-v="${id}" tabindex="-1">${ic('arrow-clockwise')}<span>Again</span></button></div><div><button class="edit" data-act="edit" data-v="${id}" tabindex="-1">${ic('pencil-simple')}<span>Edit</span></button><button class="del" data-act="rowDel" data-v="${id}" tabindex="-1">${ic('trash')}<span>Delete</span></button></div></div>
    <button class="tx r4" data-act="view" data-v="${id}">${tileHTML(txVis(t))}<span class="r4m"><b>${esc(r.title)}</b><small>${esc(r.sub)}</small>${pills.length?`<span class="r4p">${pills.map(p=>`<i${p[0]==='#'||/\d/.test(p)&&!/^Bill/.test(p)?' data-notr':''}>${esc(p)}</i>`).join('')}</span>`:''}</span>${nb(`<span class="${r.cls}">${r.amt}</span>`)}</button></div>`;
}

/* ---------- one activity in detail ----------
   Tapping a row shows everything about it: for a bill, the categories it splits into, each item
   with its quantity and cost, and the VAT, service and discount. Edit or add the bill text from here. */
function sheet4(body,foot,cls){ $('#dlg').innerHTML=`<div class="w-sheet${cls?' '+cls:''}"><div class="body"><div class="w-grab"></div>${body}<p class="err" id="fErr"></p></div>${foot?`<div class="foot">${foot}</div>`:''}</div>`; if(!$('#dlg').open) $('#dlg').showModal(); }
const dayLabel=d=>d===todayStr()?'Today':d===ymd(addDays(new Date(),-1))?'Yesterday':fmtD(d,{weekday:'short',day:'numeric',month:'short',...(d.slice(0,4)!==todayStr().slice(0,4)?{year:'numeric'}:{})});
function openTxView(id){
  const t=allTx().find(x=>x.id===id); if(!t) return; fd={kind:'txview',id};
  const r=row4(t), v=txVis(t), c=t.catId?cat(t.catId):null, k=countryOf(t), nl=t.lines&&t.lines.length;
  const title=t.type==='transfer'?`${acctName(t.accountId)} → ${acctName(t.toAccountId)}`:r.title;
  const a=acct(t.accountId), aLab=a?[a.bank&&a.bank!==a.name&&a.bank!=='Other'&&a.bank!=='Cash'?a.bank:'',a.name].filter(Boolean).join(' · '):acctName(t.accountId);
  const tm=timeOf(t), pl=t.type==='expense'?placeOf(t):null;
  const rows=[['Date',dayLabel(t.date)+(tm?', '+tm:'')],
    [t.type==='income'?'Into':t.type==='transfer'?'From':'Account',aLab],
    t.type==='transfer'?['To',acctName(t.toAccountId)]:null,
    t.type==='debt'?['Person',personName(t.personId)]:null,
    t.type==='invest'?['Investment',(holding(t.investmentId)||{}).name||'']:null,
    c&&!nl?['Category',`${c.name}${t.item?' › '+t.item:''}`]:null,
    t.imported?['Source','Bank SMS, added automatically']:t.recurringId||t.auto?['Source','Added automatically']:null,
    pl&&pl.how!=='home'?['Place',geoName(pl.name)]:null,
    t.fx?['Original amount',`${(k||fxInfo(t.fx.cur)||{}).flag||''} ${curFmt(t.fx.orig,t.fx.cur)} · 1 ${t.fx.cur} = ${t.fx.rate} ${cur()}`,1]:null,
    t.split?['Your share',money(myShare(t)),1]:null,
    t.split?['Split with',t.split.shares.filter(s=>s.who!=='me').map(s=>personName(s.who)).join(', ')]:null,
    t.goalId&&P().goals.find(g=>g.id===t.goalId)?['Goal',P().goals.find(g=>g.id===t.goalId).name]:null,
    t.tags&&t.tags.length?['Tags',t.tags.map(x=>'#'+x).join(' '),1]:null,
    t.inst?['Instalment',t.inst,1]:null,
    t.due?['Pay back by',fmtD(t.due,{day:'numeric',month:'short',year:'numeric'})]:null].filter(Boolean);
  let bill='';
  if(nl){
    const al=allocs(t), groups={};
    t.lines.forEach((l,i)=>{ const cid=l.catId||t.catId; const g=groups[cid]||(groups[cid]={items:[],sub:0,share:0}); g.items.push(l); g.sub+=lineTotal(l); g.share+=(al[i]||{amount:0}).amount; });
    const ord=Object.entries(groups).sort((x,y)=>y[1].share-x[1].share), subtotal=sum(t.lines,lineTotal), whole=sum(ord,([,g])=>g.share)||1;
    const sums=[['Items',money(subtotal)],t.discount?['Discount','−'+money(t.discount)]:null,t.service?['Service charge',money(t.service)]:null,t.tax?['VAT',money(t.tax)]:null,['Total',money(t.amount),1]].filter(Boolean);
    bill=`<div class="tv4-bh"><span>Bill breakdown</span><small>${nl} item${nl>1?'s':''}</small></div>
      <div class="tv4-bar">${ord.map(([cid,g])=>`<i style="flex:${(g.share/whole).toFixed(4)};background:${catVis(cid).color}"></i>`).join('')}</div>
      <div class="tv4-bill">${ord.map(([cid,g])=>{ const cc=cat(cid); return `<div class="tv4-c"><i style="background:${catVis(cid).color}"></i><span><b>${esc(cc.name)}</b> ${nb(Math.round(g.share/whole*100)+'%')}</span>${nb(money(g.share))}</div>
        ${g.items.map(l=>`<div class="tv4-i"><span>${esc(l.name||l.item||'Item')}</span>${nb(`${+l.qty} × ${money(+l.price)}`)}${nb(money(lineTotal(l)))}</div>`).join('')}`; }).join('')}
        <div class="tv4-sums">${sums.map(([x,y,b])=>`<div${b?' class="b"':''}><span>${x}</span>${nb(y)}</div>`).join('')}</div></div>`;
  }
  const more=(icon,label,text)=>`<details class="tv4-more"><summary><span>${ic(icon)}${label}</span>${ic('caret-down')}</summary><pre dir="auto">${esc(text)}</pre></details>`;
  sheet4(`<div class="tv4-hero">${tileHTML(v,'lg')}<span class="t">${esc(title)}</span><div class="amt">${nb(`<span class="${r.cls}">${r.amt}</span>`)}<small>${esc(cur())}</small></div>${t.split?`<small class="w-muted">${esc('Your share of '+money(t.amount))}</small>`:''}</div>
    <div class="tv4-rows">${rows.map(([x,y,n])=>`<div><span>${x}</span><b${n?' data-notr dir="auto"':''}>${esc(y)}</b></div>`).join('')}</div>
    ${bill}
    ${t.bill?more('receipt','Bill text',t.bill):''}
    ${t.sms?more('chat-text','Bank SMS',t.sms):''}
    <div class="tv4-acts${t.type==='expense'?'':' two'}"><button data-act="rowDup" data-v="${esc(t.id)}">${ic('arrow-clockwise')}Again</button>${t.type==='expense'?`<button data-act="tvBill">${ic('receipt')}Bill</button>`:''}<button class="y" data-act="tvEdit">${ic('pencil-simple')}Edit</button></div>`,'','tv4');
}
function openWhatsNew(){
  const row=(icon,t,d,act,btn,v)=>`<div class="wn4">${tileHTML({html:ic(icon),color:'#EDBB00'})}<div><b>${t}</b><p>${d}</p>${act?`<button class="w-pill card" data-act="${act}"${v?` data-v="${v}"`:''}>${btn}</button>`:''}</div></div>`;
  sheet4(`<div class="bl4-h" style="padding:14px 20px 4px"><h3>What’s new in Masroof</h3></div><p class="hint" style="margin:0 20px 6px">Version <span data-notr>${APP_VERSION}</span> — a new look, the same private app.</p>
    <div class="wn4s">
    ${row('cards','A new design','Night and Day editions, your cards in a stack, a gold ＋ for adding, and everything one or two taps away.','tab','Open Settings','settings')}
    ${row('backspace','Add with a keypad','Type the amount on the keypad at the bottom of the sheet. Or write “karak 0.2 cash” or “coffee 15 aed” in What or where.','add','Add something')}
    ${row('chat-text','Bank messages, one card at a time','Swipe right to add a message, left to skip it, or confirm all the sure ones at once. Messages waiting are kept, encrypted, until you get to them.','tab','Open','sms')}
    ${row('list-bullets','Activity','Search shops, notes or amounts, and filter Spent, Received or With bills. More filters and the calendar are behind the slider button.','tab','Open','tx')}
    ${row('target','Goals in four steps','What it’s for, how much and by when, where it’s kept and how you’ll save — with the monthly amount worked out for you.','goalNew','New goal')}
    ${row('lock-key','A keypad to unlock','If your passcode is digits only, unlock with a round keypad. Other passcodes still use the keyboard.')}
    ${row('user-circle','You','Accounts, Friends, Bank messages, the map, reminders and the monthly report live in the You tab. Settings are in five groups.','tab','Open','you')}
    </div>`,`<button class="w-btn" data-act="close">Got it</button>`,'wn4sheet');
}
/* updates: version.json on the site says which version is newest */
let updateReady=false;
function checkUpdate(manual){
  if(!navigator.onLine){ if(manual) toast('You’re offline'); return; }
  fetch('./version.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.json()).then(j=>{
    if(j&&j.version&&j.version!==APP_VERSION){ updateReady=true; showUpdateBar(j.version); }
    else if(manual) toast('You have the latest version');
  }).catch(()=>{ if(manual) toast('Couldn’t check — try again when online'); });
}
function showUpdateBar(v){ let b=$('#updbar'); if(!b){ b=document.createElement('div'); b.id='updbar'; document.body.appendChild(b); }
  b.innerHTML=`<span>✨ <b>A new version of Masroof is ready</b></span><button data-act="doUpdate">Update</button>`; b.hidden=false; }
async function doUpdate(){ try{ await saveNow(); }catch(e){} // your data stays: only the app's own files are refreshed
  try{ for(const k of await caches.keys()) await caches.delete(k); const r=await navigator.serviceWorker.getRegistration(); if(r) await r.update(); }catch(e){}
  location.reload(); }
const ago=ts=>{ if(!ts) return 'never'; const m=Math.round((Date.now()-ts)/60000); return m<1?'just now':m<60?`${m} min ago`:m<1440?`${Math.round(m/60)} h ago`:`${Math.round(m/1440)} day${m<2880?'':'s'} ago`; };
/* reminders: an .ics file for iPhone Calendar, which then alerts even when Masroof is closed */
function reminderItems(o){
  const p=P(), out=[]; const ics=d=>d.replace(/-/g,'');
  if(o.bills) for(const r of p.recurring){ if(!r.next) continue; const rr=r.freq==='weekly'?'FREQ=WEEKLY':r.freq==='yearly'?'FREQ=YEARLY':`FREQ=MONTHLY;BYMONTHDAY=${Math.min(28,r.day||pd(r.next).getDate())}`;
    const left=r.count?Math.max(1,r.count-(r.done||0)):0; const verb=r.type==='income'?'💰':r.type==='transfer'?'🏦':'🧾';
    out.push({uid:'rec-'+r.id,date:r.next,rrule:rr+(left?';COUNT='+left:''),title:`${verb} ${recLabel(r)} — ${money(r.amount,{show:true})} ${cur()}`,note:r.type==='income'?'Expected income':'Masroof records this automatically. Make sure the money is there.'}); }
  if(o.cards) for(const a of p.accounts){ const c=cardStatus(a); if(!c||!a.dueDay) continue;
    const first=c.due>0?c.dueDate:ymd(dayIn(pd(c.dueDate).getFullYear(),pd(c.dueDate).getMonth()+1,a.dueDay));
    out.push({uid:'card-'+a.id,date:first,rrule:`FREQ=MONTHLY;BYMONTHDAY=${a.dueDay}`,title:`💳 Pay ${a.name}${/card|بطاقة/i.test(a.name)?'':' credit card'}`,note:'Credit card payment due. Open Masroof to see the amount.'}); }
  if(o.loans) for(const x of p.people){ const d=personDue(x.id); if(!d||d.date<todayStr()) continue;
    out.push({uid:'loan-'+x.id+'-'+d.date,date:d.date,title:d.bal>0?`🤝 ${x.name} pays you back ${money(d.bal,{show:true})} ${cur()}`:`🤝 Pay back ${x.name} ${money(-d.bal,{show:true})} ${cur()}`,note:'Loan due date from Masroof'}); }
  if(o.sms) out.push({uid:'sms-import',date:todayStr(),time:o.smsTime||'21:00',rrule:'FREQ=DAILY',title:'✉️ Import bank SMS into Masroof',note:'Open Masroof and tap Import bank SMS.'});
  return out.map(e=>({...e,ics}));
}
function buildIcs(items){
  const esc_=t=>String(t).replace(/\\/g,'\\\\').replace(/[,;]/g,m=>'\\'+m).replace(/\n/g,'\\n');
  const fold=l=>{ const out=[]; let cur=''; for(const ch of l){ if(new TextEncoder().encode(cur+ch).length>73){ out.push(cur); cur=' '+ch; } else cur+=ch; } out.push(cur); return out.join('\r\n'); };
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Masroof//Reminders//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Masroof'];
  for(const e of items){ const d=e.date.replace(/-/g,'');
    L.push('BEGIN:VEVENT','UID:'+e.uid+'@masroof','DTSTAMP:'+stamp,'SUMMARY:'+esc_(tr(e.title)),'DESCRIPTION:'+esc_(tr(e.note||'')));
    if(e.time){ const [h,m]=e.time.split(':'); L.push(`DTSTART:${d}T${h}${m}00`,`DURATION:PT5M`); } else L.push('DTSTART;VALUE=DATE:'+d,'DTEND;VALUE=DATE:'+ymd(addDays(pd(e.date),1)).replace(/-/g,''),'TRANSP:TRANSPARENT');
    if(e.rrule) L.push('RRULE:'+e.rrule);
    // alerts: at the time for timed events; 9:00 the day before and 9:00 on the day for all-day ones
    for(const tr of e.time?['PT0M']:['-PT15H','PT9H']) L.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+esc_(e.title),'TRIGGER:'+tr,'END:VALARM');
    L.push('END:VEVENT'); }
  L.push('END:VCALENDAR'); return L.map(fold).join('\r\n')+'\r\n';
}
/* ---------- exchange rates ----------
   Built in (js/fx.js), or fetched when you ask (or daily, if you turn that on). Only a public list
   of rates is downloaded; nothing about you or your money is sent. Your own rate for a currency
   wins over both. */
const FX_SOURCES=[
  ['https://open.er-api.com/v6/latest/USD',j=>j&&j.result==='success'&&j.rates?{rates:j.rates,date:j.time_last_update_unix?ymd(new Date(j.time_last_update_unix*1000)):todayStr()}:null],
  ['https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json',j=>j&&j.usd?{rates:Object.fromEntries(Object.entries(j.usd).map(([k,v])=>[k.toUpperCase(),v])),date:j.date||todayStr()}:null]];
let fxBusy=false;
async function fxFetch(manual){
  if(fxBusy) return false; if(!navigator.onLine){ if(manual) toast('You’re offline',{bad:true}); return false; }
  fxBusy=true; if(manual) renderFx();
  try{
    for(const [url,read] of FX_SOURCES){ try{
      const ctl=new AbortController(), tm=setTimeout(()=>ctl.abort(),8000);
      const res=await fetch(url,{signal:ctl.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'}); clearTimeout(tm); if(!res.ok) continue;
      const got=read(await res.json()); if(!got) continue; const rates={};
      for(const c of FX.list){ const v=+got.rates[c.code]; if(v>0&&isFinite(v)) rates[c.code]=v; }
      // a sanity check: currencies pegged to the dollar must be where they should be
      const near=(k,v)=>rates[k]&&Math.abs(rates[k]/v-1)<0.02;
      if(Object.keys(rates).length<20||!near('OMR',0.384497)||!near('AED',3.6725)||!near('SAR',3.75)) continue;
      P().fxLive={at:Date.now(),date:got.date,rates}; persist('profile');
      if(manual) toast('Exchange rates updated'); return true;
    }catch(e){} }
    if(manual) toast('Couldn’t get rates — try again later',{bad:true}); return false;
  } finally { fxBusy=false; if($('#dlg').open&&$('#dlg [data-fxmine]')) renderFx(); }
}
function fxAutoCheck(){ const p=P(); if(p.fxAuto&&(!p.fxLive||Date.now()-p.fxLive.at>12*3600e3)) fxFetch(false); }
let fxQ='';
function renderFx(){
  const p=P(), home=cur(), mine=p.fxMine||{}, q=norm(fxQ);
  const list=FX.list.filter(c=>c.code!==home&&(!q||norm(c.code+' '+c.country+' '+c.countryAr).includes(q))).sort((a,b)=>a.code<b.code?-1:1);
  const rowH=c=>{ const base=(()=>{ const r=fxRates(); return fxRound(r[home]/r[c.code]); })();
    return `<div class="rw fxr"><span><span class="fxf">${c.flag}</span> <b data-notr>${c.code}</b> <span class="muted" data-notr>${esc(ctryName(c))}</span></span>
    <span class="fxv"><span class="muted" data-notr>1 ${c.code} =</span><input class="inp" inputmode="decimal" data-fxmine="${c.code}" value="${mine[c.code]>0?esc(String(mine[c.code])):''}" placeholder="${base}" aria-label="${c.code}"><span class="muted" data-notr>${home}</span></span></div>`; };
  const old=$('#dlg .dlg-b'), sc=old?old.scrollTop:0;
  dlg('Exchange rates',`<p class="hint" style="margin-top:0">When you pay in another currency — in a bank SMS, in quick add (“coffee 15 aed”) or in the form — Masroof converts it to ${esc(home)} and remembers the country.</p>
    <div class="fxsrc"><div><b>${esc(fxSourceText())}</b><br><span class="muted" style="font-size:13px">${p.fxLive?'Downloaded from a public rates list.':'Gulf currencies are exact (pegged to the dollar). Others are approximate until you update.'}</span></div>
      <button class="btn small primary" data-act="fxUpdate"${fxBusy?' disabled':''}>${fxBusy?'Updating…':'Update now'}</button></div>
    <label class="toggle-row"><span>Update automatically when online<br><span class="muted" style="font-size:13px">Once a day. Only the rates list is downloaded — nothing is sent.</span></span><input type="checkbox" data-fxauto${p.fxAuto?' checked':''}></label>
    <input class="inp" data-fxq placeholder="Search currency or country" value="${esc(fxQ)}" style="margin:10px 0 4px">
    <p class="hint">Type your own rate to always use it for that currency. Leave it empty to use the rate shown.</p>
    <div class="rows fxlist">${list.map(rowH).join('')||'<p class="hint">No match</p>'}</div>`,
    `<span class="spacer"></span><button class="btn primary" data-act="close">Done</button>`);
  const b=$('#dlg .dlg-b'); if(b) b.scrollTop=sc;
}
function openReminders(){
  const o=P().remind||(P().remind={bills:true,cards:true,loans:true,sms:!!(P().sms&&P().sms.setup),smsTime:'21:00'}); const items=reminderItems(o);
  const row=(k,l,h)=>`<label class="toggle-row"><span>${l}<br><span class="muted" style="font-size:13px">${h}</span></span><input type="checkbox" class="tick" data-rem="${k}"${o[k]?' checked':''}></label>`;
  dlg('Reminders in Calendar',`<p class="hint" style="margin-top:0">Masroof can’t send notifications by itself, so it puts your reminders in your iPhone Calendar — they alert you even when Masroof is closed.</p>
    ${row('bills','Bills and repeating payments',`${P().recurring.length} scheduled · repeats on its own`)}
    ${row('cards','Credit card due dates',P().accounts.some(a=>a.type==='card'&&a.dueDay)?'Every month on the due day':'Add a due day to your card first')}
    ${row('loans','Loan pay-back dates','From Friends')}
    ${row('sms','Daily “import bank SMS”',`<select class="sel" data-rem="smsTime" style="padding:4px 8px;font-size:13px">${['08:00','12:00','18:00','20:00','21:00','22:00'].map(t=>`<option${o.smsTime===t?' selected':''}>${t}</option>`).join('')}</select> every day`)}
    <div class="rem-list">${items.length?items.slice(0,8).map(e=>`<div><span>${esc(e.title)}</span><span class="muted">${e.time?'daily '+e.time:shortD(e.date)+(e.rrule?' ↻':'')}</span></div>`).join('')+(items.length>8?`<div class="muted">+${items.length-8} more</div>`:''):'<p class="hint">Nothing to remind you about yet.</p>'}</div>
    <p class="hint">Tap <b>Add to Calendar</b>, then <b data-notr>Add All</b>. If you see a share sheet instead, choose <b data-notr>Save to Files</b>, open the file and tap <b data-notr>Add All</b>. Do it again after your bills change — pick the same “Masroof” calendar.</p>`,
    `<span class="spacer"></span><button class="btn" data-act="close">Close</button><button class="btn primary" data-act="remMake"${items.length?'':' disabled'}>Add to Calendar</button>`);
}
function makeReminderFile(){
  const data=buildIcs(reminderItems(P().remind||{})); const name='masroof-reminders.ics';
  const file=new File([data],name,{type:'text/calendar'});
  const open=()=>{ const url=URL.createObjectURL(file); const a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),60000); };
  if(navigator.canShare&&navigator.canShare({files:[file]})) navigator.share({files:[file],title:'Masroof reminders'}).catch(e=>{ if(!e||e.name!=='AbortError') open(); }); else open();
  P().remind.last=Date.now(); persist('profile');
}
function openSmsGuide(){
  const step=(n,h,b)=>`<li><span class="stepn">${n}</span><div><b>${h}</b><p>${b.replace(/<b>/g,'<b data-notr>')}</p></div></li>`; // iPhone button names stay as the phone shows them
  const code=t=>`<button class="codechip" data-act="smsCopy" data-v="${esc(t)}" dir="auto" data-notr>${esc(t)}<span>copy</span></button>`;
  dlg('Save bank SMS automatically',`<p class="hint" style="margin-top:0">Apple doesn’t let any app read your messages. But your iPhone’s <b data-notr>Shortcuts</b> app can save each bank SMS into a file the moment it arrives — even when Masroof is closed. Masroof then imports them in one tap. Nothing leaves your iPhone and iCloud.</p>
    <ol class="steps">
      ${step(1,'Start an automation','Open <b>Shortcuts</b> → <b>Automation</b> tab → <b>＋</b> → <b>Message</b>.')}
      ${step(2,'Only bank messages',`Set <b>Message Contains</b> to ${code('OMR')} and leave Sender as anyone. Choose <b>Run Immediately</b>, turn off <b>Notify When Run</b>, tap <b>Next</b> → <b>New Blank Automation</b>.`)}
      ${step(3,'Add a “Text” action',`Search actions for <b>Text</b>. Inside it type ${code('=====')} then a new line, then tap <b>Current Date</b> in the bar above the keyboard — tap it again and set <b>Date Format</b> to <b>ISO 8601</b>. New line, tap <b>Shortcut Input</b>, then tap it again and choose <b>Sender</b>. New line, tap <b>Shortcut Input</b> once more (leave it as the message).`)}
      ${step(4,'Add “Append to Text File”',`Search for <b>Append to Text File</b>. Set the file path to ${code('Masroof/bank-sms.txt')} and turn on <b>Make New Line</b>. Tap <b>Done</b>.`)}
      ${step(5,'Messages without “OMR”?',`Make another automation the same way for each other word your banks use: ${code('ر.ع')} for Arabic messages, and ${code('R.O')} or ${code('A/C')} if a bank writes those instead. Masroof ignores anything that isn’t a transaction.`)}
      ${step(6,'Import any time','In Masroof tap <strong>Import bank SMS</strong> and pick <b>iCloud Drive › Shortcuts › Masroof › bank-sms.txt</b>. Always pick the same file — Masroof skips messages it already has. It finds the account from the card or account number, the bank’s name or the balance in the message, and remembers any account you pick for a message it couldn’t place.')}
    </ol>
    <p class="hint">Can’t find “Append to Text File”? Use <b data-notr>Append to Note</b> instead, then copy the note and paste it into Import.</p>`,
    `<button class="btn" data-act="smsFile">Import now</button><span class="spacer"></span><button class="btn primary" data-act="smsDone">I’ve set it up</button>`);
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
  let main=[],prev=null,budget=null,labels=[],labelsK=[],ticks=[],title,mode='plain';
  if(u.period==='month'){
    mode='cum'; title='This month vs last';
    const s=summarize(filterAcct(txBetween(a,b))).byDate; const n=dayDiff(a,b)+1;
    const [pa,pb]=periodRange('month',shiftAnchor('month',u.anchor,-1)); const ps=summarize(filterAcct(txBetween(pa,pb))).byDate; const pn=dayDiff(pa,pb)+1;
    let c=0,pc=0; prev=[];
    for(let i=0;i<n;i++){const k=ymd(addDays(pd(a),i)); c+=s[k]||0; main.push(k<=t?c:null); const pk=ymd(addDays(pd(pa),Math.min(i,pn-1))); if(i<pn) pc+=ps[pk]||0; prev.push(pc); labels.push(fmtD(k,{day:'numeric',month:'short'})); labelsK.push(k);}
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
  const tl=u.period==='month'?(i=>String(pd(labelsK[i]).getDate())):(i=>state._tickLabels[i]);
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
      fx:t.fx?{on:true,cur:t.fx.cur,orig:String(t.fx.orig),rate:String(t.fx.rate),auto:!!t.fx.est}:{on:false,cur:defFx(),orig:'',rate:'',auto:true},
      personId:t.personId||'',due:t.due||'',debtKind:t.debtKind||(t.dir==='receive'?'borrowed':'lent'),investmentId:t.investmentId||'',invDir:t.dir||'buy',units:t.units?String(t.units):'',
      receipt:t.receipt||null,bill:t.bill||'',_origAmt:t.imported?t.amount:null,auto:t.auto,demo:t.demo,recurringId:t.recurringId,ts:t.ts,imported:t.imported,refund:!!t.refund,inst:t.inst,repeatCount:''};
  } else {
    const acc=defaultAcct(); const save=(P().accounts.find(a=>hasRole(a,'savings')&&a.id!==acc)||P().accounts.find(a=>a.id!==acc)||{}).id;
    draft={id:null,type:'expense',amount:'',catId:null,item:'',accountId:acc,toAccountId:save,date:todayStr(),note:'',tags:'',manual:false,repeat:false,freq:'monthly',
      itemized:false,lines:[],tax:'',taxMode:'pct',service:'',serviceMode:'pct',discount:'',split:{on:false,paidBy:'me',who:['me'],mode:'equal',custom:{}},fx:{on:false,cur:defFx(),orig:'',rate:'',auto:true},
      personId:(P().people[0]||{}).id||'',due:'',debtKind:'lent',investmentId:(P().investments[0]||{}).id||'',invDir:'buy',units:'',receipt:null,refund:false,repeatCount:''};
    if(preset==='split'){draft.split.on=true;}
    else if(preset==='lend'){draft.type='debt';}
    else if(preset==='transfer'){draft.type='transfer';}
    else if(preset==='repeat'){draft.repeat=true;}
    else if(preset&&typeof preset==='object') Object.assign(draft,preset);
  }
  $('#dlg').innerHTML=''; renderTxDlg(); const d=$('#dlg'); if(!d.open) d.showModal();
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
/* ---------- the Add sheet ----------
   Type, a big amount typed on the keypad pinned to the bottom, "what or where", the bill text,
   the category tiles, the account, the day, and the rarer options folded under "More options". */
const kpTarget=d=>d.type==='expense'&&d.itemized?null:d.fx.on&&(d.type==='expense'||d.type==='income')?'fx.orig':'amount';
function renderTxDlg(){
  const d=draft; if(d._billOpen) return renderBill4(d);
  const old=$('#dlg .add4 .body'), sc=old?old.scrollTop:0, kp=kpTarget(d);
  let h=`<div class="w-seg add4-seg" role="group" aria-label="Type">${[['expense','Expense'],['income','Income'],['transfer','Transfer'],['debt','Lend'],['invest','Invest']].map(([v,l])=>`<button data-act="dType" data-v="${v}" aria-pressed="${d.type===v}">${l}</button>`).join('')}</div>
    <div class="add4-amt"><bdi dir="ltr" class="n" id="amtV"></bdi><small id="amtCur"></small></div><div class="add4-sub" id="amtSub"></div>`;
  if(d.type==='expense') h+=expenseBody(d);
  else if(d.type==='income') h+=incomeBody(d);
  else if(d.type==='transfer') h+=transferBody(d);
  else if(d.type==='debt') h+=debtBody(d);
  else h+=investBody(d);
  if(d.id) h+=`<div class="add4-edit">${d.type==='expense'?`<button class="w-chip" data-act="dPin">${ic('star')}Make a quick button</button>`:''}<button class="w-chip" data-act="dCopy">${ic('copy')}Duplicate for today</button><button class="w-chip del" data-act="dDelete">${ic('trash')}Delete</button></div>`;
  h+=`<p class="err" id="dErr"></p>`;
  const keys=['1','2','3','⌫','4','5','6','.','7','8','9','0'];
  $('#dlg').innerHTML=`<div class="w-sheet add4${old?'':' in'}"><div class="body"><div class="w-grab"></div>${h}</div>
    ${kp?`<div class="add4-kp" dir="ltr">${keys.map(k=>`<button data-act="kp" data-v="${k}"${k==='⌫'?' aria-label="Delete"':''}>${k==='⌫'?ic('backspace'):k}</button>`).join('')}</div>`:''}
    <div class="foot"><button class="w-btn" data-act="dSave" id="dSaveBtn">Save</button></div></div>`;
  const nw=$('#dlg .add4 .body'); if(nw) nw.scrollTop=sc;
  updateCalc();
}
// the big amount and the Save button follow every key press
function updAdd4(c){
  const d=draft, v=$('#amtV'); if(!d||!v) return; const k=kpTarget(d), dp=dec(), fx=k==='fx.orig';
  const raw=k?String(fx?d.fx.orig:d.amount||''):'';
  v.textContent=k?(raw||(fx?'0':(0).toFixed(dp))):c.total.toFixed(dp);
  v.classList.toggle('empty',k?!raw:!(c.total>0));
  $('#amtCur').textContent=fx?d.fx.cur:cur();
  const sub=$('#amtSub'); if(sub) sub.textContent=fx&&c.total>0?`≈ ${c.total.toFixed(dp)} ${cur()}`:d.split.on&&d.type==='expense'&&c.total>0?`Your share ${(c.shares.me||0).toFixed(dp)}`:'';
  const b=$('#dSaveBtn'); if(b){ b.textContent=c.total>0?`${d.id?'Save changes':'Save'} · ${c.total.toFixed(dp)} ${cur()}`:'Type an amount'; b.classList.toggle('dim',!(c.total>0)); }
}
function repeatBlock(d){
  if(!d.repeat||d.id||d.type==='debt') return '';
  return `<div class="add4-box"><div class="w-seg" role="group" aria-label="How often">${[['weekly','Weekly'],['monthly','Monthly'],['yearly','Yearly']].map(([v,l])=>`<button data-act="dFreq" data-v="${v}" aria-pressed="${d.freq===v}">${l}</button>`).join('')}</div>
    <div class="field"><label>Number of payments</label><input class="inp" inputmode="numeric" placeholder="Keeps going" value="${esc(d.repeatCount)}" data-f="repeatCount"></div>
    <p class="hint">For instalments or “buy now, pay later”, e.g. 6. Leave empty for rent, salary, subscriptions.</p>
    <p class="hint">Added on ${shortD(d.date)} and then ${d.freq==='weekly'?'every week':d.freq==='monthly'?'on day '+pd(d.date).getDate()+' of every month':'every year'}${d.date>todayStr()?' (nothing recorded until then)':''}.</p></div>`;
}
const lab4=t=>`<div class="add4-lab">${t}</div>`;
function acctChips(d,field,label){
  return lab4(label)+`<div class="w-chips add4-acc">${P().accounts.map(a=>`<button data-act="dAcct" data-field="${field}" data-v="${esc(a.id)}" aria-pressed="${d[field]===a.id}"><i style="background:${cardBg(accColor(a))}"></i>${esc(a.name)}</button>`).join('')}</div>`;
}
function dateChips(d){
  const t=todayStr(), y=ymd(addDays(new Date(),-1)), other=d.date!==t&&d.date!==y;
  return lab4('When')+`<div class="w-chips add4-date"><button class="w-chip" data-act="dDate" data-v="${t}" aria-pressed="${d.date===t}">Today</button><button class="w-chip" data-act="dDate" data-v="${y}" aria-pressed="${d.date===y}">Yesterday</button>
    <label class="w-chip datechip${other?' on':''}">${ic('calendar-blank')}${other?shortD(d.date):'Other day'}<input type="date" value="${esc(d.date)}" data-f="date" data-rr aria-label="Other day"></label></div>`;
}
// "More options": a card of switches; what a switch turns on opens underneath it
const tog4=(f,icon,label,on)=>`<label class="add4-tr">${ic(icon)}<span>${label}</span><input type="checkbox" data-f="${f}" data-rr${on?' checked':''}><i class="w-tog${on?' on':''}"><i></i></i></label>`;
function moreBlock(d,rows,below){
  return `<button class="add4-more" data-act="dMore" aria-expanded="${!!d._more}"><span>More options</span>${ic(d._more?'caret-up':'caret-down')}</button>${d._more?`<div class="add4-card more-body">${rows}</div>${below||''}`:''}`;
}
const amountField=()=>'';
const noteField=(d,label,ph)=>`<label class="add4-what"><span class="vh">${label}</span><input id="note" placeholder="${ph}" value="${esc(d.note)}" data-f="note" autocomplete="off" list="dl-notes" enterkeyhint="done"></label>
  <datalist id="dl-notes">${[...new Set(allTx().map(t=>t.note).filter(Boolean))].slice(-60).map(n=>`<option value="${esc(n)}">`).join('')}</datalist>`;
const tagsField=d=>`<div class="field add4-f"><label for="tags">Tags <span class="muted" style="font-weight:400">— optional, e.g. trip, ramadan, work</span></label><input id="tags" class="inp" value="${esc(d.tags)}" data-f="tags" autocomplete="off"></div>`;
function catPicker(d,type){
  const cats=P().categories[type]; const c=d.catId?findCat(d.catId):null;
  let h=lab4(`Category${!d.manual&&d.catId?' · picked for you':''}`)+`<div class="add4-cats">${cats.map(x=>{ const v=catVis(x.id); return `<button data-act="dCat" data-v="${esc(x.id)}" aria-pressed="${d.catId===x.id}" aria-label="${esc(x.name)}"><span style="color:${v.color}">${v.html}</span><span class="n">${esc(shortCat(x))}</span></button>`; }).join('')}</div>`;
  if(c) h+=`<div class="w-chips add4-items">${c.items.map(it=>`<button class="w-chip" data-act="dItem" data-v="${esc(it)}" aria-pressed="${d.item===it}">${esc(it)}</button>`).join('')}<span class="inline-add"><input class="inp" id="newItemIn" placeholder="+ other"><button class="w-chip" data-act="dNewItem">Add</button></span></div>`;
  return h;
}
const defFx=()=>{ const l=P().lastFx; return l&&l!==cur()&&fxInfo(l)?l:cur()==='AED'?'USD':'AED'; };
function fillFxRate(d){ const r=fxRate(d.fx.cur); d.fx.rate=r>0?String(fxRound(r)):''; d.fx.auto=true; }
function fxHint(d){ const c=fxInfo(d.fx.cur); return `${c?`<span data-notr>${c.flag} ${esc(ctryName(c))}</span> · `:''}<span>${d.fx.auto?fxSourceText():'Your rate'}</span>${d.fx.auto?'':` · <button class="linkbtn" data-act="fxAutoRate">Use the current rate</button>`}`; }
function fxBlock(d){
  if(!d.fx.on) return '';
  return `<div class="add4-box"><div class="two"><div class="field"><label>Currency</label><select class="sel" data-f="fx.cur" data-rr data-notr>${FX.list.filter(x=>x.code!==cur()).slice().sort((a,b)=>a.code<b.code?-1:1).map(x=>`<option value="${x.code}"${d.fx.cur===x.code?' selected':''}>${x.flag} ${x.code}</option>`).join('')}</select></div>
  <div class="field"><label>1 ${esc(d.fx.cur)} = ? ${esc(cur())}</label><input class="inp" inputmode="decimal" value="${esc(d.fx.rate)}" data-f="fx.rate" placeholder="rate"></div></div>
  <p class="hint fxhint">${fxHint(d)}</p><p class="hint">Type the amount in ${esc(d.fx.cur)} on the keypad.</p></div>`;
}
function billRow4(d){
  const n=d.itemized?d.lines.length:0;
  return `<button class="add4-bill" data-act="billOpen">${ic('receipt')}<span><b>${d.bill?'Update bill text':'Add bill text'}</b><small>${d.bill&&n?`Bill read · ${n} item${n>1?'s':''}`:'Items, VAT and categories filled in for you'}</small></span>${chevI()}</button>`;
}
function quickRow4(d){
  if(d.id||d.amount||d.note) return '';
  const q=quickSuggestions(); if(!q.length) return '';
  return `<div class="w-chips add4-quick">${q.map((c,i)=>`<button class="w-chip" data-act="quickChip" data-i="${i}">${c.pinned?ic('star'):''}<span>${esc(c.label)}</span>${nb(money(c.amount,{show:true}))}</button>`).join('')}</div>`;
}
function expenseBody(d){
  let h=noteField(d,'What or where?','What or where? e.g. Karak at Al Mouj')+quickRow4(d)+billRow4(d);
  if(d.itemized) h+=linesEditor(d); else h+=`<div id="catWrap">${catPicker(d,'expense')}</div>`;
  h+=acctChips(d,'accountId',d.split.on&&d.split.paidBy!=='me'?'Your account':'Paid from');
  h+=dateChips(d);
  if(d.itemized||d.split.on||d.refund||d.fx.on||d.repeat||d.tags) d._more=true;
  const rows=(d.refund?'':tog4('split.on','users-three','Split with friends',d.split.on))+(d.itemized?'':tog4('fx.on','globe-hemisphere-east','Paid in another currency',d.fx.on))
    +(d.id?'':tog4('repeat','repeat','Repeat this automatically',d.repeat))+tog4('itemized','list-checks','List items, VAT & service',d.itemized)+tog4('refund','arrow-down-left','Refund or return',d.refund);
  h+=moreBlock(d,rows,`${d.itemized?'':fxBlock(d)}${d.split.on&&!d.refund?`<div class="add4-box">${splitBlock(d,true)}</div>`:''}${repeatBlock(d)}${tagsField(d)}`);
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
function incomeBody(d){ if(d.fx.on||d.repeat||d.tags) d._more=true;
  const rows=tog4('fx.on','globe-hemisphere-east','Paid in another currency',d.fx.on)+(d.id?'':tog4('repeat','repeat','Repeat this automatically',d.repeat));
  return noteField(d,'From','From? e.g. October salary')+`<div id="catWrap">${catPicker(d,'income')}</div>`+acctChips(d,'accountId','Into account')+dateChips(d)+moreBlock(d,rows,fxBlock(d)+repeatBlock(d)+tagsField(d)); }
function transferBody(d){ if(d.repeat) d._more=true;
  return acctChips(d,'accountId','From')+acctChips(d,'toAccountId','To')+`<p class="hint add4-hint">Moving money into a Savings account counts as saved. Paying a credit card or ATM cash is a transfer — not spending.</p>`+dateChips(d)+lab4('Note')+noteField(d,'Note','Note (optional)')
    +(d.id?'':moreBlock(d,tog4('repeat','repeat','Repeat this automatically',d.repeat),repeatBlock(d))); }
function debtBody(d){
  return lab4('What happened?')+`<div class="w-chips add4-kind">${[['lent','I lent money'],['repaid_in','They paid me back'],['borrowed','I borrowed'],['repaid_out','I paid them back']].map(([v,l])=>`<button class="w-chip" data-act="dKind" data-v="${v}" aria-pressed="${d.debtKind===v}">${l}</button>`).join('')}</div>
  ${lab4('Person')}<div class="add4-row">${P().people.length?`<select class="sel" data-f="personId">${peopleOptions(d.personId)}</select>`:''}<span class="inline-add"><input class="inp" id="dbNew" placeholder="New person"><button class="w-chip" data-act="dbAddPerson">Add</button></span></div>
  ${acctChips(d,'accountId',DEBT_KIND[d.debtKind][0]==='give'?'From account':'Into account')}${dateChips(d)}
  ${d.debtKind==='lent'||d.debtKind==='borrowed'?`<div class="field add4-f"><label for="due">${d.debtKind==='lent'?'They’ll pay back by':'I’ll pay back by'} (optional)</label><input id="due" class="inp" type="date" value="${esc(d.due||'')}" data-f="due"></div>`:''}
  ${lab4('Note')}${noteField(d,'Note','e.g. for the car repair')}<p class="hint add4-hint">This isn’t counted as spending or income — it just moves money and updates what you and ${d.personId?esc(personName(d.personId)):'they'} owe each other.</p>`;
}
function investBody(d){ if(d.repeat) d._more=true;
  return `<div class="w-seg add4-sub2" role="group" aria-label="Buy or sell">${[['buy','Put money in'],['sell','Take money out']].map(([v,l])=>`<button data-act="dInv" data-v="${v}" aria-pressed="${d.invDir===v}">${l}</button>`).join('')}</div>
  ${lab4('Investment')}<div class="add4-row">${P().investments.length?`<select class="sel" data-f="investmentId">${P().investments.map(h=>`<option value="${esc(h.id)}"${h.id===d.investmentId?' selected':''}>${esc(h.name)}</option>`).join('')}</select>`:''}<span class="inline-add"><input class="inp" id="invNew" placeholder="New, e.g. Gold"><button class="w-chip" data-act="invAdd">Add</button></span></div>
  ${acctChips(d,'accountId',d.invDir==='buy'?'Paid from':'Into account')}${dateChips(d)}<div class="field add4-f"><label>Units (optional)</label><input class="inp" inputmode="decimal" value="${esc(d.units)}" data-f="units" placeholder="e.g. grams, shares"></div>${lab4('Note')}${noteField(d,'Note','Note (optional)')}${d.id?'':moreBlock(d,tog4('repeat','repeat','Repeat this automatically',d.repeat),repeatBlock(d))}`;
}
function updateCalc(){
  const d=draft; if(!d||!$('#dlg .add4')) return;
  const c=calc(d); updAdd4(c);
  if(d.itemized&&d.type==='expense'){ c.lineTotals.forEach((v,i)=>{const e=$('#lt-'+i); if(e) e.textContent=v?money(v):'';});
    const set=(id,v)=>{const e=$(id); if(e) e.textContent=v}; set('#subT',money(c.subtotal)); set('#taxT',d.taxMode==='pct'&&c.taxAmt?'= '+money(c.taxAmt):''); set('#svcT',d.serviceMode==='pct'&&c.serviceAmt?'= '+money(c.serviceAmt):''); set('#totT',money(c.total)+' '+cur());
    const hint=$('#scanTotHint'); if(hint) hint.textContent=d._scanTotal&&Math.abs(d._scanTotal-c.total)>10**-dec()*5?`The bill’s total is ${money(d._scanTotal)} — check the items, VAT or discount.`:d._origAmt&&Math.abs(d._origAmt-c.total)>10**-dec()*5?`Your bank recorded ${money(d._origAmt)} — check the items, VAT or discount.`:''; }
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
  if(inThisCycle(tx.date)) for(const id of Object.keys(P().budgets)){ const bud=budgetFor(id,todayStr()); if(!(bud>0)) continue; const b4=pre.cats[id]||0, af=post.cats[id]||0;
    if(b4<=bud&&af>bud) msgs.push(`${cat(id).name} is over its monthly budget by ${money(af-bud)}`);
    else if(b4<bud*.9&&af>=bud*.9&&af<=bud) msgs.push(`${cat(id).name}: 90% of the monthly budget used`); }
  if(msgs.length) setTimeout(()=>toast(msgs.join(' · '),{bad:post.day.left<0}),250);
}
function showOverAlert(st){
  const L=P().limits; let tomorrow='';
  if(L.mode==='smart'){ const t=ymd(addDays(new Date(),1)); if(inThisCycle(t)) tomorrow=`Tomorrow’s limit drops to <b>${money(limitFor(t))}</b> so you stay inside this month’s budget.`; }
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
  if(d.fx.on&&(d.type==='expense'&&!d.itemized||d.type==='income')){ tx.fx={cur:d.fx.cur,orig:num(d.fx.orig),rate:num(d.fx.rate)}; if(d.fx.auto) tx.fx.est=true; P().lastFx=d.fx.cur; }
  if(d.type==='transfer') tx.toAccountId=d.toAccountId;
  if(d.type==='debt'){ tx.personId=d.personId; tx.debtKind=d.debtKind; tx.dir=DEBT_KIND[d.debtKind][0]; if(d.due&&(d.debtKind==='lent'||d.debtKind==='borrowed')) tx.due=d.due; }
  if(d.type==='invest'){ tx.investmentId=d.investmentId; tx.dir=d.invDir; if(num(d.units)) tx.units=num(d.units); }
  for(const k of ['auto','demo','recurringId','imported','inst']) if(d[k]) tx[k]=d[k];
  if(d.type==='expense'&&d.refund){ tx.refund=true; delete tx.split; }
  tx.receipt=d.receipt||undefined; if(!tx.receipt) delete tx.receipt;
  let profileChanged=false;
  if(d.repeat&&!d.id){
    const r={id:newId(),freq:d.freq,day:pd(d.date).getDate()}; for(const f of REC_FIELDS) if(tx[f]!=null) r[f]=clone(tx[f]);
    const cnt=Math.round(num(d.repeatCount)); if(cnt>1){ r.count=cnt; r.done=d.date>todayStr()?0:1; if(r.done) tx.inst=`1/${cnt}`; }
    P().recurring.push(r); profileChanged=true;
    if(d.date>todayStr()){ r.next=d.date; persist('profile'); $('#dlg').close(); toast('Scheduled — first on '+shortD(d.date)); render(); return; }
    r.next=advance(r,d.date); tx.recurringId=r.id;
  }
  if(d.bill&&d.type==='expense') tx.bill=String(d.bill).slice(0,8000);
  const touched=new Set(); let old=null;
  if(d.id) for(const [k,arr] of Object.entries(state.months)){const i=arr.findIndex(t=>t.id===d.id); if(i>=0){old=arr.splice(i,1)[0];touched.add(k);}}
  // an edit keeps what the form doesn't show: the bank SMS, where it was, the goal it belongs to
  if(old) for(const f of ['sms','smsKey','loc','ctry','goalId','at']) if(old[f]!=null&&tx[f]==null) tx[f]=old[f];
  // an itemized bill paid in another currency keeps the original amount
  const bfx=tx.lines&&(d._billFx||(old&&old.fx)); if(bfx&&!tx.fx&&bfx.orig>0) tx.fx={cur:bfx.cur,orig:bfx.orig,rate:fxRound(tx.amount/bfx.orig)};
  const k=d.date.slice(0,7); (state.months[k]||(state.months[k]=[])).push(tx); touched.add(k);
  if(tx.note&&tx.catId&&!tx.lines){learn(tx.note,tx.catId,tx.item); profileChanged=true;}
  if(tx.lines) for(const l of tx.lines){ if(l.name&&l.item) learn(l.name,l.catId,l.item); const cc=findCat(l.catId); if(cc&&l.item&&!cc.items.includes(l.item)) cc.items.push(l.item); profileChanged=true; }
  touched.forEach(persistMonth); if(profileChanged) persist('profile');
  lastUndo=()=>{ for(const [kk,arr] of Object.entries(state.months)){const i=arr.findIndex(t=>t.id===tx.id); if(i>=0){arr.splice(i,1);persistMonth(kk);}} if(old){(state.months[old.date.slice(0,7)]||(state.months[old.date.slice(0,7)]=[])).push(old);persistMonth(old.date.slice(0,7));} render(); };
  if(d._blobUrl) URL.revokeObjectURL(d._blobUrl);
  $('#dlg').close();
  state.ui.drop=true; celebrate(); toast(d.id?'Changes saved':(tx.refund?'Refund saved':({expense:'Expense saved',income:'Income saved',transfer:'Transfer saved',debt:'Saved',invest:'Investment saved'})[d.type]),{undo:lastUndo});
  render(); checkAlerts(pre,tx); if(!d.id&&tx.type==='expense'&&tx.date===todayStr()) pinLocation(tx.id);
}

/* ================= small dialogs ================= */
let fd=null; // generic form data
function dlg(title,body,foot){ $('#dlg').innerHTML=`<div class="dlg"><div class="dlg-h"><h3>${title}</h3><button class="icon-btn" data-act="close" aria-label="Close">×</button></div><div class="dlg-b">${body}<p class="err" id="fErr"></p></div><div class="dlg-f">${foot}</div></div>`; if(!$('#dlg').open) $('#dlg').showModal(); }
const fErr=m=>{const e=$('#fErr'); if(e) e.textContent=m};

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
/* ---------- savings goals ----------
   A goal can live in one of your accounts (its whole balance counts, or only the deposits made
   for it) or be kept by hand. A plan says how much goes in each week, month or year and where it
   comes from: another account, the bank's cash deposit machine, or by hand. Deposits can be
   recorded automatically as transfers tagged with the goal (tx.goalId). */
const GOAL_KINDS=[['car','🚗','Car'],['home','🏠','House'],['hajj','🕋','Hajj & Umrah'],['wedding','💍','Wedding'],['travel','✈️','Travel'],['study','🎓','Education'],['emergency','🛟','Emergency fund'],['other','🎯','Other']];
const goalKind=g=>GOAL_KINDS.find(k=>k[0]===g.kind)||GOAL_KINDS[GOAL_KINDS.length-1];
const goalCount=g=>g.accountId&&acct(g.accountId)?(g.count||'balance'):'hand';
const goalDeposits=g=>allTx().filter(t=>t.goalId===g.id).sort((a,b)=>a.date<b.date?1:-1);
function goalSaved(g){ const c=goalCount(g); if(c==='balance') return balances()[g.accountId]||0; return (+g.saved||0)+(c==='deposits'?sum(goalDeposits(g),t=>t.amount):0); }
const FREQ_WORD={weekly:'a week',monthly:'a month',yearly:'a year'};
const cashAcct=()=>P().accounts.find(a=>a.type==='cash');
function goalPlanText(g){ const pl=g.plan; if(!pl||!(pl.amount>0)||!FREQ_WORD[pl.freq]) return '';
  const src=pl.source==='account'&&acct(pl.fromId)?`from ${acctName(pl.fromId)}`:pl.source==='cdm'?'by cash deposit machine':'by hand';
  return `${money(pl.amount)} ${FREQ_WORD[pl.freq]} ${src}`; }
// how much is needed per period to hit the target by the date, and when the plan gets there
function goalMath(target,saved,date,amt,freq){
  const left=Math.max(0,target-saved), out={left}; const per={weekly:7,monthly:30.44,yearly:365.25}[freq];
  if(date){ const days=Math.max(1,dayDiff(todayStr(),date)); out.perMonth=left/Math.max(1,days/30.44); out.perWeek=left/Math.max(1,days/7); out.perYear=left/Math.max(1,days/365.25); }
  if(amt>0&&per&&left>0){ const n=Math.ceil(left/amt); out.reach=ymd(addDays(new Date(),Math.round(n*per))); out.n=n; }
  return out; }
function openGoal(id){
  const g=id?P().goals.find(x=>x.id===id):null, pl=(g&&g.plan)||{};
  fd={kind:'goal',id:g?g.id:null,demo:g&&g.demo,gkind:g?g.kind||'other':'',name:g?g.name:'',note:g?g.note||'':'',target:g?String(g.target):'',date:g?g.date||'':'',
    accountId:g?g.accountId||'':'',count:g?(g.accountId?g.count||'balance':'deposits'):'deposits',saved:g&&+g.saved?String(g.saved):'',
    amt:pl.amount?String(pl.amount):'',freq:pl.freq||'monthly',start:pl.start||todayStr(),source:pl.source||'account',fromId:pl.fromId||(P().accounts.find(a=>hasRole(a,'salary'))||{}).id||'',auto:g?!!g.recurringId:true,
    add:'',addSrc:pl.source||'account',addFrom:pl.fromId||''};
  renderGoal();
}
function goalHintHTML(){ const f=fd, target=num(f.target); if(!(target>0)) return 'Enter a target to see how much to save.';
  const saved=f.id?goalSaved(P().goals.find(x=>x.id===f.id)):(f.accountId&&f.count==='balance'?(balances()[f.accountId]||0):num(f.saved));
  const m=goalMath(target,saved,f.date,num(f.amt),f.freq); if(m.left<=0) return 'Already reached 🎉';
  const parts=[];
  if(f.date) parts.push(`To reach ${money(target)} by ${fmtD(f.date,{month:'short',year:'numeric'})}: <b>${money(m.perMonth)}</b> a month, or ${money(m.perWeek)} a week.`);
  if(m.reach) parts.push(`With ${money(num(f.amt))} ${FREQ_WORD[f.freq]} you reach it around <b>${fmtD(m.reach,{month:'short',year:'numeric'})}</b>.`);
  if(f.date&&m.reach&&m.reach>f.date) parts.push(`<span style="color:var(--warn)">That’s after your date — save more or move the date.</span>`);
  return parts.join('<br>')||`${money(m.left)} to go.`; }
function renderGoal(){
  const f=fd, g=f.id?P().goals.find(x=>x.id===f.id):null, bal=balances(), body=$('#dlg .dlg-b'), sc=body?body.scrollTop:0;
  if(!acct(f.fromId)||f.fromId===f.accountId) f.fromId=(P().accounts.find(a=>a.id!==f.accountId&&hasRole(a,'salary'))||P().accounts.find(a=>a.id!==f.accountId)||{}).id||'';
  const saved=g?goalSaved(g):0, pct=g&&g.target>0?Math.min(100,saved/g.target*100):0, inBank=!!f.accountId;
  const acctBtn=a=>{ const c=accColor(a); return `<button class="acc-mini${f.accountId===a.id?' on':''}" data-act="goalSet" data-v="accountId:${esc(a.id)}"><span class="am-chip" style="background:${accGrad(c)}"></span><span class="am-t"><b>${esc(a.name)}</b><small>${esc([a.bank,TYPE_LABEL[a.type]].filter(Boolean).join(' · '))}${a.last4?` · <span data-notr>•••• ${esc(a.last4)}</span>`:''}</small></span><span class="am-bal">${money(bal[a.id]||0)}</span></button>`; };
  const deps=g?goalDeposits(g).slice(0,5):[];
  dlg(g?`${goalKind(g)[1]} ${esc(g.name)}`:'New savings goal',`
    ${g?`<div class="goal-top"><div class="gt-amt"><b>${money(saved)}</b><span>of ${money(g.target)}</span></div><div class="prog"><i style="width:${pct}%"></i></div><span class="hint">${pct>=100?'Reached 🎉':`${pct.toFixed(0)}% · ${money(Math.max(0,g.target-saved))} to go`}</span></div>`:''}
${g?`<div class="sect"><div class="field"><span class="lab">Add money now</span><div style="display:flex;gap:8px"><input class="inp" inputmode="decimal" data-fd="add" placeholder="Amount" style="flex:1">
      ${inBank?`<select class="sel" data-fd="addSrc" style="flex:1"><option value="account"${f.addSrc==='account'?' selected':''}>From an account</option><option value="cdm"${f.addSrc==='cdm'?' selected':''}>Cash deposit machine</option><option value="hand"${f.addSrc==='hand'?' selected':''}>Just note it</option></select>`:''}
      <button class="btn small primary" data-act="gAdd">Add</button></div>
      ${inBank&&f.addSrc==='account'?`<select class="sel" data-fd="addFrom" style="margin-top:8px">${P().accounts.filter(a=>a.id!==f.accountId).map(a=>`<option value="${esc(a.id)}"${a.id===(f.addFrom||f.fromId)?' selected':''}>From ${esc(a.name)}</option>`).join('')}</select>`:''}</div>
      ${deps.length?`<div class="field"><span class="lab">Recent deposits</span><div class="tx-group">${deps.map(txRow).join('')}</div></div>`:''}</div>`:''}
    <div class="field"><span class="lab">1 · What are you saving for?</span><div class="chips">${GOAL_KINDS.map(([k,ic,l])=>`<button class="chip" data-act="goalSet" data-v="gkind:${k}" aria-pressed="${f.gkind===k}">${ic} ${l}</button>`).join('')}</div></div>
    <div class="field"><label>Goal name</label><input class="inp" value="${esc(f.name)}" data-fd="name" placeholder="e.g. Land Cruiser down payment"></div>
    <div class="field"><label>Details <span class="muted">(optional)</span></label><textarea class="inp" rows="2" data-fd="note" placeholder="e.g. 30% down payment, buying in summer 2027">${esc(f.note)}</textarea></div>
    <div class="field"><span class="lab">2 · Target</span><div class="two"><div class="field"><label>Amount (${esc(cur())})</label><input class="inp" inputmode="decimal" value="${esc(f.target)}" data-fd="target" placeholder="e.g. 5000"></div><div class="field"><label>Reach it by <span class="muted">(optional)</span></label><input type="date" class="inp" value="${esc(f.date)}" data-fd="date"></div></div></div>
    <div class="field"><span class="lab">3 · Where is the money kept?</span><div class="acc-list">${P().accounts.map(acctBtn).join('')}
      <button class="acc-mini${!inBank?' on':''}" data-act="goalSet" data-v="accountId:"><span class="am-chip cash">✋</span><span class="am-t"><b>Not in a bank</b><small>Cash at home, or amounts I note by hand</small></span></button></div>
      ${inBank?`<div class="seg goalseg" style="margin-top:8px"><button data-act="goalSet" data-v="count:balance" aria-pressed="${f.count==='balance'}">Whole balance counts</button><button data-act="goalSet" data-v="count:deposits" aria-pressed="${f.count==='deposits'}">Only money I put in for it</button></div>
        <p class="hint">${f.count==='balance'?`Everything in ${esc(acctName(f.accountId))} counts — best when this account is only for this goal.`:`Only deposits made for this goal count, so the account can hold other money too.`}</p>`:''}
      ${!inBank||f.count==='deposits'?`<div class="field"><label>Already saved for it (${esc(cur())})</label><input class="inp" inputmode="decimal" value="${esc(f.saved)}" data-fd="saved" placeholder="0"></div>`:''}</div>
    <div class="field"><span class="lab">4 · Saving plan</span>
      <div class="seg goalseg">${[['weekly','Weekly'],['monthly','Monthly'],['yearly','Yearly'],['none','No fixed plan']].map(([v,l])=>`<button data-act="goalSet" data-v="freq:${v}" aria-pressed="${f.freq===v}">${l}</button>`).join('')}</div>
      ${f.freq!=='none'?`<div class="two" style="margin-top:8px"><div class="field"><label>Deposit each ${f.freq==='weekly'?'week':f.freq==='yearly'?'year':'month'} (${esc(cur())})</label><input class="inp" inputmode="decimal" value="${esc(f.amt)}" data-fd="amt" placeholder="e.g. 200"></div>
        <div class="field"><label>Starting on</label><input type="date" class="inp" value="${esc(f.start)}" data-fd="start"></div></div>
      <div class="field"><label>Money comes from</label><div class="chips">${[['account','🏦','Another account'],['cdm','🏧','Cash deposit machine'],['hand','✋','By hand']].map(([v,ic,l])=>`<button class="chip" data-act="goalSet" data-v="source:${v}" aria-pressed="${f.source===v}">${ic} ${l}</button>`).join('')}</div>
        ${f.source==='account'?`<select class="sel" data-fd="fromId" style="margin-top:8px">${P().accounts.filter(a=>a.id!==f.accountId).map(a=>`<option value="${esc(a.id)}"${a.id===f.fromId?' selected':''}>${esc(a.name)}${a.last4?' · •••• '+esc(a.last4):''}</option>`).join('')}</select>`:''}
        ${f.source==='cdm'?`<p class="hint">You deposit cash at the bank’s machine${cashAcct()?` — it’s recorded as a move from ${esc(cashAcct().name)}`:''}.</p>`:''}</div>
      ${inBank&&f.source!=='hand'?`<label class="toggle-row"><span>Record each deposit automatically<br><span class="muted" style="font-size:13px">On the day, as a ${f.source==='cdm'?'cash deposit':'transfer'} into ${esc(acctName(f.accountId))}</span></span><input type="checkbox" class="tick" data-goalauto${f.auto?' checked':''}></label>`:''}`:''}
      <p class="hint goal-hint" id="goalHint">${goalHintHTML()}</p></div>
`,
    `${g?'<button class="btn danger" data-act="gDelete">Delete</button>':''}<span class="spacer"></span><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="gSave">Save goal</button>`);
  const nb=$('#dlg .dlg-b'); if(nb) nb.scrollTop=sc;
}
// the transaction a deposit makes: a move from the source account (or cash) into the goal's account
function goalDepositTx(g,amount,source,fromId,date){
  const tx={id:newId(),amount:round(amount,dec()),date:date||todayStr(),note:`Goal: ${g.name}`,goalId:g.id,ts:Date.now()};
  const from=source==='account'?(acct(fromId)?fromId:null):source==='cdm'?(cashAcct()||{}).id:null;
  if(from&&from!==g.accountId){ tx.type='transfer'; tx.accountId=from; tx.toAccountId=g.accountId; }
  else { tx.type='income'; tx.accountId=g.accountId; tx.catId=(findCat('inc_other')?'inc_other':P().categories.income[0].id); tx.note=`${source==='cdm'?'Cash deposit':'Deposit'} · Goal: ${g.name}`; }
  return tx; }
function saveGoal(){
  const p=P(), f=fd; const name=(f.name||'').trim()||(f.gkind?goalKind({kind:f.gkind})[2]:''), target=round(num(f.target),dec());
  if(!name||!(target>0)) return fErr('Add a name and a target amount.');
  const old=f.id?p.goals.find(x=>x.id===f.id):null; const amt=round(num(f.amt),dec());
  const g={id:f.id||'g_'+newId(),kind:f.gkind||'other',name,note:(f.note||'').trim(),target,date:f.date||'',accountId:f.accountId||'',count:f.accountId?f.count:'hand',saved:round(num(f.saved),dec()),demo:f.demo};
  if(f.freq!=='none'&&amt>0) g.plan={amount:amt,freq:f.freq,start:f.start||todayStr(),source:f.source,fromId:f.source==='account'?f.fromId:''};
  // the repeating deposit: replace the old one
  if(old&&old.recurringId) p.recurring=p.recurring.filter(r=>r.id!==old.recurringId);
  if(g.plan&&g.accountId&&g.plan.source!=='hand'&&f.auto){
    const t=goalDepositTx(g,amt,g.plan.source,g.plan.fromId,g.plan.start); const r={id:newId(),freq:g.plan.freq,day:pd(g.plan.start).getDate()};
    for(const k of REC_FIELDS) if(t[k]!=null) r[k]=clone(t[k]);
    let next=g.plan.start; let n=0; while(next<todayStr()&&n++<600) next=advance(r,next); r.next=next; p.recurring.push(r); g.recurringId=r.id; }
  if(old){ const i=p.goals.indexOf(old); p.goals[i]=g; } else p.goals.push(g);
  persist('profile'); $('#dlg').close(); celebrate(); toast(g.recurringId?`Goal saved — ${goalPlanText(g)}, recorded automatically`:'Goal saved'); render();
}
function addPerson(name){ name=(name||'').trim(); if(!name) return null; const ex=P().people.find(p=>norm(p.name)===norm(name)); if(ex) return ex.id; const id='p_'+newId(); P().people.push({id,name}); persist('profile'); return id; }
function addHolding(name,type){ name=(name||'').trim(); if(!name) return null; const id='h_'+newId(); P().investments.push({id,name,type:type||'other',history:[],baseCost:0}); persist('profile'); return id; }

/* ================= bank message import =================
   Reads bank SMS pasted in, or the text file an iPhone Shortcuts automation keeps adding
   every bank SMS to (Settings → Bank SMS). English and Arabic. Each message is remembered by
   a short fingerprint, so the same file can be imported again and again without duplicates. */
let imp={text:'',rows:[],busy:false,ctl:null,msg:'',src:''};
function openImport(){imp={text:'',rows:[],busy:false,ctl:null,msg:'',src:''};renderImport();if(!$('#dlg').open)$('#dlg').showModal()}
const SMS_HOW={balance:'account found by its balance',learned:'account you chose before',bank:'account from the bank’s name',kind:'your only card of this kind',you:'account you picked'};
function renderImport(){
  sheet4(`<div class="bl4-h" style="padding:16px 20px 6px"><h3>Paste bank messages</h3></div>
    <p class="hint" style="margin:0 20px 10px">Copy one or more bank SMS from Messages and paste them here. Masroof reads the amount, the account, money in or out and the balance.</p>
    <textarea class="inp bl4-ta" style="margin:0 16px;width:calc(100% - 32px)" rows="8" data-imptext dir="auto" placeholder="Your card ending 1234 was used for OMR 4.200 at PIZZA HUT MUSCAT on 28/09/2026">${esc(imp.text)}</textarea>
    <p class="hint" style="margin:10px 20px 0;color:var(--mag)">${esc(imp.msg)}</p>`,
    `<button class="w-btn" data-act="impLocal">Read messages</button>`,'imp4');
}
/* --- reading the messages --- */
const arDigits=s=>String(s||'').replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-1632)).replace(/[۰-۹]/g,d=>String(d.charCodeAt(0)-1776)).replace(/٫/g,'.').replace(/٬/g,',');
function fingerprint(s){let h=0x811c9dc5;const t=norm(s);for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)+t.length.toString(36)}
const MON={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
function mkDate(y,m,d){ if(y<100) y+=2000; if(!(y>1999&&y<2100&&m>=1&&m<=12&&d>=1&&d<=31)) return null; const dt=new Date(y,m-1,d); return dt.getMonth()===m-1?ymd(dt):null; }
function dateIn(s){
  let m=s.match(/\b(\d{4})-(\d{2})-(\d{2})/); if(m) return mkDate(+m[1],+m[2],+m[3]);
  m=s.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?!\d|\.\d)/); if(m) return mkDate(+m[3],+m[2],+m[1]);
  m=s.match(/\b(\d{1,2})[\s\-]?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(?:[\s\-,]+(\d{4}|\d{2}))?\b/i); if(m) return mkDate(m[3]?+m[3]:new Date().getFullYear(),MON[m[2].toLowerCase()],+m[1]);
  m=s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/i); if(m) return mkDate(+m[3],MON[m[1].toLowerCase()],+m[2]);
  return null;
}
// split into single messages: "=====" lines (the Shortcuts file), timestamps, blank lines, or one per line
const isSenderLine=l=>l.length<=28&&!/\d[.,]\d{2}/.test(l)&&l.split(/\s+/).length<=3&&!RE_OUT.test(l)&&!RE_IN.test(l)&&(/^\+?[\d\s\-]{5,}$/.test(l)||/^[\p{L}][\p{L}\p{N} &'._\-]*$/u.test(l));
function smsChunks(text){
  const t=arDigits(text).replace(/\r\n?/g,'\n'); const SEP=/^[ \t]*(?:={3,}|-{3,}|—+-*|_{3,}|#{3,})[ \t]*$/m;
  const parts=SEP.test(t)?t.split(new RegExp(SEP.source,'gm')):(t.match(/^\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/gm)||[]).length>1?t.split(/\n(?=\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/)
    :/\n\s*\n/.test(t)?t.split(/\n\s*\n/):t.split('\n');
  return parts.map(p=>{ const lines=p.split('\n').map(x=>x.trim()).filter(Boolean); let stamp=null, at=null, sender='';
    if(lines.length>1&&lines[0].length<48&&!/\d[.,]\d{2,3}\b.*|OMR|ر\.?\s?ع/i.test(lines[0].replace(/\b\d{1,2}[.:]\d{2}\b/g,''))){ const d=dateIn(lines[0]); if(d){ stamp=d; const ms=Date.parse(lines[0]); if(!isNaN(ms)) at=ms; lines.shift(); } }
    // the automation can also write who sent it ("BankMuscat", "NBO") on its own line
    if(stamp&&lines.length>1&&isSenderLine(lines[0])) sender=lines.shift();
    return {stamp,at,sender,body:lines.join(' ').replace(/\s+/g,' ').trim()}; }).filter(c=>c.body);
}
/* --- reading one message ---
   Amounts: "OMR 12.500", "12.500 RO", "R.O. 12.5", "١٢٫٥٠٠ ر.ع", or a bare "12.500" when the
   bank leaves the currency out. The balance the bank reports ("Avl Bal 1,234.567") is kept apart
   from the transaction amount; for a credit card "available" means available credit. */
const RE_BALKEY=/(?:bal(?:ance)?|avl|avail(?:able)?|ledger|limit|credit available|outstanding|o\/s|الرصيد|رصيد|المتاح|الحد|المستحق)[^\d\-]{0,26}$/i;
function balKind(before){ const b=before.toLowerCase();
  if(/limit|credit available|available credit|الحد/.test(b)) return 'lim';
  if(/outstanding|o\/s|المستحق/.test(b)) return 'owed';
  if(/avl|avail|المتاح/.test(b)&&!/bal|رصيد/.test(b)) return 'lim';
  return /avl|avail|المتاح/.test(b)?'avl':'bal'; }
function smsAmounts(s){
  const re=new RegExp(`(${CUR_RE})\\s*(-?\\s?[\\d,]+(?:\\.\\d+)?)|(-?[\\d,]+(?:\\.\\d+)?)\\s*(${CUR_RE})(?![\\p{L}])`,'giu'); const out=[]; let m;
  while((m=re.exec(s))){ const c=(m[1]||m[4]); if(m[1]&&/\p{L}/u.test(s[m.index-1]||'')&&/^\p{L}/u.test(c)) continue;
    const raw=String(m[2]||m[3]).replace(/\s/g,''); const v=Math.abs(num(raw)); if(!(v>0)) continue;
    const before=s.slice(Math.max(0,m.index-34),m.index), after=s.slice(m.index+m[0].length,m.index+m[0].length+6);
    const bal=RE_BALKEY.test(before); const neg=raw.startsWith('-')||/^\s*(?:dr\b|مدين)/i.test(after);
    out.push({cur:c.replace(/\s+/g,''),v,bal,kind:bal?balKind(before):'',neg,cr:/^\s*(?:cr\b|دائن)/i.test(after),idx:m.index}); }
  if(out.some(a=>!a.bal)) return out;
  // no currency written next to the amount: take plain decimals ("debited by 12.500"), never dates or times
  const re2=/(?<![\d.,\/:\-])(-?)(\d{1,3}(?:,\d{3})+|\d+)\.(\d{2,3})(?![\d]|[.\/:\-]\d)/g;
  while((m=re2.exec(s))){ const before=s.slice(Math.max(0,m.index-34),m.index); if(/(?:x{2,}|\*{2,}|card|a\/c|acc(?:oun)?t|ref|no\.?)\s*[:#]?\s*$/i.test(before)) continue;
    const v=num(m[2].replace(/,/g,'')+'.'+m[3]); if(!(v>0)||out.some(a=>Math.abs(a.idx-m.index)<3)) continue; const bal=RE_BALKEY.test(before);
    const after=s.slice(m.index+m[0].length,m.index+m[0].length+6);
    out.push({cur:cur(),v,bal,kind:bal?balKind(before):'',neg:!!m[1]||/^\s*(?:dr\b|مدين)/i.test(after),cr:/^\s*(?:cr\b|دائن)/i.test(after),idx:m.index,bare:true}); }
  return out.sort((a,b)=>a.idx-b.idx);
}
function smsNums(s){ // card / account numbers mentioned (their last 4 digits), even written "4xxx xxxx xxxx 1234" or "0312-123456-001"
  const re=/(?:x{2,}|\*{2,}|•{2,}|\.{2,}|ending(?:\s+(?:with|in))?|ends\s+(?:with|in)|a\/c|acc(?:oun)?t|card|رقم|حسابك|حساب|بطاقتك|بطاقة|المنتهي(?:ة)?(?:\s*بـ?)?)\s*(?:no\.?|number|num|#)?\s*[:#.\-]?\s*((?:[\dXx*•]{2,6}[\s\-]){0,4}[\dXx*•]{3,19})/gi;
  const out=[]; let m; while((m=re.exec(s))){ const t=m[1].replace(/[\s\-]/g,''); const d=(t.match(/(\d{3,4})$/)||[])[1]; if(d&&!out.includes(d)) out.push(d); } return out;
}
const acctNums=a=>[a.last4,...(a.smsIds||[])].filter(Boolean).map(String);
const numMatch=(n,x)=>n===x||(n.length===3&&x.endsWith(n))||(x.length===3&&n.endsWith(x));
function acctForNum(n){ return P().accounts.find(a=>acctNums(a).some(x=>numMatch(n,x))); }
// the bank: from the sender name the Shortcuts automation writes ("BankMuscat", "NBO", "SoharIntl") or from the message
const BANK_ALIASES={'Bank Muscat':['bank muscat','bankmuscat','bmuscat','بنك مسقط'],'Sohar International':['sohar','soharintl','صحار'],'Bank Dhofar':['dhofar','bankdhofar','ظفار'],'National Bank of Oman':['nbo','national bank of oman','البنك الوطني'],
  'Oman Arab Bank':['oab','oman arab bank','omanarabbank','البنك العربي'],'HSBC Oman':['hsbc'],'Ahli Bank':['ahli','ahlibank','البنك الأهلي','الاهلي'],'Bank Nizwa':['nizwa','banknizwa','نزوى'],'Alizz Islamic Bank':['alizz','العز'],'Oman Housing Bank':['housing bank','ohb','الإسكان','الاسكان']};
function banksIn(text,sender){ const n=norm(text), sn=norm(sender||'').replace(/[^a-z؀-ۿ]/g,'');
  return Object.entries(BANK_ALIASES).filter(([,al])=>al.some(x=>(sn&&x.length>2&&sn.includes(x.replace(/\s/g,'')))||new RegExp('(^|[^a-z])'+x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-z]|$)','i').test(n))).map(([b])=>b); }
function acctsForBankText(s,sender){ const banks=banksIn(s,sender); return P().accounts.filter(a=>banks.some(b=>norm(a.bank)===norm(b))); }
const RE_SKIP=/\botp\b|one.?time|password|passcode|verification|declined|unsuccessful|\bfailed\b|insufficient|will be (?:debited|charged)|minimum (?:amount )?due|payment due|due date|رمز|كلمة (?:المرور|السر)|مرفوض|فشل|لم تتم/i;
const RE_PROMO=/\b(?:offers?|apply now|eligible|win|chance to|promo(?:tion)?|t&c|terms (?:and conditions )?apply|valid (?:till|until))\b|عرض خاص|اربح/i;
const RE_IN_FIRST=/payment[^.]{0,40}received|received[^.]{0,30}payment|thank you for (?:your )?payment|تم استلام (?:ال)?دفع/i; // a payment INTO a credit card
const RE_OUT=/\bdebit(?:ed)?\b|(?<!dear )\bdr\b\.?|withdr[ae]wn|withdrawal|deducted|purchase[ds]?|\bspent\b|\bused\b|\bpaid\b|payment|\bpos\b|e-?commerce|charged|\bsent\b|transferred (?:from|to (?!your))|transfer to|from your (?:a\/c|account|card)|خصم|شراء|سحب|دفع|مدين|سداد|صادر|تحويل إلى|حوالة صادرة/i;
const RE_IN=/\bcredit(?:ed)?\b|\bcr\b\.?|deposit(?:ed)?|received|salary|incoming|cash\s*back|transferred to your|added to|to your (?:a\/c|account)|إيداع|ايداع|أودع|اودع|استلام|راتب|إضافة|اضافة|أضيف|اضيف|دائن|وارد/i;
const RE_REFUND=/refund|reversal|reversed|مسترد|استرداد|عكس/i;
const RE_ATM=/\batm\b|cash withdrawal|سحب نقدي|صراف/i;
// what kind of message this is, without its numbers or shop: used to remember your answers
const smsTpl=(s,merchant)=>norm(merchant?s.split(merchant).join(' @ '):s).replace(/\d[\d,.:\/\-]*/g,'#').replace(/[x*•]{2,}#?/gi,'#').replace(/\s+/g,' ').trim().slice(0,110);
function smsMerchant(s){
  const bad=/^(?:your|you|the|a|an|my|our|account|a\/c|acc|card|ending|xx|\*|merchant|pos|atm)\b|حساب|بطاقة|رصيد/i;
  const tidy=x=>x.replace(new RegExp(`\\s*(?<![\\p{L}])(?:${CUR_RE})\\s*\\d[\\d,.]*.*$`,'iu'),'').replace(/\s+(?:on|dated|for|via|using|ref.*)$/i,'').replace(/[\s\-–:]+$/,'').trim();
  for(const re of [/\b(?:pos|e-?com(?:merce)?|purchase)\s+(?!at\b|of\b|for\b|txn\b|transaction\b)([A-Za-z][A-Za-z0-9&'’.\-*\/ ]{1,40}?)(?=\s+(?:on|dated|for|via|ref|avl|avail|bal|card|a\/c)\b|[.,;:|()]|\s*$|\s+\d{1,2}[\/\-.])/i,
    /\b(?:at|@|merchant:?)\s+([A-Za-z0-9&'’.\-*\/ ]{2,40}?)(?=\s+(?:on|dated|for|with|using|via|ref|avl|avail|bal|card|a\/c|in|credited|debited|was|has|is|of|and)\b|[.,;:|()]|\s*$|\s+\d{1,2}[\/\-.])/i,
    /\b(?:to|from)\s+([A-Za-z0-9&'’.\-*\/ ]{2,40}?)(?=\s+(?:on|dated|for|with|using|via|ref|avl|avail|bal|card|a\/c|credited|debited|was|has|is|of|and)\b|[.,;:|()]|\s*$|\s+\d{1,2}[\/\-.])/i,
    /(?:لدى|عند|في محل|لصالح|من|إلى|الى)\s+([^.،,؛:\d()]{2,40}?)(?=\s+(?:بتاريخ|في\s|يوم|رصيد|الرصيد|بمبلغ)|[.،,؛()]|$)/]){
    for(const m of s.matchAll(new RegExp(re.source,re.flags+'g'))){ const x=tidy(m[1]); if(x.length>1&&!bad.test(x)&&!/^\d/.test(x)&&!curCode(x)) return x; } }
  return '';
}
function parseSms(c,ctx){
  ctx=ctx||{bal:balances(),pend:{},last:{}};
  const s=c.body; if(RE_SKIP.test(s)) return null;
  const amts=smsAmounts(s); const txA=amts.filter(a=>!a.bal); if(!txA.length) return null;
  const nums=smsNums(s); const own=[...new Set(nums.map(acctForNum).filter(Boolean).map(a=>a.id))];
  if(RE_PROMO.test(s)&&!own.length&&!nums.length) return null;
  // paid in another currency: use the amount in your currency if the bank gave it, else convert
  const local=txA.find(a=>isLocalCur(a.cur)); const foreign=txA.find(a=>!isLocalCur(a.cur)&&curCode(a.cur)); const main=local||foreign||txA[0];
  let fx=null, amount=main.v, fxEst=false;
  if(foreign){ const code=curCode(foreign.cur); fx={cur:code,orig:foreign.v};
    if(local) fx.rate=fxRound(local.v/foreign.v); else { fx.rate=fxRound(fxRate(code)); amount=fxConv(foreign.v,code); fxEst=true; } }
  amount=round(amount,dec());
  const balA=amts.find(a=>a.bal&&(isLocalCur(a.cur)||a.bare));
  // money out or in: the first telling word before the balance part; "credit card"/"debit card" say nothing
  const balAt=balA?balA.idx:s.length; const head=s.slice(0,Math.max(balAt,Math.min(40,s.length))).replace(/credit\s*card|debit\s*card|credit\s*limit|available\s*credit|بطاقة\s*(?:ال)?(?:ائتمان|خصم)/gi,' card ');
  const refund=RE_REFUND.test(s); const oi=head.search(RE_OUT), ii=head.search(RE_IN);
  let type=RE_IN_FIRST.test(s)||refund?(refund?'expense':'income'):ii>=0&&(oi<0||ii<oi)?'income':'expense';
  let known=refund||RE_IN_FIRST.test(s)||oi>=0||ii>=0;
  if(!known&&main.neg){ type='expense'; known=true; }
  let date=dateIn(s); const t=todayStr(); if(!date||date>ymd(addDays(new Date(),1))) date=c.stamp||t;
  let merchant=smsMerchant(s), ctry=null;
  { const cm=merchant.match(/^(.+?\s)([A-Z]{2})$/); if(cm&&FX_ISO[cm[2]]){ ctry=cm[2]; merchant=cm[1].trim(); } }
  const tpl=smsTpl(s,merchant), L=(P().smsTpl||{})[tpl];
  if(L&&L.t&&!refund) { type=L.t; known=true; }
  // which account: its number, else the balance the bank reports, else what you told Masroof before, else the bank's name
  let accountId=own[0]||null, toAccountId=null, how=accountId?'number':'';
  if(own.length>1){ // money between two of your own accounts
    type='transfer'; known=true; if(ii>=0&&(oi<0||ii<oi)){ accountId=own[1]; toAccountId=own[0]; } else { accountId=own[0]; toAccountId=own[1]; } }
  const bankAccts=acctsForBankText(s,c.sender);
  const isCard=/credit\s*card|بطاقة\s*(?:ال)?ائتمان/i.test(s), isBank=!isCard&&/debit\s*card|a\/c|account|acct|حساب|بطاقة\s*(?:ال)?خصم/i.test(s);
  const fitsKind=a=>isCard?a.type==='card':isBank?a.type!=='card'&&a.type!=='cash':true;
  const balVal=a=>{ if(!balA) return null; if(a.type==='card'){ if(balA.kind==='lim'||balA.kind==='avl') return a.limit?round(-(a.limit-balA.v),dec()):null; return balA.cr?balA.v:-balA.v; } if(balA.kind==='lim') return null; return balA.neg?-balA.v:balA.v; };
  // does this account's balance fit? Either the bank's previous balance for it ± this amount, or (for
  // messages newer than the balance you set) Masroof's balance ± this amount
  const afterAnchor=a=>!a.anchor||(a.anchor.at&&c.at?c.at>a.anchor.at:date>a.anchor.date);
  const prevBank=a=>{ if(ctx.last[a.id]!=null) return ctx.last[a.id]; const bb=a.bankBal; return bb&&bb.v!=null&&(bb.at&&c.at?bb.at<c.at:bb.date<date)?bb.v:null; };
  const fitBal=(a,ty)=>{ const b=balVal(a); if(b==null) return false; const eff=ty==='income'||(ty==='expense'&&refund)?amount:-amount, tol=10**-dec()*1.5;
    const pb=prevBank(a); if(pb!=null&&Math.abs(pb+eff-b)<tol) return true;
    return afterAnchor(a)&&Math.abs((ctx.bal[a.id]||0)+(ctx.pend[a.id]||0)+eff-b)<tol; };
  const unknownNum=nums.length>0&&!own.length; // a card number Masroof hasn't seen: don't guess with confidence
  if(!accountId&&balA){ const pool=(bankAccts.length?bankAccts:P().accounts).filter(fitsKind);
    for(const ty of known?[type]:['expense','income']){ const hits=pool.filter(a=>fitBal(a,ty)); if(hits.length===1){ accountId=hits[0].id; how='balance'; if(!known){ type=ty; known=true; } break; } } }
  if(!accountId&&!unknownNum&&L&&L.a&&acct(L.a)){ accountId=L.a; how='learned'; }
  if(!accountId&&bankAccts.length){ const k=bankAccts.filter(fitsKind), pick=k.length?k:bankAccts;
    if(pick.length===1&&!unknownNum){ accountId=pick[0].id; how='bank'; } else { accountId=(pick.find(a=>hasRole(a,type==='income'?'salary':'spending'))||pick[0]).id; how='guess'; } }
  if(!accountId&&!unknownNum&&(isCard||isBank)){ const k=P().accounts.filter(a=>isCard?a.type==='card':a.type==='bank'); if(k.length===1){ accountId=k[0].id; how='kind'; } }
  if(!accountId){ const sp=P().accounts.find(a=>hasRole(a,type==='income'?'salary':'spending')&&a.type!=='card'&&a.type!=='cash')||P().accounts[0]; accountId=sp.id; how='guess'; }
  // with the account known, the balance also settles money in or out
  if(type!=='transfer'&&balA&&how!=='balance'){ const a=acct(accountId); if(a){ if(fitBal(a,'expense')&&!fitBal(a,'income')){ if(type!=='expense'||!refund){ type='expense'; } known=true; } else if(fitBal(a,'income')&&!refund){ type='income'; known=true; } } }
  if(type!=='transfer'&&!refund&&RE_ATM.test(s)){ const cash=P().accounts.find(a=>a.type==='cash'&&a.id!==accountId); merchant=merchant&&!/atm/i.test(merchant)?'ATM · '+merchant:'ATM withdrawal'; if(cash&&type==='expense'){ type='transfer'; toAccountId=cash.id; } }
  if(type==='income'&&/salary|راتب/i.test(s)) merchant='Salary';
  if(!merchant) merchant=type==='transfer'?'Transfer':type==='income'?'Deposit':refund?'Refund':'Card payment';
  const g=type==='transfer'?null:(guessCategory(merchant,type)||guessCategory(s,type));
  const acA=acct(accountId), bal=acA?balVal(acA):null;
  // count this one so the next message's balance check starts from the right place
  const eff=type==='income'||(type==='expense'&&refund)?amount:-amount;
  const pend=(id,v)=>{ const a=acct(id); if(a&&afterAnchor(a)) ctx.pend[id]=(ctx.pend[id]||0)+v; };
  if(type==='transfer'){ pend(accountId,-amount); if(toAccountId) pend(toAccountId,amount); } else pend(accountId,eff);
  if(bal!=null) ctx.last[accountId]=bal;
  return {text:s.slice(0,300),sender:(c.sender||'').slice(0,40),on:known,date,at:c.at||null,type,amount,merchant,catId:g?g.catId:(type==='income'?'inc_other':'other'),item:g&&g.item||'',accountId,toAccountId,acctSure:how!=='guess',how,tpl,
    nums,fx,fxEst,estAmt:fxEst?amount:null,ctry,refund,bal,balKind:balA?balA.kind:null,unsure:!known};
}
function localParse(text){
  const seen=new Set(P().smsSeen||[]); let skipped=0; const rows=[]; const ctx={bal:balances(),pend:{},last:{}};
  for(const c of smsChunks(text)){ const key=fingerprint((c.stamp||'')+'|'+c.body); if(seen.has(key)){ skipped++; continue; } seen.add(key);
    const r=parseSms(c,ctx); if(r){ r.key=key; rows.push(r); } else rows.push({key,skip:true}); }
  const keys=rows.map(r=>r.key); const out=rows.filter(r=>!r.skip);
  // an expense from one of your accounts and income into another, same amount and day: one transfer
  for(const e of out) if(e.type==='expense'&&!e.refund&&e.acctSure&&!e.pairedWith) for(const i of out)
    if(i.type==='income'&&i.acctSure&&!i.pairedWith&&i.accountId!==e.accountId&&i.date===e.date&&Math.abs(i.amount-e.amount)<1e-9){ e.type='transfer'; e.toAccountId=i.accountId; e.merchant=e.merchant==='Transfer'||!e.merchant?'Transfer':e.merchant; i.pairedWith=e; e.pairedWith=i; if(i.bal!=null) e.toBal=i.bal; break; }
  imp.seen=skipped; imp.keys=keys; imp.skipKeys=rows.filter(r=>r.skip).map(r=>r.key); // skipKeys: OTPs and other non-transactions
  return markDups(out.filter(r=>!(r.type==='income'&&r.pairedWith)));
}
function markDups(rows){ const ex=allTx(); for(const r of rows){ r.dup=ex.some(t=>t.date===r.date&&Math.abs(t.amount-r.amount)<1e-6&&!t.smsKey); if(r.dup) r.on=false; } return rows; }
// ready to add with no questions: account known, clearly a payment or deposit (other currencies are converted)
const autoOK=r=>r.on&&r.acctSure&&!r.unsure&&!r.dup&&(!r.fx||r.amount>0);
function readSmsFile(file){
  if(!file) return; file.text().then(text=>{
    imp={text:'',rows:[],busy:false,ctl:null,msg:'',src:'file'}; const rows=localParse(text); const S=P().sms||(P().sms={});
    S.lastFile=Date.now(); S.setup=true; persist('profile'); if($('#dlg').open) $('#dlg').close();
    if(!rows.length){ rememberSeen(); persist('profile'); toast(imp.seen?`Nothing new — all ${imp.seen} message${imp.seen>1?'s were':' was'} brought in before`:'No bank transactions found in that file'); return; }
    queueSms(rows);
  }).catch(()=>toast('Couldn’t read that file',{bad:true}));
}
// messages already handled are skipped next time; ones still waiting for review are not
function rememberSeen(keys){ const P_=P(); const s=P_.smsSeen||(P_.smsSeen=[]); for(const k of keys||imp.keys||[]) if(k&&!s.includes(k)) s.push(k); if(s.length>5000) s.splice(0,s.length-5000); }
function doImport(){ const rows=imp.rows.filter(r=>r.on); if(!rows.length) return; addImported(rows,true,true); }
function addImported(rows,close,reviewed,opt={}){
  const touched=new Set(); const ids=[]; const p=P(); const synced=new Set();
  for(const r of rows){ const amount=round(num(r.amount),dec()); if(!(amount>0)) continue;
    const tx={id:newId(),type:r.type,amount,date:r.date,accountId:r.accountId,note:r.merchant,ts:Date.now(),imported:true,smsKey:r.key}; if(r.text) tx.sms=r.text;
    if(r.type==='transfer'){ if(!r.toAccountId||r.toAccountId===r.accountId) continue; tx.toAccountId=r.toAccountId; }
    else { tx.catId=r.catId; tx.item=r.item||''; if(r.refund&&r.type==='expense') tx.refund=true; }
    if(r.fx&&r.type!=='transfer'){ tx.fx={cur:r.fx.cur,orig:r.fx.orig,rate:fxRound(amount/r.fx.orig)}; if(r.fxEst&&amount===r.estAmt) tx.fx.est=true; }
    if(r.ctry) tx.ctry=r.ctry; if(r.at) tx.at=r.at;
    ids.push(tx.id);
    // a message from before you set an account's current balance is already in that balance
    for(const id of [tx.accountId,tx.toAccountId]){ const a=acct(id); if(a&&a.anchor&&(r.at&&a.anchor.at?r.at<=a.anchor.at:r.date<a.anchor.date)) a.opening=round((+a.opening||0)-acctEffect(tx,id),dec()); }
    // remember how you answered for this kind of message
    if(reviewed&&r.tpl&&r.type!=='transfer'){ const T=p.smsTpl||(p.smsTpl={}); T[r.tpl]={t:r.type,a:r.how==='number'?undefined:r.accountId}; const ks=Object.keys(T); if(ks.length>400) delete T[ks[0]]; } const k=r.date.slice(0,7);(state.months[k]||(state.months[k]=[])).push(tx);touched.add(k);
    if(tx.catId){ const c=findCat(r.catId); if(c&&r.item&&!c.items.includes(r.item)) c.items.push(r.item); learn(r.merchant,r.catId,r.item); }
    // a new card number: remember which account it belongs to
    if(r.nums&&r.nums.length&&!acctForNum(r.nums[0])){ const a=acct(r.accountId); if(a){ a.smsIds=[...new Set([...(a.smsIds||[]),r.nums[0]])]; } }
    // the balance the bank reported, to check Masroof against
    const note=(id,v)=>{ const a=acct(id); if(a&&v!=null&&(!a.bankBal||a.bankBal.date<r.date||a.bankBal.date===r.date&&(!r.at||!a.bankBal.at||r.at>=a.bankBal.at))){ a.bankBal={v,date:r.date,at:r.at||null,ts:Date.now()}; synced.add(id); } };
    note(r.accountId,r.bal); if(r.toBal!=null) note(r.toAccountId,r.toBal);
  }
  rememberSeen(opt.keys||(reviewed?imp.keys:[...rows.map(r=>r.key),...(imp.skipKeys||[])])); const S=p.sms||(p.sms={}); S.last=Date.now(); S.count=(S.count||0)+ids.length;
  // the balance in the newest message is the truth: set each account's current balance to it
  const fixed=S.syncBal===false?[]:[...synced].map(id=>acct(id)).filter(a=>a&&syncToBank(a)!==null);
  touched.forEach(persistMonth); persist('profile'); if(close) $('#dlg').close(); if(ids.length) celebrate();
  if(!opt.quiet) toast(ids.length?`${ids.length===1?'Added':`Imported ${ids.length} transactions`} from your bank${fixed.length?` · balance${fixed.length>1?'s':''} updated`:''}`:'Nothing to import',{undo:ids.length?()=>{removeIds(ids); if(opt.undo) opt.undo(); render();}:null}); render();
}
/* ================= spending map =================
   Where each expense happened: the exact spot when "Remember where I spend" is on (stored
   encrypted like everything else), else a city named in the note or bank SMS, else the country
   of a foreign currency, else your home city. Shown on a 3D globe with a month-by-month timeline. */
const GEO=[ // name, lat, lng, words that point to it (English and Arabic)
  ['Muscat',23.588,58.383,'muscat|مسقط|ruwi|روي|muttrah|mutrah|مطرح|qurum|القرم|khuwair|الخوير|ghubrah|الغبرة|bawshar|bausher|بوشر|azaiba|العذيبة|al mouj|الموج|mall of oman|avenues mall|madinat sultan qaboos|مدينة السلطان قابوس|wattayah|الوطية'],
  ['Seeb',23.670,58.189,'seeb|السيب|mabelah|maabilah|المعبيلة|khoudh|al khoud|الخوض|muscat airport|مطار مسقط'],['Al Amerat',23.523,58.497,'amerat|العامرات'],
  ['Barka',23.679,57.886,'barka|بركاء'],['Al Suwaiq',23.849,57.438,'suwaiq|السويق'],['Sohar',24.347,56.709,'sohar|صحار'],['Saham',24.172,56.888,'saham|صحم'],['Shinas',24.743,56.465,'shinas|شناص'],
  ['Salalah',17.019,54.089,'salalah|صلالة|dhofar|ظفار'],['Nizwa',22.933,57.531,'nizwa|نزوى'],['Bahla',22.968,57.298,'bahla|بهلاء'],['Jabal Akhdar',23.073,57.661,'jabal akhdar|jebel akhdar|الجبل الأخضر'],
  ['Sur',22.567,59.529,'sur|صور'],['Ibra',22.691,58.533,'ibra|إبراء|ابراء'],['Ibri',23.226,56.516,'ibri|عبري'],['Rustaq',23.391,57.424,'rustaq|الرستاق'],['Samail',23.302,57.977,'samail|سمائل'],
  ['Buraimi',24.250,55.793,'buraimi|البريمي'],['Duqm',19.662,57.704,'duqm|الدقم'],['Khasab',26.180,56.247,'khasab|خصب|musandam|مسندم'],
  ['Dubai',25.204,55.271,'dubai|دبي'],['Abu Dhabi',24.453,54.377,'abu dhabi|أبوظبي|ابوظبي'],['Sharjah',25.346,55.421,'sharjah|الشارقة'],['Al Ain',24.207,55.745,'al ain|العين'],
  ['Ras Al Khaimah',25.790,55.943,'ras al khaimah|رأس الخيمة'],['Fujairah',25.129,56.326,'fujairah|الفجيرة'],['Riyadh',24.713,46.675,'riyadh|الرياض'],['Jeddah',21.485,39.192,'jeddah|جدة'],
  ['Makkah',21.422,39.826,'makkah|mecca|مكة'],['Madinah',24.468,39.614,'madinah|medina|المدينة المنورة'],['Dammam',26.433,50.104,'dammam|الدمام'],['Doha',25.285,51.531,'doha|qatar|الدوحة|قطر'],
  ['Kuwait',29.376,47.977,'kuwait|الكويت'],['Manama',26.228,50.586,'manama|bahrain|المنامة|البحرين'],['Cairo',30.044,31.236,'cairo|القاهرة'],['Amman',31.954,35.910,'amman|عمّان|عمان الأردن'],
  ['Beirut',33.894,35.502,'beirut|بيروت'],['Istanbul',41.008,28.978,'istanbul|إسطنبول|اسطنبول'],['Trabzon',41.003,39.717,'trabzon|طرابزون'],['Baku',40.409,49.867,'baku|باكو'],
  ['Tbilisi',41.716,44.783,'tbilisi|تبليسي'],['London',51.507,-0.128,'london|لندن'],['Paris',48.857,2.352,'paris|باريس'],['Geneva',46.204,6.143,'geneva|جنيف'],['Zurich',47.377,8.541,'zurich|زيورخ'],
  ['Munich',48.135,11.582,'munich|ميونخ'],['Vienna',48.208,16.373,'vienna|فيينا'],['Rome',41.903,12.496,'rome|روما'],['Milan',45.464,9.190,'milan|ميلانو'],['Barcelona',41.385,2.173,'barcelona|برشلونة'],
  ['Madrid',40.417,-3.704,'madrid|مدريد'],['Mumbai',19.076,72.878,'mumbai|bombay|مومباي'],['Delhi',28.614,77.209,'delhi|دلهي'],['Kochi',9.931,76.267,'kochi|cochin|kerala|كيرالا'],
  ['Karachi',24.861,67.010,'karachi|كراتشي'],['Lahore',31.550,74.344,'lahore|لاهور'],['Colombo',6.927,79.861,'colombo|كولومبو'],['Male',4.175,73.509,'maldives|male city|المالديف'],
  ['Kathmandu',27.717,85.324,'kathmandu|كاتماندو'],['Dhaka',23.811,90.413,'dhaka|دكا'],['Bangkok',13.756,100.502,'bangkok|بانكوك'],['Phuket',7.880,98.392,'phuket|بوكيت'],
  ['Kuala Lumpur',3.139,101.687,'kuala lumpur|كوالالمبور'],['Singapore',1.352,103.820,'singapore|سنغافورة'],['Bali',-8.650,115.217,'bali|بالي'],['Jakarta',-6.208,106.846,'jakarta|جاكرتا'],
  ['Manila',14.600,120.984,'manila|مانيلا'],['Tokyo',35.676,139.650,'tokyo|طوكيو'],['Seoul',37.567,126.978,'seoul|سيول'],['Sydney',-33.869,151.209,'sydney|سيدني'],
  ['Nairobi',-1.286,36.817,'nairobi|نيروبي'],['Zanzibar',-6.165,39.202,'zanzibar|زنجبار'],['New York',40.713,-74.006,'new york|نيويورك'],['Los Angeles',34.052,-118.244,'los angeles|لوس أنجلوس'],
].map(([name,lat,lng,w])=>({name,lat,lng,words:w.split('|')}));
const GEO_AR={'Muscat':'مسقط','Seeb':'السيب','Al Amerat':'العامرات','Barka':'بركاء','Al Suwaiq':'السويق','Sohar':'صحار','Saham':'صحم','Shinas':'شناص','Salalah':'صلالة','Nizwa':'نزوى','Bahla':'بهلاء','Jabal Akhdar':'الجبل الأخضر','Sur':'صور','Ibra':'إبراء','Ibri':'عبري','Rustaq':'الرستاق','Samail':'سمائل','Buraimi':'البريمي','Duqm':'الدقم','Khasab':'خصب',
  'Dubai':'دبي','Abu Dhabi':'أبوظبي','Sharjah':'الشارقة','Al Ain':'العين','Ras Al Khaimah':'رأس الخيمة','Fujairah':'الفجيرة','Riyadh':'الرياض','Jeddah':'جدة','Makkah':'مكة المكرمة','Madinah':'المدينة المنورة','Dammam':'الدمام','Doha':'الدوحة','Kuwait':'الكويت','Manama':'المنامة','Cairo':'القاهرة','Amman':'عمّان','Beirut':'بيروت','Istanbul':'إسطنبول','Trabzon':'طرابزون','Baku':'باكو','Tbilisi':'تبليسي',
  'London':'لندن','Paris':'باريس','Geneva':'جنيف','Zurich':'زيورخ','Munich':'ميونخ','Vienna':'فيينا','Rome':'روما','Milan':'ميلانو','Barcelona':'برشلونة','Madrid':'مدريد','Mumbai':'مومباي','Delhi':'دلهي','Kochi':'كوتشي','Karachi':'كراتشي','Lahore':'لاهور','Colombo':'كولومبو','Male':'ماليه','Kathmandu':'كاتماندو','Dhaka':'دكا','Bangkok':'بانكوك','Phuket':'بوكيت',
  'Kuala Lumpur':'كوالالمبور','Singapore':'سنغافورة','Bali':'بالي','Jakarta':'جاكرتا','Manila':'مانيلا','Tokyo':'طوكيو','Seoul':'سيول','Sydney':'سيدني','Nairobi':'نيروبي','Zanzibar':'زنجبار','New York':'نيويورك','Los Angeles':'لوس أنجلوس'};
const geoName=n=>LANG==='ar'&&(GEO_AR[n]||FX_CITY_AR[n])||n;
const geoCity=n=>GEO.find(g=>g.name===n);
const GEO_WORDS=GEO.flatMap(g=>g.words.map(w=>({w,g}))).sort((a,b)=>b.w.length-a.w.length).map(x=>({...x,re:/[a-z]/.test(x.w)?new RegExp('(^|[^a-z])'+x.w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-z]|$)'):null}));
function cityInText(s){ const n=norm(s); if(!n) return null; for(const x of GEO_WORDS){ if(x.re?x.re.test(n):n.includes(x.w)) return x.g; } return null; }
function nearestCity(lat,lng){ let best=null,bd=1e9; for(const g of GEO){ const d=Math.hypot(g.lat-lat,(g.lng-lng)*Math.cos(lat*Math.PI/180)); if(d<bd){bd=d;best=g;} } return {g:best,km:bd*111}; }
const homeCity=()=>{ const c=fxInfo(cur()); return geoCity(P().homeCity)||(c&&(geoCity(c.city)||{name:c.city,lat:c.lat,lng:c.lng}))||geoCity('Muscat'); };
function placeOf(t){
  if(t.loc){ const n=nearestCity(t.loc.lat,t.loc.lng); if(n.g&&n.km<45) return {key:n.g.name,name:n.g.name,lat:n.g.lat,lng:n.g.lng,how:'gps'};
    const la=Math.round(t.loc.lat*2)/2, lo=Math.round(t.loc.lng*2)/2; return {key:la+','+lo,name:n.g?`Near ${n.g.name}`:`${la}, ${lo}`,lat:la,lng:lo,how:'gps'}; }
  const c=cityInText([t.note,t.item,t.sms].filter(Boolean).join(' ')); if(c) return {key:c.name,name:c.name,lat:c.lat,lng:c.lng,how:'text'};
  const k=countryOf(t); if(k){ const g=geoCity(k.city)||k; return {key:k.city,name:k.city,lat:g.lat,lng:g.lng,flag:k.flag,how:t.ctry?'country':'currency'}; }
  const h=homeCity(); return {key:h.name,name:h.name,lat:h.lat,lng:h.lng,how:'home'};
}
// spending per place for a period ('all' or 'YYYY-MM')
function mapPlaces(period){
  const list=period==='all'?allTx():(state.months[period]||[]); const by={};
  for(const t of list){ if(t.type!=='expense') continue; const v=myShare(t); if(!(v>0)) continue;
    const pl=placeOf(t); const o=by[pl.key]||(by[pl.key]={...pl,total:0,count:0,cats:{},tx:[],how:{}}); o.total+=v; o.count++; o.cats[t.catId]=(o.cats[t.catId]||0)+v; o.tx.push(t); o.how[pl.how]=(o.how[pl.how]||0)+1; }
  return Object.values(by).map(o=>{ const top=Object.entries(o.cats).sort((a,b)=>b[1]-a[1])[0]; o.color=top?cat(top[0]).color:'#1FA2A0'; o.topCat=top&&top[0]; o.tx.sort((a,b)=>a.date<b.date?1:-1); return o; }).sort((a,b)=>b.total-a.total);
}
const mapMonths=()=>{ const ks=Object.keys(state.months).filter(k=>(state.months[k]||[]).some(t=>t.type==='expense')).sort(); return ks; };
let globe=null, miniGlobe=null, mapState={period:'all',sel:null,playing:false,timer:null,style:'night'};
const spotOf=p=>({id:p.key,lat:p.lat,lng:p.lng,value:p.total,color:p.color,label:esc(geoName(p.name)),amount:money(p.total)});
function openMap(){
  closeMap(); const months=mapMonths(); mapState.period='all'; mapState.sel=null; mapState.months=months; mapState.style=P().mapStyle||'night';
  const h=homeCity(); const v=document.createElement('div'); v.id='mapv'; v.className='mapv'; document.body.appendChild(v); document.body.classList.add('map-open');
  v.innerHTML=`<div class="mv-globe" id="mvGlobe"></div>
    <div class="mv-top"><button class="mv-x" data-act="mapClose" aria-label="Back">${backI()}</button>
      <div class="mv-h"><h2>Spending map</h2><small id="mvSub"></small></div>
      <div class="mv-style" role="group" aria-label="Map style"><button data-act="mapStyle" data-v="night" aria-pressed="${mapState.style==='night'}" aria-label="Night">${ic('moon')}</button><button data-act="mapStyle" data-v="day" aria-pressed="${mapState.style==='day'}" aria-label="Day">${ic('sun')}</button></div></div>
    <div class="mv-bottom">
      <div class="mv-detail" id="mvDetail" hidden></div>
      <div class="mv-cards" id="mvCards"></div>
      <div class="mv-time"><button class="mv-play" data-act="mapPlay" aria-label="Play months">▶</button>
        <div class="mv-track"><input type="range" id="mvRange" min="0" max="${months.length}" value="${months.length}" aria-label="Month"><div class="mv-ticks">${months.map(k=>`<i></i>`).join('')}<i></i></div></div>
        <span id="mvWhen"></span></div>
    </div>`;
  const el=$('#mvGlobe'), opts={home:{lat:h.lat,lng:h.lng},style:mapState.style,onPick:s=>{ mapState.sel=s.id; renderMapCards(); renderMapDetail(); buzz(8); }};
  globe=window.MasroofGlobe3D&&window.MasroofGlobe3D(el,opts);
  if(!globe){ el.innerHTML='<canvas id="globeC"></canvas>'; globe=window.MasroofGlobe(document.getElementById('globeC'),{lat:h.lat-22,lng:h.lng,dark:()=>true,onPick:opts.onPick}); }
  v.querySelector('#mvRange').addEventListener('input',e=>{ stopPlay(); const i=+e.target.value; mapState.period=i>=months.length?'all':months[i]; updateMap(); });
  updateMap(); trTree(v); requestAnimationFrame(()=>v.classList.add('in'));
}
function closeMap(){ stopPlay(); if(globe){ globe.stop(); globe=null; } const v=$('#mapv'); if(v) v.remove(); document.body.classList.remove('map-open'); }
function updateMap(){
  const places=mapPlaces(mapState.period); mapState.places=places; if(mapState.sel&&!places.some(p=>p.key===mapState.sel)) mapState.sel=null;
  if(globe){ globe.setSpots(places.map(spotOf),true); if(globe.select&&mapState.sel) globe.select(mapState.sel); }
  const total=sum(places,p=>p.total);
  const w=$('#mvWhen'); if(w) w.innerHTML=`<b>${esc(mapState.period==='all'?tr('All time'):MONTHS[+mapState.period.slice(5)-1]+' '+mapState.period.slice(0,4))}</b><span>${money(total)} ${esc(cur())}</span>`;
  const sub=$('#mvSub'); if(sub) sub.textContent=`${places.length} place${places.length===1?'':'s'} · ${money(total)} ${cur()}`;
  const r=$('#mvRange'); if(r) r.value=mapState.period==='all'?mapState.months.length:mapState.months.indexOf(mapState.period);
  renderMapCards(); renderMapDetail();
}
function renderMapCards(){
  const el=$('#mvCards'); if(!el) return; const places=mapState.places||[]; const max=Math.max(1e-9,...places.map(p=>p.total));
  el.innerHTML=(!P().geo?`<button class="mv-card geo" data-act="geoOn"><span class="mc-ic">📍</span><b>Pin where you spend</b><small>Turn on location for new expenses</small></button>`:'')+
    (places.length?places.map((p,i)=>`<button class="mv-card${p.key===mapState.sel?' on':''}" data-act="mapPick" data-v="${esc(p.key)}" style="--c:${p.color}">
      <span class="mc-top"><span class="mc-rank">${i+1}</span><span class="mc-dot"></span></span><b data-notr>${esc(geoName(p.name))}</b><span class="mc-amt">${money(p.total)}</span>
      <span class="mc-bar"><i style="width:${Math.max(6,p.total/max*100)}%"></i></span><small>${p.count} purchase${p.count===1?'':'s'}</small></button>`).join('')
    :`<div class="mv-card empty"><b>No spending</b><small>Nothing in this period</small></div>`);
  const on=el.querySelector('.mv-card.on'); if(on) on.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});
}
function renderMapDetail(){
  const el=$('#mvDetail'); if(!el) return; const p=(mapState.places||[]).find(x=>x.key===mapState.sel);
  if(!p){ el.hidden=true; el.innerHTML=''; return; }
  const all=mapPlaces('all').find(x=>x.key===p.key)||p; const byM={}; for(const t of all.tx){ const k=t.date.slice(0,7); byM[k]=(byM[k]||0)+myShare(t); }
  const ms=mapState.months.slice(-12); const mx=Math.max(1e-9,...ms.map(k=>byM[k]||0));
  el.hidden=false;
  const orig={}; for(const t of p.tx) if(t.fx) orig[t.fx.cur]=(orig[t.fx.cur]||0)+t.fx.orig; const oc=Object.entries(orig).sort((a,b)=>b[1]-a[1])[0];
  el.innerHTML=`<div class="mvd-h"><span class="mvd-dot" style="background:${p.color}"></span><div><b data-notr>${p.flag?p.flag+' ':''}${esc(geoName(p.name))}</b><small>${p.count} purchase${p.count===1?'':'s'} · ${cat(p.topCat).icon||''} ${esc(cat(p.topCat).name)}${oc?` · <span data-notr>${curFmt(oc[1],oc[0])}</span>`:''}</small></div><b class="mvd-amt">${money(p.total)}</b><button class="mv-x sm" data-act="mapBack" aria-label="Close">×</button></div>
    <div class="mv-months">${ms.map(k=>`<button class="mv-m${k===mapState.period?' on':''}" data-act="mapMonth" data-v="${k}"><i style="height:${Math.max(3,(byM[k]||0)/mx*40)}px;background:${byM[k]?p.color:'rgba(255,255,255,.15)'}"></i><span>${monS(+k.slice(5)-1)}</span></button>`).join('')}</div>
    <div class="mvd-list">${p.tx.slice(0,6).map(t=>`<button class="mvd-row" data-act="edit" data-v="${esc(t.id)}"><span>${cat(t.catId).icon||'•'}</span><span class="mvd-n"><b>${esc(t.note||t.item||cat(t.catId).name)}</b><small>${fmtD(t.date,{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</small></span><b>${money(myShare(t))}</b></button>`).join('')}</div>
    ${p.tx.length>6?`<p class="mvd-more">+${p.tx.length-6} more</p>`:''}`;
  trTree(el);
}
function stopPlay(){ mapState.playing=false; clearInterval(mapState.timer); const b=$('.mv-play'); if(b) b.textContent='▶'; }
function togglePlay(){ if(mapState.playing) return stopPlay(); const ms=mapState.months; if(!ms.length) return;
  mapState.playing=true; $('.mv-play').textContent='❚❚'; mapState.sel=null; let i=mapState.period==='all'||ms.indexOf(mapState.period)>=ms.length-1?0:ms.indexOf(mapState.period)+1;
  const step=()=>{ mapState.period=ms[i]; updateMap(); i++; if(i>=ms.length){ clearInterval(mapState.timer); setTimeout(()=>{ if(mapState.playing){ stopPlay(); mapState.period='all'; updateMap(); } },1800); } };
  step(); mapState.timer=setInterval(step,1700); }
// Home card: a turning night Earth (pure CSS) with the places you spent in
function mapCardHTML(){
  if(!allTx().some(t=>t.type==='expense')) return '';
  const pl=mapPlaces('all'); const far=pl.filter(p=>p.key!==homeCity().name);
  return `<h3 class="stitle">Your spending world</h3><button class="panel mapcard" data-act="openMap">
    <span class="cssglobe" aria-hidden="true"><span class="cg-shade"></span></span>
    <span class="mc-t"><b>${pl.length} place${pl.length===1?'':'s'}</b><small>${far.length?`${far.length} outside ${esc(geoName(homeCity().name))}`:'Tap to explore'}</small>
      <span class="mc-chips">${pl.slice(0,3).map(p=>`<span style="--c:${p.color}" data-notr>${esc(geoName(p.name))}</span>`).join('')}</span><span class="mc-go">Open map ›</span></span></button>`;
}
function mountMiniGlobe(){}
// remember where an expense was added (only when the user turned it on)
function pinLocation(id){
  if(!P().geo||!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(pos=>{ const t=allTx().find(x=>x.id===id); if(!t) return;
    t.loc={lat:round(pos.coords.latitude,3),lng:round(pos.coords.longitude,3)}; persistMonth(t.date.slice(0,7)); },()=>{}, {enableHighAccuracy:false,timeout:8000,maximumAge:300000});
}
function turnOnGeo(){
  if(!navigator.geolocation) return toast('Location isn’t available on this device');
  navigator.geolocation.getCurrentPosition(()=>{ P().geo=true; persist('profile'); toast('New expenses will be pinned where you are'); renderMapCards(); if(state.ui.tab==='settings') render(false); },
    ()=>toast('Location is off for Masroof — allow it in iPhone Settings › Privacy › Location Services',{bad:true}),{timeout:10000});
}
/* ================= PDF monthly report =================
   Each A4 page is drawn on a canvas (so Arabic names and emoji render with the phone's own
   fonts), saved as a JPEG and wrapped in a small hand-built PDF. Works offline, no libraries. */
function pdfFromJpegs(pages){
  const enc=new TextEncoder(); const parts=[]; let len=0; const off=[];
  const push=x=>{ const b=typeof x==='string'?enc.encode(x):x; parts.push(b); len+=b.length; };
  const obj=(id,body,stream)=>{ off[id]=len; push(`${id} 0 obj\n`); push(body); if(stream){ push('\nstream\n'); push(stream); push('\nendstream'); } push('\nendobj\n'); };
  push('%PDF-1.4\n'); push(new Uint8Array([37,226,227,207,211,10]));
  const n=pages.length; const PW=595.28, PH=841.89;
  obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
  obj(2,`<< /Type /Pages /Kids [${pages.map((_,i)=>`${3+3*i} 0 R`).join(' ')}] /Count ${n} >>`);
  pages.forEach((p,i)=>{ const pid=3+3*i, iid=4+3*i, cid=5+3*i; const content=`q ${PW} 0 0 ${PH} 0 0 cm /Im${i} Do Q`;
    obj(pid,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im${i} ${iid} 0 R >> >> /Contents ${cid} 0 R >>`);
    obj(iid,`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>`,p.bytes);
    obj(cid,`<< /Length ${content.length} >>`,content); });
  const count=2+3*n; const xref=len;
  push(`xref\n0 ${count+1}\n0000000000 65535 f \n`); for(let i=1;i<=count;i++) push(String(off[i]).padStart(10,'0')+' 00000 n \n');
  push(`trailer\n<< /Size ${count+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out=new Uint8Array(len); let o=0; for(const b of parts){ out.set(b,o); o+=b.length; } return out;
}
async function makeReport(month){
  const PW=1240, PH=1754, M=80; const INK='#0B1728', MUT='#687589', LINE='#E3E8EF', BRAND='#0A7C72', SPEND='#DC3F45', EARN='#12915A';
  const FONT='-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,"Noto Sans Arabic","Geeza Pro",Arial,sans-serif';
  const mv=v=>money(v,{show:true}); const C=cur();
  const [a,b]=periodRange('month',`${month}-${pad(mStart())}`); const label=periodLabel('month',a);
  const [pa,pb]=periodRange('month',shiftAnchor('month',a,-1));
  const list=txBetween(a,b), s=summarize(list), ps=summarize(txBetween(pa,pb));
  const logo=await new Promise(r=>{const i=new Image(); i.onload=()=>r(i); i.onerror=()=>r(null); i.src=LOGO_MARK;});
  const pages=[]; let pg,x;
  const newPage=()=>{ pg=document.createElement('canvas'); pg.width=PW; pg.height=PH; x=pg.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,PW,PH); pages.push(pg); };
  const fit=(t,w)=>{ t=String(t??''); if(x.measureText(t).width<=w) return t; while(t.length>1&&x.measureText(t+'…').width>w) t=t.slice(0,-1); return t+'…'; };
  const T=(t,X,Y,o={})=>{ t=tr(String(t??'')); x.font=`${o.w||500} ${o.s||24}px ${FONT}`; x.fillStyle=o.c||INK; x.textAlign=o.a||'left'; x.fillText(o.max?fit(t,o.max):t,X,Y); };
  const box=(X,Y,w,h,r,fill)=>{ x.beginPath(); if(x.roundRect) x.roundRect(X,Y,w,h,r); else x.rect(X,Y,w,h); x.fillStyle=fill; x.fill(); };
  const title=(t,Y)=>{ T(t,M,Y,{w:800,s:32}); };
  const footer=()=>{ T(`Masroof · ${label}`,M,PH-46,{s:18,c:MUT}); T(`Page ${pages.length}`,PW-M,PH-46,{s:18,c:MUT,a:'right'}); };
  // ---- page 1: summary
  newPage();
  const g=x.createLinearGradient(0,0,PW,320); g.addColorStop(0,'#071A33'); g.addColorStop(.6,'#0E3A5C'); g.addColorStop(1,'#0E6B66'); x.fillStyle=g; x.fillRect(0,0,PW,320);
  if(logo){ x.save(); box(M,64,96,96,24,'#fff'); x.clip(); x.drawImage(logo,M,64,96,96); x.restore(); }
  T('Masroof',M+124,108,{w:800,s:40,c:'#fff'}); T('Monthly report',M+124,146,{s:24,c:'rgba(255,255,255,.75)'});
  T(label,M,250,{w:800,s:54,c:'#fff'}); T(`${C} · made ${fmtD(todayStr(),{day:'numeric',month:'short',year:'numeric'})}`,PW-M,250,{s:22,c:'rgba(255,255,255,.75)',a:'right'});
  const left=s.income-s.spent-s.saved-s.invested; const pct=ps.spent>0?Math.round((s.spent-ps.spent)/ps.spent*100):null;
  const tiles=[['Spent',s.spent,SPEND,pct==null?'':`${pct>0?'▲':'▼'} ${Math.abs(pct)}% vs previous`],['Income',s.income,EARN,''],['Saved & invested',s.saved+s.invested,'#2F6FEB',s.income>0?`${Math.round((s.saved+s.invested)/s.income*100)}% of income`:''],['Left',left,left<0?SPEND:INK,'']];
  const tw=(PW-2*M-3*20)/4;
  tiles.forEach(([l,v,c,sub],i)=>{ const X=M+i*(tw+20); box(X,350,tw,150,22,'#F3F5F8'); T(l,X+22,392,{s:21,c:MUT,w:600}); T((v<0?'−':'')+mv(Math.abs(v)),X+22,448,{w:800,s:36,c,max:tw-44}); if(sub) T(sub,X+22,482,{s:18,c:MUT,max:tw-44}); });
  // where it went
  title('Where it went',570);
  const cats=Object.entries(s.byCat).sort((p,q)=>q[1].total-p[1].total); const top=cats.slice(0,8); const maxC=Math.max(1e-9,...top.map(c=>c[1].total));
  let y=610;
  if(!top.length) { T('No spending recorded.',M,y+30,{c:MUT}); y+=60; }
  for(const [id,v] of top){ const c=cat(id); const bud=budgetFor(id,a);
    T(`${c.icon||''} ${c.name}`,M,y+30,{w:600,s:24,max:300});
    box(M+320,y+12,560,22,11,'#EEF1F5'); box(M+320,y+12,Math.max(6,560*v.total/maxC),22,11,c.color);
    if(bud>0){ const bx=M+320+Math.min(560,560*bud/maxC); x.fillStyle=v.total>bud?SPEND:INK; x.fillRect(bx-1.5,y+4,3,38); }
    T(mv(v.total),PW-M-90,y+31,{w:700,s:24,a:'right'}); T(`${Math.round(v.total/(s.spent||1)*100)}%`,PW-M,y+31,{s:20,c:MUT,a:'right'});
    y+=56; }
  if(cats.length>8) { T(`+ ${cats.length-8} more categories · ${mv(sum(cats.slice(8),c=>c[1].total))}`,M,y+20,{s:20,c:MUT}); y+=40; }
  if(Object.keys(P().budgets).some(id=>P().budgets[id]>0)) { T('│ marks your budget',M+320,y+18,{s:18,c:MUT}); y+=34; }
  // day by day
  y+=30; title('Day by day',y); y+=24;
  const days=[]; for(let d=pd(a);ymd(d)<=b;d=addDays(d,1)) days.push(ymd(d));
  const maxD=Math.max(1e-9,...days.map(d=>s.byDate[d]||0)); const cw=(PW-2*M)/days.length; const chH=190;
  x.strokeStyle=LINE; x.lineWidth=2; x.beginPath(); x.moveTo(M,y+chH); x.lineTo(PW-M,y+chH); x.stroke();
  days.forEach((d,i)=>{ const v=s.byDate[d]||0; const h=v?Math.max(4,chH*v/maxD):0; if(h) box(M+i*cw+cw*.18,y+chH-h,cw*.64,h,Math.min(8,cw*.3),v===maxD?SPEND:BRAND);
    if(i===0||i===days.length-1||i%7===0) T(String(pd(d).getDate()),M+i*cw+cw/2,y+chH+30,{s:18,c:MUT,a:'center'}); });
  const busiest=days.reduce((m,d)=>(s.byDate[d]||0)>(s.byDate[m]||0)?d:m,days[0]);
  if(s.byDate[busiest]) T(`Busiest: ${fmtD(busiest,{weekday:'long',day:'numeric',month:'short'})} · ${mv(s.byDate[busiest])}`,PW-M,y-2,{s:19,c:MUT,a:'right'});
  y+=chH+70;
  // top places + accounts
  const colW=(PW-2*M-40)/2;
  title('Top places',y); T('Accounts at month end',M+colW+40,y,{w:800,s:32});
  const mer=Object.values(s.byMerchant).sort((p,q)=>q.total-p.total).slice(0,Math.max(1,Math.floor((PH-110-(y+44))/40)));
  let yy=y+44; for(const m of mer){ T(m.name,M,yy,{s:22,max:colW-190}); T(`${m.count}×`,M+colW-150,yy,{s:19,c:MUT,a:'right'}); T(mv(m.total),M+colW,yy,{w:700,s:22,a:'right'}); yy+=40; }
  if(!mer.length) T('—',M,yy,{c:MUT});
  const bal=balances(); const after=allTx().filter(t=>t.date>b); yy=y+44;
  for(const ac of P().accounts.slice(0,Math.max(1,Math.floor((PH-110-(y+44))/40)))){ const v=(bal[ac.id]||0)-sum(after,t=>acctEffect(t,ac.id)); box(M+colW+40,yy-18,14,14,4,accColor(ac)); T(ac.name,M+colW+64,yy,{s:22,max:colW-230}); T((v<0?'−':'')+mv(Math.abs(v)),PW-M,yy,{w:700,s:22,a:'right',c:v<0?SPEND:INK}); yy+=40; }
  footer();
  // ---- transaction pages
  const rows=list.slice().sort((p,q)=>p.date===q.date?(p.ts||0)-(q.ts||0):(p.date<q.date?-1:1));
  const cols=[M,M+120,M+520,M+760];
  const rowText=t=>{ if(t.type==='transfer') return [`${acctName(t.accountId)} → ${acctName(t.toAccountId)}`,'Transfer','',mv(t.amount),'#2F6FEB'];
    if(t.type==='debt'){ const k=DEBT_KIND[t.debtKind]||['',t.dir==='give'?'Lent to':'Borrowed from']; return [`${k[1].replace(':','')} ${personName(t.personId)}`,'Friends',acctName(t.accountId),(t.dir==='give'?'−':'+')+mv(t.amount),'#B7791F']; }
    if(t.type==='invest') return [`${t.dir==='sell'?'Sold':'Invested in'} ${(holding(t.investmentId)||{}).name||'investment'}`,'Investments',acctName(t.accountId),(t.dir==='sell'?'+':'−')+mv(t.amount),'#7353F0'];
    const c=cat(t.catId); const inc=t.type==='income'||t.refund; const amt=t.type==='expense'&&t.split?myShare(t):t.amount;
    return [(t.note||t.item||c.name)+(t.split?' (split)':'')+(t.refund?' (refund)':''),c.name,t.split&&t.split.paidBy!=='me'?'paid by '+personName(t.split.paidBy):acctName(t.accountId),(inc?'+':'−')+mv(amt),inc?EARN:INK]; };
  let i=0;
  while(i<rows.length){ newPage(); title(i?'Transactions (continued)':`Transactions · ${rows.length}`,M+40); y=M+100;
    x.fillStyle=MUT; ['Date','Description','Category','Account'].forEach((h,k)=>T(h,cols[k],y,{w:700,s:19,c:MUT})); T('Amount',PW-M,y,{w:700,s:19,c:MUT,a:'right'}); y+=16;
    x.fillStyle=LINE; x.fillRect(M,y,PW-2*M,2); y+=10;
    while(i<rows.length&&y<PH-120){ const [d,c,ac,amt,col]=rowText(rows[i]); if(i%2) box(M-10,y,PW-2*M+20,44,10,'#F6F8FA');
      T(fmtD(rows[i].date,{day:'numeric',month:'short'}),cols[0],y+30,{s:20,c:MUT}); T(d,cols[1],y+30,{s:21,max:380}); T(c,cols[2],y+30,{s:19,c:MUT,max:220}); T(ac,cols[3],y+30,{s:19,c:MUT,max:170}); T(amt,PW-M,y+30,{w:700,s:21,a:'right',c:col});
      y+=46; i++; }
    footer(); }
  const jpegs=[]; for(const c of pages){ const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.9)); jpegs.push({bytes:new Uint8Array(await blob.arrayBuffer()),w:PW,h:PH}); }
  return {pdf:pdfFromJpegs(jpegs),label,pages:pages.length};
}
function openExport(){
  const u=state.ui; const months=[]; for(let i=0;i<12;i++){ const d=new Date(new Date().getFullYear(),new Date().getMonth()-i,1); months.push(`${d.getFullYear()}-${pad(d.getMonth()+1)}`); }
  const sel=u.tab==='tx'&&months.includes(u.txMonth)?u.txMonth:months[0];
  dlg('Reports & export',`<div class="field"><label for="repMonth">Month</label><select class="sel" id="repMonth">${months.map(m=>`<option value="${m}"${m===sel?' selected':''}>${esc(periodLabel('month',`${m}-${pad(mStart())}`))}</option>`).join('')}</select></div>
    <button class="btn primary wide" data-act="makePdf">📄 Monthly report (PDF)</button>
    <p class="hint">Summary, categories against budgets, day-by-day chart, top places, account balances and every transaction. Good for keeping records or sharing with family.</p>
    <button class="btn wide" data-act="exportCsv" style="margin-top:6px">📊 All transactions (CSV)</button>
    <p class="hint">For Excel or Numbers. Not encrypted.</p>`,`<span class="spacer"></span><button class="btn" data-act="close">Close</button>`);
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
  if(!P().goals.some(g=>g.demo)) P().goals.push({id:'g_demo',kind:'emergency',name:'Emergency fund',note:'Six months of essentials',target:3000,accountId:save||'',count:'balance',date:ymd(new Date(new Date().getFullYear()+1,5,1)),plan:{amount:150,freq:'monthly',start:todayStr(),source:'account',fromId:(P().accounts.find(a=>hasRole(a,'salary'))||{}).id||''},demo:true});
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
  // a few trips so the spending map has somewhere to go
  const trip=(daysAgo,city,lat,lng,fxCur,rate,items)=>items.forEach(([note,catId,item,orig],i)=>{ const amount=round(orig*rate,dp);
    push({type:'expense',amount,date:ymd(addDays(end,-daysAgo+Math.floor(i/2))),accountId:card,catId,item,note:`${note} · ${city}`,loc:{lat:round(lat+(Math.random()-.5)*.04,3),lng:round(lng+(Math.random()-.5)*.04,3)},...(fxCur?{fx:{cur:fxCur,orig,rate}}:{})}); });
  trip(58,'Dubai',25.197,55.279,'AED',0.1048,[['Dubai Mall','shopping','Clothes',640],['Atlantis Aquaventure','fun','Outings',350],['Hotel','travel','Hotels',900],['Shake Shack','food','Burger',85]]);
  trip(33,'Salalah',17.019,54.089,null,1,[['Hamdan Plaza Hotel','travel','Hotels',38],['Coconut stand','food','Juice & drinks',2.5],['Al Haffa Souq','shopping','Perfume',14],['Khareef camp','fun','Outings',12]]);
  trip(15,'Nizwa',22.933,57.531,null,1,[['Nizwa Souq','shopping','Accessories',9.5],['Shuwa lunch','food','Rice & biryani',6]]);
  trip(96,'Istanbul',41.008,28.978,'TRY',0.0112,[['Grand Bazaar','shopping','Accessories',4200],['Hotel','travel','Hotels',9800],['Bosphorus cruise','fun','Outings',1500],['Turkish breakfast','food','Restaurant',900]]);
  trip(75,'Sohar',24.347,56.709,null,1,[['Lulu Sohar','groceries','',21],['Oman Oil Sohar','transport','Fuel',8]]);
  push({type:'debt',amount:50,date:ymd(addDays(end,-18)),accountId:cash,personId:khalid.id,debtKind:'lent',dir:'give',note:'Car repair',due:ymd(addDays(end,4))});
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
  if(!(q.amount>0)||!q.guess){ openTx(null,{type:q.type,amount:q.amount?String(q.amount):'',note:q.desc,accountId:q.accountId,tags:q.tags.join(', '),catId:q.guess?q.guess.catId:null,item:q.guess?q.guess.item:'',manual:false,
    ...(q.fx?{fx:{on:true,cur:q.fx.cur,orig:String(q.fx.orig),rate:String(q.fx.rate),auto:true}}:{})}); return; }
  saveQuick({label:q.desc,amount:q.amount,catId:q.guess.catId,item:q.guess.item,accountId:q.accountId,tags:q.tags,type:q.type,fx:q.fx});
}
function saveQuick(c){
  const pre=alertSnapshot();
  const tx={id:newId(),type:c.type||'expense',amount:round(c.amount,dec()),date:todayStr(),accountId:acct(c.accountId)?c.accountId:defaultAcct(),catId:c.catId,item:c.item||'',note:c.label||'',ts:Date.now()};
  if(c.tags&&c.tags.length) tx.tags=c.tags;
  if(c.fx){ tx.fx={...c.fx}; P().lastFx=c.fx.cur; }
  const k=tx.date.slice(0,7);(state.months[k]||(state.months[k]=[])).push(tx);persistMonth(k);
  if(tx.note){learn(tx.note,tx.catId,tx.item);persist('profile');}
  if(tx.type==='expense') pinLocation(tx.id);
  lastUndo=()=>{removeIds([tx.id]);render();};
  state.ui.drop=true; if($('#dlg').open&&$('#dlg .add4')) $('#dlg').close(); celebrate(); toast(`${tx.note||tx.item} · ${tx.fx?`\u2066${curFmt(tx.fx.orig,tx.fx.cur)} ≈ ${money(tx.amount)}\u2069`:money(tx.amount)} saved to ${cat(tx.catId).name}${tx.item?' › '+tx.item:''}`,{undo:lastUndo});
  render(false); checkAlerts(pre,tx);
}
const LOGO_MARK='./images/logo-mark.png';
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
/* credit card: statement, amount due, minimum and available credit */
const dayIn=(y,m,d)=>new Date(y,m,Math.min(d,new Date(y,m+1,0).getDate()));
function cardStatus(a){
  if(!a||a.type!=='card') return null; const b=balances()[a.id]||0; const owedNow=Math.max(0,-b);
  const out={owedNow,limit:+a.limit||0,avail:a.limit?+a.limit+b:null,util:a.limit?owedNow/a.limit:null};
  if(!a.stmtDay) return out;
  const t=pd(todayStr()); let st=dayIn(t.getFullYear(),t.getMonth(),a.stmtDay); if(st>t) st=dayIn(t.getFullYear(),t.getMonth()-1,a.stmtDay);
  const stS=ymd(st), after=allTx().filter(x=>x.date>stS);
  const balAtStmt=b-sum(after,x=>acctEffect(x,a.id)); const stmtOwed=round(Math.max(0,-balAtStmt),dec());
  const paid=sum(after,x=>Math.max(0,acctEffect(x,a.id))); const due=round(Math.max(0,stmtOwed-paid),dec());
  let dd=a.dueDay?dayIn(st.getFullYear(),st.getMonth(),a.dueDay):addDays(st,20); if(dd<=st) dd=dayIn(st.getFullYear(),st.getMonth()+1,a.dueDay||st.getDate());
  const minPct=+a.minPct||5; const minimum=round(Math.max(0,Math.min(due,stmtOwed*minPct/100-paid)),dec());
  const next=dayIn(st.getFullYear(),st.getMonth()+1,a.stmtDay);
  return {...out,stmt:stS,stmtOwed,paid:round(paid,dec()),due,minimum,dueDate:ymd(dd),nextStmt:ymd(next),late:due>0&&ymd(dd)<todayStr()};
}
function cardPanelHTML(a){
  const c=cardStatus(a); if(!c) return '';
  if(!a.stmtDay&&!a.limit) return `<button class="bankchk" data-act="editAcct" data-v="${esc(a.id)}"><span class="bk-i" style="background:var(--save)">i</span><span><b>Add your card’s details</b><br><span class="muted">Credit limit, statement day and due day — to see what to pay and when.</span></span></button>`;
  const bar=c.util!=null?`<div class="util"><i style="width:${Math.min(100,c.util*100)}%;background:${c.util>.8?'var(--spend)':c.util>.5?'var(--warn)':'var(--earn)'}"></i></div><div class="util-cap"><span>${Math.round(c.util*100)}% of limit used</span><span>${money(c.avail)} available</span></div>`:'';
  return `<div class="panel cardst"><div class="panel-h" style="margin-bottom:6px"><h2 style="font-size:16px">Card statement</h2>${c.stmt?`<span class="hint">closed ${shortD(c.stmt)} · next ${shortD(c.nextStmt)}</span>`:''}</div>
    ${c.stmt?`<div class="cs-due${c.late?' late':c.due>0?'':' paid'}"><div><small>${c.due>0?(c.late?'Overdue since':'Pay by'):'Statement'}</small><b>${c.due>0?fmtD(c.dueDate,{weekday:'short',day:'numeric',month:'short'}):c.stmtOwed>0?'Paid ✓':'Nothing owed'}</b></div>
      <div style="text-align:right"><small>${c.due>0?'Left to pay':'Statement balance'}</small><b>${money(c.due>0?c.due:c.stmtOwed)}</b></div></div>
      <div class="fc-rows" style="margin-top:8px">${[['Statement balance',money(c.stmtOwed)],['Paid since statement',money(c.paid)],['Minimum payment',money(c.minimum)],['Owed right now',money(c.owedNow)]].map(([l,v])=>`<div class="fc-r"><span>${l}</span><b>${v}</b></div>`).join('')}</div>`:''}
    ${bar}${c.due>0?`<button class="btn primary wide" data-act="cardPay" data-v="${esc(a.id)}" style="margin-top:12px">Pay ${money(c.due)} ${esc(cur())}</button>`:''}</div>`;
}
/* the balance your bank reported in its last SMS, next to Masroof's */
// how a transaction changes one account's balance
function acctEffect(t,id){ let d=0; const f=(aid,v)=>{ if(aid===id) d+=v; };
  if(t.type==='expense'){ if(paidByMe(t)) f(t.accountId,t.refund?t.amount:-t.amount); }
  else if(t.type==='income') f(t.accountId,t.amount);
  else if(t.type==='transfer'){ f(t.accountId,-t.amount); f(t.toAccountId,t.amount); }
  else if(t.type==='debt') f(t.accountId,t.dir==='give'?-t.amount:t.amount);
  else if(t.type==='invest') f(t.accountId,t.dir==='sell'?t.amount:-t.amount);
  return d; }
// Masroof's balance for an account at the moment of the bank's last message
function balAtBank(a){ const bb=a.bankBal; return (balances()[a.id]||0)-sum(allTx().filter(t=>t.date>bb.date||(t.date===bb.date&&t.at&&bb.at&&t.at>bb.at)),t=>acctEffect(t,a.id)); }
// make an account's balance match the bank's last message; returns the change, or null if none was needed
function syncToBank(a){ if(!a.bankBal||a.bankBal.v==null) return null; const diff=round(a.bankBal.v-balAtBank(a),dec());
  a.anchor={date:a.bankBal.date,at:a.bankBal.at||null}; if(Math.abs(diff)<10**-dec()) return null; a.opening=round((+a.opening||0)+diff,dec()); return diff; }
function bankCheckHTML(a,now){
  if(!a.bankBal) return ''; const mine=balAtBank(a); // Masroof's balance when the bank last reported it
  const diff=round(a.bankBal.v-mine,dec()); const ok=Math.abs(diff)<10**-dec();
  return `<div class="bankchk${ok?' ok':''}"><span class="bk-i">${ok?'✓':'!'}</span><span><b>${ok?'Matches your bank':'Your bank says '+money(a.bankBal.v)}</b><br><span class="muted">${ok?`Bank balance ${money(a.bankBal.v)} on ${shortD(a.bankBal.date)}`:`On ${shortD(a.bankBal.date)} · Masroof shows ${money(mine)} (${money(-diff,{sign:true})})`}</span></span>${ok?'':`<button class="btn small primary" data-act="bankFix" data-v="${esc(a.id)}">Match</button>`}</div>`;
}
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
    ${cardPanelHTML(a)}${bankCheckHTML(a,b[id]||0)}
    ${hasRole(a,'savings')&&spentHere>0?`<p class="hint" style="color:var(--warn);font-weight:600">⚠️ ${money(spentHere)} was spent directly from this savings account this month.</p>`:''}
    <div class="chips"><button class="chip" data-act="accAdd" data-v="${esc(id)}">＋ Expense from here</button><button class="chip" data-act="accIncome" data-v="${esc(id)}">＋ Money in</button><button class="chip" data-act="accMove" data-v="${esc(id)}">↔ Move money</button><button class="chip" data-act="accShow" data-v="${esc(id)}">Show on Home</button></div>
    <div class="field"><span class="lab">Recent</span>${recent.length?`<div class="tx-group">${recent.map(txRow).join('')}</div>`:'<p class="hint">Nothing yet.</p>'}</div>`,
    `<span class="spacer"></span><button class="btn" data-act="editAcct" data-v="${esc(id)}">Edit card</button><button class="btn primary" data-act="close">Done</button>`);
}
/* add several accounts in one go */
const nextCardColor=(skip=[])=>{ const used=new Set([...P().accounts.map(a=>(a.color||'').toLowerCase()),...skip]); return (CARD_COLORS.find(([,c])=>!used.has(c.toLowerCase()))||CARD_COLORS[(P().accounts.length+skip.length)%CARD_COLORS.length])[1]; };
const blankBulk=()=>({type:'bank',bank:'',name:'',last4:'',opening:'',limit:'',stmtDay:'',dueDay:''});
const BULK_TYPES=[['bank','🏦','Bank account'],['card','💳','Credit card'],['savings','🐖','Savings'],['wallet','📱','E‑wallet'],['cash','💵','Cash']];
let bulkRows=null; // new accounts being typed, kept while you open an existing card to edit it
// "Accounts & cards": your existing cards (tap to edit) and a form to add new ones. Saving only ever adds.
function openBulk(){ if(!bulkRows) bulkRows=[blankBulk()]; fd={kind:'bulk',rows:bulkRows}; renderBulk(); }
function renderBulk(){
  const f=fd, list=P().accounts, bal=balances(); const body=$('#dlg .dlg-b'); const sc=body?body.scrollTop:0;
  const owedLbl=r=>r.type==='card'?'Amount you owe now':r.type==='cash'?'Cash you have now':'Balance now';
  dlg('Accounts & cards',`<div class="field"><span class="lab">Your accounts and cards (${list.length})</span>
      <div class="acc-list">${list.map(a=>{ const c=accColor(a); return `<button class="acc-mini" data-act="hubEdit" data-v="${esc(a.id)}"><span class="am-chip" style="background:${accGrad(c)}"></span>
        <span class="am-t"><b>${esc(a.name)}</b><small>${esc([a.bank,TYPE_LABEL[a.type]||a.type].filter(Boolean).join(' · '))}${a.last4?` · <span data-notr>•••• ${esc(a.last4)}</span>`:''}</small></span>
        <span class="am-bal">${money(bal[a.id]||0)}</span><span class="am-go">Edit ›</span></button>`; }).join('')||'<p class="hint">None yet.</p>'}</div>
      <p class="hint">Tap one to change or delete it. Adding new accounts below never changes these.</p></div>
    <div class="field"><span class="lab">Add new</span><div class="bulk">${f.rows.map((r,i)=>{ const ty=BULK_TYPES.find(x=>x[0]===r.type)||BULK_TYPES[0];
      return `<div class="bulk-card"><div class="bc-h"><span class="bulk-n" style="background:${accGrad(CARD_COLORS[(list.length+i)%CARD_COLORS.length][1])}">${ty[1]}</span><b>New ${ty[2].toLowerCase()}</b><span class="spacer"></span>${f.rows.length>1?`<button class="icon-btn" data-act="bulkDel" data-v="${i}" aria-label="Remove">×</button>`:''}</div>
        <div class="chips bc-types">${BULK_TYPES.map(([v,ic,l])=>`<button class="chip" data-act="bulkType" data-v="${i}:${v}" aria-pressed="${r.type===v}">${ic} ${l}</button>`).join('')}</div>
        <div class="two">${r.type!=='cash'?`<div class="field"><label>Bank</label><select class="sel" data-bulk="${i}.bank"><option value="">Choose…</option>${BANKS.filter(b=>b!=='Cash').map(b=>`<option${r.bank===b?' selected':''}>${esc(b)}</option>`).join('')}</select></div>`:''}
          <div class="field"><label>Name</label><input class="inp" data-bulk="${i}.name" value="${esc(r.name)}" placeholder="${r.type==='card'?'e.g. Visa Platinum':r.type==='savings'?'e.g. Savings':r.type==='cash'?'e.g. Wallet':'e.g. Salary account'}"></div></div>
        <div class="two">${r.type!=='cash'?`<div class="field"><label>${r.type==='card'?'Card':'Account'} last 4 digits</label><input class="inp" data-bulk="${i}.last4" value="${esc(r.last4)}" inputmode="numeric" maxlength="4" placeholder="e.g. 1234"></div>`:''}
          <div class="field"><label>${owedLbl(r)} (${esc(cur())})</label><input class="inp" data-bulk="${i}.opening" value="${esc(r.opening)}" inputmode="decimal" placeholder="0"></div></div>
        ${r.type==='card'?`<div class="three"><div class="field"><label>Credit limit</label><input class="inp" data-bulk="${i}.limit" value="${esc(r.limit)}" inputmode="decimal" placeholder="e.g. 1000"></div>
          <div class="field"><label>Statement day</label><select class="sel" data-bulk="${i}.stmtDay"><option value="">—</option>${Array.from({length:28},(_,d)=>d+1).map(d=>`<option${+r.stmtDay===d?' selected':''}>${d}</option>`).join('')}</select></div>
          <div class="field"><label>Due day</label><select class="sel" data-bulk="${i}.dueDay"><option value="">—</option>${Array.from({length:28},(_,d)=>d+1).map(d=>`<option${+r.dueDay===d?' selected':''}>${d}</option>`).join('')}</select></div></div>`:''}
      </div>`; }).join('')}</div>
    <button class="btn wide" data-act="bulkAdd" style="margin-top:10px">＋ Another account or card</button>
    <p class="hint">The last 4 digits let Masroof put bank SMS on the right account.</p></div>`,
    `<span class="spacer"></span><button class="btn" data-act="close">Close</button><button class="btn primary" data-act="bulkSave">Save new</button>`);
  const nb=$('#dlg .dlg-b'); if(nb) nb.scrollTop=sc;
}
function saveBulk(){
  const p=P(); const rows=fd.rows.filter(r=>r.bank||r.name.trim()||r.last4||num(r.opening)||r.limit);
  if(!rows.length) return fErr('Fill in a new account first — or tap Close.');
  const nums=rows.map(r=>String(r.last4||'').replace(/\D/g,'')).filter(Boolean);
  for(const n of nums){ if(nums.indexOf(n)!==nums.lastIndexOf(n)) return fErr(`•••• ${n} is used twice.`); const a=acctForNum(n); if(a) return fErr(`•••• ${n} already belongs to ${a.name}.`); }
  const colors=[]; let salary=p.accounts.some(a=>hasRole(a,'salary'));
  for(const r of rows){ const color=nextCardColor(colors); colors.push(color.toLowerCase());
    const roles=r.type==='savings'?['savings']:r.type==='card'||r.type==='cash'?['spending']:!salary?(salary=true,['salary','spending']):['spending'];
    const label=(BULK_TYPES.find(x=>x[0]===r.type)||[,,'Account'])[2];
    const name=r.name.trim()||(r.bank?r.bank+(r.type==='card'?' card':r.type==='savings'?' savings':''):label);
    const opening=round(r.type==='card'?-Math.abs(num(r.opening)):num(r.opening),dec());
    const a={id:'a_'+newId(),name,bank:r.type==='cash'?'':r.bank||'',type:r.type,opening,color,roles,last4:String(r.last4||'').replace(/\D/g,'').slice(-4),smsIds:[],anchor:{date:todayStr(),at:Date.now()}};
    if(r.type==='card'){ a.limit=round(num(r.limit),dec())||null; a.stmtDay=+r.stmtDay||null; a.dueDay=+r.dueDay||null; }
    p.accounts.push(a); }
  bulkRows=null; persist('profile'); $('#dlg').close(); celebrate(); toast(`${rows.length} account${rows.length>1?'s':''} added — you now have ${p.accounts.length}`); render();
}
/* account editor with live preview */
function openAcct(id){
  const a=id?acct(id):null;
  const nowBal=a?round(balances()[a.id]||0,dec()):0;
  fd=a?{kind:'acct',...clone(a),current:String(a.type==='card'?round(-nowBal,dec()):nowBal),roles:(a.roles||[]).slice(),color:accColor(a),smsIds:(a.smsIds||[]).join(', ')}:{kind:'acct',id:null,name:'',bank:'',type:'bank',current:'',roles:['spending'],color:nextCardColor(),last4:'',smsIds:''};
  renderAcctEditor(!!a);
}
const previewBal=f=>f.type==='card'?-num(f.current):num(f.current);
/* ================= v10: living details ================= */
/* rolling odometer numbers */
function odoHTML(v,from){
  if(P().hide) return `<span class="odo hidden-amt">•••</span>`;
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
  const place=()=>{ const r=b.getBoundingClientRect(), br=bar.getBoundingClientRect(); if(!r.width) return; ind.style.opacity='1'; ind.style.width=r.width-12+'px'; ind.style.transform=`translateX(${r.left-br.left-bar.clientLeft+6}px)`; };
  place(); requestAnimationFrame(place); // again after layout settles
}
if(window.ResizeObserver) new ResizeObserver(()=>moveTabIndicator()).observe($('#tabs'));
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
  const B=Object.keys(P().budgets).filter(id=>P().budgets[id]>0&&findCat(id)).map(id=>[id,budgetFor(id,u.anchor)]); if(!B.length) return '';
  const R=26,C=2*Math.PI*R;
  return `<h3 class="stitle">Budgets</h3><div class="rings">${B.map(([id,bud])=>{const c=cat(id); const sp=(s.byCat[id]||{}).total||0; const r=bud>0?sp/bud:(sp>0?2:0); const col=r>1?'var(--spend)':r>.85?'var(--warn)':c.color;
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
      return `<button class="wk-col${i===6?' today':''}" data-act="wkBar" data-i="${i}"><span class="wk-stack" style="height:${Math.max(p.spent>0?6:2,p.spent/max*100)}%">${cats.map(([id,v])=>`<i style="flex:${v.total};background:${cat(id).color}"></i>`).join('')}</span><span class="wk-d">${dowS(pd(days[i]).getDay(),1)}</span></button>`}).join('')}</div></section>`;
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
  const acts=[['add',ICON.plus,'Add',''],['billNew','🧾','Bill',''],['add',ICON.swap,'Move','transfer'],['add',ICON.users,'Split','split'],['import',ICON.inbox,'SMS','']];
  return `<div class="qa">${acts.map(([a,i,l,p])=>`<button data-act="${a}"${p?` data-preset="${p}"`:''}><span>${i}</span>${l}</button>`).join('')}</div>`;
}
function heroSub(i,n){ const ids=accIds();
  return `<span class="hdots" aria-hidden="true">${ids.map((id,k)=>`<i class="${k===i?'on':''}"${id!=='all'&&acct(id)?` style="--dc:${accColor(acct(id))}"`:''}></i>`).join('')}</span><span class="ht-hint">${P().seenSwipe?'Tap the card to flip it':'Swipe the card to switch accounts'}</span>`; }
function magicHeroHTML(){ const first=!heroData._first; heroData._first=true;
  const id=acct(state.ui.acct)?state.ui.acct:'all'; state.ui.acct=id; const d=heroData(id);
  const n=accIds().length, i=accIds().indexOf(id);
  return `<section class="home-top" id="magic" style="--glow:${d.glow}">
    <div class="ht-head"><img class="brandmark" src="${LOGO_MARK}" alt="Masroof"><div><div class="psub">${fmtD(todayStr(),{weekday:'long',day:'numeric',month:'short'})}</div><div class="mg-greet">${greeting()}</div></div>
      <span class="hd-acts">${hideBtn()}<button class="round" data-act="tab" data-v="settings" aria-label="Settings">${ICON.gear}</button></span></div>
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
  const tb=e.target.closest('#tabs button[data-tab]'); if(tb){ buzz(5); go4(tb.dataset.tab); return; }
  const el=e.target.closest('[data-act]'); if(!el) return;
  const a=el.dataset.act,v=el.dataset.v,u=state.ui,p=P(),d=draft;
  switch(a){
    /* navigation & home */
    case 'tab': go4(v); break;
    case 'back': go4(u.back&&!PUSH4.includes(u.back)?u.back:'home'); break;
    case 'rowDup': closeRow(); if(fd&&fd.kind==='txview'&&$('#dlg').open) $('#dlg').close(); duplicateTx(v); break;
    case 'rowNoop': break;
    case 'txCal': u.txCal=!u.txCal; u.txDay=null; if(u.txCal&&(!u.txM||u.txM==='all')) u.txM=u.txMonth=todayStr().slice(0,7); buzz(5); { const y=window.scrollY; render(); window.scrollTo(0,y); } break;
    case 'txF': u.txF=v; u.txN=60; buzz(5); document.querySelectorAll('.a4-f .w-chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v)); renderTxList(); break;
    case 'txAdv': u.txAdv=!u.txAdv; { const y=window.scrollY; render(); window.scrollTo(0,y); } break;
    case 'txClear': Object.assign(u,{txType:'all',txCat:'all',acct:'all',txM:'all',txCal:false,txDay:null,txF:'all',txQ:''}); { const y=window.scrollY; render(); window.scrollTo(0,y); } break;
    case 'txMore4': u.txN=(u.txN||60)+60; renderTxList(); break;
    case 'txDay': u.txDay=u.txDay===v?null:v; buzz(5); renderTxList(); break;
    case 'toggleHide': p.hide=!p.hide; persist('profile'); buzz(8); { const y=window.scrollY; render(false); window.scrollTo(0,y); } break;
    case 'wkBar': wkTap(el.dataset.i); break;
    case 'mgPrev': switchAccount(-1); break;
    case 'flipCard': { const c=$('#bcard'); if(c) c.classList.toggle('flipped'); break; }
    case 'mgNext': switchAccount(1); break;
    case 'dAcct': d[el.dataset.field]=v; buzz(5); renderTxDlg(); break;
    case 'dDate': d.date=v; renderTxDlg(); break;
    case 'dMore': d._more=!d._more; renderTxDlg(); if(d._more) setTimeout(()=>{const m=$('.more-body'); if(m) m.scrollIntoView({block:'nearest',behavior:'smooth'});},30); break;
    case 'allCats': u.allCats=!u.allCats; render(false); break;
    case 'pickMonth': u.txM=v; if(v!=='all') u.txMonth=v; u.txDay=null; u.txN=60; { const y=window.scrollY; render(); window.scrollTo(0,y); } break;
    case 'pRemindQuick': { closeRow(); const x=person(v); const bal=peopleBalances()[v]||0; if(bal<=0) return toast(`${x.name} doesn’t owe you anything`); const ok=await copyText(`Hi ${x.name}, just a friendly reminder: you owe me ${cur()} ${money(bal,{show:true})}. Thanks!`); toast(ok?'Reminder copied — paste it in WhatsApp':'Couldn’t copy'); break; }
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
    case 'seeTx': u.tab='tx'; u.back=null; u.txCat=v; u.txType='all'; u.txQ=''; u.txF='all'; u.txAdv=true; u.txMonth=u.txM=(u.period==='month'?u.anchor:todayStr()).slice(0,7); render(); window.scrollTo(0,0); break;
    case 'tagSearch': u.tab='tx'; u.txQ='#'+v; u.txCat='all'; u.txType='all'; render(); window.scrollTo(0,0); break;
    case 'txMonth': {u.txDay=null; const [y,m]=u.txMonth.split('-').map(Number);const dd=new Date(y,m-1+(+v),1);u.txMonth=`${dd.getFullYear()}-${pad(dd.getMonth()+1)}`;render();break;}
    case 'quickAdd': { const i=$('#quickIn'); quickAddText(i.value); i.value=''; break; }
    case 'quickChip': saveQuick(quickSuggestions()[+el.dataset.i]); break;
    case 'setQuickLimit': { const val=num(($('#quickLimit')||{}).value); if(!(val>0)) return toast('Enter an amount above zero'); p.limits.mode='fixed'; p.limits.daily=round(val,dec()); persist('profile'); render(); toast('Daily limit set'); break; }
    case 'goLimits': if(p.limits.mode==='off'){p.limits.mode='smart'; if(!p.limits.monthly) p.limits.monthly=suggestMonthly(); persist('profile');} go4('settings'); openSetPanel('limits'); break;
    case 'billNew': openTx(null,{_billOpen:true}); break;
    case 'view': openTxView(v); break;
    case 'billOpen': if(draft){ draft._billOpen=true; draft._billMsg=''; renderTxDlg(); } break;
    case 'billClose': if(draft){ draft._billOpen=false; renderTxDlg(); } break;
    case 'billPrompt': { const ok=await copyText(billPrompt()); toast(ok?'Copied — paste it in Claude with a photo of the bill':'Couldn’t copy',{bad:!ok}); if(ok&&draft&&draft._billOpen){ draft._billCopied=true; renderTxDlg(); } break; }
    case 'billPaste': try{ const t=await navigator.clipboard.readText(); if(draft&&t){ draft._billText=t; renderTxDlg(); } else toast('Nothing to paste'); }catch(e){ toast('Long-press the box and tap Paste'); } break;
    case 'billRead': if(draft) readBill(draft); break;
    case 'tvBill': { const id=fd&&fd.id; $('#dlg').innerHTML=''; openTx(id); if(draft){ draft._billOpen=true; renderTxDlg(); } break; }
    case 'tvEdit': $('#dlg').innerHTML=''; openTx(fd&&fd.id); break;
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
    case 'kp': { const f=kpTarget(d); if(!f) break; let x=String((f==='fx.orig'?d.fx.orig:d.amount)||''); const mx=f==='fx.orig'?3:dec();
      if(v==='⌫') x=x.slice(0,-1);
      else if(v==='.'){ if(mx&&!x.includes('.')) x=(x||'0')+'.'; }
      else { const fr=x.split('.')[1]; if(fr!=null&&fr.length>=mx) break; if(x==='0') x=v; else if(x.replace('.','').length<9) x+=v; }
      setPath(d,f,x); buzz(4); updateCalc(); break; }
    case 'dDelete': if(await ask('Delete this transaction?','Delete')){ const t=allTx().find(x=>x.id===d.id); removeIds([d.id]); $('#dlg').close(); toast('Deleted',{undo:()=>{const k=t.date.slice(0,7);(state.months[k]||(state.months[k]=[])).push(t);persistMonth(k);render();}}); render(); } break;
    case 'dCopy': { const t=allTx().find(x=>x.id===d.id); $('#dlg').close(); openTx(t.id); draft.id=null; draft.date=todayStr(); draft.auto=false; draft.recurringId=null; draft.receipt=t.receipt||null; renderTxDlg(); break; }
    case 'dPin': { p.quick.push({label:d.note||d.item||cat(d.catId).name,amount:num(d.amount),catId:d.catId,item:d.item,accountId:d.accountId}); persist('profile'); toast('Pinned to Quick add'); break; }
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
    case 'aSave': { const name=(fd.name||'').trim()||(fd.bank||'').trim(); if(!name) return fErr('Give the account a name or pick a bank.'); const curBal=round(fd.type==='card'?-num(fd.current):num(fd.current),dec());
      const last4=String(fd.last4||'').replace(/\D/g,'').slice(-4); const smsIds=[...new Set((String(fd.smsIds||'').match(/\d{3,}/g)||[]).map(x=>x.slice(-4)).filter(x=>x!==last4))];
      const clash=[last4,...smsIds].filter(Boolean).map(n=>({n,a:P().accounts.find(x=>x.id!==fd.id&&acctNums(x).includes(n))})).find(x=>x.a); if(clash) return fErr(`•••• ${clash.n} already belongs to ${clash.a.name}.`);
      // you give the balance today; the opening balance is worked back from your transactions
      const old=fd.id?acct(fd.id):null, nowBal=old?round(balances()[old.id]||0,dec()):0, changed=!old||Math.abs(curBal-nowBal)>=10**-dec();
      const opening=old?round((+old.opening||0)+curBal-nowBal,dec()):curBal;
      const data={name,bank:(fd.bank||'').trim(),type:fd.type,opening,color:fd.color,roles:fd.roles.slice(),last4,smsIds}; if(changed) data.anchor={date:todayStr(),at:Date.now()};
      if(fd.type==='card'){ data.limit=round(num(fd.limit),dec())||null; data.stmtDay=+fd.stmtDay||null; data.dueDay=+fd.dueDay||null; data.minPct=num(fd.minPct)||null; }
      if(fd.id){ const x=acct(fd.id); Object.assign(x,data); delete x.demoTheme; } else { const nid='a_'+newId(); p.accounts.push({id:nid,...data}); }
      { const back=fd.back, isNew=!fd.id; persist('profile'); toast(isNew?'Account added. Your others are unchanged.':'Saved'); render(); if(back==='hub') openBulk(); else { $('#dlg').close(); celebrate(); } } break; }
    case 'accColor': fd.color=v; fd._colorSet=true; renderAcctEditor(!!fd.id); break;
    case 'accRole': fd.roles=fd.roles.includes(v)?fd.roles.filter(r=>r!==v):[...fd.roles,v]; renderAcctEditor(!!fd.id); break;
    case 'accView': openAccountSheet(v); break;
    case 'accAdd': openTx(null,{accountId:v}); break;
    case 'accIncome': openTx(null,{type:'income',accountId:v}); break;
    case 'accMove': openTx(null,{type:'transfer',accountId:v,toAccountId:(p.accounts.find(x=>x.id!==v&&hasRole(x,'savings'))||p.accounts.find(x=>x.id!==v)||{}).id}); break;
    case 'accShow': $('#dlg').close(); u.acct=v; u.tab='home'; render(); window.scrollTo(0,0); break;
    case 'pickAcct': u.acct=v; buzz(6); { const y=window.scrollY; render(); window.scrollTo(0,y); } break;
    case 'aDelete': { if(p.accounts.length<2) return fErr('Keep at least one account.'); const used=allTx().some(t=>t.accountId===fd.id||t.toAccountId===fd.id);
      if(await ask(used?'This account has transactions. They stay in your history. Delete it?':'Delete this account?','Delete')){ p.accounts=p.accounts.filter(x=>x.id!==fd.id); if(u.acct===fd.id) u.acct='all'; const back=fd.back; persist('profile'); render(); if(back==='hub') openBulk(); else $('#dlg').close(); } break; }
    /* people */
    case 'addPerson': { const i=$('#newPerson'); if(addPerson(i.value)){ render(); } break; }
    case 'person': openPerson(v); break;
    case 'pSave': { const x=person(fd.id); if(x&&fd.name.trim()){x.name=fd.name.trim(); persist('profile'); toast('Saved'); render(); openPerson(fd.id);} break; }
    case 'pDelete': { const used=personTx(fd.id).length; if(await ask(used?'This person has shared history. Past entries stay but show as “Someone”. Delete?':'Delete this person?','Delete')){ p.people=p.people.filter(x=>x.id!==fd.id); persist('profile'); $('#dlg').close(); render(); } break; }
    case 'pSettle': { const bal=Math.abs(peopleBalances()[fd.id]||0); openTx(null,{type:'debt',personId:fd.id,debtKind:v==='in'?'repaid_in':'repaid_out',amount:String(round(bal,dec()))}); break; }
    case 'pLend': openTx(null,{type:'debt',personId:fd.id,debtKind:'lent'}); break;
    case 'pBorrow': openTx(null,{type:'debt',personId:fd.id,debtKind:'borrowed'}); break;
    case 'pSplit': openTx(null,{split:{on:true,paidBy:'me',who:['me',fd.id],mode:'equal',custom:{}}}); break;
    case 'pRemind': { const x=person(fd.id); const bal=peopleBalances()[fd.id]||0; const msg=`Hi ${x.name}, just a friendly reminder: you owe me ${cur()} ${money(bal,{show:true})}. Thanks!`;
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
    case 'goal': if(v) openGoal(v); else goalNewStart(); break;
    case 'goalNew': goalNewStart(); break;
    case 'gnSet': { const g=u.gn; if(!g) break; const i=v.indexOf(':'), k=v.slice(0,i), x=v.slice(i+1);
      if(k==='months') g.months=x==='custom'?'custom':+x; else if(k==='from'){ g.source='account'; g.fromId=x; } else if(k==='auto') g.auto=x==='1'; else g[k]=x;
      if(k==='freq') g.amtSet=false; if(k==='accountId'&&x&&g.fromId===x) g.fromId=(p.accounts.find(a=>a.id!==x)||{}).id||''; buzz(5);
      { const y=window.scrollY; render(); window.scrollTo(0,y); } break; }
    case 'gnBack': { const g=u.gn; if(g&&g.step>1){ g.step--; g.dir=-1; render(); window.scrollTo(0,0); } else { u.gn=null; go4(u.back||'wealth'); } break; }
    case 'gnNext': gnNext(); break;
    case 'accType': fd.type=v; if(v==='cash'){ fd.bank=''; fd._otherBank=false; } if(!fd.id&&!fd._colorSet) fd.color=TYPE_COLOR[v]||fd.color; renderAcctEditor(!!fd.id); break;
    case 'accBank': if(v==='__other'){ fd._otherBank=true; if(BANKS.includes(fd.bank)) fd.bank=''; } else { fd.bank=fd.bank===v?'':v; fd._otherBank=false; } renderAcctEditor(!!fd.id); break;
    case 'accMore': fd._more=!fd._more; renderAcctEditor(!!fd.id); break;
    case 'setPanel': openSetPanel(v); break;
    case 'setLang': if(v!==LANG){ secMeta.lang=v; saveSec(); const y=window.scrollY; setLang(v,true); window.scrollTo(0,y); } break;
    case 'setTheme': p.theme=v; secMeta.theme=v; saveSec(); applyTheme(); persist('profile'); render(false); break;
    case 'gSave': saveGoal(); break;
    case 'goalSet': { const k=v.slice(0,v.indexOf(':')), val=v.slice(v.indexOf(':')+1); fd[k]=val;
      if(k==='gkind'&&!fd.name.trim()) fd.name=goalKind({kind:val})[2];
      if(k==='accountId'&&val===fd.fromId) fd.fromId=(P().accounts.find(a=>a.id!==val)||{}).id||'';
      renderGoal(); break; }
    case 'gAdd': { const g=p.goals.find(x=>x.id===fd.id); const add=round(num(fd.add),dec()); if(!(add>0)) return fErr('Enter an amount.');
      const src=g.accountId?fd.addSrc:'hand';
      if(src==='hand'||!g.accountId||goalCount(g)==='hand'){ g.saved=round((+g.saved||0)+add,dec()); }
      else { const tx=goalDepositTx(g,add,src,fd.addFrom||fd.fromId); const k=tx.date.slice(0,7);(state.months[k]||(state.months[k]=[])).push(tx); persistMonth(k); }
      persist('profile'); celebrate(); toast(`${money(add)} added to ${g.name}`); render(); openGoal(g.id); break; }
    case 'gDelete': if(await ask('Delete this goal? Deposits already recorded stay in your history.','Delete')){ const g=p.goals.find(x=>x.id===fd.id); if(g&&g.recurringId) p.recurring=p.recurring.filter(r=>r.id!==g.recurringId); p.goals=p.goals.filter(x=>x.id!==fd.id); persist('profile'); $('#dlg').close(); render(); } break;
    /* import & data */
    case 'import': openImport(); break;
    case 'impLocal': { imp.text=($('[data-imptext]')||{}).value||imp.text; imp.src='paste'; const rows=localParse(imp.text);
      if(!rows.length){ imp.msg=imp.seen?'Those messages were brought in before.':'No amounts found. Messages need an amount with a currency, like "OMR 4.200".'; renderImport(); break; }
      $('#dlg').close(); queueSms(rows); break; }
    case 'smsYes': smsFly(true); break;
    case 'smsNo': smsFly(false); break;
    case 'smsSure': { const Q=p.smsQueue||[], rows=Q.filter(sureRow); if(!rows.length) break; p.smsQueue=Q.filter(r=>!rows.includes(r)); u.smsDone=(u.smsDone||0)+rows.length; if(!p.smsQueue.length) u.drop=true;
      addImported(rows.map(r=>({...r,on:true})),false,true,{keys:rows.map(r=>r.key),undo:()=>{ p.smsQueue=[...rows,...(p.smsQueue||[])]; u.smsDone=Math.max(0,u.smsDone-rows.length); p.smsSeen=(p.smsSeen||[]).filter(k=>!rows.some(r=>r.key===k)); persist('profile'); }}); break; }
    case 'smsType': smsEdit(r=>{ const was=r.type; r.unsure=false; r.refund=false;
      if(v==='tr'){ r.type='transfer'; if(!r.toAccountId||r.toAccountId===r.accountId) r.toAccountId=(p.accounts.find(a=>a.id!==r.accountId)||{}).id; }
      else { r.type=v==='in'?'income':'expense'; if(was!==r.type){ const g=guessCategory(r.merchant,r.type); r.catId=g?g.catId:(r.type==='income'?'inc_other':'other'); r.item=g&&g.item||''; } } }); break;
    case 'smsAcct': smsEdit(r=>{ r[el.dataset.field||'accountId']=v; if((el.dataset.field||'accountId')==='accountId'){ r.acctSure=true; r.how='you'; } }); break;
    case 'smsCat': smsEdit(r=>{ r.catId=v; r.item=''; }); u.smsAllCats=false; break;
    case 'smsAllCats': u.smsAllCats=true; { const sc=window.scrollY; render(); window.scrollTo(0,sc); } break;
    case 'smsFile': $('#smsFile').click(); break;
    case 'smsAuto': { const S=p.sms||(p.sms={}); S.auto=!S.auto; persist('profile'); render(false); toast(S.auto?'Bank messages you can trust will be added without asking':'You’ll check every imported message first'); break; }
    case 'smsGuide': openSmsGuide(); break;
    case 'reminders': openReminders(); break;
    case 'remMake': makeReminderFile(); break;
    case 'cardPay': { const c=cardStatus(acct(v)); const from=(p.accounts.find(a=>a.id!==v&&hasRole(a,'salary'))||p.accounts.find(a=>a.id!==v&&a.type==='bank')||p.accounts.find(a=>a.id!==v)||{}).id;
      openTx(null,{type:'transfer',accountId:from,toAccountId:v,amount:String(c?c.due:''),note:'Card payment'}); break; }
    case 'rollover': { if(p.rollover) delete p.rollover; else p.rollover={from:periodRange('month',todayStr())[0]}; persist('profile'); render(false); toast(p.rollover?'Unspent budget now carries into next month':'Budgets reset every month again'); break; }
    case 'acctBulk': openBulk(); break;
    case 'bulkAdd': fd.rows.push(blankBulk()); renderBulk(); { const nb=$('#dlg .dlg-b'); if(nb) nb.scrollTop=nb.scrollHeight; } break;
    case 'bulkType': { const [i,ty]=v.split(':'); fd.rows[+i].type=ty; renderBulk(); break; }
    case 'hubEdit': openAcct(v); fd.back='hub'; break;
    case 'bulkDel': fd.rows.splice(+v,1); renderBulk(); break;
    case 'bulkSave': saveBulk(); break;
    case 'smsDismiss': { const S=p.sms||(p.sms={}); S.dismissed=true; persist('profile'); render(false); break; }
    case 'smsDone': { const S=p.sms||(p.sms={}); S.setup=true; persist('profile'); $('#dlg').close(); render(false); toast('Great — tap “Import bank SMS” whenever you like'); break; }
    case 'smsCopy': { const ok=await copyText(v); toast(ok?'Copied':'Couldn’t copy'); break; }
    case 'bankFix': { const a=acct(v); if(!a||!a.bankBal) break; const diff=round(a.bankBal.v-balAtBank(a),dec()); if(!diff) break;
      if(await ask(`Make ${a.name} match your bank (${money(a.bankBal.v)} ${cur()} on ${shortD(a.bankBal.date)})? Your transactions don’t change.`,'Match bank')){ syncToBank(a); persist('profile'); toast('Balance now matches your bank'); if($('#dlg').open) openAccountSheet(v); render(false); } break; }
    case 'smsSyncBal': { const S=P().sms||(P().sms={}); S.syncBal=S.syncBal===false; persist('profile'); toast(S.syncBal?'Balances will follow your bank’s messages':'Balances won’t change from bank messages'); break; }
    case 'impBack': imp.rows=[]; imp.msg=''; renderImport(); break;
    case 'impDo': doImport(); break;
    case 'demo': loadDemo(); break;
    case 'clearDemo': clearDemo(); break;
    case 'export': openExport(); break;
    case 'exportCsv': $('#dlg').close(); exportCSV(); break;
    case 'makePdf': { const m=($('#repMonth')||{}).value; el.disabled=true; el.textContent='Making your report…';
      try{ const r=await makeReport(m); $('#dlg').close(); offerFile(`masroof-report-${m}.pdf`,r.pdf,'application/pdf',`${r.pages} page${r.pages>1?'s':''} · ${esc(r.label)}. Not encrypted — keep it somewhere private.`); }
      catch(e){ el.disabled=false; el.textContent='📄 Monthly report (PDF)'; toast('Couldn’t make the report',{bad:true}); } break; }
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
    case 'lkBio': bioUnlock(); break;
    case 'lkKey': { const i=$('#pu'); if(!i||busyLock) break; if(v==='⌫') i.value=i.value.slice(0,-1); else if(i.value.length<secMeta.pinLen) i.value+=v; buzz(4); lkDots(); if(i.value.length===secMeta.pinLen) setTimeout(lkUnlock,140); break; }
    case 'lkText': lockText=!lockText; showLock('unlock'); if(lockText) setTimeout(()=>{ const i=$('#pu'); if(i) i.focus(); },60); break;
    case 'whatsNew': openWhatsNew(); break;
    case 'fxOpen': fxQ=''; renderFx(); break;
    case 'fxUpdate': fxFetch(true); break;
    case 'fxLive': P().fxAuto=true; persist('profile'); fxFetch(true); render(false); break;
    case 'fxAutoRate': if(draft){ fillFxRate(draft); renderTxDlg(); } break;
    case 'openMap': if($('#dlg').open) $('#dlg').close(); openMap(); break;
    case 'mapClose': closeMap(); break;
    case 'mapPlay': togglePlay(); break;
    case 'mapPick': mapState.sel=v; if(globe) globe.select(v); renderMapCards(); renderMapDetail(); buzz(6); break;
    case 'mapBack': mapState.sel=null; if(globe){ if(globe.overview) globe.overview(); else globe.select(null); } renderMapCards(); renderMapDetail(); break;
    case 'mapStyle': mapState.style=v; p.mapStyle=v; persist('profile'); if(globe&&globe.setStyle) globe.setStyle(v); document.querySelectorAll('.mv-style button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v)); break;
    case 'mapMonth': stopPlay(); mapState.period=v; updateMap(); break;
    case 'geoOn': turnOnGeo(); break;
    case 'geoToggle': if(p.geo){ p.geo=false; persist('profile'); toast('Masroof won’t use your location'); render(false); } else turnOnGeo(); break;
    case 'checkUpdate': checkUpdate(true); break;
    case 'doUpdate': doUpdate(); break;
    case 'bioInfo': toast('Face ID unlock needs an iPhone with Face ID or Touch ID and iOS 18 or later'); break;
    case 'lkLang': secMeta.lang=LANG==='ar'?'en':'ar'; saveSec(); setLang(secMeta.lang,true); break;
    case 'bioToggle': { if(vaultRec&&vaultRec.bio){ delete vaultRec.bio; hasBio=false; await saveNow(); toast('Face ID unlock turned off'); render(false); break; }
      try{ await bioEnable(); toast('Face ID unlock is on'); }catch(e){ toast(e&&e.message==='noprf'?'Face ID unlock needs iOS 18 or later':e&&e.name==='NotAllowedError'?'Cancelled':'Couldn’t turn on Face ID',{bad:true}); } render(false); break; }
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
  if(t.id==='amt'){e.preventDefault(); saveDraft();}
  if(t.id==='note'){e.preventDefault(); if(!noteQuick4(t)) { t.blur(); if(calc(draft).total>0) saveDraft(); } }
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='p1'){ const st=strengthOf(t.value); const bar=$('#pStr'); if(bar){bar.style.width=(t.value?Math.max(8,st*25):0)+'%'; bar.style.background=['var(--spend)','var(--spend)','var(--warn)','var(--brand)','var(--earn)'][st];} return; }
  if(t.dataset.f&&draft){ if(t.type==='checkbox') return; setPath(draft,t.dataset.f,t.value); if(t.dataset.f==='fx.rate'&&draft.fx.auto){ draft.fx.auto=false; const h=$('#dlg .fxhint'); if(h) h.innerHTML=fxHint(draft); }
    if(t.dataset.f==='note'&&!draft.manual&&(draft.type==='expense'||draft.type==='income')&&!draft.itemized){ const g=guessCategory(t.value,draft.type); const before=draft.catId+'|'+draft.item;
      if(g){draft.catId=g.catId;draft.item=g.item||'';} if(before!==draft.catId+'|'+draft.item){ const w=$('#catWrap'); if(w){ w.innerHTML=catPicker(draft,draft.type); updateCalc(); return; } const pos=t.selectionStart;renderTxDlg();const n=$('#note');n.focus();n.setSelectionRange(pos,pos);return;} }
    updateCalc(); return; }
  if(t.dataset.fd&&fd){ fd[t.dataset.fd]=t.value; if(t.hasAttribute('data-live')) updateAcctPreview(); if(fd.kind==='goal'){ const h=$('#goalHint'); if(h) h.innerHTML=goalHintHTML(); } return; }
  if(t.dataset.bulk&&fd&&fd.kind==='bulk'){ const [i,k]=t.dataset.bulk.split('.'); if(fd.rows[+i]) fd.rows[+i][k]=t.value; return; }
  if(t.dataset.input==='txQ'){ state.ui.txQ=t.value; renderTxList(); return; }
  if(t.dataset.gn&&state.ui.gn){ const g=state.ui.gn; g[t.dataset.gn]=t.value; if(t.dataset.gn==='amt') g.amtSet=true; if(t.dataset.gn==='date'){ g.months='custom'; const y=window.scrollY; render(); window.scrollTo(0,y); return; } const h=$('#gnHint'); if(h){ const tx=gnHint(g); h.hidden=!tx; h.querySelector('span').innerHTML=tx; } return; }
  if(t.matches('[data-imptext]')){ imp.text=t.value; return; }
  if(t.matches('[data-smsamt]')){ const r=(P().smsQueue||[])[0]; const v=num(t.value); if(r&&v>0){ r.amount=round(v,dec()); persist('profile'); } return; }
  if(t.matches('[data-billtext]')){ if(draft){ draft._billText=t.value; billTyped(); } return; }
  if(t.matches('[data-fxq]')){ fxQ=t.value; const pos=t.selectionStart; renderFx(); const n=$('#dlg [data-fxq]'); if(n){ n.focus(); n.setSelectionRange(pos,pos); } return; }
  if(t.dataset.imp==='item'){ imp.rows[+t.dataset.i].item=t.value; return; }
});
document.addEventListener('change',e=>{
  const t=e.target,u=state.ui,p=P();
  if(t.id==='note'&&draft&&$('#dlg .add4')&&noteQuick4(t)) return;
  if(t.hasAttribute('data-pname')){ P().name=t.value.trim().slice(0,30); persist('profile'); toast('Saved'); render(false); return; }
  if(t.dataset.f&&draft){ const val=t.type==='checkbox'?t.checked:t.value; setPath(draft,t.dataset.f,val);
    if(t.dataset.f==='itemized'&&val&&!draft.lines.length){ draft.lines=[{...blankLine(draft.catId),name:draft.note||'',price:draft.amount||'',item:draft.item||''}]; draft.fx.on=false; }
    if(t.dataset.f==='split.paidBy'&&!draft.split.who.includes(val)) draft.split.who.push(val);
    if(/^lines\.\d+\.name$/.test(t.dataset.f)){ const i=+t.dataset.f.split('.')[1]; const l=draft.lines[i]; if(!l.item){const g=guessCategory(l.name,'expense'); if(g){l.catId=g.catId;l.item=g.item||'';
      const sel=document.querySelector(`[data-f="lines.${i}.catId"]`), it=document.querySelector(`[data-f="lines.${i}.item"]`); if(sel) sel.value=l.catId; if(it){it.value=l.item; it.setAttribute('list','dl-'+l.catId);} }} updateCalc(); return; }
    if(/^lines\.\d+\.catId$/.test(t.dataset.f)){ const i=+t.dataset.f.split('.')[1]; draft.lines[i].item=''; const it=document.querySelector(`[data-f="lines.${i}.item"]`); if(it){it.value='';it.setAttribute('list','dl-'+t.value);} return; }
    if((t.dataset.f==='fx.cur'||t.dataset.f==='fx.on')&&draft.fx.on&&(draft.fx.auto||!num(draft.fx.rate))) fillFxRate(draft);
    if(t.hasAttribute('data-rr')||t.dataset.f==='date'&&draft.repeat||t.dataset.f==='accountId'&&draft.type==='debt') renderTxDlg(); else updateCalc();
    return; }
  if(t.dataset.fd&&fd){ fd[t.dataset.fd]=t.value; if(t.hasAttribute('data-live')) updateAcctPreview(); if((t.dataset.fd==='color'||t.dataset.fd==='type')&&fd.kind==='acct') renderAcctEditor(!!fd.id); return; }
  if(t.dataset.rem){ const o=P().remind; o[t.dataset.rem]=t.type==='checkbox'?t.checked:t.value; persist('profile'); const sc=($('#dlg .dlg-b')||{}).scrollTop; openReminders(); const b=$('#dlg .dlg-b'); if(b) b.scrollTop=sc; return; }
  if(t.dataset.bulk&&fd&&fd.kind==='bulk'){ const [i,k]=t.dataset.bulk.split('.'); if(fd.rows[+i]) fd.rows[+i][k]=t.value;
    return; }
  if(t.hasAttribute('data-goalauto')&&fd&&fd.kind==='goal'){ fd.auto=t.checked; return; }
  if(t.dataset.fd&&fd&&fd.kind==='goal'&&['addSrc','fromId'].includes(t.dataset.fd)){ fd[t.dataset.fd]=t.value; if(t.dataset.fd==='addSrc') renderGoal(); return; }
  if(t.hasAttribute('data-fxauto')){ P().fxAuto=t.checked; persist('profile'); if(t.checked) fxFetch(true); return; }
  if(t.dataset.fxmine){ const m=P().fxMine||(P().fxMine={}); const v=num(t.value); if(v>0) m[t.dataset.fxmine]=v; else delete m[t.dataset.fxmine]; persist('profile'); toast(v>0?'Your rate is saved':'Back to the standard rate'); return; }
  if(t.dataset.imp){ const r=imp.rows[+t.dataset.i]; const f=t.dataset.imp;
    if(f==='on'){r.on=t.checked;renderImport();}
    else if(f==='type'){ r.type=t.value; r.refund=false; r.unsure=false; r.on=true; if(r.type==='transfer'){ if(!r.toAccountId||r.toAccountId===r.accountId) r.toAccountId=(P().accounts.find(a=>a.id!==r.accountId)||{}).id; }
      else { const g=guessCategory(r.merchant,r.type); r.catId=g?g.catId:(r.type==='income'?'inc_other':'other'); r.item=g&&g.item||''; } renderImport(); }
    else { r[f]=t.value; if(f==='accountId'){ r.acctSure=true; r.how='you'; } if(f==='catId') r.item=''; }
    return; }
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
    case 'lang': secMeta.lang=t.value; saveSec(); { const y=window.scrollY; setLang(t.value,true); window.scrollTo(0,y); } break;
    case 'monthStart': p.monthStart=+t.value; persist('profile'); u.anchor=todayStr(); render(false); toast(p.monthStart===1?'Months follow the calendar':`Your month now runs from day ${p.monthStart}`); break;
    case 'theme': p.theme=t.value; secMeta.theme=t.value; saveSec(); applyTheme(); persist('profile'); break;
  }
});
document.addEventListener('toggle',e=>{ const t=e.target; if(t.matches&&t.matches('details.acc')){ state.ui.sOpen=state.ui.sOpen||{}; state.ui.sOpen[t.dataset.k]=t.open; } },true);
$('#smsFile').addEventListener('change',e=>{ const f=e.target.files&&e.target.files[0]; e.target.value=''; if(f) readSmsFile(f); });
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
async function receiptURL(id){ const r=await rcGet(id); if(!r||!DEK) return null; const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:r.iv},DEK,r.ct); return URL.createObjectURL(new Blob([pt],{type:r.type})); }
async function cleanReceipts(){ try{ const used=new Set(allTx().map(t=>t.receipt).filter(Boolean)); for(const k of await rcKeys()) if(!used.has(k)) await rcDel(k); }catch(e){} }

const FACE_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M9 9v1M15 9v1M12 9v4h-1M9 15.5c1.8 1.4 4.2 1.4 6 0"/></svg>';
/* ---------- Face ID ----------
   A passkey in the iPhone's keychain with the WebAuthn PRF extension: after Face ID it returns a
   secret that never leaves the phone. That secret (via HKDF) encrypts a copy of the data key.
   The passcode keeps working; backups never include this copy. Needs iOS 18 or later. */
let bioCapable=false, hasBio=false;
async function checkBio(){ try{ bioCapable=!!(window.PublicKeyCredential&&window.isSecureContext&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); }catch(e){ bioCapable=false; } }
async function prfKey(secret){ const base=await crypto.subtle.importKey('raw',secret,'HKDF',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:TE.encode('masroof-face-id'),info:TE.encode('data-key')},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']); }
async function bioSecret(id,salt){
  const cred=await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rpId:location.hostname,allowCredentials:[{type:'public-key',id}],userVerification:'required',timeout:60000,extensions:{prf:{eval:{first:salt}}}}});
  const r=cred.getClientExtensionResults()||{}; const sec=r.prf&&r.prf.results&&r.prf.results.first; if(!sec) throw new Error('noprf'); return new Uint8Array(sec);
}
async function bioEnable(){
  if(!DEKraw) return; const salt=crypto.getRandomValues(new Uint8Array(32));
  const cred=await navigator.credentials.create({publicKey:{rp:{name:'Masroof',id:location.hostname},user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'Masroof',displayName:'Masroof'},
    challenge:crypto.getRandomValues(new Uint8Array(32)),pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
    authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'preferred',userVerification:'required'},timeout:60000,extensions:{prf:{eval:{first:salt}}}}});
  const ext=cred.getClientExtensionResults()||{}; if(ext.prf&&ext.prf.enabled===false) throw new Error('noprf');
  const id=new Uint8Array(cred.rawId); const got=ext.prf&&ext.prf.results&&ext.prf.results.first;
  const sec=got?new Uint8Array(got):await bioSecret(id,salt); // Safari hands over the secret only on sign-in, so ask once more
  const key=await prfKey(sec); const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,DEKraw);
  vaultRec.bio={id:b64(id),salt:b64(salt),iv:b64(iv),ct:b64(ct)}; hasBio=true; await saveNow();
}
async function bioUnlock(){
  if(busyLock) return; busyLock=true; lockErr('');
  try{ const rec=await kvGet('vault'); if(!rec||!rec.bio) throw new Error('none');
    const key=await prfKey(await bioSecret(unb64(rec.bio.id),unb64(rec.bio.salt)));
    const raw=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(rec.bio.iv)},key,unb64(rec.bio.ct)));
    const dk=await importDEK(raw); const data=JSON.parse(TD.decode(await openB64(dk,rec.data)));
    DEKraw=raw; DEK=dk; vaultRec=rec; state.profile=data.profile; state.months=data.months||{};
    secMeta.fails=0; secMeta.lockUntil=0; saveSec(); busyLock=false; afterUnlock(false);
  }catch(e){ busyLock=false; lockErr(e&&e.name==='NotAllowedError'?'Face ID was cancelled — try again or use your passcode.':'Face ID didn’t work this time. Use your passcode.'); }
}
/* ---------- lock screen ---------- */
let lockMode='unlock',busyLock=false,lastActive=Date.now(),hiddenAt=null,lockTick=null;
function showLock(kind,msg){
  lockMode=kind; document.body.classList.add('locked'); $('#main').hidden=true; $('#lock').hidden=false; applyTheme();
  const L=$('#lock'); const wait=Math.max(0,Math.ceil((secMeta.lockUntil-Date.now())/1000));
  if(kind==='setup') L.innerHTML=`<div class="lockbox lk4s"><div class="lk4-logo">${fortSVG('idle')}</div><h1>Keep your money private</h1>
    <p>Choose a passcode. Everything you record is encrypted with it and stays on this iPhone — nothing is uploaded, and nobody (including the app’s maker) can read it.</p>
    <input type="text" autocomplete="username" value="Masroof" hidden aria-hidden="true">
    <input class="inp" id="p1" type="password" autocomplete="new-password" placeholder="New passcode, 6+ characters" aria-label="New passcode">
    <div class="strength"><i id="pStr" style="width:0"></i></div><p class="hint" id="pHint">Longer is stronger. Six random digits is the minimum — digits only gives you a keypad to unlock; a short phrase is stronger.</p>
    <input class="inp" id="p2" type="password" autocomplete="new-password" placeholder="Type it again" aria-label="Repeat passcode">
    <label class="check"><input type="checkbox" class="tick" id="pAck"> I understand that if I forget this passcode, my data can’t be recovered by anyone.</label>
    <p class="err" id="lockErr">${esc(msg||'')}</p>
    <button class="btn primary" data-act="lkCreate">Create passcode</button>
    <button class="btn link" data-act="restore" style="align-self:center">Restore from a backup file instead</button>${langLink()}</div>`;
  else if(kind==='restorePass') L.innerHTML=`<div class="lockbox"><div class="shield">📦</div><h1>Open the backup</h1>
    <p>Enter the passcode that was in use when this backup was made. After restoring, that becomes your passcode.</p>
    <input type="text" autocomplete="username" value="Masroof" hidden aria-hidden="true">
    <input class="inp" id="rp" type="password" autocomplete="current-password" placeholder="Backup passcode" aria-label="Backup passcode">
    <p class="err" id="lockErr">${esc(msg||'')}</p><button class="btn primary" data-act="lkRestore">Restore</button>
    <button class="btn link" data-act="lkCancelRestore" style="align-self:center">Cancel</button></div>`;
  else { const pad=secMeta.pinLen>=6&&!lockText&&!wait;
    L.innerHTML=`<div class="lockbox lk4${pad?' pad':''}"><div class="lk4-logo">${fortSVG('idle')}</div><h1>Masroof</h1>
    <p class="lk4-sub">${pad?'Enter passcode':hasBio?'Use Face ID or your passcode':'Enter your passcode'}</p>
    <input type="text" autocomplete="username" value="Masroof" hidden aria-hidden="true">
    ${pad?`<input id="pu" type="password" autocomplete="current-password" hidden><div class="lk4-dots${msg?' shake':''}" id="lkDots" dir="ltr">${'<i></i>'.repeat(secMeta.pinLen)}</div>
      <p class="err" id="lockErr">${esc(msg||'')}</p>
      <div class="lk4-keys" dir="ltr">${['1','2','3','4','5','6','7','8','9','','0','⌫'].map(k=>k?`<button data-act="lkKey" data-v="${k}"${k==='⌫'?' class="bk" aria-label="Delete"':''}>${k==='⌫'?ic('backspace'):k}</button>`:'<span></span>').join('')}</div>`
    :`<input class="inp" id="pu" type="password" autocomplete="current-password" placeholder="Passcode" aria-label="Passcode"${wait?' disabled':''}>
      <p class="err" id="lockErr">${wait?`Too many tries. Wait ${wait} seconds.`:esc(msg||'')}</p>
      <button class="w-btn" data-act="lkUnlock"${wait?' disabled':''}>Unlock</button>`}
    <div class="lk4-links">${secMeta.pinLen>=6&&!wait?`<button class="linkish" data-act="lkText">${pad?'Use the keyboard':'Use the keypad'}</button>`:''}<button class="linkish" data-act="lkForgot">Forgot passcode?</button></div>
    <div class="lk4-foot"><button class="lk4-lang" data-act="lkLang" data-notr>${LANG==='ar'?'English':'العربية'}</button>${hasBio?`<button class="w-pill" data-act="lkBio">${ic('scan-smiley')}Face ID</button>`:''}</div></div>`; }
  if(wait&&kind==='unlock') setTimeout(()=>{ if(lockMode==='unlock'&&!DEK) showLock('unlock'); },1000*Math.min(wait,5));
  if(!L.querySelector('.lock-ver')) L.querySelector('.lockbox').insertAdjacentHTML('beforeend',`<p class="lock-ver" data-notr>Masroof ${APP_VERSION}</p>`);
  L.scrollTop=0; if(L.querySelector('.lk4.pad')) return;
  if(!(kind==='unlock'&&hasBio)) setTimeout(()=>{const i=L.querySelector('input.inp:not([disabled])'); if(i) i.focus();},80); // with Face ID, don't pop up the keyboard
}
let lockText=false;
// a passcode of digits only unlocks with the round keypad; only its length is kept, never the digits
const pinLenFor=p=>{ if(/^\d{6,12}$/.test(p)) secMeta.pinLen=p.length; else delete secMeta.pinLen; };
const langLink=()=>`<button class="btn link lang-link" data-act="lkLang" data-notr style="align-self:center">${LANG==='ar'?'English':'العربية'}</button>`;
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
  vaultRec={v:1,...await wrapWith(p1,DEKraw),data:null,created:Date.now()}; hasBio=false;
  state.profile=defaultProfile(); state.months={};
  pinLenFor(p1); await saveNow(); busyLock=false; secMeta.fails=0; saveSec(); afterUnlock(true);
}
async function lkUnlock(){
  const inp=$('#pu'); if(!inp||busyLock) return; const pass=inp.value; if(!pass) return;
  busyLock=true; lockErr('Checking…');
  try{
    const rec=await kvGet('vault'); const raw=await unwrapWith(pass,rec);
    const key=await importDEK(raw); const data=JSON.parse(TD.decode(await openB64(key,rec.data)));
    DEKraw=raw; DEK=key; vaultRec=rec; state.profile=data.profile; state.months=data.months||{};
    secMeta.fails=0; secMeta.lockUntil=0; pinLenFor(pass); lockText=false; saveSec(); busyLock=false; afterUnlock(false);
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
  loading4(isNew);
  document.body.classList.remove('locked'); $('#lock').hidden=true; $('#lock').innerHTML=''; $('#main').hidden=false;
  fillProfile(); state.ready=true; lastActive=Date.now(); openDay=todayStr();
  if(!isNew) runRecurring();
  if(state.profile.seenVersion!==APP_VERSION){ const first=isNew||!state.profile.seenVersion&&!allTx().length; state.profile.seenVersion=APP_VERSION; persist('profile'); if(!first) setTimeout(()=>{ if(!$('#dlg').open&&state.ready) openWhatsNew(); },3000); }
  state.ui.tab='home'; render(); window.scrollTo(0,0);
  if(navigator.storage&&navigator.storage.persist) navigator.storage.persist().then(v=>{persistGranted=v;}).catch(()=>{});
  setTimeout(cleanReceipts,3000); setTimeout(fxAutoCheck,2500);
  if(!isNew&&(!secMeta.lastBackup||dayDiff(secMeta.lastBackup,todayStr())>30)&&allTx().length>20) setTimeout(()=>toast('It\u2019s been a while — save an encrypted backup in Settings'),1500);
}
let persistGranted=null;
const storageNote=()=>persistGranted===true?'Protected from automatic clean-up':persistGranted===false?'Add to Home Screen so iOS keeps it':'On this device only';
async function lockNow(){
  if(!DEK) return; await saveNow();
  closeMap(); if(miniGlobe){ miniGlobe.stop(); miniGlobe=null; }
  DEK=null; DEKraw=null; state.ready=false; state.profile=null; state.months={}; closeStory();
  draft=null; fd=null; imp={text:'',rows:[],busy:false,ctl:null,msg:''};
  for(const id of ['#dlg','#askDlg']){const d=$(id); if(d.open) d.close(); d.innerHTML='';}
  $('#main').innerHTML=''; $('#toast').classList.remove('on');
  showLock('unlock');
}
async function eraseAll(){ hasBio=false;
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
    Object.assign(vaultRec,await wrapWith(n1,DEKraw)); await kvSet('vault',vaultRec); pinLenFor(n1); saveSec(); d.close(); toast('Passcode changed. Older backups still open with the old one.'); };
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
  const out={app:'masroof',kind:'encrypted-backup',v:1,created:new Date().toISOString(),vault:clone(vaultRec)}; delete out.vault.bio;
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
    delete rec.bio; hasBio=false; await kvSet('vault',rec); vaultRec=rec; DEKraw=raw; DEK=key; state.profile=data.profile; state.months=data.months||{}; pendingRestore=null; busyLock=false;
    secMeta.fails=0; secMeta.lockUntil=0; pinLenFor(pass); saveSec(); afterUnlock(false); toast('Backup restored');
  }catch(e){ busyLock=false; lockErr('That passcode doesn\u2019t open this backup.'); }
}

/* ---------- auto-lock ---------- */
['pointerdown','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,()=>{lastActive=Date.now()},{passive:true,capture:true}));
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){ hiddenAt=Date.now(); saveNow(); if(DEK&&+secMeta.autoLock===0) lockNow(); }
  else { const away=hiddenAt?Date.now()-hiddenAt:0; hiddenAt=null; checkForUpdate(); if(away>60000){ checkUpdate(false); if(DEK) fxAutoCheck(); }
    if(DEK&&away>Math.max(1,+secMeta.autoLock)*60000) lockNow().then(reloadIfLocked);
    else if(!DEK&&away>30000) reloadIfLocked();
    newDayCheck(); }
});
// Coming back to a locked app: reload it so a new version pushed to GitHub is picked up.
// Nothing is lost — the data stays in the encrypted vault and the passcode is needed anyway.
function reloadIfLocked(){ if(!DEK&&lockMode==='unlock'&&!pendingRestore&&!busyLock) saving.then(()=>location.reload()); }
function checkForUpdate(){ if(navigator.serviceWorker) navigator.serviceWorker.getRegistration().then(r=>r&&r.update()).catch(()=>{}); }
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

/* ================= bills read by Claude =================
   Take a photo of the bill in the Claude app with the request from billPrompt(), then paste
   Claude's answer here. The structured lines ("ITEM: name | qty | total | category") are read
   exactly; anything else falls back to reading it like a printed receipt. */
function billPrompt(){
  const cats=P().categories.expense.map(c=>c.name).join(', ');
  return `Read the bill in this photo and reply with ONLY these lines, nothing else:
SHOP: <shop or restaurant name>
DATE: <YYYY-MM-DD>
CURRENCY: <3-letter code, e.g. ${cur()}>
ITEM: <item name> | <quantity> | <line total> | <category>
(one ITEM line for every item on the bill; category is one of: ${cats})
DISCOUNT: <amount, or 0>
SERVICE: <service charge, or 0>
VAT: <tax amount, or 0>
TOTAL: <total paid>`;
}
/* the "Add bill text" sheet: three steps, a live preview of what was read, then "Use this bill" */
function billPreview4(d){
  const text=String(d._billText!=null?d._billText:d.bill||'').trim(); if(!text) return '';
  const r=parseBillText(text); if(!r.lines.length) return `<div class="bl4-pv bad">${ic('warning')}<span>No items with prices found yet. Each item line should look like: ITEM: name | quantity | total | category</span></div>`;
  const fb=d.catId||'other', by={};
  for(const l of r.lines){ const c=billCat(l.name,l.catName,fb).catId; const o=by[c]||(by[c]={n:0,v:0}); o.n++; o.v+=l.price*l.qty; }
  const ord=Object.entries(by).sort((a,b)=>b[1].v-a[1].v), whole=sum(ord,([,o])=>o.v)||1;
  const tot=r.total||round(whole+r.tax+r.service-r.discount,3);
  return `<div class="bl4-pv"><span class="ok">${ic('check-circle')}Read from the bill${r.merchant?` · <span data-notr dir="auto">${esc(r.merchant)}</span>`:''}</span>
    <div class="pvbar">${ord.map(([c,o])=>`<i style="flex:${(o.v/whole).toFixed(4)};background:${catVis(c).color}"></i>`).join('')}</div>
    ${ord.map(([c,o])=>`<div class="pvln"><i style="background:${catVis(c).color}"></i><span>${esc(cat(c).name)} · <span class="w-muted">${o.n} item${o.n>1?'s':''}</span></span>${nb(o.v.toFixed(3))}</div>`).join('')}
    ${r.tax?`<div class="pvln sm"><span>VAT</span>${nb(r.tax.toFixed(3))}</div>`:''}${r.discount?`<div class="pvln sm"><span>Discount</span>${nb('−'+r.discount.toFixed(3))}</div>`:''}
    <div class="tot"><span>Total</span>${nb(`${tot.toFixed(3)}${r.cur&&r.cur!==cur()?' '+r.cur:''}`)}</div></div>`;
}
function renderBill4(d){
  const text=String(d._billText!=null?d._billText:d.bill||'');
  const pv=billPreview4(d), ok=pv&&!pv.includes('bl4-pv bad');
  const step=(n,done,title,sub,btn)=>`<div class="bl4-step"><span class="num${done?' done':''}">${done?ic('check'):n}</span><span class="t"><b>${title}</b><small>${sub}</small></span>${btn||''}</div>`;
  const first=!$('#dlg .bl4');
  $('#dlg').innerHTML=`<div class="w-sheet bl4${first?' in':''}"><div class="body"><div class="w-grab"></div>
    <div class="bl4-h"><h3>Add bill text</h3><button class="w-round" data-act="billClose" aria-label="Back">${ic('x')}</button></div>
    <div class="bl4-steps">${step(1,d._billCopied,'Copy the request','A ready-made message for the Claude app',`<button class="w-pill${d._billCopied?' card':''}" data-act="billPrompt">${d._billCopied?'Copied':'Copy'}</button>`)}
      ${step(2,d._billCopied&&!!text.trim(),'Photograph the bill in Claude','Paste the request and attach the photo')}
      ${step(3,ok,'Paste Claude’s answer','Masroof reads items, VAT and categories',`<button class="w-pill${text.trim()?' card':''}" data-act="billPaste">Paste</button>`)}</div>
    <textarea class="inp bl4-ta" rows="4" data-billtext dir="auto" placeholder="SHOP: Lulu&#10;ITEM: Milk 1L | 2 | 0.900 | Groceries&#10;VAT: 0.045&#10;TOTAL: 0.945">${esc(text)}</textarea>
    <div id="billPv">${pv}</div>
    ${d._billMsg?`<p class="hint bb-msg">${esc(d._billMsg)}</p>`:''}</div>
    <div class="foot"><button class="w-btn${ok?'':' dim'}" data-act="billRead" id="billUse">Use this bill</button></div></div>`;
}
let billT=null;
function billTyped(){ clearTimeout(billT); billT=setTimeout(()=>{ const pv=$('#billPv'); if(!pv||!draft) return; pv.innerHTML=billPreview4(draft); const b=$('#billUse'); if(b) b.classList.toggle('dim',!pv.querySelector('.bl4-pv:not(.bad)')); },250); }
const billAmt=x=>{ const t=arDigits(String(x||'')).replace(/[^\d.,\-]/g,''); return Math.abs(num(/,\d{3}(\D|$)/.test(t)&&t.includes('.')?t.replace(/,/g,''):t.replace(/,(\d{1,2})$/,'.$1').replace(/,/g,''))); };
function parseBillText(text){
  const out={merchant:'',date:null,cur:null,lines:[],tax:0,service:0,discount:0,total:null,subtotal:null};
  const field=(l,re)=>{ const m=l.match(new RegExp('^(?:'+re+')\\s*(?:\\([^)]*\\))?\\s*[:：=]\\s*(.+)$','i')); return m?m[1].trim():null; };
  for(const raw of arDigits(text).split(/\r?\n/)){
    let l=raw.replace(/\*\*|__|`/g,'').replace(/^\s*(?:[-•*]|\d+[.)])\s+/,'').trim(); if(!l) continue; let v;
    if((v=field(l,'shop|store|merchant|restaurant|vendor|المتجر|المحل|المطعم'))!=null){ out.merchant=v.slice(0,60); continue; }
    if((v=field(l,'date|التاريخ'))!=null){ out.date=(v.match(/\d{4}-\d{2}-\d{2}/)||[])[0]||dateIn(v); continue; }
    if((v=field(l,'currency|العملة'))!=null){ out.cur=curCode(v)||(v.match(/[A-Z]{3}/i)||[''])[0].toUpperCase()||null; continue; }
    if((v=field(l,'sub\\s*-?\\s*total|المجموع الفرعي'))!=null){ out.subtotal=billAmt(v); continue; }
    if((v=field(l,'vat|tax|gst|ضريبة(?: القيمة المضافة)?|الضريبة'))!=null){ out.tax+=billAmt(v); continue; }
    if((v=field(l,'service(?:\\s*charge)?|رسوم الخدمة|الخدمة'))!=null){ out.service+=billAmt(v); continue; }
    if((v=field(l,'discount|خصم|الخصم'))!=null){ out.discount+=billAmt(v); continue; }
    if((v=field(l,'(?:grand\\s*)?total|amount paid|الإجمالي|المجموع'))!=null){ out.total=billAmt(v); continue; }
    l=l.replace(/^(?:item|صنف)\s*[:：]\s*/i,'');
    if(!l.includes('|')) continue;
    const c=l.replace(/^\|/,'').replace(/\|$/,'').split('|').map(x=>x.trim());
    if(c.every(x=>!x||/^:?-{2,}:?$/.test(x))||/^(item|items|name|product|description|الصنف|الاسم)$/i.test(c[0])) continue; // a table's header or rule
    let name=c[0], qty=1, total=0, catName='';
    const isNum=x=>/^[\d.,\s]+(?:[a-z]{0,3}|[^\s\w]{0,3})$/i.test(x)||/^[^\d\s]{1,4}\s*[\d.,]+$/.test(x);
    if(c.length>=4){ qty=num(c[1].replace(',','.'))||1; total=billAmt(c[2]); catName=c[3]; }
    else if(c.length===3){ if(isNum(c[1])&&isNum(c[2])){ qty=num(c[1].replace(',','.'))||1; total=billAmt(c[2]); } else { total=billAmt(c[1]); catName=c[2]; } }
    else if(c.length===2) total=billAmt(c[1]);
    if(name&&total>0) out.lines.push({name,qty,price:total/qty,catName});
  }
  if(!out.lines.length){ const r=parseReceiptText(text); for(const k of ['merchant','date','total','subtotal']) if(out[k]) r[k]=out[k]; for(const k of ['tax','service','discount']) if(out[k]) r[k]=out[k]; r.cur=out.cur; return r; }
  return out;
}
// "Groceries", "groceries › Dairy", "البقالة" → one of your categories (and maybe its type)
function billCat(itemName,catName,fallback){
  const cats=P().categories.expense, [cn,typeName]=String(catName||'').split(/\s*[>›\/]\s*/), n=norm(cn||'');
  const ar=c=>norm((AR.dict||{})[c.name]||'');
  let c=n?cats.find(x=>norm(x.name)===n||ar(x)===n)||cats.find(x=>{ const a=norm(x.name); return a.startsWith(n)||n.startsWith(a.split(' ')[0]); })||cats.find(x=>ar(x)&&(ar(x).includes(n)||n.includes(ar(x)))):null;
  const g=guessCategory(itemName,'expense');
  if(!c) c=findCat(g&&g.catId)||findCat(fallback)||cats[cats.length-1];
  const item=typeName&&c.items.find(i=>norm(i)===norm(typeName))||(g&&g.catId===c.id?g.item||'':'')||typeName||'';
  return {catId:c.id,item};
}
function readBill(d){
  const text=String(d._billText!=null?d._billText:d.bill||'').trim(); if(!text){ d._billMsg='Paste the bill text first.'; renderTxDlg(); return; }
  const r=parseBillText(text);
  const fallback=d.catId||((r.merchant&&guessCategory(r.merchant,'expense'))||{}).catId||'other';
  if(!r.lines.length){ d._billMsg='No items with prices found. Make sure each item line looks like: ITEM: name | quantity | total | category'; renderTxDlg(); return; }
  // a bill in another currency: prices are converted, the original total is kept
  let k=1; d._billFx=null;
  if(r.cur&&r.cur!==cur()&&fxRate(r.cur)>0){ k=fxRate(r.cur); const lineSum=sum(r.lines,l=>l.price*l.qty); d._billFx={cur:r.cur,orig:r.total||round(lineSum+r.tax+r.service-r.discount,2)}; }
  d.lines=r.lines.map(l=>{ const bc=billCat(l.name,l.catName,fallback); return {name:l.name.slice(0,60),qty:String(+(+l.qty).toFixed(3)),price:String(round(l.price*k,dec()+1)),catId:bc.catId,item:bc.item,who:[]}; });
  d.type='expense'; d.itemized=true; d.fx.on=false;
  d.taxMode='amt'; d.tax=r.tax?String(round(r.tax*k,dec())):''; d.serviceMode='amt'; d.service=r.service?String(round(r.service*k,dec())):''; d.discount=r.discount?String(round(r.discount*k,dec())):'';
  if(r.merchant&&!d.note.trim()) d.note=r.merchant;
  if(r.date&&r.date<=todayStr()&&!d.id) d.date=r.date;
  d._scanTotal=r.total?r.total*k:null; d.bill=text; d._billText=null; d._billOpen=false; d.manual=true;
  const byC={}; for(const l of d.lines) byC[l.catId]=(byC[l.catId]||0)+lineTotal(l); d.catId=Object.entries(byC).sort((a,b)=>b[1]-a[1])[0][0];
  const nc=Object.keys(byC).length;
  d._billMsg=''; renderTxDlg();
  toast(`Read ${d.lines.length} item${d.lines.length>1?'s':''}${nc>1?` in ${nc} categories`:''}${r.tax?' with VAT':''}${d._billFx?` · converted from ${d._billFx.cur}`:''} — check and save`);
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

/* ---------- start ---------- */
let booted=false;
async function boot(){
  if(!window.crypto||!crypto.subtle||!window.indexedDB){ $('#main').innerHTML='<div class="loading">This browser can\u2019t encrypt data. Open the app in Safari.</div>'; return; }
  try{ idb=await idbOpen(); }catch(e){ $('#main').innerHTML='<div class="loading">Storage is blocked. In Safari, turn off Private Browsing.</div>'; return; }
  const m=await kvGet('meta').catch(()=>null); if(m) secMeta={...secMeta,...m};
  setLang(secMeta.lang||(/^ar\b/i.test(navigator.language||'')?'ar':'en'));
  const v=await kvGet('vault').catch(()=>null); hasBio=!!(v&&v.bio); await checkBio();
  $('#main').innerHTML='';
  showLock(v?'unlock':'setup'); booted=true;
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')) navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{});
  setTimeout(()=>checkUpdate(false),1500);
}

/* ================= Masroof 4.0 "Wallet" =================
   The look from the design handoff: ink and paper, cyan for money in, magenta for alerts, the
   gold coin for actions, a floating tab bar (Home · Activity · ＋ · Wealth · You), and pushed
   screens for Friends, Accounts, Bank messages, a new goal and Settings. Data, storage and
   encryption are unchanged; this is the presentation layer. */
const IC=window.MASROOF_ICONS||{};
const ic=(n,cls)=>IC[n]?`<svg class="ic${cls?' '+cls:''}" viewBox="0 0 256 256" aria-hidden="true">${IC[n]}</svg>`:'';
const RTL=()=>LANG==='ar';
const chevI=()=>ic(RTL()?'caret-left':'caret-right');
const backI=()=>ic(RTL()?'arrow-right':'arrow-left');
const nb=s=>`<bdi dir="ltr" class="n">${s}</bdi>`; // numbers stay left to right inside Arabic

/* --- the "coin fort" logo: four merlons, a wall and five coin bars; the top bar is the gold coin --- */
const FORT_BARS=[[28,44,44],[26.5,53,47],[25,62,50],[23.5,71,53],[22,80,56]];
const FORT_MERL='M26 36L30.5 26L35 36ZM39 36L43.5 26L48 36ZM52 36L56.5 26L61 36ZM65 36L69.5 26L74 36Z';
function fortG(mode,ink,coin,gStyle){
  const bar=(b,i)=>{ let st='';
    if(mode==='splash') st=`animation:coinDrop .6s cubic-bezier(.3,1.4,.5,1) ${(0.1+(4-i)*0.12).toFixed(2)}s both;`;
    if(mode==='loader') st=`animation:stack 1.8s cubic-bezier(.3,1.3,.5,1) ${((4-i)*0.14).toFixed(2)}s infinite both;`;
    if(mode==='drop'&&i===0) st='animation:coinDrop .7s cubic-bezier(.3,1.5,.5,1) both;';
    if(i===0&&(mode==='idle'||mode==='splash'||mode==='drop')) st+='transform-box:fill-box;transform-origin:center;'+(mode==='idle'?'animation:flip 6s 1s infinite;':'');
    return `<rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="7" style="fill:${i===0?coin:ink};${st}"/>`; };
  const ms=mode==='splash'?'animation:rise .45s .78s cubic-bezier(.2,.9,.25,1.3) both;transform-box:fill-box;transform-origin:bottom;':mode==='loader'?'animation:blink 1.8s infinite;':'';
  return `<g style="${gStyle||''}"><path d="${FORT_MERL}" style="fill:${ink};${ms}"/><rect x="26" y="36" width="48" height="5" style="fill:${ink};${ms}"/>${FORT_BARS.map(bar).join('')}</g>`;
}
function fortSVG(mode){
  const ink='var(--ink)', coin='#EDBB00';
  if(mode==='splash'){ const pl=(c,anim)=>fortG('splash',c,c,`mix-blend-mode:var(--blend,screen);animation:${anim} 1.5s cubic-bezier(.2,.9,.25,1) both`);
    return `<svg viewBox="0 0 100 100" class="fort">${pl('#38A6CF','plateC')}${pl('#FF458E','plateM')}${pl('#EDBB00','plateY')}${fortG('splash',ink,coin,'animation:plateK 1.5s both')}</svg>`; }
  return `<svg viewBox="0 0 100 100" class="fort">${fortG(mode,ink,coin,'')}</svg>`;
}

/* --- how each category looks: a Phosphor icon and a colour (your own categories keep their emoji) --- */
const CAT4={food:['fork-knife','#FF458E'],groceries:['shopping-cart','#38A6CF'],household:['house-line','#9B9797'],bills:['lightbulb','#9B9797'],
  transport:['gas-pump','#62C5EE'],shopping:['shopping-bag','#FF90B1'],health:['first-aid','#4FC3A1'],fun:['film-slate','#D82071'],education:['graduation-cap','#B39DFF'],
  family:['gift','#FF8A65'],travel:['airplane-tilt','#EDBB00'],fees:['bank','#9B9797'],other:['package','#9B9797'],
  salary:['briefcase','#38A6CF'],side:['laptop','#38A6CF'],returns:['chart-line-up','#38A6CF'],inc_other:['coins','#38A6CF']};
const ITEM4={'Coffee':['coffee','#D9A400'],'Tea & karak':['coffee','#D9A400'],'Fuel':['gas-pump','#62C5EE'],'Taxi':['taxi','#62C5EE']};
function catVis(id,item){ const c=findCat(id)||{icon:'•',color:'#9B9797'}; const v=(item&&ITEM4[item])||CAT4[id];
  return v?{html:ic(v[0]),color:v[1]}:{html:`<span class="emo">${esc(c.icon||'•')}</span>`,color:c.color||'#9B9797'}; }
function txVis(t){
  if(t.type==='transfer') return {html:ic('arrows-left-right'),color:'#9B9797'};
  if(t.type==='debt') return {html:ic('hand-coins'),color:'#EDBB00'};
  if(t.type==='invest') return {html:ic('chart-line-up'),color:'#B39DFF'};
  if(t.lines&&t.lines.length&&new Set(t.lines.map(l=>l.catId)).size>1) return {html:ic('receipt'),color:catVis(t.catId).color};
  return catVis(t.catId,t.item);
}
const tileHTML=(v,size)=>`<span class="w-tile${size?' '+size:''}" style="color:${v.color};background:${v.color}22">${v.html}</span>`;
const TYPE_IC={card:'credit-card',savings:'piggy-bank',cash:'wallet',bank:'bank',wallet:'device-mobile'};
const cardBg=c=>`linear-gradient(140deg,rgba(255,255,255,.14),rgba(0,0,0,.35)),${c}`;
const shortCat=c=>(c&&c.name||'').replace(/ &.*$|,.*$/,'').split(' ').slice(0,2).join(' ');

/* --- navigation: four tabs, and screens pushed on top of them --- */
const TABS4=['home','tx','wealth','you'], PUSH4=['people','settings','accounts','sms','goalnew'];
function go4(v){ const u=state.ui; if($('#dlg').open&&!$('#dlg .add4')) $('#dlg').close();
  if(v==='sms'&&u.tab!=='sms'){ u.smsDone=0; u.smsAllCats=false; if(!u.smsSeen&&(P().smsQueue||[]).length){ u.smsSeen=true; u.smsLoading=true; setTimeout(()=>{ u.smsLoading=false; if(u.tab==='sms') render(); },1500); } } if(PUSH4.includes(v)&&!PUSH4.includes(u.tab)) u.back=u.tab; if(TABS4.includes(v)) u.back=null; u.tab=v; if(v==='home') u.cuFrom=0; render(); window.scrollTo(0,0); }
function tabbarHTML(){
  const t=(id,label,icon)=>`<button data-tab="${id}" aria-current="${state.ui.tab===id?'page':'false'}">${ic(icon,'off')}${ic(icon+'-fill','on')}<span>${label}</span></button>`;
  return `<div class="in">${t('home','Home','house')}${t('tx','Activity','list-bullets')}<button class="addbtn" data-act="add" aria-label="Add">${ic('plus')}</button>${t('wealth','Wealth','chart-pie-slice')}${t('you','You','user-circle')}</div>`;
}

/* ---------- Home ---------- */
function monthName(k){ const [y,m]=k.split('-').map(Number); return MONTHS[m-1]; }
function viewHome4(){
  const p=P(), b=balances(), accs=p.accounts, u=state.ui, t0=todayStr(), mk=t0.slice(0,7), Mn=monthName(mk);
  const total=sum(accs,a=>b[a.id]||0);
  const hour=new Date().getHours();
  let h=`<div class="h4-head"><div class="h4-hi"><span>${greeting()}</span><b>${esc(p.name||'Masroof')}</b></div>
    <button class="w-sq" data-act="toggleHide" aria-label="${p.hide?'Show amounts':'Hide amounts'}">${ic(p.hide?'eye':'eye-slash')}</button>
    <button class="w-sq h4-logo" data-act="tab" data-v="settings" aria-label="Settings">${fortSVG(u.drop?'drop':'idle')}</button></div>`;
  u.drop=false;
  const n=accs.length, ci=((u.cardI||0)%n+n)%n;
  h+=`<div class="w-stagger">
    <div class="h4-total"><div><span class="lab">All accounts</span><div class="h4-amt">${nb(`<span data-cu="${total}" data-cu-from="${u.cuFrom||0}">${money(u.cuFrom!=null&&!p.hide?u.cuFrom:total)}</span>`)}<small>${esc(cur())}</small></div></div>
      <div class="h4-dots" dir="ltr">${accs.map((a,i)=>`<i class="${i===ci?'on':''}"></i>`).join('')}</div></div>
    <div class="w-stack" id="stack4">${stackHTML()}</div>
    ${orbCardHTML()}
    ${smsCard4()}
    ${allTx().length?catBarsHTML(mk,Mn):welcome4()}
    ${todayHTML()}
    ${mapTeaser4(mk)}
  </div>`;
  u.cuFrom=total;
  return h;
}
function stackHTML(){
  const accs=P().accounts, b=balances(), n=accs.length; if(!n) return '';
  const ci=((state.ui.cardI||0)%n+n)%n;
  return [2,1,0].filter(dp=>dp<n).map(dp=>{ const a=accs[(ci+dp)%n], bal=b[a.id]||0, cr=a.type==='card';
    return `<div class="w-bcard d${dp}" ${dp===0?`data-acc="${esc(a.id)}"`:''} style="background:${cardBg(accColor(a))}">
      <div class="bc-top"><span>${esc(a.bank||TYPE_LABEL[a.type]||'')}</span>${ic(TYPE_IC[a.type]||'bank')}</div>
      <span class="bcn4">${esc(a.name)}</span><i class="bc-chip"></i>
      <div class="bc-bot"><div>${nb(money(cr?-bal:bal))}<small>${cr?'owed':esc(cur())}</small></div>${a.last4?`<bdi dir="ltr" class="bc-l4">•••• ${esc(a.last4)}</bdi>`:''}</div></div>`; }).join('');
}
function orbCardHTML(){
  const st=todayStatus(), mk=todayStr().slice(0,7), Mn=monthName(mk);
  const spentM=summarize(txBetween(mk+'-01',todayStr())).spent;
  const lim=st.limit!=null&&P().limits.mode!=='off';
  const left=lim?Math.max(0,st.left):0;
  const fill=lim?Math.max(8,Math.round(Math.max(0,st.left)/(st.limit||1)*100)):Math.max(8,Math.min(100,Math.round(st.spent/(avgDay4()||1)*50)));
  return `<div class="w-card h4-orb">
    <div class="orb"><div class="liq" style="height:${Math.min(100,fill)}%"><div class="wv w1"><svg viewBox="0 0 400 14" preserveAspectRatio="none"><path d="M0 8Q50 0 100 8T200 8T300 8T400 8V14H0Z"/></svg></div><div class="wv w2"><svg viewBox="0 0 400 10" preserveAspectRatio="none"><path d="M0 5Q50 10 100 5T200 5T300 5T400 5V10H0Z"/></svg></div><div class="fl"></div></div>
      <div class="orb-t">${nb(money(lim?left:st.spent))}<span>${lim?'left today':'spent today'}</span></div></div>
    <div class="orb-r">
      <div><span>Spent today</span><div class="big">${nb(money(st.spent))}${lim?`<small>/ ${nb(money(st.limit))}</small>`:''}</div></div>
      <div><span>Spent in ${Mn}</span><div class="big">${nb(money(spentM))}</div></div>
      ${lim?(st.left>=0?`<span class="trend w-cyan">${ic('trend-down')}On track for ${Mn}</span>`:`<span class="trend w-mag">${ic('warning')}Over today’s limit</span>`)
        :`<button class="trend w-cyan linkish" data-act="goLimits">${ic('target')}Set a daily limit</button>`}
    </div></div>`;
}
function avgDay4(){ const a=ymd(addDays(new Date(),-30)); return summarize(txBetween(a,todayStr())).spent/30; }
function smsCard4(){
  const q=(P().smsQueue||[]).length, S=P().sms||{};
  if(q) return `<button class="w-card h4-sms" data-act="tab" data-v="sms"><span class="badge">${nb(q)}</span><span class="txt4"><b>${q===1?'1 bank message needs a look':`${q} bank messages need a look`}</b><small>Swipe right to confirm, left to skip</small></span>${chevI()}</button>`;
  if(S.setup&&(!S.last||Date.now()-S.last>12*3600000)) return `<button class="w-card h4-sms" data-act="smsFile"><span class="badge q">${ic('chat-text')}</span><span class="txt4"><b>Bring in your bank messages</b><small>Last import ${ago(S.last)} · only new ones are added</small></span>${chevI()}</button>`;
  return '';
}
function catBarsHTML(mk,Mn){
  const cs={}; for(const t of txBetween(mk+'-01',todayStr())) if(t.type==='expense') for(const x of allocs(t)) cs[x.catId]=(cs[x.catId]||0)+(t.refund?-x.amount:x.amount);
  const top=Object.keys(cs).filter(k=>cs[k]>0).sort((a,b)=>cs[b]-cs[a]).slice(0,5); if(!top.length) return '';
  const mx=cs[top[0]];
  return `<div class="w-card h4-cats"><div class="ch"><span>${Mn} by category</span><button class="linkish w-cyan" data-act="tab" data-v="tx">See all</button></div>
    <div class="cbs4">${top.map((k,i)=>{ const v=catVis(k); const amt=P().hide?'•••':(cs[k]>=10?Math.round(cs[k]):cs[k].toFixed(1)); return `<div class="cb4"><bdi dir="ltr">${amt}</bdi><i style="height:${(8+cs[k]/mx*72).toFixed(1)}%;background:${v.color};animation-delay:${(0.3+i*0.08).toFixed(2)}s"></i></div>`; }).join('')}</div>
    <div class="cbl4">${top.map(k=>{ const v=catVis(k); return `<div style="color:${v.color}">${v.html}<span>${esc(shortCat(findCat(k)))}</span></div>`; }).join('')}</div></div>`;
}
const timeOf=t=>{ const ms=t.at||(t.ts&&ymd(new Date(t.ts))===t.date?t.ts:null); if(!ms) return ''; const d=new Date(ms); return pad(d.getHours())+':'+pad(d.getMinutes()); };
function todayHTML(){
  const td=(state.months[todayStr().slice(0,7)]||[]).filter(t=>t.date===todayStr()).sort((a,b)=>(b.at||b.ts||0)-(a.at||a.ts||0));
  const spent=sum(td.filter(t=>t.type==='expense'),t=>t.refund?-myShare(t):myShare(t));
  return `<div class="w-card h4-today"><div class="ch"><span>Today</span>${nb(money(spent))}</div>
    ${td.length?td.map((t,i)=>{ const r=row4(t); return `<button class="tl" data-act="view" data-v="${esc(t.id)}"><span class="tm" dir="ltr">${timeOf(t)}</span>
      <span class="lin4"><i class="a" style="${i?'':'background:transparent'}"></i><i class="dt4" style="border-color:${r.color}"></i><i class="b" style="${i<td.length-1?'':'background:transparent'}"></i></span>
      <span class="tb"><span class="tt"><b>${esc(r.title)}</b><small>${esc(r.sub)}</small></span>${nb(`<span class="${r.cls}">${r.amt}</span>`)}</span></button>`; }).join('')
      :`<p class="w-muted emp4">Nothing yet today. Tap ＋ to add, or bring in your bank messages.</p>`}</div>`;
}
function mapTeaser4(mk){
  if(!allTx().some(t=>t.type==='expense')) return '';
  const pl=mapPlaces(mk), names=pl.slice(0,3).map(x=>geoName(x.name));
  const sub=names.length?(names.length===1?names[0]:names.slice(0,-1).join(', ')+' and '+names[names.length-1])+' this month':'Tap to see where you spent';
  return `<button class="h4-map" data-act="openMap"><span class="globe" aria-hidden="true"></span><span class="txt4"><b>Where you spent</b><small data-notr>${esc(sub)}</small></span></button>`;
}
function welcome4(){
  return `<div class="w-card h4-welcome"><b>Welcome to Masroof</b><p>Add your bank accounts, record your first expense with ＋, or look around with demo data. Everything stays encrypted on this iPhone.</p>
    <div class="act4"><button class="w-pill" data-act="tab" data-v="accounts">${ic('cards')}Add accounts</button><button class="w-pill card" data-act="demo">See a demo</button></div></div>`;
}
/* one row of a list, shared by Home's timeline and Activity */
function row4(t){
  let title,sub,amt,cls='';
  if(t.type==='transfer'){ title=t.note&&t.note!=='Transfer'?t.note:`${acctName(t.accountId)} → ${acctName(t.toAccountId)}`; sub=`Transfer · ${acctName(t.accountId)} → ${acctName(t.toAccountId)}`; amt=money(t.amount); }
  else if(t.type==='debt'){ const k=DEBT_KIND[t.debtKind]||[t.dir,t.dir==='give'?'Lent to':'Borrowed from']; title=`${k[1]} ${personName(t.personId)}`; sub=[t.note,acctName(t.accountId)].filter(Boolean).join(' · '); const out=t.dir==='give'; amt=(out?'−':'+')+money(t.amount); cls=out?'':'mi'; }
  else if(t.type==='invest'){ const hh=holding(t.investmentId); title=`${t.dir==='sell'?'Sold':'Invested in'} ${hh?hh.name:'investment'}`; sub=acctName(t.accountId); amt=(t.dir==='sell'?'+':'−')+money(t.amount); cls=t.dir==='sell'?'mi':''; }
  else { const c=cat(t.catId); const nc=t.lines&&t.lines.length?new Set(t.lines.map(l=>l.catId||t.catId)).size:0;
    title=t.note||t.item||c.name; sub=(nc>1?`${nc} categories`:shortCat(c)+(t.item&&t.note?' · '+t.item:''))+' · '+(t.split&&t.split.paidBy!=='me'?'paid by '+personName(t.split.paidBy):acctName(t.accountId));
    const v=t.type==='expense'&&t.split?myShare(t):t.amount; const isIn=t.type==='income'||t.refund; amt=(isIn?'+':'−')+money(v); cls=isIn?'mi':''; }
  return {title,sub,amt,cls,color:txVis(t).color};
}
/* the total counts up from 0 each time Home opens (1.1s, ease-out) */
function runCountUps4(){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-cu]').forEach(el=>{ const to=+el.dataset.cu, from=+el.dataset.cuFrom||0; if(reduce||from===to||P().hide){ el.textContent=money(to); return; }
    const t0=performance.now(); const step=t=>{ if(!state.profile) return; const k=Math.min(1,(t-t0)/1100), e=1-Math.pow(1-k,3); el.textContent=money(from+(to-from)*e); if(k<1) requestAnimationFrame(step); }; requestAnimationFrame(step); });
}
/* the card stack: swipe sideways (over 70px) or tap to bring the next card to the front */
let sDrag=null;
document.addEventListener('pointerdown',e=>{ const c=e.target.closest('#stack4 .w-bcard.d0'); if(!c) return; sDrag={x0:e.clientX,el:c,moved:false,dx:0}; c.classList.add('drag'); },{passive:true});
document.addEventListener('pointermove',e=>{ if(!sDrag) return; const dx=e.clientX-sDrag.x0; if(Math.abs(dx)>5) sDrag.moved=true; sDrag.dx=dx; if(sDrag.moved) sDrag.el.style.transform=`translateX(${dx}px) rotate(${dx/22}deg)`; },{passive:true});
function stackEnd(){ if(!sDrag) return; const d=sDrag; sDrag=null; d.el.classList.remove('drag');
  if(Math.abs(d.dx)>70) cycleCards(d.dx<0?1:-1,d.el); else if(!d.moved) cycleCards(1,d.el); else d.el.style.transform=''; }
document.addEventListener('pointerup',stackEnd); document.addEventListener('pointercancel',stackEnd);
function cycleCards(dir,el){ const n=P().accounts.length; if(n<2) return; el.style.transform=`translateX(${dir>0?-440:440}px) rotate(${dir>0?-20:20}deg)`;
  setTimeout(()=>{ state.ui.cardI=(state.ui.cardI||0)+dir; const s=$('#stack4'); if(s) s.innerHTML=stackHTML(); const ci=((state.ui.cardI%n)+n)%n; document.querySelectorAll('.h4-dots i').forEach((x,i)=>x.classList.toggle('on',i===ci)); },230); }


/* typing "karak 0.2 card" or "taxi 200 baht" in "What or where?" fills in the amount, account and currency */
function noteQuick4(inp){
  const d=draft; if(!d||d.amount||d.itemized||d.fx.on&&d.fx.orig||!(d.type==='expense'||d.type==='income')) return false;
  const q=parseQuick(inp.value); if(!(q.amount>0)) return false;
  d.note=q.desc; if(q.fx){ d.fx={on:true,cur:q.fx.cur,orig:String(q.fx.orig),rate:String(q.fx.rate),auto:true}; d._more=true; } else d.amount=String(q.amount);
  if(guessAcctFromText(inp.value)) d.accountId=q.accountId;
  if(q.tags.length) d.tags=q.tags.join(', ');
  if(!d.manual&&q.guess){ d.catId=q.guess.catId; d.item=q.guess.item||''; }
  setTimeout(renderTxDlg,0); return true; // not inside the blur that fired this
}
/* tapping the dimmed area closes a sheet; an unsaved new entry can be brought back with Undo */
$('#dlg').addEventListener('click',e=>{ const dl=e.currentTarget; if(e.target!==dl) return;
  if(dl.querySelector('.bl4')){ if(draft){ draft._billOpen=false; renderTxDlg(); } return; }
  const kept=dl.querySelector('.add4')&&draft&&!draft.id&&(draft.amount||draft.note||draft.fx.orig||draft.lines.length)?draft:null;
  dl.close();
  if(kept) toast('Not saved',{undo:()=>{ draft=kept; $('#dlg').innerHTML=''; renderTxDlg(); $('#dlg').showModal(); }}); });
/* ---------- Bank SMS review ----------
   Messages Masroof can't add on its own wait in a queue (saved, encrypted, with your profile) and are
   reviewed one card at a time: swipe right or tap ✓ to add it, left or × to skip it. */
const sureRow=r=>r.acctSure&&!r.unsure&&!r.dup&&r.amount>0;
const SMS_WHY={balance:'Picked by the balance in the message',learned:'The account you chose before for these messages',bank:'From the bank’s name in the message',kind:'Your only account of this kind',you:'You picked this account'};
function smsWhy(r){
  if(!r.acctSure) return r.nums&&r.nums.length?`A card ending ${r.nums[0]} Masroof hasn’t seen. Pick its account once and it’s remembered.`:'No card number in this message. Pick the account.';
  if(r.how==='number') return `Found by card ending ${(r.nums||[])[0]||''}`;
  return SMS_WHY[r.how]||'Found from the message';
}
// add newly read messages: the sure ones go straight in when "add by itself" is on, the rest wait for you
function queueSms(rows){
  const p=P(), Q=p.smsQueue||(p.smsQueue=[]), have=new Set(Q.map(r=>r.key)); const S=p.sms||(p.sms={});
  rows=rows.filter(r=>!have.has(r.key)); let auto=0;
  if(S.auto){ const ready=rows.filter(autoOK); if(ready.length){ auto=ready.length; rows=rows.filter(r=>!ready.includes(r)); addImported(ready,false,false,{keys:[...ready.map(r=>r.key),...(imp.skipKeys||[])],quiet:!!rows.length}); } }
  for(const r of rows){ delete r.pairedWith; Q.push(r); }
  rememberSeen(imp.skipKeys||[]); persist('profile');
  if(rows.length){ const u=state.ui; u.smsSeen=true; u.smsLoading=true; setTimeout(()=>{ u.smsLoading=false; if(u.tab==='sms') render(); },1500); if(auto) toast(`${auto} added automatically · ${rows.length} to check`); if(state.ui.tab!=='sms') go4('sms'); else render(); }
  return {auto,queued:rows.length};
}
function viewSms4(){
  const u=state.ui, Q=P().smsQueue||[], r=Q[0], sure=Q.filter(sureRow);
  let h=`<div class="w-push-h"><button class="w-round" data-act="back" aria-label="Back">${backI()}</button><span class="t">Bank messages</span>${r&&sure.length&&!u.smsLoading?`<button class="w-pill card" data-act="smsSure">Confirm ${sure.length}</button>`:''}</div>`;
  if(r&&u.smsLoading) return h+`<div class="s4-load"><div class="lg">${fortSVG('loader')}</div><span>Reading your bank messages</span>
    <div class="s4-snd">${Q.slice(0,4).map((x,i)=>`<div style="animation-delay:${(0.15+i*0.25).toFixed(2)}s">${ic('chat-text')}<b>${esc(x.sender||(acct(x.accountId)||{}).bank||'Bank SMS')}</b><small>${esc(dayLabel(x.date))}</small></div>`).join('')}</div></div>`;
  if(!r){
    if(u.smsDone) return h+`<div class="s4-done"><div class="lg">${fortSVG('drop')}</div><b>All caught up</b><span>${P().accounts.some(a=>a.bankBal)?'Your balances match your banks.':'Nothing left to check.'}</span>
      <button class="w-btn" data-act="tab" data-v="home">Back to Home</button><button class="linkish w-cyan" data-act="smsFile">${ic('tray-arrow-down')}Bring in more messages</button></div>`;
    const S=P().sms||{};
    return h+`<div class="s4-empty">${ic('chat-text')}<b>No bank messages waiting</b><span>${S.setup?`Your Shortcuts automation saves them to iCloud Drive › Shortcuts › Masroof. Last import ${S.last?ago(S.last):'never'}.`:'Bring in the SMS your banks send — Masroof reads the amount, the account, money in or out and the balance.'}</span>
      <button class="w-btn" data-act="smsFile">${ic('tray-arrow-down')}Choose the bank SMS file</button><button class="w-btn sec" data-act="import">${ic('clipboard-text')}Paste messages</button><button class="linkish w-cyan" data-act="smsGuide">${ic('info')}${S.setup?'Automatic saving':'Set up automatic saving'}</button></div>`;
  }
  const done=u.smsDone||0, total=Q.length+done;
  const out=r.type==='expense'&&!r.refund, isT=r.type==='transfer';
  const amtCls=isT?'':out?'w-mag':'w-cyan';
  const types=[['out','Money out'],['in','Money in'],...(P().accounts.length>1?[['tr','Transfer']]:[])], tk=isT?'tr':out?'out':'in';
  const chips=(field,sel)=>`<div class="w-chips s4-acc">${[...P().accounts.filter(a=>a.id===sel),...P().accounts.filter(a=>a.id!==sel)].map(a=>`<button data-act="smsAcct" data-field="${field}" data-v="${esc(a.id)}" aria-pressed="${sel===a.id}"><i style="background:${cardBg(accColor(a))}"></i>${esc(a.name)}</button>`).join('')}</div>`;
  let cats='';
  if(!isT){ const all=P().categories[r.type==='income'?'income':'expense']; let list=all;
    if(!u.smsAllCats){ list=[findCat(r.catId),...all.filter(c=>c.id!==r.catId)].filter(Boolean).slice(0,6); }
    cats=`<div class="s4-sec"><span class="lab">Category</span><div class="s4-cats">${list.map(c=>{ const v=catVis(c.id); return `<button data-act="smsCat" data-v="${esc(c.id)}" aria-pressed="${r.catId===c.id}"><span style="color:${r.catId===c.id?'inherit':v.color}">${v.html}</span>${esc(shortCat(c))}</button>`; }).join('')}${u.smsAllCats?'':`<button data-act="smsAllCats">${ic('caret-down')}More</button>`}</div></div>`; }
  h+=`<div class="s4-bars">${total<=14?[...Array(total)].map((_,i)=>`<i class="${i<done?'on':i===done?'cur':''}"></i>`).join(''):`<i class="on" style="flex:${done}"></i><i style="flex:${total-done}"></i>`}</div>
  <div class="s4-pos">Message ${done+1} of ${total}</div>
  <div class="s4-wrap"><div class="s4-under"></div><div class="s4-card" id="smsCard">
    <span class="s4-stamp yes">Confirm</span><span class="s4-stamp no">Skip</span>
    <div class="s4-from"><b>${esc(r.sender||(acct(r.accountId)||{}).bank||'Bank SMS')}</b><span>${esc(dayLabel(r.date))}${r.at?' · '+esc(timeOf({at:r.at,date:r.date})):''}</span></div>
    ${r.text?`<div class="s4-text" dir="auto">${esc(r.text)}</div>`:''}
    <div class="s4-amt"><span>${esc(r.merchant||'Transaction')}</span><div>${nb(`<span class="${amtCls}">${isT?'':out?'−':'+'}${money(r.amount,{show:true})}</span>`)}<small>${esc(cur())}</small></div>
      ${r.fx?`<p>${fxLine(r.fx,r.ctry)}${r.fxEst?' · <span>converted at today’s rate</span>':''}</p>${r.fxEst?`<label class="s4-fx"><span>What your bank charged in ${esc(cur())}</span><input class="inp" inputmode="decimal" data-smsamt value="${esc(String(r.amount))}"></label>`:''}`:''}
      ${r.dup?`<p class="w-mag">${ic('warning')}<span>Looks already recorded — skip it if it is</span></p>`:''}</div>
    <div class="w-seg s4-dir ${tk}">${types.map(([k,l])=>`<button data-act="smsType" data-v="${k}" aria-pressed="${tk===k}">${l}</button>`).join('')}</div>
    <div class="s4-sec"><span class="lab">${isT?'From':'Account'}</span>${chips('accountId',r.accountId)}${isT?`<span class="lab">To</span>${chips('toAccountId',r.toAccountId)}`:''}
      <div class="s4-why ${r.acctSure?'w-cyan':'w-mag'}">${ic(r.acctSure?'check-circle':'warning')}<span>${esc(smsWhy(r))}</span></div>${r.unsure?`<div class="s4-why w-mag">${ic('warning')}<span>Money in or out isn’t clear from this message — check it above.</span></div>`:''}</div>
    ${cats}
    ${r.bal!=null?`<div class="s4-bal"><span>Bank balance after this</span>${nb(money(r.bal,{show:true}))}</div>`:''}
  </div></div>
  <div class="s4-btns"><button class="no" data-act="smsNo" aria-label="Skip">${ic('x')}</button><span>Swipe right to confirm, left to skip</span><button class="yes" data-act="smsYes" aria-label="Confirm">${ic('check')}</button></div>`;
  return h;
}
function smsFly(ok){ const c=$('#smsCard'); if(c){ c.style.transition='transform .28s ease-in,opacity .28s'; c.style.transform=`translateX(${(ok?1:-1)*(RTL()?-1:1)*480}px) rotate(${ok?18:-18}deg)`; c.style.opacity='0'; } buzz(ok?12:6); setTimeout(()=>smsDecide(ok),c?240:0); }
function smsDecide(ok){
  const p=P(), Q=p.smsQueue||[], r=Q.shift(); if(!r) return; const u=state.ui; u.smsDone=(u.smsDone||0)+1; u.smsAllCats=false;
  const back=()=>{ (p.smsQueue||(p.smsQueue=[])).unshift(r); u.smsDone=Math.max(0,u.smsDone-1); p.smsSeen=(p.smsSeen||[]).filter(k=>k!==r.key); persist('profile'); };
  if(ok){ r.on=true; if(!Q.length) u.drop=true; addImported([r],false,true,{keys:[r.key],undo:back}); }
  else { rememberSeen([r.key]); persist('profile'); toast('Skipped',{undo:()=>{ back(); render(); }}); render(); }
}
// drag the card: the Confirm / Skip stamp fades in by 90px; let go past 90px and it flies off
let smsDrag=null;
document.addEventListener('pointerdown',e=>{ const c=e.target.closest('#smsCard'); if(!c||e.target.closest('button,input,select,textarea,.s4-acc')) return; smsDrag={x0:e.clientX,y0:e.clientY,el:c,dx:0,on:false}; },{passive:true});
document.addEventListener('pointermove',e=>{ const d=smsDrag; if(!d) return; const dx=e.clientX-d.x0, dy=e.clientY-d.y0;
  if(!d.on){ if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){ smsDrag=null; return; } if(Math.abs(dx)<8) return; d.on=true; d.el.style.transition='none'; }
  d.dx=dx; d.el.style.transform=`translateX(${dx}px) rotate(${dx/20}deg)`; const k=Math.min(1,Math.abs(dx)/90), right=RTL()?dx<0:dx>0;
  d.el.querySelector('.s4-stamp.yes').style.opacity=right?k:0; d.el.querySelector('.s4-stamp.no').style.opacity=right?0:k; },{passive:true});
function smsDragEnd(){ const d=smsDrag; smsDrag=null; if(!d||!d.on) return; const right=RTL()?d.dx<0:d.dx>0;
  if(Math.abs(d.dx)>90){ d.el.style.transition='transform .28s ease-in,opacity .28s'; d.el.style.transform=`translateX(${d.dx>0?480:-480}px) rotate(${d.dx>0?18:-18}deg)`; d.el.style.opacity='0'; buzz(right?12:6); setTimeout(()=>smsDecide(right),240); }
  else { d.el.style.transition='transform .3s cubic-bezier(.3,1.4,.5,1)'; d.el.style.transform=''; d.el.querySelectorAll('.s4-stamp').forEach(s=>s.style.opacity=0); } }
document.addEventListener('pointerup',smsDragEnd); document.addEventListener('pointercancel',smsDragEnd);
function smsEdit(fn){ const r=(P().smsQueue||[])[0]; if(!r) return; fn(r); persist('profile'); const sc=window.scrollY; render(); window.scrollTo(0,sc); }
/* ---------- Wealth ---------- */
const GOAL_IC={car:'car-profile',home:'house-line',hajj:'mosque',wedding:'heart',travel:'airplane-tilt',study:'graduation-cap',emergency:'lifebuoy',other:'sparkle'};
const INV_IC={stocks:'chart-line-up',funds:'chart-pie-slice',gold:'coins',crypto:'currency-circle-dollar',property:'buildings',deposit:'vault',business:'storefront',other:'sparkle'};
function viewWealth(){
  const w=wealth(), cashAll=w.cash+w.savings, hs=P().investments.map(h=>({h,s:holdingStats(h)}));
  const parts=[[cashAll,'var(--cyan)'],[w.inv,'var(--yel)'],[w.owed,'var(--mag)']].filter(x=>x[0]>0), whole=sum(parts,x=>x[0])||1;
  const leg=(c,l,v)=>`<span><i style="background:${c}"></i>${l} ${nb(v)}</span>`;
  let h=`<div class="w-title">Wealth</div>
  <div class="w-card wl4-nw"><span class="lab">Net worth</span><div class="amt">${nb(`<span data-cu="${w.total}" data-cu-from="0">${money(w.total)}</span>`)}<small>${esc(cur())}</small></div>
    ${parts.length?`<div class="nwb">${parts.map(([v,c],i)=>`<i style="flex:${(v/whole).toFixed(4)};background:${c};animation-delay:${(0.2+i*0.15).toFixed(2)}s"></i>`).join('')}</div>`:''}
    <div class="leg">${leg('var(--cyan)','Banks & cash',money(cashAll))}${w.inv?leg('var(--yel)','Investments',money(w.inv)):''}${w.owed?leg('var(--mag)','Owed to you',money(w.owed)):''}${w.owe?leg('var(--muted)','You owe','−'+money(w.owe)):''}</div></div>
  <div class="w-sec"><h2>Savings goals</h2><button class="w-pill" data-act="goalNew">${ic('plus')}New goal</button></div>`;
  const goals=P().goals;
  h+=goals.length?`<div class="wl4-goals">${goals.map(g=>{ const saved=goalSaved(g), pct=g.target>0?Math.min(100,saved/g.target*100):0, plan=goalPlanText(g);
      const m=goalMath(g.target,saved,g.date,g.plan&&g.plan.amount,g.plan&&g.plan.freq);
      const kept=goalCount(g)==='hand'?'Kept at home or by hand':`Kept in ${acctName(g.accountId)}${goalCount(g)==='deposits'?' · only money put in for it':''}`;
      const proj=pct>=100?'Reached 🎉':m.reach?`Reaches it around ${fmtD(m.reach,{month:'short',year:'numeric'})}`:g.date&&m.perMonth?`Save ${money(m.perMonth)} a month to reach it by ${fmtD(g.date,{month:'short',year:'numeric'})}`:`${money(m.left)} to go`;
      return `<div class="wl4-g"><button class="hd" data-act="goal" data-v="${esc(g.id)}"><span class="gi">${ic(GOAL_IC[g.kind]||'target')}</span><span class="nm"><b>${esc(g.name)}</b><small>${esc(g.note||goalKind(g)[2])}</small></span>${nb(Math.round(pct)+'%')}</button>
        <div class="pr"><i style="width:${pct.toFixed(1)}%"></i></div>
        <div class="am">${nb(money(saved))}<span>of ${nb(money(g.target))}</span></div>
        <div class="gln"><span>${ic('bank')}${esc(kept)}</span>${plan?`<span>${ic('repeat')}${esc(plan)}</span>`:''}<span class="b">${ic('calendar-check')}${esc(proj)}</span></div>
        <button class="w-btn sec" data-act="goal" data-v="${esc(g.id)}">Add money now</button></div>`; }).join('')}</div>`
    :`<div class="w-card wl4-empty">${ic('target')}<span>A car, Hajj, a wedding, an emergency fund — set a target and Masroof works out how much to put aside.</span></div>`;
  h+=`<div class="w-sec"><h2>Investments</h2><button class="w-pill card" data-act="newHolding">${ic('plus')}Add</button></div>`;
  h+=hs.length?`<div class="w-group wl4-inv">${hs.map(({h:x,s})=>`<button class="row" data-act="holding" data-v="${esc(x.id)}"><span class="w-tile" style="color:var(--yel);background:var(--card2)">${ic(INV_IC[x.type]||'sparkle')}</span><span class="nm"><b>${esc(x.name)}</b><small>${esc(INV_TYPES[x.type]||x.type)}${x.units?` · ${+x.units} units`:''}</small></span><span class="v">${nb(money(s.value))}${nb(`<span class="${s.gain>=0?'w-cyan':'w-mag'}">${money(s.gain,{sign:true})} (${s.pct.toFixed(1)}%)</span>`)}</span></button>`).join('')}</div>`
    :`<div class="w-card wl4-empty">${ic('chart-line-up')}<span>Stocks, funds, gold, crypto, property or deposits. Record what you put in and update the value — Masroof shows your gain or loss.</span></div>`;
  h+=`<div class="w-sec"><h2>Accounts</h2><button class="w-pill card" data-act="add" data-preset="transfer">${ic('arrows-left-right')}Move money</button></div>
    <div class="w-group"><button class="y4-row" data-act="tab" data-v="accounts">${ic('cards')}<span>Accounts &amp; cards <small>${P().accounts.length} · ${nb(money(cashAll))}</small></span>${chevI()}</button></div>`;
  return h;
}

/* ---------- a new savings goal, in four steps ---------- */
function goalNewStart(){ const u=state.ui; const sal=(P().accounts.find(a=>hasRole(a,'salary'))||P().accounts[0]||{}).id||'';
  u.gn={step:1,dir:1,kind:'',name:'',note:'',target:'',months:24,date:'',accountId:(P().accounts.find(a=>hasRole(a,'savings'))||{}).id||'',count:'deposits',saved:'',freq:'monthly',amt:'',amtSet:false,source:'account',fromId:sal,auto:true};
  go4('goalnew'); }
function gnDate(g){ if(g.months==='custom') return g.date; if(!g.months) return ''; const d=new Date(); d.setMonth(d.getMonth()+g.months); return ymd(d); }
function gnSaved(g){ return g.accountId&&g.count==='balance'?(balances()[g.accountId]||0):num(g.saved); }
function gnSuggest(g){ const m=goalMath(num(g.target),gnSaved(g),gnDate(g)); const per=g.freq==='weekly'?m.perWeek:g.freq==='yearly'?m.perYear:m.perMonth; return per>0?String(Math.ceil(per)):''; }
function gnHint(g){
  const target=num(g.target); if(!(target>0)) return '';
  const date=gnDate(g), saved=gnSaved(g), amt=g.freq==='none'?0:num(g.amt||gnSuggest(g)), m=goalMath(target,saved,date,amt,g.freq);
  if(m.left<=0) return 'Already reached 🎉';
  if(g.step<=2&&date) return `To reach ${money(target)} by ${fmtD(date,{month:'short',year:'numeric'})}, save about ${money(m.perMonth)} a month.`;
  if(g.step===3) return g.accountId?(g.count==='balance'?`Everything in ${acctName(g.accountId)} counts — best when the account is only for this goal.`:`Only the deposits you make for it count, so ${acctName(g.accountId)} can hold other money too.`):'Masroof keeps the total for you — add money to it whenever you put some aside.';
  if(m.reach) return `${money(amt)} ${FREQ_WORD[g.freq]} reaches ${money(target)} around ${fmtD(m.reach,{month:'short',year:'numeric'})}${date&&m.reach>date?' — after your date, so save a little more':''}.`;
  return `${money(m.left)} to go.`;
}
function viewGoalNew4(){
  const u=state.ui, g=u.gn; if(!g){ goalNewStart(); return ''; }
  const titles=['What are you saving for?','How much, and by when?','Where will the money be kept?','How will you save?'];
  const ck=on=>ic(on?'check-circle-fill':'circle');
  let body='';
  if(g.step===1) body=`<div class="gn-kinds">${GOAL_KINDS.map(([k,,l])=>`<button data-act="gnSet" data-v="kind:${k}" aria-pressed="${g.kind===k}">${ic(GOAL_IC[k])}${l}</button>`).join('')}</div>
    <label class="gn-f"><span>Name it <small>(optional)</small></span><input class="inp" data-gn="name" value="${esc(g.name)}" placeholder="e.g. Land Cruiser"></label>
    <label class="gn-f"><span>Details <small>(optional)</small></span><input class="inp" data-gn="note" value="${esc(g.note)}" placeholder="e.g. 30% down payment, summer 2027"></label>`;
  else if(g.step===2){ const now=new Date(); const tiles=[12,24,36,48].map(n=>{ const d=new Date(now.getFullYear(),now.getMonth()+n,1); return `<button data-act="gnSet" data-v="months:${n}" aria-pressed="${g.months===n}">${n} months<small>${monS(d.getMonth())} ${d.getFullYear()}</small></button>`; }).join('');
    body=`<label class="gn-f"><span>Target amount</span><div class="gn-amt"><input dir="ltr" inputmode="decimal" data-gn="target" value="${esc(g.target)}" placeholder="0"><small>${esc(cur())}</small></div></label>
      <div class="gn-f"><span>Reach it by</span><div class="gn-months">${tiles}
        <label class="gn-other${g.months==='custom'?' on':''}">${g.months==='custom'&&g.date?shortD(g.date)+' '+g.date.slice(0,4):'Another date'}<input type="date" data-gn="date" value="${esc(g.date)}"></label><button data-act="gnSet" data-v="months:0" aria-pressed="${!g.months}">No date</button></div></div>`; }
  else if(g.step===3){ const b=balances();
    body=`<div class="gn-rows">${P().accounts.map(a=>`<button data-act="gnSet" data-v="accountId:${esc(a.id)}" aria-pressed="${g.accountId===a.id}"><i class="cc" style="background:${cardBg(accColor(a))}"></i><span><b>${esc(a.name)}</b>${nb(money(b[a.id]||0))}</span>${ck(g.accountId===a.id)}</button>`).join('')}
      <button data-act="gnSet" data-v="accountId:" aria-pressed="${!g.accountId}"><i class="cc hand">${ic('hand-coins')}</i><span><b>Not in a bank</b><small>At home or with family</small></span>${ck(!g.accountId)}</button></div>
      ${g.accountId?`<span class="gn-lab">What counts toward the goal?</span><div class="gn-rows">
        <button data-act="gnSet" data-v="count:balance" aria-pressed="${g.count==='balance'}"><span><b>Whole balance counts</b><small>Everything in this account is for the goal</small></span>${ck(g.count==='balance')}</button>
        <button data-act="gnSet" data-v="count:deposits" aria-pressed="${g.count==='deposits'}"><span><b>Only money I put in for it</b><small>Masroof tracks each deposit you mark for it</small></span>${ck(g.count==='deposits')}</button></div>`:''}
      ${!g.accountId||g.count==='deposits'?`<label class="gn-f"><span>Already saved for it <small>(${esc(cur())})</small></span><input class="inp" inputmode="decimal" data-gn="saved" value="${esc(g.saved)}" placeholder="0"></label>`:''}`; }
  else { if(!g.amtSet) g.amt=gnSuggest(g);
    const per=g.freq==='weekly'?'week':g.freq==='yearly'?'year':'month', others=P().accounts.filter(a=>a.id!==g.accountId);
    body=`<div class="w-seg">${[['weekly','Weekly'],['monthly','Monthly'],['yearly','Yearly'],['none','No plan']].map(([v,l])=>`<button data-act="gnSet" data-v="freq:${v}" aria-pressed="${g.freq===v}">${l}</button>`).join('')}</div>
    ${g.freq!=='none'?`<label class="gn-f"><span>Each ${per}</span><div class="gn-amt sm"><input dir="ltr" inputmode="decimal" data-gn="amt" value="${esc(g.amt)}" placeholder="0"><small>${esc(cur())}</small></div></label>
      <div class="gn-f"><span>Where the money comes from</span><div class="gn-rows">${others.map(a=>`<button data-act="gnSet" data-v="from:${esc(a.id)}" aria-pressed="${g.source==='account'&&g.fromId===a.id}">${ic(TYPE_IC[a.type]||'bank')}<span><b>${esc(a.name)}</b></span>${ck(g.source==='account'&&g.fromId===a.id)}</button>`).join('')}
        <button data-act="gnSet" data-v="source:cdm" aria-pressed="${g.source==='cdm'}">${ic('bank')}<span><b>Cash deposit machine</b></span>${ck(g.source==='cdm')}</button>
        <button data-act="gnSet" data-v="source:hand" aria-pressed="${g.source==='hand'}">${ic('hand-coins')}<span><b>I’ll add it by hand</b></span>${ck(g.source==='hand')}</button></div></div>
      ${g.accountId&&g.source!=='hand'?`<button class="gn-auto" data-act="gnSet" data-v="auto:${g.auto?0:1}"><span>Record each deposit automatically<small>On the day, as a ${g.source==='cdm'?'cash deposit':'transfer'} into ${esc(acctName(g.accountId))}</small></span><i class="w-tog${g.auto?' on':''}"><i></i></i></button>`:''}`:''}`; }
  const hint=gnHint(g);
  return `<div class="w-push-h"><button class="w-round" data-act="gnBack" aria-label="Back">${backI()}</button><span class="t">New goal</span><span class="s">Step ${g.step} / 4</span></div>
    <div class="s4-bars gn-bars">${[1,2,3,4].map(i=>`<i class="${i<=g.step?'on':''}"></i>`).join('')}</div>
    <div class="gn-step ${g.dir<0?'back':''}" id="gnStep"><h2 class="gn-t">${titles[g.step-1]}</h2>${body}</div>
    <div class="gn-foot"><div class="gn-hint" id="gnHint"${hint?'':' hidden'}>${ic('lightbulb')}<span>${hint}</span></div><p class="err" id="gnErr"></p><button class="w-btn" data-act="gnNext">${g.step<4?'Continue':'Create goal'}</button></div>`;
}
function gnNext(){
  const u=state.ui, g=u.gn, err=m=>{ const e=$('#gnErr'); if(e) e.textContent=m; buzz(20); };
  if(g.step===1&&!g.kind) return err('Pick what you’re saving for.');
  if(g.step===2&&!(num(g.target)>0)) return err('Enter a target amount.');
  if(g.step===2&&g.months==='custom'&&!g.date) return err('Pick a date, or choose one of the options.');
  if(g.step<4){ g.step++; g.dir=1; if(g.step===4&&g.fromId===g.accountId) g.fromId=(P().accounts.find(a=>a.id!==g.accountId)||{}).id||''; if(g.step===4&&!P().accounts.some(a=>a.id!==g.accountId)&&g.source==='account') g.source='hand'; render(); window.scrollTo(0,0); return; }
  fd={kind:'goal',id:null,gkind:g.kind,name:g.name||goalKind({kind:g.kind})[2],note:g.note,target:g.target,date:gnDate(g),accountId:g.accountId,count:g.accountId?g.count:'deposits',saved:g.saved,
    amt:g.freq==='none'?'':g.amt,freq:g.freq,start:todayStr(),source:g.source,fromId:g.fromId,auto:g.auto};
  u.tab='wealth'; u.back=null; u.gn=null; u.cuFrom=0; saveGoal(); window.scrollTo(0,0);
}

/* ---------- Friends ---------- */
function viewPeople(){
  const pb=peopleBalances(); const ppl=P().people.slice().sort((a,b)=>Math.abs(pb[b.id]||0)-Math.abs(pb[a.id]||0));
  const owed=sum(Object.values(pb).filter(v=>v>0)), owe=-sum(Object.values(pb).filter(v=>v<0));
  return `<div class="w-push-h"><button class="w-round" data-act="back" aria-label="Back">${backI()}</button><span class="t">Friends</span></div>
  <div class="fr4-sum"><div><span>Owed to you</span>${nb(`<span class="w-cyan">${money(owed)}</span>`)}</div><div><span>You owe</span>${nb(`<span class="w-mag">${money(owe)}</span>`)}</div></div>
  ${ppl.length?`<div class="w-group fr4-list tx-group">${ppl.map(p=>{ const v=pb[p.id]||0, due=personDue(p.id), n=personTx(p.id).length, st=Math.abs(v)<10**-dec();
    return `<div class="swipe" data-id="${esc(p.id)}" data-right="settle"><div class="acts"><div><button class="dup" data-act="rowNoop" tabindex="-1">${ic('check')}<span>Settle</span></button></div><div><button class="edit" data-act="pSplitQuick" data-v="${esc(p.id)}" tabindex="-1">${ic('users-three')}<span>Split</span></button><button class="del" style="background:var(--yel);color:var(--onyel)" data-act="pRemindQuick" data-v="${esc(p.id)}" tabindex="-1">${ic('bell-ringing')}<span>Remind</span></button></div></div>
      <button class="tx fr4-row" data-act="person" data-v="${esc(p.id)}"><span class="av" style="background:${avatarColor(p.id)}">${esc((p.name[0]||'?').toUpperCase())}</span><span class="nm"><b>${esc(p.name)}</b><small>${due?`<span class="${due.late?'w-mag':''}">${dueText(due)}</span> · `:''}${n} shared</small></span>
        <span class="v ${st?'':v>0?'w-cyan':'w-mag'}"><small>${st?'':v>0?'Owes you':'You owe'}</small>${st?'<b>Settled</b>':nb(money(Math.abs(v)))}</span></button></div>`; }).join('')}</div>
    <p class="hint fr4-tip">Swipe a name right to settle up, left to split or remind.</p>`:`<div class="w-card wl4-empty">${ic('users-three')}<span>Add the friends and family you share costs with.</span></div>`}
  <div class="fr4-add"><input class="inp" id="newPerson" placeholder="Add a friend’s name" autocomplete="off"><button class="w-pill" data-act="addPerson">${ic('plus')}Add</button></div>
  <button class="fr4-split" data-act="add" data-preset="split">${ic('users-three')}Split a bill</button>
  <button class="fr4-split sec" data-act="add" data-preset="lend">${ic('hand-coins')}Lend or borrow</button>`;
}
function openPerson(id){
  const p=person(id); if(!p) return; const v=peopleBalances()[id]||0; const list=personTx(id), st=Math.abs(v)<10**-dec(), due=personDue(id);
  fd={kind:'person',id,name:p.name,phone:p.phone||''};
  sheet4(`<div class="fr4-hero"><span class="av" style="background:${avatarColor(id)}">${esc((p.name[0]||'?').toUpperCase())}</span><b>${esc(p.name)}</b>
      <span class="${st?'w-muted':v>0?'w-cyan':'w-mag'}">${st?'All settled':v>0?`${esc(p.name)} owes you`:`You owe ${esc(p.name)}`}</span>${st?'':nb(`<span class="${v>0?'w-cyan':'w-mag'}">${money(Math.abs(v))}</span>`)}
      ${due?`<span class="fr4-due${due.late?' w-mag':''}">${ic(due.late?'warning':'calendar-blank')}${dueText(due)}</span>`:''}</div>
    <div class="fr4-acts">${v>0?`<button class="w-btn cy" data-act="pRemind">${ic('whatsapp-logo')}Send WhatsApp reminder</button><button class="w-btn sec" data-act="pSettle" data-v="in">Mark as settled</button>`:''}${v<0?`<button class="w-btn" data-act="pSettle" data-v="out">I paid them back</button>`:''}
      <div class="fr4-more"><button class="w-chip" data-act="pLend">${ic('arrow-up-right')}Lend</button><button class="w-chip" data-act="pBorrow">${ic('arrow-down-left')}Borrow</button><button class="w-chip" data-act="pSplit">${ic('users-three')}Split a bill</button></div></div>
    <div class="add4-lab">History</div>${list.length?`<div class="w-group fr4-hist">${list.map(t=>{ const e=personEffect(t,id); return `<button class="row" data-act="edit" data-v="${esc(t.id)}"><span class="nm"><b>${esc(t.type==='debt'?(DEBT_KIND[t.debtKind]||['','Money'])[1].replace(':',''):t.note||t.item||cat(t.catId).name)}</b><small>${shortD(t.date)}${t.split?' · bill '+money(t.amount):''}${t.type==='debt'&&t.note?' · '+esc(t.note):''}</small></span>${nb(`<span class="${e>0?'w-cyan':'w-mag'}">${e>0?'+':'−'}${money(Math.abs(e))}</span>`)}</button>`; }).join('')}</div><p class="hint" style="margin:8px 20px 0">+ means they owe you more, − means less.</p>`:'<p class="hint" style="margin:0 20px">Nothing shared yet.</p>'}
    <div class="add4-lab">Name</div><div class="fr4-name"><input class="inp" value="${esc(fd.name)}" data-fd="name"><button class="w-chip" data-act="pSave">Save</button><button class="w-chip del" data-act="pDelete" aria-label="Delete">${ic('trash')}</button></div>`,'','fr4');
}

/* ---------- Accounts & cards ---------- */
function viewAccounts4(){
  const b=balances();
  return `<div class="w-push-h"><button class="w-round" data-act="back" aria-label="Back">${backI()}</button><span class="t">Accounts</span><button class="w-pill" data-act="editAcct" data-v="">${ic('plus')}Add account</button></div>
  <div class="ac4-list">${P().accounts.map(a=>{ const bal=b[a.id]||0, cr=a.type==='card', nums=acctNums(a);
    const diff=a.bankBal?round(a.bankBal.v-bal+sum(allTx().filter(t=>t.date>a.bankBal.date),t=>acctEffect(t,a.id)),dec()):null;
    const note=a.bankBal?(Math.abs(diff)<10**-dec()?`<small class="w-cyan">${ic('check')}Matches bank</small>`:`<small class="w-mag">${ic('warning')}Differs from bank</small>`):cr&&a.limit?`<small>${esc('of '+money(a.limit)+' limit')}</small>`:'';
    return `<button class="ac4-row" data-act="accView" data-v="${esc(a.id)}"><span class="cc" style="background:${cardBg(accColor(a))}"><i></i></span><span class="nm"><b>${esc(a.name)}</b><small>${esc([a.bank&&a.bank!==a.name&&!['Cash','Other'].includes(a.bank)?a.bank:'',TYPE_LABEL[a.type]||a.type].filter(Boolean).join(' · '))}${nums.length?` · <bdi dir="ltr">•••• ${esc(nums[0])}</bdi>`:''}</small></span>
      <span class="v">${nb(`<span class="${cr&&bal<0?'w-mag':''}">${cr?money(-bal):money(bal)}</span>`)}${cr?'<small>owed</small>':''}${note}</span></button>`; }).join('')}</div>
  <p class="hint ac4-tip">Tap a card to set its current balance or details. Adding an account never changes the others.</p>
  <div class="w-group" style="margin-top:12px"><button class="y4-row" data-act="acctBulk">${ic('list-checks')}<span>Add several at once</span>${chevI()}</button><button class="y4-row" data-act="tab" data-v="sms">${ic('chat-text')}<span>Bank messages</span>${chevI()}</button></div>`;
}
function renderAcctEditor(isEdit){
  const f=fd, banks=BANKS.filter(b=>b!=='Cash'&&b!=='Other'), other=f.bank&&!banks.includes(f.bank)&&f.bank!=='Cash';
  const old=$('#dlg .ae4 .body'), sc=old?old.scrollTop:0, cr=f.type==='card';
  sheet4(`<div class="bl4-h" style="padding:14px 20px 4px"><h3>${isEdit?'Edit account':'Add account'}</h3></div>
    <div class="ae4-pv" id="accPreview" style="background:${cardBg(f.color)}"><div class="t"><span id="pvBank">${esc(f.bank||TYPE_LABEL[f.type])}</span>${ic(TYPE_IC[f.type]||'bank')}</div><span class="nm" id="pvName">${esc(f.name||'Account name')}</span><i class="chip"></i>
      <div class="b"><div><bdi dir="ltr" class="n abal">${money(previewBal(f),{show:true})}</bdi><small>${cr?'owed':esc(cur())}</small></div><bdi dir="ltr" id="pvL4">${f.last4?'•••• '+esc(f.last4):''}</bdi></div></div>
    <div class="add4-lab">Type</div><div class="w-chips ae4-pills">${Object.entries(TYPE_LABEL).map(([v,l])=>`<button class="w-chip" data-act="accType" data-v="${v}" aria-pressed="${f.type===v}">${ic(TYPE_IC[v]||'bank')}${l}</button>`).join('')}</div>
    ${f.type!=='cash'?`<div class="add4-lab">Bank</div><div class="ae4-banks">${banks.map(b=>`<button class="w-chip" data-act="accBank" data-v="${esc(b)}" aria-pressed="${f.bank===b}">${esc(b)}</button>`).join('')}<button class="w-chip" data-act="accBank" data-v="__other" aria-pressed="${!!other||f._otherBank}">Other</button></div>
      ${other||f._otherBank?`<input class="inp ae4-in" value="${esc(other?f.bank:'')}" placeholder="Bank name" data-fd="bank" data-live>`:''}`:''}
    <div class="ae4-two"><label><span>Name you’ll recognise</span><input class="inp" value="${esc(f.name)}" placeholder="e.g. Salary" data-fd="name" data-live></label>
      <label><span>Last 4 digits</span><input class="inp" inputmode="numeric" maxlength="4" value="${esc(f.last4||'')}" placeholder="1234" data-fd="last4" data-live dir="ltr"></label></div>
    <label class="ae4-bal"><span>${cr?'Amount you owe now':'Current balance'}</span><div class="gn-amt sm"><input dir="ltr" inputmode="decimal" value="${esc(f.current)}" data-fd="current" data-live placeholder="0"><small>${esc(cur())}</small></div><small>${cr?'From your card statement or bank app.':'Type what your bank app shows right now.'}</small></label>
    <div class="ae4-safe">${ic('shield-check')}<span>${isEdit?'Bank messages you import later keep this balance right.':'Adding this account keeps all your other accounts and cards exactly as they are.'}</span></div>
    <button class="add4-more" data-act="accMore" aria-expanded="${!!f._more}"><span>More details</span>${ic(f._more?'caret-up':'caret-down')}</button>
    ${f._more?`<div class="add4-box">
      <div class="field"><label>Other numbers in bank SMS <span class="muted">(optional)</span></label><input class="inp" inputmode="numeric" value="${esc(f.smsIds||'')}" placeholder="e.g. debit card 4321, credit card 8765" data-fd="smsIds"><p class="hint">Last 4 digits of any card or account number your bank’s SMS shows for this account.</p></div>
      <div class="field"><span class="lab">Card colour</span><div class="swatches">${CARD_COLORS.map(([n,c])=>`<button data-act="accColor" data-v="${c}" aria-label="${n}" aria-pressed="${f.color.toLowerCase()===c.toLowerCase()}" style="background:${cardBg(c)}"></button>`).join('')}<label class="swatch-custom" aria-label="Custom colour"><input type="color" value="${esc(f.color)}" data-fd="color" data-live>🎨</label></div></div>
      <div class="field"><span class="lab">What do you use it for?</span><div class="chips">${ROLES.map(([r,l])=>`<button class="chip" data-act="accRole" data-v="${r}" aria-pressed="${f.roles.includes(r)}">${l}</button>`).join('')}</div><p class="hint">Money moved into an account marked Savings counts as saved.</p></div>
      ${cr?`<div class="two"><div class="field"><label>Credit limit</label><input class="inp" inputmode="decimal" value="${esc(f.limit||'')}" placeholder="e.g. 1000" data-fd="limit"></div><div class="field"><label>Minimum payment %</label><input class="inp" inputmode="decimal" value="${esc(f.minPct||'')}" placeholder="5" data-fd="minPct"></div></div>
      <div class="two"><div class="field"><label>Statement day</label><select class="sel" data-fd="stmtDay"><option value="">—</option>${Array.from({length:28},(_,i)=>i+1).map(d=>`<option${+f.stmtDay===d?' selected':''}>${d}</option>`).join('')}</select></div>
      <div class="field"><label>Payment due day</label><select class="sel" data-fd="dueDay"><option value="">—</option>${Array.from({length:28},(_,i)=>i+1).map(d=>`<option${+f.dueDay===d?' selected':''}>${d}</option>`).join('')}</select></div></div>`:''}
      ${isEdit?`<button class="w-chip del" data-act="aDelete" style="align-self:flex-start">${ic('trash')}Delete this account</button>`:''}</div>`:''}`,
    `<button class="w-btn" data-act="aSave">${isEdit?'Save changes':'Add account'}</button>`,'ae4');
  const nw=$('#dlg .ae4 .body'); if(nw) nw.scrollTop=sc;
}
function updateAcctPreview(){
  const f=fd, p=$('#accPreview'); if(!p||!f) return;
  p.style.background=cardBg(f.color); $('#pvBank').textContent=f.bank||TYPE_LABEL[f.type]; $('#pvName').textContent=f.name||'Account name';
  $('#pvL4').textContent=f.last4?'•••• '+f.last4:''; p.querySelector('.abal').textContent=money(previewBal(f),{show:true});
}

/* ---------- You ---------- */
function viewYou4(){
  const p=P(), pb=peopleBalances(), owed=sum(Object.values(pb).filter(v=>v>0)), Q=(p.smsQueue||[]).length, S=p.sms||{};
  const wk=ymd(addDays(new Date(),7)); const dueWk=p.recurring.filter(r=>r.next&&r.next<=wk&&r.type!=='income').length;
  const tile=(icon,label,sub,act,v)=>`<button class="y4-tile" data-act="${act}"${v!=null?` data-v="${v}"`:''}>${ic(icon)}<b>${label}</b><small>${sub}</small></button>`;
  return `<div class="w-title">You</div><div class="y4-off">${ic('lock-key')}Stored only on this iPhone, encrypted.</div>
    <div class="y4-grid">
      ${tile('cards','Accounts & cards',`${p.accounts.length} account${p.accounts.length===1?'':'s'}`,'tab','accounts')}
      ${tile('users-three','Friends',owed>0?`${money(owed)} owed to you`:p.people.length?`${p.people.length} people`:'Split & settle up','tab','people')}
      ${tile('chat-text','Bank messages',Q?`${Q} waiting`:S.last?`Last ${ago(S.last)}`:'Bring them in','tab','sms')}
      ${tile('globe-hemisphere-east','Spending map',`${mapPlaces('all').length} places`,'openMap')}
      ${tile('bell-ringing','Reminders',dueWk?`${dueWk} due this week`:'Add to Calendar','reminders')}
      ${tile('file-pdf','Monthly report',`${MONTHS[new Date().getMonth()]} PDF`,'export')}
    </div>
    <div class="w-group" style="margin-top:10px"><button class="y4-row" data-act="tab" data-v="settings">${ic('gear-six')}<span>Settings</span>${chevI()}</button><button class="y4-row" data-act="lockNow">${ic('lock-key')}<span>Lock now</span>${chevI()}</button></div>`;
}

/* ---------- Settings: five groups; the bigger ones open in a sheet ---------- */
function viewSettings(){
  const p=P(), S=p.sms||{}, L=p.limits;
  const row=(label,right,act,v,cls)=>`<button class="s4r${cls?' '+cls:''}" data-act="${act}"${v!=null?` data-v="${v}"`:''}><span>${label}</span>${right}</button>`;
  const val=t=>`<span class="val">${t}${chevI()}</span>`, tog=on=>`<i class="w-tog${on?' on':''}"><i></i></i>`;
  const seg=(items,cur_,act)=>`<span class="s4seg">${items.map(([v,l,n])=>`<button data-act="${act}" data-v="${v}" aria-pressed="${cur_===v}"${n?' data-notr':''}>${l}</button>`).join('')}</span>`;
  const grp=(t,rows)=>`<div class="w-lab">${t}</div><div class="w-group s4g">${rows.join('')}</div>`;
  const al={0:'When I leave',1:'1 minute',5:'5 minutes',15:'15 minutes'}[secMeta.autoLock||0]||'When I leave';
  const theme=p.theme||secMeta.theme||'dark';
  return `<div class="w-push-h"><button class="w-round" data-act="back" aria-label="Back">${backI()}</button><span class="t">Settings</span></div>`
  +grp('Security',[ bioCapable||hasBio?row('Unlock with Face ID',tog(hasBio),'bioToggle'):row('Face ID',val('Not on this device'),'bioInfo'),
      row('Auto-lock',val(al),'setPanel','security'), row('Change passcode',val(''),'changePass') ])
  +grp('Automatic',[ row('Bank SMS setup',val(S.setup?'Connected':'Set up'),'smsGuide'), row('Add sure bank messages by itself',tog(S.auto),'smsAuto'),
      row('Keep balances matching the bank',tog(S.syncBal!==false),'smsSyncBal'), row('Repeating payments',val(String(p.recurring.length)),'setPanel','recurring'), row('Reminders in Calendar',val(''),'reminders') ])
  +grp('Money',[ row('Daily spending limit',val(L.mode==='off'?'Off':L.mode==='smart'?'Smart':money(L.daily||0)),'setPanel','limits'),
      row('Monthly budgets',val(Object.keys(p.budgets).length?`${Object.keys(p.budgets).length} set`:'None'),'setPanel','budgets'),
      row('Categories',val(String(p.categories.expense.length+p.categories.income.length)),'setPanel','cats'), row('Quick-add buttons',val(String(p.quick.length)),'setPanel','quick'),
      row('Currencies & rates',val(`<span data-notr>${esc(p.currency)}</span> · ${p.fxAuto?'live':p.fxLive?'updated':'built-in'}`),'setPanel','money') ])
  +grp('Look',[ row('Your name',val(esc(p.name||'Not set')),'setPanel','name'),
      `<div class="s4r"><span>Language</span>${seg([['en','English',1],['ar','العربية',1]],LANG,'setLang')}</div>`,
      `<div class="s4r"><span>Edition</span>${seg([['dark','Night'],['light','Day'],['auto','Auto']],theme,'setTheme')}</div>` ])
  +grp('Your data',[ row('Encrypted backup',val(secMeta.lastBackup?fmtD(secMeta.lastBackup,{day:'numeric',month:'short'}):'Never'),'setPanel','backup'), row('Restore from backup',val(''),'restore'),
      row('Reports & export',val(''),'export'), row('Privacy & more',val(''),'setPanel','privacy'),
      allTx().some(t=>t.demo)||p.people.some(x=>x.demo)?row('Remove demo data',val(''),'clearDemo'):row('Load demo data',val(''),'demo'), row('Erase everything','', 'wipe','','danger') ])
  +`<div class="s4-foot"><span>Masroof <span data-notr>${APP_VERSION}</span>${updateReady?' · update ready':' · up to date'}</span><span><button class="linkish w-cyan" data-act="whatsNew">What’s new</button> · <button class="linkish w-cyan" data-act="checkUpdate">Check for updates</button></span></div>`;
}
const SET_PANELS={security:'Security',recurring:'Repeating payments',limits:'Daily spending limit',budgets:'Monthly budgets',cats:'Categories',quick:'Quick-add buttons',money:'Currencies & rates',name:'Your name',backup:'Encrypted backup',privacy:'Privacy & more'};
function setPanelHTML(k){
  const p=P(), L=p.limits, freqL={weekly:'Every week',monthly:'Every month',yearly:'Every year'}, rec=p.recurring.slice().sort((a,b)=>a.next<b.next?-1:1);
  switch(k){
    case 'security': return `<p class="hint">Your data is encrypted on this iPhone with AES‑256, using a key made from your passcode. Nothing is sent anywhere.</p>
      <div class="rows"><div class="rw"><span>Lock automatically</span><select class="sel" data-sec="autoLock">${[['0','When I leave the app'],['1','After 1 minute'],['5','After 5 minutes'],['15','After 15 minutes']].map(([v,l])=>`<option value="${v}"${String(secMeta.autoLock)===v?' selected':''}>${l}</option>`).join('')}</select></div>
      <div class="rw"><span>Too many wrong passcodes</span><select class="sel" data-sec="wipeAfter">${[['0','Slow down retries'],['10','Erase all data after 10']].map(([v,l])=>`<option value="${v}"${String(secMeta.wipeAfter)===v?' selected':''}>${l}</option>`).join('')}</select></div></div>
      <div class="bar"><button class="btn" data-act="changePass">Change passcode</button><button class="btn" data-act="lockNow">Lock now</button></div>`;
    case 'recurring': return `<p class="hint">Rent, bills, salary, savings and monthly investing — added on their date without you doing anything.</p>
      ${rec.length?`<div class="rows">${rec.map(r=>`<div class="rw"><span><b>${esc(recLabel(r))}</b> <span class="amt ${r.type}">${money(r.amount)}</span><br><span class="muted">${freqL[r.freq]} · next ${fmtD(r.next,{day:'numeric',month:'short',year:'numeric'})}</span></span><button class="btn small danger" data-act="delRec" data-v="${esc(r.id)}">Stop</button></div>`).join('')}</div>`:'<p class="muted">Nothing scheduled yet.</p>'}
      <button class="btn" data-act="add" data-preset="repeat">Schedule a repeating payment</button>`;
    case 'limits': return `<div class="seg" role="group">${[['off','Off'],['fixed','Fixed amount'],['smart','Smart']].map(([v,l])=>`<button data-act="limMode" data-v="${v}" aria-pressed="${L.mode===v}">${l}</button>`).join('')}</div>
      ${L.mode==='fixed'?`<div class="field"><label for="limD">Daily limit (${esc(cur())})</label><input id="limD" class="inp" inputmode="decimal" value="${L.daily||''}" data-lim="daily"></div>`:''}
      ${L.mode==='smart'?`<div class="field"><label for="limM">Monthly spending budget (${esc(cur())})</label><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="limM" class="inp" inputmode="decimal" value="${L.monthly||''}" data-lim="monthly" style="max-width:160px"><button class="btn small" data-act="limSuggest">Suggest from my income</button></div>
        <p class="hint">Each day’s limit = what’s left of this budget ÷ days left in the month. Spend less today and tomorrow’s limit grows.</p></div>`:''}
      ${L.mode!=='off'?`<div class="rows"><div class="rw"><span>What counts</span><select class="sel" data-lim="scope"><option value="daily"${L.scope==='daily'?' selected':''}>Day-to-day only</option><option value="all"${L.scope==='all'?' selected':''}>All spending</option></select></div>
        <div class="rw"><span>Warn me at</span><select class="sel" data-lim="warnAt">${[50,70,80,90].map(v=>`<option value="${v}"${L.warnAt===v?' selected':''}>${v}% of the limit</option>`).join('')}</select></div></div>`:''}`;
    case 'budgets': return `<label class="toggle-row" style="border-top:0;padding-top:0"><span>Carry over to next month<br><span class="muted" style="font-size:13px">Money you don’t spend is added to next month’s budget; overspending is taken off.</span></span><input type="checkbox" class="tick" data-act="rollover"${p.rollover?' checked':''}></label>
      <div class="rows">${p.categories.expense.map(c=>`<div class="rw"><span><span class="dot" style="background:${catVis(c.id).color}"></span> ${esc(c.name)}</span><input class="inp" style="width:110px;text-align:right" inputmode="decimal" placeholder="No limit" value="${p.budgets[c.id]||''}" data-budget="${esc(c.id)}" aria-label="Budget for ${esc(c.name)}"></div>`).join('')}</div>`;
    case 'quick': return `<p class="hint">Pinned buttons show first in the Add sheet. Frequent purchases are added next to them.</p>
      ${p.quick.length?`<div class="chips">${p.quick.map((q,i)=>`<span class="chip">${esc(q.label)} · ${money(q.amount)}<button class="x" data-act="unpin" data-i="${i}" aria-label="Remove">×</button></span>`).join('')}</div>`:''}
      <div class="two"><input class="inp" id="qpLabel" placeholder="Label, e.g. Karak"><input class="inp" id="qpAmt" inputmode="decimal" placeholder="Amount"></div>
      <div class="two"><select class="sel" id="qpCat">${p.categories.expense.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select><select class="sel" id="qpAcct">${acctOptions(defaultAcct())}</select></div>
      <button class="btn" data-act="pinQuick">Pin button</button>`;
    case 'cats': return `<p class="hint">Rename, change the emoji or colour, add items (Pizza, Burger… inside Food).</p>
      ${['expense','income'].map(type=>`<h4 class="set4-h">${type==='expense'?'Spending':'Income'}</h4>`+p.categories[type].map(c=>`<div class="catblock"><div class="hd">
        <input class="inp ic" value="${esc(c.icon||'')}" data-catf="icon" data-type="${type}" data-v="${esc(c.id)}" aria-label="Emoji"><input class="inp nm" value="${esc(c.name)}" data-catf="name" data-type="${type}" data-v="${esc(c.id)}" aria-label="Name"><input type="color" value="${esc(c.color)}" data-catf="color" data-type="${type}" data-v="${esc(c.id)}" aria-label="Colour">
        <button class="btn small danger" data-act="delCat" data-type="${type}" data-v="${esc(c.id)}">Remove</button></div>
        <div class="chips">${c.items.map((it,i)=>`<span class="chip">${esc(it)}<button class="x" data-act="delItem" data-type="${type}" data-v="${esc(c.id)}" data-i="${i}" aria-label="Remove ${esc(it)}">×</button></span>`).join('')}
        <span class="inline-add"><input class="inp" placeholder="New item" data-newitem="${esc(c.id)}"><button class="btn small" data-act="addItem" data-v="${esc(c.id)}">Add</button></span></div></div>`).join('')+
        `<div class="inline-add"><input class="inp" style="width:190px" placeholder="New ${type==='expense'?'spending':'income'} category" data-newcat="${type}"><button class="btn small" data-act="addCat" data-type="${type}">Add category</button></div>`).join('')}`;
    case 'money': return `<div class="rows"><div class="rw"><span>Currency</span><select class="sel" data-change="currency" data-notr>${CURRENCIES.map(([c])=>`<option${p.currency===c?' selected':''}>${c}</option>`).join('')}</select></div>
      <div class="rw"><span>Exchange rates<br><span class="muted" style="font-size:13px">Other currencies become ${esc(p.currency)} automatically · ${esc(fxSourceText())}${p.fxAuto?' · live':''}</span></span><button class="btn small" data-act="fxOpen">Rates</button></div>
      <div class="rw"><span>Month starts on<br><span class="muted" style="font-size:13px">Pick your payday to budget salary to salary</span></span><select class="sel" data-change="monthStart" aria-label="Month starts on">${Array.from({length:28},(_,i)=>i+1).map(v=>`<option value="${v}"${mStart()===v?' selected':''}>${v===1?'1st (calendar month)':'Day '+v}</option>`).join('')}</select></div>
      <div class="rw"><span>Week starts on</span><select class="sel" data-change="weekStart">${[[0,'Sunday'],[6,'Saturday'],[1,'Monday']].map(([v,l])=>`<option value="${v}"${p.weekStart===v?' selected':''}>${l}</option>`).join('')}</select></div></div>`;
    case 'name': return `<p class="hint">Shown on Home next to the greeting. Stays on this iPhone.</p><input class="inp" data-pname value="${esc(p.name||'')}" placeholder="Your name" maxlength="30" autocomplete="given-name">`;
    case 'backup': return `<p class="hint">If you delete the app, lose the phone or forget the passcode, the data is gone. Save an encrypted backup to Files or iCloud Drive now and then — it opens only with the passcode you have when you make it.</p>
      <div class="rows"><div class="rw"><span>Last backup</span><span class="muted">${secMeta.lastBackup?fmtD(secMeta.lastBackup,{day:'numeric',month:'short',year:'numeric'}):'Never'}</span></div>
        <label class="rw"><span>Include receipt photos</span><input type="checkbox" id="bkReceipts"></label></div>
      <div class="bar"><button class="btn primary" data-act="backup">Save encrypted backup</button><button class="btn" data-act="restore">Restore a backup</button></div>`;
    case 'privacy': return `<label class="toggle-row" style="border-top:0;padding-top:0"><span>Remember where I spend<br><span class="muted" style="font-size:13px">Pins new expenses on your spending map using your iPhone’s location. Kept encrypted on this phone.</span></span><input type="checkbox" class="tick" data-act="geoToggle"${p.geo?' checked':''}></label>
      <div class="rows"><div class="rw"><span>Data stored</span><span class="muted" style="text-align:end">Encrypted on this iPhone · ${esc(storageNote())}</span></div>
      <div class="rw"><span>Learned descriptions</span><span><span class="muted">${Object.keys(p.learned).length}</span> <button class="btn small" data-act="clearLearned">Forget</button></span></div></div>`;
  }
  return '';
}
function openSetPanel(k){ const old=$('#dlg .set4 .body'), sc=old?old.scrollTop:0;
  sheet4(`<div class="bl4-h" style="padding:14px 20px 4px" data-setk="${k}"><h3>${SET_PANELS[k]}</h3></div><div class="set4-b">${setPanelHTML(k)}</div>`,`<button class="w-btn sec" data-act="close">Done</button>`,'set4');
  const nw=$('#dlg .set4 .body'); if(nw) nw.scrollTop=sc; }
/* ---------- lock keypad, and the "Opening your ledger" moment after unlocking ---------- */
function lkDots(){ const n=($('#pu')||{value:''}).value.length; document.querySelectorAll('#lkDots i').forEach((d,i)=>d.classList.toggle('on',i<n)); const e=$('#lockErr'); if(e&&n) e.textContent=''; }
document.addEventListener('keydown',e=>{ if(!$('#lock .lk4.pad')||e.metaKey||e.ctrlKey) return; const k=e.key; if(/^[0-9]$/.test(k)||k==='Backspace'){ e.preventDefault(); const b=document.createElement('button'); b.dataset.act='lkKey'; b.dataset.v=k==='Backspace'?'⌫':k; document.body.appendChild(b); b.click(); b.remove(); } });
function loading4(isNew){
  const old=$('#load4'); if(old) old.remove();
  const q=(P().smsQueue||[]).length, n=P().accounts.length, quick=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const steps=[isNew?'Creating your encrypted ledger':'Decrypting on this iPhone',q?`${q} bank message${q>1?'s':''} to check`:'Checking bank messages',`Balancing ${n} account${n===1?'':'s'}`];
  const el=document.createElement('div'); el.id='load4'; el.innerHTML=`<button class="lg" data-coin aria-label="Tap the fort">${fortSVG('loader')}</button><b>Opening your ledger</b>
    <div class="st">${steps.map(t=>`<div>${ic('circle-notch')}<span>${esc(t)}</span></div>`).join('')}</div>
    <div class="cg"><div class="coins" dir="ltr"></div><span>Tap the fort while you wait</span></div>`;
  document.body.appendChild(el); if(LANG==='ar') trTree(el);
  let k=0, coins=0;
  const tick=()=>el.querySelectorAll('.st>div').forEach((r,i)=>{ r.className=i<k?'done':i===k?'act':''; r.querySelector('.ic').outerHTML=ic(i<k?'check-circle-fill':'circle-notch'); });
  tick(); const ts=[650,1300,1950].map((t,i)=>setTimeout(()=>{ k=i+1; tick(); },quick?t/3:t));
  const done=()=>{ ts.forEach(clearTimeout); clearTimeout(end); el.classList.add('out'); setTimeout(()=>el.remove(),350); };
  const end=setTimeout(done,quick?900:2700);
  el.addEventListener('click',e=>{ if(e.target.closest('[data-coin]')){ coins++; buzz(6); const c=document.createElement('i'); c.style.background=['#38A6CF','#FF458E','#EDBB00'][coins%3]; el.querySelector('.coins').appendChild(c); el.querySelector('.cg span').textContent=tr(coins===1?'1 coin stacked':`${coins} coins stacked`); return; } done(); });
}
/*STUBS*/

boot();
(function(){const sp=$('#splash'); if(!sp) return; const t0=performance.now(); const hide=()=>{ sp.classList.add('gone'); setTimeout(()=>sp.remove(),600); };
  sp.addEventListener('click',hide); const wait=()=>{ if(booted&&performance.now()-t0>2300) hide(); else setTimeout(wait,100); }; wait(); setTimeout(hide,5000); })();
})();

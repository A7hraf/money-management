// Currencies Masroof recognises: the country, its flag, a main city (to place spending on the map),
// the words and symbols banks and people write for it, and a rate in units per 1 US dollar.
// Gulf currencies are pegged to the dollar, so their rates are exact. The others are approximate
// as of MASROOF_FX.asOf; Settings › Exchange rates can fetch today's rates when you're online.
// Order matters where words overlap: "ريال سعودي" comes before Oman's "ريال", "جنيه إسترليني"
// before Egypt's "جنيه", and so on.
window.MASROOF_FX = (function(){
  const asOf = '2026-09-30';
  // code, decimals, flag, country, country (Arabic), ISO country, city, city (Arabic), lat, lng, per USD, words (regex, case-insensitive)
  const C = [
    ['SAR',2,'🇸🇦','Saudi Arabia','السعودية','SA','Riyadh','الرياض',24.713,46.675,3.75,'SAR|SR|ريال\\s?سعودي|ر\\.?\\s?س\\.?|saudi\\s?riyals?|riyals?'],
    ['QAR',2,'🇶🇦','Qatar','قطر','QA','Doha','الدوحة',25.285,51.531,3.64,'QAR|QR|ريال\\s?قطري|ر\\.?\\s?ق\\.?|qatari\\s?riyals?'],
    ['OMR',3,'🇴🇲','Oman','عُمان','OM','Muscat','مسقط',23.588,58.383,0.384497,'OMR|R\\.O\\.?|RO|ر\\.?\\s?ع\\.?|ريال(?:\\s?عماني)?|(?:omani\\s?)?rials?(?:\\s?omani)?'],
    ['AED',2,'🇦🇪','United Arab Emirates','الإمارات','AE','Dubai','دبي',25.205,55.271,3.6725,'AED|Dhs?\\.?|dirhams?|درهم(?:\\s?إماراتي)?|د\\.?\\s?إ\\.?'],
    ['BHD',3,'🇧🇭','Bahrain','البحرين','BH','Manama','المنامة',26.229,50.586,0.376,'BHD|BD|دينار\\s?بحريني|د\\.?\\s?ب\\.?|bahraini\\s?dinars?'],
    ['JOD',3,'🇯🇴','Jordan','الأردن','JO','Amman','عمّان',31.954,35.911,0.709,'JOD|JD|دينار\\s?أردني|jordanian\\s?dinars?'],
    ['IQD',0,'🇮🇶','Iraq','العراق','IQ','Baghdad','بغداد',33.315,44.366,1310,'IQD|دينار\\s?عراقي|iraqi\\s?dinars?'],
    ['TND',3,'🇹🇳','Tunisia','تونس','TN','Tunis','تونس',36.806,10.181,2.95,'TND|دينار\\s?تونسي|tunisian\\s?dinars?'],
    ['KWD',3,'🇰🇼','Kuwait','الكويت','KW','Kuwait','الكويت',29.376,47.977,0.306,'KWD|KD|دينار(?:\\s?كويتي)?|د\\.?\\s?ك\\.?|(?:kuwaiti\\s?)?dinars?'],
    ['MAD',2,'🇲🇦','Morocco','المغرب','MA','Marrakesh','مراكش',31.629,-7.981,9.1,'MAD|درهم\\s?مغربي|moroccan\\s?dirhams?'],
    ['GBP',2,'🇬🇧','United Kingdom','المملكة المتحدة','GB','London','لندن',51.507,-0.128,0.745,'GBP|£|pounds?|sterling|جنيه\\s?إسترليني|باوند'],
    ['EGP',2,'🇪🇬','Egypt','مصر','EG','Cairo','القاهرة',30.044,31.236,48.5,'EGP|E£|L\\.E\\.?|جنيه(?:\\s?مصري)?|ج\\.?\\s?م\\.?|egyptian\\s?pounds?'],
    ['LBP',0,'🇱🇧','Lebanon','لبنان','LB','Beirut','بيروت',33.894,35.502,89500,'LBP|ليرة\\s?لبنانية|lebanese\\s?pounds?'],
    ['TRY',2,'🇹🇷','Turkey','تركيا','TR','Istanbul','إسطنبول',41.008,28.978,47,'TRY|TL|₺|lira|ليرة(?:\\s?تركية)?'],
    ['HKD',2,'🇭🇰','Hong Kong','هونغ كونغ','HK','Hong Kong','هونغ كونغ',22.320,114.169,7.8,'HKD|HK\\$'],
    ['SGD',2,'🇸🇬','Singapore','سنغافورة','SG','Singapore','سنغافورة',1.352,103.820,1.29,'SGD|S\\$'],
    ['AUD',2,'🇦🇺','Australia','أستراليا','AU','Sydney','سيدني',-33.869,151.209,1.52,'AUD|A\\$'],
    ['NZD',2,'🇳🇿','New Zealand','نيوزيلندا','NZ','Auckland','أوكلاند',-36.848,174.763,1.70,'NZD|NZ\\$'],
    ['CAD',2,'🇨🇦','Canada','كندا','CA','Toronto','تورونتو',43.653,-79.383,1.38,'CAD|C\\$'],
    ['BRL',2,'🇧🇷','Brazil','البرازيل','BR','São Paulo','ساو باولو',-23.551,-46.633,5.4,'BRL|R\\$'],
    ['MXN',2,'🇲🇽','Mexico','المكسيك','MX','Mexico City','مكسيكو سيتي',19.433,-99.133,18.6,'MXN'],
    ['USD',2,'🇺🇸','United States','الولايات المتحدة','US','New York','نيويورك',40.713,-74.006,1,'USD|US\\$|\\$|dollars?|bucks|دولار(?:\\s?أمريكي)?'],
    ['EUR',2,'🇪🇺','Euro area','منطقة اليورو','EU','Paris','باريس',48.857,2.352,0.86,'EUR|€|euros?|يورو'],
    ['CHF',2,'🇨🇭','Switzerland','سويسرا','CH','Zurich','زيورخ',47.377,8.541,0.80,'CHF|swiss\\s?francs?|francs?|فرنك'],
    ['SEK',2,'🇸🇪','Sweden','السويد','SE','Stockholm','ستوكهولم',59.329,18.069,9.4,'SEK'],
    ['NOK',2,'🇳🇴','Norway','النرويج','NO','Oslo','أوسلو',59.914,10.752,10.0,'NOK'],
    ['DKK',2,'🇩🇰','Denmark','الدنمارك','DK','Copenhagen','كوبنهاغن',55.676,12.568,6.4,'DKK'],
    ['PLN',2,'🇵🇱','Poland','بولندا','PL','Warsaw','وارسو',52.230,21.012,3.65,'PLN|zł|zloty'],
    ['CZK',2,'🇨🇿','Czechia','التشيك','CZ','Prague','براغ',50.076,14.438,20.8,'CZK|Kč'],
    ['HUF',0,'🇭🇺','Hungary','المجر','HU','Budapest','بودابست',47.498,19.040,335,'HUF|forint'],
    ['GEL',2,'🇬🇪','Georgia','جورجيا','GE','Tbilisi','تبليسي',41.716,44.783,2.7,'GEL|₾|lari'],
    ['AZN',2,'🇦🇿','Azerbaijan','أذربيجان','AZ','Baku','باكو',40.409,49.867,1.7,'AZN|₼|manat'],
    ['RUB',2,'🇷🇺','Russia','روسيا','RU','Moscow','موسكو',55.756,37.617,82,'RUB|₽|roubles?|rubles?|روبل'],
    ['KZT',2,'🇰🇿','Kazakhstan','كازاخستان','KZ','Almaty','ألماتي',43.238,76.946,540,'KZT|₸|tenge'],
    ['PKR',2,'🇵🇰','Pakistan','باكستان','PK','Karachi','كراتشي',24.861,67.010,282,'PKR|pakistani\\s?rupees?|روبية\\s?باكستانية'],
    ['LKR',2,'🇱🇰','Sri Lanka','سريلانكا','LK','Colombo','كولومبو',6.927,79.861,300,'LKR|sri\\s?lankan\\s?rupees?'],
    ['NPR',2,'🇳🇵','Nepal','نيبال','NP','Kathmandu','كاتماندو',27.717,85.324,141,'NPR|nepali\\s?rupees?'],
    ['INR',2,'🇮🇳','India','الهند','IN','Mumbai','مومباي',19.076,72.878,88,'INR|₹|Rs\\.?|rupees?|روبية(?:\\s?هندية)?'],
    ['BDT',2,'🇧🇩','Bangladesh','بنغلاديش','BD','Dhaka','دكا',23.810,90.413,122,'BDT|৳|taka'],
    ['MVR',2,'🇲🇻','Maldives','المالديف','MV','Male','ماليه',4.175,73.509,15.42,'MVR|rufiyaa'],
    ['THB',2,'🇹🇭','Thailand','تايلاند','TH','Bangkok','بانكوك',13.756,100.502,32.5,'THB|฿|baht|بات'],
    ['MYR',2,'🇲🇾','Malaysia','ماليزيا','MY','Kuala Lumpur','كوالالمبور',3.139,101.687,4.2,'MYR|RM|ringgit|رينغيت'],
    ['IDR',0,'🇮🇩','Indonesia','إندونيسيا','ID','Bali','بالي',-8.409,115.189,16500,'IDR|Rp\\.?|rupiah|روبية\\s?إندونيسية'],
    ['PHP',2,'🇵🇭','Philippines','الفلبين','PH','Manila','مانيلا',14.600,120.984,58,'PHP|₱|pesos?'],
    ['VND',0,'🇻🇳','Vietnam','فيتنام','VN','Hanoi','هانوي',21.028,105.854,26300,'VND|₫'],
    ['CNY',2,'🇨🇳','China','الصين','CN','Shanghai','شنغهاي',31.230,121.474,7.12,'CNY|RMB|yuan|يوان'],
    ['JPY',0,'🇯🇵','Japan','اليابان','JP','Tokyo','طوكيو',35.676,139.650,147,'JPY|¥|yen|ين'],
    ['KRW',0,'🇰🇷','South Korea','كوريا الجنوبية','KR','Seoul','سيول',37.567,126.978,1390,'KRW|₩'],
    ['ZAR',2,'🇿🇦','South Africa','جنوب أفريقيا','ZA','Cape Town','كيب تاون',-33.925,18.424,17.6,'ZAR'],
    ['KES',2,'🇰🇪','Kenya','كينيا','KE','Nairobi','نيروبي',-1.292,36.822,129,'KES|KSh|kenyan\\s?shillings?|shillings?'],
    ['TZS',0,'🇹🇿','Tanzania','تنزانيا','TZ','Zanzibar','زنجبار',-6.165,39.202,2450,'TZS|TSh|tanzanian\\s?shillings?'],
    ['ETB',2,'🇪🇹','Ethiopia','إثيوبيا','ET','Addis Ababa','أديس أبابا',8.980,38.757,140,'ETB|birr'],
  ];
  const list = C.map(([code,dec,flag,country,countryAr,iso,city,cityAr,lat,lng,perUSD,words]) => ({code,dec,flag,country,countryAr,iso,city,cityAr,lat,lng,perUSD,words}));
  // countries that share a currency (or are named in card SMS by their two-letter code)
  const extra = [
    ['FR','🇫🇷','France','فرنسا','Paris','باريس',48.857,2.352,'EUR'],['DE','🇩🇪','Germany','ألمانيا','Munich','ميونخ',48.137,11.575,'EUR'],
    ['IT','🇮🇹','Italy','إيطاليا','Rome','روما',41.903,12.496,'EUR'],['ES','🇪🇸','Spain','إسبانيا','Madrid','مدريد',40.417,-3.704,'EUR'],
    ['NL','🇳🇱','Netherlands','هولندا','Amsterdam','أمستردام',52.368,4.904,'EUR'],['AT','🇦🇹','Austria','النمسا','Vienna','فيينا',48.208,16.374,'EUR'],
    ['GR','🇬🇷','Greece','اليونان','Athens','أثينا',37.984,23.728,'EUR'],['PT','🇵🇹','Portugal','البرتغال','Lisbon','لشبونة',38.722,-9.139,'EUR'],
    ['BE','🇧🇪','Belgium','بلجيكا','Brussels','بروكسل',50.850,4.352,'EUR'],['IE','🇮🇪','Ireland','أيرلندا','Dublin','دبلن',53.350,-6.260,'EUR'],
    ['FI','🇫🇮','Finland','فنلندا','Helsinki','هلسنكي',60.170,24.938,'EUR'],['CY','🇨🇾','Cyprus','قبرص','Limassol','ليماسول',34.707,33.022,'EUR'],
    ['MT','🇲🇹','Malta','مالطا','Valletta','فاليتا',35.899,14.514,'EUR'],['HR','🇭🇷','Croatia','كرواتيا','Zagreb','زغرب',45.815,15.982,'EUR'],
    ['SC','🇸🇨','Seychelles','سيشل','Victoria','فيكتوريا',-4.619,55.452,'SCR'],['MU','🇲🇺','Mauritius','موريشيوس','Port Louis','بورت لويس',-20.161,57.501,'MUR'],
  ].map(([iso,flag,country,countryAr,city,cityAr,lat,lng,code]) => ({iso,flag,country,countryAr,city,cityAr,lat,lng,code}));
  return { asOf, list, extra };
})();

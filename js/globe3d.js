// Masroof spending map in real 3D (WebGL, via the bundled globe.gl in js/vendor).
// Night Earth with city lights (or daytime satellite), glowing country borders, 3D bars for
// spending, animated arcs from your home city, pulsing rings on the selected place.
// Same small API as the canvas globe in js/globe.js, which is used when WebGL isn't available.
window.MasroofGlobe3D = function(el, opt = {}){
  if (!window.Globe) return null;
  try { const c = document.createElement('canvas'); if (!(c.getContext('webgl2') || c.getContext('webgl'))) return null; } catch (e){ return null; }
  const TEX = { night: './images/earth-night.jpg', day: './images/earth-day.jpg' };
  const labels = new Map(); let spots = [], sel = null, home = opt.home || null, style = opt.style || 'night', idle = 0, alive = true;
  const g = Globe({ animateIn: true, rendererConfig: { antialias: true, alpha: true, powerPreference: 'high-performance' } })(el)
    .backgroundColor('rgba(0,0,0,0)')
    .globeImageUrl(TEX[style])
    .showAtmosphere(true).atmosphereColor('#4fe3c4').atmosphereAltitude(0.2)
    // country borders, softly glowing
    .polygonsData((window.MASROOF_COUNTRIES || { features: [] }).features)
    .polygonCapColor(() => 'rgba(0,0,0,0)').polygonSideColor(() => 'rgba(0,0,0,0)')
    .polygonStrokeColor(() => style === 'night' ? 'rgba(130,240,215,.32)' : 'rgba(255,255,255,.35)').polygonAltitude(0.003)
    // spending bars
    .pointLat('lat').pointLng('lng').pointColor('color').pointRadius(d => d.id === sel ? 0.75 : 0.55)
    .pointAltitude(d => d.alt).pointResolution(24).pointsMerge(false).pointsTransitionDuration(900)
    .onPointClick(d => pick(d))
    // arcs from home
    .arcStartLat('sLat').arcStartLng('sLng').arcEndLat('lat').arcEndLng('lng')
    .arcColor(d => ['rgba(255,255,255,.75)', d.color]).arcStroke(d => d.id === sel ? 0.9 : 0.45)
    .arcDashLength(0.45).arcDashGap(0.25).arcDashInitialGap(() => Math.random()).arcDashAnimateTime(2600).arcAltitudeAutoScale(0.45)
    .arcsTransitionDuration(800)
    // pulsing rings
    .ringLat('lat').ringLng('lng').ringColor(d => t => `rgba(${d.rgb},${(1 - t) * 0.9})`)
    .ringMaxRadius(d => d.home ? 2.4 : 4.2).ringPropagationSpeed(2.2).ringRepeatPeriod(d => d.home ? 1600 : 900)
    // labels as crisp HTML chips
    .htmlLat('lat').htmlLng('lng').htmlAltitude(d => d.alt + 0.015)
    .htmlElement(d => { const b = document.createElement('button'); b.className = 'gl-label' + (d.id === sel ? ' on' : ''); labels.set(d.id, b);
      b.innerHTML = `<i style="background:${d.color}"></i><b>${d.label}</b>${d.amount ? `<span>${d.amount}</span>` : ''}`;
      b.addEventListener('click', e => { e.stopPropagation(); pick(d); }); return b; });
  const r = g.renderer(); r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const ctl = g.controls(); ctl.autoRotate = true; ctl.autoRotateSpeed = 0.35; ctl.enableDamping = true; ctl.dampingFactor = 0.08;
  ctl.minDistance = 130; ctl.maxDistance = 520; ctl.addEventListener('start', () => { ctl.autoRotate = false; idle = Date.now(); });
  const resumeT = setInterval(() => { if (idle && Date.now() - idle > 7000 && !sel){ ctl.autoRotate = true; idle = 0; } }, 2000);
  // hide labels that would overlap a more important one (selected first, then biggest spend)
  let shown = [];
  const declutter = () => { if (!alive) return; const boxes = [];
    for (const d of shown){ const b = labels.get(d.id); if (!b || !b.isConnected) continue;
      const c = g.getScreenCoords(d.lat, d.lng, d.alt + 0.015), w = b.offsetWidth || 90, h = 26, x = c.x - w / 2, y = c.y - h * 1.3;
      const hit = boxes.some(r => x < r[0] + r[2] + 4 && x + w + 4 > r[0] && y < r[1] + h && y + h > r[1]);
      b.classList.toggle('hid', hit); if (!hit) boxes.push([x, y, w]); } };
  const declT = setInterval(declutter, 250);
  const size = () => { if (!alive) return; g.width(el.clientWidth).height(el.clientHeight); };
  const ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) ro.observe(el); size();
  if (home) g.pointOfView({ lat: home.lat - 10, lng: home.lng, altitude: opt.altitude || 2.25 }, 0);
  const hexRgb = h => { const n = parseInt(String(h).replace('#', '').padEnd(6, '0').slice(0, 6), 16); return `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`; };
  function pick(d){ api.select(d.id); opt.onPick && opt.onPick(d); }
  function draw(){
    const max = Math.max(1e-9, ...spots.map(s => s.value));
    const P = spots.map(s => ({ ...s, alt: 0.02 + 0.5 * Math.sqrt(s.value / max), rgb: hexRgb(s.color) }));
    g.pointsData(P);
    g.arcsData(home ? P.filter(s => Math.hypot(s.lat - home.lat, s.lng - home.lng) > 0.6).map(s => ({ ...s, sLat: home.lat, sLng: home.lng })) : []);
    const ring = P.filter(s => s.id === sel); if (home) ring.push({ lat: home.lat, lng: home.lng, rgb: '79,227,196', home: true, id: '__home' });
    g.ringsData(ring);
    const top = P.slice().sort((a, b) => b.value - a.value).slice(0, opt.labels == null ? 6 : opt.labels);
    if (sel && !top.some(s => s.id === sel)){ const s = P.find(x => x.id === sel); if (s) top.push(s); }
    shown = top.sort((a, b) => (b.id === sel) - (a.id === sel) || b.value - a.value); labels.clear();
    g.htmlElementsData(top); setTimeout(declutter, 30);
  }
  const api = {
    setSpots(list){ spots = list.slice(); if (sel && !spots.some(s => s.id === sel)) sel = null; draw(); },
    setHome(h){ home = h; draw(); },
    select(id){ sel = id || null; draw(); const s = spots.find(x => x.id === id); if (s){ ctl.autoRotate = false; idle = Date.now(); g.pointOfView({ lat: s.lat - 16, lng: s.lng, altitude: 1.5 }, 1200); } },
    focus(lat, lng, alt){ g.pointOfView({ lat, lng, altitude: alt || 1.6 }, 1200); },
    overview(){ sel = null; draw(); if (home) g.pointOfView({ lat: home.lat - 10, lng: home.lng, altitude: 2.25 }, 1200); },
    setStyle(s){ style = s; g.globeImageUrl(TEX[s]); g.polygonStrokeColor(() => s === 'night' ? 'rgba(130,240,215,.32)' : 'rgba(255,255,255,.35)'); },
    stop(){ alive = false; clearInterval(resumeT); clearInterval(declT); if (ro) ro.disconnect(); try { g.pauseAnimation(); g._destructor && g._destructor(); } catch (e){} el.innerHTML = ''; },
    start(){ try { g.resumeAnimation(); } catch (e){} },
    zoomTo(){}, spin(on){ ctl.autoRotate = on; }, is3d: true
  };
  return api;
};

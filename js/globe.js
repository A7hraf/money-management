// Masroof spending globe: a dotted 3D earth drawn on a canvas, with glowing pillars for
// places you spent money. Drag to spin (with momentum), pinch or double-tap to zoom, tap a
// pillar to select it. No map tiles or libraries — the land dots are in js/globe-data.js.
window.MasroofGlobe = (function(){
  let LAND = null;
  function land(){
    if (LAND) return LAND;
    const bin = atob(window.MASROOF_LAND || ''); const n = bin.length >> 2; LAND = new Float32Array(n * 3);
    const dv = new DataView(new ArrayBuffer(bin.length)); for (let i = 0; i < bin.length; i++) dv.setUint8(i, bin.charCodeAt(i));
    for (let i = 0; i < n; i++){ const lat = dv.getInt16(i*4, true) / 100 * Math.PI/180, lng = dv.getInt16(i*4+2, true) / 100 * Math.PI/180;
      LAND[i*3] = Math.cos(lat) * Math.sin(lng); LAND[i*3+1] = Math.sin(lat); LAND[i*3+2] = Math.cos(lat) * Math.cos(lng); }
    return LAND;
  }
  const rad = d => d * Math.PI / 180;
  const vec = (lat, lng) => [Math.cos(rad(lat)) * Math.sin(rad(lng)), Math.sin(rad(lat)), Math.cos(rad(lat)) * Math.cos(rad(lng))];

  return function create(canvas, opt = {}){
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, R = 0, cx = 0, cy = 0, dpr = 1;
    let lng0 = opt.lng != null ? opt.lng : 57, lat0 = opt.lat != null ? opt.lat : 20; // the point at the centre of the view (deg)
    let zoom = opt.zoom || 1, spin = opt.spin !== false, spinV = 0.035, vx = 0, vy = 0;
    let spots = [], sel = null, raf = 0, alive = true, grow = 1, growT = 0, target = null, lastTouch = 0, dragging = false;
    const theme = () => opt.dark ? opt.dark() : matchMedia('(prefers-color-scheme: dark)').matches;

    function size(){ dpr = Math.min(2.5, window.devicePixelRatio || 1); const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); cx = W / 2; cy = H / 2; }
    // rotate a unit vector into view space: spin around the pole, then tilt
    function rot(x, y, z, cl, sl, cp, sp){ const x1 = x * cl - z * sl, z1 = x * sl + z * cl; return [x1, y * cp - z1 * sp, y * sp + z1 * cp]; }

    function draw(){
      if (!alive) return; raf = requestAnimationFrame(draw);
      if (!W) size(); if (!W) return;
      if (target){ const dl = ((target.lng - lng0 + 540) % 360) - 180, dp = target.lat - lat0; lng0 += dl * 0.12; lat0 += dp * 0.12; if (Math.abs(dl) < 0.05 && Math.abs(dp) < 0.05) target = null; }
      else if (!dragging){ lng0 += vx; lat0 = Math.max(-70, Math.min(70, lat0 + vy)); vx *= 0.94; vy *= 0.94; if (spin && Math.abs(vx) < 0.02) lng0 += spinV; }
      if (grow < 1) grow = Math.min(1, (performance.now() - growT) / 900);
      R = Math.min(W, H) * 0.40 * zoom;
      const dark = theme(), cl = Math.cos(rad(lng0)), sl = Math.sin(rad(lng0)), cp = Math.cos(rad(lat0)), sp = Math.sin(rad(lat0));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      // atmosphere + sphere
      let g = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.25);
      g.addColorStop(0, dark ? 'rgba(31,162,160,.35)' : 'rgba(31,162,160,.28)'); g.addColorStop(1, 'rgba(31,162,160,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.25, 0, 7); ctx.fill();
      g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      g.addColorStop(0, dark ? '#17375E' : '#1D4E7E'); g.addColorStop(1, dark ? '#050E1C' : '#081E3A');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      // land dots, brighter towards the middle
      const L = land(), ds = Math.max(1, R / 150);
      for (let i = 0; i < L.length; i += 3){
        const v = rot(L[i], L[i+1], L[i+2], cl, sl, cp, sp); if (v[2] <= 0) continue;
        ctx.fillStyle = `rgba(${dark ? '120,220,200' : '150,230,210'},${(0.18 + 0.75 * v[2]).toFixed(2)})`;
        ctx.fillRect(cx + v[0] * R - ds / 2, cy - v[1] * R - ds / 2, ds, ds);
      }
      // rim light
      ctx.strokeStyle = 'rgba(160,240,220,.25)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      // pillars, back to front
      const max = Math.max(1e-9, ...spots.map(s => s.value)), vis = [];
      for (const s of spots){ const b = rot(...s.v, cl, sl, cp, sp); if (b[2] < -0.05) continue;
        const h = (0.08 + 0.62 * Math.sqrt(s.value / max)) * grow; vis.push({ s, b, t: [b[0] * (1 + h), b[1] * (1 + h), b[2] * (1 + h)] }); }
      vis.sort((a, b) => a.b[2] - b.b[2]);
      const pulse = (performance.now() % 1800) / 1800;
      for (const p of vis){
        const bx = cx + p.b[0] * R, by = cy - p.b[1] * R, tx = cx + p.t[0] * R, ty = cy - p.t[1] * R, on = sel === p.s.id, a = Math.max(0.25, Math.min(1, 0.4 + p.b[2]));
        p.x = tx; p.y = ty; p.bx = bx; p.by = by;
        // base glow ring
        ctx.globalAlpha = a * (1 - pulse) * 0.8; ctx.strokeStyle = p.s.color; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(bx, by, 3 + pulse * 10, (3 + pulse * 10) * Math.max(0.3, p.b[2]), 0, 0, 7); ctx.stroke();
        // beam
        const lg = ctx.createLinearGradient(bx, by, tx, ty); lg.addColorStop(0, p.s.color); lg.addColorStop(1, 'rgba(255,255,255,.95)');
        ctx.globalAlpha = a; ctx.strokeStyle = lg; ctx.lineWidth = on ? 5 : 3.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
        // head
        const hg = ctx.createRadialGradient(tx, ty, 0, tx, ty, on ? 16 : 10); hg.addColorStop(0, '#fff'); hg.addColorStop(0.35, p.s.color); hg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(tx, ty, on ? 16 : 10, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      }
      // labels: selected first, then the biggest; skip any that would overlap
      const boxes = [];
      for (const p of vis.slice().sort((a, b) => (b.s.id === sel) - (a.s.id === sel) || b.s.value - a.s.value)){
        const on = sel === p.s.id; if (!p.s.label || (!on && (p.b[2] < 0.3 || boxes.length >= 5))) continue;
        ctx.font = `700 ${on ? 13 : 11.5}px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif`; ctx.textAlign = 'center';
        const txt = p.s.label, w = ctx.measureText(txt).width + 14, bx = p.x - w / 2, by = p.y - 34;
        if (boxes.some(r => bx < r[0] + r[2] && bx + w > r[0] && by < r[1] + 22 && by + 22 > r[1])) continue; boxes.push([bx, by, w]);
        ctx.fillStyle = on ? 'rgba(31,162,160,.92)' : 'rgba(6,16,32,.78)'; ctx.beginPath(); (ctx.roundRect ? ctx.roundRect(bx, by, w, 22, 11) : ctx.rect(bx, by, w, 22)); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText(txt, p.x, p.y - 19);
      }
      api._vis = vis;
    }

    // touch: drag to spin with momentum, pinch to zoom, tap to pick
    let pts = new Map(), start = null, pinch0 = 0, zoom0 = 1, moved = 0;
    function pick(x, y){ const r = canvas.getBoundingClientRect(); x -= r.left; y -= r.top; let best = null, bd = 26;
      for (const p of api._vis || []){ const d = Math.min(Math.hypot(p.x - x, p.y - y), Math.hypot(p.bx - x, p.by - y)); if (d < bd){ bd = d; best = p.s; } }
      return best; }
    canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); target = null; dragging = true; moved = 0;
      if (pts.size === 2){ const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); zoom0 = zoom; }
      start = [e.clientX, e.clientY]; vx = vy = 0; });
    canvas.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2){ const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); zoom = Math.max(0.7, Math.min(3.2, zoom0 * d / (pinch0 || d))); moved = 99; return; }
      const dx = e.clientX - prev[0], dy = e.clientY - prev[1]; moved += Math.abs(dx) + Math.abs(dy);
      const k = 70 / (R || 150); lng0 -= dx * k; lat0 = Math.max(-70, Math.min(70, lat0 + dy * k)); vx = -dx * k; vy = dy * k; });
    const end = e => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if (pts.size) return; dragging = false;
      if (moved < 8){ const now = performance.now(); const s = pick(e.clientX, e.clientY);
        if (s){ sel = s.id; api.focus(s.lat, s.lng); opt.onPick && opt.onPick(s); }
        else if (now - lastTouch < 320){ zoom = zoom > 1.4 ? 1 : 2; } lastTouch = now; } };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.max(0.7, Math.min(3.2, zoom * (e.deltaY > 0 ? 0.92 : 1.08))); }, { passive: false });
    const ro = window.ResizeObserver ? new ResizeObserver(() => size()) : null; if (ro) ro.observe(canvas);

    const api = {
      setSpots(list, animate){ spots = list.map(s => ({ ...s, v: vec(s.lat, s.lng) })); if (animate){ grow = 0; growT = performance.now(); } if (sel && !spots.some(s => s.id === sel)) sel = null; },
      select(id){ sel = id; const s = spots.find(x => x.id === id); if (s) api.focus(s.lat, s.lng); },
      focus(lat, lng){ target = { lat: Math.max(-60, Math.min(60, lat - 22)), lng }; },
      zoomTo(z){ zoom = z; }, spin(on){ spin = on; },
      stop(){ alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); },
      start(){ if (!alive){ alive = true; draw(); } }
    };
    size(); draw();
    return api;
  };
})();

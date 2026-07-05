/* ===================================================================
   Decorative India-flag background — inspired by the flowing tricolor
   artwork (saffron + green ribbon, big Ashoka Chakra, sunburst rays,
   bokeh & sparkles). Pure inline SVG (no images) so it works offline / 24x7.
=================================================================== */
(function () {
  const el = document.getElementById('flagBg');
  if (!el) return;

  const CX = 600, CY = 337;
  const rnd = (a, b) => a + Math.random() * (b - a);

  // Sunburst rays (slowly rotating)
  const N = 48, Rr = 820, d = (360 / N) / 2.6;
  let rays = '';
  for (let i = 0; i < N; i++) {
    const a = i * (360 / N);
    const a1 = (a - d) * Math.PI / 180, a2 = (a + d) * Math.PI / 180;
    const x1 = CX + Math.cos(a1) * Rr, y1 = CY + Math.sin(a1) * Rr;
    const x2 = CX + Math.cos(a2) * Rr, y2 = CY + Math.sin(a2) * Rr;
    rays += `<polygon points="${CX},${CY} ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" fill="#ffffff" opacity="${(i % 2 ? 0.05 : 0.11).toFixed(2)}"/>`;
  }

  // Ashoka Chakra spokes + rim dots
  const R = 66;
  let spokes = '', dots = '';
  for (let i = 0; i < 24; i++) {
    const a = i * 15 * Math.PI / 180;
    const x = CX + Math.sin(a) * R, y = CY - Math.cos(a) * R;
    spokes += `<line x1="${CX}" y1="${CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#ffffff" stroke-width="3"/>`;
    const dx = CX + Math.sin(a) * (R - 6), dy = CY - Math.cos(a) * (R - 6);
    dots += `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="2" fill="#ffffff"/>`;
  }

  // Bokeh circles
  let boke = '';
  for (let i = 0; i < 18; i++) {
    boke += `<circle cx="${rnd(0, 1200) | 0}" cy="${rnd(0, 675) | 0}" r="${rnd(12, 74) | 0}" fill="#ffffff" opacity="${rnd(0.04, 0.13).toFixed(2)}"/>`;
  }

  // Sparkle stars
  let stars = '';
  for (let i = 0; i < 24; i++) {
    const x = rnd(0, 1200) | 0, y = rnd(0, 675) | 0, s = rnd(2, 5);
    const p = (n) => n.toFixed(1);
    stars += `<path d="M${x},${p(y - s)} L${p(x + s * 0.3)},${p(y - s * 0.3)} L${p(x + s)},${y} L${p(x + s * 0.3)},${p(y + s * 0.3)} L${x},${p(y + s)} L${p(x - s * 0.3)},${p(y + s * 0.3)} L${p(x - s)},${y} L${p(x - s * 0.3)},${p(y - s * 0.3)} Z" fill="#ffffff" opacity="${rnd(0.3, 0.7).toFixed(2)}"/>`;
  }

  el.innerHTML = `
  <svg viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0.15" y2="1">
        <stop offset="0%"  stop-color="#FF8A1E"/>
        <stop offset="38%" stop-color="#FFD8A6"/>
        <stop offset="52%" stop-color="#FBF3E6"/>
        <stop offset="64%" stop-color="#DCEFC2"/>
        <stop offset="100%" stop-color="#2FA23C"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
        <stop offset="55%" stop-color="#ffffff" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="7"/>
      </filter>
    </defs>

    <!-- base tricolor gradient -->
    <rect x="0" y="0" width="1200" height="675" fill="url(#bg)"/>

    <!-- rotating sunburst behind the chakra -->
    <g>
      <animateTransform attributeName="transform" type="rotate"
        from="0 ${CX} ${CY}" to="360 ${CX} ${CY}" dur="150s" repeatCount="indefinite"/>
      ${rays}
    </g>

    <!-- bokeh + sparkles -->
    <g>${boke}</g>
    <g>${stars}</g>

    <!-- flowing white S-ribbon through the centre -->
    <path d="M-80,405 C 250,300 430,250 ${CX},335 C 780,415 980,435 1280,315"
          fill="none" stroke="#ffffff" stroke-width="130" stroke-linecap="round"
          opacity="0.9" filter="url(#soft)"/>
    <path d="M-80,430 C 270,325 445,272 ${CX},355 C 775,438 985,458 1280,338"
          fill="none" stroke="#E7A23C" stroke-width="2.5" opacity="0.5"/>
    <path d="M-80,380 C 240,278 425,230 ${CX},315 C 785,398 975,415 1280,295"
          fill="none" stroke="#2FA23C" stroke-width="2" opacity="0.35"/>

    <!-- soft glow + Ashoka Chakra -->
    <circle cx="${CX}" cy="${CY}" r="150" fill="url(#glow)"/>
    <g stroke-linecap="round">
      <circle cx="${CX}" cy="${CY}" r="74" fill="#0A2A8F"/>
      <circle cx="${CX}" cy="${CY}" r="70" fill="none" stroke="#ffffff" stroke-width="2.5"/>
      ${spokes}
      ${dots}
      <circle cx="${CX}" cy="${CY}" r="9" fill="#ffffff"/>
      <circle cx="${CX}" cy="${CY}" r="5" fill="#0A2A8F"/>
    </g>
  </svg>`;
})();
/* ──────────────────────────────────────────────────────────────────────
   Creative Force — line icon set (Lucide-derived) + team identity config
   Shared by game.html and admin.html. CF uses SVG line icons, no emoji.
   ────────────────────────────────────────────────────────────────────── */
const IC = {
  'play':            '<polygon points="6 3 20 12 6 21 6 3"/>',
  'arrow-right':     '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'arrow-left':      '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  'chevron-right':   '<path d="m9 18 6-6-6-6"/>',
  'chevron-down':    '<path d="m6 9 6 6 6-6"/>',
  'check':           '<path d="M20 6 9 17l-5-5"/>',
  'x':               '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'minus':           '<path d="M5 12h14"/>',
  'search':          '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'clipboard-check': '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  'clock':           '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  'square':          '<rect x="5" y="5" width="14" height="14" rx="2"/>',
  'target':          '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  'layers':          '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m6.08 9.5-3.48 1.59a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83L17.92 9.5"/><path d="m6.08 14.5-3.48 1.59a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83l-3.49-1.59"/>',
  'skip-forward':    '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>',
  'trophy':          '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  'bar-chart':       '<line x1="4" x2="4" y1="21" y2="9"/><line x1="10" x2="10" y1="21" y2="4"/><line x1="16" x2="16" y1="21" y2="13"/><line x1="20" x2="20" y1="21" y2="3" opacity="0"/><path d="M3 21h18"/>',
  'rotate-ccw':      '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  'zap':             '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  'copy':            '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  'transfer':        '<path d="m17 2 4 4-4 4"/><path d="M3 6h18"/><path d="m7 22-4-4 4-4"/><path d="M21 18H3"/>',
  'users':           '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'download':        '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  'upload':          '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
  'alert-triangle':  '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  'save':            '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
  'wifi-off':        '<path d="M12 20h.01"/><path d="M8.5 16.4a5 5 0 0 1 7 0"/><path d="M2 8.8a15 15 0 0 1 4.2-2.5"/><path d="M17.7 6.3A15 15 0 0 1 22 8.8"/><path d="m2 2 20 20"/>',
  /* team identity glyphs */
  'rocket':          '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  'crown':           '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>',
  'flame':           '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  'gem':             '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
  'bolt':            '<path d="M14.61 5.7 12.7 3.8a2.74 2.74 0 0 0-3.9 0l-5 5a2.74 2.74 0 0 0 0 3.9l1.9 1.9"/><path d="m12.7 20.2 5-5a2.74 2.74 0 0 0 0-3.9l-1.9-1.9"/><path d="m9 12 6 6"/><path d="M5 22v-3"/><path d="M19 5V2"/>',
};

function ic(name, size, cls){
  size = size || 16; cls = cls || '';
  const p = IC[name] || '';
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

/* Team identity — CF colored line-icon badges replace the animal emojis. */
const TEAMS = [
  { color:'#3E82FB', soft:'#E4EDFE', icon:'rocket' }, /* CF blue   */
  { color:'#9943C9', soft:'#F1E1F9', icon:'crown'  }, /* CF purple */
  { color:'#568524', soft:'#EAF4D8', icon:'flame'  }, /* CF green  */
  { color:'#C2595C', soft:'#F7E7E8', icon:'gem'    }, /* CF salmon */
  { color:'#C57A1E', soft:'#FCEFD9', icon:'bolt'   }, /* CF amber  */
];

function teamBadge(i, size){
  size = size || 32;
  const t = TEAMS[i % TEAMS.length];
  const isz = Math.round(size * 0.56);
  return `<span class="tbadge" style="width:${size}px;height:${size}px;background:${t.soft};color:${t.color}">${ic(t.icon, isz)}</span>`;
}

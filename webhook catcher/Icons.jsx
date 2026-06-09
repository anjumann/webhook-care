/* Icons.jsx — feather-ish stroke icons + brand mark. Exports to window. */
const I = ({ d, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" {...p}>{d}</svg>
);

const Ico = {
  activity:  <I d={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>} />,
  inbox:     <I d={<><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>} />,
  send:      <I d={<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>} />,
  beaker:    <I d={<><path d="M9 3h6"/><path d="M10 3v6.5L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-8.5V3"/><path d="M7.5 14h9"/></>} />,
  history:   <I d={<><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 4v4h4"/><path d="M12 8v4l3 2"/></>} />,
  settings:  <I d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 6.6 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4 15a2 2 0 0 1-1.9-2H2a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 4.6 6.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 4.6V4a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 21 10a2 2 0 0 1 0 4z"/></>} />,
  search:    <I d={<><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/></>} />,
  bell:      <I d={<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>} />,
  plus:      <I d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />,
  chevR:     <I d={<polyline points="9 18 15 12 9 6"/>} />,
  chevD:     <I d={<polyline points="6 9 12 15 18 9"/>} />,
  arrowUp:   <I d={<><line x1="12" y1="19" x2="12" y2="5"/><polyline points="6 11 12 5 18 11"/></>} />,
  arrowR:    <I d={<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></>} />,
  copy:      <I d={<><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>} />,
  trash:     <I d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>} />,
  more:      <I d={<><circle cx="12" cy="6" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="18" r="1.4"/></>} />,
  ext:       <I d={<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>} />,
  zap:       <I d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>} />,
  check:     <I d={<polyline points="20 6 9 17 4 12"/>} />,
  shield:    <I d={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></>} />,
  clock:     <I d={<><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></>} />,
  sparkle:   <I d={<path d="M12 3l1.6 4.8L18 9.4l-4.4 1.6L12 16l-1.6-5L6 9.4l4.4-1.6L12 3z"/>} />,
  info:      <I d={<><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12" y2="8"/></>} />,
  filter:    <I d={<polygon points="22 3 2 3 10 12.5 10 19 14 21 14 12.5 22 3"/>} />,
  download:  <I d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>} />,
  globe:     <I d={<><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></>} />,
  refresh:   <I d={<><polyline points="21 3 21 9 15 9"/><path d="M21 9A9 9 0 0 0 6 5.3L3 8"/><polyline points="3 21 3 15 9 15"/><path d="M3 15a9 9 0 0 0 15 3.7L21 16"/></>} />,
  sun:       <I d={<><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></>} />,
  moon:      <I d={<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>} />,
  layers:    <I d={<><polygon points="12 2 22 8.5 12 15 2 8.5 12 2"/><polyline points="2 15.5 12 22 22 15.5"/></>} />,
};

// Brand mark — fan-out "relay/forward" webhook glyph (a hub feeding 2 nodes)
const Mark = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 7.5 L9 13 a4 4 0 0 0 4 4 h3"/>
    <path d="M9 13 h3 a4 4 0 0 1 4 4 v0"/>
    <circle cx="9" cy="6" r="2.1" fill="currentColor" stroke="none"/>
    <circle cx="17.4" cy="17" r="2.1" fill="currentColor" stroke="none"/>
  </svg>
);

// tiny sparkline polyline; pts = array 0..1
const Spark = ({ pts, w = 58, h = 22, color = 'var(--accent)' }) => {
  const max = Math.max(...pts), min = Math.min(...pts), rng = max - min || 1;
  const step = w / (pts.length - 1);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)} ${(h - 2 - ((p - min) / rng) * (h - 4)).toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} fill="none">
      <path d={d} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
    </svg>
  );
};

Object.assign(window, { Ico, Mark, Spark });

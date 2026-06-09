/* prims.jsx — shared data + chart primitives for all dashboard layouts. */
const { useId } = React;

const DATA = {
  endpoints: [
    { nm:'shopify-orders',    svc:'Sh', ok:true,  req24:'8,940', req7:'21,905', succ:'99.9%', p95:'88ms',  dest:'webhook.heyhomie.dev',  ago:'just now', share:100, hue:'var(--c1)', spark:[4,6,5,8,7,9,8,11,10,12] },
    { nm:'razorpay-payments', svc:'Rz', ok:true,  req24:'5,120', req7:'12,480', succ:'99.6%', p95:'102ms', dest:'webhook.heyhomie.dev',  ago:'2m ago',   share:64,  hue:'var(--c2)', spark:[3,4,4,6,5,7,8,7,8,9] },
    { nm:'sendgrid-events',   svc:'Sg', ok:true,  req24:'3,380', req7:'9,047',  succ:'99.2%', p95:'64ms',  dest:'mail.heyhomie.dev',     ago:'14m ago',  share:46,  hue:'var(--c3)', spark:[4,5,4,6,5,6,7,6,7,8] },
    { nm:'stripe-billing',    svc:'St', ok:true,  req24:'2,210', req7:'8,302',  succ:'100%',  p95:'76ms',  dest:'api.internal.svc',      ago:'9m ago',   share:42,  hue:'var(--c4)', spark:[5,5,6,5,7,6,7,8,7,9] },
    { nm:'github-ci',         svc:'Gh', ok:true,  req24:'1,290', req7:'3,114',  succ:'98.4%', p95:'140ms', dest:'ci.heyhomie.dev',       ago:'1h ago',   share:24,  hue:'var(--c1)', spark:[2,3,2,4,3,5,4,5,4,5] },
    { nm:'clerk-auth',        svc:'Ck', ok:false, req24:'0',     req7:'642',    succ:'—',     p95:'—',     dest:'localhost:4000',        ago:'3d ago',   share:8,   hue:'var(--c2)', spark:[3,2,2,1,2,1,1,1,1,1] },
  ],
  requests: [
    { m:'POST', ep:'shopify-orders',    code:200, ms:'42ms',  ago:'2s'  },
    { m:'POST', ep:'razorpay-payments', code:200, ms:'88ms',  ago:'9s'  },
    { m:'POST', ep:'sendgrid-events',   code:202, ms:'31ms',  ago:'18s' },
    { m:'POST', ep:'clerk-auth',        code:401, ms:'12ms',  ago:'31s' },
    { m:'POST', ep:'github-ci',         code:200, ms:'120ms', ago:'1m'  },
    { m:'POST', ep:'stripe-billing',    code:500, ms:'240ms', ago:'2m'  },
    { m:'POST', ep:'shopify-orders',    code:200, ms:'39ms',  ago:'3m'  },
    { m:'GET',  ep:'github-ci',         code:304, ms:'8ms',   ago:'4m'  },
  ],
  volume: [8,12,10,16,14,20,18,23,21,28,25,30,27,34,31,37,30,41,36,44,39,46,42,48],
};

function codeTone(code){ return code < 300 ? 'var(--ok)' : code < 400 ? 'var(--mid)' : code < 500 ? 'var(--warn)' : 'var(--danger)'; }

// Responsive area/line chart. Stretches to container width; stroke stays crisp.
function AreaChart({ pts, color='var(--accent)', h=120, strokeW=2, fillOp=0.20, area=true }) {
  const uid = useId().replace(/[:]/g,'');
  const w = 600;
  const max=Math.max(...pts), min=Math.min(...pts), rng=(max-min)||1;
  const step=w/(pts.length-1);
  const X=i=>+(i*step).toFixed(1);
  const Y=v=>+(h-3-((v-min)/rng)*(h-10)).toFixed(1);
  const line=pts.map((p,i)=>`${i?'L':'M'}${X(i)} ${Y(p)}`).join(' ');
  const areaP=`${line} L${w} ${h} L0 ${h} Z`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:'block'}}>
      <defs><linearGradient id={'g'+uid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={fillOp}/>
        <stop offset="100%" stopColor={color} stopOpacity="0"/>
      </linearGradient></defs>
      {area && <path d={areaP} fill={`url(#g${uid})`}/>}
      <path d={line} fill="none" stroke={color} strokeWidth={strokeW} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
    </svg>
  );
}

// Donut progress ring with centered children.
function Ring({ value, color='var(--accent)', size=96, sw=10, track='var(--inset)', children }) {
  const r=(size-sw)/2, c=2*Math.PI*r, off=c*(1-value/100);
  return (
    <div style={{position:'relative',width:size,height:size,flex:'0 0 auto'}}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={sw}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} transform={`rotate(-90 ${size/2} ${size/2})`}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',lineHeight:1.1}}>{children}</div>
    </div>
  );
}

// vertical mini bar chart (sparkline alternative)
function Bars({ pts, color='var(--accent)', h=34, gap=2 }) {
  const max=Math.max(...pts)||1;
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap,height:h}}>
      {pts.map((p,i)=>(<span key={i} style={{flex:1,height:`${Math.max(12,(p/max)*100)}%`,background:color,borderRadius:2,opacity:.35+0.65*(p/max)}}/>))}
    </div>
  );
}

Object.assign(window, { DATA, AreaChart, Ring, Bars, codeTone });

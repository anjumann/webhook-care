/* emerald-screens.jsx — extended screens for the Emerald · Sidebar console.
   All reuse the global Shell + theme tokens (data-v="emerald").
   Exports: EndpointDetail, RequestInspector, LiveRequests, Playground. */

/* ---------- local data ---------- */
const SVC = {
  'shopify-orders':    { svc: 'Sh', hue: 'var(--c1)' },
  'razorpay-payments': { svc: 'Rz', hue: 'var(--c2)' },
  'sendgrid-events':   { svc: 'Sg', hue: 'var(--c3)' },
  'stripe-billing':    { svc: 'St', hue: 'var(--c4)' },
  'github-ci':         { svc: 'Gh', hue: 'var(--c1)' },
  'clerk-auth':        { svc: 'Ck', hue: 'var(--c2)' },
};

const PAYLOAD = {
  id: 'evt_3PK9aQ2eZvKYlo2C',
  topic: 'orders/create',
  created_at: '2026-06-09T11:42:08Z',
  order: {
    id: 5821094477,
    number: 'HH-10428',
    currency: 'INR',
    total_price: '2499.00',
    financial_status: 'paid',
    line_items: [
      { sku: 'HH-TEE-BLK-M', title: 'Homie Tee — Black', quantity: 2, price: '799.00' },
      { sku: 'HH-CAP-OLV', title: 'Field Cap — Olive', quantity: 1, price: '901.00' },
    ],
    customer: { id: 41028, email: 'rhea@hey.dev', verified: true },
  },
};

const HEADERS = [
  ['Content-Type', 'application/json'],
  ['X-Shopify-Topic', 'orders/create'],
  ['X-Shopify-Hmac-SHA256', 'a8f3…d21e'],
  ['X-Shopify-Shop-Domain', 'heyhomie.myshopify.com'],
  ['X-Shopify-API-Version', '2026-04'],
  ['User-Agent', 'Shopify-Captain-Hook/1.0'],
];

/* recent requests for the inspector list (idx 0 selected) */
const RQ = [
  { m: 'POST', ep: 'shopify-orders', code: 200, ms: '42ms', ago: '2s' },
  { m: 'POST', ep: 'shopify-orders', code: 200, ms: '39ms', ago: '3m' },
  { m: 'POST', ep: 'shopify-orders', code: 200, ms: '51ms', ago: '8m' },
  { m: 'POST', ep: 'shopify-orders', code: 500, ms: '240ms', ago: '14m' },
  { m: 'POST', ep: 'shopify-orders', code: 200, ms: '44ms', ago: '22m' },
  { m: 'POST', ep: 'shopify-orders', code: 200, ms: '47ms', ago: '31m' },
  { m: 'POST', ep: 'shopify-orders', code: 401, ms: '12ms', ago: '48m' },
  { m: 'POST', ep: 'shopify-orders', code: 200, ms: '40ms', ago: '1h' },
];

/* full live stream across endpoints */
const STREAM = [
  { m: 'POST', ep: 'shopify-orders',    code: 200, ms: '42ms',  sz: '1.4 KB', ago: '2s'  },
  { m: 'POST', ep: 'razorpay-payments', code: 200, ms: '88ms',  sz: '0.9 KB', ago: '9s'  },
  { m: 'POST', ep: 'sendgrid-events',   code: 202, ms: '31ms',  sz: '2.1 KB', ago: '18s' },
  { m: 'POST', ep: 'clerk-auth',        code: 401, ms: '12ms',  sz: '0.4 KB', ago: '31s' },
  { m: 'POST', ep: 'github-ci',         code: 200, ms: '120ms', sz: '5.8 KB', ago: '1m'  },
  { m: 'POST', ep: 'stripe-billing',    code: 500, ms: '240ms', sz: '1.1 KB', ago: '2m'  },
  { m: 'POST', ep: 'shopify-orders',    code: 200, ms: '39ms',  sz: '1.4 KB', ago: '3m'  },
  { m: 'GET',  ep: 'github-ci',         code: 304, ms: '8ms',   sz: '0.0 KB', ago: '4m'  },
  { m: 'POST', ep: 'sendgrid-events',   code: 202, ms: '29ms',  sz: '2.0 KB', ago: '5m'  },
  { m: 'POST', ep: 'razorpay-payments', code: 200, ms: '76ms',  sz: '0.9 KB', ago: '6m'  },
  { m: 'POST', ep: 'stripe-billing',    code: 200, ms: '64ms',  sz: '1.0 KB', ago: '8m'  },
  { m: 'POST', ep: 'shopify-orders',    code: 200, ms: '51ms',  sz: '1.5 KB', ago: '9m'  },
  { m: 'POST', ep: 'clerk-auth',        code: 403, ms: '11ms',  sz: '0.3 KB', ago: '11m' },
];

/* json syntax highlighter → html string */
function hlJson(obj) {
  const json = JSON.stringify(obj, null, 2);
  const esc = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc.replace(
    /("(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g,
    (m) => {
      let cls = 'j-num';
      if (/^"/.test(m)) cls = /:$/.test(m) ? 'j-key' : 'j-str';
      else if (/true|false/.test(m)) cls = 'j-bool';
      else if (/null/.test(m)) cls = 'j-null';
      return '<span class="' + cls + '">' + m + '</span>';
    }
  );
}

const LiveDot = ({ label = 'streaming' }) => (
  <span className="live-tag"><span className="pulse" />{label}</span>
);

function StatusPill({ code, lg }) {
  const tone = codeTone(code);
  const txt = code < 300 ? 'OK' : code < 400 ? '' : code < 500 ? '' : 'Error';
  return (
    <span className={'code-pill' + (lg ? ' lg' : '')} style={{ color: tone, background: `color-mix(in srgb, ${tone} 16%, transparent)` }}>
      {code}{txt && ' ' + txt}
    </span>
  );
}

/* ============================================================
   1 · ENDPOINT DETAIL
   ============================================================ */
function EndpointDetail({ v, mode }) {
  const ep = 'shopify-orders';
  const s = SVC[ep];
  const stats = [
    { label: 'Requests · 24h', icon: Ico.inbox, num: '8,940', cls: 'up', delta: '+12.4%', pts: DATA.endpoints[0].spark },
    { label: 'Success rate', icon: Ico.shield, num: '99.9%', cls: 'flat', delta: '1 failure', pts: [9,9,9,8,9,9,9,9,9,9] },
    { label: 'p95 latency', icon: Ico.clock, num: '88ms', cls: 'flat', delta: 'p50 41ms', pts: [6,5,7,5,6,5,6,7,5,6] },
    { label: 'Forwarded', icon: Ico.send, num: '8,932', cls: 'up', delta: '99.9% delivered', pts: [4,6,5,8,7,9,8,10,9,11] },
  ];
  return (
    <Shell v={v} mode={mode} active="endpoints"
      crumb={<><span>Relay</span>{Ico.chevR}<span>Endpoints</span>{Ico.chevR}<b>{ep}</b></>}>
      <div className="dt-head">
        <span className="svc-logo dt-logo" style={{ background: s.hue }}>{s.svc}</span>
        <div className="dt-titles">
          <div className="row1">
            <span className="h1">{ep}</span>
            <span className="badge ok"><span className="d" />Active</span>
          </div>
          <span className="url"><span>https://relay.dev/in/{ep}</span><span className="cp">{Ico.copy}</span></span>
        </div>
        <div className="actions">
          <button className="btn ghost">{Ico.beaker}Send test</button>
          <button className="btn ghost">Pause</button>
          <button className="btn ghost" style={{ width: 34, padding: 0, justifyContent: 'center' }}>{Ico.more}</button>
        </div>
      </div>

      <div className="kpis">
        {stats.map((k, i) => (
          <div className={'kpi' + (i === 0 ? ' feature' : '')} key={k.label}>
            <div className="top"><span className="ic">{k.icon}</span>{k.label}</div>
            <div className="num">{k.num}</div>
            <div className={'delta ' + k.cls}>{k.cls === 'up' && Ico.arrowUp}{k.delta}</div>
            <div className="spark"><Spark pts={k.pts} color={'var(--c' + (i + 1) + ')'} /></div>
          </div>
        ))}
      </div>

      <div className="dgrid">
        {/* left: volume + recent */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="panel">
            <div className="panel-head">
              <span className="t">Request volume</span>
              <div className="right">
                <div className="segs"><span>1h</span><span className="on">24h</span><span>7d</span></div>
              </div>
            </div>
            <div style={{ padding: '16px 18px 8px' }}>
              <AreaChart pts={DATA.volume} color="var(--accent)" h={132} />
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="t">Recent requests</span>
              <div className="right"><LiveDot /></div>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: '14%' }}>Method</th>
                  <th>Status</th>
                  <th>Latency</th>
                  <th>Event</th>
                  <th style={{ textAlign: 'right' }}>Received</th>
                </tr>
              </thead>
              <tbody>
                {RQ.slice(0, 6).map((r, i) => (
                  <tr key={i}>
                    <td className="t-meth">{r.m}</td>
                    <td><StatusPill code={r.code} /></td>
                    <td className="mono muted">{r.ms}</td>
                    <td className="mono dim">orders/create</td>
                    <td className="dim" style={{ textAlign: 'right' }}>{r.ago} ago</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* right: forwarding + config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="sum-card">
            <div className="st">Forwarding to</div>
            <div className="fwd-res">
              <span className="st-ic" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}>{Ico.check}</span>
              <div className="body">
                <div className="u">webhook.heyhomie.dev</div>
                <div className="meta">2xx · avg 71ms · 99.9% delivered</div>
              </div>
            </div>
            <div className="fwd-res">
              <span className="st-ic" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}>{Ico.check}</span>
              <div className="body">
                <div className="u">localhost:4000/hooks</div>
                <div className="meta">2xx · avg 9ms · tunnel active</div>
              </div>
            </div>
            <button className="add-url" style={{ marginTop: 4 }}>{Ico.plus}Add destination</button>
          </div>

          <div className="sum-card">
            <div className="st">Configuration</div>
            <div className="meta-list">
              <div className="mi"><span className="l">Method</span><span className="v">ANY</span></div>
              <div className="mi"><span className="l">Retention</span><span className="v">30 days</span></div>
              <div className="mi"><span className="l">Verify signature</span><span className="v acc">On</span></div>
              <div className="mi"><span className="l">Retry on failure</span><span className="v acc">5×</span></div>
              <div className="mi"><span className="l">Region</span><span className="v">ap-south-1</span></div>
              <div className="mi"><span className="l">Created</span><span className="v">Feb 11, 2026</span></div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ============================================================
   2 · REQUEST INSPECTOR
   ============================================================ */
function RequestInspector({ v, mode }) {
  const TABS = [['Body', null], ['Headers', HEADERS.length], ['Query', 0]];
  return (
    <Shell v={v} mode={mode} active="requests" contentClass="flex"
      crumb={<><span>Relay</span>{Ico.chevR}<span>Requests</span>{Ico.chevR}<b className="mono" style={{ fontFamily: 'var(--mono)', fontSize: 12.5 }}>evt_3PK9aQ2e</b></>}>
      <div className="page-head" style={{ marginBottom: 18 }}>
        <div>
          <div className="h1">Request inspector</div>
          <div className="sub">Every captured payload, header and forwarding attempt — replayable in one click.</div>
        </div>
      </div>

      <div className="inspect">
        {/* left list */}
        <div className="col-list">
          <div className="lh"><span className="t">shopify-orders</span><span className="c">240</span><span style={{ marginLeft: 'auto' }}><LiveDot label="live" /></span></div>
          <div className="reqlist">
            {RQ.map((r, i) => (
              <div className={'reqitem' + (i === 0 ? ' on' : '')} key={i}>
                <span className="meth">{r.m}</span>
                <div className="pmid">
                  <div className="pth">orders/create</div>
                  <div className="tm">{r.ago} ago · {r.ms}</div>
                </div>
                <span className="scode" style={{ color: codeTone(r.code) }}>{r.code}</span>
              </div>
            ))}
          </div>
        </div>

        {/* right detail */}
        <div className="col-detail">
          <div className="det-head">
            <span className="meth-pill">POST</span>
            <span className="path">/in/shopify-orders</span>
            <StatusPill code={200} lg />
            <span className="ms">42&nbsp;ms</span>
            <span className="ts">Jun 9, 2026 · 11:42:08</span>
            <div className="right">
              <button className="btn ghost sm">{Ico.copy}cURL</button>
              <button className="btn ghost sm">{Ico.send}Forward</button>
              <button className="btn primary sm">{Ico.refresh}Replay</button>
            </div>
          </div>

          <div className="det-strip">
            <div className="chips">
              <span className="chip">{Ico.globe}Source IP<span className="mono">23.227.38.65</span></span>
              <span className="chip">Type<span className="mono">application/json</span></span>
              <span className="chip">Size<b>1.4 KB</b></span>
              <span className="chip">{Ico.shield}Signature<b style={{ color: 'var(--ok)' }}>Verified</b></span>
              <span className="chip">Event<span className="mono">orders/create</span></span>
            </div>
          </div>

          <div className="det-body">
            {/* main: tabs + json */}
            <div className="det-main">
              <div className="tabs">
                {TABS.map(([t, n], i) => (
                  <span className={'tab' + (i === 0 ? ' on' : '')} key={t}>{t}{n != null && <span className="n">{n}</span>}</span>
                ))}
              </div>
              <pre className="json" dangerouslySetInnerHTML={{ __html: hlJson(PAYLOAD) }} />
            </div>

            {/* side: forwarding + response */}
            <div className="det-side">
              <div className="sblock">
                <div className="sh">Forwarding{Ico.send && null}<span className="c">2 destinations</span></div>
                <div className="fwd-res">
                  <span className="st-ic" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}>{Ico.check}</span>
                  <div className="body">
                    <div className="u">webhook.heyhomie.dev</div>
                    <div className="meta">200 OK · 68 ms</div>
                  </div>
                  <span className="end"><StatusPill code={200} /></span>
                </div>
                <div className="fwd-res">
                  <span className="st-ic" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}>{Ico.check}</span>
                  <div className="body">
                    <div className="u">localhost:4000/hooks</div>
                    <div className="meta">200 OK · 9 ms · tunnel</div>
                  </div>
                  <span className="end"><StatusPill code={200} /></span>
                </div>
              </div>

              <div className="sblock" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div className="sh">Response headers<span className="c">4</span></div>
                <div className="kv">
                  {[['status', '200 OK'], ['x-relay-id', 'evt_3PK9aQ2e'], ['x-relay-region', 'ap-south-1'], ['retry-count', '0']].map(([k, val]) => (
                    <div className="kv-row" key={k}><span className="k">{k}</span><span className="v">{val}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ============================================================
   3 · LIVE REQUESTS
   ============================================================ */
function LiveRequests({ v, mode }) {
  return (
    <Shell v={v} mode={mode} active="requests"
      crumb={<><span>Relay</span>{Ico.chevR}<b>Requests</b></>}>
      <div className="page-head">
        <div>
          <div className="h1">Requests</div>
          <div className="sub">A live stream of every webhook captured across your endpoints.</div>
          <span className="env"><span className="pulse" />Production · ap-south-1</span>
        </div>
        <div className="actions">
          <button className="btn ghost">{Ico.filter}Pause</button>
          <button className="btn ghost">{Ico.download}Export</button>
        </div>
      </div>

      <div className="filterbar">
        <span className="fb-search">{Ico.search}<span>Search payloads, IDs, paths…</span></span>
        <span className="fb-select"><span className="lbl">Endpoint:</span>All{Ico.chevD}</span>
        <span className="fb-select"><span className="lbl">Method:</span>Any{Ico.chevD}</span>
        <span className="fb-select"><span className="lbl">Status:</span>All{Ico.chevD}</span>
        <span style={{ marginLeft: 'auto' }}><LiveDot label="live · 18/s" /></span>
      </div>

      <div className="panel">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: '10%' }}>Method</th>
              <th style={{ width: '26%' }}>Endpoint</th>
              <th>Status</th>
              <th>Latency</th>
              <th>Size</th>
              <th>Received</th>
              <th style={{ textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {STREAM.map((r, i) => {
              const s = SVC[r.ep];
              return (
                <tr key={i}>
                  <td className="t-meth">{r.m}</td>
                  <td>
                    <div className="ep">
                      <span className="svc-logo" style={{ width: 26, height: 26, borderRadius: 7, fontSize: 10, background: s.hue, flex: '0 0 auto' }}>{s.svc}</span>
                      <span><span className="nm" style={{ fontSize: 13.5 }}>{r.ep}</span></span>
                    </div>
                  </td>
                  <td><StatusPill code={r.code} /></td>
                  <td className="mono muted">{r.ms}</td>
                  <td className="mono dim">{r.sz}</td>
                  <td className="dim">{r.ago} ago</td>
                  <td>
                    <div className="row-acts"><button title="Inspect">{Ico.arrowR}</button></div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

/* ============================================================
   4 · PLAYGROUND
   ============================================================ */
function Playground({ v, mode }) {
  const body = `{
  "event": "payment.captured",
  "payload": {
    "amount": 249900,
    "currency": "INR",
    "method": "upi"
  }
}`;
  const tmpls = [
    { svc: 'Rz', hue: 'var(--c2)', nm: 'Razorpay', ev: 'payment.captured' },
    { svc: 'Sh', hue: 'var(--c1)', nm: 'Shopify', ev: 'orders/create' },
    { svc: 'St', hue: 'var(--c4)', nm: 'Stripe', ev: 'invoice.paid' },
    { svc: 'Gh', hue: 'var(--c1)', nm: 'GitHub', ev: 'push' },
  ];
  return (
    <Shell v={v} mode={mode} active="playground"
      crumb={<><span>Relay</span>{Ico.chevR}<b>Playground</b></>}>
      <div className="page-head">
        <div>
          <div className="h1">Playground</div>
          <div className="sub">Fire a test webhook at any endpoint and watch it flow through forwarding.</div>
        </div>
        <div className="actions">
          <button className="btn ghost">{Ico.history}History</button>
          <button className="btn primary">{Ico.zap}Send request</button>
        </div>
      </div>

      <div className="pg-grid">
        {/* compose */}
        <div className="panel" style={{ padding: 22 }}>
          <div className="field">
            <div className="flabel">Target endpoint</div>
            <div className="input-group">
              <span className="pfx">relay.dev/in/</span>
              <input defaultValue="razorpay-payments" />
              <span className="ai">{Ico.chevD}</span>
            </div>
          </div>

          <div className="field">
            <div className="field-row">
              <div>
                <div className="flabel">Method</div>
                <div className="method" style={{ width: '100%', justifyContent: 'space-between' }}><span className="mt">POST</span>{Ico.chevD}</div>
              </div>
              <div>
                <div className="flabel">Content-Type</div>
                <div className="method" style={{ width: '100%', justifyContent: 'space-between', color: 'var(--text)' }}><span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>application/json</span>{Ico.chevD}</div>
              </div>
            </div>
          </div>

          <div className="divide"></div>

          <div className="field">
            <div className="flabel" style={{ marginBottom: 11 }}>Headers</div>
            <div className="kv-edit"><input className="k" defaultValue="X-Razorpay-Signature" /><input className="v" defaultValue="b4f1a8…" /><button className="del">{Ico.trash}</button></div>
            <div className="kv-edit"><input className="k" defaultValue="X-Idempotency-Key" /><input className="v" defaultValue="test-0429" /><button className="del">{Ico.trash}</button></div>
            <button className="add-url">{Ico.plus}Add header</button>
          </div>

          <div className="divide"></div>

          <div className="field" style={{ marginBottom: 0 }}>
            <div className="flabel" style={{ marginBottom: 11 }}>Body<span className="opt">JSON</span></div>
            <textarea className="code-editor" rows="8" defaultValue={body}></textarea>
          </div>
        </div>

        {/* response + templates */}
        <div className="aside">
          <div className="sum-card">
            <div className="st">Last response</div>
            <div className="resp-status">
              <StatusPill code={200} lg />
              <span className="lbl">delivered to 2 destinations</span>
              <span className="resp-meta">128 ms<br /><span style={{ color: 'var(--dim)', fontSize: 11 }}>just now</span></span>
            </div>
            <div className="code" style={{ whiteSpace: 'pre-wrap' }}>
{'{ '}<span className="k">"id"</span>{': '}<span className="s">"evt_3PKb91x"</span>{', '}<span className="k">"status"</span>{': '}<span className="s">"captured"</span>{' }'}
            </div>
          </div>

          <div className="sum-card">
            <div className="st">Templates</div>
            {tmpls.map((t) => (
              <div className="tmpl" key={t.nm}>
                <span className="svc-logo lg" style={{ background: t.hue }}>{t.svc}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="nm">{t.nm}</div>
                  <div className="ev">{t.ev}</div>
                </div>
                <span className="go">{Ico.arrowR}</span>
              </div>
            ))}
          </div>

          <div className="tip">
            <span className="ti">{Ico.info}</span>
            <span className="tx"><b>Tip.</b> Sent requests appear in the endpoint's live log and replay through every forwarding destination.</span>
          </div>
        </div>
      </div>
    </Shell>
  );
}

Object.assign(window, { EndpointDetail, RequestInspector, LiveRequests, Playground });

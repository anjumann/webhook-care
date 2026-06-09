/* Screens.jsx — App shell + Dashboard + Create Endpoint. Exports to window. */

function Shell({ v, mode = 'dark', active, crumb, contentClass = '', children }) {
  const nav = [
    { k: 'endpoints', label: 'Endpoints', icon: Ico.activity, count: '12' },
    { k: 'requests', label: 'Requests', icon: Ico.inbox, count: '48k' },
    { k: 'forwarding', label: 'Forwarding', icon: Ico.send },
    { k: 'playground', label: 'Playground', icon: Ico.beaker },
    { k: 'history', label: 'History', icon: Ico.history },
  ];
  return (
    <div className="whc" data-v={v} data-mode={mode}>
      <aside className="side">
        <div className="brand">
          <span className="mark"><Mark /></span>
          <span className="name">Relay</span>
          <span className="ver">v2</span>
        </div>
        <nav className="nav">
          <div className="cap">Workspace</div>
          {nav.map((n) => (
            <div key={n.k} className={'nav-item' + (active === n.k ? ' active' : '')}>
              {n.icon}<span>{n.label}</span>
              {n.count && <span className="count">{n.count}</span>}
            </div>
          ))}
          <div className="cap">Account</div>
          <div className="nav-item">{Ico.settings}<span>Settings</span></div>
        </nav>
        <div className="side-foot">
          <div className="acct">
            <span className="av">AK</span>
            <span className="who">
              <span className="n">Aarav Kapoor</span>
              <span className="e">aarav@heyhomie.dev</span>
            </span>
            <span className="chev">{Ico.chevD}</span>
          </div>
        </div>
      </aside>
      <main className="main">
        <div className="topbar">
          <div className="crumb">{crumb}</div>
          <div className="spacer"></div>
          <div className="tsearch">{Ico.search}<span>Search endpoints…</span><span className="kbd">⌘K</span></div>
          <div className="ico-btn">{mode === 'dark' ? Ico.moon : Ico.sun}</div>
          <div className="ico-btn">{Ico.bell}</div>
        </div>
        <div className={'content' + (contentClass ? ' ' + contentClass : '')}>{children}</div>
      </main>
    </div>
  );
}

/* ---------------- DASHBOARD ---------------- */
const KPIS = [
  { label: 'Total endpoints', icon: Ico.activity, num: '12', delta: '+2 this week', cls: 'up', pts: [3,4,4,5,6,6,8,9,10,12] },
  { label: 'Active now', icon: Ico.zap, num: '9', delta: 'all healthy', cls: 'flat', pts: [6,7,6,8,7,9,8,9,9,9] },
  { label: 'Requests · 24h', icon: Ico.inbox, num: '48,219', delta: '+18.4%', cls: 'up', pts: [12,18,15,22,28,24,33,40,38,48] },
  { label: 'Avg response', icon: Ico.clock, num: '86ms', delta: 'p95 142ms', cls: 'flat', pts: [9,8,8,7,8,6,7,6,6,5] },
];

const ROWS = [
  { nm: 'shopify-orders', pa: '/in/wh_8fq2…orders', ok: true, req: '21,905', spark: [4,6,5,8,7,9,8], act: 'just now', cr: 'Feb 11, 2026' },
  { nm: 'razorpay-payments', pa: '/in/wh_k3p9…razorpay', ok: true, req: '12,480', spark: [3,4,4,6,5,7,8], act: '2m ago', cr: 'May 2, 2026' },
  { nm: 'stripe-billing', pa: '/in/wh_q71x…billing', ok: true, req: '8,302', spark: [5,5,6,5,7,6,7], act: '9m ago', cr: 'Apr 18, 2026' },
  { nm: 'github-ci', pa: '/in/wh_a02d…ci', ok: true, req: '3,114', spark: [2,3,2,4,3,5,4], act: '1h ago', cr: 'Apr 2, 2026' },
  { nm: 'clerk-auth', pa: '/in/wh_5m8e…auth', ok: false, req: '642', spark: [3,2,2,1,2,1,1], act: '3d ago', cr: 'Mar 28, 2026' },
];

function Dashboard({ v, mode }) {
  return (
    <Shell v={v} mode={mode} active="endpoints"
      crumb={<><span>Relay</span>{Ico.chevR}<b>Endpoints</b></>}>
      <div className="page-head">
        <div>
          <div className="h1">Endpoints</div>
          <div className="sub">Capture, inspect and forward webhooks across your integrations.</div>
          <span className="env"><span className="pulse"></span>Production · ap-south-1</span>
        </div>
        <div className="actions">
          <button className="btn ghost">{Ico.download}Export</button>
          <button className="btn primary">{Ico.plus}Create endpoint</button>
        </div>
      </div>

      <div className="kpis">
        {KPIS.map((k, i) => (
          <div className={'kpi' + (i === 0 ? ' feature' : '')} key={k.label}>
            <div className="top"><span className="ic">{k.icon}</span>{k.label}</div>
            <div className="num">{k.num}</div>
            <div className={'delta ' + k.cls}>
              {k.cls === 'up' && Ico.arrowUp}{k.delta}
            </div>
            <div className="spark"><Spark pts={k.pts} color={'var(--c' + (i + 1) + ')'} /></div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="t">All endpoints</span>
          <span className="c">12</span>
          <div className="right">
            <div className="segs"><span className="on">All</span><span>Active</span><span>Paused</span></div>
            <button className="btn ghost sm">{Ico.filter}Filter</button>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: '34%' }}>Endpoint</th>
              <th>Status</th>
              <th>Requests · 7d</th>
              <th>Last activity</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.nm}>
                <td>
                  <div className="ep">
                    <span className="dot" style={{ background: r.ok ? 'var(--ok)' : 'var(--dim)' }}></span>
                    <span>
                      <span className="nm">{r.nm}</span>
                      <span className="pa">relay.dev{r.pa}</span>
                    </span>
                  </div>
                </td>
                <td>
                  {r.ok
                    ? <span className="badge ok"><span className="d"></span>Active</span>
                    : <span className="badge off"><span className="d"></span>Paused</span>}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="num-cell">{r.req}</span>
                    <Spark pts={r.spark} w={46} h={18} color={r.ok ? 'var(--accent)' : 'var(--dim)'} />
                  </div>
                </td>
                <td className="muted">{r.act}</td>
                <td className="dim">{r.cr}</td>
                <td>
                  <div className="row-acts">
                    <button title="Copy URL">{Ico.copy}</button>
                    <button title="Open">{Ico.ext}</button>
                    <button title="More">{Ico.more}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

/* ---------------- CREATE ENDPOINT ---------------- */
function Toggle({ on }) { return <span className={'switch' + (on ? ' on' : '')}><i></i></span>; }

function CreateEndpoint({ v }) {
  return (
    <Shell v={v} active="endpoints"
      crumb={<><span>Relay</span>{Ico.chevR}<span>Endpoints</span>{Ico.chevR}<b>New</b></>}>
      <div className="page-head">
        <div>
          <div className="h1">Create endpoint</div>
          <div className="sub">Generate a unique URL, then forward incoming webhooks wherever you need.</div>
        </div>
      </div>

      <div className="form-wrap">
        {/* left: form */}
        <div className="panel" style={{ padding: 22 }}>
          <div className="field">
            <div className="flabel">Endpoint name</div>
            <div className="input-group">
              <span className="pfx">relay.dev/in/</span>
              <input defaultValue="razorpay-payments" />
              <span className="ai" title="Suggest a name">{Ico.sparkle}</span>
            </div>
            <div className="fhelp">Lowercase letters, numbers, dashes and underscores. This becomes your public path.</div>
          </div>

          <div className="field">
            <div className="flabel">Description <span className="opt">Optional</span></div>
            <textarea className="textarea" rows="2" defaultValue="Razorpay payment events for the heyhomie checkout flow — dev environment."></textarea>
          </div>

          <div className="divide"></div>

          <div className="field">
            <div className="flabel" style={{ marginBottom: 4 }}>Forwarding URLs</div>
            <div className="fhelp" style={{ marginTop: 0, marginBottom: 13 }}>Every captured request is replayed to each destination below.</div>
            <div className="fwd-row">
              <span className="method"><span className="mt">POST</span>{Ico.chevD}</span>
              <span className="input-group url"><input defaultValue="https://webhook.heyhomie.dev/webhook/razorpay/dev" /></span>
              <button className="del">{Ico.trash}</button>
            </div>
            <div className="fwd-row">
              <span className="method"><span className="mt">POST</span>{Ico.chevD}</span>
              <span className="input-group url"><input defaultValue="http://localhost:4000/hooks/razorpay" /></span>
              <button className="del">{Ico.trash}</button>
            </div>
            <button className="add-url">{Ico.plus}Add destination</button>
          </div>

          <div className="divide"></div>

          <div className="field" style={{ marginBottom: 0 }}>
            <div className="flabel" style={{ marginBottom: 8 }}>Options</div>
            <div className="opt-row">
              <span className="txt"><div className="ot">Retain payloads</div><div className="od">Store full request bodies for 30 days of replay & inspection.</div></span>
              <Toggle on={true} />
            </div>
            <div className="opt-row">
              <span className="txt"><div className="ot">Verify signatures</div><div className="od">Reject requests with an invalid <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>X-Razorpay-Signature</code> header.</div></span>
              <Toggle on={false} />
            </div>
            <div className="opt-row">
              <span className="txt"><div className="ot">Retry on failure</div><div className="od">Re-attempt forwarding up to 5× with exponential backoff.</div></span>
              <Toggle on={true} />
            </div>
          </div>

          <div className="divide"></div>
          <div className="form-foot">
            <span className="note">You can edit any of this later.</span>
            <span className="end">
              <button className="btn ghost">Cancel</button>
              <button className="btn primary">{Ico.check}Create endpoint</button>
            </span>
          </div>
        </div>

        {/* right: summary */}
        <div className="aside">
          <div className="sum-card">
            <div className="st">Your endpoint URL</div>
            <div className="url-box">
              <span className="u">https://relay.dev/in/razorpay-payments</span>
              <span className="cp">{Ico.copy}</span>
            </div>
            <div className="meta-list" style={{ marginTop: 14 }}>
              <div className="mi"><span className="l">Method</span><span className="v">ANY</span></div>
              <div className="mi"><span className="l">Destinations</span><span className="v acc">2</span></div>
              <div className="mi"><span className="l">Region</span><span className="v">ap-south-1</span></div>
              <div className="mi"><span className="l">Retention</span><span className="v">30 days</span></div>
            </div>
          </div>

          <div className="sum-card">
            <div className="st">Test with cURL</div>
            <div className="code">
{'curl -X '}<span className="k">POST</span>{' \\\n  https://relay.dev/in/'}<span className="p">razorpay-payments</span>{' \\\n  -H '}<span className="s">"Content-Type: application/json"</span>{' \\\n  -d '}<span className="s">{'\'{"event":"payment.captured"}\''}</span>
            </div>
          </div>

          <div className="tip">
            <span className="ti">{Ico.info}</span>
            <span className="tx"><b>No request yet.</b> Once you fire a webhook, it appears in the endpoint's live request log within milliseconds.</span>
          </div>
        </div>
      </div>
    </Shell>
  );
}

Object.assign(window, { Shell, Dashboard, CreateEndpoint });

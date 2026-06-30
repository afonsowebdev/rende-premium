/* ===== Charts (pure SVG) ===== */

function DonutChart({ data, size = 168, thickness = 24, center }) {
  const total = data.reduce((s, d) => s + d.valor, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  const items = data.filter((d) => d.valor > 0);
  const gap = items.length > 1 ? Math.min(C * 0.012, 6) : 0; // espaço entre fatias
  const uid = "dn" + Math.random().toString(36).slice(2, 9);
  const [hover, setHover] = React.useState(null);
  let acc = 0;
  return (
    <div className="donut-wrap" style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
        <defs>
          <filter id={uid} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="rgba(15,27,45,.20)" />
          </filter>
        </defs>
        {/* trilho de fundo */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        <g filter={`url(#${uid})`}>
          {data.map((d, i) => {
            if (d.valor <= 0) return null;
            const frac = d.valor / total;
            const len = frac * C;
            // arredonda as pontas sem distorcer a proporção: descontamos a espessura
            // (que as pontas redondas voltam a preencher) e centramos a fatia na fenda.
            const seg = Math.max(len - gap - thickness, 0.5);
            const start = acc + gap / 2 + thickness / 2;
            const el = (
              <circle key={i} className="donut-seg" cx={cx} cy={cy} r={r} fill="none" stroke={d.color}
                strokeWidth={thickness} strokeDasharray={`${seg} ${C - seg}`}
                strokeDashoffset={-start} strokeLinecap="round"
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                style={{ animationDelay: `${0.1 + i * 0.08}s`, cursor: "pointer", opacity: hover == null || hover === i ? 1 : 0.35, transition: "opacity .15s" }} />
            );
            acc += len;
            return el;
          })}
        </g>
      </svg>
      {(hover != null && data[hover] && data[hover].valor > 0) ? (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", padding: 12 }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: data[hover].color, marginBottom: 2 }}>{data[hover].nome || data[hover].label || ""}</div>
            <div className="tnum" style={{ fontSize: 17, fontWeight: 700 }}>{BM.eur(data[hover].valor)}</div>
            <div className="tiny muted" style={{ fontWeight: 700 }}>{Math.round((data[hover].valor / total) * 100)}%</div>
          </div>
        </div>
      ) : center ? (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
          {center}
        </div>
      ) : null}
    </div>
  );
}

function LineChart({ data, height = 216, color = "var(--accent)", color2 = "var(--neg)" }) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(560);
  const [hi, setHi] = React.useState(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => { const nw = Math.round(el.clientWidth || 560); setW((p) => (p === nw ? p : nw)); };
    measure();
    let ro = null;
    if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(measure); ro.observe(el); }
    else { window.addEventListener("resize", measure); }
    return () => { if (ro) ro.disconnect(); else window.removeEventListener("resize", measure); };
  }, []);

  const W = Math.max(260, w);
  const mobile = W < 430;
  const H = mobile ? 200 : height;
  const pad = { t: 18, r: 16, b: 28, l: mobile ? 34 : 44 };
  const vals = data.flatMap((d) => [d.rec, d.gasto]);
  const max = (Math.max(...vals) || 1) * 1.14;
  const min = Math.min(0, ...vals);
  const x = (i) => pad.l + (i / (data.length - 1 || 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - min) / (max - min || 1)) * (H - pad.t - pad.b);

  const toPts = (sel) => data.map((d, i) => ({ x: x(i), y: y(d[sel]) }));
  const smooth = (P) => {
    if (P.length < 2) return P.length ? `M${P[0].x},${P[0].y}` : "";
    let d = `M${P[0].x.toFixed(1)},${P[0].y.toFixed(1)}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };
  const recLine = smooth(toPts("rec"));
  const gastoLine = smooth(toPts("gasto"));
  const base = H - pad.b;
  const recArea = recLine + ` L${x(data.length - 1).toFixed(1)},${base} L${x(0).toFixed(1)},${base} Z`;
  const fs = mobile ? 12 : 11.5;

  const ticks = mobile ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1];
  const fmtAxis = (v) => { const n = Math.round(v); if (n >= 1000) { const k = n / 1000; return "€" + (k % 1 === 0 ? k : k.toFixed(1)) + "K"; } return "€" + n; };
  const lastRec = data.length ? { x: x(data.length - 1), y: y(data[data.length - 1].rec) } : null;

  return (
    <div ref={ref} style={{ width: "100%", position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id="lg-rec" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((g, i) => {
          const gy = pad.t + g * (H - pad.t - pad.b);
          const v = max - g * (max - min);
          return (
            <g key={i}>
              <line x1={pad.l} x2={W - pad.r} y1={gy} y2={gy} stroke="var(--border)" strokeWidth="1" strokeDasharray={g === 1 ? undefined : "3 6"} opacity={g === 1 ? 0.9 : 0.5} />
              <text x={pad.l - 8} y={gy + 3.5} textAnchor="end" fontSize={fs} fontWeight="600" fill="var(--ink-3)">{fmtAxis(v)}</text>
            </g>
          );
        })}
        <path className="lc-fade" d={recArea} fill="url(#lg-rec)" />
        <path className="lc-fade" d={gastoLine} fill="none" stroke={color2} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
        <path className="lc-draw" pathLength="1" d={recLine} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <g className="lc-fade">
          {data.map((d, i) => (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={fs} fontWeight="700" fill="var(--ink-3)">{d.m}</text>
          ))}
        </g>
        {lastRec && <circle className="lc-fade" cx={lastRec.x} cy={lastRec.y} r="5" fill={color} stroke="var(--surface)" strokeWidth="2.5" />}
        {hi != null && <line x1={x(hi)} x2={x(hi)} y1={pad.t} y2={base} stroke="var(--ink-3)" strokeWidth="1" strokeDasharray="3 4" opacity="0.45" />}
        {hi != null && data[hi] && (
          <g>
            <circle cx={x(hi)} cy={y(data[hi].gasto)} r="4" fill={color2} stroke="var(--surface)" strokeWidth="2.5" />
            <circle cx={x(hi)} cy={y(data[hi].rec)} r="4.5" fill={color} stroke="var(--surface)" strokeWidth="2.5" />
          </g>
        )}
        {data.map((d, i) => {
          const step = (W - pad.l - pad.r) / (data.length - 1 || 1);
          return <rect key={"hit" + i} x={x(i) - step / 2} y={pad.t} width={step} height={base - pad.t} fill="transparent" onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)} style={{ cursor: "pointer" }} />;
        })}
      </svg>
      {hi != null && data[hi] && (
        <div className="lc-tip" style={{ left: (x(hi) / W * 100) + "%" }}>
          <div className="lc-tip-m">{data[hi].m}</div>
          <div className="lc-tip-row"><span className="dot" style={{ background: color }} /> Recebido <b className="tnum">{BM.eur(data[hi].rec)}</b></div>
          <div className="lc-tip-row"><span className="dot" style={{ background: color2 }} /> Gasto <b className="tnum">{BM.eur(data[hi].gasto)}</b></div>
        </div>
      )}
    </div>
  );
}

function BarPair({ data, height = 220, color = "var(--accent)", color2 = "var(--c-transporte)" }) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(560);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => { const nw = Math.round(el.clientWidth || 560); setW((p) => (p === nw ? p : nw)); };
    measure();
    let ro = null;
    if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(measure); ro.observe(el); }
    else { window.addEventListener("resize", measure); }
    return () => { if (ro) ro.disconnect(); else window.removeEventListener("resize", measure); };
  }, []);

  const W = Math.max(260, w);
  const mobile = W < 430;
  const H = mobile ? 188 : height;
  const pad = { t: 14, b: 26 };
  const max = (Math.max(...data.map((d) => Math.max(d.rec, d.gasto))) || 1) * 1.12;
  const groupW = W / data.length;
  const bw = Math.min(mobile ? 13 : 17, groupW / 3.2);
  const gapIn = Math.max(3, bw * 0.28);
  const base = H - pad.b;
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  // barra com topo arredondado (path), pronta a "crescer" de baixo para cima
  const bar = (bx, v, fill, key, delay, op) => {
    const h = base - y(v);
    if (h <= 0.5) return null;
    const r = Math.min(bw / 2, 6, h);
    const top = base - h;
    const d = `M${bx.toFixed(1)},${base} L${bx.toFixed(1)},${(top + r).toFixed(1)} Q${bx.toFixed(1)},${top.toFixed(1)} ${(bx + r).toFixed(1)},${top.toFixed(1)} L${(bx + bw - r).toFixed(1)},${top.toFixed(1)} Q${(bx + bw).toFixed(1)},${top.toFixed(1)} ${(bx + bw).toFixed(1)},${(top + r).toFixed(1)} L${(bx + bw).toFixed(1)},${base} Z`;
    return <path key={key} className="bar-rise" d={d} fill={fill} opacity={op} style={{ animationDelay: `${delay}s` }} />;
  };

  return (
    <div ref={ref} style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block", overflow: "visible" }}>
        <line x1="0" x2={W} y1={base} y2={base} stroke="var(--border)" strokeWidth="1" />
        {data.map((d, i) => {
          const gx = i * groupW + groupW / 2;
          const x1 = gx - bw - gapIn / 2;
          const x2 = gx + gapIn / 2;
          return (
            <g key={i}>
              {bar(x1, d.rec, color, "r" + i, 0.05 + i * 0.06, 1)}
              {bar(x2, d.gasto, color2, "g" + i, 0.1 + i * 0.06, 0.92)}
              <text x={gx} y={H - 8} textAnchor="middle" fontSize={mobile ? 12 : 11.5} fontWeight="700" fill="var(--ink-3)">{d.m}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Sparkline({ data, w = 92, h = 32, color = "var(--accent)" }) {
  const max = Math.max(...data), min = Math.min(...data);
  const x = (i) => (i / (data.length - 1)) * w;
  const y = (v) => h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
  const d = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} style={{ flex: "none" }}>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BarBreakdown({ data, money, labelOf }) {
  const max = Math.max(1, ...data.map((d) => d.valor || 0));
  const tot = data.reduce((s, d) => s + (d.valor || 0), 0) || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
      {data.map((c) => {
        const pct = Math.round((c.valor / tot) * 100);
        const w = Math.max(4, Math.round((c.valor / max) * 100));
        return (
          <div key={c.key} title={(labelOf ? labelOf(c) : c.nome) + " — " + money(c.valor) + " · " + pct + "%"} style={{ cursor: "default" }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 7, alignItems: "baseline" }}>
              <span className="row" style={{ gap: 8, fontSize: 13, fontWeight: 700 }}><span className="dot" style={{ background: c.color }} />{labelOf ? labelOf(c) : c.nome}</span>
              <span className="tnum" style={{ fontSize: 12.5, fontWeight: 700 }}>{money(c.valor)} <span className="muted" style={{ fontWeight: 600 }}>· {pct}%</span></span>
            </div>
            <div style={{ height: 10, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
              <div className="bb-fill" style={{ width: w + "%", height: "100%", borderRadius: 999, background: c.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SavingsArea({ data, height = 168 }) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(420);
  React.useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const measure = () => { const nw = Math.round(el.clientWidth || 420); setW((p) => (p === nw ? p : nw)); };
    measure();
    let ro = null;
    if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(measure); ro.observe(el); }
    else { window.addEventListener("resize", measure); }
    return () => { if (ro) ro.disconnect(); else window.removeEventListener("resize", measure); };
  }, []);
  const W = Math.max(240, w);
  const H = height;
  const pad = { t: 16, r: 14, b: 26, l: 14 };
  const vals = data.map((d) => d.poupAcum || 0);
  const max = (Math.max(...vals) || 1) * 1.12;
  const x = (i) => pad.l + (i / (data.length - 1 || 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v / (max || 1)) * (H - pad.t - pad.b);
  const P = data.map((d, i) => ({ x: x(i), y: y(d.poupAcum || 0) }));
  const smooth = (pts) => {
    if (pts.length < 2) return pts.length ? `M${pts[0].x},${pts[0].y}` : "";
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };
  const line = smooth(P);
  const base = H - pad.b;
  const area = line + ` L${x(data.length - 1).toFixed(1)},${base} L${x(0).toFixed(1)},${base} Z`;
  const last = P[P.length - 1];
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id="sav-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--c-educacao)" stopOpacity="0.26" />
            <stop offset="100%" stopColor="var(--c-educacao)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((g, i) => { const gy = pad.t + g * (H - pad.t - pad.b); return <line key={i} x1={pad.l} x2={W - pad.r} y1={gy} y2={gy} stroke="var(--border)" strokeWidth="1" strokeDasharray={g === 1 ? undefined : "3 6"} opacity={g === 1 ? 0.9 : 0.5} />; })}
        <path className="lc-fade" d={area} fill="url(#sav-grad)" />
        <path className="lc-draw" pathLength="1" d={line} fill="none" stroke="var(--c-educacao)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <g className="lc-fade">
          {P.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.4" fill="var(--surface)" stroke="var(--c-educacao)" strokeWidth="2.2" />)}
          {data.map((d, i) => <text key={i} x={x(i)} y={H - 7} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="var(--ink-3)">{d.m}</text>)}
        </g>
        {last && <circle cx={last.x} cy={last.y} r="5" fill="var(--c-educacao)" />}
      </svg>
    </div>
  );
}

function MultiLineSavings({ months, series, height = 220 }) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(560);
  React.useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const measure = () => { const nw = Math.round(el.clientWidth || 560); setW((p) => (p === nw ? p : nw)); };
    measure();
    let ro = null;
    if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(measure); ro.observe(el); }
    else { window.addEventListener("resize", measure); }
    return () => { if (ro) ro.disconnect(); else window.removeEventListener("resize", measure); };
  }, []);
  const W = Math.max(260, w);
  const mobile = W < 430;
  const H = mobile ? 200 : height;
  const pad = { t: 16, r: 14, b: 26, l: 14 };
  const n = months.length;
  const max = Math.max(1, ...series.flatMap((s) => s.points)) * 1.12;
  const x = (i) => pad.l + (i / (n - 1 || 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v / (max || 1)) * (H - pad.t - pad.b);
  const smooth = (pts) => {
    if (pts.length < 2) return pts.length ? `M${pts[0].x},${pts[0].y}` : "";
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block", overflow: "visible" }}>
        {[0, 0.5, 1].map((g, i) => { const gy = pad.t + g * (H - pad.t - pad.b); return <line key={i} x1={pad.l} x2={W - pad.r} y1={gy} y2={gy} stroke="var(--border)" strokeWidth="1" strokeDasharray={g === 1 ? undefined : "3 6"} opacity={g === 1 ? 0.9 : 0.5} />; })}
        {series.map((s) => {
          const P = s.points.map((v, i) => ({ x: x(i), y: y(v) }));
          const last = P[P.length - 1];
          return (
            <g key={s.id} className="lc-fade">
              <path d={smooth(P)} fill="none" stroke={s.cor} strokeWidth={s.fechada ? 2 : 2.8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={s.fechada ? "2 6" : undefined} opacity={s.fechada ? 0.65 : 1} />
              {last && <circle cx={last.x} cy={last.y} r={mobile ? 4 : 3.6} fill="var(--surface)" stroke={s.cor} strokeWidth="2.4" opacity={s.fechada ? 0.65 : 1} />}
            </g>
          );
        })}
        {months.map((m, i) => <text key={i} x={x(i)} y={H - 7} textAnchor="middle" fontSize={mobile ? 12 : 11.5} fontWeight="700" fill="var(--ink-3)">{m}</text>)}
      </svg>
    </div>
  );
}

Object.assign(window, { DonutChart, LineChart, BarPair, Sparkline, BarBreakdown, SavingsArea, MultiLineSavings });
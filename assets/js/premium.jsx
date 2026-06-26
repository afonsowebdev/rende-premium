/* ===== Rende+ Premium: paywall + funcionalidades (lembretes, recorrentes, partilha, previsão) ===== */
/* Segue os padrões da app: usa useFinance, Icon, Modal, Field, EmptyState, BM.* e as classes/variáveis CSS existentes.
   Persistência local (localStorage) por utilizador. Quando o backend tiver endpoints, troca-se PremiumStore.* por API.*  */

const PremiumStore = (function () {
  let email = "anon";
  let state = null;
  const subs = new Set();
  const DEF = { premium: true, plano: "month", lembretes: [], recorrentes: [], grupos: [], subscricoes: [], pagosSub: {}, notif: { ativo: true, aviso: 3 }, notifLog: {} };
  const KEY = () => "rende_premium_" + email;
  const read = () => { try { return { ...DEF, ...(JSON.parse(localStorage.getItem(KEY()) || "{}")) }; } catch (e) { return { ...DEF }; } };
  const persist = () => { try { localStorage.setItem(KEY(), JSON.stringify(state)); } catch (e) {} };
  const emit = () => subs.forEach((f) => f(state));
  const get = () => state || (state = read());
  return {
    setUser(e) { const ne = e || "anon"; if (ne !== email) { email = ne; state = read(); } else if (!state) { state = read(); } },
    get,
    update(patch) { state = { ...get(), ...patch }; persist(); emit(); },
    add(kind, item) { this.update({ [kind]: [{ id: BM.uid(), ...item }, ...(get()[kind] || [])] }); },
    remove(kind, id) { this.update({ [kind]: (get()[kind] || []).filter((x) => x.id !== id) }); },
    edit(kind, id, patch) { this.update({ [kind]: (get()[kind] || []).map((x) => x.id === id ? { ...x, ...patch } : x) }); },
    activate(plano) { this.update({ premium: true, plano: plano || "month" }); },
    deactivate() { this.update({ premium: false }); },
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
  };
})();

function usePremium() {
  const fin = useFinance();
  const email = fin.account && fin.account.email;
  PremiumStore.setUser(email);
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => { PremiumStore.setUser(email); }, [email]);
  React.useEffect(() => PremiumStore.subscribe(() => force()), []);
  return PremiumStore;
}

const daysUntil = (iso) => Math.ceil((new Date(iso) - new Date(BM.todayISO())) / 86400000);
const numOf = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; };

/* ---------------- Paywall / planos ---------------- */
const PREM_FEATS = [
  { icon: "bell", t: "Lembretes de pagamento", d: "Avisamos-te antes de cada conta vencer." },
  { icon: "chart", t: "Previsão de saldo", d: "Vê como termina o mês antes de ele acabar." },
  { icon: "user", t: "Orçamentos partilhados", d: "Divide contas com quem vive contigo." },
  { icon: "sync", t: "Despesas recorrentes", d: "As que se repetem entram sozinhas." },
  { icon: "report", t: "Exportar dados", d: "Leva tudo em CSV quando quiseres." },
];

function Paywall() {
  const prem = usePremium();
  const s = prem.get();
  const [plano, setPlano] = React.useState(s.plano || "month");

  if (s.premium) {
    return (
      <div className="content">
        <div className="card card-pad prem-hero">
          <div className="prem-crown"><Icon name="spark" size={26} color="#fff" /></div>
          <div style={{ fontWeight: 800, fontSize: 19 }}>Premium ativo</div>
          <div className="muted" style={{ marginTop: 6, fontSize: 14 }}>Plano {s.plano === "year" ? "anual" : "mensal"} · obrigado por apoiares o Rende+.</div>
          <button className="btn btn-soft" style={{ marginTop: 16 }} onClick={() => prem.deactivate()}>Cancelar subscrição (demo)</button>
        </div>
      </div>
    );
  }

  const precos = { month: { v: "2,99 €", sub: "por mês" }, year: { v: "29,90 €", sub: "≈ 2,49 €/mês" } };
  return (
    <div className="content">
      <div className="card card-pad paywall">
        <div className="prem-crown"><Icon name="spark" size={26} color="#fff" /></div>
        <h2 style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-.01em", marginTop: 4 }}>Rende+ Premium</h2>
        <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>Controla o teu dinheiro com superpoderes.</p>

        <div className="prem-feats">
          {PREM_FEATS.map((f) => (
            <div className="prem-feat" key={f.t}>
              <span className="pf-ico"><Icon name={f.icon} size={17} color="var(--accent)" /></span>
              <div><b>{f.t}</b><span>{f.d}</span></div>
            </div>
          ))}
        </div>

        <div className="prem-plans">
          <button className={"prem-plan" + (plano === "month" ? " on" : "")} onClick={() => setPlano("month")}>
            <div className="pp-n">MENSAL</div><div className="pp-v">2,99 €</div><div className="pp-s">por mês</div>
          </button>
          <button className={"prem-plan" + (plano === "year" ? " on" : "")} onClick={() => setPlano("year")}>
            <span className="pp-tag">POUPA 2 MESES</span>
            <div className="pp-n">ANUAL</div><div className="pp-v">29,90 €</div><div className="pp-s">≈ 2,49 €/mês</div>
          </button>
        </div>

        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 15, fontSize: 15.5 }} onClick={() => prem.activate(plano)}>
          Começar 7 dias grátis
        </button>
        <p className="tiny muted" style={{ textAlign: "center", marginTop: 10, fontWeight: 600 }}>Cancela quando quiseres · {precos[plano].sub}</p>
        <p className="tiny muted" style={{ textAlign: "center", marginTop: 14, opacity: .8 }}>
          (Demo: ativa já o premium. Em produção, este botão abre o pagamento Stripe.)
        </p>
      </div>
    </div>
  );
}

/* Envolve um ecrã premium: mostra o paywall se ainda não for premium. */
function PremiumGate({ children }) {
  const prem = usePremium();
  if (!prem.get().premium) return <Paywall />;
  return children;
}

function PremActions({ label, onAdd }) {
  return (
    <div className="prem-actions">
      <button className="btn btn-primary" onClick={onAdd}><Icon name="plus" size={16} color="#fff" /> {label}</button>
    </div>
  );
}

/* ---------------- Lembretes ---------------- */
function LembreteModal({ item, onClose, onSave }) {
  const catKeys = Object.keys(BM.cats);
  const [f, setF] = React.useState(() => ({ titulo: item?.titulo || "", valor: item?.valor ?? "", data: item?.data || BM.todayISO(), aviso: item?.aviso ?? 3, cat: item?.cat || "outros", repete: item?.repete || false }));
  const [err, setErr] = React.useState("");
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const guardar = () => {
    if (!f.titulo.trim()) return setErr("Dá um nome ao lembrete.");
    if (numOf(f.valor) <= 0) return setErr("Indica um valor válido.");
    onSave({ titulo: f.titulo.trim(), valor: numOf(f.valor), data: f.data, aviso: +f.aviso, cat: f.cat, repete: !!f.repete });
  };
  return (
    <Modal title={item ? "Editar lembrete" : "Novo lembrete"} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={guardar}><Icon name="check" size={14} color="#fff" /> Guardar</button></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Nome"><input className="input" autoFocus value={f.titulo} onChange={set("titulo")} placeholder="Ex: Renda, Netflix…" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Valor"><input className="input" inputMode="decimal" value={f.valor} onChange={set("valor")} placeholder="0,00" /></Field>
          <Field label="Categoria"><select className="select" value={f.cat} onChange={set("cat")}>{catKeys.map((k) => <option key={k} value={k}>{BM.cats[k].nome}</option>)}</select></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Data de vencimento"><input className="input" type="date" value={f.data} onChange={set("data")} /></Field>
          <Field label="Avisar antes">
            <select className="select" value={f.aviso} onChange={set("aviso")}>
              {[1, 2, 3, 5, 7].map((d) => <option key={d} value={d}>{d} dia{d > 1 ? "s" : ""} antes</option>)}
            </select>
          </Field>
        </div>
        <label className="prem-check"><input type="checkbox" checked={f.repete} onChange={(e) => setF((s) => ({ ...s, repete: e.target.checked }))} /> <span>Repetir todos os meses <span className="muted">(ao pagar, reagenda para o mês seguinte)</span></span></label>
        {err && <div className="alert bad" style={{ padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
      </div>
    </Modal>
  );
}

function Lembretes() {
  return <PremiumGate><LembretesInner /></PremiumGate>;
}
function LembretesInner() {
  const prem = usePremium();
  const todos = [...(prem.get().lembretes || [])].sort((a, b) => (a.data || "").localeCompare(b.data || ""));
  const [modal, setModal] = React.useState(null);
  const [filtro, setFiltro] = React.useState("pendentes");
  const addMonths = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10); };

  const pendentes = todos.filter((l) => !l.pago);
  const atrasados = pendentes.filter((l) => daysUntil(l.data) < 0);
  const pagos = todos.filter((l) => l.pago);
  const totalPendente = pendentes.reduce((s, l) => s + (+l.valor || 0), 0);
  const totalAtrasado = atrasados.reduce((s, l) => s + (+l.valor || 0), 0);
  const totalPago = pagos.reduce((s, l) => s + (+l.valor || 0), 0);

  const lista = filtro === "pagos" ? pagos : filtro === "atrasados" ? atrasados : filtro === "todos" ? todos : pendentes;
  const marcarPago = (l) => { if (l.repete) prem.edit("lembretes", l.id, { data: addMonths(l.data, 1) }); else prem.edit("lembretes", l.id, { pago: true }); };

  const tiles = [
    { id: "pendentes", label: "Por pagar", val: BM.eur(totalPendente), sub: pendentes.length + " lembrete" + (pendentes.length === 1 ? "" : "s"), tone: "" },
    { id: "atrasados", label: "Atrasados", val: BM.eur(totalAtrasado), sub: atrasados.length + " em atraso", tone: "danger" },
    { id: "pagos", label: "Pagos", val: BM.eur(totalPago), sub: pagos.length + " concluído" + (pagos.length === 1 ? "" : "s"), tone: "ok" },
  ];

  return (
    <div className="content">
      <PremActions label="Novo lembrete" onAdd={() => setModal({})} />
      {todos.length === 0 ? (
        <EmptyState icon="bell" title="Sem lembretes" msg="Cria um lembrete e avisamos-te antes de cada conta vencer."
          action={<button className="btn btn-primary" onClick={() => setModal({})}><Icon name="plus" size={16} color="#fff" /> Criar lembrete</button>} />
      ) : (
        <>
          <div className="prem-stats">
            {tiles.map((t) => (
              <button key={t.id} className={"prem-stat " + (t.tone) + (filtro === t.id ? " on" : "")} onClick={() => setFiltro(t.id)}>
                <span className="prem-stat-l">{t.label}</span>
                <span className="prem-stat-v tnum">{t.val}</span>
                <span className="prem-stat-s">{t.sub}</span>
              </button>
            ))}
          </div>

          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {[["pendentes", "Por pagar"], ["atrasados", "Atrasados"], ["pagos", "Pagos"], ["todos", "Todos"]].map(([id, lbl]) => (
              <button key={id} className={"chip" + (filtro === id ? " sel" : "")} onClick={() => setFiltro(id)} style={{ cursor: "pointer" }}>{lbl}</button>
            ))}
          </div>

          {lista.length === 0 ? (
            <div className="card card-pad muted" style={{ textAlign: "center", fontSize: 13.5, fontWeight: 600 }}>Nada nesta lista.</div>
          ) : (
            <div className="card card-pad">
              {lista.map((l) => {
                const d = daysUntil(l.data);
                const pago = l.pago;
                const late = !pago && d < 0;
                const soon = !pago && d >= 0 && d <= (l.aviso || 3);
                const cat = BM.cats[l.cat] || BM.cats.outros;
                return (
                  <div className={"prem-row" + (late ? " is-late" : soon ? " is-soon" : "")} key={l.id}>
                    <span className="prem-rico" style={{ background: `color-mix(in srgb, ${cat.color} 14%, transparent)` }}><Icon name={cat.icon} size={18} color={cat.color} /></span>
                    <div className="prem-rtxt">
                      <b style={pago ? { textDecoration: "line-through", opacity: .55 } : null}>{l.titulo} {l.repete && <Icon name="repeat" size={13} color="var(--ink-3)" />}</b>
                      {pago ? <span className="pill-day done">pago</span> : <span className={"pill-day" + (late ? " late" : soon ? " soon" : "")}>{d < 0 ? Math.abs(d) + " dia" + (d === -1 ? "" : "s") + " em atraso" : d === 0 ? "vence hoje" : "vence em " + d + " dia" + (d > 1 ? "s" : "")}</span>}
                    </div>
                    <div className="prem-ramt">{BM.eur(l.valor)}</div>
                    <div className="prem-rbtns">
                      {pago
                        ? <button className="icon-btn" title="Marcar por pagar" onClick={() => prem.edit("lembretes", l.id, { pago: false })}><Icon name="refresh" size={16} /></button>
                        : <button className="icon-btn" title={l.repete ? "Pagar e reagendar" : "Marcar como pago"} onClick={() => marcarPago(l)}><Icon name="check" size={16} color="var(--accent)" /></button>}
                      <button className="icon-btn" title="Apagar" onClick={() => prem.remove("lembretes", l.id)}><Icon name="trash" size={16} color="var(--neg)" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {modal && <LembreteModal item={modal.id ? modal : null} onClose={() => setModal(null)} onSave={(it) => { prem.add("lembretes", it); setModal(null); }} />}
    </div>
  );
}

/* ---------------- Recorrentes ---------------- */
function RecorrenteModal({ onClose, onSave }) {
  const catKeys = Object.keys(BM.cats);
  const [f, setF] = React.useState({ titulo: "", valor: "", dia: 1, cat: "habitacao" });
  const [err, setErr] = React.useState("");
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const guardar = () => {
    if (!f.titulo.trim()) return setErr("Dá um nome à despesa.");
    if (numOf(f.valor) <= 0) return setErr("Indica um valor válido.");
    onSave({ titulo: f.titulo.trim(), valor: numOf(f.valor), dia: Math.min(28, Math.max(1, +f.dia || 1)), cat: f.cat });
  };
  return (
    <Modal title="Nova despesa recorrente" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={guardar}><Icon name="check" size={14} color="#fff" /> Guardar</button></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Nome"><input className="input" autoFocus value={f.titulo} onChange={set("titulo")} placeholder="Ex: Spotify, Seguro…" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Valor"><input className="input" inputMode="decimal" value={f.valor} onChange={set("valor")} placeholder="0,00" /></Field>
          <Field label="Dia do mês"><input className="input" type="number" min="1" max="28" value={f.dia} onChange={set("dia")} /></Field>
        </div>
        <Field label="Categoria">
          <select className="select" value={f.cat} onChange={set("cat")}>{catKeys.map((k) => <option key={k} value={k}>{BM.cats[k].nome}</option>)}</select>
        </Field>
        {err && <div className="alert bad" style={{ padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
      </div>
    </Modal>
  );
}

function Recorrentes() { return <PremiumGate><RecorrentesInner /></PremiumGate>; }
function RecorrentesInner() {
  const prem = usePremium();
  const lista = [...(prem.get().recorrentes || [])].sort((a, b) => (a.dia || 0) - (b.dia || 0));
  const [modal, setModal] = React.useState(false);
  const total = lista.reduce((s, x) => s + (+x.valor || 0), 0);
  return (
    <div className="content">
      <PremActions label="Nova recorrente" onAdd={() => setModal(true)} />
      {lista.length === 0 ? (
        <EmptyState icon="sync" title="Sem despesas recorrentes" msg="Regista as despesas que se repetem todos os meses e elas entram sozinhas."
          action={<button className="btn btn-primary" onClick={() => setModal(true)}><Icon name="plus" size={16} color="#fff" /> Adicionar</button>} />
      ) : (
        <>
          <div className="card card-pad" style={{ marginBottom: 14 }}>
            <div className="tiny muted" style={{ fontWeight: 700 }}>Total recorrente / mês</div>
            <div className="tnum" style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{BM.eur(total)}</div>
          </div>
          <div className="card card-pad">
            {lista.map((r) => (
              <div className="prem-row" key={r.id}>
                <span className="prem-rico"><Icon name={(BM.cats[r.cat] || BM.cats.outros).icon} size={19} color={(BM.cats[r.cat] || BM.cats.outros).color} /></span>
                <div className="prem-rtxt"><b>{r.titulo}</b><span className="muted" style={{ fontSize: 12.5 }}>Todos os dias {r.dia}</span></div>
                <div className="prem-ramt">{BM.eur(r.valor)}</div>
                <div className="prem-rbtns"><button className="icon-btn" title="Apagar" onClick={() => prem.remove("recorrentes", r.id)}><Icon name="trash" size={16} color="var(--neg)" /></button></div>
              </div>
            ))}
          </div>
        </>
      )}
      {modal && <RecorrenteModal onClose={() => setModal(false)} onSave={(it) => { prem.add("recorrentes", it); setModal(false); }} />}
    </div>
  );
}

/* ---------------- Partilha (orçamentos partilhados) ---------------- */
function GrupoModal({ onClose, onSave }) {
  const [nome, setNome] = React.useState("");
  const [membros, setMembros] = React.useState("");
  const [err, setErr] = React.useState("");
  const guardar = () => {
    if (!nome.trim()) return setErr("Dá um nome ao grupo.");
    const lista = membros.split(",").map((m) => m.trim()).filter(Boolean);
    if (lista.length === 0) return setErr("Adiciona pelo menos uma pessoa.");
    onSave({ nome: nome.trim(), membros: lista, despesas: [] });
  };
  return (
    <Modal title="Novo grupo" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={guardar}><Icon name="check" size={14} color="#fff" /> Criar grupo</button></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Nome do grupo"><input className="input" autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Casa do Porto, Viagem…" /></Field>
        <Field label="Membros" hint="Separa por vírgulas. Tu (Eu) já estás incluído.">
          <input className="input" value={membros} onChange={(e) => setMembros(e.target.value)} placeholder="Ana, João, Rita" />
        </Field>
        {err && <div className="alert bad" style={{ padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
      </div>
    </Modal>
  );
}
function DespesaPartilhadaModal({ grupo, onClose, onSave }) {
  const pessoas = ["Eu", ...(grupo.membros || [])];
  const [f, setF] = React.useState({ titulo: "", valor: "", data: BM.todayISO(), pagador: "Eu" });
  const [parts, setParts] = React.useState(() => pessoas.slice());
  const [err, setErr] = React.useState("");
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const toggle = (p) => setParts((arr) => arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]);
  const porPessoa = parts.length ? numOf(f.valor) / parts.length : 0;
  const guardar = () => {
    if (!f.titulo.trim()) return setErr("Dá um nome à despesa.");
    if (numOf(f.valor) <= 0) return setErr("Indica um valor válido.");
    if (parts.length === 0) return setErr("Escolhe quem divide a despesa.");
    onSave({ id: BM.uid(), titulo: f.titulo.trim(), valor: numOf(f.valor), data: f.data, pagador: f.pagador, participantes: parts });
  };
  return (
    <Modal title="Nova despesa" sub={grupo.nome} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={guardar}><Icon name="check" size={14} color="#fff" /> Adicionar</button></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Descrição"><input className="input" autoFocus value={f.titulo} onChange={set("titulo")} placeholder="Ex: Renda, Compras, Internet…" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Valor"><input className="input" inputMode="decimal" value={f.valor} onChange={set("valor")} placeholder="0,00" /></Field>
          <Field label="Data"><input className="input" type="date" value={f.data} onChange={set("data")} /></Field>
        </div>
        <Field label="Quem pagou">
          <select className="select" value={f.pagador} onChange={set("pagador")}>{pessoas.map((p) => <option key={p}>{p}</option>)}</select>
        </Field>
        <Field label="Dividir entre">
          <div className="prem-parts">
            {pessoas.map((p) => <button type="button" key={p} className={"chip" + (parts.includes(p) ? " sel" : "")} style={{ cursor: "pointer" }} onClick={() => toggle(p)}>{p}</button>)}
          </div>
        </Field>
        {numOf(f.valor) > 0 && parts.length > 0 && <div className="muted tiny" style={{ fontWeight: 600 }}>Cada pessoa fica com {BM.eur(porPessoa)}.</div>}
        {err && <div className="alert bad" style={{ padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
      </div>
    </Modal>
  );
}
function balancos(g) {
  const pessoas = ["Eu", ...(g.membros || [])];
  const net = {}; pessoas.forEach((p) => (net[p] = 0));
  (g.despesas || []).forEach((e) => {
    const parts = (e.participantes && e.participantes.length) ? e.participantes : pessoas;
    const share = (+e.valor || 0) / parts.length;
    if (net[e.pagador] == null) net[e.pagador] = 0;
    net[e.pagador] += (+e.valor || 0);
    parts.forEach((p) => { if (net[p] == null) net[p] = 0; net[p] -= share; });
  });
  Object.keys(net).forEach((p) => (net[p] = Math.round(net[p] * 100) / 100));
  return net;
}
const inicial = (p) => (p === "Eu" ? "Eu" : (p.trim()[0] || "?").toUpperCase());
function balTag(v) {
  if (Math.abs(v) < 0.01) return <span className="prem-bal-tag zero">saldado</span>;
  return <span className={"prem-bal-tag " + (v > 0 ? "pos" : "neg")}>{(v > 0 ? "recebe " : "deve ") + BM.eur(Math.abs(v))}</span>;
}

function Partilha() { return <PremiumGate><PartilhaInner /></PremiumGate>; }
function PartilhaInner() {
  const prem = usePremium();
  const grupos = prem.get().grupos || [];
  const [modal, setModal] = React.useState(false);
  const [despModal, setDespModal] = React.useState(null);
  const [openId, setOpenId] = React.useState(null);
  const aberto = grupos.find((g) => g.id === openId);

  if (aberto) {
    const net = balancos(aberto);
    const pessoas = ["Eu", ...(aberto.membros || [])];
    const total = (aberto.despesas || []).reduce((s, e) => s + (+e.valor || 0), 0);
    const desp = [...(aberto.despesas || [])].sort((a, b) => (b.data || "").localeCompare(a.data || ""));
    return (
      <div className="content">
        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setOpenId(null)}><span style={{ display: "grid", transform: "rotate(180deg)" }}><Icon name="chevR" size={15} /></span> Voltar</button>
          <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={() => setDespModal(aberto)}><Icon name="plus" size={15} color="#fff" /> Nova despesa</button>
        </div>
        <div className="card card-pad">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div><b style={{ fontSize: 17 }}>{aberto.nome}</b><div className="tiny muted" style={{ marginTop: 2 }}>{pessoas.join(" · ")}</div></div>
            <div style={{ textAlign: "right" }}><div className="tiny muted" style={{ fontWeight: 700 }}>Total gasto</div><div className="tnum" style={{ fontWeight: 800, fontSize: 19 }}>{BM.eur(total)}</div></div>
          </div>
        </div>
        <div className="card card-pad">
          <div className="prem-sec-t">Quem recebe e quem paga</div>
          {pessoas.map((p) => (
            <div className="prem-balrow" key={p}>
              <span className="prem-avatar">{inicial(p)}</span>
              <span style={{ flex: 1, fontWeight: 700 }}>{p}</span>
              {balTag(net[p] || 0)}
            </div>
          ))}
        </div>
        <div className="card card-pad">
          <div className="prem-sec-t">Despesas</div>
          {desp.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600 }}>Ainda sem despesas. Adiciona a primeira.</div> :
            desp.map((e) => {
              const parts = (e.participantes && e.participantes.length) ? e.participantes : pessoas;
              return (
                <div className="prem-row" key={e.id}>
                  <span className="prem-rico sm"><Icon name="receipt" size={17} color="var(--ink-2)" /></span>
                  <div className="prem-rtxt"><b>{e.titulo}</b><span className="muted" style={{ fontSize: 12 }}>{e.data ? BM.fmtData(e.data) + " · " : ""}Pagou {e.pagador} · ÷ {parts.length} = {BM.eur((+e.valor || 0) / parts.length)}</span></div>
                  <div className="prem-ramt">{BM.eur(e.valor)}</div>
                  <div className="prem-rbtns"><button className="icon-btn" title="Apagar despesa" onClick={() => prem.edit("grupos", aberto.id, { despesas: (aberto.despesas || []).filter((x) => x.id !== e.id) })}><Icon name="trash" size={15} color="var(--neg)" /></button></div>
                </div>
              );
            })}
        </div>
        {despModal && <DespesaPartilhadaModal grupo={aberto} onClose={() => setDespModal(null)} onSave={(d) => { prem.edit("grupos", aberto.id, { despesas: [...(aberto.despesas || []), d] }); setDespModal(null); }} />}
      </div>
    );
  }

  return (
    <div className="content">
      <PremActions label="Novo grupo" onAdd={() => setModal(true)} />
      {grupos.length === 0 ? (
        <EmptyState icon="users" title="Sem grupos" msg="Cria um grupo para dividires a casa, a viagem ou o jantar com quem quiseres. Ideal para quem vive em casa partilhada."
          action={<button className="btn btn-primary" onClick={() => setModal(true)}><Icon name="plus" size={16} color="#fff" /> Criar grupo</button>} />
      ) : (
        <div className="prem-groups">
          {grupos.map((g) => {
            const net = balancos(g);
            const meu = net["Eu"] || 0;
            const total = (g.despesas || []).reduce((s, e) => s + (+e.valor || 0), 0);
            const pessoas = ["Eu", ...(g.membros || [])];
            return (
              <div className="card card-pad prem-gcard" key={g.id}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="prem-gico"><Icon name="users" size={18} color="var(--accent)" /></span>
                  <button className="icon-btn" title="Apagar grupo" onClick={() => prem.remove("grupos", g.id)}><Icon name="trash" size={15} color="var(--neg)" /></button>
                </div>
                <b style={{ fontSize: 16, marginTop: 10, display: "block" }}>{g.nome}</b>
                <div className="prem-avatars">
                  {pessoas.slice(0, 5).map((p) => <span className="prem-avatar" key={p} title={p}>{inicial(p)}</span>)}
                  {pessoas.length > 5 && <span className="prem-avatar more">+{pessoas.length - 5}</span>}
                </div>
                <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
                  <span className="tiny muted" style={{ fontWeight: 700 }}>Total · {BM.eur(total)}</span>
                  {balTag(meu)}
                </div>
                <button className="btn btn-soft" style={{ marginTop: 12, width: "100%", justifyContent: "center" }} onClick={() => setOpenId(g.id)}>Abrir grupo</button>
              </div>
            );
          })}
        </div>
      )}
      {modal && <GrupoModal onClose={() => setModal(false)} onSave={(it) => { prem.add("grupos", it); setModal(false); }} />}
    </div>
  );
}

/* ---------------- Previsão + exportar ---------------- */
function Previsao() { return <PremiumGate><PrevisaoInner /></PremiumGate>; }
function PrevisaoInner() {
  const fin = useFinance();
  const prem = usePremium();
  const hojeDia = new Date().getDate();
  const recorrentes = prem.get().recorrentes || [];
  const aSair = recorrentes.filter((r) => r.dia >= hojeDia).reduce((s, r) => s + (+r.valor || 0), 0);
  const saldoAtual = fin.saldo || 0;
  const fimMes = saldoAtual - aSair;

  const despesas = fin.data?.despesas || [];
  const rendimentos = fin.data?.rendimentos || [];
  const code = fin.cur || "EUR";
  const money = (n) => (+n || 0).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + code;

  // meses disponíveis (dos dados) + mês atual, mais recente primeiro
  const meses = React.useMemo(() => {
    const set = new Set([BM.monthKey(BM.todayISO())]);
    [...despesas, ...rendimentos].forEach((x) => { if (x.data) set.add(BM.monthKey(x.data)); });
    return [...set].sort().reverse();
  }, [despesas, rendimentos]);
  const [mes, setMes] = React.useState(meses[0]);
  React.useEffect(() => { if (!meses.includes(mes)) setMes(meses[0]); }, [meses]);

  const rotuloMes = (mk) => { const [a, m] = mk.split("-"); return `${BM.MESES[+m - 1]} de ${a}`; };
  const doMes = (arr) => arr.filter((x) => x.data && BM.monthKey(x.data) === mes);
  const dMes = doMes(despesas), rMes = doMes(rendimentos);
  const totR = rMes.reduce((s, r) => s + (+r.valor || 0), 0);
  const totD = dMes.reduce((s, d) => s + (+d.valor || 0), 0);

  const linhas = () => {
    const out = [];
    rMes.forEach((r) => out.push([BM.fmtData ? BM.fmtData(r.data) : r.data, "Rendimento", r.cat || "—", r.fonte || "", money(r.valor)]));
    dMes.forEach((d) => out.push([BM.fmtData ? BM.fmtData(d.data) : d.data, "Despesa", (BM.cats[d.cat] || BM.cats.outros).nome, d.nome || "", "−" + money(d.valor)]));
    return out;
  };

  const baixarPDF = () => {
    const J = window.jspdf && window.jspdf.jsPDF;
    if (!J) return alert("A biblioteca de PDF não carregou. Confirma a ligação à internet e tenta de novo.");
    const doc = new J();
    doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(20, 160, 107);
    doc.text("Rende+", 14, 18);
    doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.setTextColor(70, 70, 70);
    doc.text("Relatório de " + rotuloMes(mes), 14, 26);
    doc.setTextColor(25, 25, 25); doc.setFontSize(12);
    doc.text("Rendimentos:  " + money(totR), 14, 40);
    doc.text("Despesas:  " + money(totD), 14, 47);
    doc.setFont("helvetica", "bold");
    doc.text("Saldo do mês:  " + money(totR - totD), 14, 54);
    doc.autoTable({
      startY: 62,
      head: [["Data", "Tipo", "Categoria", "Descrição", "Valor"]],
      body: linhas(),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [20, 160, 107], textColor: 255 },
      alternateRowStyles: { fillColor: [244, 248, 246] },
    });
    doc.save("rende-" + mes + ".pdf");
  };

  const baixarExcel = () => {
    const X = window.XLSX;
    if (!X) return alert("A biblioteca de Excel não carregou. Confirma a ligação à internet e tenta de novo.");
    const aoa = [["Data", "Tipo", "Categoria", "Descrição", "Valor (" + code + ")"]];
    rMes.forEach((r) => aoa.push([r.data, "Rendimento", r.cat || "", r.fonte || "", +r.valor || 0]));
    dMes.forEach((d) => aoa.push([d.data, "Despesa", (BM.cats[d.cat] || BM.cats.outros).nome, d.nome || "", -(+d.valor || 0)]));
    aoa.push([], ["", "", "", "Rendimentos", totR], ["", "", "", "Despesas", -totD], ["", "", "", "Saldo do mês", totR - totD]);
    const ws = X.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 24 }, { wch: 14 }];
    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, ws, rotuloMes(mes).slice(0, 28));
    X.writeFile(wb, "rende-" + mes + ".xlsx");
  };

  return (
    <div className="content">
      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <div className="tiny muted" style={{ fontWeight: 700 }}>Previsão de saldo</div>
        <div className="prem-frow"><span>Saldo atual</span><b className="tnum">{BM.eur(saldoAtual)}</b></div>
        <div className="prem-frow"><span>Recorrentes ainda por sair</span><b className="tnum" style={{ color: "var(--neg)" }}>−{BM.eur(aSair)}</b></div>
        <div className="prem-frow total"><span>No fim do mês</span><b className="tnum" style={{ color: fimMes >= 0 ? "var(--accent)" : "var(--neg)" }}>{BM.eur(fimMes)}</b></div>
      </div>

      <div className="card card-pad">
        <div style={{ fontWeight: 800, fontSize: 15 }}>Relatório do mês</div>
        <p className="muted" style={{ fontSize: 13.5, margin: "6px 0 14px" }}>Escolhe o mês e descarrega o resumo completo em PDF ou Excel.</p>

        <Field label="Mês">
          <select className="select" value={mes} onChange={(e) => setMes(e.target.value)}>
            {meses.map((m) => <option key={m} value={m}>{rotuloMes(m)}</option>)}
          </select>
        </Field>

        <div className="prem-frow" style={{ marginTop: 12 }}><span>Rendimentos</span><b className="tnum" style={{ color: "var(--accent)" }}>{BM.eur(totR)}</b></div>
        <div className="prem-frow"><span>Despesas</span><b className="tnum" style={{ color: "var(--neg)" }}>{BM.eur(totD)}</b></div>
        <div className="prem-frow total"><span>Saldo do mês</span><b className="tnum">{BM.eur(totR - totD)}</b></div>

        <div className="row" style={{ gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={baixarPDF}><Icon name="pdf" size={16} color="#fff" /> Descarregar PDF</button>
          <button className="btn btn-soft" onClick={baixarExcel}><Icon name="sheet" size={16} /> Descarregar Excel</button>
        </div>
        {(dMes.length + rMes.length) === 0 && <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>Ainda não há movimentos neste mês. O ficheiro vai sair só com o resumo.</p>}
      </div>
    </div>
  );
}

/* pequeno selo Premium para a navegação */
/* ---------------- Subscrições (streaming & contas mensais) ---------------- */
/* Catálogo de serviços comuns. Os valores são apenas sugestões iniciais —
   o utilizador ajusta ao seu plano. Usamos ícones genéricos (não logótipos). */
const SUB_CATALOGO = [
  { nome: "Netflix", icon: "film", color: "#e50914", valor: 13.99 },
  { nome: "Disney+", icon: "film", color: "#1f6feb", valor: 9.99 },
  { nome: "HBO Max", icon: "film", color: "#7b4dff", valor: 9.99 },
  { nome: "Prime Video", icon: "film", color: "#00a8e1", valor: 6.99 },
  { nome: "Apple TV+", icon: "tv", color: "#787880", valor: 9.99 },
  { nome: "YouTube Premium", icon: "film", color: "#ff0000", valor: 12.99 },
  { nome: "Spotify", icon: "music", color: "#1db954", valor: 6.99 },
  { nome: "Apple Music", icon: "music", color: "#fa2d48", valor: 10.99 },
  { nome: "YouTube Music", icon: "music", color: "#e53935", valor: 10.99 },
  { nome: "Tidal", icon: "music", color: "#22c1e8", valor: 10.99 },
  { nome: "Deezer", icon: "music", color: "#a238ff", valor: 11.99 },
  { nome: "iCloud+", icon: "wifi", color: "#3693f3", valor: 0.99 },
  { nome: "Google One", icon: "wifi", color: "#4285f4", valor: 1.99 },
  { nome: "Dropbox", icon: "wifi", color: "#0061ff", valor: 11.99 },
  { nome: "Microsoft 365", icon: "briefcase", color: "#d83b01", valor: 7.00 },
  { nome: "PlayStation Plus", icon: "game", color: "#0070d1", valor: 8.99 },
  { nome: "Xbox Game Pass", icon: "game", color: "#107c10", valor: 12.99 },
  { nome: "Twitch", icon: "tv", color: "#9146ff", valor: 4.99 },
  { nome: "ChatGPT Plus", icon: "spark", color: "#10a37f", valor: 23.00 },
  { nome: "Notion", icon: "briefcase", color: "#787880", valor: 9.50 },
  { nome: "Amazon Prime", icon: "bag", color: "#00a8e1", valor: 4.99 },
];

function SubModal({ mesAtual, onClose, onSave }) {
  const [base, setBase] = React.useState(null); // null = ainda a escolher do catálogo
  const [f, setF] = React.useState({ nome: "", valor: "", dia: 1, icon: "tv", color: "var(--accent)" });
  const [err, setErr] = React.useState("");
  const escolher = (c) => { setBase(c); setF({ nome: c.nome, valor: String(c.valor).replace(".", ","), dia: 1, icon: c.icon, color: c.color }); setErr(""); };
  const outra = () => { setBase({ nome: "" }); setF({ nome: "", valor: "", dia: 1, icon: "spark", color: "var(--accent)" }); setErr(""); };
  const guardar = () => {
    if (!f.nome.trim()) return setErr("Dá um nome à subscrição.");
    if (numOf(f.valor) <= 0) return setErr("Indica um valor válido.");
    onSave({ nome: f.nome.trim(), valor: numOf(f.valor), dia: Math.min(28, Math.max(1, +f.dia || 1)), icon: f.icon, color: f.color, desde: mesAtual });
  };

  if (base === null) {
    return (
      <Modal title="Adicionar subscrição" onClose={onClose}
        footer={<button className="btn btn-ghost" onClick={onClose}>Cancelar</button>}>
        <p className="muted" style={{ fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>Escolhe um serviço (ajustas o valor a seguir) ou cria um à medida.</p>
        <div className="sub-grid">
          {SUB_CATALOGO.map((c) => (
            <button key={c.nome} className="sub-pick" onClick={() => escolher(c)}>
              <span className="sub-pick-ico" style={{ background: `color-mix(in srgb, ${c.color} 16%, transparent)` }}><Icon name={c.icon} size={18} color={c.color} /></span>
              <span className="sub-pick-n">{c.nome}</span>
            </button>
          ))}
          <button className="sub-pick" onClick={outra}>
            <span className="sub-pick-ico" style={{ background: "var(--surface-2)" }}><Icon name="plus" size={18} color="var(--ink-2)" /></span>
            <span className="sub-pick-n">Outra…</span>
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={base.nome || "Nova subscrição"} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={() => setBase(null)}>Voltar</button><button className="btn btn-primary" onClick={guardar}><Icon name="check" size={14} color="#fff" /> Adicionar</button></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Nome"><input className="input" autoFocus value={f.nome} onChange={(e) => setF((s) => ({ ...s, nome: e.target.value }))} placeholder="Ex: Netflix" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Valor / mês" hint="Ajusta ao teu plano."><input className="input" inputMode="decimal" value={f.valor} onChange={(e) => setF((s) => ({ ...s, valor: e.target.value }))} placeholder="0,00" /></Field>
          <Field label="Dia de pagamento"><input className="input" type="number" min="1" max="28" value={f.dia} onChange={(e) => setF((s) => ({ ...s, dia: e.target.value }))} /></Field>
        </div>
        {err && <div className="alert bad" style={{ padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
      </div>
    </Modal>
  );
}

function Subscricoes() { return <PremiumGate><SubscricoesInner /></PremiumGate>; }
function SubscricoesInner() {
  const fin = useFinance();
  const prem = usePremium();
  const mes = fin.month; // "AAAA-MM" — o mês selecionado no topo
  const todas = prem.get().subscricoes || [];
  const pagos = prem.get().pagosSub || {};
  const [modal, setModal] = React.useState(false);

  // só mostra as subscrições já existentes neste mês (a partir do mês em que foram criadas)
  const ativas = [...todas].filter((s) => !s.desde || s.desde <= mes).sort((a, b) => (a.dia || 0) - (b.dia || 0));
  const isPago = (id) => !!(pagos[id] && pagos[id][mes]);
  const togglePago = (id) => {
    const cur = prem.get().pagosSub || {};
    const ms = { ...(cur[id] || {}) };
    if (ms[mes]) delete ms[mes]; else ms[mes] = true;
    prem.update({ pagosSub: { ...cur, [id]: ms } });
  };
  const apagar = (id) => {
    const cur = prem.get().pagosSub || {};
    if (cur[id]) { const c2 = { ...cur }; delete c2[id]; prem.update({ pagosSub: c2 }); }
    prem.remove("subscricoes", id);
  };

  const total = ativas.reduce((s, x) => s + (+x.valor || 0), 0);
  const nPagas = ativas.filter((s) => isPago(s.id)).length;
  const pagoTotal = ativas.filter((s) => isPago(s.id)).reduce((s, x) => s + (+x.valor || 0), 0);
  const falta = total - pagoTotal;

  return (
    <div className="content">
      <PremActions label="Adicionar subscrição" onAdd={() => setModal(true)} />
      {ativas.length === 0 ? (
        <EmptyState icon="tv" title="Sem subscrições neste mês" msg="Adiciona as tuas subscrições (Netflix, Spotify, iCloud…), define o valor e o dia, e marca cada mês o que já pagaste."
          action={<button className="btn btn-primary" onClick={() => setModal(true)}><Icon name="plus" size={16} color="#fff" /> Adicionar subscrição</button>} />
      ) : (
        <>
          <div className="prem-stats">
            <div className="prem-stat"><span className="prem-stat-l">Total do mês</span><span className="prem-stat-v tnum">{BM.eur(total)}</span><span className="prem-stat-s">{ativas.length} subscriç{ativas.length === 1 ? "ão" : "ões"}</span></div>
            <div className="prem-stat ok"><span className="prem-stat-l">Já pago</span><span className="prem-stat-v tnum">{BM.eur(pagoTotal)}</span><span className="prem-stat-s">{nPagas} marcada{nPagas === 1 ? "" : "s"}</span></div>
            <div className={"prem-stat" + (falta > 0 ? " danger" : "")}><span className="prem-stat-l">Falta pagar</span><span className="prem-stat-v tnum">{BM.eur(falta)}</span><span className="prem-stat-s">{ativas.length - nPagas} por pagar</span></div>
          </div>

          <div className="card card-pad">
            {ativas.map((s) => {
              const pago = isPago(s.id);
              const cor = s.color || "var(--accent)";
              return (
                <div className={"prem-row" + (pago ? " is-paid" : "")} key={s.id}>
                  <span className="prem-rico" style={{ background: `color-mix(in srgb, ${cor} 14%, transparent)` }}><Icon name={s.icon || "tv"} size={18} color={cor} /></span>
                  <div className="prem-rtxt">
                    <b style={pago ? { opacity: .55 } : null}>{s.nome}</b>
                    <span className="muted" style={{ fontSize: 12.5 }}>Todos os dias {s.dia}{pago ? " · pago ✓" : ""}</span>
                  </div>
                  <div className="prem-ramt" style={pago ? { opacity: .55 } : null}>{BM.eur(s.valor)}</div>
                  <div className="prem-rbtns">
                    <button className={"sub-check" + (pago ? " on" : "")} title={pago ? "Marcar como por pagar" : "Marcar como pago"} onClick={() => togglePago(s.id)}>
                      <Icon name="check" size={15} color={pago ? "#fff" : "var(--ink-3)"} />
                    </button>
                    <button className="icon-btn" title="Apagar subscrição" onClick={() => apagar(s.id)}><Icon name="trash" size={16} color="var(--neg)" /></button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="tiny muted" style={{ textAlign: "center", marginTop: 14, fontWeight: 600, lineHeight: 1.5 }}>
            Muda o mês nas setas lá em cima para marcares pagamentos de meses anteriores. Cada mês guarda as suas próprias marcas.
          </p>
        </>
      )}
      {modal && <SubModal mesAtual={mes} onClose={() => setModal(false)} onSave={(it) => { prem.add("subscricoes", it); setModal(false); }} />}
    </div>
  );
}

/* ---------------- Notificações (avisos de pagamento) ---------------- */
/* Varre lembretes (por pagar) e subscrições (por pagar no mês atual) e
   devolve os que vencem dentro de X dias (cfg.aviso) ou já estão atrasados.
   Baseia-se SEMPRE na data real de hoje, não no mês que estás a ver. */
function scanAlertas(prem) {
  const s = prem.get();
  const aviso = (s.notif && typeof s.notif.aviso === "number") ? s.notif.aviso : 3;
  const out = [];
  (s.lembretes || []).filter((l) => !l.pago).forEach((l) => {
    const d = daysUntil(l.data);
    if (d <= aviso) out.push({ chave: "lem:" + l.id, tipo: "lembrete", id: l.id, titulo: l.titulo, valor: l.valor, d });
  });
  const mes = BM.todayISO().slice(0, 7);
  const pagos = s.pagosSub || {};
  (s.subscricoes || []).filter((x) => !x.desde || x.desde <= mes).forEach((x) => {
    if (pagos[x.id] && pagos[x.id][mes]) return; // já paga este mês
    const alvo = mes + "-" + String(Math.min(28, x.dia || 1)).padStart(2, "0");
    const d = daysUntil(alvo);
    if (d <= aviso) out.push({ chave: "sub:" + x.id + ":" + mes, tipo: "subscricao", id: x.id, titulo: x.nome, valor: x.valor, d });
  });
  return out.sort((a, b) => a.d - b.d);
}

/* Resolve um alerta (marca como pago). */
function resolverAlerta(prem, a) {
  if (a.tipo === "lembrete") {
    const l = (prem.get().lembretes || []).find((x) => x.id === a.id);
    if (l && l.repete) { const dt = new Date(l.data + "T00:00:00"); dt.setMonth(dt.getMonth() + 1); prem.edit("lembretes", a.id, { data: dt.toISOString().slice(0, 10) }); }
    else prem.edit("lembretes", a.id, { pago: true });
  } else {
    const mes = BM.todayISO().slice(0, 7);
    const cur = prem.get().pagosSub || {};
    prem.update({ pagosSub: { ...cur, [a.id]: { ...(cur[a.id] || {}), [mes]: true } } });
  }
}

/* Dispara notificações nativas do dispositivo (só enquanto a app está aberta).
   Junta tudo numa só notificação-resumo e não repete o mesmo aviso no mesmo dia. */
function dispararNotificacoesNativas(prem) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const s = prem.get();
  if (!(s.notif && s.notif.ativo)) return;
  const hoje = BM.todayISO();
  const log = s.notifLog || {};
  const jaHoje = new Set(log[hoje] || []);
  const novos = scanAlertas(prem).filter((a) => !jaHoje.has(a.chave));
  if (!novos.length) return;
  const titulo = novos.length === 1 ? "Tens um pagamento a tratar" : `Tens ${novos.length} pagamentos a tratar`;
  const corpo = novos.slice(0, 3).map((a) => `${a.titulo} · ${BM.eur(a.valor)}`).join("\n") + (novos.length > 3 ? `\n+ ${novos.length - 3} mais` : "");
  try { new Notification("Rende+ · " + titulo, { body: corpo, icon: "/icon-192.png", badge: "/icon-192.png", tag: "rende-pagamentos", renotify: true }); } catch (e) {}
  prem.update({ notifLog: { [hoje]: [...jaHoje, ...novos.map((a) => a.chave)] } }); // guarda só o dia de hoje (auto-limpa o passado)
}

const quandoTxt = (d) => d < 0 ? `há ${Math.abs(d)} dia${d === -1 ? "" : "s"}` : d === 0 ? "vence hoje" : `vence em ${d} dia${d > 1 ? "s" : ""}`;

function NotifBell() {
  const prem = usePremium();
  const [open, setOpen] = React.useState(false);
  const [perm, setPerm] = React.useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  const s = prem.get();
  const cfg = s.notif || { ativo: true, aviso: 3 };
  const alertas = scanAlertas(prem);
  const count = alertas.length;

  // dispara ao abrir a app e a cada 30 min enquanto está aberta
  React.useEffect(() => {
    if (!cfg.ativo) return;
    const tick = () => dispararNotificacoesNativas(prem);
    tick();
    const iv = setInterval(tick, 1000 * 60 * 30);
    return () => clearInterval(iv);
  }, [cfg.ativo]);

  const pedirPermissao = () => {
    if (typeof Notification === "undefined") return;
    Notification.requestPermission().then((p) => { setPerm(p); if (p === "granted") dispararNotificacoesNativas(prem); });
  };
  const setCfg = (patch) => prem.update({ notif: { ...cfg, ...patch } });

  return (
    <div className="notif-wrap">
      <button className="icon-btn notif-btn" title="Notificações" onClick={() => setOpen((v) => !v)}>
        <Icon name="bell" size={18} />
        {count > 0 && <span className="notif-badge">{count > 9 ? "9+" : count}</span>}
      </button>
      {open && (
        <>
          <div className="notif-pop-bg" onClick={() => setOpen(false)} />
          <div className="notif-pop" onClick={(e) => e.stopPropagation()}>
            <div className="notif-head">
              <span style={{ fontWeight: 800, fontSize: 14.5 }}>Notificações</span>
              {count > 0 && <span className="notif-head-count">{count}</span>}
            </div>

            {perm !== "granted" && perm !== "unsupported" && (
              <div className="notif-perm">
                <div>
                  <b style={{ fontSize: 13 }}>Ativar avisos no dispositivo</b>
                  <span style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                    {perm === "denied" ? "Estão bloqueados — ativa-os nas definições do navegador." : "Para receberes avisos mesmo fora desta página."}
                  </span>
                </div>
                {perm === "default" && <button className="btn btn-primary" style={{ padding: "8px 12px", fontSize: 12.5 }} onClick={pedirPermissao}>Ativar</button>}
              </div>
            )}

            <div className="notif-list">
              {alertas.length === 0 ? (
                <div className="notif-empty"><Icon name="check" size={20} color="var(--accent)" /><span>Estás em dia. Nada a pagar por agora.</span></div>
              ) : (
                alertas.map((a) => {
                  const cor = a.d < 0 ? "var(--neg)" : a.d === 0 ? "var(--neg)" : "var(--accent)";
                  return (
                    <div className="notif-item" key={a.chave}>
                      <span className="notif-item-ico" style={{ background: `color-mix(in srgb, ${cor} 14%, transparent)` }}><Icon name={a.tipo === "subscricao" ? "tv" : "bell"} size={16} color={cor} /></span>
                      <div className="notif-item-txt">
                        <b>{a.titulo}</b>
                        <span style={{ color: cor, fontWeight: 700 }}>{quandoTxt(a.d)} · {BM.eur(a.valor)}</span>
                      </div>
                      <button className="btn btn-soft" style={{ padding: "6px 11px", fontSize: 12 }} onClick={() => resolverAlerta(prem, a)}>Pagar</button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="notif-foot">
              <button className={"notif-switch" + (cfg.ativo ? " on" : "")} onClick={() => setCfg({ ativo: !cfg.ativo })} title="Ligar/desligar avisos">
                <span className="notif-switch-dot" />
              </button>
              <span style={{ fontSize: 12.5, fontWeight: 600, flex: 1 }}>Avisos {cfg.ativo ? "ativos" : "desligados"}</span>
              <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>Avisar</span>
              <select className="select" style={{ width: "auto", padding: "5px 8px", fontSize: 12.5 }} value={cfg.aviso} onChange={(e) => setCfg({ aviso: +e.target.value })}>
                {[1, 3, 5, 7].map((n) => <option key={n} value={n}>{n} dia{n > 1 ? "s" : ""} antes</option>)}
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PremiumBadge() {
  const prem = usePremium();
  if (!prem.get().premium) return null;
  return <span className="prem-tag"><Icon name="spark" size={11} color="#fff" /> Premium</span>;
}

Object.assign(window, { PremiumStore, usePremium, Paywall, PremiumGate, Lembretes, Recorrentes, Partilha, Previsao, PremiumBadge });
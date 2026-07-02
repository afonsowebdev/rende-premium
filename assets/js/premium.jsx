/* ===== Rende+ Premium: paywall + funcionalidades (lembretes, recorrentes, partilha, previsão) ===== */
/* Segue os padrões da app: usa useFinance, Icon, Modal, Field, EmptyState, BM.* e as classes/variáveis CSS existentes.
   Persistência local (localStorage) por utilizador. Quando o backend tiver endpoints, troca-se PremiumStore.* por API.*  */

const PremiumStore = (function () {
  let email = "anon";
  let state = null;
  const subs = new Set();
  const DEF = { premium: true, plano: "month", lembretes: [], recorrentes: [], grupos: [], subscricoes: [], pagosSub: {}, pagosRec: {}, notif: { ativo: true, aviso: 3 }, notifLog: {} };
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
          <div style={{ fontWeight: 700, fontSize: 19 }}>Premium ativo</div>
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
        <h2 style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-.01em", marginTop: 4 }}>Rende+ Premium</h2>
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
  const fin = useFinance();
  const prem = usePremium();
  const mes = fin.month; // mês selecionado no topo
  const lista = [...(prem.get().recorrentes || [])].sort((a, b) => (a.dia || 0) - (b.dia || 0));
  const pagos = prem.get().pagosRec || {};
  const [modal, setModal] = React.useState(false);

  const isPago = (id) => !!(pagos[id] && pagos[id][mes]);
  const togglePago = (id) => {
    const cur = prem.get().pagosRec || {};
    const ms = { ...(cur[id] || {}) };
    if (ms[mes]) delete ms[mes]; else ms[mes] = true;
    prem.update({ pagosRec: { ...cur, [id]: ms } });
  };
  const apagar = (id) => {
    const cur = prem.get().pagosRec || {};
    if (cur[id]) { const c2 = { ...cur }; delete c2[id]; prem.update({ pagosRec: c2 }); }
    prem.remove("recorrentes", id);
  };

  const total = lista.reduce((s, x) => s + (+x.valor || 0), 0);
  const nPagas = lista.filter((r) => isPago(r.id)).length;
  const pagoTotal = lista.filter((r) => isPago(r.id)).reduce((s, x) => s + (+x.valor || 0), 0);
  const falta = total - pagoTotal;

  return (
    <div className="content">
      <PremActions label="Nova recorrente" onAdd={() => setModal(true)} />
      {lista.length === 0 ? (
        <EmptyState icon="sync" title="Sem despesas recorrentes" msg="Regista as despesas que se repetem todos os meses (renda, água, seguros…) e marca cada mês o que já pagaste."
          action={<button className="btn btn-primary" onClick={() => setModal(true)}><Icon name="plus" size={16} color="#fff" /> Adicionar</button>} />
      ) : (
        <>
          <div className="prem-stats">
            <div className="prem-stat"><span className="prem-stat-l">Total / mês</span><span className="prem-stat-v tnum valor-sensivel">{BM.eur(total)}</span><span className="prem-stat-s">{lista.length} despesa{lista.length === 1 ? "" : "s"}</span></div>
            <div className="prem-stat ok"><span className="prem-stat-l">Já pago</span><span className="prem-stat-v tnum valor-sensivel">{BM.eur(pagoTotal)}</span><span className="prem-stat-s">{nPagas} marcada{nPagas === 1 ? "" : "s"}</span></div>
            <div className={"prem-stat" + (falta > 0 ? " danger" : "")}><span className="prem-stat-l">Falta pagar</span><span className="prem-stat-v tnum valor-sensivel">{BM.eur(falta)}</span><span className="prem-stat-s">{lista.length - nPagas} por pagar</span></div>
          </div>
          <div className="card card-pad">
            {lista.map((r) => {
              const pago = isPago(r.id);
              const ic = BM.cats[r.cat] || BM.cats.outros;
              return (
                <div className={"prem-row" + (pago ? " is-paid" : "")} key={r.id}>
                  <span className="prem-rico" style={{ background: `color-mix(in srgb, ${ic.color} 14%, transparent)` }}><Icon name={ic.icon} size={19} color={ic.color} /></span>
                  <div className="prem-rtxt">
                    <b style={pago ? { opacity: .55 } : null}>{r.titulo}</b>
                    <span className="muted" style={{ fontSize: 12.5 }}>Todos os dias {r.dia}{pago ? " · pago ✓" : ""}</span>
                  </div>
                  <div className="prem-ramt valor-sensivel" style={pago ? { opacity: .55 } : null}>{BM.eur(r.valor)}</div>
                  <div className="prem-rbtns">
                    <button className={"sub-check" + (pago ? " on" : "")} title={pago ? "Marcar como por pagar" : "Marcar como pago"} onClick={() => togglePago(r.id)}>
                      <Icon name="check" size={15} color={pago ? "#fff" : "var(--ink-3)"} />
                    </button>
                    <button className="icon-btn" title="Apagar" onClick={() => apagar(r.id)}><Icon name="trash" size={16} color="var(--neg)" /></button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="tiny muted" style={{ textAlign: "center", marginTop: 14, fontWeight: 600, lineHeight: 1.5 }}>
            Muda o mês nas setas lá em cima para marcares pagamentos de outros meses. Cada mês guarda as suas próprias marcas.
          </p>
        </>
      )}
      {modal && <RecorrenteModal onClose={() => setModal(false)} onSave={(it) => { prem.add("recorrentes", it); setModal(false); }} />}
    </div>
  );
}

/* ---------------- Partilha (orçamentos partilhados) ---------------- */
const nomeDeEmail = (e) => { const p = ((e || "").split("@")[0] || "").replace(/[._-]/g, " "); return p.split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : "")).join(" ").trim() || e; };
function GrupoModal({ grupo, onClose, onSave }) {
  const editing = !!grupo;
  const [nome, setNome] = React.useState(editing ? (grupo.nome || "") : "");
  const [descricao, setDescricao] = React.useState(editing ? (grupo.descricao || "") : "");
  const [email, setEmail] = React.useState("");
  const [convidados, setConvidados] = React.useState([]); // [{ email, nome }]
  const [err, setErr] = React.useState("");
  const addConvidado = () => {
    const v = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(v)) return setErr("Escreve um email válido.");
    if (convidados.some((c) => c.email === v)) return setErr("Esse email já foi adicionado.");
    setConvidados((a) => [...a, { email: v, nome: nomeDeEmail(v) }]); setEmail(""); setErr("");
  };
  const guardar = () => {
    if (!nome.trim()) return setErr("Dá um nome ao grupo.");
    if (editing) { onSave({ nome: nome.trim(), descricao: descricao.trim() }); return; }
    const membros = convidados.map((c) => c.nome);
    const convites = convidados.map((c) => ({ email: c.email, nome: c.nome, estado: "pendente" }));
    onSave({ nome: nome.trim(), descricao: descricao.trim(), membros, convites, despesas: [] });
  };
  return (
    <Modal title={editing ? "Editar grupo" : "Novo grupo"} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={guardar}><Icon name="check" size={14} color="#fff" /> {editing ? "Guardar" : "Criar grupo"}</button></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Nome do grupo"><input className="input" autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Casa do Porto, Viagem…" /></Field>
        <Field label="Descrição" hint="opcional"><input className="input" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Renda e contas da casa" /></Field>
        {!editing && (
          <Field label="Convidar por email" hint="Adiciona um de cada vez. Tu (Eu) já estás incluído.">
            <div className="row" style={{ gap: 8 }}>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addConvidado(); } }} placeholder="email@exemplo.com" />
              <button type="button" className="btn btn-soft" style={{ flex: "none" }} onClick={addConvidado}><Icon name="plus" size={14} /> Adicionar</button>
            </div>
          </Field>
        )}
        {!editing && convidados.length > 0 && (
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {convidados.map((c) => (
              <span key={c.email} className="chip" style={{ gap: 7 }}>{c.nome}
                <button type="button" onClick={() => setConvidados((a) => a.filter((x) => x.email !== c.email))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "grid", color: "var(--ink-3)" }}><span style={{ transform: "rotate(45deg)", display: "grid" }}><Icon name="plus" size={13} color="var(--ink-3)" /></span></button>
              </span>
            ))}
          </div>
        )}
        {err && <div className="alert bad" style={{ padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
      </div>
    </Modal>
  );
}
const ESTADOS = [{ id: "pendente", label: "Pendente" }, { id: "pago", label: "Pago" }, { id: "confirmado", label: "Confirmado" }];
function estadoPill(estado) {
  const map = { pendente: ["pend", "Pendente"], pago: ["pago", "Pago"], confirmado: ["conf", "Confirmado"] };
  const [cls, lbl] = map[estado || "pendente"] || map.pendente;
  return <span className={"pg-estado " + cls}>{lbl}</span>;
}
function lerAnexo(file) {
  return new Promise((resolve, reject) => {
    if (file.type === "application/pdf") {
      if (file.size > 2.4 * 1024 * 1024) return reject("PDF demasiado grande (máx. ~2,4 MB nesta versão local).");
      const r = new FileReader();
      r.onload = () => resolve({ nome: file.name, tipo: file.type, dados: r.result });
      r.onerror = () => reject("Não consegui ler o ficheiro.");
      r.readAsDataURL(file);
    } else if (/^image\//.test(file.type)) {
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 1280; let w = img.width, h = img.height;
          if (w > max || h > max) { const s = max / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
          const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
          cv.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve({ nome: file.name, tipo: "image/jpeg", dados: cv.toDataURL("image/jpeg", 0.82) });
        };
        img.onerror = () => reject("Imagem inválida.");
        img.src = r.result;
      };
      r.onerror = () => reject("Não consegui ler a imagem.");
      r.readAsDataURL(file);
    } else { reject("Só imagens ou PDF."); }
  });
}
function AnexoViewer({ anexo, onClose }) {
  return (
    <Modal title={anexo.nome || "Anexo"} onClose={onClose}
      footer={<><a className="btn btn-soft" href={anexo.dados} download={anexo.nome || "anexo"}>Transferir</a><button className="btn btn-primary" onClick={onClose}>Fechar</button></>}>
      {/^image\//.test(anexo.tipo)
        ? <img src={anexo.dados} alt={anexo.nome} style={{ width: "100%", borderRadius: 10, display: "block" }} />
        : <iframe title={anexo.nome} src={anexo.dados} style={{ width: "100%", height: "60vh", border: "1px solid var(--border)", borderRadius: 10 }} />}
    </Modal>
  );
}
function DespesaPartilhadaModal({ grupo, onClose, onSave }) {
  const pessoas = ["Eu", ...(grupo.membros || [])];
  const [f, setF] = React.useState({ titulo: "", categoria: "outros", valor: "", data: BM.todayISO(), vencimento: "", pagador: "Eu", estado: "pendente", obs: "" });
  const [parts, setParts] = React.useState(() => pessoas.slice());
  const [metodo, setMetodo] = React.useState("igual");
  const [pcts, setPcts] = React.useState({});
  const [vals, setVals] = React.useState({});
  const [anexos, setAnexos] = React.useState([]);
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const toggle = (p) => setParts((arr) => arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]);
  const valor = numOf(f.valor);
  const quotas = {};
  if (metodo === "igual") { const each = parts.length ? valor / parts.length : 0; parts.forEach((p) => (quotas[p] = each)); }
  else if (metodo === "percentagem") { parts.forEach((p) => (quotas[p] = valor * (numOf(pcts[p]) / 100))); }
  else { parts.forEach((p) => (quotas[p] = numOf(vals[p]))); }
  const somaQuotas = parts.reduce((s, p) => s + (quotas[p] || 0), 0);
  const somaPct = parts.reduce((s, p) => s + numOf(pcts[p]), 0);
  const diff = Math.round((somaQuotas - valor) * 100) / 100;
  const addFiles = async (fileList) => {
    setErr(""); setBusy(true);
    try { const novos = []; for (const file of Array.from(fileList)) novos.push(await lerAnexo(file)); setAnexos((a) => [...a, ...novos]); }
    catch (msg) { setErr(typeof msg === "string" ? msg : "Falha ao anexar."); }
    setBusy(false);
  };
  const guardar = () => {
    if (!f.titulo.trim()) return setErr("Dá um nome à despesa.");
    if (valor <= 0) return setErr("Indica um valor válido.");
    if (parts.length === 0) return setErr("Escolhe com quem partilhar.");
    if (metodo === "percentagem" && Math.abs(somaPct - 100) > 0.5) return setErr("As percentagens têm de somar 100% (agora " + Math.round(somaPct) + "%).");
    if (metodo === "personalizado" && Math.abs(diff) > 0.02) return setErr("Os valores têm de somar " + BM.eur(valor) + " (diferença de " + BM.eur(Math.abs(diff)) + ").");
    const qz = {}; parts.forEach((p) => (qz[p] = Math.round((quotas[p] || 0) * 100) / 100));
    onSave({ id: BM.uid(), titulo: f.titulo.trim(), categoria: f.categoria, valor, data: f.data, vencimento: f.vencimento || "", pagador: f.pagador, participantes: parts, metodo, quotas: qz, estado: f.estado, obs: f.obs.trim(), anexos, pagamentos: {} });
  };
  return (
    <Modal title="Nova despesa" sub={grupo.nome} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={guardar}><Icon name="check" size={14} color="#fff" /> Adicionar</button></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Descrição"><input className="input" autoFocus value={f.titulo} onChange={set("titulo")} placeholder="Ex: Renda, Compras, Internet…" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Categoria"><select className="select" value={f.categoria} onChange={set("categoria")}>{Object.keys(BM.cats).map((k) => <option key={k} value={k}>{BM.cats[k].nome}</option>)}</select></Field>
          <Field label="Valor"><input className="input" inputMode="decimal" value={f.valor} onChange={set("valor")} placeholder="0,00" /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Data"><input className="input" type="date" value={f.data} onChange={set("data")} /></Field>
          <Field label="Vencimento" hint="opcional"><input className="input" type="date" value={f.vencimento} onChange={set("vencimento")} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Quem pagou"><select className="select" value={f.pagador} onChange={set("pagador")}>{pessoas.map((p) => <option key={p}>{p}</option>)}</select></Field>
          <Field label="Estado"><select className="select" value={f.estado} onChange={set("estado")}>{ESTADOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></Field>
        </div>
        <Field label="Partilhar com">
          <div className="prem-parts">
            {pessoas.map((p) => <button type="button" key={p} className={"chip" + (parts.includes(p) ? " sel" : "")} style={{ cursor: "pointer" }} onClick={() => toggle(p)}>{p}</button>)}
          </div>
        </Field>
        <Field label="Método de divisão">
          <div className="pg-seg">
            {[["igual", "Igual"], ["percentagem", "Percentagem"], ["personalizado", "Valor exato"]].map(([id, lbl]) => (
              <button type="button" key={id} className={"pg-seg-b" + (metodo === id ? " on" : "")} onClick={() => setMetodo(id)}>{lbl}</button>
            ))}
          </div>
        </Field>
        {parts.length > 0 && metodo === "igual" && valor > 0 && (
          <div className="muted tiny" style={{ fontWeight: 600 }}>Cada pessoa fica com {BM.eur(valor / parts.length)}.</div>
        )}
        {parts.length > 0 && metodo !== "igual" && (
          <div className="pg-split">
            {parts.map((p) => (
              <div className="pg-split-row" key={p}>
                <span className="prem-avatar sm">{inicial(p)}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{p}</span>
                {metodo === "percentagem"
                  ? <span className="pg-split-in"><input className="input" inputMode="decimal" value={pcts[p] || ""} onChange={(e) => setPcts((s) => ({ ...s, [p]: e.target.value }))} placeholder="0" /><i>%</i></span>
                  : <span className="pg-split-in"><input className="input" inputMode="decimal" value={vals[p] || ""} onChange={(e) => setVals((s) => ({ ...s, [p]: e.target.value }))} placeholder="0,00" /><i>€</i></span>}
                <span className="pg-split-q">{BM.eur(quotas[p] || 0)}</span>
              </div>
            ))}
            <div className={"pg-split-sum" + ((metodo === "percentagem" ? Math.abs(somaPct - 100) < 0.5 : Math.abs(diff) < 0.02) ? " ok" : " bad")}>
              {metodo === "percentagem"
                ? "Soma: " + Math.round(somaPct) + "%" + (Math.abs(somaPct - 100) < 0.5 ? " ✓" : " · tem de dar 100%")
                : "Soma: " + BM.eur(somaQuotas) + " / " + BM.eur(valor) + (Math.abs(diff) < 0.02 ? " ✓" : "")}
            </div>
          </div>
        )}
        <Field label="Observações" hint="opcional"><textarea className="input" rows={2} value={f.obs} onChange={set("obs")} placeholder="Notas sobre a despesa…" style={{ resize: "vertical", fontFamily: "inherit" }} /></Field>
        <Field label="Anexar fatura" hint="imagem ou PDF">
          <label className="pg-upload">
            <input type="file" accept="image/*,application/pdf" multiple style={{ display: "none" }} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            <Icon name="plus" size={16} color="var(--accent)" /> {busy ? "A processar…" : "Escolher ficheiro(s)"}
          </label>
          {anexos.length > 0 && (
            <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {anexos.map((a, i) => (
                <span key={i} className="chip" style={{ gap: 7 }}><Icon name="receipt" size={12} /> {a.nome.length > 18 ? a.nome.slice(0, 16) + "…" : a.nome}
                  <button type="button" onClick={() => setAnexos((arr) => arr.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "grid", color: "var(--ink-3)" }}><span style={{ transform: "rotate(45deg)", display: "grid" }}><Icon name="plus" size={12} color="var(--ink-3)" /></span></button>
                </span>
              ))}
            </div>
          )}
          <div className="muted tiny" style={{ fontWeight: 600, marginTop: 6, lineHeight: 1.5 }}>As imagens são reduzidas automaticamente e guardadas localmente. A leitura automática (OCR) chega numa fase futura.</div>
        </Field>
        {err && <div className="alert bad" style={{ padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
      </div>
    </Modal>
  );
}
function quotaDe(e, p, parts) {
  if (e && e.quotas && e.quotas[p] != null) return +e.quotas[p] || 0;
  const n = (parts && parts.length) ? parts.length : 1;
  return (+((e && e.valor)) || 0) / n;
}
function balancos(g) {
  const pessoas = ["Eu", ...(g.membros || [])];
  const net = {}; pessoas.forEach((p) => (net[p] = 0));
  (g.despesas || []).forEach((e) => {
    const parts = (e.participantes && e.participantes.length) ? e.participantes : pessoas;
    const pagos = e.pagamentos || {};
    if (net[e.pagador] == null) net[e.pagador] = 0;
    parts.forEach((p) => {
      if (net[p] == null) net[p] = 0;
      if (p === e.pagador) return;   // o pagador não deve a si próprio
      if (pagos[p]) return;          // já acertou esta despesa — sai do saldo
      const share = quotaDe(e, p, parts);
      net[p] -= share;               // deve a sua parte
      net[e.pagador] += share;       // o pagador tem essa parte a receber
    });
  });
  Object.keys(net).forEach((p) => (net[p] = Math.round(net[p] * 100) / 100));
  return net;
}
const inicial = (p) => (p === "Eu" ? "Eu" : (p.trim()[0] || "?").toUpperCase());
function balTag(v) {
  if (Math.abs(v) < 0.01) return <span className="prem-bal-tag zero">saldado</span>;
  return <span className={"prem-bal-tag " + (v > 0 ? "pos" : "neg")}>{(v > 0 ? "recebe " : "deve ") + BM.eur(Math.abs(v))}</span>;
}

function grupoStats(g) {
  const pessoas = ["Eu", ...(g.membros || [])];
  const desp = g.despesas || [];
  const total = desp.reduce((s, e) => s + (+e.valor || 0), 0);
  let aReceber = 0, emDivida = 0, emAberto = 0, porLiquidar = 0;
  desp.forEach((e) => {
    const parts = (e.participantes && e.participantes.length) ? e.participantes : pessoas;
    const pagos = e.pagamentos || {};
    let aberta = false;
    parts.forEach((p) => {
      if (p === e.pagador) return;
      if (pagos[p]) return;
      aberta = true;
      const share = quotaDe(e, p, parts);
      emAberto += share;
      if (e.pagador === "Eu") aReceber += share;
      if (p === "Eu") emDivida += share;
    });
    if (aberta) porLiquidar++;
  });
  const r2 = (n) => Math.round(n * 100) / 100;
  return { pessoas, total, aReceber: r2(aReceber), emDivida: r2(emDivida), emAberto: r2(emAberto), totalPago: r2(total - emAberto), saldo: r2(aReceber - emDivida), porLiquidar };
}

function dividas(g) {
  const pessoas = ["Eu", ...(g.membros || [])];
  const pares = {};
  (g.despesas || []).forEach((e) => {
    const parts = (e.participantes && e.participantes.length) ? e.participantes : pessoas;
    const pagos = e.pagamentos || {};
    parts.forEach((p) => {
      if (p === e.pagador) return;
      if (pagos[p]) return;
      const key = p + "|" + e.pagador;
      pares[key] = (pares[key] || 0) + quotaDe(e, p, parts);
    });
  });
  return Object.keys(pares).map((k) => { const [de, para] = k.split("|"); return { de, para, valor: Math.round(pares[k] * 100) / 100 }; }).filter((x) => x.valor > 0.005);
}
function sysMsg(texto) { return { id: BM.uid(), tipo: "sistema", texto, ts: Date.now() }; }

function ChatGrupo({ grupo, onSend }) {
  const [txt, setTxt] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const endRef = React.useRef(null);
  const msgs = grupo.mensagens || [];
  React.useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ block: "end" }); }, [msgs.length]);
  const enviar = () => { const t = txt.trim(); if (!t) return; onSend({ id: BM.uid(), autor: "Eu", tipo: "texto", texto: t, ts: Date.now() }); setTxt(""); };
  const anexar = async (fl) => { setErr(""); setBusy(true); try { for (const file of Array.from(fl)) { const a = await lerAnexo(file); onSend({ id: BM.uid(), autor: "Eu", tipo: /^image\//.test(a.tipo) ? "imagem" : "pdf", anexo: a, ts: Date.now() }); } } catch (m) { setErr(typeof m === "string" ? m : "Falha ao anexar."); } setBusy(false); };
  return (
    <div className="card pg-chat">
      <div className="pg-chat-scroll">
        {msgs.length === 0 && <div className="muted tiny" style={{ fontWeight: 600, textAlign: "center", padding: 24 }}>Ainda sem mensagens. Diz olá ao grupo 👋</div>}
        {msgs.map((m) => {
          if (m.tipo === "sistema") return <div className="pg-msg-sys" key={m.id}>{m.texto}</div>;
          const mine = m.autor === "Eu";
          return (
            <div className={"pg-msg" + (mine ? " mine" : "")} key={m.id}>
              {!mine && <span className="prem-avatar sm">{inicial(m.autor)}</span>}
              <div className="pg-bubble">
                {!mine && <div className="pg-msg-a">{m.autor}</div>}
                {m.tipo === "texto" && <div className="pg-msg-t">{m.texto}</div>}
                {m.tipo === "imagem" && <img src={m.anexo.dados} alt={m.anexo.nome} className="pg-msg-img" />}
                {m.tipo === "pdf" && <a href={m.anexo.dados} download={m.anexo.nome} className="pg-msg-pdf"><Icon name="receipt" size={15} /> {m.anexo.nome}</a>}
                <div className="pg-msg-time">{new Date(m.ts).toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {err && <div className="muted tiny" style={{ color: "var(--neg)", fontWeight: 700, padding: "4px 12px" }}>{err}</div>}
      <div className="pg-chat-bar">
        <label className="pg-chat-attach" title="Anexar imagem ou PDF">
          <input type="file" accept="image/*,application/pdf" multiple style={{ display: "none" }} onChange={(e) => { anexar(e.target.files); e.target.value = ""; }} />
          <Icon name={busy ? "history" : "plus"} size={18} color="var(--ink-2)" />
        </label>
        <input className="input" value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); enviar(); } }} placeholder="Escreve uma mensagem…" />
        <button className="btn btn-primary" style={{ flex: "none", padding: "9px 13px" }} onClick={enviar} title="Enviar"><Icon name="chevR" size={16} color="#fff" /></button>
      </div>
    </div>
  );
}

function GrupoCalendario({ despesas }) {
  const hoje = new Date();
  const [ref, setRef] = React.useState({ y: hoje.getFullYear(), m: hoje.getMonth() });
  const comVenc = (despesas || []).filter((e) => e.vencimento);
  const first = new Date(ref.y, ref.m, 1);
  const startDow = (first.getDay() + 6) % 7;
  const dias = new Date(ref.y, ref.m + 1, 0).getDate();
  const byDay = {};
  const doMes = [];
  comVenc.forEach((e) => { const p = e.vencimento.split("-").map(Number); if (p[0] === ref.y && p[1] - 1 === ref.m) { (byDay[p[2]] = byDay[p[2]] || []).push(e); doMes.push(e); } });
  doMes.sort((x, y) => x.vencimento.localeCompare(y.vencimento));
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= dias; d++) cells.push(d);
  const shift = (delta) => setRef((r) => { let m = r.m + delta, y = r.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } return { y, m }; });
  const isHoje = (d) => hoje.getFullYear() === ref.y && hoje.getMonth() === ref.m && hoje.getDate() === d;
  return (
    <div className="pg-col">
      <div className="card card-pad">
        <div className="pg-cal-head">
          <button className="pg-back" onClick={() => shift(-1)} title="Mês anterior"><span style={{ display: "grid", transform: "rotate(180deg)" }}><Icon name="chevR" size={15} /></span></button>
          <b style={{ fontSize: 15 }}>{BM.MESES[ref.m]} {ref.y}</b>
          <button className="pg-back" onClick={() => shift(1)} title="Mês seguinte"><Icon name="chevR" size={15} /></button>
        </div>
        <div className="pg-cal-grid pg-cal-dow">{["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => <span key={d}>{d}</span>)}</div>
        <div className="pg-cal-grid">
          {cells.map((d, i) => (
            <div key={i} className={"pg-cal-cell" + (d ? "" : " empty") + (d && isHoje(d) ? " hoje" : "") + (d && byDay[d] ? " tem" : "")}>
              {d && <span className="pg-cal-d">{d}</span>}
              {d && byDay[d] && <span className="pg-cal-dot">{byDay[d].length}</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="card card-pad">
        <div className="prem-sec-t">Vencimentos em {BM.MESES[ref.m]}</div>
        {doMes.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 4 }}>Sem vencimentos neste mês.</div> :
          doMes.map((e) => (
            <div className="pg-up" key={e.id}>
              <div className="pg-up-d"><div className="dd">{e.vencimento.split("-")[2]}</div><div className="mm">{BM.MESES[ref.m]}</div></div>
              <div className="pg-up-main"><div className="pg-up-t">{e.titulo} {estadoPill(e.estado)}</div><div className="pg-up-m">{(BM.cats[e.categoria] || BM.cats.outros).nome} · pago por {e.pagador}</div></div>
              <div className="pg-up-v">{BM.eur(e.valor)}</div>
            </div>
          ))}
      </div>
    </div>
  );
}

function Partilha() { return <PremiumGate><PartilhaInner /></PremiumGate>; }
function PartilhaInner() {
  const prem = usePremium();
  const grupos = prem.get().grupos || [];
  const [modal, setModal] = React.useState(false);
  const [despModal, setDespModal] = React.useState(null);
  const [openId, setOpenId] = React.useState(null);
  const [tab, setTab] = React.useState("dashboard");
  const [anexoView, setAnexoView] = React.useState(null);
  const [remMembro, setRemMembro] = React.useState(null);
  const [delId, setDelId] = React.useState(null);
  const [convEmail, setConvEmail] = React.useState("");
  const [q, setQ] = React.useState("");
  const [filtro, setFiltro] = React.useState("ativos");
  const [ordem, setOrdem] = React.useState("recentes");
  const [editId, setEditId] = React.useState(null);
  const [menuId, setMenuId] = React.useState(null);
  React.useEffect(() => {
    if (!menuId) return;
    const h = (e) => { if (!e.target.closest || !e.target.closest(".ph-menu-wrap")) setMenuId(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuId]);
  const aberto = grupos.find((g) => g.id === openId);

  if (aberto) {
    const stats = grupoStats(aberto);
    const net = balancos(aberto);
    const pessoas = stats.pessoas;
    const desp = [...(aberto.despesas || [])].sort((a, b) => (b.data || "").localeCompare(a.data || ""));
    const pend = (aberto.convites || []).filter((c) => c.estado === "pendente").length;
    const pctPago = stats.total > 0 ? Math.round((stats.totalPago / stats.total) * 100) : 0;
    const catBreak = (() => {
      const by = {};
      (aberto.despesas || []).forEach((e) => { const k = e.categoria || "outros"; by[k] = (by[k] || 0) + (+e.valor || 0); });
      return Object.keys(by).map((k) => ({ key: k, nome: (BM.cats[k] || BM.cats.outros).nome, color: (BM.cats[k] || BM.cats.outros).color, valor: by[k] })).sort((a, b) => b.valor - a.valor);
    })();
    const proximas = (aberto.despesas || []).filter((e) => e.vencimento).sort((a, b) => (a.vencimento || "").localeCompare(b.vencimento || "")).slice(0, 5);
    const convidar = () => { const v = convEmail.trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(v)) return; const nm = nomeDeEmail(v); if (!(aberto.membros || []).includes(nm)) prem.edit("grupos", aberto.id, { membros: [...(aberto.membros || []), nm], convites: [...(aberto.convites || []), { email: v, nome: nm, estado: "pendente" }] }); setConvEmail(""); };
    const setPapel = (nome, papel) => prem.edit("grupos", aberto.id, { papeis: { ...(aberto.papeis || {}), [nome]: papel } });
    const removerMembro = (nome) => { const p = { ...(aberto.papeis || {}) }; delete p[nome]; prem.edit("grupos", aberto.id, { membros: (aberto.membros || []).filter((m) => m !== nome), convites: (aberto.convites || []).filter((c) => c.nome !== nome), papeis: p }); };
    const kpis = [
      { lbl: "Total de despesas", val: BM.eur(stats.total), sub: "total do grupo", ic: "wallet", c: "#14a06b" },
      { lbl: "Total pago", val: BM.eur(stats.totalPago), sub: pctPago + "% liquidado", ic: "check", c: "#3b82f6" },
      { lbl: "Em dívida", val: BM.eur(stats.emDivida), sub: "o que deves", ic: "arrowDown", c: "#e5484d", tone: "neg" },
      { lbl: "A receber", val: BM.eur(stats.aReceber), sub: "o que te devem", ic: "arrowUp", c: "#14a06b", tone: "pos" },
      { lbl: "Saldo pessoal", val: (stats.saldo >= 0 ? "+ " : "− ") + BM.eur(Math.abs(stats.saldo)), sub: stats.saldo >= 0 ? "estás a receber" : "tens a pagar", ic: "trend", c: "#0e8659", tone: stats.saldo >= 0 ? "pos" : "neg" },
      { lbl: "Membros", val: String(pessoas.length), sub: pend ? pend + " convite(s) pendente(s)" : "todos ativos", ic: "users", c: "#a855f7" },
      { lbl: "Por liquidar", val: String(stats.porLiquidar), sub: "despesas em aberto", ic: "receipt", c: "#d9840a" },
    ];
    const TABS = [
      { id: "dashboard", label: "Dashboard", ic: "grid" },
      { id: "despesas", label: "Despesas", ic: "receipt" },
      { id: "saldos", label: "Saldos", ic: "trend" },
      { id: "membros", label: "Membros", ic: "users" },
      { id: "conversas", label: "Conversas", ic: "bell", soon: "Fase 5" },
      { id: "calendario", label: "Calendário", ic: "history", soon: "Fase 6" },
    ];
    return (
      <div className="content">
        <div className="card pg-head">
          <button className="pg-back" onClick={() => setOpenId(null)} title="Voltar aos grupos"><span style={{ display: "grid", transform: "rotate(180deg)" }}><Icon name="chevR" size={16} /></span></button>
          <span className="pg-head-ic"><Icon name="users" size={20} color="#fff" /></span>
          <div className="pg-head-txt"><b className="pg-head-name">{aberto.nome}</b><div className="tiny muted">{pessoas.length} membros{pend ? " · " + pend + " pendente(s)" : ""}</div></div>
          <div className="pg-avatars">
            {pessoas.slice(0, 4).map((p) => <span className="prem-avatar sm" key={p} title={p}>{inicial(p)}</span>)}
            {pessoas.length > 4 && <span className="prem-avatar more sm">+{pessoas.length - 4}</span>}
          </div>
          <button className="btn btn-primary pg-add" onClick={() => setDespModal(aberto)}><Icon name="plus" size={15} color="#fff" /> Nova despesa</button>
        </div>

        <div className="pg-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={"pg-tab" + (tab === t.id ? " on" : "")} onClick={() => setTab(t.id)}>
              <Icon name={t.ic} size={16} /> {t.label}{t.soon && <span className="pg-soon-tag">{t.soon}</span>}
            </button>
          ))}
        </div>

        {tab === "dashboard" && (<>
          <div className="pg-kpis">
            {kpis.map((k, i) => (
              <div className="card pg-kpi" key={i}>
                <div className="pg-kpi-top"><span className="pg-kpi-lbl">{k.lbl}</span><span className="pg-kpi-ic" style={{ background: k.c }}><Icon name={k.ic} size={15} color="#fff" /></span></div>
                <div className={"pg-kpi-val" + (k.tone ? " " + k.tone : "")}>{k.val}</div>
                <div className="pg-kpi-sub">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="pg-grid">
            <div className="pg-col">
              <div className="card card-pad">
                <div className="pg-sec-h"><div className="prem-sec-t">Despesas recentes</div>{desp.length > 5 && <button className="pg-link" onClick={() => setTab("despesas")}>Ver todas</button>}</div>
                {desp.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600 }}>Ainda sem despesas. Adiciona a primeira.</div> :
                  desp.slice(0, 5).map((e) => {
                    const parts = (e.participantes && e.participantes.length) ? e.participantes : pessoas;
                    return (
                      <div className="pg-exp" key={e.id}>
                        <span className="pg-exp-ic"><Icon name="receipt" size={17} color="var(--accent)" /></span>
                        <div className="pg-exp-main"><div className="pg-exp-t">{e.titulo}</div><div className="pg-exp-m">{e.data ? BM.fmtData(e.data) + " · " : ""}Pagou {e.pagador} · ÷{parts.length}</div></div>
                        <div className="pg-exp-v">{BM.eur(e.valor)}</div>
                      </div>
                    );
                  })}
              </div>
              <div className="card card-pad">
                <div className="pg-sec-h"><div className="prem-sec-t">Próximas despesas</div>{proximas.length > 0 && <button className="pg-link" onClick={() => setTab("calendario")}>Calendário</button>}</div>
                {proximas.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600 }}>Sem vencimentos marcados. Ao criar uma despesa, define uma data de vencimento.</div> :
                  proximas.map((e) => {
                    const mm = (e.vencimento || "").split("-"); const du = daysUntil(e.vencimento);
                    return (
                      <div className="pg-up" key={e.id}>
                        <div className="pg-up-d"><div className="dd">{mm[2]}</div><div className="mm">{BM.MESES[+mm[1] - 1]}</div></div>
                        <div className="pg-up-main"><div className="pg-up-t">{e.titulo}</div><div className="pg-up-m">{du < 0 ? "vencida" : du === 0 ? "vence hoje" : "em " + du + (du === 1 ? " dia" : " dias")}</div></div>
                        <div className="pg-up-v">{BM.eur(e.valor)}</div>
                      </div>
                    );
                  })}
              </div>
              <div className="card card-pad">
                <div className="prem-sec-t">Atividade do grupo</div>
                {desp.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600 }}>Ainda sem atividade.</div> :
                  <div className="pg-tl">
                    {desp.slice(0, 6).map((e) => (
                      <div className="pg-tli" key={e.id}>
                        <span className="pg-tli-ic"><Icon name="plus" size={13} color="var(--accent)" /></span>
                        <div><div className="pg-tli-txt"><b>{e.pagador}</b> adicionou <b>{e.titulo}</b> ({BM.eur(e.valor)})</div><div className="pg-tli-time">{e.data ? BM.fmtData(e.data) : ""}</div></div>
                      </div>
                    ))}
                  </div>}
              </div>
            </div>
            <div className="pg-col">
              <div className="card card-pad">
                <div className="pg-sec-h"><div className="prem-sec-t">Saldos entre membros</div><button className="pg-link" onClick={() => setTab("saldos")}>Detalhe</button></div>
                {pessoas.map((p) => (
                  <div className="prem-balrow" key={p}><span className="prem-avatar">{inicial(p)}</span><span style={{ flex: 1, fontWeight: 700 }}>{p}</span>{balTag(net[p] || 0)}</div>
                ))}
              </div>
              <div className="card card-pad">
                <div className="prem-sec-t">Despesas por categoria</div>
                {catBreak.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 4 }}>Sem despesas ainda.</div> :
                  <div className="row" style={{ gap: 16, alignItems: "center", marginTop: 6 }}>
                    <DonutChart data={catBreak} size={140} thickness={22} center={<div><div className="tnum" style={{ fontWeight: 800, fontSize: 14 }}>{BM.eur0(stats.total)}</div><div className="tiny muted" style={{ fontWeight: 600 }}>Total</div></div>} />
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                      {catBreak.slice(0, 5).map((c) => (
                        <div className="row" key={c.key} style={{ gap: 9, fontSize: 12.5 }}>
                          <span className="dot" style={{ background: c.color }} />
                          <span style={{ fontWeight: 600, color: "var(--ink-2)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nome}</span>
                          <span style={{ fontWeight: 700 }}>{BM.eur(c.valor)}</span>
                        </div>
                      ))}
                    </div>
                  </div>}
              </div>
            </div>
          </div>
        </>)}

        {tab === "despesas" && (
          <div className="card card-pad">
            <div className="pg-sec-h"><div className="prem-sec-t">Despesas</div><button className="btn btn-soft" style={{ padding: "6px 12px" }} onClick={() => setDespModal(aberto)}><Icon name="plus" size={14} /> Nova</button></div>
            {desp.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600 }}>Ainda sem despesas. Adiciona a primeira.</div> :
              desp.map((e) => {
                const parts = (e.participantes && e.participantes.length) ? e.participantes : pessoas;
                const pagos = e.pagamentos || {};
                const devedores = parts.filter((p) => p !== e.pagador);
                const ci = BM.cats[e.categoria] || BM.cats.outros;
                return (
                  <div key={e.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="prem-row" style={{ borderBottom: "none" }}>
                      <span className="prem-rico sm" style={{ background: "color-mix(in srgb, " + ci.color + " 15%, transparent)" }}><Icon name={ci.icon || "receipt"} size={16} color={ci.color} /></span>
                      <div className="prem-rtxt">
                        <b>{e.titulo} {estadoPill(e.estado)}</b>
                        <span className="muted" style={{ fontSize: 12 }}>{ci.nome}{e.data ? " · " + BM.fmtData(e.data) : ""} · Pagou {e.pagador}{e.vencimento ? " · vence " + BM.fmtData(e.vencimento) : ""}</span>
                      </div>
                      <div className="prem-ramt">{BM.eur(e.valor)}</div>
                      <div className="prem-rbtns">
                        {(e.anexos && e.anexos.length > 0) && <button className="icon-btn" title="Ver anexo" onClick={() => setAnexoView(e.anexos[0])}><Icon name="receipt" size={15} color="var(--ink-2)" /></button>}
                        <button className="icon-btn" title="Apagar despesa" onClick={() => prem.edit("grupos", aberto.id, { despesas: (aberto.despesas || []).filter((x) => x.id !== e.id) })}><Icon name="trash" size={15} color="var(--neg)" /></button>
                      </div>
                    </div>
                    {e.obs && <div className="muted" style={{ fontSize: 12, padding: "0 14px 6px 52px", lineHeight: 1.5 }}>{e.obs}</div>}
                    {devedores.length > 0 && (
                      <div className="row" style={{ gap: 6, flexWrap: "wrap", padding: "0 14px 12px 52px" }}>
                        {devedores.map((p) => {
                          const pago = !!pagos[p];
                          return <button type="button" key={p} className={"chip" + (pago ? " sel" : "")} style={{ cursor: "pointer" }} title={pago ? "Marcar como em dívida" : "Marcar como pago"}
                            onClick={() => { const desps = (aberto.despesas || []).map((x) => (x.id === e.id ? { ...x, pagamentos: { ...(x.pagamentos || {}), [p]: !pago } } : x)); const patch = { despesas: desps }; if (!pago) patch.mensagens = [...(aberto.mensagens || []), sysMsg(p + " confirmou o pagamento de " + e.titulo)]; prem.edit("grupos", aberto.id, patch); }}>{p}: {pago ? "pagou ✓" : BM.eur(quotaDe(e, p, parts)) + " deve"}</button>;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {tab === "saldos" && (() => {
          const ds = dividas(aberto);
          const devemTe = ds.filter((d) => d.para === "Eu");
          const deves = ds.filter((d) => d.de === "Eu");
          const outros = ds.filter((d) => d.de !== "Eu" && d.para !== "Eu");
          const acertar = (de, para) => prem.edit("grupos", aberto.id, {
            despesas: (aberto.despesas || []).map((e) => { if (e.pagador !== para) return e; const parts = (e.participantes && e.participantes.length) ? e.participantes : pessoas; if (!parts.includes(de)) return e; return { ...e, pagamentos: { ...(e.pagamentos || {}), [de]: true } }; }),
            mensagens: [...(aberto.mensagens || []), sysMsg((de === "Eu" ? "Eu" : de) + " acertou contas com " + (para === "Eu" ? "Eu" : para))],
          });
          return (
            <div className="pg-col">
              <div className="card card-pad">
                <div className="prem-sec-t">O teu saldo</div>
                <div className="pg-bal-hero">
                  <div><div className="pg-bal-l">A receber</div><div className="pg-bal-v pos">{BM.eur(stats.aReceber)}</div></div>
                  <div><div className="pg-bal-l">A pagar</div><div className="pg-bal-v neg">{BM.eur(stats.emDivida)}</div></div>
                  <div><div className="pg-bal-l">Saldo</div><div className={"pg-bal-v " + (stats.saldo >= 0 ? "pos" : "neg")}>{(stats.saldo >= 0 ? "+ " : "− ") + BM.eur(Math.abs(stats.saldo))}</div></div>
                </div>
              </div>
              <div className="card card-pad">
                <div className="prem-sec-t">Devem-te</div>
                {devemTe.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 4 }}>Ninguém te deve nada. 🎉</div> :
                  devemTe.map((d, i) => (
                    <div className="pg-set" key={i}>
                      <span className="prem-avatar sm">{inicial(d.de)}</span>
                      <div className="pg-set-txt"><b>{d.de}</b> <span>deve-te</span></div>
                      <span className="pg-set-amt pos">{BM.eur(d.valor)}</span>
                      <button className="btn btn-soft" style={{ padding: "5px 11px" }} onClick={() => acertar(d.de, "Eu")}>Marcar recebido</button>
                    </div>
                  ))}
              </div>
              <div className="card card-pad">
                <div className="prem-sec-t">Deves</div>
                {deves.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 4 }}>Não deves nada. 🎉</div> :
                  deves.map((d, i) => (
                    <div className="pg-set" key={i}>
                      <span className="prem-avatar sm">{inicial(d.para)}</span>
                      <div className="pg-set-txt"><span>deves a</span> <b>{d.para}</b></div>
                      <span className="pg-set-amt neg">{BM.eur(d.valor)}</span>
                      <button className="btn btn-primary" style={{ padding: "5px 11px" }} onClick={() => acertar("Eu", d.para)}>Pagar</button>
                    </div>
                  ))}
              </div>
              {outros.length > 0 && (
                <div className="card card-pad">
                  <div className="prem-sec-t">Entre outros membros</div>
                  {outros.map((d, i) => (
                    <div className="pg-set" key={i}>
                      <span className="prem-avatar sm">{inicial(d.de)}</span>
                      <div className="pg-set-txt"><b>{d.de}</b> <span>deve a</span> <b>{d.para}</b></div>
                      <span className="pg-set-amt">{BM.eur(d.valor)}</span>
                      <button className="btn btn-soft" style={{ padding: "5px 11px" }} onClick={() => acertar(d.de, d.para)}>Acertar</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="muted tiny" style={{ fontWeight: 600, lineHeight: 1.6 }}>"Acertar" marca as despesas correspondentes como pagas e atualiza os saldos automaticamente.</div>
            </div>
          );
        })()}

        {tab === "membros" && (
          <div className="pg-col">
            <div className="card card-pad">
              <div className="pg-sec-h"><div className="prem-sec-t">Membros ({pessoas.length})</div></div>
              <div className="pg-mrow">
                <span className="prem-avatar">Eu</span>
                <div className="pg-mrow-txt"><b>Eu <span className="muted tiny" style={{ fontWeight: 600 }}>(tu)</span></b><span className="pg-mrow-sub">criador do grupo</span></div>
                <span className="pg-role owner">Owner</span>
              </div>
              {(aberto.membros || []).map((m) => {
                const conv = (aberto.convites || []).find((c) => c.nome === m);
                const pendm = conv && conv.estado === "pendente";
                const papel = (aberto.papeis && aberto.papeis[m]) || "membro";
                return (
                  <div className="pg-mrow" key={m}>
                    <span className="prem-avatar">{inicial(m)}</span>
                    <div className="pg-mrow-txt"><b>{m}</b><span className="pg-mrow-sub">{conv ? conv.email : ""}{pendm ? " · convite pendente" : ""}</span></div>
                    {pendm
                      ? <button className="btn btn-soft" style={{ padding: "5px 11px" }} onClick={() => prem.edit("grupos", aberto.id, { convites: (aberto.convites || []).map((c) => (c.nome === m ? { ...c, estado: "ativo" } : c)), mensagens: [...(aberto.mensagens || []), sysMsg(m + " entrou no grupo")] })}>Aceitar</button>
                      : <select className="select pg-role-sel" value={papel} onChange={(e) => setPapel(m, e.target.value)}><option value="admin">Admin</option><option value="membro">Membro</option></select>}
                    <button className="icon-btn" title="Remover membro" onClick={() => setRemMembro(m)}><Icon name="trash" size={15} color="var(--neg)" /></button>
                  </div>
                );
              })}
              <div className="row" style={{ gap: 8, marginTop: 12 }}>
                <input className="input" type="email" value={convEmail} onChange={(e) => setConvEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); convidar(); } }}
                  placeholder="convidar por email…" />
                <button className="btn btn-primary" style={{ flex: "none" }} onClick={convidar}><Icon name="plus" size={14} color="#fff" /> Convidar</button>
              </div>
            </div>
            <div className="card card-pad">
              <div className="prem-sec-t">Como funcionam as permissões</div>
              <div className="pg-perm"><span className="pg-role owner">Owner</span><span>Controlo total: gere membros, permissões e o grupo.</span></div>
              <div className="pg-perm"><span className="pg-role admin">Admin</span><span>Pode adicionar despesas e convidar membros.</span></div>
              <div className="pg-perm"><span className="pg-role membro">Membro</span><span>Participa nas despesas e vê os saldos.</span></div>
              <div className="muted tiny" style={{ fontWeight: 600, marginTop: 10, lineHeight: 1.6 }}>És o Owner deste grupo. As permissões aplicam-se de verdade entre vários utilizadores quando o backend estiver ligado — aqui é simulação local. Ao remover um membro, as despesas já registadas mantêm-se no histórico.</div>
            </div>
          </div>
        )}

        {tab === "conversas" && <ChatGrupo grupo={aberto} onSend={(m) => prem.edit("grupos", aberto.id, { mensagens: [...(aberto.mensagens || []), m] })} />}
        {tab === "calendario" && <GrupoCalendario despesas={aberto.despesas} />}

        {despModal && <DespesaPartilhadaModal grupo={aberto} onClose={() => setDespModal(null)} onSave={(d) => { prem.edit("grupos", aberto.id, { despesas: [...(aberto.despesas || []), d], mensagens: [...(aberto.mensagens || []), sysMsg("Eu adicionou a despesa " + d.titulo + " (" + BM.eur(d.valor) + ")")] }); setDespModal(null); }} />}
        {anexoView && <AnexoViewer anexo={anexoView} onClose={() => setAnexoView(null)} />}
        {remMembro && (
          <Modal title="Remover membro" onClose={() => setRemMembro(null)}
            footer={<><button className="btn btn-ghost" onClick={() => setRemMembro(null)}>Cancelar</button><button className="btn" style={{ background: "var(--neg)", color: "#fff", border: "none" }} onClick={() => { removerMembro(remMembro); setRemMembro(null); }}><Icon name="trash" size={14} color="#fff" /> Remover</button></>}>
            <div className="muted" style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.6 }}>Remover <b>{remMembro}</b> do grupo? As despesas já registadas mantêm-se no histórico.</div>
          </Modal>
        )}
      </div>
    );
  }

  const ultAtual = (g) => { const ds = (g.despesas || []).map((e) => e.data).filter(Boolean).sort(); return ds.length ? ds[ds.length - 1] : ""; };
  let sTotal = 0, sReceber = 0, sPagar = 0, sConv = 0, sAtivos = 0;
  grupos.forEach((g) => { const s = grupoStats(g); sTotal += s.total; sReceber += s.aReceber; sPagar += s.emDivida; sConv += (g.convites || []).filter((c) => c.estado === "pendente").length; if (!g.arquivado) sAtivos++; });
  const kpisTop = [
    { lbl: "Total em grupos", val: BM.eur(sTotal), sub: grupos.length + " grupo(s)", ic: "wallet", c: "#14a06b" },
    { lbl: "A receber", val: BM.eur(sReceber), sub: "no total", ic: "arrowUp", c: "#14a06b", tone: "pos" },
    { lbl: "A pagar", val: BM.eur(sPagar), sub: "no total", ic: "arrowDown", c: "#e5484d", tone: "neg" },
    { lbl: "Grupos ativos", val: String(sAtivos), sub: (grupos.length - sAtivos) + " arquivado(s)", ic: "users", c: "#3b82f6" },
    { lbl: "Convites pendentes", val: String(sConv), sub: "por aceitar", ic: "bell", c: "#d9840a" },
  ];
  const q2 = q.trim().toLowerCase();
  let lista = grupos.filter((g) => {
    if (filtro === "ativos" && g.arquivado) return false;
    if (filtro === "arquivados" && !g.arquivado) return false;
    if (q2 && !((g.nome || "").toLowerCase().includes(q2) || (g.descricao || "").toLowerCase().includes(q2))) return false;
    return true;
  }).sort((a, b) => {
    if (ordem === "nome") return (a.nome || "").localeCompare(b.nome || "");
    if (ordem === "valor") return grupoStats(b).total - grupoStats(a).total;
    return (ultAtual(b) || "").localeCompare(ultAtual(a) || "");
  });
  const convitesPend = [];
  grupos.forEach((g) => (g.convites || []).forEach((c) => { if (c.estado === "pendente") convitesPend.push({ g, c }); }));
  const atividade = [];
  grupos.forEach((g) => (g.despesas || []).forEach((e) => atividade.push({ g, e })));
  atividade.sort((a, b) => (b.e.data || "").localeCompare(a.e.data || ""));
  const ativRecente = atividade.slice(0, 6);

  return (
    <div className="content">
      <div className="ph-kpis">
        {kpisTop.map((k, i) => (
          <div className="card pg-kpi" key={i}>
            <div className="pg-kpi-top"><span className="pg-kpi-lbl">{k.lbl}</span><span className="pg-kpi-ic" style={{ background: k.c }}><Icon name={k.ic} size={15} color="#fff" /></span></div>
            <div className={"pg-kpi-val" + (k.tone ? " " + k.tone : "")}>{k.val}</div>
            <div className="pg-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="ph-layout">
        <div className="ph-main">
          <div className="ph-toolbar">
            <div className="ph-search"><Icon name="search" size={16} color="var(--ink-3)" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar grupo…" /></div>
            <select className="select ph-tool-sel" value={filtro} onChange={(e) => setFiltro(e.target.value)}><option value="ativos">Ativos</option><option value="arquivados">Arquivados</option><option value="todos">Todos</option></select>
            <select className="select ph-tool-sel" value={ordem} onChange={(e) => setOrdem(e.target.value)}><option value="recentes">Recentes</option><option value="nome">Nome</option><option value="valor">Valor</option></select>
            <button className="btn btn-primary ph-tool-add" onClick={() => setModal(true)}><Icon name="plus" size={15} color="#fff" /> Novo grupo</button>
          </div>

          <div className="pg-sec-h"><div className="prem-sec-t">Os meus grupos</div><span className="tiny muted" style={{ fontWeight: 600 }}>{lista.length} de {grupos.length}</span></div>

          {lista.length === 0 ? (
            <div className="card card-pad" style={{ textAlign: "center", padding: "32px 20px" }}>
              <div className="muted" style={{ fontWeight: 600, fontSize: 13.5 }}>{grupos.length === 0 ? "Ainda não tens grupos — cria o primeiro já a seguir." : "Nenhum grupo corresponde à pesquisa."}</div>
            </div>
          ) : (
            <div className="ph-groups">
              {lista.map((g) => {
                const s = grupoStats(g);
                const pessoas = ["Eu", ...(g.membros || [])];
                const ua = ultAtual(g);
                const desc = g.descricao || (pessoas.length > 1 ? "Grupo com " + pessoas.length + " membros" : "Grupo pessoal");
                return (
                  <div className="card ph-gcard" key={g.id}>
                    <div className="ph-gcard-top">
                      <span className="ph-gico"><Icon name="users" size={18} color="#fff" /></span>
                      <span className={"ph-state " + (g.arquivado ? "arch" : "on")}>{g.arquivado ? "Arquivado" : "Ativo"}</span>
                      <div className="ph-menu-wrap">
                        <button className="icon-btn" title="Ações" onClick={() => setMenuId(menuId === g.id ? null : g.id)}><Icon name="dots" size={18} /></button>
                        {menuId === g.id && (
                          <div className="ph-menu">
                            <button onClick={() => { setMenuId(null); setEditId(g.id); }}><Icon name="edit" size={15} /> Editar</button>
                            <button onClick={() => { setMenuId(null); setTab("membros"); setOpenId(g.id); }}><Icon name="users" size={15} /> Convidar membros</button>
                            <button onClick={() => { setMenuId(null); prem.edit("grupos", g.id, { arquivado: !g.arquivado }); }}><Icon name="archive" size={15} /> {g.arquivado ? "Desarquivar" : "Arquivar"}</button>
                            <button className="danger" onClick={() => { setMenuId(null); setDelId(g.id); }}><Icon name="trash" size={15} /> Eliminar</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <b className="ph-gname">{g.nome}</b>
                    <div className="ph-gdesc">{desc}</div>
                    <div className="ph-gav">
                      {pessoas.slice(0, 5).map((p) => <span className="prem-avatar sm" key={p} title={p}>{inicial(p)}</span>)}
                      {pessoas.length > 5 && <span className="prem-avatar more sm">+{pessoas.length - 5}</span>}
                      <span className="ph-gmembers">{pessoas.length} membros</span>
                    </div>
                    <div className="ph-gstats">
                      <div><span className="ph-gs-l">Movimentado</span><span className="ph-gs-v">{BM.eur(s.total)}</span></div>
                      <div><span className="ph-gs-l">A receber</span><span className="ph-gs-v pos">{BM.eur(s.aReceber)}</span></div>
                      <div><span className="ph-gs-l">A pagar</span><span className="ph-gs-v neg">{BM.eur(s.emDivida)}</span></div>
                    </div>
                    <div className="ph-gfoot"><span className="tiny muted">{ua ? "Atualizado " + BM.fmtData(ua) : "Sem atividade"}</span></div>
                    <button className="btn btn-primary ph-gopen" onClick={() => { setTab("dashboard"); setOpenId(g.id); }}>Abrir grupo <span style={{ display: "grid" }}><Icon name="chevR" size={15} color="#fff" /></span></button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="ph-create" onClick={() => setModal(true)}>
            <div className="ph-create-ic"><Icon name="plus" size={26} color="var(--accent)" /></div>
            <div className="ph-create-txt"><b>Criar um novo grupo</b><span>Divide a casa, uma viagem ou o jantar. Convida por email e acompanha tudo num só sítio.</span></div>
            <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); setModal(true); }}><Icon name="plus" size={15} color="#fff" /> Criar novo grupo</button>
          </div>
        </div>

        <aside className="ph-aside">
          <div className="card card-pad">
            <div className="prem-sec-t">Convites recebidos</div>
            {convitesPend.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 4 }}>Sem convites pendentes.</div> :
              convitesPend.map(({ g, c }, i) => (
                <div className="ph-inv" key={i}>
                  <span className="prem-avatar sm">{inicial(c.nome || "?")}</span>
                  <div className="ph-inv-txt"><b>{g.nome}</b><span>{c.email || c.nome}</span></div>
                  <div className="ph-inv-btns">
                    <button className="btn btn-soft" style={{ padding: "5px 10px" }} onClick={() => prem.edit("grupos", g.id, { convites: (g.convites || []).map((x) => (x.nome === c.nome ? { ...x, estado: "ativo" } : x)) })}>Aceitar</button>
                    <button className="icon-btn" title="Recusar" onClick={() => prem.edit("grupos", g.id, { convites: (g.convites || []).filter((x) => x.nome !== c.nome), membros: (g.membros || []).filter((m) => m !== c.nome) })}><span style={{ transform: "rotate(45deg)", display: "grid" }}><Icon name="plus" size={15} color="var(--ink-3)" /></span></button>
                  </div>
                </div>
              ))}
          </div>

          <div className="card card-pad">
            <div className="prem-sec-t">Atividade recente</div>
            {ativRecente.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 4 }}>Ainda sem atividade.</div> :
              <div className="pg-tl" style={{ marginTop: 4 }}>
                {ativRecente.map(({ g, e }, i) => (
                  <div className="pg-tli" key={i}>
                    <span className="pg-tli-ic"><Icon name="plus" size={13} color="var(--accent)" /></span>
                    <div><div className="pg-tli-txt"><b>{e.pagador}</b> adicionou <b>{e.titulo}</b> · <span className="muted">{g.nome}</span></div><div className="pg-tli-time">{e.data ? BM.fmtData(e.data) : ""}</div></div>
                  </div>
                ))}
              </div>}
          </div>

          <div className="card card-pad ph-priv">
            <span className="ph-priv-ic"><Icon name="shield" size={18} color="var(--accent)" /></span>
            <div><b style={{ fontSize: 13.5 }}>Privacidade & segurança</b><div className="muted tiny" style={{ fontWeight: 500, marginTop: 3, lineHeight: 1.55 }}>Só os membros do grupo veem as suas despesas. Podes exigir PIN para ações sensíveis nas Definições.</div></div>
          </div>
        </aside>
      </div>

      {modal && <GrupoModal onClose={() => setModal(false)} onSave={(it) => { prem.add("grupos", it); setModal(false); }} />}
      {editId && grupos.find((g) => g.id === editId) && <GrupoModal grupo={grupos.find((g) => g.id === editId)} onClose={() => setEditId(null)} onSave={(it) => { prem.edit("grupos", editId, it); setEditId(null); }} />}
      {delId && (window.RendeLock && window.RendeLock.hasPin()
        ? <RLConfirmPin title="Eliminar grupo" desc="Vais eliminar este grupo e todas as suas despesas. Esta ação é irreversível." onConfirm={() => prem.remove("grupos", delId)} onClose={() => setDelId(null)} />
        : <Modal title="Eliminar grupo" onClose={() => setDelId(null)}
            footer={<><button className="btn btn-ghost" onClick={() => setDelId(null)}>Cancelar</button><button className="btn" style={{ background: "var(--neg)", color: "#fff", border: "none" }} onClick={() => { prem.remove("grupos", delId); setDelId(null); }}><Icon name="trash" size={14} color="#fff" /> Eliminar</button></>}>
            <div className="muted" style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.6 }}>Vais eliminar este grupo e todas as suas despesas. Esta ação é irreversível.</div>
          </Modal>)}
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
      <div className="card card-pad">
        <div className="prev-hero-head">
          <span className="prem-rico" style={{ background: "color-mix(in srgb, var(--accent) 14%, transparent)" }}><Icon name="chart" size={19} color="var(--accent)" /></span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Previsão de saldo</div>
            <div className="tiny muted" style={{ fontWeight: 600 }}>Como deves acabar este mês, já a contar com as recorrentes por pagar.</div>
          </div>
        </div>
        <div className="prev-proj">
          <div className="prev-proj-l">No fim do mês</div>
          <div className="prev-proj-v tnum valor-sensivel" style={{ color: fimMes >= 0 ? "var(--accent)" : "var(--neg)" }}>{BM.eur(fimMes)}</div>
          <div className="tiny muted" style={{ fontWeight: 600, marginTop: 7 }}>
            <span className="valor-sensivel">{BM.eur(saldoAtual)}</span> de saldo atual − <span className="valor-sensivel">{BM.eur(aSair)}</span> de recorrentes ainda por pagar
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="prev-hero-head" style={{ marginBottom: 14 }}>
          <span className="prem-rico" style={{ background: "color-mix(in srgb, var(--c-habitacao) 14%, transparent)" }}><Icon name="sheet" size={18} color="var(--c-habitacao)" /></span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Relatório do mês</div>
            <div className="tiny muted" style={{ fontWeight: 600 }}>Escolhe o mês e descarrega o resumo em PDF ou Excel.</div>
          </div>
        </div>

        <Field label="Mês">
          <select className="select" value={mes} onChange={(e) => setMes(e.target.value)}>
            {meses.map((m) => <option key={m} value={m}>{rotuloMes(m)}</option>)}
          </select>
        </Field>

        <div className="prem-stats" style={{ marginTop: 14 }}>
          <div className="prem-stat ok"><span className="prem-stat-l">Rendimentos</span><span className="prem-stat-v tnum valor-sensivel">{BM.eur(totR)}</span></div>
          <div className="prem-stat danger"><span className="prem-stat-l">Despesas</span><span className="prem-stat-v tnum valor-sensivel">{BM.eur(totD)}</span></div>
          <div className="prem-stat"><span className="prem-stat-l">Saldo do mês</span><span className="prem-stat-v tnum valor-sensivel">{BM.eur(totR - totD)}</span></div>
        </div>

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

/* Categorias de subscrição (nome + cor para o donut e etiquetas) */
const SUB_CATS = {
  entretenimento: { nome: "Entretenimento", color: "#e5484d" },
  musica: { nome: "Música", color: "#1db954" },
  cloud: { nome: "Cloud", color: "#3693f3" },
  produtividade: { nome: "Produtividade", color: "#d83b01" },
  jogos: { nome: "Jogos", color: "#0070d1" },
  educacao: { nome: "Educação", color: "#a855f7" },
  compras: { nome: "Compras", color: "#f0913a" },
  outros: { nome: "Outros", color: "#787880" },
};
const ICON_CAT = { film: "entretenimento", tv: "entretenimento", music: "musica", wifi: "cloud", briefcase: "produtividade", spark: "produtividade", game: "jogos", bag: "compras" };
function subCat(s) { return s.categoria || ICON_CAT[s.icon] || "outros"; }
function subCatMeta(c) { return SUB_CATS[c] || SUB_CATS.outros; }
function cicloLabel(c) { return { mensal: "Mensal", anual: "Anual", semanal: "Semanal" }[c || "mensal"]; }
function mensalDe(s) { const v = +s.valor || 0, c = s.ciclo || "mensal"; return c === "anual" ? v / 12 : c === "semanal" ? v * 52 / 12 : v; }
function anualDe(s) { const v = +s.valor || 0, c = s.ciclo || "mensal"; return c === "anual" ? v : c === "semanal" ? v * 52 : v * 12; }
function subEstado(s) { return s.estado || "ativa"; }
const SUB_ESTADOS = { ativa: { l: "Ativa", cls: "on" }, trial: { l: "Trial", cls: "trial" }, pausada: { l: "Pausada", cls: "pausa" }, cancelada: { l: "Cancelada", cls: "canc" } };
function proxRenovDate(s) { const h = new Date(); const dia = Math.min(28, Math.max(1, +s.dia || 1)); let d = new Date(h.getFullYear(), h.getMonth(), dia); const hj = new Date(h.getFullYear(), h.getMonth(), h.getDate()); if (d < hj) d = new Date(h.getFullYear(), h.getMonth() + 1, dia); return d; }
function diasAte(d) { const h = new Date(); return Math.round((d - new Date(h.getFullYear(), h.getMonth(), h.getDate())) / 86400000); }
function subEstadoPill(s) { const e = SUB_ESTADOS[subEstado(s)] || SUB_ESTADOS.ativa; return <span className={"sub-estado " + e.cls}>{e.l}</span>; }

function SubCalendario({ subs }) {
  const hoje = new Date();
  const [ref, setRef] = React.useState({ y: hoje.getFullYear(), m: hoje.getMonth() });
  const ativos = (subs || []).filter((s) => subEstado(s) === "ativa" || subEstado(s) === "trial");
  const first = new Date(ref.y, ref.m, 1);
  const startDow = (first.getDay() + 6) % 7;
  const dias = new Date(ref.y, ref.m + 1, 0).getDate();
  const byDay = {};
  ativos.forEach((s) => { const d = Math.min(dias, Math.min(28, Math.max(1, +s.dia || 1))); (byDay[d] = byDay[d] || []).push(s); });
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= dias; d++) cells.push(d);
  const shift = (delta) => setRef((r) => { let m = r.m + delta, y = r.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } return { y, m }; });
  const isHoje = (d) => hoje.getFullYear() === ref.y && hoje.getMonth() === ref.m && hoje.getDate() === d;
  const listaDias = Object.keys(byDay).map(Number).sort((a, b) => a - b);
  return (
    <div className="card card-pad">
      <div className="pg-cal-head">
        <button className="pg-back" onClick={() => shift(-1)} title="Mês anterior"><span style={{ display: "grid", transform: "rotate(180deg)" }}><Icon name="chevR" size={15} /></span></button>
        <b style={{ fontSize: 15 }}>{BM.MESES[ref.m]} {ref.y}</b>
        <button className="pg-back" onClick={() => shift(1)} title="Mês seguinte"><Icon name="chevR" size={15} /></button>
      </div>
      <div className="pg-cal-grid pg-cal-dow">{["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => <span key={d}>{d}</span>)}</div>
      <div className="pg-cal-grid">
        {cells.map((d, i) => (
          <div key={i} className={"pg-cal-cell" + (d ? "" : " empty") + (d && isHoje(d) ? " hoje" : "") + (d && byDay[d] ? " tem" : "")}>
            {d && <span className="pg-cal-d">{d}</span>}
            {d && byDay[d] && <span className="pg-cal-dot">{byDay[d].length}</span>}
          </div>
        ))}
      </div>
      {listaDias.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 12 }}>Sem renovações neste mês.</div> :
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 2 }}>
          {listaDias.map((d) => byDay[d].map((s) => (
            <div className="pg-up" key={s.id + "-" + d}>
              <div className="pg-up-d"><div className="dd">{d}</div><div className="mm">{BM.MESES[ref.m].slice(0, 3)}</div></div>
              <span className="prem-rico sm" style={{ background: "color-mix(in srgb, " + (s.color || "var(--accent)") + " 14%, transparent)" }}><Icon name={s.icon || "tv"} size={15} color={s.color || "var(--accent)"} /></span>
              <div className="pg-up-main"><div className="pg-up-t">{s.nome}</div><div className="pg-up-m">{subCatMeta(subCat(s)).nome} · {cicloLabel(s.ciclo)}</div></div>
              <div className="pg-up-v">{BM.eur(s.valor)}</div>
            </div>
          )))}
        </div>}
    </div>
  );
}

function SubModal({ mesAtual, sub, onClose, onSave }) {
  const editing = !!sub;
  const [base, setBase] = React.useState(editing ? { nome: sub.nome } : null); // null = ainda a escolher do catálogo
  const [f, setF] = React.useState(editing
    ? { nome: sub.nome || "", valor: String(sub.valor).replace(".", ","), dia: sub.dia || 1, icon: sub.icon || "tv", color: sub.color || "var(--accent)", ciclo: sub.ciclo || "mensal", categoria: subCat(sub), metodo: sub.metodo || "", estado: sub.estado || "ativa" }
    : { nome: "", valor: "", dia: 1, icon: "tv", color: "var(--accent)", ciclo: "mensal", categoria: "outros", metodo: "", estado: "ativa" });
  const [err, setErr] = React.useState("");
  const escolher = (c) => { setBase(c); setF({ nome: c.nome, valor: String(c.valor).replace(".", ","), dia: 1, icon: c.icon, color: c.color, ciclo: "mensal", categoria: ICON_CAT[c.icon] || "outros", metodo: "", estado: "ativa" }); setErr(""); };
  const outra = () => { setBase({ nome: "" }); setF({ nome: "", valor: "", dia: 1, icon: "spark", color: "var(--accent)", ciclo: "mensal", categoria: "outros", metodo: "", estado: "ativa" }); setErr(""); };
  const upd = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const guardar = () => {
    if (!f.nome.trim()) return setErr("Dá um nome à subscrição.");
    if (numOf(f.valor) <= 0) return setErr("Indica um valor válido.");
    onSave({ nome: f.nome.trim(), valor: numOf(f.valor), dia: Math.min(28, Math.max(1, +f.dia || 1)), icon: f.icon, color: f.color, ciclo: f.ciclo, categoria: f.categoria, metodo: f.metodo.trim(), estado: f.estado, desde: editing ? sub.desde : mesAtual });
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
    <Modal title={editing ? "Editar subscrição" : (base.nome || "Nova subscrição")} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={() => (editing ? onClose() : setBase(null))}>{editing ? "Cancelar" : "Voltar"}</button><button className="btn btn-primary" onClick={guardar}><Icon name="check" size={14} color="#fff" /> {editing ? "Guardar" : "Adicionar"}</button></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Nome"><input className="input" autoFocus value={f.nome} onChange={upd("nome")} placeholder="Ex: Netflix" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Valor" hint="Ajusta ao teu plano."><input className="input" inputMode="decimal" value={f.valor} onChange={upd("valor")} placeholder="0,00" /></Field>
          <Field label="Ciclo de cobrança"><select className="select" value={f.ciclo} onChange={upd("ciclo")}><option value="mensal">Mensal</option><option value="anual">Anual</option><option value="semanal">Semanal</option></select></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Categoria"><select className="select" value={f.categoria} onChange={upd("categoria")}>{Object.keys(SUB_CATS).map((k) => <option key={k} value={k}>{SUB_CATS[k].nome}</option>)}</select></Field>
          <Field label="Dia de renovação"><input className="input" type="number" min="1" max="28" value={f.dia} onChange={upd("dia")} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Método de pagamento" hint="opcional"><input className="input" value={f.metodo} onChange={upd("metodo")} placeholder="Ex: Visa •• 42" /></Field>
          <Field label="Estado"><select className="select" value={f.estado} onChange={upd("estado")}><option value="ativa">Ativa</option><option value="trial">Trial (período gratuito)</option><option value="pausada">Pausada</option><option value="cancelada">Cancelada</option></select></Field>
        </div>
        {err && <div className="alert bad" style={{ padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
      </div>
    </Modal>
  );
}

function Subscricoes() { return <PremiumGate><SubscricoesInner /></PremiumGate>; }

function SubSkeleton() {
  return (
    <>
      <div className="ph-kpis sub-kpis">{[0, 1, 2, 3, 4].map((i) => <div className="pg-kpi sk" key={i}><div className="sk-box" style={{ width: 34, height: 34, borderRadius: 10 }} /><div className="sk-line" style={{ width: "60%", height: 20, marginTop: 12 }} /><div className="sk-line" style={{ width: "80%", height: 11, marginTop: 8 }} /></div>)}</div>
      <div className="ph-layout">
        <div className="ph-main"><div className="card" style={{ padding: 16 }}>{[0, 1, 2, 3, 4].map((i) => <div className="sk-row" key={i}><div className="sk-box" style={{ width: 30, height: 30, borderRadius: 9 }} /><div className="sk-line" style={{ flex: 1, height: 13 }} /><div className="sk-line" style={{ width: 60, height: 13 }} /></div>)}</div></div>
        <div className="ph-aside"><div className="card card-pad" style={{ display: "grid", placeItems: "center", minHeight: 200 }}><div className="sk-box" style={{ width: 160, height: 160, borderRadius: "50%" }} /></div></div>
      </div>
    </>
  );
}

function SubscricoesInner() {
  const fin = useFinance();
  const prem = usePremium();
  const mes = fin.month;
  const todas = prem.get().subscricoes || [];
  const pagos = prem.get().pagosSub || {};
  const [modal, setModal] = React.useState(false);
  const [editId, setEditId] = React.useState(null);
  const [menuId, setMenuId] = React.useState(null);
  const [menuPos, setMenuPos] = React.useState({ top: 0, right: 0 });
  const [q, setQ] = React.useState("");
  const [filtro, setFiltro] = React.useState("todas");
  const [ordem, setOrdem] = React.useState("nome");
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const pageSize = 6;

  React.useEffect(() => { const t = setTimeout(() => setLoading(false), 340); return () => clearTimeout(t); }, []);
  React.useEffect(() => { if (!menuId) return; const h = () => setMenuId(null); document.addEventListener("click", h); window.addEventListener("scroll", h, true); window.addEventListener("resize", h); return () => { document.removeEventListener("click", h); window.removeEventListener("scroll", h, true); window.removeEventListener("resize", h); }; }, [menuId]);
  React.useEffect(() => { setPage(1); }, [q, filtro, ordem]);

  const isPago = (id) => !!(pagos[id] && pagos[id][mes]);
  const togglePago = (id) => { const cur = prem.get().pagosSub || {}; const ms = { ...(cur[id] || {}) }; if (ms[mes]) delete ms[mes]; else ms[mes] = true; prem.update({ pagosSub: { ...cur, [id]: ms } }); };
  const apagar = (id) => { const cur = prem.get().pagosSub || {}; if (cur[id]) { const c2 = { ...cur }; delete c2[id]; prem.update({ pagosSub: c2 }); } prem.remove("subscricoes", id); };
  const setEstado = (id, estado) => prem.edit("subscricoes", id, { estado });

  const faturaveis = todas.filter((s) => subEstado(s) === "ativa");
  const totalMes = faturaveis.reduce((a, s) => a + mensalDe(s), 0);
  const totalAno = faturaveis.reduce((a, s) => a + anualDe(s), 0);
  const nAtivas = faturaveis.length;
  const nTrials = todas.filter((s) => subEstado(s) === "trial").length;
  const prox30 = todas.filter((s) => { const st = subEstado(s); if (st === "cancelada" || st === "pausada") return false; const d = diasAte(proxRenovDate(s)); return d >= 0 && d <= 30; });

  const porCat = {};
  faturaveis.forEach((s) => { const c = subCat(s); porCat[c] = (porCat[c] || 0) + mensalDe(s); });
  const donutData = Object.keys(porCat).map((c) => ({ key: c, nome: subCatMeta(c).nome, color: subCatMeta(c).color, valor: porCat[c] })).sort((a, b) => b.valor - a.valor);

  const renovacoes = todas.filter((s) => subEstado(s) === "ativa" || subEstado(s) === "trial")
    .map((s) => ({ s, d: proxRenovDate(s), dias: diasAte(proxRenovDate(s)) })).sort((a, b) => a.d - b.d).slice(0, 5);

  const sugestoes = [];
  Object.keys(porCat).forEach((c) => { const doCat = faturaveis.filter((s) => subCat(s) === c); if (doCat.length > 1) { const menor = Math.min.apply(null, doCat.map((s) => mensalDe(s))); sugestoes.push({ cat: c, n: doCat.length, poupanca: menor, nomes: doCat.map((s) => s.nome) }); } });

  let lista = todas.slice();
  if (q.trim()) { const k = q.trim().toLowerCase(); lista = lista.filter((s) => s.nome.toLowerCase().includes(k) || subCatMeta(subCat(s)).nome.toLowerCase().includes(k)); }
  if (filtro !== "todas") lista = lista.filter((s) => subEstado(s) === filtro);
  lista.sort((a, b) => ordem === "valor" ? mensalDe(b) - mensalDe(a) : ordem === "renov" ? proxRenovDate(a) - proxRenovDate(b) : a.nome.localeCompare(b.nome));
  const totalPags = Math.max(1, Math.ceil(lista.length / pageSize));
  const pag = Math.min(page, totalPags);
  const visiveis = lista.slice((pag - 1) * pageSize, pag * pageSize);

  const abrirNova = () => { setEditId(null); setModal(true); };
  const abrirEdit = (id) => { setEditId(id); setModal(true); };
  const subEdit = editId ? todas.find((s) => s.id === editId) : null;
  const dataCurta = (d) => d.getDate() + " " + BM.MESES[d.getMonth()].slice(0, 3).toLowerCase();

  if (!loading && todas.length === 0) {
    return (
      <div className="content">
        <PremActions label="Adicionar subscrição" onAdd={abrirNova} />
        <EmptyState icon="tv" title="Ainda sem subscrições" msg="Adiciona os teus serviços recorrentes (Netflix, Spotify, iCloud…), define valor, ciclo e dia de renovação — o Rende+ trata das contas por ti."
          action={<button className="btn btn-primary" onClick={abrirNova}><Icon name="plus" size={16} color="#fff" /> Adicionar subscrição</button>} />
        {modal && <SubModal mesAtual={mes} sub={null} onClose={() => setModal(false)} onSave={(it) => { prem.add("subscricoes", it); setModal(false); }} />}
      </div>
    );
  }

  return (
    <div className="content">
      <PremActions label="Adicionar subscrição" onAdd={abrirNova} />

      {loading ? <SubSkeleton /> : <>
      <div className="ph-kpis sub-kpis">
        <div className="pg-kpi"><div className="pg-kpi-ic" style={{ background: "color-mix(in srgb, var(--accent) 14%, transparent)" }}><Icon name="wallet" size={17} color="var(--accent)" /></div><div className="pg-kpi-v tnum">{BM.eur(totalMes)}</div><div className="pg-kpi-l">Gasto este mês</div></div>
        <div className="pg-kpi"><div className="pg-kpi-ic" style={{ background: "color-mix(in srgb, #6366f1 15%, transparent)" }}><Icon name="chart" size={17} color="#6366f1" /></div><div className="pg-kpi-v tnum">{BM.eur(totalAno)}</div><div className="pg-kpi-l">Anual previsto</div></div>
        <div className="pg-kpi"><div className="pg-kpi-ic" style={{ background: "color-mix(in srgb, var(--pos) 15%, transparent)" }}><Icon name="check" size={17} color="var(--pos)" /></div><div className="pg-kpi-v tnum">{nAtivas}</div><div className="pg-kpi-l">Subscrições ativas</div></div>
        <div className="pg-kpi"><div className="pg-kpi-ic" style={{ background: "color-mix(in srgb, #f0913a 16%, transparent)" }}><Icon name="history" size={17} color="#f0913a" /></div><div className="pg-kpi-v tnum">{prox30.length}</div><div className="pg-kpi-l">Renovações (30 dias)</div></div>
        <div className="pg-kpi"><div className="pg-kpi-ic" style={{ background: "color-mix(in srgb, #a855f7 15%, transparent)" }}><Icon name="spark" size={17} color="#a855f7" /></div><div className="pg-kpi-v tnum">{nTrials}</div><div className="pg-kpi-l">Trials ativos</div></div>
      </div>

      <div className="ph-layout">
        <div className="ph-main">
          <div className="ph-toolbar sub-tools">
            <div className="ph-search"><Icon name="search" size={15} color="var(--ink-3)" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar subscrição…" /></div>
          </div>

          <div className="card sub-tablewrap">
            {visiveis.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, padding: 28, textAlign: "center" }}>Nenhuma subscrição corresponde aos filtros.</div> :
            <table className="sub-table">
              <thead><tr><th>Serviço</th><th>Categoria</th><th>Valor</th><th>Ciclo</th><th>Próxima renovação</th><th className="sub-col-m">Método</th><th>Estado</th><th className="sub-col-act" aria-label="Ações"></th></tr></thead>
              <tbody>
                {visiveis.map((s) => {
                  const cor = s.color || "var(--accent)";
                  const d = proxRenovDate(s); const dd = diasAte(d);
                  return (
                    <tr key={s.id} className={subEstado(s) === "cancelada" ? "is-off" : ""}>
                      <td><div className="sub-serv"><span className="prem-rico sm" style={{ background: "color-mix(in srgb, " + cor + " 14%, transparent)" }}><Icon name={s.icon || "tv"} size={16} color={cor} /></span><b>{s.nome}</b></div></td>
                      <td><span className="sub-cat-tag" style={{ "--cc": subCatMeta(subCat(s)).color }}>{subCatMeta(subCat(s)).nome}</span></td>
                      <td className="tnum" style={{ fontWeight: 800 }}>{BM.eur(s.valor)}</td>
                      <td className="muted">{cicloLabel(s.ciclo)}</td>
                      <td><div className="sub-renov"><b>{dataCurta(d)}</b><span className="muted tiny">{dd === 0 ? "hoje" : dd === 1 ? "amanhã" : "em " + dd + " dias"}</span></div></td>
                      <td className="muted sub-col-m">{s.metodo || "—"}</td>
                      <td>{subEstadoPill(s)}</td>
                      <td className="sub-col-act">
                        <button className="icon-btn" title="Ações" onClick={(e) => { e.stopPropagation(); if (menuId === s.id) { setMenuId(null); return; } const r = e.currentTarget.getBoundingClientRect(); setMenuPos({ top: Math.round(r.bottom + 6), right: Math.round(window.innerWidth - r.right) }); setMenuId(s.id); }}><Icon name="dots" size={18} color="var(--ink-2)" /></button>
                        {menuId === s.id && ReactDOM.createPortal(
                          <div className="ph-menu sub-menu-pop" style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 400 }} onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => { togglePago(s.id); setMenuId(null); }}><Icon name="check" size={15} color="var(--ink-2)" /> {isPago(s.id) ? "Desmarcar pago (mês)" : "Marcar pago (mês)"}</button>
                            <button onClick={() => { abrirEdit(s.id); setMenuId(null); }}><Icon name="edit" size={15} color="var(--ink-2)" /> Editar</button>
                            {subEstado(s) === "pausada"
                              ? <button onClick={() => { setEstado(s.id, "ativa"); setMenuId(null); }}><Icon name="check" size={15} color="var(--ink-2)" /> Retomar</button>
                              : <button onClick={() => { setEstado(s.id, "pausada"); setMenuId(null); }}><Icon name="history" size={15} color="var(--ink-2)" /> Pausar</button>}
                            {subEstado(s) === "cancelada"
                              ? <button onClick={() => { setEstado(s.id, "ativa"); setMenuId(null); }}><Icon name="check" size={15} color="var(--ink-2)" /> Reativar</button>
                              : <button onClick={() => { setEstado(s.id, "cancelada"); setMenuId(null); }}><Icon name="x" size={15} color="var(--ink-2)" /> Cancelar</button>}
                            <button className="danger" onClick={() => { apagar(s.id); setMenuId(null); }}><Icon name="trash" size={15} color="var(--neg)" /> Eliminar</button>
                          </div>, document.body)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>}
          </div>

          {totalPags > 1 && (
            <div className="sub-pag">
              <button className="btn btn-soft" disabled={pag <= 1} onClick={() => setPage(pag - 1)}>Anterior</button>
              <span className="muted tiny" style={{ fontWeight: 700 }}>Página {pag} de {totalPags} · {lista.length} subscriç{lista.length === 1 ? "ão" : "ões"}</span>
              <button className="btn btn-soft" disabled={pag >= totalPags} onClick={() => setPage(pag + 1)}>Seguinte</button>
            </div>
          )}

          <div className="sub-cal-block">
            <div className="prem-sec-t" style={{ marginBottom: 4 }}>Calendário de renovações</div>
            <div className="sub-sec-sub">Todas as datas de renovação do mês, num relance.</div>
            <div className="sub-cal"><SubCalendario subs={todas} /></div>
          </div>
        </div>

        <div className="ph-aside">
          <div className="card card-pad">
            <div className="prem-sec-t">Gastos por categoria</div>
            <div className="sub-sec-sub">Distribuição do custo mensal por tipo de serviço.</div>
            {donutData.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 4 }}>Sem gastos ativos.</div> :
              <>
                <div style={{ display: "grid", placeItems: "center", padding: "6px 0 10px" }}>
                  <DonutChart data={donutData} size={168} thickness={20} center={<div style={{ textAlign: "center" }}><div className="tnum" style={{ fontSize: 18, fontWeight: 800 }}>{BM.eur(totalMes)}</div><div className="muted tiny" style={{ fontWeight: 600 }}>por mês</div></div>} />
                </div>
                {donutData.map((d) => (<div className="sub-leg" key={d.key}><span className="sub-leg-dot" style={{ background: d.color }} /><span className="sub-leg-n">{d.nome}</span><span className="tnum sub-leg-v">{BM.eur(d.valor)}</span></div>))}
              </>}
          </div>

          <div className="card card-pad">
            <div className="prem-sec-t">Próximas renovações</div>
            <div className="sub-sec-sub">As próximas cobranças, por ordem cronológica.</div>
            {renovacoes.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 4 }}>Sem renovações próximas.</div> :
              renovacoes.map(({ s, d, dias }) => {
                const cor = s.color || "var(--accent)";
                return (
                  <div className="sub-up" key={s.id}>
                    <span className="prem-rico sm" style={{ background: "color-mix(in srgb, " + cor + " 14%, transparent)" }}><Icon name={s.icon || "tv"} size={15} color={cor} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 13.5 }}>{s.nome}</b><div className="muted tiny">{dias === 0 ? "Renova hoje" : dias === 1 ? "Renova amanhã" : dataCurta(d) + " · em " + dias + " dias"}</div></div>
                    <b className="tnum" style={{ fontSize: 13.5 }}>{BM.eur(s.valor)}</b>
                  </div>
                );
              })}
          </div>

          <div className="card card-pad">
            <div className="prem-sec-t">Sugestões de poupança</div>
            <div className="sub-sec-sub">Serviços semelhantes ou duplicados que podes rever.</div>
            {sugestoes.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600, marginTop: 4, lineHeight: 1.5 }}>Nada a assinalar — sem serviços duplicados. 👌</div> :
              sugestoes.map((x) => (
                <div className="sub-sugg" key={x.cat}>
                  <Icon name="info" size={15} color="var(--accent)" />
                  <div><div style={{ fontSize: 13, fontWeight: 700 }}>Tens {x.n} serviços de {subCatMeta(x.cat).nome}.</div><div className="muted tiny" style={{ marginTop: 2, lineHeight: 1.45 }}>{x.nomes.join(", ")} · poupa ~{BM.eur(x.poupanca)}/mês</div></div>
                </div>
              ))}
          </div>
        </div>
      </div>
      </>}

      {modal && <SubModal mesAtual={mes} sub={subEdit} onClose={() => { setModal(false); setEditId(null); }} onSave={(it) => { if (editId) prem.edit("subscricoes", editId, it); else prem.add("subscricoes", it); setModal(false); setEditId(null); }} />}
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
  const pagosR = s.pagosRec || {};
  (s.recorrentes || []).forEach((r) => {
    if (pagosR[r.id] && pagosR[r.id][mes]) return; // já paga este mês
    const alvo = mes + "-" + String(Math.min(28, r.dia || 1)).padStart(2, "0");
    const d = daysUntil(alvo);
    if (d <= aviso) out.push({ chave: "rec:" + r.id + ":" + mes, tipo: "recorrente", id: r.id, titulo: r.titulo, valor: r.valor, d });
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
    const chave = a.tipo === "recorrente" ? "pagosRec" : "pagosSub";
    const cur = prem.get()[chave] || {};
    prem.update({ [chave]: { ...cur, [a.id]: { ...(cur[a.id] || {}), [mes]: true } } });
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
              <span style={{ fontWeight: 700, fontSize: 14.5 }}>Notificações</span>
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
                      <span className="notif-item-ico" style={{ background: `color-mix(in srgb, ${cor} 14%, transparent)` }}><Icon name={a.tipo === "subscricao" ? "tv" : a.tipo === "recorrente" ? "sync" : "bell"} size={16} color={cor} /></span>
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
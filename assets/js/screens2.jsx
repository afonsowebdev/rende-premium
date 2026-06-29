/* ===== Screens (parte 2): Poupança, Relatórios, Histórico, Definições ===== */

/* ---------- POUPANÇA ---------- */
function Poupanca({ open }) {
  const fin = useFinance();
  const metas = fin.data.metas;
  const totalAlvo = metas.reduce((s, m) => s + (+m.alvo || 0), 0);
  const totalAtual = metas.reduce((s, m) => s + (+m.atual || 0), 0);
  const pct = totalAlvo > 0 ? Math.round((totalAtual / totalAlvo) * 100) : 0;
  const mesLabel = (key) => { const [y, mo] = (key || "").split("-").map(Number); return mo ? BM.MESES[mo - 1] + " " + y : ""; };
  const [vista, setVista] = React.useState("evo");
  const poupDonut = metas.filter((m) => (+m.atual || 0) > 0).map((m) => ({ nome: m.nome, valor: +m.atual, color: m.cor }));

  return (
    <div className="content">
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <Kpi label="Total poupado" value={BM.eur0(totalAtual)} icon="target" color="var(--accent)" sub={`Em ${metas.length} ${metas.length === 1 ? "meta" : "metas"}`} />
        <Kpi label="Objetivo total" value={BM.eur0(totalAlvo)} icon="flag" color="var(--c-habitacao)" sub="Soma de todas as metas" />
        <Kpi label="Progresso global" value={pct + "%"} icon="chart" color="var(--c-educacao)" sub={totalAlvo > 0 ? `Faltam ${BM.eur0(totalAlvo - totalAtual)}` : "Sem metas ainda"} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        {metas.map((m) => {
          const isOpen = !m.alvo || m.alvo <= 0;
          const p = isOpen ? null : Math.round((m.atual / m.alvo) * 100);
          const done = !isOpen && m.atual >= m.alvo;
          const fechada = !!m.fechada;
          return (
            <div className="card card-pad" key={m.id} style={{ display: "flex", flexDirection: "column", gap: 16, opacity: fechada ? 0.74 : 1 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="li-ico" style={{ width: 44, height: 44, background: `color-mix(in srgb, ${m.cor} 16%, transparent)` }}>
                  <Icon name={done || fechada ? "check" : "target"} size={20} color={m.cor} sw={2} />
                </div>
                <div className="row" style={{ gap: 4 }}>
                  <span className="chip" style={{ background: `color-mix(in srgb, ${m.cor} 14%, transparent)`, color: m.cor, borderColor: "transparent" }}>{fechada ? "Concluída" : isOpen ? "Livre" : p + "%"}</span>
                  <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => open("meta", m)}><Icon name="edit" size={13} /></button>
                  <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => fin.meta.remove(m.id)}><Icon name="trash" size={13} /></button>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{m.nome}</div>
                <div className="tnum" style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{BM.eur0(m.atual)} {isOpen ? <span style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 700 }}>acumulado</span> : <span style={{ fontSize: 15, color: "var(--ink-3)", fontWeight: 700 }}>/ {BM.eur0(m.alvo)}</span>}</div>
              </div>
              {isOpen
                ? <div className="bar" style={{ opacity: .5 }}><i style={{ width: "100%", background: m.cor }} /></div>
                : <Progress value={m.atual} max={m.alvo} color={m.cor} />}
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <span className="tiny muted" style={{ fontWeight: 700 }}>{fechada ? `Concluída${m.fechadaEm ? " · " + mesLabel(m.fechadaEm) : ""}` : isOpen ? "Poupança sem objetivo fixo" : done ? "Meta atingida 🎉" : `Faltam ${BM.eur0(m.alvo - m.atual)}`}</span>
                <div className="row" style={{ gap: 8 }}>
                  {!fechada && <button className="btn btn-soft" style={{ flex: 1, justifyContent: "center", padding: "8px 12px" }} onClick={() => open("deposit", m)}><Icon name="plus" size={14} /> Depositar</button>}
                  {fechada
                    ? <button className="btn btn-soft" style={{ flex: 1, justifyContent: "center", padding: "8px 12px" }} onClick={() => fin.meta.reabrir(m.id)}><Icon name="history" size={14} /> Reabrir</button>
                    : <button className="btn btn-soft" style={{ flex: 1, justifyContent: "center", padding: "8px 12px" }} onClick={() => fin.meta.fechar(m.id)}><Icon name="check" size={14} /> Concluir</button>}
                </div>
              </div>
            </div>
          );
        })}
        <button className="card card-pad" onClick={() => open("meta")} style={{ display: "grid", placeItems: "center", border: "1.5px dashed var(--border-strong)", background: "transparent", minHeight: 220, cursor: "pointer", textAlign: "center" }}>
          <div>
            <div className="li-ico" style={{ width: 48, height: 48, margin: "0 auto 12px", background: "var(--accent-soft)" }}><Icon name="plus" size={22} color="var(--accent)" sw={2.2} /></div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Nova meta de poupança</div>
            <div className="tiny muted" style={{ marginTop: 4, fontWeight: 600, maxWidth: 180, marginInline: "auto" }}>Define um objetivo e acompanha o progresso.</div>
          </div>
        </button>
      </div>

      {metas.length > 0 && (
        <div className="card card-pad">
          <div className="section-head" style={{ marginBottom: 12 }}>
            <div>
              <div className="section-title">As tuas poupanças</div>
              <div className="tiny muted" style={{ fontWeight: 600, marginTop: 2 }}>{vista === "evo" ? "Acumulado de cada meta, mês a mês — as concluídas aparecem a tracejado" : "Quanto tens em cada meta, fatia do total poupado"}</div>
            </div>
            <div className="seg">
              <button className={"seg-btn" + (vista === "evo" ? " on" : "")} onClick={() => setVista("evo")}><Icon name="chart" size={14} /> Evolução</button>
              <button className={"seg-btn" + (vista === "meta" ? " on" : "")} onClick={() => setVista("meta")}><Icon name="target" size={14} /> Por meta</button>
            </div>
          </div>
          {vista === "evo" ? (
            <MultiLineSavings months={fin.series.map((s) => s.m)} series={fin.metaSeries} />
          ) : poupDonut.length === 0 ? (
            <div style={{ display: "grid", placeItems: "center", height: 180, textAlign: "center" }} className="muted tiny">
              <div><Icon name="target" size={26} color="var(--ink-3)" /><div style={{ marginTop: 8, fontWeight: 600 }}>Ainda não depositaste em nenhuma meta.</div></div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
              <DonutChart data={poupDonut} size={200} thickness={32}
                center={<div style={{ textAlign: "center" }}><div className="tnum valor-sensivel" style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-.02em" }}>{BM.eur0(totalAtual)}</div><div className="tiny muted" style={{ fontWeight: 600 }}>poupado</div></div>} />
            </div>
          )}
          <div className="row" style={{ flexWrap: "wrap", gap: 16, marginTop: 14 }}>
            {fin.metaSeries.map((s) => (
              <span key={s.id} className="row" style={{ gap: 7, fontSize: 12.5, fontWeight: 700, opacity: s.fechada ? 0.6 : 1 }}>
                <span className="dot" style={{ background: s.cor }} />{s.nome}{s.fechada ? " (concluída)" : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {fin.totalRec > 0 && fin.saldo > 0 && metas.length > 0 && (
        <Alert kind="ok" icon="target" title={`Este mês sobrou-te ${BM.eur0(fin.saldo)} para poupar.`}>
          Considera transferir parte deste valor para uma das tuas metas.
        </Alert>
      )}
    </div>
  );
}

/* ---------- RELATÓRIOS ---------- */
function Relatorios() {
  const fin = useFinance();
  const hist = fin.historico;
  if (hist.length === 0) {
    return <div className="content"><EmptyState icon="report" title="Sem dados para relatórios"
      msg="Assim que registares rendimentos e despesas, geramos automaticamente médias, gráficos e análises da tua saúde financeira." /></div>;
  }
  const mRec = Math.round(hist.reduce((s, h) => s + h.rec, 0) / hist.length);
  const mGasto = Math.round(hist.reduce((s, h) => s + h.gasto, 0) / hist.length);
  const mPoup = mRec - mGasto;
  const taxa = mRec > 0 ? Math.round((mPoup / mRec) * 100) : 0;
  const topCat = fin.catBreak[0];

  return (
    <div className="content">
      <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <Kpi label="Média recebida / mês" value={BM.eur0(mRec)} icon="arrowsDown" color="var(--accent)" />
        <Kpi label="Média gasta / mês" value={BM.eur0(mGasto)} icon="wallet" color="var(--c-transporte)" />
        <Kpi label="Média poupada / mês" value={BM.eur0(mPoup)} icon="target" color="var(--c-educacao)" />
        <Kpi label="Taxa de poupança" value={taxa + "%"} icon="chart" color="var(--c-habitacao)" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card card-pad">
          <div className="section-title" style={{ marginBottom: 14 }}>Receitas vs. Despesas</div>
          <BarPair data={fin.series} height={220} />
          <div className="row tiny" style={{ fontWeight: 700, marginTop: 10, gap: 16 }}>
            <span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: "var(--accent)" }} /> Receitas</span>
            <span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: "var(--c-transporte)" }} /> Despesas</span>
          </div>
        </div>
        <div className="card card-pad">
          <div className="section-title" style={{ marginBottom: 14 }}>Onde vai o teu dinheiro <span className="muted tiny" style={{ fontWeight: 600 }}>· {fin.monthLabel}</span></div>
          {fin.catBreak.length === 0 ? <div className="muted tiny" style={{ fontWeight: 600 }}>Sem despesas neste mês.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {fin.catBreak.map((c) => {
                const p = fin.totalGasto > 0 ? Math.round((c.valor / fin.totalGasto) * 100) : 0;
                return (
                  <div key={c.key}>
                    <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                      <span className="row" style={{ gap: 8, fontSize: 13, fontWeight: 700 }}><span className="dot" style={{ background: c.color }} />{c.nome}</span>
                      <span className="tnum tiny" style={{ fontWeight: 700 }}>{BM.eur0(c.valor)} · {p}%</span>
                    </div>
                    <div className="bar"><i style={{ width: p + "%", background: c.color }} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card card-pad">
        <div className="section-title" style={{ marginBottom: 4 }}>Análise automática</div>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", marginTop: 12 }}>
          {topCat ? <Alert kind="bad" icon="info" title={`Maior gasto: ${topCat.nome}`}>{`Representa ${Math.round((topCat.valor / fin.totalGasto) * 100)}% das despesas de ${fin.monthLabel}.`}</Alert>
            : <Alert kind="ok" icon="check" title="Sem despesas este mês">Boa gestão!</Alert>}
          {taxa >= 0 ? <Alert kind={taxa >= 10 ? "ok" : "warn"} icon={taxa >= 10 ? "check" : "bell"} title={`Taxa média de poupança: ${taxa}%`}>{taxa >= 10 ? "Estás no bom caminho." : "Tenta reduzir despesas variáveis."}</Alert>
            : <Alert kind="bad" icon="info" title="Estás a gastar mais do que recebes">Reavalia as tuas despesas fixas.</Alert>}
          <Alert kind="ok" icon="history" title={`${hist.length} ${hist.length === 1 ? "mês registado" : "meses registados"}`}>Continua a registar para análises mais precisas.</Alert>
        </div>
      </div>
    </div>
  );
}

/* ---------- HISTÓRICO ---------- */
/* ---------- Lista de atividade (registo de alterações) ---------- */
const _fmtDiaAtiv = (ts) => {
  const d = new Date(ts), h = new Date(), o = new Date(h); o.setDate(h.getDate() - 1);
  if (d.toDateString() === h.toDateString()) return "Hoje";
  if (d.toDateString() === o.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
};
const _fmtHoraAtiv = (ts) => new Date(ts).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

function AtividadeLista() {
  const fin = useFinance();
  const [filtro, setFiltro] = React.useState("tudo");
  const todas = fin.atividade || [];
  if (todas.length === 0) {
    return <EmptyState icon="history" title="Sem atividade ainda"
      msg="Cada vez que crias, editas ou eliminas uma despesa, rendimento ou meta, fica aqui registado." />;
  }
  const itens = todas.filter((a) => (filtro === "tudo" ? true : a.acao === filtro));
  const grupos = []; const idx = {};
  itens.forEach((a) => { const k = _fmtDiaAtiv(a.ts); if (idx[k] == null) { idx[k] = grupos.length; grupos.push([k, []]); } grupos[idx[k]][1].push(a); });
  const cor = { criou: "var(--accent)", editou: "var(--c-internet)", eliminou: "var(--neg)" };
  const rotuloAcao = { criou: "Criou", editou: "Editou", eliminou: "Eliminou" };
  return (
    <>
      <div className="card card-pad row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <div className="seg" style={{ flexWrap: "wrap" }}>
          {[["tudo", "Tudo"], ["criou", "Criadas"], ["editou", "Editadas"], ["eliminou", "Eliminadas"]].map(([k, l]) =>
            <button key={k} className={filtro === k ? "on" : ""} onClick={() => setFiltro(k)}>{l}</button>)}
        </div>
        <button className="btn btn-ghost" onClick={() => fin.limparAtividade()}><Icon name="trash" size={14} /> Limpar</button>
      </div>
      {grupos.length === 0 && <div className="card card-pad muted tiny" style={{ fontWeight: 600 }}>Sem registos para este filtro.</div>}
      {grupos.map(([dia, lista]) => (
        <div className="card" key={dia} style={{ marginBottom: 14 }}>
          <div className="card-pad" style={{ borderBottom: "1px solid var(--border)", fontWeight: 800, fontSize: 12.5, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--ink-3)" }}>{dia}</div>
          {lista.map((a, i) => (
            <div className="row" key={a.id} style={{ gap: 12, padding: "11px 16px", borderBottom: i < lista.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 7, color: "#fff", background: cor[a.acao] || "var(--ink-3)", flex: "none" }}>{rotuloAcao[a.acao] || a.acao}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.rotulo || "—"}</div>
                <div className="tiny muted" style={{ fontWeight: 600 }}>{a.tipo} · {_fmtHoraAtiv(a.ts)}</div>
              </div>
              {a.valor != null && <div className="tnum" style={{ fontWeight: 700, flex: "none" }}>{BM.eur(a.valor)}</div>}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

function Historico() {
  const fin = useFinance();
  const [q, setQ] = React.useState("");
  const [vista, setVista] = React.useState("atividade");
  const seg = (
    <div className="seg" style={{ marginBottom: 14, width: "fit-content" }}>
      <button className={vista === "atividade" ? "on" : ""} onClick={() => setVista("atividade")}>Atividade</button>
      <button className={vista === "mensal" ? "on" : ""} onClick={() => setVista("mensal")}>Resumo mensal</button>
    </div>
  );
  if (vista === "atividade") return <div className="content">{seg}<AtividadeLista /></div>;
  if (fin.historico.length === 0) {
    return <div className="content">{seg}<EmptyState icon="history" title="Sem histórico ainda"
      msg="O teu resumo mensal aparece aqui automaticamente à medida que vais registando rendimentos e despesas." /></div>;
  }
  const hist = fin.historico.filter((h) => h.label.toLowerCase().includes(q.toLowerCase()));
  const trend = fin.series.map((m) => m.rec - m.gasto);
  return (
    <div className="content">
      {seg}
      <div className="card">
        <div className="card-pad row" style={{ justifyContent: "space-between", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 12 }}>
          <div className="row" style={{ flex: 1, minWidth: 220, gap: 10, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "9px 13px" }}>
            <Icon name="search" size={17} color="var(--ink-3)" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar por mês…" style={{ border: "none", background: "transparent", outline: "none", color: "var(--ink)", fontSize: 14, fontWeight: 600, fontFamily: "inherit", width: "100%" }} />
          </div>
          <span className="muted tiny" style={{ fontWeight: 700 }}>{fin.historico.length} {fin.historico.length === 1 ? "mês" : "meses"} com registos</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="t">
            <thead><tr><th>Período</th><th style={{ textAlign: "right" }}>Recebido</th><th style={{ textAlign: "right" }}>Gasto</th><th style={{ textAlign: "right" }}>Saldo</th><th>Tendência</th></tr></thead>
            <tbody>
              {hist.map((h) => {
                const saldo = h.rec - h.gasto;
                return (
                  <tr key={h.key}>
                    <td><span className="row" style={{ gap: 9, fontWeight: 700 }}><Icon name="cal" size={16} color="var(--ink-3)" />{h.label}{h.atual && <span className="chip sel" style={{ padding: "2px 8px" }}>Atual</span>}</span></td>
                    <td className="tnum" style={{ textAlign: "right", color: "var(--accent)", fontWeight: 700 }}>+{BM.eur0(h.rec)}</td>
                    <td className="tnum" style={{ textAlign: "right", color: "var(--neg)", fontWeight: 700 }}>−{BM.eur0(h.gasto)}</td>
                    <td className="tnum" style={{ textAlign: "right", fontWeight: 700, color: saldo < 0 ? "var(--neg)" : "var(--ink)" }}>{BM.eur0(saldo)}</td>
                    <td><Sparkline data={trend.length > 1 ? trend : [0, saldo]} w={80} h={26} color={saldo < 0 ? "var(--neg)" : "var(--accent)"} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- PERFIL ---------- */
function Perfil({ open }) {
  const fin = useFinance();
  const a = fin.account || {};
  const metas = fin.data.metas || [];
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [pinClear, setPinClear] = React.useState(false);
  const stats = [
    { ico: "coins", v: a.moeda || "EUR", l: "Moeda", bg: "var(--accent-soft)", c: "var(--accent)" },
    { ico: "spark", v: BM.eur0(fin.poupado || 0), l: "Poupado", bg: "color-mix(in srgb, var(--c-educacao) 16%, transparent)", c: "var(--c-educacao)" },
    { ico: "flag", v: metas.length, l: metas.length === 1 ? "Meta" : "Metas", bg: "color-mix(in srgb, var(--c-habitacao) 16%, transparent)", c: "var(--c-habitacao)" },
  ];
  const Rowi = ({ label, sub, children, last }) => (
    <div className="row" style={{ justifyContent: "space-between", paddingBottom: last ? 0 : 14, borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <div><div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>{sub && <div className="tiny muted" style={{ marginTop: 2, fontWeight: 600 }}>{sub}</div>}</div>
      {children}
    </div>
  );
  return (
    <div className="content" style={{ maxWidth: 760 }}>
      <div className="card card-pad">
        <div className="row" style={{ gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <Avatar account={a} size={64} fontSize={22} />
          <div style={{ minWidth: 0, flex: "1 1 160px" }}>
            <div style={{ fontWeight: 700, fontSize: 19, letterSpacing: "-.01em" }}>{a.nome || "—"}</div>
            <div className="muted" style={{ fontWeight: 600, fontSize: 13, marginTop: 3, wordBreak: "break-word" }}>{[a.idade && `${a.idade} anos`, a.cidade, a.email].filter(Boolean).join(" · ") || "Sem dados"}</div>
          </div>
          <button className="btn btn-ghost" onClick={() => open("perfil")}><Icon name="edit" size={15} /> Editar</button>
        </div>
        {[a.perfil, a.estado, a.habitacao].filter(Boolean).length > 0 && (
          <div className="row" style={{ gap: 7, marginTop: 14, flexWrap: "wrap" }}>
            {[a.perfil, a.estado, a.habitacao].filter(Boolean).map((c) => <span className="chip" key={c}>{c}</span>)}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginTop: 16 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "12px 14px" }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", flex: "none", background: s.bg }}><Icon name={s.ico} size={16} color={s.c} /></span>
              <div style={{ minWidth: 0 }}><div className="tnum" style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-.01em" }}>{s.v}</div><div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600, marginTop: 1 }}>{s.l}</div></div>
            </div>
          ))}
        </div>
      </div>

      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="li-ico" style={{ width: 30, height: 30, background: "var(--accent-soft)", flex: "none" }}><Icon name="bank" size={16} color="var(--accent)" /></span>
          Conta
        </div>
        <Rowi label="Apagar todos os dados" sub="Remove despesas, rendimentos e metas (a conta mantém-se)">
          <button className="btn btn-ghost" style={{ color: "var(--neg)", borderColor: "color-mix(in srgb, var(--neg) 35%, transparent)" }}
            onClick={() => setConfirmClear(true)}>
            <Icon name="trash" size={15} /> Limpar dados
          </button>
        </Rowi>
        <Rowi label="Terminar sessão" sub="Voltar ao ecrã de início de sessão" last>
          <button className="btn btn-ghost" onClick={fin.logout}><Icon name="logout" size={15} /> Sair</button>
        </Rowi>
      </div>

      {confirmClear && (
        <div className="modal-bg" onClick={() => setConfirmClear(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "30px 26px", textAlign: "center" }}>
              <div style={{ width: 66, height: 66, borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 18px", background: "color-mix(in srgb, var(--neg) 13%, transparent)" }}>
                <Icon name="trash" size={28} color="var(--neg)" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 19, letterSpacing: "-.01em" }}>Limpar todos os dados?</div>
              <div className="muted" style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.6, marginTop: 9 }}>
                Vais remover todas as despesas, rendimentos e metas. A tua conta mantém-se, mas <strong style={{ color: "var(--ink)" }}>esta ação não pode ser revertida</strong>.
              </div>
              <div className="row" style={{ gap: 10, marginTop: 24 }}>
                <button className="btn btn-soft" style={{ flex: 1, justifyContent: "center" }} onClick={() => setConfirmClear(false)}>Cancelar</button>
                <button className="btn" style={{ flex: 1, justifyContent: "center", background: "var(--neg)", color: "#fff", border: "none" }}
                  onClick={() => { setConfirmClear(false); if (window.RendeLock && window.RendeLock.hasPin()) setPinClear(true); else fin.resetData(); }}>
                  <Icon name="trash" size={15} color="#fff" /> Limpar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {pinClear && <RLConfirmPin title="Limpar todos os dados" desc="Esta ação remove todas as despesas, rendimentos e metas e não pode ser revertida." onConfirm={() => fin.resetData()} onClose={() => setPinClear(false)} />}
    </div>
  );
}

/* ---------- DEFINIÇÕES ---------- */
function Definicoes({ theme, setTheme, open }) {
  const fin = useFinance();
  const a = fin.account || {};
  const [notif, setNotif] = React.useState(true);
  const [alertas, setAlertas] = React.useState(true);
  const [pinModal, setPinModal] = React.useState(false);
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => window.RendeLock.subscribe(force), []);
  const hasPin = window.RendeLock.hasPin();
  const lockMin = window.RendeLock.getMinutes();

  const Section = ({ title, icon, children }) => (
    <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {icon && <span className="li-ico" style={{ width: 30, height: 30, background: "var(--accent-soft)", flex: "none" }}><Icon name={icon} size={16} color="var(--accent)" /></span>}
        {title}
      </div>{children}
    </div>
  );
  const Toggle = ({ on, onClick }) => (
    <button onClick={onClick} style={{ width: 46, height: 26, borderRadius: 99, border: "none", padding: 3, background: on ? "var(--accent)" : "var(--border-strong)", display: "flex", justifyContent: on ? "flex-end" : "flex-start", transition: "background .15s" }}>
      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", display: "block", boxShadow: "0 1px 3px rgba(0,0,0,.3)" }} />
    </button>
  );
  const Rowi = ({ label, sub, children, last }) => (
    <div className="row" style={{ justifyContent: "space-between", paddingBottom: last ? 0 : 14, borderBottom: last ? "none" : "1px solid var(--border)" }}>
      <div><div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>{sub && <div className="tiny muted" style={{ marginTop: 2, fontWeight: 600 }}>{sub}</div>}</div>
      {children}
    </div>
  );

  return (
    <div className="content" style={{ maxWidth: 760 }}>
      <Section title="Preferências" icon="gear">
        <Rowi label="Modo escuro" sub="Reduz o brilho em ambientes com pouca luz">
          <Toggle on={theme === "dark"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} />
        </Rowi>
        <Rowi label="Orçamento mensal" sub={fin.data.orcamento ? `Limite atual: ${BM.eur0(fin.data.orcamento)}` : "Ainda não definido"}>
          <button className="btn btn-ghost" onClick={() => open("orcamento")}><Icon name="edit" size={14} /> Definir</button>
        </Rowi>
        <Rowi label="Notificações" sub="Resumos semanais por email"><Toggle on={notif} onClick={() => setNotif(!notif)} /></Rowi>
        <Rowi label="Alertas inteligentes" sub="Avisos de orçamento e poupança" last><Toggle on={alertas} onClick={() => setAlertas(!alertas)} /></Rowi>
      </Section>

      <Section title="Segurança" icon="shield">
        <Rowi label="PIN de bloqueio" sub={hasPin ? "Definido — a app bloqueia por inatividade" : "Sem PIN — a app não bloqueia"}>
          {hasPin
            ? <button className="btn btn-ghost" style={{ color: "var(--neg)" }} onClick={() => window.RendeLock.removePin()}><Icon name="trash" size={14} /> Remover</button>
            : <button className="btn btn-primary" onClick={() => setPinModal(true)}><Icon name="lock" size={14} color="#fff" /> Definir PIN</button>}
        </Rowi>
        {hasPin && <>
          <Rowi label="Bloquear após inatividade" sub="Tempo sem usar até a app pedir o PIN">
            <select className="select" style={{ width: "auto" }} value={lockMin} onChange={(e) => window.RendeLock.setMinutes(Number(e.target.value))}>
              {[1, 5, 15, 30, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </Rowi>
          <Rowi label="Bloquear agora" sub="Termina já o acesso até voltares a introduzir o PIN" last>
            <button className="btn btn-ghost" onClick={() => window.RendeLock.lockNow()}><Icon name="lock" size={14} /> Bloquear</button>
          </Rowi>
        </>}
      </Section>

      <Section title="Categorias de despesa" icon="grid">
        <Rowi label="Categorias personalizadas" sub={(fin.data.customCats || []).length ? `${fin.data.customCats.length} categoria(s) criada(s)` : "Cria categorias próprias ao registar uma despesa"} last={!(fin.data.customCats || []).length}>
          <button className="btn btn-ghost" onClick={() => open("despesa")}><Icon name="plus" size={14} /> Adicionar</button>
        </Rowi>
        {(fin.data.customCats || []).length > 0 && (
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {fin.data.customCats.map((c) => (
              <span key={c.key} className="chip" style={{ gap: 7 }}>
                <span className="dot" style={{ background: c.color }} />{c.nome}
                <button onClick={() => fin.removeCategory(c.key)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "grid", color: "var(--ink-3)" }}><span style={{ transform: "rotate(45deg)", display: "grid" }}><Icon name="plus" size={13} color="var(--ink-3)" /></span></button>
              </span>
            ))}
          </div>
        )}
      </Section>

      {pinModal && <RLPinSetup onClose={() => setPinModal(false)} />}
    </div>
  );
}

Object.assign(window, { Perfil, Poupanca, Relatorios, Historico, Definicoes });
/* ===== Screens (parte 1): Auth, Dashboard, Despesas, Rendimentos ===== */

/* ---------- força da palavra-passe ---------- */
function pwChecks(p) {
  p = p || "";
  return { len: p.length >= 8, upper: /[A-Z]/.test(p), lower: /[a-z]/.test(p), num: /[0-9]/.test(p), special: /[^A-Za-z0-9]/.test(p) };
}
function pwScore(p) { return Object.values(pwChecks(p)).filter(Boolean).length; }
function pwStrong(p) { return pwScore(p) === 5; }

/* input de palavra-passe com botão de mostrar/ocultar (olho) */
function PwInput({ value, onChange, placeholder, show, toggle, autoComplete, disabled }) {
  const tr = useT();
  return (
    <div style={{ position: "relative", opacity: disabled ? 0.5 : 1 }}>
      <input className="input" type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} disabled={disabled} style={{ paddingRight: 44 }} />
      <button type="button" onClick={toggle} tabIndex={-1} disabled={disabled} aria-label={show ? tr("pw_hide") : tr("pw_show")}
        style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 7, display: "grid", placeItems: "center", color: "var(--ink-3)", borderRadius: 8 }}>
        <Icon name={show ? "eyeOff" : "eye"} size={18} />
      </button>
    </div>
  );
}

/* medidor de força: barras + critérios (fraca → forte) */
function Strength({ value }) {
  const tr = useT();
  if (!value) return null;
  const c = pwChecks(value), s = pwScore(value);
  const level = s <= 2 ? 0 : s <= 4 ? 1 : 2;
  const meta = [{ t: tr("pw_weak"), col: "var(--neg)" }, { t: tr("pw_medium"), col: "var(--c-transporte)" }, { t: tr("pw_strong"), col: "var(--accent)" }][level];
  const reqs = [["len", tr("pw_len")], ["upper", tr("pw_upper")], ["lower", tr("pw_lower")], ["num", tr("pw_num")], ["special", tr("pw_special")]];
  return (
    <div style={{ marginTop: -4, marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 7 }}>
        {[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i < s ? meta.col : "var(--border)", transition: "background .2s" }} />)}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: meta.col, marginBottom: 6 }}>{tr("pw_strength")}: {meta.t}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
        {reqs.map(([k, lbl]) => (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: c[k] ? "var(--accent)" : "var(--ink-3)" }}>
            <Icon name={c[k] ? "check" : "dots"} size={12} color={c[k] ? "var(--accent)" : "var(--ink-3)"} /> {lbl}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- AUTH: criar conta / iniciar sessão ---------- */
function Auth({ initialMode, onBack }) {
  const fin = useFinance();
  const tr = useT();
  // ---- gate de upgrade (esta é a versão Premium) ----
  const accountExists = (email) => { try { return !!(JSON.parse(localStorage.getItem("rende_users") || "{}"))[(email || "").trim().toLowerCase()]; } catch { return false; } };
  const isUpgraded = (email) => { try { return JSON.parse(localStorage.getItem("rende_upgraded") || "[]").includes((email || "").trim().toLowerCase()); } catch { return false; } };
  const markUpgraded = (email) => { try { const a = JSON.parse(localStorage.getItem("rende_upgraded") || "[]"); const e = (email || "").trim().toLowerCase(); if (e && !a.includes(e)) { a.push(e); localStorage.setItem("rende_upgraded", JSON.stringify(a)); } } catch {} };
  const [mode, setMode] = React.useState(initialMode === "signup" ? "upgrade" : (initialMode || "login"));
  const [f, setF] = React.useState(() => { const pais = BM.detectCountry(); return { nome: "", email: "", password: "", password2: "", code: "", idade: "", cidade: "", pais, perfil: "Estudante", estado: "Solteiro(a)", habitacao: "Vive com colegas", moeda: BM.currencyForCountry(pais) }; });
  const [cidadeOutra, setCidadeOutra] = React.useState(false);
  const setCountry = (code) => { setCidadeOutra(false); setF((s) => ({ ...s, pais: code, cidade: "", moeda: BM.currencyForCountry(code) })); };
  const [err, setErr] = React.useState("");
  const [okMsg, setOkMsg] = React.useState("");
  const [sentCode, setSentCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);
  const [showPw2, setShowPw2] = React.useState(false);
  const [slideDir, setSlideDir] = React.useState("right");
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  // criar conta entra pela esquerda; iniciar sessão entra pela direita (transição suave)
  const goMode = (m) => { setErr(""); setOkMsg(""); setSlideDir(m === "upgrade" ? "left" : "right"); setMode(m); };

  const novo = !!f.email.trim() && !accountExists(f.email);
  const doUpgrade = async () => {
    if (!f.email.trim()) { setErr("Indica o teu email."); return; }
    if (!f.password) { setErr("Indica a palavra-passe."); return; }
    if (novo) {
      if (!f.nome.trim()) { setErr("Indica o teu nome para criarmos o acesso."); return; }
      if (!pwStrong(f.password)) { setErr("Usa uma palavra-passe mais forte (8+ caracteres e com números)."); return; }
      if (f.password !== f.password2) { setErr("As palavras-passe não coincidem."); return; }
    }
    setErr("");
    try {
      if (novo) { await fin.signup({ nome: f.nome, email: f.email, password: f.password, idade: f.idade, cidade: f.cidade, pais: f.pais, perfil: f.perfil, estado: f.estado, habitacao: f.habitacao, moeda: f.moeda }); markUpgraded(f.email); }
      else { await fin.login(f.email, f.password); markUpgraded(f.email); }
    } catch (e) { setErr(e.message || "Não foi possível concluir o upgrade."); }
  };
  const doLogin = async () => {
    if (!f.email.trim() || !f.password) { setErr("Preenche o email e a palavra-passe."); return; }
    setErr("");
    if (!isUpgraded(f.email)) {
      setSlideDir("left"); setMode("upgrade");
      setOkMsg("Esta conta ainda não tem o Premium ativo. Conclui o upgrade aqui em baixo para entrares.");
      return;
    }
    try { await fin.login(f.email, f.password); }
    catch (e) { setErr(e.message || "Não foi possível entrar. Confirma os teus dados."); }
  };
  const doForgot = () => {
    if (!f.email.trim()) return setErr(tr("auth_err_email"));
    if (!fin.emailExists(f.email)) return setErr(tr("auth_err_noaccount"));
    setSentCode(fin.genResetCode());
    setErr(""); setOkMsg(""); setMode("reset");
  };
  const doReset = () => {
    if (f.code.trim() !== sentCode) return setErr(tr("auth_err_code"));
    if (!pwStrong(f.password)) return setErr(tr("auth_err_weak2"));
    if (f.password !== f.password2) return setErr(tr("auth_err_mismatch"));
    fin.resetPassword(f.password);
    setF((s) => ({ ...s, password: "", password2: "", code: "" }));
    setErr(""); setOkMsg(tr("auth_ok_reset")); setMode("login");
  };
  const primaryAction = mode === "upgrade" ? doUpgrade : mode === "login" ? doLogin : mode === "forgot" ? doForgot : doReset;
  const titles = {
    login: ["Entrar", "Usa os mesmos dados da tua conta Rende+. O acesso é para quem já fez o upgrade para Premium."],
    upgrade: [novo ? "Criar o teu acesso Premium" : "Fazer upgrade para Premium",
      novo ? "Ainda não tens conta? Criamos o teu acesso já com o Premium ativo." : "Entra com os teus dados do Rende+ e ativamos o Premium nesta conta."],
    forgot: ["Recuperar acesso", "Indica o teu email e enviamos um código para repores a palavra-passe."],
    reset: ["Nova palavra-passe", "Define uma nova palavra-passe para a tua conta."],
  };
  const primaryLabel = { login: "Entrar", upgrade: novo ? "Criar acesso Premium" : "Ativar Premium e entrar", forgot: "Enviar código", reset: "Guardar palavra-passe" }[mode];
  const loadingLabel = { login: "A entrar...", upgrade: novo ? "A criar..." : "A ativar...", forgot: "A enviar...", reset: "A guardar..." }[mode];
  const runPrimary = async () => {
    if (busy) return;
    setBusy(true);
    try { await primaryAction(); }
    finally { setBusy(false); }
  };

  return (
    <div className="login-wrap">
      <div className="login-hero">
        <Brand nameColor="#fff" onClick={onBack} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 470, position: "relative", zIndex: 1 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start", padding: "6px 13px", borderRadius: 999, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.16)", fontSize: 12.5, fontWeight: 700, marginBottom: 22 }}>
            <Icon name="spark" size={14} color="var(--accent)" /> {tr("hero_eyebrow")}
          </span>
          <h2 style={{ fontSize: 40, lineHeight: 1.07, fontWeight: 700, letterSpacing: "-.035em", margin: "0 0 16px", textWrap: "balance" }}>
            {tr("hero_h1_a")}<span style={{ color: "var(--accent)" }}>{tr("hero_h1_b")}</span>
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, opacity: .82, fontWeight: 500, margin: "0 0 28px", maxWidth: "33em" }}>
            {tr("auth_hero_sub")}
          </p>
          <div style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.13)", borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 13 }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, opacity: .6 }}>{tr("prev_balance")}</div>
                <div className="tnum" style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-.03em", marginTop: 3 }}>{BM.eur0(1525)}</div>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 700, color: "var(--accent)" }}><Icon name="arrowUp" size={13} color="var(--accent)" /> +12%</span>
            </div>
            <div className="bar" style={{ background: "rgba(255,255,255,.12)" }}><i style={{ width: "67%", background: "var(--accent)" }} /></div>
            <div className="row" style={{ gap: 18 }}>
              <span className="row" style={{ gap: 7, fontSize: 12.5, fontWeight: 600, opacity: .85 }}><span className="dot" style={{ background: "var(--accent)" }} /> {tr("legend_received")} {BM.eur0(960)}</span>
              <span className="row" style={{ gap: 7, fontSize: 12.5, fontWeight: 600, opacity: .85 }}><span className="dot" style={{ background: "var(--c-transporte)" }} /> {tr("legend_spent")} {BM.eur0(643)}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 24 }}>
            {[["wallet", tr("auth_feat1")], ["target", tr("auth_feat2")], ["coins", tr("auth_feat3").split("{n}").join(Object.keys(BM.currencies).length)]].map(([ic, t]) => (
              <div key={t} className="row" style={{ gap: 12 }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,.1)", display: "grid", placeItems: "center", flex: "none" }}><Icon name={ic} size={16} color="var(--accent)" /></span>
                <span style={{ fontSize: 14, fontWeight: 600, opacity: .9 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, fontWeight: 600, opacity: .72, marginTop: 8 }}>
          <Icon name="check" size={15} color="var(--accent)" /> {tr("auth_hero_trust")}
        </div>
      </div>

      <div className="login-form">
        <div className="login-card">
          <div className="login-form-brand"><Brand /></div>
          {onBack && <button onClick={onBack} className="login-back" style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", color: "var(--ink-2)", fontWeight: 700, font: "inherit", fontSize: 12.5, cursor: "pointer", padding: "7px 12px", borderRadius: "var(--radius-pill)", marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 6 }}>{tr("auth_back_home")}</button>}
          <div className={"auth-body auth-in-" + slideDir} key={mode}>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", margin: "0 0 6px" }}>{titles[mode][0]}</h2>
          <p className="muted" style={{ margin: "0 0 24px", fontSize: 14, fontWeight: 500 }}>{titles[mode][1]}</p>

          {okMsg && <div className="alert ok" style={{ marginBottom: 16, padding: "10px 12px" }}><Icon name="check" size={16} color="var(--accent)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{okMsg}</span></div>}

          {mode === "upgrade" && novo && (
            <>
              <Field label={tr("auth_name")}><input className="input" value={f.nome} onChange={set("nome")} placeholder={tr("auth_name_ph")} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label={tr("auth_country")}>
                  <select className="select" value={f.pais} onChange={(e) => setCountry(e.target.value)}>
                    {BM.countries.map((c) => <option key={c.code} value={c.code}>{tr("country_" + c.code)}</option>)}
                  </select>
                </Field>
                <Field label={tr("auth_age")}><input className="input" type="number" value={f.idade} onChange={set("idade")} placeholder="21" /></Field>
              </div>
              <Field label={tr("auth_city")}>
                <select className="select" value={cidadeOutra ? "__other__" : f.cidade}
                  onChange={(e) => { if (e.target.value === "__other__") { setCidadeOutra(true); setF((s) => ({ ...s, cidade: "" })); } else { setCidadeOutra(false); setF((s) => ({ ...s, cidade: e.target.value })); } }}>
                  <option value="" disabled>{tr("auth_select_city")}</option>
                  {BM.countryCities(f.pais).map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="__other__">{tr("auth_other_city")}</option>
                </select>
                {cidadeOutra && <input className="input" style={{ marginTop: 8 }} value={f.cidade} onChange={set("cidade")} placeholder={tr("auth_other_city_ph")} />}
              </Field>
              <Field label={tr("auth_situation")}><select className="select" value={f.perfil} onChange={set("perfil")}>{[["Estudante", tr("auth_opt_student")], ["Trabalhador", tr("auth_opt_worker")], ["Estudante e Trabalhador", tr("auth_opt_both")]].map(([v, lbl]) => <option key={v} value={v}>{lbl}</option>)}</select></Field>
              <Field label={tr("auth_currency")} hint={tr("auth_currency_hint")}>
                <select className="select" value={f.moeda} onChange={set("moeda")}>
                  {Object.values(BM.currencies).map((c) => <option key={c.code} value={c.code}>{c.sym} ({c.code})</option>)}
                </select>
              </Field>
            </>
          )}

          {(mode === "upgrade" || mode === "login" || mode === "forgot") && (
            <Field label={tr("email")}><input className="input" value={f.email} onChange={set("email")} placeholder={tr("auth_email_ph")} /></Field>
          )}

          {(mode === "upgrade" || mode === "login") && (
            <Field label={tr("auth_password")}><PwInput value={f.password} onChange={set("password")} placeholder="••••••••" show={showPw} toggle={() => setShowPw((v) => !v)} autoComplete={mode === "login" ? "current-password" : "new-password"} disabled={!f.email.trim()} /></Field>
          )}
          {mode === "upgrade" && novo && <Strength value={f.password} />}
          {mode === "upgrade" && novo && (
            <Field label={tr("auth_confirm_password")}><PwInput value={f.password2} onChange={set("password2")} placeholder="••••••••" show={showPw2} toggle={() => setShowPw2((v) => !v)} autoComplete="new-password" disabled={!pwStrong(f.password)} /></Field>
          )}

          {mode === "login" && (
            <div style={{ textAlign: "right", marginTop: -6, marginBottom: 8 }}>
              <button onClick={() => goMode("forgot")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", fontSize: 12.5, cursor: "pointer", padding: 0 }}>{tr("auth_forgot_link")}</button>
            </div>
          )}

          {mode === "reset" && (
            <>
              <div className="alert ok" style={{ marginBottom: 14, padding: "10px 12px" }}>
                <Icon name="info" size={16} color="var(--accent)" />
                <span style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.5 }}>{tr("auth_reset_code_demo")} <span className="tnum" style={{ letterSpacing: ".12em", fontSize: 14 }}>{sentCode}</span></span>
              </div>
              <Field label={tr("auth_reset_code_label")}><input className="input tnum" value={f.code} onChange={set("code")} placeholder="123456" inputMode="numeric" maxLength={6} /></Field>
              <Field label={tr("auth_new_password")}><PwInput value={f.password} onChange={set("password")} placeholder="••••••••" show={showPw} toggle={() => setShowPw((v) => !v)} autoComplete="new-password" /></Field>
              <Strength value={f.password} />
              <Field label={tr("auth_confirm_password")}><PwInput value={f.password2} onChange={set("password2")} placeholder="••••••••" show={showPw2} toggle={() => setShowPw2((v) => !v)} autoComplete="new-password" /></Field>
            </>
          )}

          {err && <div className="alert bad" style={{ marginBottom: 12, padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}

          <style>{`@keyframes rmaisSpin{to{transform:rotate(360deg)}}`}</style>
          <button className="btn btn-primary" disabled={busy} style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: 15, marginTop: 4, opacity: busy ? 0.8 : 1, cursor: busy ? "wait" : "pointer" }} onClick={runPrimary}>
            {busy && <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,.45)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", marginRight: 8, animation: "rmaisSpin .6s linear infinite", verticalAlign: "-2px" }} />}
            {busy ? loadingLabel : primaryLabel}
          </button>

          <p className="muted tiny" style={{ textAlign: "center", marginTop: 18, fontWeight: 600 }}>
            {mode === "upgrade" && <>Já fizeste o upgrade? <button onClick={() => goMode("login")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", cursor: "pointer", padding: 0 }}>Entrar</button></>}
            {mode === "login" && <>Ainda não tens Premium? <button onClick={() => goMode("upgrade")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", cursor: "pointer", padding: 0 }}>Fazer upgrade</button></>}
            {(mode === "forgot" || mode === "reset") && <button onClick={() => goMode("login")} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, font: "inherit", cursor: "pointer", padding: 0 }}>Voltar a entrar</button>}
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- DASHBOARD ---------- */
function KpiDetalheModal({ tipo, fin, onClose }) {
  const isGasto = tipo === "gasto";
  const data = (isGasto ? fin.catBreak : fin.incBreak) || [];
  const total = isGasto ? fin.totalGasto : fin.totalRec;
  const titulo = isGasto ? "Total gasto" : "Total recebido";
  const movimentos = (isGasto ? fin.despMes : fin.rendMes || []).length;
  const top = data[0];
  return (
    <Modal title={titulo} sub={fin.monthLabel} onClose={onClose}
      footer={<button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={onClose}>Fechar</button>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="kpidet-chart">
          <DonutChart data={data} size={184} thickness={28}
            center={<div style={{ textAlign: "center" }}><div className="tnum" style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-.02em" }}>{BM.eur0(total)}</div><div className="tiny muted" style={{ fontWeight: 600 }}>{isGasto ? "gasto" : "recebido"}</div></div>} />
        </div>
        {top && <div className="kpidet-hi">{isGasto ? "Onde gastas mais" : "De onde vem mais"}: <b>{top.nome}</b> · {Math.round((top.valor / (total || 1)) * 100)}%</div>}
        <div>
          {data.length === 0 ? <div className="muted tiny" style={{ textAlign: "center", fontWeight: 600 }}>Sem movimentos este mês.</div> :
            data.map((c) => {
              const pct = total > 0 ? Math.round((c.valor / total) * 100) : 0;
              return (
                <div className="prem-balrow" key={c.key}>
                  <span className="dot" style={{ background: c.color, width: 11, height: 11 }} />
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 13.5 }}>{c.nome}</span>
                  <span className="muted tiny" style={{ fontWeight: 700, marginRight: 12 }}>{pct}%</span>
                  <span className="tnum" style={{ fontWeight: 700 }}>{BM.eur0(c.valor)}</span>
                </div>
              );
            })}
        </div>
        <div className="muted tiny" style={{ textAlign: "center", fontWeight: 600 }}>{movimentos} movimento{movimentos === 1 ? "" : "s"} registado{movimentos === 1 ? "" : "s"} este mês</div>
      </div>
    </Modal>
  );
}

function Dashboard({ go, open }) {
  const fin = useFinance();
  const tr = useT();
  const [detalhe, setDetalhe] = React.useState(null);
  const primeiroNome = ((((fin.account && fin.account.nome) || "").trim().split(/\s+/)[0]) || "");
  const tt = (k, v) => { let s = tr(k); if (v) Object.keys(v).forEach((kk) => { s = s.split("{" + kk + "}").join(v[kk]); }); return s; };
  const tcat = (key) => {
    if (BM.cats[key]) { const kk = "cat_" + key, vv = tr(kk); return vv === kk ? BM.cats[key].nome : vv; }
    const cc = (fin.data.customCats || []).find((c) => c.key === key);
    return cc ? cc.nome : tr("cat_outros");
  };
  const hasData = fin.despMes.length > 0 || fin.rendMes.length > 0;
  const orc = fin.data.orcamento;
  const pctGasto = orc ? Math.round((fin.totalGasto / orc) * 100) : null;
  const recent = [
    ...fin.despMes.map((d) => ({ ...d, _rec: false })),
    ...fin.rendMes.map((d) => ({ ...d, _rec: true })),
  ].sort((a, b) => (b.data || "").localeCompare(a.data || "")).slice(0, 5);
  const S = fin.series || [];
  const _cur = S[S.length - 1] || {}, _prev = S[S.length - 2] || {};
  const pctDelta = (a, b) => (b ? Math.round(((a - b) / Math.abs(b)) * 1000) / 10 : null);
  const dRec = pctDelta(_cur.rec, _prev.rec);
  const dGasto = pctDelta(_cur.gasto, _prev.gasto);
  const dSaldo = pctDelta((_cur.rec || 0) - (_cur.gasto || 0), (_prev.rec || 0) - (_prev.gasto || 0));
  const metasAll = fin.data.metas || [];
  const metasDone = metasAll.filter((m) => m.atual >= m.alvo).length;
  const metasPct = metasAll.length ? Math.round((metasDone / metasAll.length) * 100) : 0;
  const deltaTxt = (d) => (<>{Math.abs(d).toLocaleString("pt-PT")}% <span className="muted" style={{ fontWeight: 600 }}>vs. mês passado</span></>);
  const deltaSemBase = (<>— <span className="muted" style={{ fontWeight: 600 }}>vs. mês passado</span></>);
  const dProp = (d) => (d == null ? deltaSemBase : deltaTxt(d));
  const dDir = (d) => (d == null ? "flat" : (d < 0 ? "down" : "up"));
  const colorOfCat = (key) => (BM.cats[key] && BM.cats[key].color) || (((fin.data.customCats || []).find((c) => c.key === key) || {}).color) || "var(--c-outros)";
  const cats = (fin.catBreak || []).slice(0, 6);
  const catTotal = (fin.catBreak || []).reduce((s, c) => s + c.valor, 0) || 1;
  const donutData = cats.map((c) => ({ valor: c.valor, color: colorOfCat(c.key), nome: tcat(c.key) }));

  if (!hasData) {
    return (
      <div className="content">
        <EmptyState icon="bolt" title={tt("dash_empty_title", { nome: (fin.account?.nome || "").split(" ")[0] || "olá" })}
          msg={tt("dash_empty_msg", { month: fin.monthLabel })}
          action={
            <div className="row" style={{ gap: 10 }}>
              <button className="btn btn-primary" onClick={() => open("rendimento")}><Icon name="arrowsDown" size={16} color="#fff" /> {tr("add_income")}</button>
              <button className="btn btn-ghost" onClick={() => open("despesa")}><Icon name="wallet" size={16} /> {tr("add_expense")}</button>
            </div>
          } />
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          {[["arrowsDown", tr("dash_step1_t"), tr("dash_step1_d")],
            ["wallet", tr("dash_step2_t"), tr("dash_step2_d")],
            ["chart", tr("dash_step3_t"), tr("dash_step3_d")]].map(([ic, ti, d]) => (
            <div className="card card-pad" key={ti}>
              <div className="kpi-ico" style={{ background: "var(--accent-soft)", marginBottom: 12 }}><Icon name={ic} size={19} color="var(--accent)" /></div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{ti}</div>
              <div className="tiny muted" style={{ marginTop: 5, fontWeight: 600, lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="grid kpi4" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <Kpi label="Saldo atual" value={BM.eur(fin.saldo)} icon="wallet" color="var(--accent)" delta={dProp(dSaldo)} deltaDir={dDir(dSaldo)} />
        <Kpi label={tr("kpi_received")} value={BM.eur(fin.totalRec)} icon="coins" color="var(--pos)" delta={dProp(dRec)} deltaDir={dDir(dRec)} onClick={() => setDetalhe("rec")} />
        <Kpi label={tr("kpi_spent")} value={BM.eur(fin.totalGasto)} icon="cart" color="var(--neg)" delta={dProp(dGasto)} deltaDir={dDir(dGasto)} onClick={() => setDetalhe("gasto")} />
        <Kpi label="Poupança do mês" value={BM.eur(fin.poupado)} icon="trend" color="var(--c-educacao)" delta={dProp(dSaldo)} deltaDir={dDir(dSaldo)} />
      </div>
      {detalhe && <KpiDetalheModal tipo={detalhe === "gasto" ? "gasto" : "rec"} fin={fin} onClose={() => setDetalhe(null)} />}

      <div className="grid dash-mid" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
        <div className="card card-pad">
          <div className="section-head" style={{ marginBottom: 14 }}>
            <div className="section-title">{tr("dash_evolution")}</div>
            <div className="row tiny" style={{ fontWeight: 700 }}>
              <span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: "var(--accent)" }} /> {tr("legend_received")}</span>
              <span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: "var(--neg)" }} /> {tr("legend_spent")}</span>
            </div>
          </div>
          <LineChart data={fin.series} height={232} />
        </div>

        <div className="card card-pad">
          <div className="section-head" style={{ marginBottom: 14 }}><div className="section-title">{tr("dash_by_category")}</div></div>
          {donutData.length === 0 ? (
            <div style={{ display: "grid", placeItems: "center", height: 200, textAlign: "center" }} className="muted tiny">
              <div><Icon name="cart" size={26} color="var(--ink-3)" /><div style={{ marginTop: 8, fontWeight: 600 }}>{tr("dash_no_expenses")}</div></div>
            </div>
          ) : (
            <div className="row" style={{ gap: 16, alignItems: "center" }}>
              <DonutChart data={donutData} size={154} thickness={24}
                center={<div><div className="tnum" style={{ fontWeight: 800, fontSize: 15.5 }}>{BM.eur0(fin.totalGasto)}</div><div className="tiny muted" style={{ fontWeight: 600 }}>Total</div></div>} />
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {cats.map((c) => (
                  <div className="row" key={c.key} style={{ gap: 9, fontSize: 12.5 }}>
                    <span className="dot" style={{ background: colorOfCat(c.key) }} />
                    <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>{tcat(c.key)}</span>
                    <span className="tnum" style={{ marginLeft: "auto", fontWeight: 700 }}>{BM.eur0(c.valor)}</span>
                    <span className="muted" style={{ fontWeight: 700, width: 30, textAlign: "right", fontSize: 12 }}>{Math.round((c.valor / catTotal) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid dash-bot" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <div className="card card-pad">
          <div className="section-head" style={{ marginBottom: 6 }}>
            <div className="section-title">{tr("dash_recent")}</div>
            <button className="btn btn-soft" style={{ padding: "7px 12px" }} onClick={() => go("despesas")}>{tr("see_all")} <Icon name="chevR" size={14} /></button>
          </div>
          {recent.length === 0 ? <div className="muted tiny" style={{ padding: "24px 0", fontWeight: 600 }}>{tr("dash_no_expenses")}.</div> : (
            <div className="list">
              {recent.map((d) => (
                <div className="li" key={(d._rec ? "r" : "d") + d.id}>
                  {d._rec
                    ? <div className="li-ico" style={{ background: "color-mix(in srgb, var(--pos) 15%, transparent)" }}><Icon name="coins" size={19} color="var(--pos)" /></div>
                    : <CatBadge catKey={d.cat} />}
                  <div className="li-main">
                    <div className="li-title">{d.nome || d.fonte || tr("kpi_received")}</div>
                    <div className="li-sub">{d._rec ? tr("kpi_received") : tcat(d.cat)} · {BM.fmtData(d.data)}</div>
                  </div>
                  <div className="li-amt tnum" style={{ color: d._rec ? "var(--pos)" : "var(--neg)" }}>{d._rec ? "" : "−"}{BM.eur(d.valor)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad">
          <div className="section-head" style={{ marginBottom: 14 }}><div className="section-title">{tr("dash_budget")}</div>
            <button className="btn btn-soft" style={{ padding: "5px 10px" }} onClick={() => open("orcamento")}><Icon name="edit" size={13} /> {tr("define")}</button>
          </div>
          {orc ? (
            <>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 9 }}>
                <span><b className="tnum" style={{ fontSize: 17, fontWeight: 800 }}>{BM.eur0(fin.totalGasto)}</b> <span className="muted tiny" style={{ fontWeight: 600 }}>{tt("of_amount", { x: BM.eur0(orc) })}</span></span>
                <span className="tnum" style={{ fontWeight: 800 }}>{pctGasto}%</span>
              </div>
              <Progress value={fin.totalGasto} max={orc} color={pctGasto > 80 ? "var(--warn)" : "var(--accent)"} />
              <div style={{ marginTop: 14 }}>
                {cats.map((c) => (
                  <div className="row" key={c.key} style={{ gap: 12, padding: "11px 0", borderTop: "1px solid var(--border)" }}>
                    <CatBadge catKey={c.key} size={34} r={10} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{tcat(c.key)}</div>
                      <Progress value={c.valor} max={catTotal} color={colorOfCat(c.key)} />
                    </div>
                    <span className="muted tiny tnum" style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{BM.eur0(c.valor)}</span>
                    <span className="tnum tiny" style={{ fontWeight: 800, width: 40, textAlign: "right" }}>{Math.round((c.valor / catTotal) * 100)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="muted tiny" style={{ fontWeight: 600 }}>{tr("budget_empty")}</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- DESPESAS ---------- */
function Despesas({ open }) {
  const fin = useFinance();
  const tr = useT();
  const tt = (k, v) => tfmt(tr(k), v);
  const tcat = (key) => {
    if (BM.cats[key]) { const kk = "cat_" + key, vv = tr(kk); return vv === kk ? BM.cats[key].nome : vv; }
    const cc = (fin.data.customCats || []).find((c) => c.key === key);
    return cc ? cc.nome : tr("cat_outros");
  };
  const [tipo, setTipo] = React.useState("todas");
  const [cat, setCat] = React.useState("todas");
  const catKeys = Object.keys(BM.cats);
  let rows = fin.despMes.filter((d) => (tipo === "todas" || d.tipo === tipo) && (cat === "todas" || d.cat === cat));
  rows = [...rows].sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const total = rows.reduce((s, d) => s + (+d.valor || 0), 0);

  return (
    <div className="content">
      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Kpi label={tr("exp_total")} value={BM.eur0(fin.totalGasto)} icon="wallet" color="var(--c-transporte)" sub={tt(fin.despMes.length === 1 ? "exp_moves_one" : "exp_moves_many", { n: fin.despMes.length })} />
        <Kpi label={tr("exp_fixed")} value={BM.eur0(fin.fixas)} icon="home" color="var(--c-habitacao)" sub={tr("exp_fixed_sub")} />
        <Kpi label={tr("exp_variable")} value={BM.eur0(fin.variaveis)} icon="cart" color="var(--c-alimentacao)" sub={tr("exp_variable_sub")} />
      </div>

      {fin.despMes.length === 0 ? (
        <EmptyState icon="wallet" title={tr("exp_empty_t")}
          msg={tr("exp_empty_msg")}
          action={<button className="btn btn-primary" onClick={() => open("despesa")}><Icon name="plus" size={16} color="#fff" /> {tr("add_expense")}</button>} />
      ) : (
        <div className="card">
          <div className="card-pad" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderBottom: "1px solid var(--border)" }}>
            <div className="seg">
              {["todas", "fixa", "variavel"].map((t) => (
                <button key={t} className={tipo === t ? "on" : ""} onClick={() => setTipo(t)}>{t === "todas" ? tr("filter_all") : t === "fixa" ? tr("filter_fixed") : tr("filter_variable")}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginLeft: 4 }}>
              <button className={"chip" + (cat === "todas" ? " sel" : "")} onClick={() => setCat("todas")}>{tr("filter_all")}</button>
              {catKeys.filter((k) => fin.despMes.some((d) => d.cat === k)).map((k) => (
                <button key={k} className={"chip" + (cat === k ? " sel" : "")} onClick={() => setCat(k)}>
                  <span className="dot" style={{ background: cat === k ? "#fff" : BM.cats[k].color }} />{tcat(k)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="t">
              <thead><tr><th>{tr("th_expense")}</th><th>{tr("th_category")}</th><th>{tr("th_type")}</th><th>{tr("th_date")}</th><th style={{ textAlign: "right" }}>{tr("th_value")}</th><th></th></tr></thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td><div className="row" style={{ gap: 12 }}><CatBadge catKey={d.cat} size={36} r={10} /><span style={{ fontWeight: 700 }}>{d.nome}</span></div></td>
                    <td><span className="row" style={{ gap: 7, fontWeight: 600 }}><span className="dot" style={{ background: (BM.cats[d.cat] || BM.cats.outros).color }} />{tcat(d.cat)}</span></td>
                    <td><span className="chip" style={{ padding: "3px 9px" }}>{d.tipo === "fixa" ? tr("fixed") : tr("variable")}</span></td>
                    <td className="muted">{BM.fmtData(d.data)}</td>
                    <td className="tnum" style={{ textAlign: "right", fontWeight: 700, color: "var(--neg)" }}>−{BM.eur(d.valor)}</td>
                    <td><div className="row" style={{ gap: 4, justifyContent: "flex-end" }}>
                      <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => open("despesa", d)}><Icon name="edit" size={15} /></button>
                      <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => fin.despesa.remove(d.id)}><Icon name="trash" size={15} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-pad row" style={{ justifyContent: "space-between", borderTop: "1px solid var(--border)" }}>
            <span className="muted" style={{ fontWeight: 700, fontSize: 13 }}>{tt(rows.length === 1 ? "results_one" : "results_many", { n: rows.length })}</span>
            <span style={{ fontWeight: 700 }}>{tr("total_label")}: <span className="tnum">{BM.eur(total)}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- PLANO DE POUPANÇA (calculadora com slider 10–50%) ---------- */
function SavingsPlanner({ open }) {
  const fin = useFinance();
  const tr = useT();
  const tt = (k, v) => tfmt(tr(k), v);
  const pct = fin.poupancaPct;
  const receita = fin.totalRec;
  const despesas = fin.totalGasto;
  const restante = fin.saldo;
  const planoTotal = fin.poupancaPlano;
  const jaGuardado = fin.poupadoMes;
  const disponivel = fin.disponivel;
  const semSobra = restante <= 0;
  const falta = Math.max(0, Math.round((planoTotal - jaGuardado) * 100) / 100);

  const Linha = ({ label, valor, sinal, cor, forte, big }) => (
    <div className="row" style={{ justifyContent: "space-between", padding: forte ? "12px 0 0" : "7px 0", borderTop: forte ? "1px solid var(--border)" : "none" }}>
      <span style={{ fontSize: forte ? 14 : 13.5, fontWeight: forte ? 800 : 600, color: forte ? "var(--ink)" : "var(--ink-2)" }}>{label}</span>
      <span className="tnum" style={{ fontWeight: 700, fontSize: big ? 22 : forte ? 16 : 14.5, color: cor || "var(--ink)" }}>{sinal}{BM.eur(Math.abs(valor))}</span>
    </div>
  );

  return (
    <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="section-head" style={{ marginBottom: 6 }}>
        <div>
          <div className="section-title">{tr("sp_title")}</div>
          <div className="tiny muted" style={{ fontWeight: 600, marginTop: 2 }}>{tt("sp_sub", { month: fin.monthLabel })}</div>
        </div>
        <span className="li-ico" style={{ width: 40, height: 40, background: "var(--accent-soft)" }}><Icon name="target" size={19} color="var(--accent)" sw={2} /></span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 22, alignItems: "stretch" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Linha label={tr("sp_total_income")} valor={receita} sinal="+" cor="var(--accent)" />
          <Linha label={tr("exp_total")} valor={despesas} sinal="−" cor="var(--neg)" />
          <Linha label={tr("sp_remaining")} valor={restante} sinal={restante < 0 ? "−" : ""} cor={restante < 0 ? "var(--neg)" : "var(--ink)"} forte />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: 18 }}>
          {semSobra ? (
            <div className="muted" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.55, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Icon name="info" size={18} color="var(--warn)" />
              <span>{tr("sp_nosurplus")}</span>
            </div>
          ) : (
            <>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)" }}>{tr("sp_pct_label")}</span>
                <span className="tnum" style={{ fontSize: 26, fontWeight: 700, color: "var(--accent)" }}>{pct}%</span>
              </div>
              <input type="range" min="10" max="50" step="5" value={pct} onChange={(e) => fin.setPoupancaPct(+e.target.value)} className="range" />
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="tiny muted" style={{ fontWeight: 700 }}>10%</span>
                <span className="tiny muted" style={{ fontWeight: 700 }}>50%</span>
              </div>
              <Linha label={tt("sp_savings_line", { pct })} valor={planoTotal} sinal="−" cor="var(--c-educacao)" forte />
              {jaGuardado > 0 && <Linha label={tr("sp_saved_month")} valor={jaGuardado} sinal="✓ " cor="var(--accent)" />}
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginTop: 2, padding: "12px 14px", background: "var(--accent-soft)", borderRadius: "var(--radius-sm)" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{tr("sp_available")}</div>
                  <div className="tiny muted" style={{ fontWeight: 600 }}>{tr("sp_available_sub")}</div>
                </div>
                <span className="tnum" style={{ fontWeight: 700, fontSize: 24, color: "var(--accent-ink)" }}>{BM.eur(disponivel)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {!semSobra && (
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 8, gap: 10, alignItems: "center" }}>
          {falta > 0
            ? <button className="btn btn-primary" onClick={() => open("reservar", { amount: falta })}><Icon name="target" size={15} color="#fff" /> {tt("sp_save_btn", { x: BM.eur0(falta) })}</button>
            : <span className="row tiny" style={{ fontWeight: 700, color: "var(--accent)", gap: 6 }}><Icon name="check" size={15} color="var(--accent)" /> {tr("sp_already_saved")}</span>}
        </div>
      )}
    </div>
  );
}

/* ---------- RENDIMENTOS ---------- */
function Rendimentos({ open }) {
  const fin = useFinance();
  const tr = useT();
  const tt = (k, v) => tfmt(tr(k), v);
  const INC_KEY = { "Salário": "ic_salario", "Bolsa": "ic_bolsa", "Ajuda Familiar": "ic_ajuda", "Subsídios": "ic_subsidios", "Apoios do Estado": "ic_apoios", "Freelance": "ic_freelance", "Outros": "ic_outros" };
  const ticat = (label) => { const k = INC_KEY[label]; return k ? tr(k) : label; };
  const rec = fin.rendMes.filter((r) => r.rec).reduce((s, r) => s + (+r.valor || 0), 0);
  const extra = fin.totalRec - rec;
  const rows = [...fin.rendMes].sort((a, b) => (b.data || "").localeCompare(a.data || ""));

  return (
    <div className="content">
      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Kpi label={tr("inc_total")} value={BM.eur0(fin.totalRec)} icon="arrowsDown" color="var(--accent)" sub={tt(fin.rendMes.length === 1 ? "inc_source_one" : "inc_source_many", { n: fin.rendMes.length })} />
        <Kpi label={tr("inc_recurring")} value={BM.eur0(rec)} icon="cal" color="var(--c-habitacao)" sub={tr("inc_every_month")} />
        <Kpi label={tr("inc_extra")} value={BM.eur0(extra)} icon="spark" color="var(--c-educacao)" sub={tr("inc_extra_sub")} />
      </div>

      {fin.rendMes.length === 0 ? (
        <EmptyState icon="arrowsDown" title={tr("inc_empty_t")}
          msg={tr("inc_empty_msg")}
          action={<button className="btn btn-primary" onClick={() => open("rendimento")}><Icon name="plus" size={16} color="#fff" /> {tr("add_income")}</button>} />
      ) : (
        <>
        <SavingsPlanner open={open} />
        <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
          <div className="card card-pad">
            <div className="section-title" style={{ marginBottom: 6 }}>{tr("inc_this_month")}</div>
            <div className="list">
              {rows.map((r) => (
                <div className="li" key={r.id}>
                  <div className="li-ico" style={{ background: "var(--accent-soft)" }}><Icon name="arrowsDown" size={18} color="var(--accent)" sw={2} /></div>
                  <div className="li-main">
                    <div className="li-title">{r.fonte}</div>
                    <div className="li-sub">{ticat(r.cat)} · {BM.fmtData(r.data)} · {r.rec ? tr("inc_recurring_low") : tr("inc_oneoff")}</div>
                  </div>
                  <div className="li-amt tnum" style={{ color: "var(--accent)" }}>+{BM.eur(r.valor)}</div>
                  <div className="row" style={{ gap: 4 }}>
                    <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => open("rendimento", r)}><Icon name="edit" size={15} /></button>
                    <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => fin.rendimento.remove(r.id)}><Icon name="trash" size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card card-pad">
            <div className="section-title" style={{ marginBottom: 14 }}>{tr("inc_origin")}</div>
            <div className="row" style={{ gap: 20 }}>
              <DonutChart data={fin.incBreak} center={<div><div className="tnum" style={{ fontSize: 20, fontWeight: 700 }}>{BM.eur0(fin.totalRec)}</div><div className="tiny muted" style={{ fontWeight: 600 }}>{tr("per_month")}</div></div>} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {fin.incBreak.map((c) => (
                  <div key={c.key} className="row" style={{ justifyContent: "space-between" }}>
                    <span className="row" style={{ gap: 8, fontSize: 13, fontWeight: 600 }}><span className="dot" style={{ background: c.color }} />{ticat(c.nome)}</span>
                    <span className="tnum" style={{ fontWeight: 700, fontSize: 13 }}>{BM.eur0(c.valor)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { Auth, Dashboard, Despesas, Rendimentos, SavingsPlanner });
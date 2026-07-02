/* ===== Bloqueio de ecrã por PIN + inatividade (Funcionalidade #1) =====
   Camada local do dispositivo (não depende do backend). Expõe window.RendeLock
   para o ecrã de Definições e a app. O PIN é guardado com hash simples.
   NOTA: em produção, trocar por um hash forte (SHA-256 / bcrypt no backend). */
(function () {
  const KEY = "rende_lock";
  const DEFAULT_MIN = 5; // minutos de inatividade até bloquear (predefinição)

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } };
  const write = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  const djb2 = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i); return "h" + (h >>> 0); };

  const subs = new Set();
  const notify = () => subs.forEach((fn) => { try { fn(); } catch (e) {} });

  // marca que esta sessão de página já está desbloqueada (evita bloquear logo a seguir a definir/desbloquear)
  let unlockedThisSession = false;

  const RendeLock = {
    hasPin() { const o = read(); return !!(o && o.pinHash); },
    verify(pin) { const o = read(); return !!(o && o.pinHash === djb2(String(pin))); },
    setPin(pin) { const o = read() || {}; o.pinHash = djb2(String(pin)); if (o.minutes == null) o.minutes = DEFAULT_MIN; write(o); unlockedThisSession = true; notify(); },
    removePin() { const o = read() || {}; delete o.pinHash; write(o); unlockedThisSession = true; notify(); },
    getMinutes() { const o = read(); return (o && o.minutes != null) ? o.minutes : DEFAULT_MIN; },
    setMinutes(m) { const o = read() || {}; o.minutes = m; write(o); notify(); },
    markUnlocked() { unlockedThisSession = true; },
    wasUnlocked() { return unlockedThisSession; },
    lockNow() { unlockedThisSession = false; notify(); window.dispatchEvent(new CustomEvent("rende-lock-now")); },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
  window.RendeLock = RendeLock;
})();

/* ---------- Ecrã de bloqueio (mockup: 2 colunas · PIN + Palavra-passe) ---------- */
function LockScreen({ onUnlock }) {
  const fin = useFinance();
  const acc = (fin && fin.account) || {};
  const email = acc.email || "";
  const podePass = !!email;
  const [tab, setTab] = React.useState("pin");
  const [digits, setDigits] = React.useState(["", "", "", ""]);
  const [pass, setPass] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  const [status, setStatus] = React.useState("idle"); // idle | validating | error | ok
  const [msg, setMsg] = React.useState("");
  const refs = [React.useRef(null), React.useRef(null), React.useRef(null), React.useRef(null)];

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => { if (refs[0].current) refs[0].current.focus(); }, 120);
    return () => { document.body.style.overflow = prev; clearTimeout(t); };
  }, []);

  const okUnlock = () => { setStatus("ok"); window.RendeLock.markUnlocked(); setTimeout(onUnlock, 280); };
  const falhar = (m) => { setStatus("error"); setMsg(m); setTimeout(() => setStatus((s) => (s === "error" ? "idle" : s)), 520); };

  const validarPin = (str) => {
    if (str.length < 4) return falhar("Completa os 4 dígitos.");
    setStatus("validating");
    setTimeout(() => {
      if (window.RendeLock.verify(str)) okUnlock();
      else { setDigits(["", "", "", ""]); if (refs[0].current) refs[0].current.focus(); falhar("PIN incorreto. Tenta novamente."); }
    }, 240);
  };
  const onDigit = (i, v) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setMsg("");
    setDigits((arr) => {
      const n = arr.slice(); n[i] = d;
      if (d && i < 3 && refs[i + 1].current) refs[i + 1].current.focus();
      const full = n.join("");
      if (full.length === 4 && n.every((x) => x)) validarPin(full);
      return n;
    });
    if (status === "error") setStatus("idle");
  };
  const onKey = (i, e) => { if (e.key === "Backspace" && !digits[i] && i > 0 && refs[i - 1].current) refs[i - 1].current.focus(); };

  const validarPass = () => {
    if (!pass) return falhar("Introduz a palavra-passe.");
    setStatus("validating");
    API.login({ email: email, password: pass }).then(() => okUnlock()).catch(() => { setPass(""); falhar("Palavra-passe incorreta."); });
  };

  const erro = status === "error";
  const ocupado = status === "validating" || status === "ok";
  const acionar = () => (tab === "pin" ? validarPin(digits.join("")) : validarPass());

  return (
    <div className={"lock-root" + (status === "ok" ? " lock-out" : "")} role="dialog" aria-modal="true" aria-label="Sessão bloqueada"
      onKeyDown={(e) => { if (e.key === "Escape") e.preventDefault(); }}>
      <div className="lock-card">
        <aside className="lock-left">
          <div className="lock-brand"><Brand nameColor="#fff" /></div>
          <div className="lock-left-mid">
            <h1 className="lock-h1">Sessão bloqueada<br /><span>por inatividade</span></h1>
            <p className="lock-lead">Para proteger os teus dados, a tua sessão foi bloqueada automaticamente devido a um período de inatividade.</p>
          </div>
          <div className="lock-privacy">
            <span className="lock-privacy-ic"><Icon name="shield" size={16} color="var(--accent)" /></span>
            <div><b>A tua privacidade é importante</b><span>Só tu tens acesso às tuas informações financeiras.</span></div>
          </div>
        </aside>

        <div className="lock-right">
          <div className="lock-brand lock-m"><Brand nameColor="#fff" /></div>
          <div className={"lock-ico" + (erro ? " shake" : "")}><Icon name="lock" size={30} color="var(--accent)" /></div>
          <h2 className="lock-h2 lock-d">Bem-vindo de volta!</h2>
          <h2 className="lock-h2 lock-m">Sessão bloqueada<br /><span>por inatividade</span></h2>
          <p className="lock-sub lock-d">Introduz o teu {podePass ? "PIN ou palavra-passe" : "PIN"} para continuar.</p>
          <p className="lock-sub lock-m">Para proteger os teus dados, a tua sessão foi bloqueada por segurança.</p>

          {podePass && (
            <div className="lock-tabs">
              <button type="button" className={"lock-tab" + (tab === "pin" ? " on" : "")} onClick={() => { setTab("pin"); setMsg(""); setStatus("idle"); }}>PIN</button>
              <button type="button" className={"lock-tab" + (tab === "pass" ? " on" : "")} onClick={() => { setTab("pass"); setMsg(""); setStatus("idle"); }}>Palavra-passe</button>
              <span className="lock-tab-ink" style={{ transform: tab === "pass" ? "translateX(100%)" : "translateX(0)" }} />
            </div>
          )}

          {tab === "pin" ? (
            <div className={"lock-pane" + (erro ? " shake" : "")}>
              <div className="lock-pin-label">Insere o teu PIN de 4 dígitos</div>
              <div className="lock-pin">
                {digits.map((d, i) => (
                  <input key={i} ref={refs[i]} className={"lock-pin-box" + (erro ? " err" : "")} inputMode="numeric" maxLength={1} type="password"
                    value={d} disabled={ocupado} aria-label={"Dígito " + (i + 1)}
                    onChange={(e) => onDigit(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} />
                ))}
              </div>
            </div>
          ) : (
            <div className={"lock-pane" + (erro ? " shake" : "")}>
              <div className="lock-pass">
                <input className={"input lock-pass-input" + (erro ? " err" : "")} type={showPass ? "text" : "password"} value={pass} placeholder="A tua palavra-passe"
                  autoFocus disabled={ocupado} onChange={(e) => { setPass(e.target.value); setMsg(""); if (status === "error") setStatus("idle"); }}
                  onKeyDown={(e) => { if (e.key === "Enter") validarPass(); }} />
                <button type="button" className="lock-eye" onClick={() => setShowPass((v) => !v)} title={showPass ? "Esconder" : "Mostrar"}><Icon name={showPass ? "eyeOff" : "eye"} size={17} color="rgba(255,255,255,.55)" /></button>
              </div>
            </div>
          )}

          <div className={"lock-msg" + (erro ? " show" : "")}>{msg}</div>

          <button className="lock-btn" disabled={ocupado} onClick={acionar}>
            {status === "validating" ? "A validar…" : status === "ok" ? "Desbloqueado ✓" : "Desbloquear"}
          </button>

          {podePass && (
            <>
              <div className="lock-or"><span>ou</span></div>
              <button type="button" className="lock-alt" onClick={() => { setTab(tab === "pin" ? "pass" : "pin"); setMsg(""); setStatus("idle"); }}>
                <Icon name="lock" size={15} color="rgba(255,255,255,.75)" /> {tab === "pin" ? "Usar palavra-passe" : "Usar PIN"}
              </button>
            </>
          )}

          <div className="lock-privacy lock-m" style={{ marginTop: 24 }}>
            <span className="lock-privacy-ic"><Icon name="shield" size={16} color="var(--accent)" /></span>
            <div><b>A tua privacidade é importante</b><span>Só tu tens acesso às tuas informações financeiras.</span></div>
          </div>

          <div className="lock-foot">
            <div className="lock-foot-t"><Icon name="lock" size={13} color="rgba(255,255,255,.5)" /> <b>Segurança em primeiro lugar</b></div>
            <span>A tua sessão será desbloqueada apenas por ti.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Porta de bloqueio: mede inatividade e mostra o ecrã ----------
   Renderiza-se dentro do Shell: <LockGate active={!!fin.session} /> */
function LockGate({ active }) {
  const [locked, setLocked] = React.useState(() => window.RendeLock.hasPin() && !window.RendeLock.wasUnlocked());
  const lastActivity = React.useRef(Date.now());

  React.useEffect(() => {
    const bump = () => { lastActivity.current = Date.now(); };
    const evs = ["click", "keydown", "mousemove", "touchstart", "scroll"];
    evs.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const onLockNow = () => setLocked(true);
    window.addEventListener("rende-lock-now", onLockNow);
    const iv = setInterval(() => {
      if (active && window.RendeLock.hasPin() && !locked) {
        const mins = window.RendeLock.getMinutes();
        if (Date.now() - lastActivity.current > mins * 60000) setLocked(true);
      }
    }, 1000);
    return () => { evs.forEach((e) => window.removeEventListener(e, bump)); window.removeEventListener("rende-lock-now", onLockNow); clearInterval(iv); };
  }, [active, locked]);

  if (!active || !locked || !window.RendeLock.hasPin()) return null;
  return <LockScreen onUnlock={() => { lastActivity.current = Date.now(); setLocked(false); }} />;
}

/* ---------- Modal: definir/alterar PIN (reutiliza o teu Modal) ---------- */
function RLPinSetup({ onClose }) {
  const [a, setA] = React.useState("");
  const [b, setB] = React.useState("");
  const [err, setErr] = React.useState("");
  const ok = () => {
    if (!/^\d{4}$/.test(a)) return setErr("O PIN deve ter exatamente 4 dígitos.");
    if (a !== b) return setErr("Os PINs não coincidem.");
    window.RendeLock.setPin(a); onClose();
  };
  return (
    <Modal title="Definir PIN" sub="Protege a app e as ações graves" onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={ok}><Icon name="check" size={15} color="#fff" /> Definir</button>
      </>}>
      <Field label="Novo PIN (4 dígitos)"><input className="input" type="password" inputMode="numeric" maxLength={4} autoFocus value={a} onChange={(e) => setA(e.target.value.replace(/\D/g, ""))} placeholder="••••" /></Field>
      <Field label="Confirmar PIN"><input className="input" type="password" inputMode="numeric" maxLength={4} value={b} onChange={(e) => setB(e.target.value.replace(/\D/g, ""))} placeholder="••••" /></Field>
      {err && <div className="alert bad" style={{ marginTop: 4, padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
    </Modal>
  );
}

/* ---------- Modal: confirmar ação grave com PIN (Funcionalidade #5) ----------
   Uso: RLConfirmPin({ title, desc, onConfirm, onClose }) */
function RLConfirmPin({ title, desc, onConfirm, onClose }) {
  const [val, setVal] = React.useState("");
  const [err, setErr] = React.useState("");
  const confirm = () => {
    if (window.RendeLock.verify(val)) { onConfirm(); onClose(); }
    else { setErr("PIN incorreto."); setVal(""); }
  };
  return (
    <Modal title={title} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn" style={{ background: "var(--neg)", color: "#fff", border: "none" }} onClick={confirm}>Confirmar</button>
      </>}>
      <div className="muted" style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.6, marginBottom: 14 }}>{desc}</div>
      <Field label="Introduz o teu PIN para confirmar"><input className="input" type="password" inputMode="numeric" maxLength={6} autoFocus value={val} onChange={(e) => setVal(e.target.value.replace(/\D/g, ""))} placeholder="••••" /></Field>
      {err && <div className="alert bad" style={{ marginTop: 4, padding: "9px 12px" }}><Icon name="info" size={16} color="var(--neg)" /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{err}</span></div>}
    </Modal>
  );
}

window.LockGate = LockGate;
window.LockScreen = LockScreen;
window.RLPinSetup = RLPinSetup;
window.RLConfirmPin = RLConfirmPin;
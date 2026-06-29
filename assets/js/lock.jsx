/* ===== Bloqueio de ecrã por PIN + inatividade (Funcionalidade #1) =====
   Camada local do dispositivo (não depende do backend). Expõe window.RendeLock
   para o ecrã de Definições e a app. O PIN é guardado com hash simples.
   NOTA: em produção, trocar por um hash forte (SHA-256 / bcrypt no backend). */
(function () {
  const KEY = "rende_lock";
  const DEFAULT_MIN = 30; // minutos de inatividade até bloquear (predefinição)

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

/* ---------- Ecrã de bloqueio (teclado de dígitos) ---------- */
function LockScreen({ onUnlock }) {
  const [val, setVal] = React.useState("");
  const [err, setErr] = React.useState("");
  const tryUnlock = (v) => {
    if (window.RendeLock.verify(v)) { window.RendeLock.markUnlocked(); onUnlock(); }
    else { setErr("PIN incorreto"); setVal(""); }
  };
  const press = (k) => {
    setErr("");
    if (k === "del") return setVal((v) => v.slice(0, -1));
    if (val.length >= 6) return;
    const nv = val + k; setVal(nv);
    if (nv.length === 6) tryUnlock(nv);
  };
  const wrap = { position: "fixed", inset: 0, zIndex: 9000, display: "grid", placeItems: "center", padding: 20, color: "#fff", background: "linear-gradient(150deg, #0b6446, var(--accent) 55%, #083d2c)" };
  const key = { height: 60, borderRadius: 16, background: "rgba(255,255,255,.13)", border: "none", color: "#fff", fontSize: 23, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
  const keyAct = { ...key, background: "transparent", fontSize: 14, fontWeight: 700 };
  return (
    <div style={wrap}>
      <div style={{ width: "100%", maxWidth: 340, textAlign: "center" }}>
        <div style={{ width: 70, height: 70, borderRadius: 20, background: "rgba(255,255,255,.16)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
          <Icon name="lock" size={32} color="#fff" />
        </div>
        <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-.01em" }}>Sessão bloqueada</div>
        <div style={{ opacity: .85, fontSize: 14, margin: "6px 0 22px" }}>Introduz o teu PIN para continuar</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 18 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.65)", background: i < val.length ? "#fff" : "transparent" }} />
          ))}
        </div>
        <div style={{ height: 18, marginBottom: 8, fontWeight: 700, fontSize: 13, color: "#ffd9d9" }}>{err}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, maxWidth: 280, margin: "0 auto" }}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => <button key={k} style={key} onClick={() => press(k)}>{k}</button>)}
          <button style={keyAct} onClick={() => press("del")}>apagar</button>
          <button style={key} onClick={() => press("0")}>0</button>
          <button style={keyAct} onClick={() => tryUnlock(val)}>OK</button>
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
    if (!/^\d{4,6}$/.test(a)) return setErr("O PIN deve ter 4 a 6 dígitos.");
    if (a !== b) return setErr("Os PINs não coincidem.");
    window.RendeLock.setPin(a); onClose();
  };
  return (
    <Modal title="Definir PIN" sub="Protege a app e as ações graves" onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={ok}><Icon name="check" size={15} color="#fff" /> Definir</button>
      </>}>
      <Field label="Novo PIN (4 a 6 dígitos)"><input className="input" type="password" inputMode="numeric" maxLength={6} autoFocus value={a} onChange={(e) => setA(e.target.value.replace(/\D/g, ""))} placeholder="••••" /></Field>
      <Field label="Confirmar PIN"><input className="input" type="password" inputMode="numeric" maxLength={6} value={b} onChange={(e) => setB(e.target.value.replace(/\D/g, ""))} placeholder="••••" /></Field>
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
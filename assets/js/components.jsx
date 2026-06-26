/* ===== Shared UI components ===== */
const BM = window.BM;

function initials(name) {
  return (name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
}

function Avatar({ account, size = 34, fontSize }) {
  const foto = account?.foto;
  if (foto) return <img src={foto} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flex: "none" }} />;
  return <div className="user-av" style={{ width: size, height: size, fontSize: fontSize || size * 0.4 }}>{initials(account?.nome)}</div>;
}

function CatBadge({ catKey, size = 40, r = 12 }) {
  const c = BM.cats[catKey] || BM.cats.outros;
  return (
    <div style={{ width: size, height: size, borderRadius: r, flex: "none",
      display: "grid", placeItems: "center",
      background: `color-mix(in srgb, ${c.color} 16%, transparent)` }}>
      <Icon name={c.icon} size={size * 0.45} color={c.color} sw={1.9} />
    </div>
  );
}

function Brand({ nameColor = "var(--ink)", size = 38, sub = null, onClick, premium = true, premiumBelow = false }) {
  const prem = premium ? <span className={"brand-prem" + (premiumBelow ? " brand-prem-below" : "")}>Premium</span> : null;
  return (
    <div className="brand" style={{ padding: 0, cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <div className="brand-mark" style={{ width: size, height: size }}><span className="brand-mark-txt" style={{ fontSize: size * 0.5 }}>R</span></div>
      <div>
        {premiumBelow ? (
          <>
            <div className="brand-name" style={{ color: nameColor, fontSize: size * 0.45 }}>Rende<span className="brand-plus">+</span></div>
            {prem}
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div className="brand-name" style={{ color: nameColor, fontSize: size * 0.45 }}>Rende<span className="brand-plus">+</span></div>
            {prem}
          </div>
        )}
        {sub && <div className="brand-sub" style={{ color: nameColor === "#fff" ? "rgba(255,255,255,.6)" : "var(--ink-3)" }}>{sub}</div>}
      </div>
    </div>
  );
}

function Sidebar({ route, go, account, collapsed, onToggle }) {
  const tr = useT();
  const nav = [
    { id: "dashboard", label: tr("lbl_dashboard"), icon: "grid" },
    { id: "despesas", label: tr("lbl_expenses"), icon: "wallet" },
    { id: "rendimentos", label: tr("lbl_income"), icon: "coins" },
    { id: "poupanca", label: tr("lbl_savings"), icon: "target" },
  ];
  const nav2 = [
    { id: "relatorios", label: tr("lbl_reports"), icon: "piechart" },
    { id: "historico", label: tr("lbl_history"), icon: "history" },
    { id: "config", label: tr("lbl_settings"), icon: "gear" },
  ];
  const navPrem = [
    { id: "subscricoes", label: "Subscrições", icon: "tv" },
    { id: "lembretes", label: "Lembretes", icon: "bell" },
    { id: "recorrentes", label: "Recorrentes", icon: "repeat" },
    { id: "partilha", label: "Partilha", icon: "users" },
    { id: "previsao", label: "Previsão", icon: "trend" },
  ];
  const Item = (n) => (
    <button key={n.id} className={"nav-item" + (route === n.id ? " active" : "")} onClick={() => go(n.id)} title={n.label}>
      <Icon name={n.icon} size={19} />
      <span>{n.label}</span>
    </button>
  );
  return (
    <aside className="sidebar">
      <div style={{ padding: "4px 8px 22px" }}>
        <button onClick={() => go("dashboard")} style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }} title={tr("go_dashboard")}>
          <Brand nameColor="#fff" premiumBelow />
        </button>
      </div>
      <div className="nav-label">{tr("lbl_general")}</div>
      {nav.map(Item)}
      <div className="nav-label">{tr("lbl_analysis")}</div>
      {nav2.map(Item)}
      <div className="nav-label row" style={{ justifyContent: "space-between", paddingRight: 4 }}>Premium <PremiumBadge /></div>
      {navPrem.map(Item)}
      <div className="sidebar-foot">
        <button className="nav-item sb-toggle" onClick={onToggle} title={collapsed ? tr("sb_expand") : tr("sb_collapse")}>
          <span style={{ display: "grid", transform: collapsed ? "rotate(180deg)" : "none" }}><Icon name="collapse" size={19} /></span>
          <span>{collapsed ? tr("sb_expand") : tr("sb_collapse")}</span>
        </button>
      </div>
    </aside>
  );
}

function MonthNav({ label, onPrev, onNext, canNext = true, isCurrent, onToday }) {
  const tr = useT();
  return (
    <div className="row" style={{ gap: 8 }}>
      {!isCurrent && onToday && (
        <button className="btn btn-soft" style={{ padding: "7px 12px" }} onClick={onToday}>{tr("month_current")}</button>
      )}
      <div className="seg" style={{ padding: 2 }}>
        <button onClick={onPrev} style={{ padding: "6px 9px" }}><span style={{ transform: "rotate(180deg)", display: "grid" }}><Icon name="chevR" size={15} /></span></button>
        <span style={{ display: "grid", placeItems: "center", padding: "0 12px", fontSize: 13, fontWeight: 700, minWidth: 96 }}>{label}</span>
        <button onClick={canNext ? onNext : undefined} disabled={!canNext} title={canNext ? "" : tr("month_at_current")}
          style={{ padding: "6px 9px", opacity: canNext ? 1 : 0.35, cursor: canNext ? "pointer" : "not-allowed" }}><Icon name="chevR" size={15} /></button>
      </div>
    </div>
  );
}

function Topbar({ title, sub, theme, setTheme, onLogout, onAdd, addLabel, monthNav }) {
  const tr = useT();
  return (
    <div className="topbar">
      <div className="row" style={{ gap: 11, minWidth: 0 }}>
        <div className="mobile-brand brand-mark" style={{ width: 34, height: 34, borderRadius: 10 }}><span className="brand-mark-txt" style={{ fontSize: 17 }}>R</span></div>
        <div style={{ minWidth: 0 }}>
          <h1 className="page-title">{title}</h1>
          {sub && <p className="page-sub">{sub}</p>}
        </div>
      </div>
      <div className="topbar-actions">
        {monthNav}
        {onAdd && (
          <button className="btn btn-primary" onClick={onAdd}>
            <Icon name="plus" size={16} color="#fff" /> <span className="hide-mobile">{addLabel || tr("add_generic")}</span>
          </button>
        )}
        <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title={tr("theme_title")}>
          <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
        </button>
        <button className="icon-btn hide-mobile" onClick={onLogout} title={tr("logout_short")}><Icon name="logout" size={18} /></button>
      </div>
    </div>
  );
}

function MobileNav({ route, go, onMore }) {
  const tr = useT();
  const tabs = [
    { id: "dashboard", label: "Início", icon: "home" },
    { id: "despesas", label: "Despesas", icon: "wallet" },
    { id: "rendimentos", label: "Receita", icon: "coins" },
    { id: "perfil", label: "Perfil", icon: "user" },
  ];
  const moreRoutes = ["poupanca", "relatorios", "historico", "config", "subscricoes", "lembretes", "recorrentes", "partilha", "previsao", "premium"];
  return (
    <nav className="mobilenav">
      {tabs.map((t) => (
        <button key={t.id} className={"mtab" + (route === t.id ? " on" : "")} onClick={() => go(t.id)}>
          <Icon name={t.icon} size={22} sw={route === t.id ? 2.2 : 1.8} />
          <span>{t.label}</span>
        </button>
      ))}
      <button className={"mtab mtab-more" + (moreRoutes.includes(route) ? " on" : "")} onClick={onMore}>
        <Icon name="dots" size={22} sw={2.4} />
        <span>Mais</span>
      </button>
    </nav>
  );
}

function MoreSheet({ route, go, onClose, theme, setTheme, onLogout }) {
  const tr = useT();
  const items = [
    { id: "poupanca", label: "Poupança", icon: "target" },
    { id: "subscricoes", label: "Subscrições", icon: "tv" },
    { id: "lembretes", label: "Lembretes", icon: "bell" },
    { id: "recorrentes", label: "Recorrentes", icon: "repeat" },
    { id: "partilha", label: "Partilha", icon: "users" },
    { id: "previsao", label: "Previsão", icon: "trend" },
    { id: "relatorios", label: tr("lbl_reports"), icon: "piechart" },
    { id: "historico", label: tr("lbl_history"), icon: "history" },
    { id: "config", label: tr("lbl_settings"), icon: "gear" },
  ];
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        {items.map((it) => (
          <button key={it.id} className={"sheet-item" + (route === it.id ? " on" : "")} onClick={() => { go(it.id); onClose(); }}>
            <span className="si-ico"><Icon name={it.icon} size={18} /></span>{it.label}
          </button>
        ))}
        <div style={{ height: 1, background: "var(--border)", margin: "8px 12px" }} />
        <button className="sheet-item" onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); }}>
          <span className="si-ico"><Icon name={theme === "dark" ? "sun" : "moon"} size={18} /></span>{theme === "dark" ? tr("theme_light") : tr("theme_dark")}
        </button>
        <button className="sheet-item" style={{ color: "var(--neg)" }} onClick={() => { onClose(); onLogout(); }}>
          <span className="si-ico"><Icon name="logout" size={18} color="var(--neg)" /></span>{tr("logout_full")}
        </button>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, delta, deltaDir, icon, color, spark, onClick }) {
  return (
    <div className={"card card-pad kpi" + (onClick ? " is-hover" : "")} onClick={onClick}
      role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}
      style={onClick ? { cursor: "pointer" } : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}>
      <div className="kpi-top">
        <div className="kpi-ico" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
          <Icon name={icon} size={19} color={color} sw={1.9} />
        </div>
        {spark && <Sparkline data={spark} color={color} />}
        {!spark && delta != null && (
          <span className={"delta " + (deltaDir === "down" ? "down" : "up")}>
            <Icon name={deltaDir === "down" ? "arrowDown" : "arrowUp"} size={13} /> {delta}
          </span>
        )}
      </div>
      <div>
        <div className="kpi-label">{label}{onClick && <Icon name="chevR" size={13} color="var(--ink-3)" />}</div>
        <div className="kpi-val tnum" style={{ marginTop: 6 }}>{value}</div>
        {sub && <div className="tiny muted" style={{ marginTop: 7, fontWeight: 600 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Alert({ kind, icon, title, children }) {
  return (
    <div className={"alert " + kind}>
      <span className="alert-ico"><Icon name={icon} size={18}
        color={kind === "warn" ? "var(--warn)" : kind === "bad" ? "var(--neg)" : "var(--accent)"} /></span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.35 }}>{title}</div>
        {children && <div className="tiny muted" style={{ marginTop: 3, fontWeight: 600, lineHeight: 1.5 }}>{children}</div>}
      </div>
    </div>
  );
}

function Progress({ value, max, color }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return <div className="bar"><i style={{ width: pct + "%", background: color || "var(--accent)" }} /></div>;
}

function EmptyState({ icon, title, msg, action }) {
  return (
    <div className="card empty-card" style={{ display: "grid", placeItems: "center", padding: "56px 24px", textAlign: "center", width: "100%", boxSizing: "border-box" }}>
      <div className="li-ico" style={{ width: 60, height: 60, marginBottom: 18, background: "var(--accent-soft)" }}>
        <Icon name={icon} size={26} color="var(--accent)" sw={1.8} />
      </div>
      <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-.01em" }}>{title}</div>
      <div className="muted" style={{ marginTop: 7, fontSize: 14, fontWeight: 500, maxWidth: 380, lineHeight: 1.55 }}>{msg}</div>
      {action && <div className="empty-action" style={{ marginTop: 20, width: "100%" }}>{action}</div>}
    </div>
  );
}

function Field({ label, children, hint }) {
  return <div className="field"><label>{label}</label>{children}{hint && <span className="tiny muted" style={{ fontWeight: 600 }}>{hint}</span>}</div>;
}

function Modal({ title, sub, onClose, children, footer, wide }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={wide ? { maxWidth: 560 } : null} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
            {sub && <div className="tiny muted" style={{ fontWeight: 600, marginTop: 2 }}>{sub}</div>}
          </div>
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onClose}><span style={{ transform: "rotate(45deg)", display: "grid" }}><Icon name="plus" size={17} sw={2} color="var(--ink-2)" /></span></button>
        </div>
        <div style={{ padding: 20, overflowY: "auto", flex: "1 1 auto", minHeight: 0 }}>{children}</div>
        {footer && <div style={{ padding: "14px 20px 20px", display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0, borderTop: "1px solid var(--border)" }}>{footer}</div>}
      </div>
    </div>
  );
}

Object.assign(window, { initials, Avatar, Brand, CatBadge, Sidebar, MobileNav, MoreSheet, MonthNav, Topbar, Kpi, Alert, Progress, EmptyState, Field, Modal });
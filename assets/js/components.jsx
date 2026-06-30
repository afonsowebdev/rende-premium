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

function Sidebar({ route, go, account, collapsed, onToggle, onLogout }) {
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
          <Brand nameColor="var(--ink)" premiumBelow />
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
      {onToday && (
        <button className="btn btn-soft" style={{ padding: "7px 12px" }} onClick={onToday}>{tr("month_current")}</button>
      )}
      <div className="seg" style={{ padding: 2 }}>
        <button onClick={onPrev} style={{ padding: "6px 9px" }}><span style={{ transform: "rotate(180deg)", display: "grid" }}><Icon name="chevR" size={15} /></span></button>
        <button onClick={!isCurrent && onToday ? onToday : undefined} title={!isCurrent ? "Ir para o mês atual" : ""} style={{ display: "grid", placeItems: "center", padding: "0 12px", fontSize: 13, fontWeight: 700, minWidth: 96, background: "none", border: "none", fontFamily: "inherit", color: "inherit", cursor: !isCurrent ? "pointer" : "default" }}>{label}</button>
        <button onClick={canNext ? onNext : undefined} disabled={!canNext} title={canNext ? "" : tr("month_at_current")}
          style={{ padding: "6px 9px", opacity: canNext ? 1 : 0.35, cursor: canNext ? "pointer" : "not-allowed" }}><Icon name="chevR" size={15} /></button>
      </div>
    </div>
  );
}

function Topbar({ title, sub, theme, setTheme, onLogout, ocultar, onToggleOcultar, go, onMenu }) {
  const fin = useFinance();
  const acc = fin.account || {};
  const nome = acc.nome || "Conta";
  const [menu, setMenu] = React.useState(false);
  const wrapRef = React.useRef(null);
  React.useEffect(() => {
    if (!menu) return;
    const fora = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenu(false); };
    const esc = (e) => { if (e.key === "Escape") setMenu(false); };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [menu]);
  return (
    <div className="topbar">
      <div className="row topbar-left" style={{ gap: 11, minWidth: 0 }}>
        {onMenu && (
          <button className="menu-btn" onClick={onMenu} aria-label="Abrir menu" title="Abrir menu">
            <Icon name="menu" size={23} />
          </button>
        )}
        <div className="mobile-brand brand-mark" style={{ width: 34, height: 34, borderRadius: 10 }}><span className="brand-mark-txt" style={{ fontSize: 17 }}>R</span></div>
        <div className="topbar-title" style={{ minWidth: 0 }}>
          <h1 className="page-title">{title}</h1>
          {sub && <p className="page-sub">{sub}</p>}
        </div>
      </div>
      <div className="topbar-actions">
        {onToggleOcultar && (
          <button className="icon-btn" onClick={onToggleOcultar} title={ocultar ? "Mostrar valores" : "Ocultar valores"} aria-pressed={ocultar}>
            <Icon name={ocultar ? "eyeOff" : "eye"} size={18} />
          </button>
        )}
        <NotifBell />
        <button className="icon-btn hide-mobile" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Mudar tema">
          <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
        </button>
        <div className="topbar-userwrap" ref={wrapRef}>
          <button className="topbar-avatar" onClick={() => setMenu((v) => !v)} aria-haspopup="menu" aria-expanded={menu} title={nome}>
            <Avatar account={acc} size={36} />
          </button>
          {menu && (
            <div className="user-menu" role="menu">
              <div className="user-menu-head">
                <Avatar account={acc} size={40} />
                <div style={{ minWidth: 0 }}>
                  <div className="um-name">{nome}</div>
                  {acc.email && <div className="um-mail">{acc.email}</div>}
                </div>
              </div>
              <button className="user-menu-item" role="menuitem" onClick={() => { setMenu(false); go && go("perfil"); }}>
                <Icon name="user" size={17} /> Perfil
              </button>
              <button className="user-menu-item" role="menuitem" onClick={() => { setMenu(false); go && go("config"); }}>
                <Icon name="gear" size={17} /> Definições
              </button>
              <div className="user-menu-sep" />
              <button className="user-menu-item danger" role="menuitem" onClick={() => { setMenu(false); onLogout && onLogout(); }}>
                <Icon name="logout" size={17} /> Terminar sessão
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileMenu({ open, onClose, route, go, account, onLogout }) {
  const tr = useT();
  const fin = useFinance();
  const acc = account || fin.account || {};
  const nome = acc.nome || "Conta";
  const [acctOpen, setAcctOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) { setAcctOpen(false); return; }
    const esc = (e) => { if (e.key === "Escape") onClose && onClose(); };
    document.addEventListener("keydown", esc);
    document.body.classList.add("drawer-lock");
    return () => { document.removeEventListener("keydown", esc); document.body.classList.remove("drawer-lock"); };
  }, [open]);

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
    { id: "subscricoes", label: "Subscrições", icon: "tv", badge: true },
    { id: "lembretes", label: "Lembretes", icon: "bell" },
    { id: "recorrentes", label: "Recorrentes", icon: "repeat" },
    { id: "partilha", label: "Partilha", icon: "users" },
    { id: "previsao", label: "Previsão", icon: "trend" },
  ];
  const acct = [
    { id: "perfil", label: "Meu perfil", icon: "user" },
    { id: "premium", label: "Plano e faturação", icon: "card" },
    { id: "config", label: "Segurança", icon: "shield" },
    { id: "config", label: "Idioma", icon: "globe" },
  ];
  const goClose = (id) => { go && go(id); onClose && onClose(); };
  const Item = (n) => (
    <button key={n.id} className={"dr-item" + (route === n.id ? " active" : "")} onClick={() => goClose(n.id)}>
      <Icon name={n.icon} size={20} />
      <span>{n.label}</span>
      {n.badge && <PremiumBadge />}
    </button>
  );

  return (
    <div className={"drawer-root" + (open ? " open" : "")} aria-hidden={!open}>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="Menu">
        <div className="drawer-top">
          <button className="drawer-brand" onClick={() => goClose("dashboard")} title={tr("go_dashboard")}>
            <Brand nameColor="var(--ink)" premiumBelow />
          </button>
          <button className="drawer-x" onClick={onClose} aria-label="Fechar menu"><Icon name="x" size={22} /></button>
        </div>
        <nav className="drawer-scroll">
          <div className="nav-label">{tr("lbl_general")}</div>
          {nav.map(Item)}
          <div className="nav-label">{tr("lbl_analysis")}</div>
          {nav2.map(Item)}
          <div className="nav-label">Premium</div>
          {navPrem.map(Item)}
        </nav>
        <div className={"drawer-acct" + (acctOpen ? " open" : "")}>
          <button className="drawer-acct-head" onClick={() => setAcctOpen((v) => !v)} aria-expanded={acctOpen}>
            <Avatar account={acc} size={38} />
            <div className="drawer-acct-txt">
              <div className="da-name">{nome}</div>
              <div className="da-plan">Plano Premium</div>
            </div>
            <span className="da-chev" style={{ transform: acctOpen ? "rotate(180deg)" : "none" }}><Icon name="chevD" size={18} /></span>
          </button>
          {acctOpen && (
            <div className="drawer-acct-menu">
              {acct.map((a, i) => (
                <button key={i} className="dr-item" onClick={() => goClose(a.id)}>
                  <Icon name={a.icon} size={19} /> <span>{a.label}</span>
                </button>
              ))}
              <button className="dr-item danger" onClick={() => { onClose && onClose(); onLogout && onLogout(); }}>
                <Icon name="logout" size={19} /> <span>Sair da conta</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function MobileNav({ route, go, onMore }) {
  const fin = useFinance();
  const acc = fin.account || {};
  const tabs = [
    { id: "dashboard", label: "Início", icon: "grid" },
    { id: "despesas", label: "Despesas", icon: "card" },
    { id: "rendimentos", label: "Receita", icon: "coins" },
    { id: "perfil", label: "Perfil", icon: "user" },
  ];
  const moreRoutes = ["poupanca", "relatorios", "historico", "config", "subscricoes", "lembretes", "recorrentes", "partilha", "previsao", "premium"];
  const inicial = ((acc.nome || "").trim().charAt(0) || "?").toUpperCase();
  return (
    <nav className="mobilenav">
      {tabs.map((t) => {
        const on = route === t.id;
        return (
          <button key={t.id} className={"mtab" + (on ? " on" : "")} onClick={() => go(t.id)}>
            {t.id === "perfil"
              ? (acc.foto
                  ? <img src={acc.foto} alt="" className={"mtab-av" + (on ? " on" : "")} />
                  : <span className={"mtab-av mtab-av-ph" + (on ? " on" : "")}>{inicial}</span>)
              : <Icon name={t.icon} size={21} sw={on ? 2.2 : 1.8} />}
            <span>{t.label}</span>
          </button>
        );
      })}
      <button className={"mtab mtab-more" + (moreRoutes.includes(route) ? " on" : "")} onClick={onMore}>
        <Icon name="dots" size={21} sw={2.4} />
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
        <div className="sheet-head">
          <span className="sheet-title">Navegação</span>
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onClose} title="Fechar"><span style={{ transform: "rotate(45deg)", display: "grid" }}><Icon name="plus" size={16} /></span></button>
        </div>
        <div className="sheet-grid">
          {items.map((it) => (
            <button key={it.id} className={"sheet-tile" + (route === it.id ? " on" : "")} onClick={() => { go(it.id); onClose(); }}>
              <span className="st-ico"><Icon name={it.icon} size={21} /></span>
              <span className="st-label">{it.label}</span>
            </button>
          ))}
        </div>
        <div className="sheet-actions">
          <button className="sheet-row" onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); }}>
            <span className="sr-ico"><Icon name={theme === "dark" ? "sun" : "moon"} size={18} /></span>{theme === "dark" ? tr("theme_light") : tr("theme_dark")}
          </button>
          <button className="sheet-row danger" onClick={() => { onClose(); onLogout(); }}>
            <span className="sr-ico"><Icon name="logout" size={18} color="var(--neg)" /></span>{tr("logout_full")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, delta, deltaDir, deltaTone, icon, color, spark, onClick }) {
  return (
    <div className={"card card-pad kpi" + (onClick ? " is-hover" : "")} onClick={onClick}
      role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}
      style={onClick ? { cursor: "pointer" } : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}>
      <div className="kpi-top">
        <div className="kpi-ico" style={{ background: color }}>
          <Icon name={icon} size={19} color="#fff" sw={2} />
        </div>
        {spark && <Sparkline data={spark} color={color} />}
      </div>
      <div>
        <div className="kpi-label">{label}{onClick && <Icon name="chevR" size={13} color="var(--ink-3)" />}</div>
        <div className="kpi-val tnum valor-sensivel" style={{ marginTop: 6 }}>{value}</div>
        {!spark && delta != null && (
          <div className={"delta kpi-delta " + (deltaTone === "neg" ? "down" : (deltaTone === "flat" || deltaDir === "flat") ? "flat" : deltaTone === "pos" ? "up" : (deltaDir === "down" ? "down" : "up"))} style={{ marginTop: 9 }}>
            {deltaDir !== "flat" && <Icon name={deltaDir === "down" ? "arrowDown" : "arrowUp"} size={13} />} {delta}
          </div>
        )}
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
      <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-.01em" }}>{title}</div>
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
            <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
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

Object.assign(window, { initials, Avatar, Brand, CatBadge, Sidebar, MobileMenu, MobileNav, MoreSheet, MonthNav, Topbar, Kpi, Alert, Progress, EmptyState, Field, Modal });
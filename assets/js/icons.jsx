/* ===== Icon set: BoxIcons (com fallback para SVG próprio) ===== */
// mapa nome-interno -> classe BoxIcons. Nomes sem entrada caem no SVG original (P).
const BX = {
  user: "bx-user", eye: "bx-show", eyeOff: "bx-hide", grid: "bx-grid-alt", wallet: "bx-wallet",
  arrowsDown: "bx-down-arrow-alt", target: "bx-target-lock", chart: "bx-line-chart", history: "bx-history",
  report: "bx-file", gear: "bx-cog", plus: "bx-plus", search: "bx-search", bell: "bx-bell", bolt: "bx-bolt-circle",
  home: "bx-home-alt", cart: "bx-cart-alt", bus: "bx-bus", cap: "bxs-graduation", wifi: "bx-wifi", heart: "bx-heart",
  spark: "bx-star", dots: "bx-dots-horizontal-rounded", logout: "bx-log-out", check: "bx-check", edit: "bx-pencil",
  trash: "bx-trash", sun: "bx-sun", moon: "bx-moon", filter: "bx-filter", cal: "bx-calendar", flag: "bx-flag",
  arrowUp: "bx-up-arrow-alt", arrowDown: "bx-down-arrow-alt", chevR: "bx-chevron-right", info: "bx-info-circle",
  bank: "bx-bank", link: "bx-link", camera: "bx-camera", sync: "bx-sync", coins: "bx-coin-stack", coffee: "bx-coffee",
  food: "bx-restaurant", car: "bx-car", fuel: "bx-gas-pump", plane: "bx-plane", train: "bx-train", bike: "bx-cycling",
  pill: "bx-capsule", cross: "bx-plus-medical", book: "bx-book", music: "bx-music", film: "bx-film", game: "bx-joystick",
  tv: "bx-tv", dumbbell: "bx-dumbbell", gift: "bx-gift", phone: "bx-phone", bulb: "bx-bulb", droplet: "bx-droplet",
  umbrella: "bx-umbrella", receipt: "bx-receipt", card: "bx-credit-card", briefcase: "bx-briefcase", leaf: "bx-leaf",
  key: "bx-key", tools: "bx-wrench", bag: "bx-shopping-bag", tag: "bx-purchase-tag", scissors: "bx-cut",
  users: "bx-group", shield: "bx-shield-quarter", download: "bx-download", pdf: "bxs-file-pdf",
  sheet: "bx-spreadsheet", repeat: "bx-repeat", lock: "bx-lock-alt", rocket: "bx-rocket",
  collapse: "bx-chevrons-left", trend: "bx-trending-up", piechart: "bx-pie-chart-alt-2", calc: "bx-calculator",
  smile: "bx-smile", globe: "bx-globe", refresh: "bx-refresh", star: "bxs-star",
  menu: "bx-menu", x: "bx-x", chevD: "bx-chevron-down", chevU: "bx-chevron-up",
};

function Icon({ name, size = 18, color = "currentColor", sw = 1.7, style }) {
  const P = {
    user: "M12 8m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0M5.5 20.5a6.5 6.5 0 0 1 13 0",
    eye: "M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12zM12 12m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0",
    eyeOff: "M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.4 5.2A9.5 9.5 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.3M6.1 6.3A16 16 0 0 0 2.5 12s3.6 6.5 9.5 6.5a9 9 0 0 0 3-.5",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    wallet: "M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v0M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3M3 7h16M17 12h4v4h-4a2 2 0 0 1 0-4z",
    arrowsDown: "M12 5v14M6 13l6 6 6-6",
    target: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0",
    chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    history: "M3 12a9 9 0 1 0 9-9 9 9 0 0 0-7.5 4M3 4v4h4M12 8v4l3 2",
    report: "M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2M9 3h6v3H9zM8 12h8M8 16h5",
    gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.92.66 1.65 1.65 0 0 1-3.16 0 1.65 1.65 0 0 0-2.92-.66l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0-.66-2.92 1.65 1.65 0 0 1 0-3.16 1.65 1.65 0 0 0 .66-2.92l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 2.92-.66 1.65 1.65 0 0 1 3.16 0 1.65 1.65 0 0 0 2.92.66l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82z",
    plus: "M12 5v14M5 12h14",
    search: "M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0M21 21l-4.3-4.3",
    bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
    bolt: "M13 2 4.5 13H11l-1 9 8.5-11H12l1-9z",
    home: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5",
    cart: "M3 4h2l2.4 12.5a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 2-1.6L22 8H6M9 21h.01M18 21h.01",
    bus: "M5 17V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v11M5 17h14M5 17v2M19 17v2M5 11h14M8 21h0M16 21h0",
    cap: "M22 9 12 5 2 9l10 4 10-4zM6 11v4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4",
    wifi: "M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01",
    heart: "M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5.5 4.5 4.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z",
    spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18",
    dots: "M5 12h.01M12 12h.01M19 12h.01",
    logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
    check: "M20 6 9 17l-5-5",
    edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
    trash: "M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
    google: "GOOGLE",
    sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
    moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
    filter: "M3 5h18M6 12h12M10 19h4",
    cal: "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 9h18M8 3v4M16 3v4",
    flag: "M4 22V4M4 4h13l-2 4 2 4H4",
    arrowUp: "M12 19V5M6 11l6-6 6 6",
    arrowDown: "M12 5v14M6 13l6 6 6-6",
    chevR: "M9 6l6 6-6 6",
    info: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 16v-4M12 8h.01",
    bank: "M3 10 12 4l9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18",
    link: "M9 15l6-6M10.5 6.5 12 5a4 4 0 0 1 6 6l-1.5 1.5M13.5 17.5 12 19a4 4 0 0 1-6-6l1.5-1.5",
    camera: "M3 8a2 2 0 0 1 2-2h2l1.2-1.6a1 1 0 0 1 .8-.4h6a1 1 0 0 1 .8.4L19 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    sync: "M21 12a9 9 0 1 1-3-6.7M21 4v4h-4",
    coins: "M8 8m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0M21 12a5 5 0 0 1-8 4M8 13v3c0 1.1 2.2 2 5 2s5-.9 5-2v-3M16 8c2.8 0 5 .9 5 2s-2.2 2-5 2",
    coffee: "M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 9h2.5a2.5 2.5 0 0 1 0 5H16M7 4c-.5.6-.5 1.2 0 1.8M11 4c-.5.6-.5 1.2 0 1.8",
    food: "M7 3v18M5 3v6a2 2 0 0 0 4 0V3M17 3c-1.7 0-3 2.2-3 5s1.3 4 3 4v9",
    car: "M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2M9 17h6M3 9h13M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M15 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
    fuel: "M3 21h12M5 21V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v16M5 11h8M15 7l3 3v6a1.5 1.5 0 0 0 3 0V9l-3-3",
    plane: "M22 2 11 13M22 2 15 22 11 13 2 9z",
    train: "M8 4h8a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zM5 11h14M9 4v3M15 4v3M9 17l-2 4M15 17l2 4M9.5 14h.01M14.5 14h.01",
    bike: "M6 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M18 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M6 17l3.5-8h4M9.5 9l4 8M13.5 9H17l1.5 3M9 7h4",
    pill: "M10.5 20.5 3.5 13.5a4.95 4.95 0 0 1 7-7l7 7a4.95 4.95 0 0 1-7 7zM8.5 8.5l7 7",
    cross: "M9 3h6a1 1 0 0 1 1 1v4h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-4v4a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-4H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h4V4a1 1 0 0 1 1-1z",
    book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
    music: "M9 17V4l11-2v13M9 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M20 15m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
    film: "M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM7 3v18M17 3v18M3 8h4M3 12h4M3 16h4M17 8h4M17 12h4M17 16h4",
    game: "M6 12h4M8 10v4M15 11h.01M18 13h.01M7 6h10a5 5 0 0 1 5 5v2a5 5 0 0 1-5 5c-1.6 0-2.2-1-3.5-1h-3c-1.3 0-1.9 1-3.5 1a5 5 0 0 1-5-5v-2a5 5 0 0 1 5-5z",
    tv: "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM8 21h8M12 17v4",
    dumbbell: "M2 12h1.5M20.5 12H22M5 8v8M19 8v8M8 9.5v5M16 9.5v5M8 12h8",
    gift: "M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8M3 8h18v4H3zM12 21V8M12 8S10.5 3 7.5 3A2.5 2.5 0 0 0 7.5 8zM12 8s1.5-5 4.5-5a2.5 2.5 0 0 1 0 5z",
    paw: "M5 11m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M19 11m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M9 6.5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M15 6.5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M12 13a4 4 0 0 0-3.8 5.3c.3 1 1.2 1.7 2.2 1.7h3.2c1 0 1.9-.7 2.2-1.7A4 4 0 0 0 12 13z",
    shirt: "M9 4 4 6l1.5 4L8 9v11h8V9l2.5 1L20 6l-5-2a3 3 0 0 1-6 0z",
    scissors: "M6 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M6 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12",
    phone: "M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2",
    bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z",
    droplet: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z",
    flame: "M12 12c2-2.96 0-7-1-8 0 3.04-1.77 4.74-3 6-1.23 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.53-1.06-3.94-2-5-1.23 1.26-1.77 2.96-3 4z",
    umbrella: "M12 2v2M12 22a2 2 0 0 0 2-2v-7M3 13a9 9 0 0 1 18 0H3z",
    receipt: "M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21zM8 7h8M8 11h8M8 15h5",
    card: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18M7 15h2",
    sack: "M9 4h6l1.2 3H7.8zM7.8 7h8.4a6 6 0 0 1 2 5v3a5 5 0 0 1-5 5h-2.4a5 5 0 0 1-5-5v-3a6 6 0 0 1 2-5z",
    briefcase: "M4 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM8 21V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v16M2 13h20",
    leaf: "M3 17c0-7 4-11 18-11 0 11-7 13-13 13-3 0-5-1-5-2zM5 21c1-5 4-9 9-11",
    key: "M15.5 7.5m-4.5 0a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0M12.3 10.7 3 20v1h3v-2h2v-2h2l2.3-2.3M16 6h.01",
    tools: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z",
    bag: "M6 7h12l-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1zM9 7V5a3 3 0 0 1 6 0v2",
    tag: "M20.6 12.6 12 21l-9-9V5a2 2 0 0 1 2-2h7zM7 7h.01",
  };
  if (name === "google") {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" style={{ flex: "none" }}>
        <path fill="#4285F4" d="M45 24c0-1.6-.1-2.7-.4-3.9H24v7.5h11.8c-.2 1.9-1.5 4.8-4.4 6.7l-.04.3 6.4 5 .4.04C42.6 36.5 45 30.8 45 24z" />
        <path fill="#34A853" d="M24 46c5.8 0 10.7-1.9 14.2-5.2l-6.8-5.2c-1.8 1.3-4.3 2.2-7.4 2.2-5.7 0-10.5-3.8-12.2-9l-.3.02-6.6 5.1-.1.3C8.3 41 15.6 46 24 46z" />
        <path fill="#FBBC05" d="M11.8 28.8c-.5-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2l-.02-.3-6.7-5.2-.2.1C3.3 18.1 2.5 21 2.5 24s.8 5.9 2.2 8.4l7.1-3.6z" />
        <path fill="#EA4335" d="M24 9.5c4 0 6.8 1.7 8.3 3.2l6.1-5.9C34.7 3.4 29.8 1.5 24 1.5 15.6 1.5 8.3 6.5 5.7 13.7l7.1 5.5c1.7-5.2 6.5-9.7 11.2-9.7z" />
      </svg>
    );
  }
  // BoxIcons (visual profissional)
  if (BX[name]) {
    return <i className={"bx " + BX[name]} style={{ fontSize: size, color, lineHeight: 1, display: "inline-flex", flex: "none", ...style }} aria-hidden="true" />;
  }
  // emoji (categorias personalizadas) — qualquer caractere não-ASCII
  if (name && !P[name] && /[^\x00-\x7F]/.test(name)) {
    return <span style={{ fontSize: Math.round(size * 0.96), lineHeight: 1, width: size, height: size, display: "inline-grid", placeItems: "center", flex: "none" }}>{name}</span>;
  }
  // fallback: SVG próprio (ícones sem equivalente em BoxIcons)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", ...style }}>
      <path d={P[name] || P.dots} />
    </svg>
  );
}
window.Icon = Icon;
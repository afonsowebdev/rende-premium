/* ===== Finance store: auth + dados via API (backend) + seletores derivados ===== */
const FinanceContext = React.createContext(null);
const useFinance = () => React.useContext(FinanceContext);

const LS = { acc: "bm_account" }; // só uma cache local da conta (para pré-preencher o login)
const load = (k, fb) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : fb; } catch { return fb; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const EMPTY_DATA = { despesas: [], rendimentos: [], metas: [], orcamento: null, contas: [], poupancaPct: 20, customCats: [], aforros: [] };
// paleta de cores das metas (o backend não guarda a cor; mantemo-la de forma estável aqui)
const PALETA = ["var(--c-educacao)", "var(--c-alimentacao)", "var(--c-habitacao)", "var(--c-transporte)", "var(--c-lazer)", "var(--c-internet)"];
// estado "concluída" das metas, guardado localmente (fiável mesmo que o backend ainda não suporte o campo)
const FECH_KEY = "rende_metas_fechadas";
const lerFechadas = () => { try { return JSON.parse(localStorage.getItem(FECH_KEY) || "{}"); } catch (e) { return {}; } };
const gravarFechadas = (map) => { try { localStorage.setItem(FECH_KEY, JSON.stringify(map)); } catch (e) {} };
// arquivos de organizações anteriores (ao mudar de país/moeda), guardados localmente
const ARQ_KEY = "rende_arquivos";
const lerArquivos = () => { try { return JSON.parse(localStorage.getItem(ARQ_KEY) || "[]"); } catch (e) { return []; } };
const gravarArquivos = (arr) => { try { localStorage.setItem(ARQ_KEY, JSON.stringify(arr)); } catch (e) {} };
// registo de atividade (alterações: criou/editou/eliminou), guardado localmente por utilizador
const ATIV_KEY = (email) => "rende_ativ_" + (email || "anon");
const lerAtiv = (email) => { try { return JSON.parse(localStorage.getItem(ATIV_KEY(email)) || "[]"); } catch (e) { return []; } };
const gravarAtiv = (email, arr) => { try { localStorage.setItem(ATIV_KEY(email), JSON.stringify(arr)); } catch (e) {} };
const mkeyLocal = (dt) => dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0");

// mostra um erro de forma simples (pode-se trocar por algo mais bonito no futuro)
const erroAlerta = (e) => { console.error(e); try { alert("Rende+: " + (e && e.message ? e.message : "ocorreu um erro.")); } catch (_) {} };

function FinanceProvider({ children }) {
  const [account, setAccount] = React.useState(() => load(LS.acc, null));
  const [session, setSession] = React.useState(null); // só fica preenchido depois de validar o token
  const [data, setData] = React.useState(() => ({ ...EMPTY_DATA }));
  const [month, setMonth] = React.useState(() => BM.todayISO().slice(0, 7));
  const pctTimer = React.useRef(null); // debounce para gravar a % de poupança

  // guarda a conta em cache local (para o ecrã de login pré-preencher)
  React.useEffect(() => { if (account) save(LS.acc, account); }, [account]);

  // moeda ativa: só aplica a da conta depois de iniciar sessão; senão Euro por defeito
  BM.setCurrency((session && account && account.moeda) || "EUR");
  // regista as categorias personalizadas no catálogo partilhado
  (data.customCats || []).forEach((c) => { BM.cats[c.key] = { nome: c.nome, color: c.color, icon: c.icon, custom: true }; });

  // ---- carregar todos os dados do utilizador a partir da API ----
  const carregarTudo = async () => {
    const [perfil, despesas, rendimentos, metasRaw, contas, categorias] = await Promise.all([
      API.perfil(),
      API.listar("despesas"),
      API.listar("rendimentos"),
      API.listar("metas"),
      API.listar("contas"),
      API.listar("categorias"),
    ]);
    const aforros = [];
    const fech = lerFechadas();
    const metas = (metasRaw || []).map((m, i) => {
      (m.aforros || []).forEach((a) => aforros.push({ id: a.id, metaId: m.id, valor: a.valor, data: a.data }));
      const { aforros: _omit, ...rest } = m;
      const fechadaEm = (rest.fechada ? rest.fechadaEm : null) || fech[m.id] || null;
      return { ...rest, cor: PALETA[i % PALETA.length], fechada: !!(rest.fechada || fech[m.id]), fechadaEm };
    });
    const customCats = (categorias || []).map((c) => ({ key: c.id, nome: c.nome, color: c.cor, icon: c.icon }));
    customCats.forEach((c) => { BM.cats[c.key] = { nome: c.nome, color: c.color, icon: c.icon, custom: true }; });

    setData({ ...EMPTY_DATA, despesas, rendimentos, metas, aforros, contas, customCats,
      orcamento: perfil.orcamento || null, poupancaPct: perfil.poupancaPct ?? 20 });
    setAccount((a) => ({ ...(a || {}), email: perfil.email, nome: perfil.nome, moeda: perfil.moeda, poupancaPct: perfil.poupancaPct, orcamento: perfil.orcamento }));
    setSession(perfil.email || true);
  };

  // ao abrir a app: se houver token guardado, tenta carregar a sessão
  React.useEffect(() => {
    if (API.getToken()) {
      carregarTudo().catch((e) => { console.error(e); API.setToken(null); setSession(null); });
    }
  }, []);

  // ---- auth ----
  const signup = async (info) => {
    const resp = await API.registar({ email: info.email, password: info.password, nome: info.nome, moeda: info.moeda });
    API.setToken(resp.token);
    const extra = { idade: info.idade, cidade: info.cidade, pais: info.pais, perfil: info.perfil, estado: info.estado, habitacao: info.habitacao };
    setAccount((a) => ({ ...(a || {}), ...(resp.user || {}), ...extra }));
    await carregarTudo();
  };
  const login = async (email, pass) => {
    const resp = await API.login({ email, password: pass });
    API.setToken(resp.token);
    setAccount((a) => ({ ...(a || {}), ...(resp.user || {}) }));
    await carregarTudo();
  };
  const logout = () => { API.setToken(null); setSession(null); setData({ ...EMPTY_DATA }); };

  // campos do perfil que o servidor guarda
  const camposServidor = ["nome", "moeda", "poupancaPct", "orcamento"];
  const updateAccount = (patch) => {
    setAccount((a) => ({ ...(a || {}), ...patch }));
    const servidor = {};
    camposServidor.forEach((k) => { if (patch[k] !== undefined) servidor[k] = patch[k]; });
    if (Object.keys(servidor).length && API.getToken()) {
      API.atualizarPerfil(servidor).catch((e) => console.error(e));
    }
  };
  const resetData = async () => {
    try {
      const apaga = (rec, arr) => Promise.all((arr || []).map((x) => API.apagar(rec, x.id).catch(() => {})));
      await Promise.all([
        apaga("despesas", data.despesas),
        apaga("rendimentos", data.rendimentos),
        apaga("metas", data.metas),
        apaga("contas", data.contas),
        apaga("categorias", (data.customCats || []).map((c) => ({ id: c.key }))),
      ]);
      setData({ ...EMPTY_DATA });
      try { if (window.PremiumStore && window.PremiumStore.reset) window.PremiumStore.reset(); } catch (e) {}
    } catch (e) { erroAlerta(e); }
  };

  // ---- mudar de localização: muda só a cidade, OU (ao mudar de país) arquiva tudo e recomeça do zero na nova moeda ----
  const [arquivos, setArquivos] = React.useState(() => lerArquivos());
  const mudarLocalizacao = async ({ pais, cidade }) => {
    const a = account || {};
    const mudouPais = pais && pais !== a.pais;
    if (!mudouPais) {
      setAccount((x) => ({ ...(x || {}), cidade: cidade != null ? cidade : (x && x.cidade) || "" }));
      return { reset: false };
    }
    const novaMoeda = BM.currencyForCountry(pais);
    const soma = (arr) => (arr || []).reduce((s, x) => s + (+x.valor || 0), 0);
    const temDados = ((data.despesas || []).length + (data.rendimentos || []).length + (data.metas || []).length) > 0;
    if (temDados) {
      const snap = {
        id: String(Date.now()),
        pais: a.pais || null, moeda: a.moeda || "EUR", cidade: a.cidade || null,
        dataArquivo: BM.todayISO(),
        totais: {
          rendimentos: soma(data.rendimentos), despesas: soma(data.despesas),
          poupado: (data.metas || []).reduce((s, m) => s + (+m.atual || 0), 0),
          nDespesas: (data.despesas || []).length, nRendimentos: (data.rendimentos || []).length, nMetas: (data.metas || []).length,
        },
        dados: { despesas: data.despesas || [], rendimentos: data.rendimentos || [], metas: data.metas || [], aforros: data.aforros || [], orcamento: data.orcamento || null },
      };
      const novos = [snap, ...lerArquivos()];
      gravarArquivos(novos); setArquivos(novos);
      const apaga = (rec, arr) => Promise.all((arr || []).map((x) => API.apagar(rec, x.id).catch(() => {})));
      await Promise.all([apaga("despesas", data.despesas), apaga("rendimentos", data.rendimentos), apaga("metas", data.metas)]);
      setData((d) => ({ ...EMPTY_DATA, customCats: d.customCats, poupancaPct: d.poupancaPct }));
      setMonth(BM.todayISO().slice(0, 7));
    }
    updateAccount({ pais, cidade: cidade || "", moeda: novaMoeda });
    return { reset: temDados, moeda: novaMoeda };
  };
  const apagarArquivo = (id) => { const novos = lerArquivos().filter((x) => x.id !== id); gravarArquivos(novos); setArquivos(novos); };

  // ---- recuperação de senha (demo; ainda não ligada ao backend) ----
  const emailExists = () => true;
  const genResetCode = () => String(Math.floor(100000 + Math.random() * 900000));
  const resetPassword = () => {};

  // ---- registo de atividade (#3) + Anular ao eliminar (#4) ----
  const accEmail = (account && account.email) || null;
  const [atividade, setAtividade] = React.useState(() => lerAtiv(accEmail));
  React.useEffect(() => { setAtividade(lerAtiv(accEmail)); }, [accEmail]);
  const registarAtividade = (acao, tipo, rotulo, valor) => {
    setAtividade((prev) => {
      const ev = { id: (BM.uid ? BM.uid() : String(Date.now())), ts: Date.now(), acao, tipo, rotulo: rotulo || "", valor: (valor == null ? null : +valor) };
      const next = [ev, ...prev].slice(0, 400);
      gravarAtiv(accEmail, next);
      return next;
    });
  };
  const limparAtividade = () => { gravarAtiv(accEmail, []); setAtividade([]); };

  // toast com ação "Anular" (apoia o #4)
  const [toast, setToast] = React.useState(null);
  const toastTimer = React.useRef(null);
  const notify = (msg, undo) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, undo });
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  };

  // referência ao estado mais recente (para recuperar um item ao Anular)
  const dataRef = React.useRef(data);
  React.useEffect(() => { dataRef.current = data; });

  // ---- CRUD genérico (cria/edita/apaga no servidor e atualiza o estado local) ----
  // desc (opcional): { tipo, rotulo:(x)=>txt, valor:(x)=>num, undo:bool } — alimenta o histórico e o Anular
  const crud = (key, recurso, paraApi, daApi, desc) => ({
    add: async (item) => {
      try {
        const criado = await API.criar(recurso, paraApi ? paraApi(item) : item);
        const local = daApi ? daApi(criado) : criado;
        setData((d) => ({ ...d, [key]: [...d[key], local] }));
        if (desc) registarAtividade("criou", desc.tipo, desc.rotulo(local), desc.valor ? desc.valor(local) : null);
        return local;
      } catch (e) { erroAlerta(e); }
    },
    edit: async (id, patch) => {
      try {
        const at = await API.editar(recurso, id, paraApi ? paraApi(patch) : patch);
        const local = daApi ? daApi(at) : at;
        setData((d) => ({ ...d, [key]: d[key].map((x) => (x.id === id ? { ...x, ...local } : x)) }));
        if (desc) registarAtividade("editou", desc.tipo, desc.rotulo({ ...(dataRef.current[key] || []).find((x) => x.id === id), ...local }), desc.valor ? desc.valor({ ...local }) : null);
      } catch (e) { erroAlerta(e); }
    },
    remove: async (id) => {
      const snap = (dataRef.current[key] || []).find((x) => x.id === id);
      try {
        await API.apagar(recurso, id);
        setData((d) => ({ ...d, [key]: d[key].filter((x) => x.id !== id) }));
        if (desc) registarAtividade("eliminou", desc.tipo, desc.rotulo(snap || {}), desc.valor ? desc.valor(snap || {}) : null);
        if (desc && desc.undo && snap) {
          notify((desc.tipo || "Item") + " eliminado", async () => {
            try {
              const { id: _omit, ...payload } = snap;
              const criado = await API.criar(recurso, paraApi ? paraApi(payload) : payload);
              const local = daApi ? daApi(criado) : criado;
              setData((d) => ({ ...d, [key]: [...d[key], local] }));
              registarAtividade("criou", desc.tipo, (desc.rotulo(local) || "") + " (restaurado)", desc.valor ? desc.valor(local) : null);
              setToast(null);
            } catch (e) { erroAlerta(e); }
          });
        }
      } catch (e) { erroAlerta(e); }
    },
  });
  const despesa = crud("despesas", "despesas", null, null, { tipo: "Despesa", rotulo: (x) => x.nome || "", valor: (x) => x.valor, undo: true });
  const rendimento = crud("rendimentos", "rendimentos", null, null, { tipo: "Rendimento", rotulo: (x) => x.fonte || "", valor: (x) => x.valor, undo: true });
  const conta = crud("contas", "contas", null, null, { tipo: "Conta", rotulo: (x) => x.nome || x.banco || "" });

  // metas (poupanças): criar com saldo inicial regista um depósito datado
  const meta = {
    edit: async (id, patch) => {
      try {
        const m = await API.editar("metas", id, patch);
        setData((d) => ({ ...d, metas: d.metas.map((x) => (x.id === id ? { ...x, ...m, cor: patch.cor !== undefined ? patch.cor : x.cor } : x)) }));
      } catch (e) { erroAlerta(e); }
    },
    add: async (item) => {
      try {
        const atual = +item.atual || 0;
        const m = await API.criar("metas", { nome: item.nome, alvo: +item.alvo || 0, atual });
        let novoAforro = null;
        const ini = !!item.inicial; // poupança que o utilizador já tinha (não desconta da receita deste mês)
        const dataAforro = ini ? prevMonthISO() : BM.todayISO();
        if (atual > 0) novoAforro = await API.criar("aforros", { metaId: m.id, valor: atual, data: dataAforro, inicial: ini });
        setData((d) => ({
          ...d,
          metas: [...d.metas, { ...m, cor: item.cor || PALETA[d.metas.length % PALETA.length] }],
          aforros: novoAforro ? [...(d.aforros || []), { ...novoAforro, inicial: ini, data: novoAforro.data || dataAforro }] : (d.aforros || []),
        }));
        registarAtividade("criou", "Meta", item.nome, item.alvo);
        return m;
      } catch (e) { erroAlerta(e); }
    },
    remove: async (id) => {
      try {
        await API.apagar("metas", id);
        const map = lerFechadas(); delete map[id]; gravarFechadas(map);
        const snapMeta = (dataRef.current.metas || []).find((x) => x.id === id);
        setData((d) => ({ ...d, metas: d.metas.filter((x) => x.id !== id), aforros: (d.aforros || []).filter((a) => a.metaId !== id) }));
        registarAtividade("eliminou", "Meta", snapMeta ? snapMeta.nome : "");
      } catch (e) { erroAlerta(e); }
    },
    fechar: async (id) => {
      const mes = BM.monthKey(BM.todayISO());
      const map = lerFechadas(); map[id] = mes; gravarFechadas(map);
      setData((d) => ({ ...d, metas: d.metas.map((x) => (x.id === id ? { ...x, fechada: true, fechadaEm: mes } : x)) }));
      try { await API.editar("metas", id, { fechada: true, fechadaEm: mes }); } catch (e) {}
    },
    reabrir: async (id) => {
      const map = lerFechadas(); delete map[id]; gravarFechadas(map);
      setData((d) => ({ ...d, metas: d.metas.map((x) => (x.id === id ? { ...x, fechada: false, fechadaEm: null } : x)) }));
      try { await API.editar("metas", id, { fechada: false, fechadaEm: null }); } catch (e) {}
    },
  };
  // depositar numa poupança: soma ao acumulado e regista um movimento datado
  const prevMonthISO = () => { const d = new Date(); d.setDate(1); d.setDate(0); return d.toISOString().slice(0, 10); };
  const deposit = async (id, valor, inicial = false) => {
    try {
      const m = (data.metas || []).find((x) => x.id === id);
      const novo = (m ? (+m.atual || 0) : 0) + (+valor || 0);
      const capado = (m && m.alvo > 0) ? Math.min(m.alvo, novo) : novo;
      await API.editar("metas", id, { atual: capado });
      const dataAforro = inicial ? prevMonthISO() : BM.todayISO();
      const aforro = await API.criar("aforros", { metaId: id, valor: +valor || 0, data: dataAforro, inicial: !!inicial });
      setData((d) => ({
        ...d,
        metas: d.metas.map((x) => (x.id === id ? { ...x, atual: capado } : x)),
        aforros: [...(d.aforros || []), { ...aforro, inicial: !!inicial, data: aforro.data || dataAforro }],
      }));
      registarAtividade("criou", "Depósito", (m ? m.nome : ""), valor);
    } catch (e) { erroAlerta(e); }
  };

  const setOrcamento = async (v) => {
    try { await API.atualizarPerfil({ orcamento: v }); setData((d) => ({ ...d, orcamento: v })); setAccount((a) => ({ ...(a || {}), orcamento: v })); }
    catch (e) { erroAlerta(e); }
  };
  const setPoupancaPct = (v) => {
    // atualiza o ecrã já (sem esperar o servidor) — evita o tremor do slider ao arrastar
    setData((d) => ({ ...d, poupancaPct: v }));
    setAccount((a) => ({ ...(a || {}), poupancaPct: v }));
    // grava no servidor só quando o utilizador pára de arrastar (debounce)
    clearTimeout(pctTimer.current);
    pctTimer.current = setTimeout(() => {
      API.atualizarPerfil({ poupancaPct: v }).catch((e) => erroAlerta(e));
    }, 400);
  };

  // categorias de despesa personalizadas
  const addCategory = async ({ nome, color, icon }) => {
    try {
      const c = await API.criar("categorias", { nome, cor: color, icon });
      const key = c.id;
      BM.cats[key] = { nome, color, icon, custom: true };
      setData((d) => ({ ...d, customCats: [...(d.customCats || []), { key, nome, color, icon }] }));
      return key;
    } catch (e) { erroAlerta(e); }
  };
  const removeCategory = async (key) => {
    try {
      await API.apagar("categorias", key);
      delete BM.cats[key];
      setData((d) => ({ ...d, customCats: (d.customCats || []).filter((c) => c.key !== key) }));
    } catch (e) { erroAlerta(e); }
  };

  // ---- contas ligadas (Revolut / Wise) ----
  const connectBank = async (bancoKey) => {
    try {
      const preset = BM.bancos[bancoKey];
      if (!preset) return;
      const c = await API.criar("contas", { banco: bancoKey, nome: preset.nome, saldo: preset.saldoInicial, moeda: preset.moeda, ligadoEm: BM.todayISO() });
      setData((d) => ({ ...d, contas: [...d.contas, c] }));
    } catch (e) { erroAlerta(e); }
  };
  const disconnectBank = async (id) => {
    try { await API.apagar("contas", id); setData((d) => ({ ...d, contas: d.contas.filter((c) => c.id !== id) })); }
    catch (e) { erroAlerta(e); }
  };
  const importMovs = async (id, movs) => {
    try {
      const c = (data.contas || []).find((x) => x.id === id);
      if (!c) return;
      const tag = c.banco;
      const novasDesp = [], novosRend = [];
      for (const m of movs) {
        if (m.kind === "despesa") {
          novasDesp.push(await API.criar("despesas", { nome: m.nome, cat: m.cat, valor: m.valor, data: BM.todayISO(), tipo: m.tipo, origem: tag }));
        } else if (m.kind === "rendimento") {
          novosRend.push(await API.criar("rendimentos", { fonte: m.nome, cat: m.cat, valor: m.valor, data: BM.todayISO(), rec: false, origem: tag }));
        }
      }
      const sinc = await API.editar("contas", id, { sincronizadoEm: BM.todayISO() });
      setData((d) => ({
        ...d,
        despesas: [...d.despesas, ...novasDesp],
        rendimentos: [...d.rendimentos, ...novosRend],
        contas: d.contas.map((x) => (x.id === id ? { ...x, sincronizadoEm: sinc.sincronizadoEm } : x)),
      }));
    } catch (e) { erroAlerta(e); }
  };

  // ---- seletores derivados (recalculam a cada alteração) ----
  const sel = React.useMemo(() => {
    const inMonth = (iso) => BM.monthKey(iso) === month;
    const despMes = data.despesas.filter((x) => inMonth(x.data));
    const rendMes = data.rendimentos.filter((x) => inMonth(x.data));
    const totalGasto = despMes.reduce((s, x) => s + (+x.valor || 0), 0);
    const totalRec = rendMes.reduce((s, x) => s + (+x.valor || 0), 0);
    const fixas = despMes.filter((x) => x.tipo === "fixa").reduce((s, x) => s + (+x.valor || 0), 0);
    const variaveis = totalGasto - fixas;
    const poupado = data.metas.reduce((s, m) => s + (+m.atual || 0), 0);
    const saldo = totalRec - totalGasto;
    const poupancaPct = data.poupancaPct ?? 20;
    const planoTotal = saldo > 0 ? Math.round((poupancaPct / 100) * saldo * 100) / 100 : 0;
    const poupadoMes = (data.aforros || []).filter((a) => !a.inicial && BM.monthKey(a.data) === month).reduce((s, a) => s + (+a.valor || 0), 0);
    const poupancaSeparada = Math.max(poupadoMes, planoTotal);
    const poupancaPlano = planoTotal;
    const disponivel = saldo - poupancaSeparada;

    const byCat = {};
    despMes.forEach((x) => { byCat[x.cat] = (byCat[x.cat] || 0) + (+x.valor || 0); });
    const catBreak = Object.keys(byCat)
      .map((k) => ({ key: k, nome: (BM.cats[k] || BM.cats.outros).nome, color: (BM.cats[k] || BM.cats.outros).color, valor: byCat[k] }))
      .sort((a, b) => b.valor - a.valor);

    const byInc = {};
    rendMes.forEach((x) => { byInc[x.cat] = (byInc[x.cat] || 0) + (+x.valor || 0); });
    const incBreak = Object.keys(byInc)
      .map((k) => ({ key: k, nome: k, color: BM.incomeCats[k] || "var(--c-outros)", valor: byInc[k] }))
      .sort((a, b) => b.valor - a.valor);

    const [yy, mm] = month.split("-").map(Number);
    const mkey = (dt) => dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0");
    const series = [];
    const windowStart = mkey(new Date(yy, mm - 1 - 5, 1));
    let acum = (data.aforros || []).filter((a) => BM.monthKey(a.data) < windowStart).reduce((s, a) => s + (+a.valor || 0), 0);
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(yy, mm - 1 - i, 1);
      const key = mkey(dt);
      const rec = data.rendimentos.filter((x) => BM.monthKey(x.data) === key).reduce((s, x) => s + (+x.valor || 0), 0);
      const gasto = data.despesas.filter((x) => BM.monthKey(x.data) === key).reduce((s, x) => s + (+x.valor || 0), 0);
      const pou = (data.aforros || []).filter((a) => BM.monthKey(a.data) === key).reduce((s, a) => s + (+a.valor || 0), 0);
      acum += pou;
      series.push({ m: BM.MESES[dt.getMonth()], key, rec, gasto, pou, poupAcum: acum });
    }
    const allKeys = Array.from(new Set([...data.despesas, ...data.rendimentos].map((x) => BM.monthKey(x.data)))).filter(Boolean).sort().reverse();
    const historico = allKeys.map((key) => {
      const [y, m] = key.split("-").map(Number);
      const rec = data.rendimentos.filter((x) => BM.monthKey(x.data) === key).reduce((s, x) => s + (+x.valor || 0), 0);
      const gasto = data.despesas.filter((x) => BM.monthKey(x.data) === key).reduce((s, x) => s + (+x.valor || 0), 0);
      return { key, label: `${BM.MESES[m - 1]} ${y}`, rec, gasto, atual: key === month };
    });

    const winKeys = series.map((s) => s.key);
    const metaSeries = data.metas.map((m) => {
      const af = (data.aforros || []).filter((a) => a.metaId === m.id);
      let acum = af.filter((a) => BM.monthKey(a.data) < winKeys[0]).reduce((s, a) => s + (+a.valor || 0), 0);
      const points = winKeys.map((k) => { acum += af.filter((a) => BM.monthKey(a.data) === k).reduce((s, a) => s + (+a.valor || 0), 0); return acum; });
      return { id: m.id, nome: m.nome, cor: m.cor, alvo: +m.alvo || 0, atual: +m.atual || 0, fechada: !!m.fechada, fechadaEm: m.fechadaEm || null, points };
    });

    return { despMes, rendMes, totalGasto, totalRec, fixas, variaveis, poupado, saldo, poupancaPct, poupancaPlano, planoTotal, poupadoMes, poupancaSeparada, disponivel, catBreak, incBreak, series, metaSeries, historico };
  }, [data, month]);

  const monthLabel = (() => { const [y, m] = month.split("-").map(Number); return `${BM.MESES[m - 1]} ${y}`; })();
  const realMonth = BM.todayISO().slice(0, 7);
  const isCurrentMonth = month >= realMonth;
  const shiftMonth = (delta) => {
    const [y, m] = month.split("-").map(Number);
    const key = mkeyLocal(new Date(y, m - 1 + delta, 1));
    if (key > realMonth) return;
    setMonth(key);
  };
  const goToday = () => setMonth(realMonth);

  const bancosTotal = data.contas.reduce((s, c) => s + (+c.saldo || 0), 0);

  const value = {
    account, session, data, month, monthLabel, realMonth, isCurrentMonth,
    signup, login, logout, updateAccount, resetData, mudarLocalizacao, arquivos, apagarArquivo,
    emailExists, genResetCode, resetPassword,
    cur: BM.curInfo(), curSym: BM.curInfo().sym, setCurrency: (code) => updateAccount({ moeda: code }),
    despesa, rendimento, meta, conta, deposit, setOrcamento, setPoupancaPct, addCategory, removeCategory,
    connectBank, disconnectBank, importMovs, bancosTotal,
    atividade, registarAtividade, limparAtividade, notify,
    setMonth, shiftMonth, goToday, ...sel,
  };
  return (
    <FinanceContext.Provider value={value}>
      {children}
      {toast && (
        <div style={{ position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)", zIndex: 9500, background: "var(--ink, #0f1a16)", color: "#fff", borderRadius: 13, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 12px 30px rgba(0,0,0,.25)", fontSize: 14, fontWeight: 600, maxWidth: "calc(100vw - 32px)" }}>
          <span>{toast.msg}</span>
          {toast.undo && <button onClick={toast.undo} style={{ background: "none", border: "none", color: "var(--accent, #14a06b)", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Anular</button>}
          <button onClick={() => setToast(null)} aria-label="Fechar" style={{ background: "none", border: "none", color: "rgba(255,255,255,.6)", fontWeight: 700, fontSize: 16, cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
        </div>
      )}
    </FinanceContext.Provider>
  );
}

Object.assign(window, { FinanceContext, useFinance, FinanceProvider });
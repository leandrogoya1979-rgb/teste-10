// ── BPO Tracker – Store (localStorage) ──────────────────────────────────────
const KEYS = {
  config: 'bpo_config',
  clientes: 'bpo_clientes',
  apontamentos: 'bpo_apontamentos',
  sessao: 'bpo_sessao'
};

const Store = {
  _get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  _set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },

  // Sessão
  getSessao() { return this._get(KEYS.sessao); },
  setSessao(s) { this._set(KEYS.sessao, s); },
  clearSessao() { localStorage.removeItem(KEYS.sessao); },

  // Config
  getConfig() {
    return this._get(KEYS.config) || {
      custoFixo: 0,
      quantPessoas: 0,
      horasPorPessoa: 0,
      percPerdaPessoa: 20,
      percPerdaTime: 20,
      markup: 2.5
    };
  },
  setConfig(c) { this._set(KEYS.config, c); },

  // Derived calculations from config
  calcConfig() {
    const c = this.getConfig();
    const horasCompanhia   = (c.quantPessoas || 0) * (c.horasPorPessoa || 0);
    const perdaPessoaHoras = (c.horasPorPessoa || 0) * (c.percPerdaPessoa || 0) / 100;
    const perdaTimeHoras   = horasCompanhia * (c.percPerdaTime || 0) / 100;
    const horasMinimas     = horasCompanhia - perdaTimeHoras;
    const custoHora        = horasMinimas > 0 ? (c.custoFixo || 0) / horasMinimas : 0;
    const valorVenda       = custoHora * (c.markup || 0);
    return { ...c, horasCompanhia, perdaPessoaHoras, perdaTimeHoras, horasMinimas, custoHora, valorVenda };
  },

  getCustoHora() {
    return this.calcConfig().custoHora;
  },

  // Clientes
  getClientes() { return this._get(KEYS.clientes) || []; },
  addCliente(c) {
    const list = this.getClientes();
    c.id = Date.now().toString();
    list.push(c);
    this._set(KEYS.clientes, list);
    return c;
  },
  removeCliente(id) {
    this._set(KEYS.clientes, this.getClientes().filter(c => c.id !== id));
  },
  getClienteById(id) { return this.getClientes().find(c => c.id === id); },

  // Apontamentos
  getApontamentos() { return this._get(KEYS.apontamentos) || []; },
  addApontamento(a) {
    const list = this.getApontamentos();
    a.id = Date.now().toString();
    list.push(a);
    this._set(KEYS.apontamentos, list);
    return a;
  },
  removeApontamento(id) {
    this._set(KEYS.apontamentos, this.getApontamentos().filter(a => a.id !== id));
  },
  getApontamentosByCliente(cid) {
    return this.getApontamentos().filter(a => a.clienteId === cid);
  },
  getTotalMinutosCliente(cid) {
    return this.getApontamentosByCliente(cid).reduce((s, a) => s + (a.minutos || 0), 0);
  },
  getMinutosMes() {
    const now = new Date();
    const m = now.getMonth(), y = now.getFullYear();
    return this.getApontamentos()
      .filter(a => { const d = new Date(a.data); return d.getMonth()===m && d.getFullYear()===y; })
      .reduce((s, a) => s + (a.minutos || 0), 0);
  }
};

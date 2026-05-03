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
    return this._get(KEYS.config) || { custoFixo: 0, horasUteis: 0 };
  },
  setConfig(c) { this._set(KEYS.config, c); },
  getCustoHora() {
    const c = this.getConfig();
    return c.horasUteis > 0 ? c.custoFixo / c.horasUteis : 0;
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

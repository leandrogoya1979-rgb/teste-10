// ── BPO Tracker – Views (HTML templates) ────────────────────────────────────

const fmt = {
  brl: v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0),
  hrs: m => { const h=Math.floor((m||0)/60),mm=String((m||0)%60).padStart(2,'0'); return `${h}h ${mm}m`; },
  date: d => d ? new Date(d).toLocaleDateString('pt-BR') : '-',
  pct: (a,b) => b>0 ? ((a/b)*100).toFixed(0)+'%' : '0%'
};

// ── Login ───────────────────────────────────────────────────────────────────
function viewLogin() {
  return `
  <div class="login-page">
    <div class="login-box">
      <div class="login-brand">
        <div class="brand-icon">⏱</div>
        <div class="brand-name">BPO Tracker</div>
        <div class="brand-tagline">Gestão de Tempo & Rentabilidade</div>
      </div>
      <div class="form-group">
        <label class="form-label">Seu nome</label>
        <input id="login-nome" class="form-control" type="text" placeholder="Ex: João Silva" />
      </div>
      <div class="form-group">
        <label class="form-label">Perfil de acesso</label>
        <div class="role-selector">
          <button class="role-card selected" id="role-gestor" onclick="selectRole('gestor')">
            <div class="role-icon">👑</div>
            <div class="role-name">Gestor</div>
          </button>
          <button class="role-card" id="role-colaborador" onclick="selectRole('colaborador')">
            <div class="role-icon">🧑‍💼</div>
            <div class="role-name">Colaborador</div>
          </button>
        </div>
      </div>
      <input type="hidden" id="login-role" value="gestor" />
      <button class="btn btn-primary" style="width:100%;margin-top:8px;justify-content:center;padding:13px" onclick="doLogin()">
        Entrar no sistema →
      </button>
    </div>
  </div>`;
}

// ── Sidebar ─────────────────────────────────────────────────────────────────
function viewSidebar(sessao, route) {
  const isGestor = sessao.perfil === 'gestor';
  const nav = isGestor ? `
    <div class="nav-section-label">Principal</div>
    <button class="nav-item ${route==='dashboard'?'active':''}" onclick="navigate('dashboard')">
      <span class="nav-icon">📊</span> Dashboard
    </button>
    <div class="nav-section-label" style="margin-top:8px">Gestão</div>
    <button class="nav-item ${route==='clientes'?'active':''}" onclick="navigate('clientes')">
      <span class="nav-icon">🏢</span> Carteira de Clientes
    </button>
    <button class="nav-item ${route==='apontamentos'?'active':''}" onclick="navigate('apontamentos')">
      <span class="nav-icon">📋</span> Apontamentos
    </button>
    <button class="nav-item ${route==='relatorios'?'active':''}" onclick="navigate('relatorios')">
      <span class="nav-icon">📈</span> Relatórios
    </button>
    <div class="nav-section-label" style="margin-top:8px">Configurações</div>
    <button class="nav-item ${route==='config'?'active':''}" onclick="navigate('config')">
      <span class="nav-icon">⚙️</span> Custo do Escritório
    </button>
  ` : `
    <div class="nav-section-label">Timer</div>
    <button class="nav-item ${route==='timer'?'active':''}" onclick="navigate('timer')">
      <span class="nav-icon">⏱</span> Apontamento de Horas
    </button>
  `;

  return `
    <div class="sidebar-logo">
      <div class="logo-mark">
        <div class="logo-icon">⏱</div>
        <div>
          <div class="logo-text">BPO Tracker</div>
          <div class="logo-sub">v1.0</div>
        </div>
      </div>
    </div>
    <nav class="sidebar-nav">${nav}</nav>
    <div class="sidebar-footer">
      <div class="user-badge">
        <div class="avatar">${sessao.nome.charAt(0).toUpperCase()}</div>
        <div class="user-info">
          <div class="user-name">${sessao.nome}</div>
          <div class="user-role">${sessao.perfil}</div>
        </div>
        <button class="btn-logout" title="Sair" onclick="doLogout()">↩</button>
      </div>
    </div>`;
}

// ── Layout wrapper ───────────────────────────────────────────────────────────
function viewLayout(sessao, route, title, sub, content) {
  return `
  <div class="layout">
    <div class="sidebar-overlay" id="sidebar-overlay" onclick="closeSidebar()"></div>
    <aside class="sidebar" id="sidebar">${viewSidebar(sessao, route)}</aside>
    <div class="main">
      <div class="topbar">
        <div>
          <div class="topbar-title">${title}</div>
          ${sub ? `<div class="topbar-sub">${sub}</div>` : ''}
        </div>
        <button class="hamburger" onclick="toggleSidebar()">☰</button>
      </div>
      <div class="page">${content}</div>
    </div>
  </div>`;
}

// ── Dashboard Gestor ─────────────────────────────────────────────────────────
function viewDashboard() {
  const clientes = Store.getClientes();
  const minutosMes = Store.getMinutosMes();
  const config = Store.getConfig();
  const custoHora = Store.getCustoHora();
  const custoMes = (minutosMes / 60) * custoHora;
  const receitaMes = clientes.reduce((s, c) => s + (c.mensalidade || 0), 0);
  const lucro = receitaMes - custoMes;

  return `
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon gold">🏢</div>
      <div>
        <div class="stat-label">Clientes Ativos</div>
        <div class="stat-value">${clientes.length}</div>
        <div class="stat-sub">na carteira</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon blue">⏱</div>
      <div>
        <div class="stat-label">Horas no Mês</div>
        <div class="stat-value">${fmt.hrs(minutosMes)}</div>
        <div class="stat-sub">apontadas este mês</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon green">💰</div>
      <div>
        <div class="stat-label">Receita Mensal</div>
        <div class="stat-value" style="font-size:19px">${fmt.brl(receitaMes)}</div>
        <div class="stat-sub">mensalidades somadas</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon ${lucro>=0?'green':'red'}">📊</div>
      <div>
        <div class="stat-label">Resultado do Mês</div>
        <div class="stat-value" style="font-size:19px;color:var(--${lucro>=0?'green':'red'})">${fmt.brl(lucro)}</div>
        <div class="stat-sub">${lucro>=0?'Lucrativo':'Prejuízo'}</div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-bottom:20px">
    <div class="section-header">
      <div><div class="section-title">⚙️ Configuração do Escritório</div></div>
    </div>
    ${config.custoFixo > 0 ? `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
      <div><div class="stat-label">Custo Fixo Mensal</div><div style="font-size:18px;font-weight:700;color:var(--text-primary);margin-top:4px">${fmt.brl(config.custoFixo)}</div></div>
      <div><div class="stat-label">Horas Produtivas</div><div style="font-size:18px;font-weight:700;color:var(--text-primary);margin-top:4px">${config.horasUteis}h</div></div>
      <div><div class="stat-label">Custo/Hora</div><div style="font-size:18px;font-weight:700;color:var(--gold);margin-top:4px">${fmt.brl(custoHora)}</div></div>
    </div>` : `
    <div class="empty-state">
      <div class="empty-icon">⚙️</div>
      <div class="empty-title">Configure o custo do escritório</div>
      <div class="empty-sub">Acesse Custo do Escritório para começar</div>
      <button class="btn btn-primary" style="margin-top:16px" onclick="navigate('config')">Configurar agora →</button>
    </div>`}
  </div>

  <div class="card">
    <div class="section-header">
      <div><div class="section-title">📋 Últimos Apontamentos</div></div>
      <button class="btn btn-secondary" onclick="navigate('apontamentos')">Ver todos</button>
    </div>
    ${viewApontamentosTable(Store.getApontamentos().slice(-5).reverse(), true)}
  </div>`;
}

// ── Timer Colaborador ────────────────────────────────────────────────────────
function viewTimer(sessao) {
  const clientes = Store.getClientes();
  const opts = clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  return `
  <div class="timer-page">
    <div class="timer-container card">
      <div class="timer-client-select">
        <label class="form-label" style="text-align:left">Cliente</label>
        <select id="timer-cliente" class="form-control">
          <option value="">— Selecione o cliente —</option>
          ${opts}
        </select>
      </div>
      <div class="timer-display" id="timer-display">00:00:00</div>
      <div class="timer-status" id="timer-status">Parado</div>
      <div class="timer-controls">
        <button class="btn btn-success" id="btn-iniciar" onclick="timerIniciar()">▶ Iniciar</button>
        <button class="btn btn-secondary" id="btn-pausar" onclick="timerPausar()" disabled>⏸ Pausar</button>
        <button class="btn btn-danger" id="btn-finalizar" onclick="timerFinalizar('${sessao.nome}')" disabled>⏹ Finalizar</button>
      </div>
    </div>

    <div class="card" style="width:100%;max-width:480px">
      <div class="section-title" style="margin-bottom:16px">📋 Meus apontamentos hoje</div>
      ${viewApontamentosHoje(sessao.nome)}
    </div>
  </div>`;
}

function viewApontamentosHoje(nome) {
  const hoje = new Date().toDateString();
  const list = Store.getApontamentos().filter(a => new Date(a.data).toDateString()===hoje && a.colaborador===nome);
  if (!list.length) return `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">Nenhum apontamento hoje</div></div>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>Cliente</th><th>Duração</th><th>Hora</th></tr></thead>
    <tbody>${list.map(a => {
      const c = Store.getClienteById(a.clienteId);
      return `<tr><td>${c?c.nome:'Desconhecido'}</td><td>${fmt.hrs(a.minutos)}</td><td>${new Date(a.data).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td></tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

// ── Clientes ─────────────────────────────────────────────────────────────────
function viewClientes() {
  const list = Store.getClientes();
  return `
  <div class="card" style="margin-bottom:20px">
    <div class="section-header">
      <div><div class="section-title">➕ Novo Cliente</div></div>
    </div>

    <div class="form-row">
      <div class="form-group"><label class="form-label">Nome do Cliente</label>
        <input id="c-nome" class="form-control" placeholder="Ex: Empresa ABC Ltda" /></div>
      <div class="form-group"><label class="form-label">Mensalidade (R$)</label>
        <input id="c-mensalidade" class="form-control" type="number" min="0" placeholder="0,00" /></div>
    </div>

    <div class="ttc-block">
      <div class="ttc-legend">
        <span class="ttc-legend-item tmf">TMF — Tempo Médio Fiscal</span>
        <span class="ttc-legend-sep">+</span>
        <span class="ttc-legend-item tmc">TMC — Tempo Médio Contábil</span>
        <span class="ttc-legend-sep">+</span>
        <span class="ttc-legend-item tmp">TMP — Tempo Médio Pessoal</span>
        <span class="ttc-legend-sep">=</span>
        <span class="ttc-legend-item ttc">TTC — Total Contratado</span>
      </div>
      <div class="ttc-inputs">
        <div class="form-group">
          <label class="form-label ttc-label tmf-label">⚖️ TMF (horas)</label>
          <input id="c-tmf" class="form-control ttc-input" type="number" min="0" step="0.5" placeholder="0" oninput="calcTTC()" />
        </div>
        <div class="ttc-op">+</div>
        <div class="form-group">
          <label class="form-label ttc-label tmc-label">📒 TMC (horas)</label>
          <input id="c-tmc" class="form-control ttc-input" type="number" min="0" step="0.5" placeholder="0" oninput="calcTTC()" />
        </div>
        <div class="ttc-op">+</div>
        <div class="form-group">
          <label class="form-label ttc-label tmp-label">👤 TMP (horas)</label>
          <input id="c-tmp" class="form-control ttc-input" type="number" min="0" step="0.5" placeholder="0" oninput="calcTTC()" />
        </div>
        <div class="ttc-op">=</div>
        <div class="form-group">
          <label class="form-label ttc-label ttc-label-gold">🏆 TTC (total)</label>
          <div id="c-ttc-display" class="form-control ttc-result">0h</div>
        </div>
      </div>
    </div>

    <button class="btn btn-primary" onclick="addCliente()" style="width:100%;justify-content:center;margin-top:4px">Cadastrar Cliente</button>
  </div>

  <div class="card">
    <div class="section-header">
      <div><div class="section-title">🏢 Carteira de Clientes</div><div class="section-sub">${list.length} cliente(s) cadastrado(s)</div></div>
    </div>
    ${list.length ? `<div class="table-wrap"><table>
      <thead><tr>
        <th>Cliente</th>
        <th>Mensalidade</th>
        <th style="color:#60a5fa">TMF</th>
        <th style="color:#34d399">TMC</th>
        <th style="color:#f472b6">TMP</th>
        <th style="color:var(--gold)">TTC</th>
        <th>Horas Gastas</th>
        <th>Ações</th>
      </tr></thead>
      <tbody>${list.map(c => {
        const mins = Store.getTotalMinutosCliente(c.id);
        const ttc = (c.tmf||0) + (c.tmc||0) + (c.tmp||0);
        return `<tr>
          <td><strong>${c.nome}</strong></td>
          <td>${fmt.brl(c.mensalidade)}</td>
          <td><span class="badge" style="background:rgba(96,165,250,0.12);color:#60a5fa;border:1px solid rgba(96,165,250,0.25)">${c.tmf||0}h</span></td>
          <td><span class="badge" style="background:rgba(52,211,153,0.12);color:#34d399;border:1px solid rgba(52,211,153,0.25)">${c.tmc||0}h</span></td>
          <td><span class="badge" style="background:rgba(244,114,182,0.12);color:#f472b6;border:1px solid rgba(244,114,182,0.25)">${c.tmp||0}h</span></td>
          <td><span class="badge badge-gold">${ttc}h</span></td>
          <td>${fmt.hrs(mins)}</td>
          <td><button class="btn btn-danger btn-icon" onclick="removeCliente('${c.id}')" title="Excluir">🗑</button></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>` : `<div class="empty-state"><div class="empty-icon">🏢</div><div class="empty-title">Nenhum cliente cadastrado</div><div class="empty-sub">Adicione o primeiro cliente acima</div></div>`}
  </div>`;
}

// ── Apontamentos ─────────────────────────────────────────────────────────────
function viewApontamentosTable(list, mini) {
  if (!list.length) return `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">Nenhum apontamento registrado</div></div>`;
  return `<div class="table-wrap"><table>
    <thead><tr><th>Colaborador</th><th>Cliente</th><th>Data</th><th>Duração</th>${!mini?'<th>Ações</th>':''}</tr></thead>
    <tbody>${list.map(a => {
      const c = Store.getClienteById(a.clienteId);
      return `<tr>
        <td>${a.colaborador}</td>
        <td>${c?c.nome:'Desconhecido'}</td>
        <td>${fmt.date(a.data)}</td>
        <td><span class="badge badge-blue">${fmt.hrs(a.minutos)}</span></td>
        ${!mini?`<td><button class="btn btn-danger btn-icon" onclick="removeApontamento('${a.id}')" title="Excluir">🗑</button></td>`:''}
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function viewApontamentos() {
  const list = Store.getApontamentos().slice().reverse();
  return `<div class="card">
    <div class="section-header">
      <div><div class="section-title">📋 Todos os Apontamentos</div><div class="section-sub">${list.length} registro(s)</div></div>
    </div>
    ${viewApontamentosTable(list, false)}
  </div>`;
}

// ── Config ───────────────────────────────────────────────────────────────────
function viewConfig() {
  const cfg = Store.getConfig();
  const ch = Store.getCustoHora();
  return `<div class="card" style="max-width:520px">
    <div class="section-header">
      <div><div class="section-title">⚙️ Custo do Escritório</div><div class="section-sub">Configure os custos fixos e horas produtivas</div></div>
    </div>
    <div class="form-group"><label class="form-label">Custo Fixo Mensal Total (R$)</label>
      <input id="cfg-custo" class="form-control" type="number" min="0" placeholder="Ex: 25000" value="${cfg.custoFixo||''}" oninput="calcPreview()" /></div>
    <div class="form-group"><label class="form-label">Horas Úteis Produtivas no Mês</label>
      <input id="cfg-horas" class="form-control" type="number" min="1" placeholder="Ex: 800" value="${cfg.horasUteis||''}" oninput="calcPreview()" /></div>
    <div id="calc-preview" class="calc-result" style="${ch>0?'':'display:none'}">
      <div class="calc-icon">💡</div>
      <div>
        <div class="calc-label">Custo da Hora Calculado</div>
        <div class="calc-value" id="calc-val">${fmt.brl(ch)}</div>
      </div>
    </div>
    <button class="btn btn-primary" style="margin-top:20px;width:100%;justify-content:center" onclick="saveConfig()">💾 Salvar Configurações</button>
  </div>`;
}

// ── Relatórios ───────────────────────────────────────────────────────────────
function viewRelatorios() {
  const clientes = Store.getClientes();
  const ch = Store.getCustoHora();
  const rows = clientes.map(c => {
    const mins = Store.getTotalMinutosCliente(c.id);
    const custoReal = (mins / 60) * ch;
    const lucro = (c.mensalidade || 0) - custoReal;
    const ok = lucro >= 0;
    return { c, mins, custoReal, lucro, ok };
  });
  const totMensalidade = rows.reduce((s,r)=>s+(r.c.mensalidade||0),0);
  const totCusto = rows.reduce((s,r)=>s+r.custoReal,0);
  const totLucro = rows.reduce((s,r)=>s+r.lucro,0);
  const totMins = rows.reduce((s,r)=>s+r.mins,0);

  return `
  ${ch === 0 ? `<div class="card" style="margin-bottom:16px;border-color:rgba(245,200,66,0.3)"><div style="display:flex;align-items:center;gap:12px;padding:4px"><span style="font-size:24px">⚠️</span><div><div style="font-weight:600">Configure o custo do escritório primeiro</div><div style="font-size:13px;color:var(--text-muted)">Sem o custo/hora, o cálculo de rentabilidade não é possível.</div></div><button class="btn btn-primary" onclick="navigate('config')" style="margin-left:auto">Configurar</button></div></div>` : ''}
  <div class="card">
    <div class="section-header">
      <div><div class="section-title">📈 Confronto de Rentabilidade</div><div class="section-sub">Custo/hora: ${fmt.brl(ch)} | Período completo</div></div>
    </div>
    ${rows.length ? `<div class="table-wrap"><table>
      <thead><tr><th>Cliente</th><th>Mensalidade</th><th>Tempo Real</th><th>Custo Realizado</th><th>Lucro / Prejuízo</th><th>Status</th></tr></thead>
      <tbody>
        ${rows.map(r=>`<tr>
          <td><strong>${r.c.nome}</strong></td>
          <td>${fmt.brl(r.c.mensalidade)}</td>
          <td><span class="badge badge-blue">${fmt.hrs(r.mins)}</span></td>
          <td>${fmt.brl(r.custoReal)}</td>
          <td class="${r.ok?'profit-positive':'profit-negative'}">${r.ok?'+':''}${fmt.brl(r.lucro)}</td>
          <td><span class="badge ${r.ok?'badge-green':'badge-red'}">${r.ok?'✅ Lucrativo':'🔴 Prejuízo'}</span></td>
        </tr>`).join('')}
        <tr style="border-top:2px solid var(--border);background:rgba(255,255,255,0.03)">
          <td><strong>TOTAL</strong></td>
          <td><strong>${fmt.brl(totMensalidade)}</strong></td>
          <td><strong>${fmt.hrs(totMins)}</strong></td>
          <td><strong>${fmt.brl(totCusto)}</strong></td>
          <td class="${totLucro>=0?'profit-positive':'profit-negative'}"><strong>${totLucro>=0?'+':''}${fmt.brl(totLucro)}</strong></td>
          <td><span class="badge ${totLucro>=0?'badge-green':'badge-red'}">${totLucro>=0?'✅ Positivo':'🔴 Negativo'}</span></td>
        </tr>
      </tbody>
    </table></div>` : `<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">Nenhum dado para exibir</div><div class="empty-sub">Cadastre clientes e registre apontamentos para ver os relatórios</div></div>`}
  </div>`;
}

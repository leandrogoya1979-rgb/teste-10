// ── BPO Tracker – App Controller ─────────────────────────────────────────────

// ── Timer state ───────────────────────────────────────────────────────────────
let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;
let timerPaused = false;

// ── Router ────────────────────────────────────────────────────────────────────
function getRoute() {
  return location.hash.replace('#/', '') || 'login';
}

function navigate(route) {
  location.hash = '#/' + route;
}

function render() {
  const app = document.getElementById('app');
  const sessao = Store.getSessao();
  const route = getRoute();

  // Auth guard
  if (!sessao && route !== 'login') { navigate('login'); return; }
  if (sessao && route === 'login') {
    navigate(sessao.perfil === 'gestor' ? 'dashboard' : 'timer');
    return;
  }

  // Role guard
  if (sessao && sessao.perfil === 'colaborador' && !['timer'].includes(route)) {
    navigate('timer'); return;
  }

  if (route === 'login') { app.innerHTML = viewLogin(); return; }

  // Stop timer if leaving timer page
  if (route !== 'timer' && timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
  }

  let title, sub, content;
  switch (route) {
    case 'dashboard':
      title = 'Dashboard'; sub = 'Visão geral do escritório';
      content = viewDashboard(); break;
    case 'timer':
      title = '⏱ Apontamento de Horas'; sub = `Olá, ${sessao.nome}`;
      content = viewTimer(sessao); break;
    case 'clientes':
      title = 'Carteira de Clientes'; sub = 'Gerencie os clientes do escritório';
      content = viewClientes(); break;
    case 'apontamentos':
      title = 'Apontamentos'; sub = 'Todos os registros de tempo';
      content = viewApontamentos(); break;
    case 'relatorios':
      title = 'Relatórios'; sub = 'Confronto de tempo e rentabilidade';
      content = viewRelatorios(); break;
    case 'config':
      title = 'Configurações'; sub = 'Custo do escritório';
      content = viewConfig(); break;
    default:
      navigate(sessao.perfil === 'gestor' ? 'dashboard' : 'timer'); return;
  }

  app.innerHTML = viewLayout(sessao, route, title, sub, content);

  // Restore timer UI if on timer page
  if (route === 'timer') {
    updateTimerUI();
  }
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);

// ── Auth ──────────────────────────────────────────────────────────────────────
let _selectedRole = 'gestor';

function selectRole(role) {
  _selectedRole = role;
  document.querySelectorAll('.role-card').forEach(el => el.classList.remove('selected'));
  document.getElementById('role-' + role).classList.add('selected');
}

function doLogin() {
  const nome = document.getElementById('login-nome').value.trim();
  if (!nome) { showToast('Informe seu nome', 'error'); return; }
  Store.setSessao({ nome, perfil: _selectedRole });
  navigate(_selectedRole === 'gestor' ? 'dashboard' : 'timer');
}

function doLogout() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null; timerRunning = false; timerSeconds = 0;
  Store.clearSessao();
  navigate('login');
}

// ── Timer logic ───────────────────────────────────────────────────────────────
function timerIniciar() {
  const sel = document.getElementById('timer-cliente');
  if (!sel.value) { showToast('Selecione um cliente', 'error'); return; }
  timerRunning = true; timerPaused = false;
  timerInterval = setInterval(() => { timerSeconds++; updateTimerDisplay(); }, 1000);
  updateTimerUI();
  sel.disabled = true;
}

function timerPausar() {
  if (!timerRunning && !timerPaused) return;
  if (timerRunning && !timerPaused) {
    clearInterval(timerInterval); timerInterval = null;
    timerPaused = true; timerRunning = false;
  } else if (timerPaused) {
    timerPaused = false; timerRunning = true;
    timerInterval = setInterval(() => { timerSeconds++; updateTimerDisplay(); }, 1000);
  }
  updateTimerUI();
}

function timerFinalizar(colaborador) {
  if (timerSeconds < 1) { showToast('Timer não iniciado', 'error'); return; }
  clearInterval(timerInterval); timerInterval = null;
  const clienteId = document.getElementById('timer-cliente').value;
  const minutos = Math.round(timerSeconds / 60) || 1;
  Store.addApontamento({ clienteId, colaborador, minutos, data: new Date().toISOString() });
  timerSeconds = 0; timerRunning = false; timerPaused = false;
  showToast(`✅ ${fmt.hrs(minutos)} registrado!`, 'success');
  render();
}

function updateTimerDisplay() {
  const el = document.getElementById('timer-display');
  if (!el) return;
  const h = Math.floor(timerSeconds / 3600);
  const m = Math.floor((timerSeconds % 3600) / 60);
  const s = timerSeconds % 60;
  el.textContent = [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}

function updateTimerUI() {
  const display = document.getElementById('timer-display');
  const status = document.getElementById('timer-status');
  const btnIni = document.getElementById('btn-iniciar');
  const btnPause = document.getElementById('btn-pausar');
  const btnFin = document.getElementById('btn-finalizar');
  if (!display) return;

  updateTimerDisplay();

  if (timerRunning) {
    display.className = 'timer-display running';
    status.textContent = '● Rodando'; status.className = 'timer-status running';
    btnIni.disabled = true;
    btnPause.disabled = false; btnPause.textContent = '⏸ Pausar';
    btnFin.disabled = false;
  } else if (timerPaused) {
    display.className = 'timer-display';
    status.textContent = '⏸ Pausado'; status.className = 'timer-status paused';
    btnIni.disabled = true;
    btnPause.disabled = false; btnPause.textContent = '▶ Retomar';
    btnFin.disabled = false;
  } else {
    display.className = 'timer-display';
    status.textContent = 'Parado'; status.className = 'timer-status';
    btnIni.disabled = false;
    btnPause.disabled = true; btnPause.textContent = '⏸ Pausar';
    btnFin.disabled = true;
  }
}

// ── Clientes CRUD ─────────────────────────────────────────────────────────────────
function calcTTC() {
  const tmf = parseFloat(document.getElementById('c-tmf')?.value) || 0;
  const tmc = parseFloat(document.getElementById('c-tmc')?.value) || 0;
  const tmp = parseFloat(document.getElementById('c-tmp')?.value) || 0;
  const ttc = tmf + tmc + tmp;
  const el = document.getElementById('c-ttc-display');
  if (el) el.textContent = ttc % 1 === 0 ? ttc + 'h' : ttc.toFixed(1) + 'h';
}

function addCliente() {
  const nome = document.getElementById('c-nome').value.trim();
  const mensalidade = parseFloat(document.getElementById('c-mensalidade').value) || 0;
  const tmf = parseFloat(document.getElementById('c-tmf').value) || 0;
  const tmc = parseFloat(document.getElementById('c-tmc').value) || 0;
  const tmp = parseFloat(document.getElementById('c-tmp').value) || 0;
  const ttc = tmf + tmc + tmp;
  if (!nome) { showToast('Informe o nome do cliente', 'error'); return; }
  Store.addCliente({ nome, mensalidade, tmf, tmc, tmp, ttc, horasVendidas: ttc });
  showToast('✅ Cliente cadastrado!', 'success');
  render();
}

function removeCliente(id) {
  Store.removeCliente(id);
  showToast('🗑 Cliente removido', 'success');
  render();
}

// ── Apontamentos ─────────────────────────────────────────────────────────────
function removeApontamento(id) {
  Store.removeApontamento(id);
  showToast('🗑 Apontamento removido', 'success');
  render();
}

// ── Config ────────────────────────────────────────────────────────────────────
function parseNum(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const v = (el.value || '').replace(',', '.');
  return Number(v) || 0;
}

function saveConfig() {
  const custoFixo      = parseNum('cfg-custo');
  const quantPessoas   = parseNum('cfg-pessoas');
  const horasPorPessoa = parseNum('cfg-hrspessoa');
  const percPerdaPessoa= parseNum('cfg-perdapessoa');
  const percPerdaTime  = parseNum('cfg-perdatime');
  const markup         = parseNum('cfg-markup');

  if (custoFixo <= 0)      { showToast('Informe o custo total do escritório', 'error'); return; }
  if (quantPessoas <= 0)   { showToast('Informe a quantidade de pessoas', 'error'); return; }
  if (horasPorPessoa <= 0) { showToast('Informe as horas por pessoa', 'error'); return; }
  if (markup <= 0)         { showToast('Informe o markup', 'error'); return; }

  Store.setConfig({ custoFixo, quantPessoas, horasPorPessoa, percPerdaPessoa, percPerdaTime, markup });
  showToast('✅ Configurações salvas!', 'success');
  // Re-render config page in-place
  document.querySelector('.page').innerHTML = viewConfig();
}

function calcPreview() {
  const custoFixo      = parseNum('cfg-custo');
  const quantPessoas   = parseNum('cfg-pessoas');
  const horasPorPessoa = parseNum('cfg-hrspessoa');
  const percPerdaPessoa= parseNum('cfg-perdapessoa');
  const percPerdaTime  = parseNum('cfg-perdatime');
  const markup         = parseNum('cfg-markup');

  const horasCompanhia   = quantPessoas * horasPorPessoa;
  const perdaPessoaHoras = horasPorPessoa * percPerdaPessoa / 100;
  const perdaTimeHoras   = horasCompanhia * percPerdaTime / 100;
  const horasMinimas     = horasCompanhia - perdaTimeHoras;
  const custoHora        = horasMinimas > 0 ? custoFixo / horasMinimas : 0;
  const valorVenda       = custoHora * markup;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set('res-horascompanhia', horasCompanhia > 0 ? horasCompanhia.toLocaleString('pt-BR') + 'h' : '—');
  set('res-perdatime',       perdaTimeHoras > 0 ? perdaTimeHoras.toFixed(0) + 'h' : '—');
  set('res-horasminimas',   horasMinimas > 0 ? horasMinimas.toLocaleString('pt-BR') + 'h' : '—');
  set('res-custohora',      custoHora > 0 ? fmt.brl(custoHora) : '—');
  set('res-valorvenda',     valorVenda > 0 ? fmt.brl(valorVenda) : '—');
  set('res-markup-badge',   markup > 0 ? markup + '×' : '');

  const h1 = document.getElementById('hint-perdapessoa');
  if (h1) h1.textContent = perdaPessoaHoras > 0 ? `= ${perdaPessoaHoras.toFixed(1)}h por pessoa` : '';
  const h2 = document.getElementById('hint-perdatime');
  if (h2) h2.textContent = perdaTimeHoras > 0 ? `= ${perdaTimeHoras.toFixed(0)}h do time` : '';
}

// ── Sidebar mobile ────────────────────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// Allow Enter key on login only
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && getRoute() === 'login' && document.getElementById('login-nome')) doLogin();
});

// ── Excel Import ──────────────────────────────────────────────────────────────
let _xlData = []; // holds parsed rows pending confirmation

// Normalize: remove accents, spaces, special chars, lowercase
function xlNorm(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/gi, '')       // remove spaces, punctuation, etc.
    .toLowerCase()
    .trim();
}

// Find column by aliases — exact first, then partial (contains)
function xlCol(headers, ...aliases) {
  // Pass 1: exact normalized match
  for (const a of aliases) {
    const na = xlNorm(a);
    const i = headers.findIndex(h => xlNorm(h) === na);
    if (i >= 0) return i;
  }
  // Pass 2: header contains alias OR alias contains header
  for (const a of aliases) {
    const na = xlNorm(a);
    const i = headers.findIndex(h => {
      const nh = xlNorm(h);
      return nh.includes(na) || na.includes(nh);
    });
    if (i >= 0) return i;
  }
  return -1;
}

function xlDrop(e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) xlRead(file);
}

function xlRead(file) {
  if (!file) return;
  if (!window.XLSX) { showToast('Biblioteca Excel não carregada', 'error'); return; }

  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      // cellDates:false keeps numbers as numbers (prevents small ints like 34 from becoming dates)
      const wb = XLSX.read(ev.target.result, { type: 'array', cellDates: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      if (raw.length < 2) { showToast('Planilha vazia ou sem dados', 'error'); return; }

      const headers = raw[0].map(String);
      const rows = raw.slice(1).filter(r => r.some(c => String(c).trim() !== ''));
      const tipo = document.getElementById('xl-tipo')?.value || 'clientes';

      _xlData = { tipo, headers, rows };
      xlShowPreview(tipo, headers, rows);
    } catch(err) {
      showToast('Erro ao ler arquivo: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function xlShowPreview(tipo, headers, rows) {
  const preview = document.getElementById('xl-preview');
  const title = document.getElementById('xl-preview-title');
  const table = document.getElementById('xl-preview-table');
  if (!preview) return;

  const shown = rows.slice(0, 10);
  const hHtml = headers.map(h => `<th>${h}</th>`).join('');
  const rHtml = shown.map(r =>
    `<tr>${headers.map((_,i) => `<td>${r[i] ?? ''}</td>`).join('')}</tr>`
  ).join('');

  title.textContent = `Pré-visualização: ${rows.length} linha(s) detectadas — tipo: ${tipo}`;
  table.innerHTML = `<table><thead><tr>${hHtml}</tr></thead><tbody>${rHtml}</tbody></table>`;
  if (rows.length > 10) {
    table.innerHTML += `<div style="font-size:12px;color:var(--text-muted);margin-top:8px">… e mais ${rows.length - 10} linha(s) ocultas</div>`;
  }
  preview.style.display = 'block';
}

function xlCancelar() {
  _xlData = [];
  const p = document.getElementById('xl-preview');
  if (p) p.style.display = 'none';
  const fi = document.getElementById('xl-file');
  if (fi) fi.value = '';
}

// Safe number parser — ignores Date objects (SheetJS date serialization artifact)
function xlParseNum(val) {
  if (val instanceof Date) return 0;
  if (val === null || val === undefined || val === '') return 0;
  return parseFloat(String(val).replace(',', '.')) || 0;
}

function xlImportar() {
  if (!_xlData || !_xlData.rows) { showToast('Nenhum dado para importar', 'error'); return; }
  const { tipo, headers, rows } = _xlData;

  if (tipo === 'clientes') {
    // ── Aliases ampliados para coluna de nome ──
    const iNome = xlCol(headers,
      'Nome', 'Cliente', 'Empresa', 'Nome Empresa', 'Nome da Empresa',
      'Razao Social', 'Razão Social', 'Razao', 'Fantasia', 'Nome Fantasia',
      'name', 'company', 'client'
    );
    // ── Aliases para mensalidade / plano ──
    const iMens = xlCol(headers,
      'Mensalidade', 'Valor', 'Plano', 'Honorario', 'Honorário',
      'Honorario Mensal', 'Honorário Mensal', 'Valor Mensal', 'Fee'
    );
    const iTMF = xlCol(headers, 'TMF', 'Fiscal', 'Tempo Fiscal', 'Hrs Fiscal', 'Horas Fiscal');
    const iTMC = xlCol(headers, 'TMC', 'Contabil', 'Contábil', 'Tempo Contabil', 'Hrs Contabil', 'Horas Contabil');
    const iTMP = xlCol(headers, 'TMP', 'Pessoal', 'DP', 'RH', 'Tempo Pessoal', 'Hrs Pessoal', 'Horas Pessoal');

    if (iNome < 0) {
      // Last resort: use first non-empty column
      const firstNonEmpty = headers.findIndex(h => String(h).trim() !== '');
      if (firstNonEmpty >= 0) {
        showToast(`⚠️ Usando coluna "${headers[firstNonEmpty]}" como nome do cliente`, 'success');
        // Re-run import with first column as name
        const iNomeFallback = firstNonEmpty;
        let count = 0;
        rows.forEach(r => {
          const nome = String(r[iNomeFallback] ?? '').trim();
          if (!nome) return;
          const mensalidade = xlParseNum(r[iMens]);
          const tmf = xlParseNum(r[iTMF]);
          const tmc = xlParseNum(r[iTMC]);
          const tmp = xlParseNum(r[iTMP]);
          const ttc = tmf + tmc + tmp;
          Store.addCliente({ nome, mensalidade, tmf, tmc, tmp, ttc, horasVendidas: ttc });
          count++;
        });
        showToast(`✅ ${count} cliente(s) importado(s)!`, 'success');
        xlCancelar(); render(); return;
      }
      showToast(`Cabeçalhos encontrados: ${headers.slice(0,8).join(' | ')}`, 'error');
      return;
    }

    let count = 0;
    rows.forEach(r => {
      const nome = String(r[iNome] ?? '').trim();
      if (!nome) return;
      const mensalidade = xlParseNum(r[iMens]);
      const tmf = xlParseNum(r[iTMF]);
      const tmc = xlParseNum(r[iTMC]);
      const tmp = xlParseNum(r[iTMP]);
      const ttc = tmf + tmc + tmp;
      Store.addCliente({ nome, mensalidade, tmf, tmc, tmp, ttc, horasVendidas: ttc });
      count++;
    });
    showToast(`✅ ${count} cliente(s) importado(s)!`, 'success');

  } else {
    const iCliente = xlCol(headers,
      'Cliente', 'Nome', 'Empresa', 'Nome Empresa', 'Razao Social', 'Razão Social'
    );
    const iColab = xlCol(headers, 'Colaborador', 'Usuario', 'Usuário', 'User', 'Funcionario', 'Responsavel');
    const iMin   = xlCol(headers, 'Minutos', 'Tempo', 'Duracao', 'Duração', 'Horas', 'Hrs');
    const iData  = xlCol(headers, 'Data', 'Date', 'Dia', 'Competencia', 'Competência');

    if (iCliente < 0) {
      showToast(`Coluna de cliente não encontrada. Cabeçalhos: ${headers.slice(0,6).join(', ')}`, 'error');
      return;
    }

    const clientes = Store.getClientes();
    let count = 0, skip = 0;
    rows.forEach(r => {
      const nomeCliente = String(r[iCliente] ?? '').trim();
      if (!nomeCliente) return;
      const cliente = clientes.find(c => xlNorm(c.nome) === xlNorm(nomeCliente));
      if (!cliente) { skip++; return; }

      let minutos = xlParseNum(r[iMin]);
      const hColName = xlNorm(headers[iMin] || '');
      if (hColName === 'horas' || hColName === 'hora' || hColName === 'hrs') minutos = minutos * 60;

      const colaborador = String(r[iColab] ?? 'Importado').trim() || 'Importado';
      // For dates: with cellDates:false, dates are Excel serial numbers
      const rawDate = r[iData];
      let data = new Date().toISOString();
      if (rawDate) {
        const d = (typeof rawDate === 'number')
          ? new Date(Math.round((rawDate - 25569) * 86400 * 1000)) // Excel serial → JS date
          : new Date(rawDate);
        if (!isNaN(d.getTime())) data = d.toISOString();
      }
      Store.addApontamento({ clienteId: cliente.id, colaborador, minutos: Math.round(minutos), data });
      count++;
    });

    let msg = `✅ ${count} apontamento(s) importado(s)!`;
    if (skip > 0) msg += ` (${skip} ignorados — cliente não encontrado)`;
    showToast(msg, 'success');
  }

  xlCancelar();
  render();
}

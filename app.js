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
  if (!confirm('Excluir este cliente?')) return;
  Store.removeCliente(id);
  showToast('Cliente removido', 'success');
  render();
}

// ── Apontamentos ─────────────────────────────────────────────────────────────
function removeApontamento(id) {
  if (!confirm('Excluir este apontamento?')) return;
  Store.removeApontamento(id);
  showToast('Apontamento removido', 'success');
  render();
}

// ── Config ────────────────────────────────────────────────────────────────────
function parseNum(id) {
  const v = (document.getElementById(id).value || '').replace(',', '.');
  return Number(v) || 0;
}

function saveConfig() {
  const custoFixo = parseNum('cfg-custo');
  const horasUteis = parseNum('cfg-horas');
  if (custoFixo <= 0 || horasUteis <= 0) { showToast('Preencha custo e horas corretamente', 'error'); return; }
  Store.setConfig({ custoFixo, horasUteis });
  showToast('✅ Configurações salvas!', 'success');
  // Re-render without navigating away
  const content = viewConfig();
  document.querySelector('.page').innerHTML = content;
}

function calcPreview() {
  const custo = parseFloat(document.getElementById('cfg-custo').value) || 0;
  const horas = parseFloat(document.getElementById('cfg-horas').value) || 0;
  const prev = document.getElementById('calc-preview');
  const val = document.getElementById('calc-val');
  if (custo > 0 && horas > 0 && prev && val) {
    prev.style.display = 'flex';
    val.textContent = fmt.brl(custo / horas);
  } else if (prev) {
    prev.style.display = 'none';
  }
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

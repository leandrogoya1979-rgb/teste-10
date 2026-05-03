// ── BPO Tracker – Tutorial Bot ───────────────────────────────────────────────

const TUTORIAL_STEPS = [
  {
    title: 'Olá! Eu sou o BPO Bot 👋',
    text: 'Vou te guiar pelo sistema em poucos passos. Clique em <strong>Próximo</strong> para começar!',
    target: null,
    position: 'center'
  },
  {
    title: '1️⃣ Faça o Login',
    text: 'Na tela de login, informe seu <strong>nome</strong> e selecione seu <strong>perfil</strong>:<br><br>• <strong>Gestor</strong> — acesso total ao sistema<br>• <strong>Colaborador</strong> — apenas o cronômetro',
    target: null,
    route: 'login',
    position: 'center'
  },
  {
    title: '2️⃣ Configure o Escritório',
    text: 'Acesse <strong>Custo do Escritório</strong> no menu lateral.<br><br>Informe:<br>• <strong>Custo fixo mensal</strong> (folha, aluguel, sistemas…)<br>• <strong>Horas úteis</strong> da equipe no mês<br><br>O sistema calcula automaticamente o <strong>custo por hora</strong> do escritório.',
    target: null,
    route: 'config',
    position: 'right'
  },
  {
    title: '3️⃣ Cadastre seus Clientes',
    text: 'Em <strong>Carteira de Clientes</strong>, cadastre cada cliente com:<br><br>• <strong>Nome</strong> e <strong>Mensalidade</strong> cobrada<br>• <strong>TMF</strong> — horas de trabalho fiscal<br>• <strong>TMC</strong> — horas de trabalho contábil<br>• <strong>TMP</strong> — horas de trabalho pessoal/DP<br>• <strong>TTC</strong> — total calculado automaticamente',
    target: null,
    route: 'clientes',
    position: 'right'
  },
  {
    title: '4️⃣ Importe via Excel 📊',
    text: 'Em <strong>Relatórios</strong>, você pode importar uma planilha Excel com sua carteira completa de uma vez!<br><br>Formatos aceitos:<br>• <strong>Clientes:</strong> Nome | Mensalidade | TMF | TMC | TMP<br>• <strong>Apontamentos:</strong> Cliente | Colaborador | Minutos | Data<br><br>Arraste o arquivo ou clique para selecionar.',
    target: null,
    route: 'relatorios',
    position: 'right'
  },
  {
    title: '5️⃣ Apontamento de Horas ⏱',
    text: 'O <strong>Colaborador</strong> acessa o cronômetro e:<br><br>1. Seleciona o <strong>cliente</strong> no menu<br>2. Clica em <strong>▶ Iniciar</strong><br>3. Pode <strong>⏸ Pausar</strong> e retomar<br>4. Clica em <strong>⏹ Finalizar</strong> — o tempo é salvo automaticamente!',
    target: null,
    route: 'timer',
    position: 'right'
  },
  {
    title: '6️⃣ Veja os Relatórios 📈',
    text: 'Em <strong>Relatórios</strong>, o sistema cruza automaticamente:<br><br>• <strong>Mensalidade</strong> cobrada do cliente<br>• <strong>Custo realizado</strong> (tempo × custo/hora)<br>• <strong>Lucro ou Prejuízo</strong> por cliente<br><br>Clientes com badge <span style="color:#22c55e">✅ Lucrativo</span> estão saudáveis. <span style="color:#ef4444">🔴 Prejuízo</span> — atenção!',
    target: null,
    route: 'relatorios',
    position: 'center'
  },
  {
    title: '✅ Tudo pronto!',
    text: 'Agora você já sabe como usar o <strong>BPO Tracker</strong>!<br><br>Resumo rápido:<br>⚙️ Configure o custo → 🏢 Cadastre clientes → ⏱ Colaboradores apontam horas → 📈 Gestor analisa rentabilidade<br><br>Qualquer dúvida, clique no botão <strong>🤖</strong> para rever o tutorial!',
    target: null,
    position: 'center'
  }
];

let _tutStep = 0;
let _tutActive = false;

function tutInit() {
  if (document.getElementById('tut-fab')) return;

  // FAB button
  const fab = document.createElement('button');
  fab.id = 'tut-fab';
  fab.innerHTML = '🤖';
  fab.title = 'Tutorial do sistema';
  fab.onclick = tutToggle;
  document.body.appendChild(fab);

  // Overlay
  const overlay = document.createElement('div');
  overlay.id = 'tut-overlay';
  overlay.onclick = e => { if (e.target === overlay) tutClose(); };
  document.body.appendChild(overlay);

  // Panel
  const panel = document.createElement('div');
  panel.id = 'tut-panel';
  panel.innerHTML = `
    <div class="tut-header">
      <div class="tut-avatar">🤖</div>
      <div class="tut-brand">BPO Bot</div>
      <button class="tut-close" onclick="tutClose()">✕</button>
    </div>
    <div class="tut-progress" id="tut-progress"></div>
    <div class="tut-body">
      <div class="tut-step-title" id="tut-title"></div>
      <div class="tut-step-text" id="tut-text"></div>
    </div>
    <div class="tut-footer">
      <button class="btn btn-secondary tut-btn" id="tut-prev" onclick="tutPrev()">← Anterior</button>
      <div class="tut-dots" id="tut-dots"></div>
      <button class="btn btn-primary tut-btn" id="tut-next" onclick="tutNext()">Próximo →</button>
    </div>
  `;
  document.body.appendChild(panel);
}

function tutToggle() {
  if (_tutActive) { tutClose(); return; }
  tutOpen();
}

function tutOpen() {
  _tutActive = true;
  _tutStep = 0;
  document.getElementById('tut-overlay').classList.add('active');
  document.getElementById('tut-panel').classList.add('active');
  document.getElementById('tut-fab').classList.add('active');
  tutRender();
}

function tutClose() {
  _tutActive = false;
  document.getElementById('tut-overlay').classList.remove('active');
  document.getElementById('tut-panel').classList.remove('active');
  document.getElementById('tut-fab').classList.remove('active');
}

function tutNext() {
  if (_tutStep < TUTORIAL_STEPS.length - 1) {
    _tutStep++;
    tutRender();
  } else {
    tutClose();
  }
}

function tutPrev() {
  if (_tutStep > 0) {
    _tutStep--;
    tutRender();
  }
}

function tutRender() {
  const step = TUTORIAL_STEPS[_tutStep];
  const total = TUTORIAL_STEPS.length;

  // Navigate to the step's route if user is logged in
  if (step.route && Store.getSessao()) {
    navigate(step.route);
  }

  document.getElementById('tut-title').innerHTML = step.title;
  document.getElementById('tut-text').innerHTML = step.text;

  // Progress bar
  const pct = ((_tutStep) / (total - 1)) * 100;
  document.getElementById('tut-progress').innerHTML =
    `<div class="tut-progress-bar" style="width:${pct}%"></div>`;

  // Dots
  const dots = Array.from({ length: total }, (_, i) =>
    `<button class="tut-dot ${i === _tutStep ? 'active' : ''}" onclick="tutGoTo(${i})"></button>`
  ).join('');
  document.getElementById('tut-dots').innerHTML = dots;

  // Buttons
  document.getElementById('tut-prev').disabled = _tutStep === 0;
  const nextBtn = document.getElementById('tut-next');
  nextBtn.textContent = _tutStep === total - 1 ? 'Fechar ✓' : 'Próximo →';
}

function tutGoTo(i) {
  _tutStep = i;
  tutRender();
}

// Auto-init after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tutInit);
} else {
  tutInit();
}

const STORAGE_KEY = 'atlas_movements_v1';
const CONFIG_KEY = 'atlas_config_v1';

const defaultConfig = {
  goals: {
    space: { target: 6000, saved: 0 },
    travel: { target: 3000, saved: 0 }
  }
};

let movements = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let config = JSON.parse(localStorage.getItem(CONFIG_KEY) || JSON.stringify(defaultConfig));

const euro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const monthLabel = document.getElementById('monthLabel');
const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date());
monthLabel.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(movements));
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function currentMonthMovements(){
  const now = new Date();
  return movements.filter(m => {
    const d = new Date(m.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}

function render(){
  const monthMoves = currentMonthMovements();
  const income = monthMoves.filter(m => m.type === 'income').reduce((s,m) => s + m.amount, 0);
  const expenses = monthMoves.filter(m => m.type === 'expense').reduce((s,m) => s + m.amount, 0);
  const saving = income - expenses;
  const available = saving;

  document.getElementById('incomeAmount').textContent = euro.format(income);
  document.getElementById('expenseAmount').textContent = euro.format(expenses);
  document.getElementById('savingAmount').textContent = euro.format(saving);
  document.getElementById('availableAmount').textContent = euro.format(available);

  renderGoal('space', 'space');
  renderGoal('travel', 'travel');
  renderMovements(monthMoves.slice().reverse().slice(0, 6));
}

function renderGoal(key, prefix){
  const goal = config.goals[key];
  const percent = goal.target ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
  document.getElementById(prefix + 'Saved').textContent = euro.format(goal.saved);
  document.getElementById(prefix + 'Goal').textContent = euro.format(goal.target);
  document.getElementById(prefix + 'Percent').textContent = percent + '%';
  document.getElementById(prefix + 'Bar').style.width = percent + '%';
}

function renderMovements(items){
  const list = document.getElementById('movementList');
  if(!items.length){
    list.className = 'movement-list empty';
    list.textContent = 'Sin movimientos todavía.';
    return;
  }
  list.className = 'movement-list';
  list.innerHTML = items.map(m => `
    <div class="movement">
      <div>
        <h4>${escapeHtml(m.concept)}</h4>
        <small>${escapeHtml(m.category)}</small>
      </div>
      <div class="amount ${m.type}">${m.type === 'expense' ? '−' : '+'}${euro.format(m.amount).replace('-', '')}</div>
    </div>
  `).join('');
}

function escapeHtml(str){
  return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

const modal = document.getElementById('movementModal');
document.getElementById('openModal').addEventListener('click', () => modal.showModal());
document.getElementById('closeModal').addEventListener('click', () => modal.close());

document.getElementById('movementForm').addEventListener('submit', () => {
  const amount = Math.abs(Number(document.getElementById('amountInput').value));
  const type = document.getElementById('typeInput').value;
  const category = document.getElementById('categoryInput').value;
  const concept = document.getElementById('conceptInput').value.trim();
  if(!amount || !concept) return;
  movements.push({ id: crypto.randomUUID(), amount, type, category, concept, date: new Date().toISOString() });
  save();
  render();
  document.getElementById('movementForm').reset();
});

render();

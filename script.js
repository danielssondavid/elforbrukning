const MONTHS = [
  'Januari',
  'Februari',
  'Mars',
  'April',
  'Maj',
  'Juni',
  'Juli',
  'Augusti',
  'September',
  'Oktober',
  'November',
  'December',
];

const STORAGE_KEY = 'elforbrukningDataV1';

const yearSelect = document.getElementById('yearSelect');
const newYearBtn = document.getElementById('newYearBtn');
const tableBody = document.getElementById('tableBody');

const totalMainEl = document.getElementById('totalMain');
const totalAttefallEl = document.getElementById('totalAttefall');
const totalStorhusetEl = document.getElementById('totalStorhuset');
const comparisonTextEl = document.getElementById('comparisonText');
const storhusetPctEl = document.getElementById('storhusetPct');
const attefallPctEl = document.getElementById('attefallPct');
const pieCanvas = document.getElementById('pieChart');
const pieCtx = pieCanvas.getContext('2d');

let state = loadState();

ensureCurrentYearExists();
renderYearOptions();
renderTable();
recalculate();

newYearBtn.addEventListener('click', () => {
  const input = window.prompt('Ange nytt år (YYYY):');
  if (!input) {
    return;
  }

  const year = String(input).trim();
  if (!/^\d{4}$/.test(year)) {
    window.alert('Ogiltigt årtal. Skriv 4 siffror, t.ex. 2026.');
    return;
  }

  if (!state[year]) {
    state[year] = createEmptyYear();
  }

  yearSelect.value = year;
  saveState();
  renderYearOptions();
  renderTable();
  recalculate();
});

yearSelect.addEventListener('change', () => {
  renderTable();
  recalculate();
});

function createEmptyYear() {
  return MONTHS.map(() => ({
    mainReading: '',
    attefallReading: '',
  }));
}

function ensureCurrentYearExists() {
  const year = String(new Date().getFullYear());
  if (!state[year]) {
    state[year] = createEmptyYear();
    saveState();
  }
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
  } catch {
    // fall through
  }

  return {};
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getSelectedYear() {
  return yearSelect.value || Object.keys(state).sort()[0];
}

function renderYearOptions() {
  const years = Object.keys(state).sort((a, b) => Number(a) - Number(b));
  const previousSelection = yearSelect.value;
  yearSelect.innerHTML = '';

  years.forEach((year) => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  });

  if (previousSelection && years.includes(previousSelection)) {
    yearSelect.value = previousSelection;
    return;
  }

  yearSelect.value = years[years.length - 1];
}

function renderTable() {
  const year = getSelectedYear();
  const yearData = state[year] || createEmptyYear();

  tableBody.innerHTML = '';

  MONTHS.forEach((month, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${month}</td>
      <td><input data-type="mainReading" data-index="${index}" type="number" min="0" step="0.01" value="${yearData[index].mainReading}" /></td>
      <td><input data-type="attefallReading" data-index="${index}" type="number" min="0" step="0.01" value="${yearData[index].attefallReading}" /></td>
      <td data-month-main="${index}">0</td>
      <td data-month-attefall="${index}">0</td>
      <td data-month-storhuset="${index}">0</td>
    `;

    tableBody.appendChild(row);
  });

  tableBody.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', onReadingChange);
  });
}

function onReadingChange(event) {
  const input = event.target;
  const year = getSelectedYear();
  const type = input.getAttribute('data-type');
  const index = Number(input.getAttribute('data-index'));
  const value = input.value;

  if (!state[year]) {
    state[year] = createEmptyYear();
  }

  state[year][index][type] = value;
  saveState();
  recalculate();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function recalculate() {
  const year = getSelectedYear();
  const calculation = calculateYearConsumption(year);

  calculation.months.forEach((month, index) => {
    updateMonthCell('main', index, month.main);
    updateMonthCell('attefall', index, month.attefall);
    updateMonthCell('storhuset', index, month.storhuset);
  });

  totalMainEl.textContent = calculation.totals.main.toFixed(2);
  totalAttefallEl.textContent = calculation.totals.attefall.toFixed(2);
  totalStorhusetEl.textContent = calculation.totals.storhuset.toFixed(2);

  updateComparison(year, calculation.totals.main);
  drawPieChart(calculation.totals.storhuset, calculation.totals.attefall);
}

function calculateYearConsumption(year) {
  const yearData = state[year] || createEmptyYear();
  const previousYear = String(Number(year) - 1);
  const previousYearData = state[previousYear] || [];
  const previousDecember = previousYearData[11] || {};

  let previousMain = previousDecember.mainReading === '' || previousDecember.mainReading === undefined
    ? null
    : toNumber(previousDecember.mainReading);
  let previousAttefall =
    previousDecember.attefallReading === '' || previousDecember.attefallReading === undefined
      ? null
      : toNumber(previousDecember.attefallReading);

  let totalMain = 0;
  let totalAttefall = 0;
  let totalStorhuset = 0;

  const months = yearData.map((entry) => {
    const hasMain = entry.mainReading !== '';
    const hasAttefall = entry.attefallReading !== '';
    const currentMain = toNumber(entry.mainReading);
    const currentAttefall = toNumber(entry.attefallReading);

    const monthMain = previousMain === null || !hasMain ? 0 : Math.max(0, currentMain - previousMain);
    const monthAttefall =
      previousAttefall === null || !hasAttefall ? 0 : Math.max(0, currentAttefall - previousAttefall);
    const monthStorhuset = Math.max(0, monthMain - monthAttefall);

    totalMain += monthMain;
    totalAttefall += monthAttefall;
    totalStorhuset += monthStorhuset;

    if (hasMain) {
      previousMain = currentMain;
    }

    if (hasAttefall) {
      previousAttefall = currentAttefall;
    }

    return {
      main: monthMain,
      attefall: monthAttefall,
      storhuset: monthStorhuset,
    };
  });

  return {
    months,
    totals: {
      main: totalMain,
      attefall: totalAttefall,
      storhuset: totalStorhuset,
    },
  };
}

function updateMonthCell(type, index, value) {
  const selectorMap = {
    main: `[data-month-main="${index}"]`,
    attefall: `[data-month-attefall="${index}"]`,
    storhuset: `[data-month-storhuset="${index}"]`,
  };

  const cell = tableBody.querySelector(selectorMap[type]);
  if (cell) {
    cell.textContent = value.toFixed(2);
  }
}

function updateComparison(year, currentTotal) {
  const previousYear = String(Number(year) - 1);
  const previousData = state[previousYear];

  if (!previousData) {
    comparisonTextEl.textContent = 'Ingen tidigare årsdata ännu.';
    return;
  }

  const prevTotal = calculateYearConsumption(previousYear).totals.main;

  if (prevTotal === 0) {
    comparisonTextEl.textContent = `Jämförelse med ${previousYear} saknar tillräcklig data.`;
    return;
  }

  const diff = currentTotal - prevTotal;
  const pct = ((diff / prevTotal) * 100).toFixed(1);
  const direction = diff >= 0 ? 'ökning' : 'minskning';

  comparisonTextEl.textContent = `Jämfört med ${previousYear}: ${Math.abs(diff).toFixed(2)} kWh ${direction} (${Math.abs(
    pct,
  )}%).`;
}

function drawPieChart(storhuset, attefall) {
  const total = storhuset + attefall;
  pieCtx.clearRect(0, 0, pieCanvas.width, pieCanvas.height);

  if (total <= 0) {
    pieCtx.fillStyle = '#94a3b8';
    pieCtx.beginPath();
    pieCtx.arc(150, 150, 110, 0, Math.PI * 2);
    pieCtx.fill();
    storhusetPctEl.textContent = '0%';
    attefallPctEl.textContent = '0%';
    return;
  }

  const storhusetAngle = (storhuset / total) * Math.PI * 2;

  pieCtx.beginPath();
  pieCtx.moveTo(150, 150);
  pieCtx.arc(150, 150, 110, 0, storhusetAngle);
  pieCtx.closePath();
  pieCtx.fillStyle = '#1d4ed8';
  pieCtx.fill();

  pieCtx.beginPath();
  pieCtx.moveTo(150, 150);
  pieCtx.arc(150, 150, 110, storhusetAngle, Math.PI * 2);
  pieCtx.closePath();
  pieCtx.fillStyle = '#dc2626';
  pieCtx.fill();

  const storhusetPct = ((storhuset / total) * 100).toFixed(1);
  const attefallPct = ((attefall / total) * 100).toFixed(1);
  storhusetPctEl.textContent = `${storhusetPct}%`;
  attefallPctEl.textContent = `${attefallPct}%`;
}

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
const LINE_COLORS = ['#1d4ed8', '#dc2626', '#059669', '#7c3aed', '#ea580c', '#0f766e', '#be123c', '#334155'];

const yearSelect = document.getElementById('yearSelect');
const newYearBtn = document.getElementById('newYearBtn');
const tableBody = document.getElementById('tableBody');

const totalMainEl = document.getElementById('totalMain');
const totalAttefallEl = document.getElementById('totalAttefall');
const totalStorhusetEl = document.getElementById('totalStorhuset');
const comparisonTextEl = document.getElementById('comparisonText');
const monthlyComparisonBody = document.getElementById('monthlyComparisonBody');
const storhusetPctEl = document.getElementById('storhusetPct');
const attefallPctEl = document.getElementById('attefallPct');

const pieCanvas = document.getElementById('pieChart');
const pieCtx = pieCanvas.getContext('2d');

const totalLineCanvas = document.getElementById('lineChartTotal');
const storhusetLineCanvas = document.getElementById('lineChartStorhuset');
const attefallLineCanvas = document.getElementById('lineChartAttefall');
const lineLegend = document.getElementById('lineLegend');

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
    return {};
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

  if (!state[year]) {
    state[year] = createEmptyYear();
  }

  state[year][index][type] = input.value;
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
  renderMonthlyComparison(year, calculation.months);
  drawPieChart(calculation.totals.storhuset, calculation.totals.attefall);
  drawAllLineCharts();
}

function calculateYearConsumption(year) {
  const yearData = state[year] || createEmptyYear();
  const previousYear = String(Number(year) - 1);
  const previousDecember = (state[previousYear] || [])[11] || {};

  let previousMain =
    previousDecember.mainReading === '' || previousDecember.mainReading === undefined
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

  if (!state[previousYear]) {
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

function renderMonthlyComparison(year, currentMonths) {
  const previousYear = String(Number(year) - 1);
  const previousMonths = state[previousYear] ? calculateYearConsumption(previousYear).months : [];

  monthlyComparisonBody.innerHTML = '';

  MONTHS.forEach((monthName, index) => {
    const currentValue = currentMonths[index]?.main ?? 0;
    const previousValue = previousMonths[index]?.main ?? 0;

    let changeText = 'Ingen jämförelsedata';
    let className = 'comparison-neutral';

    if (previousValue > 0) {
      const diff = currentValue - previousValue;
      const pct = ((diff / previousValue) * 100).toFixed(1);
      const sign = diff >= 0 ? '+' : '-';
      changeText = `${sign}${Math.abs(pct)}% (${sign}${Math.abs(diff).toFixed(2)} kWh)`;
      className = diff > 0 ? 'comparison-up' : diff < 0 ? 'comparison-down' : 'comparison-neutral';
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${monthName}</td>
      <td>${currentValue.toFixed(2)}</td>
      <td>${previousValue.toFixed(2)}</td>
      <td class="${className}">${changeText}</td>
    `;
    monthlyComparisonBody.appendChild(row);
  });
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

function drawAllLineCharts() {
  const years = Object.keys(state).sort((a, b) => Number(a) - Number(b));
  const yearlyData = years.map((year) => ({
    year,
    color: LINE_COLORS[years.indexOf(year) % LINE_COLORS.length],
    months: calculateYearConsumption(year).months,
  }));

  drawMultiYearLineChart(totalLineCanvas, yearlyData, 'main');
  drawMultiYearLineChart(storhusetLineCanvas, yearlyData, 'storhuset');
  drawMultiYearLineChart(attefallLineCanvas, yearlyData, 'attefall');
  renderLineLegend(yearlyData);
}

function drawMultiYearLineChart(canvas, yearlyData, metricKey) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = { top: 20, right: 18, bottom: 42, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(
    1,
    ...yearlyData.flatMap((yearRow) => yearRow.months.map((month) => month[metricKey] || 0)),
  );

  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  for (let i = 1; i <= 4; i += 1) {
    const y = padding.top + (chartHeight * i) / 4;
    const value = ((maxValue * (4 - i)) / 4).toFixed(0);

    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(value, padding.left - 6, y + 4);
  }

  MONTHS.forEach((month, index) => {
    const x = padding.left + (chartWidth * index) / (MONTHS.length - 1);
    ctx.fillStyle = '#334155';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(month.slice(0, 3), x, height - padding.bottom + 16);
  });

  yearlyData.forEach((yearRow) => {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = yearRow.color;

    yearRow.months.forEach((month, index) => {
      const value = month[metricKey] || 0;
      const x = padding.left + (chartWidth * index) / (MONTHS.length - 1);
      const y = height - padding.bottom - (value / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    yearRow.months.forEach((month, index) => {
      const value = month[metricKey] || 0;
      const x = padding.left + (chartWidth * index) / (MONTHS.length - 1);
      const y = height - padding.bottom - (value / maxValue) * chartHeight;

      ctx.beginPath();
      ctx.fillStyle = yearRow.color;
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

function renderLineLegend(yearlyData) {
  lineLegend.innerHTML = '';

  yearlyData.forEach((yearRow) => {
    const item = document.createElement('div');
    item.className = 'line-legend-item';

    item.innerHTML = `
      <span class="line-color" style="background:${yearRow.color}"></span>
      <span>${yearRow.year}</span>
    `;

    lineLegend.appendChild(item);
  });
}

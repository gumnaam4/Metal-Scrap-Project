(function () {
  const SL = window.ScrapLedger = window.ScrapLedger || {};
  SL.modules = SL.modules || {};

  function getKpiData() {
    const today = new Date().toISOString().slice(0, 10);
    const sales = SL.state.sales.filter((sale) => sale.date === today);
    const purchases = SL.state.purchases.filter((purchase) => purchase.date === today);
    const expenses = SL.state.expenses.filter((expense) => expense.date === today);

    const totalSales = sales.reduce((sum, sale) => sum + (Number(sale.saleAmount) || 0), 0);
    const totalPurchases = purchases.reduce((sum, purchase) => sum + (Number(purchase.totalCost) || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

    const inventoryValue = Object.values(SL.state.inventory || {}).reduce((sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.averageCost) || 0), 0);

    const outstandingReceivables = SL.state.customers.reduce((sum, customer) => sum + (Number(customer.openingBalance || 0)), 0) +
      SL.state.sales.filter((sale) => (Number(sale.pendingAmount) || 0) > 0).reduce((sum, sale) => sum + Number(sale.pendingAmount || 0), 0);
    const outstandingPayables = SL.state.suppliers.reduce((sum, supplier) => sum + (Number(supplier.openingBalance || 0)), 0) +
      SL.state.purchases.filter((purchase) => (Number(purchase.pendingAmount) || 0) > 0).reduce((sum, purchase) => sum + Number(purchase.pendingAmount || 0), 0);

    return {
      sales: totalSales,
      purchases: totalPurchases,
      profit: totalSales - totalPurchases - totalExpenses,
      expenses: totalExpenses,
      inventoryValue,
      receivables: outstandingReceivables,
      payables: outstandingPayables,
    };
  }

  function renderChartCard() {
    const root = document.getElementById('dashboard-page');
    if (!root) return;

    const data = getKpiData();
    const dailySales = [];
    const dailyPurchases = [];
    const labels = [];

    const days = 7;
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      labels.push(date.slice(5));
      const salesForDay = SL.state.sales.filter((sale) => sale.date === date).reduce((sum, item) => sum + Number(item.saleAmount || 0), 0);
      const purchasesForDay = SL.state.purchases.filter((purchase) => purchase.date === date).reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
      dailySales.push(salesForDay);
      dailyPurchases.push(purchasesForDay);
    }

    const maxValue = Math.max(...dailySales, ...dailyPurchases, 1);
    const barPoints = labels.map((label, index) => {
      const sale = dailySales[index];
      const purchase = dailyPurchases[index];
      return `
        <div class="bar-group">
          <div class="bar" style="height:${(sale / maxValue) * 100}%"></div>
          <div class="bar" style="height:${(purchase / maxValue) * 100}%"></div>
          <div class="small-text">${label}</div>
        </div>
      `;
    }).join('');

    const profitTrend = Array.from({ length: 6 }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (5 - idx));
      const iso = d.toISOString().slice(0, 10);
      const saleValue = SL.state.sales.filter((sale) => sale.date === iso).reduce((sum, item) => sum + Number(item.saleAmount || 0), 0);
      const purchaseValue = SL.state.purchases.filter((purchase) => purchase.date === iso).reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
      const expenseValue = SL.state.expenses.filter((expense) => expense.date === iso).reduce((sum, item) => sum + Number(item.amount || 0), 0);
      return saleValue - purchaseValue - expenseValue;
    });

    const trendMax = Math.max(...profitTrend, 1);
    const trendMin = Math.min(...profitTrend, 0);
    const coordPoints = profitTrend.map((value, index) => {
      const x = (index / (profitTrend.length - 1)) * 100;
      const y = 100 - ((value - trendMin) / Math.max(trendMax - trendMin, 1)) * 100;
      return `${x},${y}`;
    }).join(' ');

    const metalNames = ['Iron', 'Steel', 'Copper', 'Aluminium', 'Brass', 'Stainless Steel', 'E-Waste', 'Other'];
    const metalValues = metalNames.map((name) => {
      const metal = SL.state.metals.find((entry) => entry.name === name);
      if (!metal) return 0;
      const inv = SL.state.inventory[metal.id] || { quantity: 0 };
      return Number(inv.quantity || 0);
    });
    const metalMax = Math.max(...metalValues, 1);
    const metalBars = metalNames.map((name, index) => `
      <div class="bar-group">
        <div class="bar" style="height:${(metalValues[index] / metalMax) * 100}%"></div>
        <div class="small-text">${name.slice(0, 3)}</div>
      </div>
    `).join('');

    const inventoryParts = Object.values(SL.state.inventory || {}).reduce((acc, item) => {
      acc.push({ label: SL.state.metals.find((entry) => entry.id === item.metalId)?.name || 'Other', value: Number(item.quantity || 0) });
      return acc;
    }, []).filter((item) => item.value > 0);

    const donutGradient = inventoryParts.length
      ? inventoryParts.map((item, index) => {
          const palette = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#eab308', '#38bdf8'];
          const start = inventoryParts.slice(0, index).reduce((sum, part) => sum + (part.value || 0), 0);
          const end = start + (item.value || 0);
          return `${palette[index % palette.length]} ${start / Math.max(inventoryParts.reduce((sum, part) => sum + (part.value || 0), 0), 1) * 100}% ${end / Math.max(inventoryParts.reduce((sum, part) => sum + (part.value || 0), 0), 1) * 100}%`;
        }).join(', ')
      : '#dbeafe 0% 100%';

    root.innerHTML = `
      <div class="kpis-grid">
        <div class="card kpi-card positive">
          <div class="kpi-header"><span>Today's Purchases</span><span>↘</span></div>
          <div class="kpi-value">${SL.utils.formatCurrency(data.purchases)}</div>
        </div>
        <div class="card kpi-card info">
          <div class="kpi-header"><span>Today's Sales</span><span>↗</span></div>
          <div class="kpi-value">${SL.utils.formatCurrency(data.sales)}</div>
        </div>
        <div class="card kpi-card positive">
          <div class="kpi-header"><span>Today's Profit</span><span>✓</span></div>
          <div class="kpi-value">${SL.utils.formatCurrency(data.profit)}</div>
        </div>
        <div class="card kpi-card negative">
          <div class="kpi-header"><span>Total Expenses</span><span>−</span></div>
          <div class="kpi-value">${SL.utils.formatCurrency(data.expenses)}</div>
        </div>
        <div class="card kpi-card info">
          <div class="kpi-header"><span>Inventory Value</span><span>▣</span></div>
          <div class="kpi-value">${SL.utils.formatCurrency(data.inventoryValue)}</div>
        </div>
        <div class="card kpi-card warning">
          <div class="kpi-header"><span>Outstanding Receivables</span><span>◌</span></div>
          <div class="kpi-value">${SL.utils.formatCurrency(data.receivables)}</div>
        </div>
        <div class="card kpi-card warning">
          <div class="kpi-header"><span>Outstanding Payables</span><span>◌</span></div>
          <div class="kpi-value">${SL.utils.formatCurrency(data.payables)}</div>
        </div>
      </div>

      <div class="metrics-row">
        <div class="card chart-card">
          <div class="chart-title"><span>Sales vs Purchases</span></div>
          <div class="chart-box">
            <div class="bar-chart">${barPoints}</div>
          </div>
        </div>

        <div class="card chart-card">
          <div class="chart-title"><span>Profit Trend</span></div>
          <div class="line-chart">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline fill="none" stroke="#2563eb" stroke-width="2" points="${coordPoints}"></polyline>
            </svg>
          </div>
        </div>
      </div>

      <div class="metrics-row">
        <div class="card chart-card">
          <div class="chart-title"><span>Sales by Metal</span></div>
          <div class="chart-box">
            <div class="bar-chart">${metalBars}</div>
          </div>
        </div>

        <div class="card chart-card">
          <div class="chart-title"><span>Inventory Distribution</span></div>
          <div class="donut-wrap">
            <div class="donut" style="background: conic-gradient(${donutGradient});"></div>
          </div>
        </div>
      </div>
    `;
  }

  function render() {
    renderChartCard();
  }

  SL.modules.dashboard = { render };
})();

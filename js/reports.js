(function () {
  const SL = window.ScrapLedger = window.ScrapLedger || {};
  SL.modules = SL.modules || {};

  function renderProfitLoss() {
    const root = document.getElementById('profitloss-page');
    if (!root) return;

    const totalRevenue = SL.state.sales.reduce((sum, sale) => sum + Number(sale.saleAmount || 0), 0);
    const cogs = SL.state.sales.reduce((sum, sale) => sum + Number(sale.profit || 0), 0) + SL.state.sales.reduce((sum, sale) => sum + Number(sale.saleAmount || 0), 0);
    const expenses = SL.state.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const grossProfit = totalRevenue - cogs;
    const net = grossProfit - expenses;

    root.innerHTML = `
      <div class="section-head">
        <h2>Profit & Loss</h2>
      </div>
      <div class="kpis-grid">
        <div class="card kpi-card info"><div class="kpi-header"><span>Revenue</span></div><div class="kpi-value">${SL.utils.formatCurrency(totalRevenue)}</div></div>
        <div class="card kpi-card negative"><div class="kpi-header"><span>COGS</span></div><div class="kpi-value">${SL.utils.formatCurrency(cogs)}</div></div>
        <div class="card kpi-card positive"><div class="kpi-header"><span>Gross Profit</span></div><div class="kpi-value">${SL.utils.formatCurrency(grossProfit)}</div></div>
        <div class="card kpi-card negative"><div class="kpi-header"><span>Operating Expense</span></div><div class="kpi-value">${SL.utils.formatCurrency(expenses)}</div></div>
        <div class="card kpi-card positive"><div class="kpi-header"><span>Net Profit</span></div><div class="kpi-value">${SL.utils.formatCurrency(net)}</div></div>
      </div>
    `;
  }

  function render() {
    const root = document.getElementById('reports-page');
    if (!root) return;

    root.innerHTML = `
      <div class="section-head">
        <h2>Reports</h2>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Report</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Sales Report</td><td>${SL.utils.formatCurrency(SL.state.sales.reduce((sum, item) => sum + Number(item.saleAmount || 0), 0))}</td></tr>
            <tr><td>Purchase Report</td><td>${SL.utils.formatCurrency(SL.state.purchases.reduce((sum, item) => sum + Number(item.totalCost || 0), 0))}</td></tr>
            <tr><td>Inventory Report</td><td>${Object.values(SL.state.inventory || {}).reduce((sum, item) => sum + Number(item.quantity || 0), 0)} kg</td></tr>
            <tr><td>Expense Report</td><td>${SL.utils.formatCurrency(SL.state.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0))}</td></tr>
            <tr><td>Customer Outstanding</td><td>${SL.utils.formatCurrency(SL.state.sales.reduce((sum, item) => sum + Number(item.pendingAmount || 0), 0))}</td></tr>
            <tr><td>Supplier Outstanding</td><td>${SL.utils.formatCurrency(SL.state.purchases.reduce((sum, item) => sum + Number(item.pendingAmount || 0), 0))}</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  SL.modules.reports = { render, renderProfitLoss };
})();

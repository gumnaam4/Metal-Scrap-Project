(function () {
  const SL = window.ScrapLedger = window.ScrapLedger || {};
  SL.modules = SL.modules || {};

  function render() {
    const root = document.getElementById('inventory-page');
    if (!root) return;

    const rows = SL.state.metals.filter((metal) => metal.enabled).map((metal) => {
      const item = SL.state.inventory[metal.id] || { quantity: 0, averageCost: 0 };
      const quantity = Number(item.quantity || 0);
      const avgCost = Number(item.averageCost || 0);
      const value = quantity * avgCost;
      const sellRate = SL.state.priceBoard.find((entry) => entry.metalId === metal.id)?.sellRate || 0;
      const potentialProfit = quantity * (sellRate - avgCost);
      return `
        <tr>
          <td>${metal.name}</td>
          <td>${quantity.toFixed(2)} kg</td>
          <td>${SL.utils.formatCurrency(avgCost)}</td>
          <td>${SL.utils.formatCurrency(value)}</td>
          <td>${SL.utils.formatCurrency(sellRate)}</td>
          <td>${SL.utils.formatCurrency(potentialProfit)}</td>
        </tr>
      `;
    }).join('');

    root.innerHTML = `
      <div class="section-head">
        <h2>Inventory</h2>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Metal</th>
              <th>Current Stock</th>
              <th>Average Cost/kg</th>
              <th>Inventory Value</th>
              <th>Current Selling Rate</th>
              <th>Potential Profit</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6"><div class="empty-state">No inventory data yet.</div></td></tr>'}</tbody>
        </table>
      </div>
    `;
  }

  SL.modules.inventory = { render };
})();

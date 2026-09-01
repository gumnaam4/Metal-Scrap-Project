(function () {
  const SL = window.ScrapLedger = window.ScrapLedger || {};
  SL.modules = SL.modules || {};

  function getMetalOptions() {
    return SL.state.metals.filter((metal) => metal.enabled).map((metal) => `
      <option value="${metal.id}">${metal.name}</option>
    `).join('');
  }

  function render() {
    const root = document.getElementById('sales-page');
    if (!root) return;

    const rows = SL.state.sales.length ? SL.state.sales.map((sale) => `
      <tr>
        <td>${sale.date}</td>
        <td>${sale.saleId}</td>
        <td>${sale.customerName || '-'}</td>
        <td>${sale.metalName || '-'}</td>
        <td>${Number(sale.weight || 0)} kg</td>
        <td>${SL.utils.formatCurrency(sale.rate || 0)}</td>
        <td>${SL.utils.formatCurrency(sale.saleAmount || 0)}</td>
        <td>${SL.utils.formatCurrency(sale.amountReceived || 0)}</td>
        <td>${SL.utils.formatCurrency(sale.pendingAmount || 0)}</td>
        <td>${SL.utils.formatCurrency(sale.profit || 0)}</td>
        <td><span class="badge ${sale.pendingAmount > 0 ? 'warning' : 'success'}">${sale.pendingAmount > 0 ? 'Pending' : 'Paid'}</span></td>
      </tr>
    `).join('') : `
      <tr>
        <td colspan="11">
          <div class="empty-state">
            <p>No sales recorded yet.</p>
            <button class="button button-primary" type="button" data-action="new-sale">+ Add Sale</button>
          </div>
        </td>
      </tr>
    `;

    root.innerHTML = `
      <div class="section-head">
        <h2>Sales</h2>
        <div class="section-toolbar">
          <button class="button button-primary" type="button" data-action="new-sale">+ New Sale</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Sale ID</th>
              <th>Customer</th>
              <th>Metal</th>
              <th>Weight</th>
              <th>Rate/kg</th>
              <th>Sale Amount</th>
              <th>Received</th>
              <th>Pending</th>
              <th>Profit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    root.querySelectorAll('[data-action="new-sale"]').forEach((button) => {
      button.addEventListener('click', openSaleModal);
    });
  }

  function openSaleModal() {
    const modalRoot = document.getElementById('modalRoot');
    modalRoot.innerHTML = `
      <div class="modal-backdrop open">
        <div class="modal">
          <div class="modal-header">
            <h3>New Sale</h3>
            <button class="close-btn" type="button" data-close-modal="true">×</button>
          </div>
          <form id="sale-form">
            <div class="form-grid">
              <div class="form-group">
                <label>Date</label>
                <input type="date" name="date" value="${SL.utils.todayString()}" required />
              </div>
              <div class="form-group">
                <label>Customer</label>
                <select name="customerId" required>
                  <option value="">Select customer</option>
                  ${SL.state.customers.map((customer) => `<option value="${customer.id}">${customer.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Metal Type</label>
                <select name="metalId" required>
                  <option value="">Select metal</option>
                  ${getMetalOptions()}
                </select>
              </div>
              <div class="form-group">
                <label>Scrap Category</label>
                <input type="text" name="scrapCategory" />
              </div>
              <div class="form-group">
                <label>Weight (kg)</label>
                <input type="number" step="0.01" name="weight" required />
              </div>
              <div class="form-group">
                <label>Rate / kg</label>
                <input type="number" step="0.01" name="rate" required />
              </div>
              <div class="form-group">
                <label>Transport Cost</label>
                <input type="number" step="0.01" name="transportCost" value="0" />
              </div>
              <div class="form-group">
                <label>Other Charges</label>
                <input type="number" step="0.01" name="otherCharges" value="0" />
              </div>
              <div class="form-group">
                <label>Amount Received</label>
                <input type="number" step="0.01" name="amountReceived" value="0" />
              </div>
              <div class="form-group">
                <label>Payment Method</label>
                <select name="paymentMethod">
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div class="form-group" style="margin-top: 16px;">
              <label>Notes</label>
              <textarea name="notes"></textarea>
            </div>
            <div class="form-actions">
              <button class="button" type="button" data-close-modal="true">Cancel</button>
              <button class="button button-primary" type="submit">Save Sale</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modalRoot.querySelectorAll('[data-close-modal="true"]').forEach((button) => {
      button.addEventListener('click', () => {
        modalRoot.innerHTML = '';
      });
    });

    modalRoot.querySelector('#sale-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.target;
      const customerId = form.customerId.value;
      const metalId = form.metalId.value;
      const weight = Number(form.weight.value || 0);
      const rate = Number(form.rate.value || 0);
      const customer = SL.state.customers.find((entry) => entry.id === customerId);
      const metal = SL.state.metals.find((entry) => entry.id === metalId);

      if (!customer || !metal) {
        SL.utils.showToast('Select both customer and metal.', 'error');
        return;
      }

      const inventory = SL.state.inventory[metalId] || { quantity: 0, averageCost: 0 };
      if (weight > Number(inventory.quantity || 0)) {
        SL.utils.showToast('Insufficient inventory. Reduce weight or adjust stock.', 'error');
        return;
      }

      const saleAmount = weight * rate;
      const transportCost = Number(form.transportCost.value || 0);
      const otherCharges = Number(form.otherCharges.value || 0);
      const amountReceived = Number(form.amountReceived.value || 0);
      const totalRevenue = saleAmount + transportCost + otherCharges;
      const cogs = weight * Number(inventory.averageCost || 0);
      const profit = saleAmount - cogs;
      const pendingAmount = Math.max(totalRevenue - amountReceived, 0);
      const id = SL.storage.generateId('SAL');
      const sale = {
        id,
        saleId: `SAL-${SL.state.sales.length + 1}`,
        date: form.date.value,
        customerId: customer.id,
        customerName: customer.name,
        metalId: metal.id,
        metalName: metal.name,
        scrapCategory: form.scrapCategory.value,
        weight,
        rate,
        saleAmount: totalRevenue,
        amountReceived,
        transportCost,
        otherCharges,
        pendingAmount,
        profit,
      };

      SL.state.sales.push(sale);
      inventory.quantity = Number(inventory.quantity || 0) - weight;
      inventory.averageCost = Number(inventory.averageCost || 0) || 0;
      inventory.lastUpdated = form.date.value;
      SL.state.inventory[metalId] = inventory;
      SL.state.inventoryMovements.push({
        id: SL.storage.generateId('MOV'),
        date: form.date.value,
        type: 'Sale',
        metal: metal.name,
        quantity: weight,
        rate: Number(inventory.averageCost || 0),
        value: cogs,
        reference: sale.saleId,
      });
      SL.state.auditLog.push({
        action: 'Added',
        recordType: 'Sale',
        recordId: sale.saleId,
        timestamp: new Date().toISOString(),
      });
      customer.openingBalance = Number(customer.openingBalance || 0) + pendingAmount;
      SL.app.saveState();
      modalRoot.innerHTML = '';
      render();
      SL.utils.showToast('Sale recorded successfully.', 'success');
    });
  }

  SL.modules.sales = { render, openSaleModal };
})();

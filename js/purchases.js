(function () {
  const SL = window.ScrapLedger = window.ScrapLedger || {};
  SL.modules = SL.modules || {};

  function getMetalOptions() {
    return SL.state.metals.filter((metal) => metal.enabled).map((metal) => `
      <option value="${metal.id}">${metal.name}</option>
    `).join('');
  }

  function buildPurchaseItemRow(index, item = {}) {
    return `
      <div class="purchase-item-row" data-index="${index}">
        <div class="form-grid">
          <div class="form-group">
            <label>Metal</label>
            <select name="metalId" data-index="${index}">${getMetalOptions()}</select>
          </div>
          <div class="form-group">
            <label>Scrap Category</label>
            <input type="text" name="scrapCategory" data-index="${index}" value="${item.scrapCategory || ''}" />
          </div>
          <div class="form-group">
            <label>Gross Weight (kg)</label>
            <input type="number" step="0.01" name="grossWeight" data-index="${index}" value="${item.grossWeight || ''}" />
          </div>
          <div class="form-group">
            <label>Tare Weight (kg)</label>
            <input type="number" step="0.01" name="tareWeight" data-index="${index}" value="${item.tareWeight || ''}" />
          </div>
          <div class="form-group">
            <label>Net Weight (kg)</label>
            <input type="number" step="0.01" name="netWeight" data-index="${index}" value="${item.netWeight || ''}" readonly />
          </div>
          <div class="form-group">
            <label>Rate / kg</label>
            <input type="number" step="0.01" name="rate" data-index="${index}" value="${item.rate || ''}" />
          </div>
        </div>
      </div>
    `;
  }

  function render() {
    const root = document.getElementById('purchases-page');
    if (!root) return;

    const rows = SL.state.purchases.length ? SL.state.purchases.map((purchase) => `
      <tr>
        <td>${purchase.date}</td>
        <td>${purchase.purchaseId}</td>
        <td>${purchase.supplierName || '-'} </td>
        <td>${purchase.items.map((item) => item.metalName).join(', ') || '-'}</td>
        <td>${purchase.items.reduce((sum, item) => sum + Number(item.netWeight || 0), 0)} kg</td>
        <td>${SL.utils.formatCurrency(purchase.items.reduce((sum, item) => sum + Number(item.rate || 0), 0) / Math.max(purchase.items.length, 1))}</td>
        <td>${SL.utils.formatCurrency(purchase.totalCost || 0)}</td>
        <td>${SL.utils.formatCurrency(purchase.amountPaid || 0)}</td>
        <td>${SL.utils.formatCurrency(purchase.pendingAmount || 0)}</td>
        <td><span class="badge ${purchase.pendingAmount > 0 ? 'warning' : 'success'}">${purchase.pendingAmount > 0 ? 'Pending' : 'Paid'}</span></td>
        <td>
          <div class="flex-row">
            <button class="button button-secondary" type="button" data-action="view-purchase" data-id="${purchase.id}">View</button>
            <button class="button button-secondary" type="button" data-action="edit-purchase" data-id="${purchase.id}">Edit</button>
            <button class="button button-danger" type="button" data-action="delete-purchase" data-id="${purchase.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('') : `
      <tr>
        <td colspan="11">
          <div class="empty-state">
            <p>No purchases recorded yet.</p>
            <button class="button button-primary" type="button" data-action="new-purchase">+ Add Purchase</button>
          </div>
        </td>
      </tr>
    `;

    root.innerHTML = `
      <div class="section-head">
        <h2>Purchases</h2>
        <div class="section-toolbar">
          <button class="button button-primary" type="button" data-action="new-purchase">+ New Purchase</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Purchase ID</th>
              <th>Supplier</th>
              <th>Metal</th>
              <th>Weight</th>
              <th>Rate/kg</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Pending</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    root.querySelectorAll('[data-action="new-purchase"]').forEach((button) => {
      button.addEventListener('click', openPurchaseModal);
    });
    root.querySelectorAll('[data-action="delete-purchase"]').forEach((button) => {
      button.addEventListener('click', () => deletePurchase(button.dataset.id));
    });
    root.querySelectorAll('[data-action="view-purchase"]').forEach((button) => {
      button.addEventListener('click', () => viewPurchase(button.dataset.id));
    });
  }

  function deletePurchase(id) {
    const purchase = SL.state.purchases.find((item) => item.id === id);
    if (!purchase) return;
    if (!window.confirm('Delete this purchase and adjust stock?')) return;
    SL.state.purchases = SL.state.purchases.filter((item) => item.id !== id);
    purchase.items.forEach((item) => {
      const inventory = SL.state.inventory[item.metalId] || { quantity: 0, averageCost: 0, value: 0 };
      inventory.quantity = Math.max(0, Number(inventory.quantity || 0) - Number(item.netWeight || 0));
      inventory.value = Math.max(0, Number(inventory.value || 0) - Number(item.materialCost || 0));
      inventory.averageCost = inventory.quantity > 0 ? inventory.value / inventory.quantity : 0;
      SL.state.inventory[item.metalId] = inventory;
    });
    SL.app.saveState();
    render();
    SL.utils.showToast('Purchase removed.', 'success');
  }

  function viewPurchase(id) {
    const purchase = SL.state.purchases.find((item) => item.id === id);
    if (!purchase) return;
    alert(`Purchase ${purchase.purchaseId}\nSupplier: ${purchase.supplierName}\nTotal: ${SL.utils.formatCurrency(purchase.totalCost)}`);
  }

  function updatePurchaseItemTotals(container) {
    const itemRows = container.querySelectorAll('.purchase-item-row');
    itemRows.forEach((row) => {
      const metalSelect = row.querySelector('[name="metalId"]');
      const gross = Number(row.querySelector('[name="grossWeight"]').value || 0);
      const tare = Number(row.querySelector('[name="tareWeight"]').value || 0);
      const net = gross - tare;
      row.querySelector('[name="netWeight"]').value = net > 0 ? net : 0;
      const metalName = metalSelect.options[metalSelect.selectedIndex]?.text || 'Metal';
      if (metalName && row.querySelector('[name="metalId"]').value) {
        row.dataset.metalName = metalName;
      }
    });
  }

  function openPurchaseModal() {
    const modalRoot = document.getElementById('modalRoot');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="modal-backdrop open">
        <div class="modal">
          <div class="modal-header">
            <h3>New Purchase</h3>
            <button class="close-btn" type="button" data-close-modal="true">×</button>
          </div>
          <form id="purchase-form">
            <div class="form-grid">
              <div class="form-group">
                <label>Date</label>
                <input type="date" name="date" value="${SL.utils.todayString()}" required />
              </div>
              <div class="form-group">
                <label>Supplier</label>
                <select name="supplierId" required>
                  <option value="">Select supplier</option>
                  ${SL.state.suppliers.map((supplier) => `<option value="${supplier.id}">${supplier.name}</option>`).join('')}
                </select>
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
              <div class="form-group">
                <label>Vehicle Number</label>
                <input type="text" name="vehicleNumber" placeholder="UP14AB1234" />
              </div>
            </div>

            <div class="section-head" style="margin-top: 20px; margin-bottom: 12px;">
              <h4>Purchase Items</h4>
              <button class="button button-secondary" type="button" id="add-purchase-item">+ Add Item</button>
            </div>
            <div id="purchase-items-container">
              ${buildPurchaseItemRow(0)}
            </div>

            <div class="form-grid" style="margin-top: 16px;">
              <div class="form-group">
                <label>Transport Cost</label>
                <input type="number" step="0.01" name="transportCost" value="0" />
              </div>
              <div class="form-group">
                <label>Loading Cost</label>
                <input type="number" step="0.01" name="loadingCost" value="0" />
              </div>
              <div class="form-group">
                <label>Unloading Cost</label>
                <input type="number" step="0.01" name="unloadingCost" value="0" />
              </div>
              <div class="form-group">
                <label>Other Charges</label>
                <input type="number" step="0.01" name="otherCharges" value="0" />
              </div>
              <div class="form-group">
                <label>Amount Paid</label>
                <input type="number" step="0.01" name="amountPaid" value="0" />
              </div>
            </div>

            <div class="form-group" style="margin-top: 16px;">
              <label>Notes</label>
              <textarea name="notes"></textarea>
            </div>

            <div class="form-actions">
              <button class="button" type="button" data-close-modal="true">Cancel</button>
              <button class="button button-primary" type="submit">Save Purchase</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const container = modalRoot.querySelector('#purchase-items-container');
    container.addEventListener('input', () => updatePurchaseItemTotals(container));

    modalRoot.querySelector('#add-purchase-item').addEventListener('click', () => {
      const count = container.querySelectorAll('.purchase-item-row').length;
      container.insertAdjacentHTML('beforeend', buildPurchaseItemRow(count));
    });

    modalRoot.querySelector('[data-close-modal="true"]').addEventListener('click', () => {
      modalRoot.innerHTML = '';
    });
    modalRoot.querySelectorAll('[data-close-modal="true"]').forEach((button) => {
      button.addEventListener('click', () => {
        modalRoot.innerHTML = '';
      });
    });

    modalRoot.querySelector('#purchase-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.target;
      const container = form.querySelector('#purchase-items-container');
      updatePurchaseItemTotals(container);
      const date = form.date.value;
      const supplierId = form.supplierId.value;
      const supplier = SL.state.suppliers.find((entry) => entry.id === supplierId);
      const rows = Array.from(container.querySelectorAll('.purchase-item-row'));
      const items = rows.map((row) => {
        const metalId = row.querySelector('[name="metalId"]').value;
        const metal = SL.state.metals.find((entry) => entry.id === metalId);
        const grossWeight = Number(row.querySelector('[name="grossWeight"]').value || 0);
        const tareWeight = Number(row.querySelector('[name="tareWeight"]').value || 0);
        const netWeight = Math.max(grossWeight - tareWeight, 0);
        const rate = Number(row.querySelector('[name="rate"]').value || 0);
        row.querySelector('[name="netWeight"]').value = netWeight;
        const materialCost = netWeight * rate;
        return {
          metalId,
          metalName: metal ? metal.name : 'Unknown',
          scrapCategory: row.querySelector('[name="scrapCategory"]').value,
          grossWeight,
          tareWeight,
          netWeight,
          rate,
          materialCost,
        };
      }).filter((item) => item.metalId && Number(item.netWeight || 0) > 0 && Number(item.rate || 0) >= 0);

      if (!supplier || !items.length) {
        SL.utils.showToast('Select a supplier and at least one valid item.', 'error');
        return;
      }

      const transportCost = Number(form.transportCost.value || 0);
      const loadingCost = Number(form.loadingCost.value || 0);
      const unloadingCost = Number(form.unloadingCost.value || 0);
      const otherCharges = Number(form.otherCharges.value || 0);
      const amountPaid = Number(form.amountPaid.value || 0);
      const totalCost = items.reduce((sum, item) => sum + item.materialCost, 0) + transportCost + loadingCost + unloadingCost + otherCharges;
      const pendingAmount = Math.max(totalCost - amountPaid, 0);
      const id = SL.storage.generateId('PUR');
      const purchase = {
        id,
        purchaseId: `PUR-${SL.state.purchases.length + 1}`.padEnd(8, '0'),
        date,
        supplierId: supplier.id,
        supplierName: supplier.name,
        paymentMethod: form.paymentMethod.value,
        vehicleNumber: form.vehicleNumber.value,
        notes: form.notes.value,
        items,
        transportCost,
        loadingCost,
        unloadingCost,
        otherCharges,
        totalCost,
        amountPaid,
        pendingAmount,
      };

      SL.state.purchases.push(purchase);
      items.forEach((item) => {
        const inventory = SL.state.inventory[item.metalId] || { quantity: 0, averageCost: 0, value: 0 };
        const oldValue = Number(inventory.value || 0);
        const oldQty = Number(inventory.quantity || 0);
        const newQty = oldQty + Number(item.netWeight || 0);
        const newValue = oldValue + Number(item.materialCost || 0) + (transportCost / Math.max(items.length, 1));
        inventory.quantity = newQty;
        inventory.value = newValue;
        inventory.averageCost = newQty > 0 ? newValue / newQty : 0;
        inventory.lastUpdated = date;
        inventory.metalId = item.metalId;
        SL.state.inventory[item.metalId] = inventory;
        SL.state.inventoryMovements.push({
          id: SL.storage.generateId('MOV'),
          date,
          type: 'Purchase',
          metal: item.metalName,
          quantity: Number(item.netWeight || 0),
          rate: Number(item.rate || 0),
          value: Number(item.materialCost || 0),
          reference: purchase.purchaseId,
        });
      });
      SL.state.auditLog.push({
        action: 'Added',
        recordType: 'Purchase',
        recordId: purchase.purchaseId,
        timestamp: new Date().toISOString(),
      });

      if (supplier) {
        supplier.openingBalance = Number(supplier.openingBalance || 0) + pendingAmount;
      }

      SL.app.saveState();
      modalRoot.innerHTML = '';
      render();
      SL.utils.showToast('Purchase saved successfully.', 'success');
    });
  }

  SL.modules.purchases = { render, openPurchaseModal };
})();

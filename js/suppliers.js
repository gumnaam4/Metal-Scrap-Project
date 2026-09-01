(function () {
  const SL = window.ScrapLedger = window.ScrapLedger || {};
  SL.modules = SL.modules || {};

  function render() {
    const root = document.getElementById('suppliers-page');
    if (!root) return;

    const rows = SL.state.suppliers.length ? SL.state.suppliers.map((supplier) => `
      <tr>
        <td>${supplier.name}</td>
        <td>${supplier.company || '-'}</td>
        <td>${supplier.phone || '-'}</td>
        <td>${supplier.email || '-'}</td>
        <td>${SL.utils.formatCurrency(Number(supplier.openingBalance || 0))}</td>
      </tr>
    `).join('') : `
      <tr>
        <td colspan="5"><div class="empty-state">No suppliers recorded yet.</div></td>
      </tr>
    `;

    root.innerHTML = `
      <div class="section-head">
        <h2>Suppliers</h2>
        <div class="section-toolbar">
          <button class="button button-primary" type="button" id="add-supplier-btn">+ Add Supplier</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Opening Balance</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    root.querySelector('#add-supplier-btn').addEventListener('click', openSupplierModal);
  }

  function openSupplierModal() {
    const modalRoot = document.getElementById('modalRoot');
    modalRoot.innerHTML = `
      <div class="modal-backdrop open">
        <div class="modal">
          <div class="modal-header">
            <h3>Add Supplier</h3>
            <button class="close-btn" type="button" data-close-modal="true">×</button>
          </div>
          <form id="supplier-form">
            <div class="form-grid">
              <div class="form-group"><label>Name</label><input name="name" required /></div>
              <div class="form-group"><label>Company</label><input name="company" /></div>
              <div class="form-group"><label>Phone</label><input name="phone" /></div>
              <div class="form-group"><label>Email</label><input name="email" type="email" /></div>
              <div class="form-group"><label>Address</label><input name="address" /></div>
              <div class="form-group"><label>GST Number</label><input name="gstNumber" /></div>
              <div class="form-group"><label>Opening Balance</label><input name="openingBalance" type="number" step="0.01" value="0" /></div>
              <div class="form-group"><label>Notes</label><input name="notes" /></div>
            </div>
            <div class="form-actions">
              <button class="button" type="button" data-close-modal="true">Cancel</button>
              <button class="button button-primary" type="submit">Save Supplier</button>
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

    modalRoot.querySelector('#supplier-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.target;
      const supplier = {
        id: SL.storage.generateId('SUP'),
        name: form.name.value.trim(),
        company: form.company.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
        address: form.address.value.trim(),
        gstNumber: form.gstNumber.value.trim(),
        openingBalance: Number(form.openingBalance.value || 0),
        notes: form.notes.value.trim(),
      };
      if (!supplier.name) {
        SL.utils.showToast('Supplier name is required.', 'error');
        return;
      }
      SL.state.suppliers.push(supplier);
      SL.state.auditLog.push({ action: 'Added', recordType: 'Supplier', recordId: supplier.id, timestamp: new Date().toISOString() });
      SL.app.saveState();
      modalRoot.innerHTML = '';
      render();
      SL.utils.showToast('Supplier saved.', 'success');
    });
  }

  SL.modules.suppliers = { render };
})();

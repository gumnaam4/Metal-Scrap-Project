(function () {
  const SL = window.ScrapLedger = window.ScrapLedger || {};
  SL.modules = SL.modules || {};

  function render() {
    const root = document.getElementById('payments-page');
    if (!root) return;

    const rows = SL.state.payments.length ? SL.state.payments.map((payment) => `
      <tr>
        <td>${payment.date}</td>
        <td>${payment.party}</td>
        <td>${payment.type}</td>
        <td>${SL.utils.formatCurrency(payment.amount || 0)}</td>
        <td>${payment.paymentMethod}</td>
        <td>${payment.reference || '-'}</td>
      </tr>
    `).join('') : `
      <tr>
        <td colspan="6"><div class="empty-state">No payment records yet.</div></td>
      </tr>
    `;

    root.innerHTML = `
      <div class="section-head">
        <h2>Payments</h2>
        <div class="section-toolbar">
          <button class="button button-primary" type="button" id="add-payment-btn">+ Record Payment</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Party</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    root.querySelector('#add-payment-btn').addEventListener('click', openPaymentModal);
  }

  function openPaymentModal() {
    const modalRoot = document.getElementById('modalRoot');
    modalRoot.innerHTML = `
      <div class="modal-backdrop open">
        <div class="modal">
          <div class="modal-header">
            <h3>Record Payment</h3>
            <button class="close-btn" type="button" data-close-modal="true">×</button>
          </div>
          <form id="payment-form">
            <div class="form-grid">
              <div class="form-group"><label>Date</label><input type="date" name="date" value="${SL.utils.todayString()}" required /></div>
              <div class="form-group"><label>Party</label><input name="party" required /></div>
              <div class="form-group"><label>Amount</label><input type="number" step="0.01" name="amount" min="0" required /></div>
              <div class="form-group"><label>Payment Type</label><select name="type"><option>Customer</option><option>Supplier</option></select></div>
              <div class="form-group"><label>Payment Method</label><select name="paymentMethod"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option><option>Other</option></select></div>
              <div class="form-group"><label>Reference</label><input name="reference" /></div>
              <div class="form-group" style="grid-column: span 2;"><label>Notes</label><textarea name="notes"></textarea></div>
            </div>
            <div class="form-actions">
              <button class="button" type="button" data-close-modal="true">Cancel</button>
              <button class="button button-primary" type="submit">Save Payment</button>
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

    modalRoot.querySelector('#payment-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.target;
      const payment = {
        id: SL.storage.generateId('PAY'),
        date: form.date.value,
        party: form.party.value.trim(),
        amount: Number(form.amount.value || 0),
        type: form.type.value,
        paymentMethod: form.paymentMethod.value,
        reference: form.reference.value.trim(),
        notes: form.notes.value.trim(),
      };
      if (!payment.party || payment.amount <= 0) {
        SL.utils.showToast('Party and amount are required.', 'error');
        return;
      }
      SL.state.payments.push(payment);
      SL.state.auditLog.push({ action: 'Added', recordType: 'Payment', recordId: payment.id, timestamp: new Date().toISOString() });
      SL.app.saveState();
      modalRoot.innerHTML = '';
      render();
      SL.utils.showToast('Payment recorded.', 'success');
    });
  }

  SL.modules.payments = { render };
})();

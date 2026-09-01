(function () {
  const SL = window.ScrapLedger = window.ScrapLedger || {};
  SL.modules = SL.modules || {};

  const expenseCategories = [
    'Transport', 'Labour', 'Loading', 'Unloading', 'Fuel', 'Electricity', 'Rent', 'Salary', 'Repairs', 'Office', 'Miscellaneous', 'Other'
  ];

  function render() {
    const root = document.getElementById('expenses-page');
    if (!root) return;

    const rows = SL.state.expenses.length ? SL.state.expenses.map((expense) => `
      <tr>
        <td>${expense.date}</td>
        <td>${expense.category}</td>
        <td>${SL.utils.formatCurrency(expense.amount || 0)}</td>
        <td>${expense.paymentMethod || '-'}</td>
        <td>${expense.description || '-'}</td>
      </tr>
    `).join('') : `
      <tr>
        <td colspan="5"><div class="empty-state">No expenses recorded yet.</div></td>
      </tr>
    `;

    root.innerHTML = `
      <div class="section-head">
        <h2>Expenses</h2>
        <div class="section-toolbar">
          <button class="button button-primary" type="button" id="add-expense-btn">+ Add Expense</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    root.querySelector('#add-expense-btn').addEventListener('click', openExpenseModal);
  }

  function openExpenseModal() {
    const modalRoot = document.getElementById('modalRoot');
    modalRoot.innerHTML = `
      <div class="modal-backdrop open">
        <div class="modal">
          <div class="modal-header">
            <h3>Add Expense</h3>
            <button class="close-btn" type="button" data-close-modal="true">×</button>
          </div>
          <form id="expense-form">
            <div class="form-grid">
              <div class="form-group"><label>Date</label><input type="date" name="date" value="${SL.utils.todayString()}" required /></div>
              <div class="form-group"><label>Category</label><select name="category">${expenseCategories.map((c) => `<option>${c}</option>`).join('')}</select></div>
              <div class="form-group"><label>Amount</label><input type="number" step="0.01" name="amount" min="0" required /></div>
              <div class="form-group"><label>Payment Method</label><select name="paymentMethod"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option><option>Other</option></select></div>
              <div class="form-group" style="grid-column: span 2;"><label>Description</label><textarea name="description"></textarea></div>
            </div>
            <div class="form-actions">
              <button class="button" type="button" data-close-modal="true">Cancel</button>
              <button class="button button-primary" type="submit">Save Expense</button>
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

    modalRoot.querySelector('#expense-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = event.target;
      const expense = {
        id: SL.storage.generateId('EXP'),
        date: form.date.value,
        category: form.category.value,
        amount: Number(form.amount.value || 0),
        paymentMethod: form.paymentMethod.value,
        description: form.description.value.trim(),
      };
      if (expense.amount < 0) {
        SL.utils.showToast('Expense amount cannot be negative.', 'error');
        return;
      }
      SL.state.expenses.push(expense);
      SL.state.auditLog.push({ action: 'Added', recordType: 'Expense', recordId: expense.id, timestamp: new Date().toISOString() });
      SL.app.saveState();
      modalRoot.innerHTML = '';
      render();
      SL.utils.showToast('Expense saved.', 'success');
    });
  }

  SL.modules.expenses = { render };
})();

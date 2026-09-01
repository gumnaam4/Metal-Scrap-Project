(function () {
  const SL = window.ScrapLedger = window.ScrapLedger || {};
  SL.modules = SL.modules || {};

  function renderMetals() {
    const root = document.getElementById('metals-page');
    if (!root) return;

    root.innerHTML = `
      <div class="section-head">
        <h2>Metal Types</h2>
        <div class="section-toolbar">
          <button class="button button-primary" type="button" id="add-metal-btn">+ Add Metal</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Metal</th><th>Status</th><th>Subcategories</th></tr></thead>
          <tbody>
            ${SL.state.metals.map((metal) => `
              <tr>
                <td>${metal.name}</td>
                <td><span class="badge ${metal.enabled ? 'success' : 'warning'}">${metal.enabled ? 'Active' : 'Disabled'}</span></td>
                <td>${(metal.subcategories || []).join(', ') || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    root.querySelector('#add-metal-btn').addEventListener('click', () => {
      const name = window.prompt('Enter metal name:');
      if (!name) return;
      SL.state.metals.push({
        id: SL.storage.generateId('MET'),
        name: name.trim(),
        enabled: true,
        subcategories: [],
      });
      SL.app.saveState();
      renderMetals();
    });
  }

  function render() {
    const root = document.getElementById('settings-page');
    if (!root) return;

    const settings = SL.state.settings || {};
    root.innerHTML = `
      <div class="section-head">
        <h2>Settings</h2>
      </div>
      <form id="settings-form">
        <div class="form-grid">
          <div class="form-group"><label>Business Name</label><input name="businessName" value="${settings.businessName || ''}" /></div>
          <div class="form-group"><label>Owner Name</label><input name="ownerName" value="${settings.ownerName || ''}" /></div>
          <div class="form-group"><label>Phone</label><input name="phone" value="${settings.phone || ''}" /></div>
          <div class="form-group"><label>Address</label><input name="address" value="${settings.address || ''}" /></div>
          <div class="form-group"><label>GST Number</label><input name="gstNumber" value="${settings.gstNumber || ''}" /></div>
          <div class="form-group"><label>Currency</label><input name="currency" value="${settings.currency || 'INR'}" /></div>
          <div class="form-group"><label>Default Payment Method</label><select name="defaultPaymentMethod"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option><option>Other</option></select></div>
          <div class="form-group"><label>Invoice Prefix</label><input name="invoicePrefix" value="${settings.invoicePrefix || 'INV'}" /></div>
          <div class="form-group"><label>Theme</label><select name="theme"><option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option><option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option></select></div>
          <div class="form-group"><label>Low Stock Threshold</label><input name="lowStockThreshold" type="number" min="0" value="${settings.lowStockThreshold || 50}" /></div>
        </div>
        <div class="form-actions">
          <button class="button button-primary" type="submit">Save Settings</button>
          <button class="button button-secondary" type="button" id="load-demo-btn">Load Demo Data</button>
          <button class="button button-danger" type="button" id="clear-data-btn">Clear All Data</button>
        </div>
      </form>
    `;

    const form = root.querySelector('#settings-form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      SL.state.settings = {
        ...SL.state.settings,
        businessName: formData.get('businessName') || 'ScrapLedger',
        ownerName: formData.get('ownerName') || 'Business Owner',
        phone: formData.get('phone') || '',
        address: formData.get('address') || '',
        gstNumber: formData.get('gstNumber') || '',
        currency: formData.get('currency') || 'INR',
        defaultPaymentMethod: formData.get('defaultPaymentMethod') || 'Cash',
        invoicePrefix: formData.get('invoicePrefix') || 'INV',
        theme: formData.get('theme') || 'light',
        lowStockThreshold: Number(formData.get('lowStockThreshold') || 50),
      };
      document.body.classList.toggle('dark', SL.state.settings.theme === 'dark');
      SL.app.saveState();
      SL.utils.showToast('Settings saved.', 'success');
    });

    root.querySelector('#load-demo-btn').addEventListener('click', () => {
      if (!window.confirm('Load demo data? This will replace current records.')) return;
      const demo = createDemoData();
      SL.state = demo;
      SL.app.saveState();
      SL.app.setPage('dashboard');
      SL.utils.showToast('Demo data loaded.', 'success');
    });

    root.querySelector('#clear-data-btn').addEventListener('click', () => {
      if (!window.confirm('Clear all data? This cannot be undone.')) return;
      SL.state = SL.storage.resetStorage();
      SL.app.saveState();
      SL.app.setPage('dashboard');
      SL.utils.showToast('All data cleared.', 'success');
    });
  }

  function createDemoData() {
    const defaultState = SL.storage.getDefaultState();
    defaultState.settings.businessName = 'ScrapLedger Demo';

    const customers = Array.from({ length: 10 }, (_, index) => ({
      id: `customer-${index + 1}`,
      name: `Customer ${index + 1}`,
      company: `Company ${index + 1}`,
      phone: `98${String(index + 1).padStart(8, '0')}`,
      email: `customer${index + 1}@mail.com`,
      address: 'Industrial Area',
      gstNumber: `27ABCDE${index + 1}2Z5`,
      openingBalance: 1500 + index * 800,
      notes: '',
    }));

    const suppliers = Array.from({ length: 10 }, (_, index) => ({
      id: `supplier-${index + 1}`,
      name: `Supplier ${index + 1}`,
      company: `Supplier Co ${index + 1}`,
      phone: `99${String(index + 1).padStart(8, '0')}`,
      email: `supplier${index + 1}@mail.com`,
      address: 'Market Road',
      gstNumber: `27XYZDE${index + 1}1Z5`,
      openingBalance: 2000 + index * 1000,
      notes: '',
    }));

    const metals = [
      { id: 'metal-1', name: 'Iron', enabled: true, subcategories: ['MS Scrap'] },
      { id: 'metal-2', name: 'Steel', enabled: true, subcategories: [] },
      { id: 'metal-3', name: 'Stainless Steel', enabled: true, subcategories: [] },
      { id: 'metal-4', name: 'Copper', enabled: true, subcategories: ['Copper Wire', 'Copper Pipe'] },
      { id: 'metal-5', name: 'Aluminium', enabled: true, subcategories: ['Aluminium Sheet'] },
      { id: 'metal-6', name: 'Brass', enabled: true, subcategories: [] },
      { id: 'metal-7', name: 'Bronze', enabled: true, subcategories: [] },
      { id: 'metal-8', name: 'Lead', enabled: true, subcategories: [] },
      { id: 'metal-9', name: 'Zinc', enabled: true, subcategories: [] },
      { id: 'metal-10', name: 'Battery Scrap', enabled: true, subcategories: [] },
      { id: 'metal-11', name: 'E-Waste', enabled: true, subcategories: [] },
      { id: 'metal-12', name: 'Mixed Metal', enabled: true, subcategories: [] },
      { id: 'metal-13', name: 'Other', enabled: true, subcategories: [] },
    ];

    const inventory = {};
    metals.forEach((metal, index) => {
      inventory[metal.id] = {
        metalId: metal.id,
        quantity: 120 + index * 30,
        averageCost: 120 + index * 12,
        value: (120 + index * 30) * (120 + index * 12),
        lastUpdated: '2026-09-01',
      };
    });

    defaultState.metals = metals;
    defaultState.customers = customers;
    defaultState.suppliers = suppliers;
    defaultState.inventory = inventory;
    defaultState.priceBoard = metals.map((metal, index) => ({
      id: `price-${index + 1}`,
      metalId: metal.id,
      metalName: metal.name,
      buyRate: 120 + index * 10,
      sellRate: 160 + index * 12,
      previousRate: 150 + index * 9,
      change: 4.5 + index,
    }));
    defaultState.purchases = [];
    defaultState.sales = [];
    defaultState.expenses = [];
    defaultState.payments = [];
    defaultState.inventoryMovements = [];
    defaultState.auditLog = [];
    return defaultState;
  }

  SL.modules.settings = { render, renderMetals, createDemoData };
})();

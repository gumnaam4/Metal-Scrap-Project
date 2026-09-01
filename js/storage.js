(function () {
  const SL = window.ScrapLedger = window.ScrapLedger || {};
  const STORAGE_KEY = 'scrapledger-app-v1';

  function getDefaultState() {
    const metals = [
      'Iron', 'Steel', 'Stainless Steel', 'Copper', 'Aluminium', 'Brass', 'Bronze', 'Lead', 'Zinc', 'Battery Scrap', 'E-Waste', 'Mixed Metal', 'Other'
    ];

    const defaultMetals = metals.map((metal, idx) => ({
      id: `metal-${idx + 1}`,
      name: metal,
      enabled: true,
      subcategories: [],
    }));

    return {
      settings: {
        businessName: 'ScrapLedger',
        ownerName: 'Business Owner',
        phone: '',
        address: '',
        gstNumber: '',
        currency: 'INR',
        defaultPaymentMethod: 'Cash',
        invoicePrefix: 'INV',
        theme: 'light',
        lowStockThreshold: 50,
      },
      metals: defaultMetals,
      customers: [],
      suppliers: [],
      purchases: [],
      sales: [],
      expenses: [],
      payments: [],
      priceBoard: [],
      inventory: {},
      inventoryMovements: [],
      auditLog: [],
      closes: [],
      attachments: [],
    };
  }

  function mergeState(base, incoming) {
    const merged = { ...base, ...incoming };
    merged.settings = { ...base.settings, ...(incoming.settings || {}) };
    merged.metals = Array.isArray(incoming.metals) ? incoming.metals : base.metals;
    merged.customers = Array.isArray(incoming.customers) ? incoming.customers : base.customers;
    merged.suppliers = Array.isArray(incoming.suppliers) ? incoming.suppliers : base.suppliers;
    merged.purchases = Array.isArray(incoming.purchases) ? incoming.purchases : base.purchases;
    merged.sales = Array.isArray(incoming.sales) ? incoming.sales : base.sales;
    merged.expenses = Array.isArray(incoming.expenses) ? incoming.expenses : base.expenses;
    merged.payments = Array.isArray(incoming.payments) ? incoming.payments : base.payments;
    merged.priceBoard = Array.isArray(incoming.priceBoard) ? incoming.priceBoard : base.priceBoard;
    merged.inventory = incoming.inventory || base.inventory;
    merged.inventoryMovements = Array.isArray(incoming.inventoryMovements) ? incoming.inventoryMovements : base.inventoryMovements;
    merged.auditLog = Array.isArray(incoming.auditLog) ? incoming.auditLog : base.auditLog;
    merged.closes = Array.isArray(incoming.closes) ? incoming.closes : base.closes;
    merged.attachments = Array.isArray(incoming.attachments) ? incoming.attachments : base.attachments;
    return merged;
  }

  function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const defaults = getDefaultState();
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }

    try {
      const parsed = JSON.parse(raw);
      return mergeState(defaults, parsed);
    } catch (error) {
      console.error('Storage load failed', error);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getState() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(getDefaultState()));
  }

  function ensureInventoryForMetals(data = loadData()) {
    const state = data || loadData();
    const inventoryMap = { ...state.inventory };
    state.metals.forEach((metal) => {
      if (!inventoryMap[metal.id]) {
        inventoryMap[metal.id] = { metalId: metal.id, quantity: 0, averageCost: 0, lastUpdated: null };
      }
    });
    state.inventory = inventoryMap;
    saveData(state);
    return state;
  }

  function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }

  function resetStorage() {
    localStorage.removeItem(STORAGE_KEY);
    const defaults = getDefaultState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }

  SL.storage = {
    STORAGE_KEY,
    getDefaultState,
    loadData,
    saveData,
    getState,
    ensureInventoryForMetals,
    generateId,
    resetStorage,
  };
})();

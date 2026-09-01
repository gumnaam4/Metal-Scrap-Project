(function () {
  const SL = window.ScrapLedger = window.ScrapLedger || {};

  SL.state = SL.storage.loadData();
  SL.pages = Array.from(document.querySelectorAll('.page'));
  SL.navButtons = Array.from(document.querySelectorAll('.nav-item'));
  SL.pageTitle = document.getElementById('pageTitle');
  SL.globalSearch = document.getElementById('globalSearch');
  SL.currentPage = 'dashboard';

  function saveState() {
    const currentState = SL.state || SL.storage.loadData();
    SL.state = SL.storage.ensureInventoryForMetals(currentState);
    SL.storage.saveData(SL.state);
  }

  function setPage(pageName) {
    SL.currentPage = pageName;
    SL.pages.forEach((page) => page.classList.toggle('active', page.id === `${pageName}-page`));
    SL.navButtons.forEach((button) => button.classList.toggle('active', button.dataset.page === pageName));
    SL.pageTitle.textContent = pageName === 'profitloss' ? 'Profit & Loss' : pageName.charAt(0).toUpperCase() + pageName.slice(1);
    if (pageName === 'dashboard') SL.pageTitle.textContent = 'Dashboard';
    document.querySelectorAll('.page').forEach((page) => {
      if (page.id === `${pageName}-page`) {
        page.classList.add('active');
      } else {
        page.classList.remove('active');
      }
    });
    if (pageName === 'dashboard') {
      if (typeof SL.modules.dashboard.render === 'function') SL.modules.dashboard.render();
    }
    if (pageName === 'purchases') {
      if (typeof SL.modules.purchases.render === 'function') SL.modules.purchases.render();
    }
    if (pageName === 'sales') {
      if (typeof SL.modules.sales.render === 'function') SL.modules.sales.render();
    }
    if (pageName === 'inventory') {
      if (typeof SL.modules.inventory.render === 'function') SL.modules.inventory.render();
    }
    if (pageName === 'customers') {
      if (typeof SL.modules.customers.render === 'function') SL.modules.customers.render();
    }
    if (pageName === 'suppliers') {
      if (typeof SL.modules.suppliers.render === 'function') SL.modules.suppliers.render();
    }
    if (pageName === 'expenses') {
      if (typeof SL.modules.expenses.render === 'function') SL.modules.expenses.render();
    }
    if (pageName === 'payments') {
      if (typeof SL.modules.payments.render === 'function') SL.modules.payments.render();
    }
    if (pageName === 'profitloss') {
      if (typeof SL.modules.reports.renderProfitLoss === 'function') SL.modules.reports.renderProfitLoss();
    }
    if (pageName === 'reports') {
      if (typeof SL.modules.reports.render === 'function') SL.modules.reports.render();
    }
    if (pageName === 'vehiclevaluation') {
      if (typeof SL.modules.vehicleValuation.render === 'function') SL.modules.vehicleValuation.render();
    }
    if (pageName === 'metals') {
      if (typeof SL.modules.settings.renderMetals === 'function') SL.modules.settings.renderMetals();
    }
    if (pageName === 'settings') {
      if (typeof SL.modules.settings.render === 'function') SL.modules.settings.render();
    }
  }

  function toggleSidebar(forceOpen) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar || !overlay) return;
    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', shouldOpen);
    overlay.classList.toggle('open', shouldOpen);
  }

  function bindEvents() {
    document.querySelectorAll('.nav-item').forEach((button) => {
      button.addEventListener('click', () => {
        setPage(button.dataset.page);
        toggleSidebar(false);
      });
    });

    document.getElementById('mobileToggle').addEventListener('click', () => {
      toggleSidebar();
    });

    document.getElementById('sidebarOverlay').addEventListener('click', () => {
      toggleSidebar(false);
    });

    document.getElementById('themeToggle').addEventListener('click', () => {
      const nextTheme = SL.state.settings.theme === 'dark' ? 'light' : 'dark';
      SL.state.settings.theme = nextTheme;
      document.body.classList.toggle('dark', nextTheme === 'dark');
      document.getElementById('themeToggle').textContent = nextTheme === 'dark' ? '🌙' : '☀️';
      SL.app.saveState();
    });

    document.querySelectorAll('[data-quick]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.quick;
        if (action === 'purchase') {
          SL.modules.purchases.openPurchaseModal();
        }
        if (action === 'sale') {
          SL.modules.sales.openSaleModal();
        }
      });
    });

    SL.globalSearch.addEventListener('input', SL.utils.debounce((event) => {
      const term = event.target.value.trim().toLowerCase();
      const results = [];
      if (!term) {
        SL.modules.search.lastTerm = '';
        return;
      }
      const fields = [
        ...SL.state.customers,
        ...SL.state.suppliers,
        ...SL.state.purchases,
        ...SL.state.sales,
        ...SL.state.payments,
        ...SL.state.metals,
      ];
      fields.forEach((item) => {
        const haystack = JSON.stringify(item).toLowerCase();
        if (haystack.includes(term)) results.push(item);
      });
      if (typeof SL.modules.search !== 'undefined') {
        SL.modules.search.renderResults(results, term);
      }
    }, 200));
  }

  function initTheme() {
    const theme = SL.state.settings.theme || 'light';
    document.body.classList.toggle('dark', theme === 'dark');
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
  }

  function init() {
    SL.state = SL.storage.loadData();
    initTheme();
    bindEvents();
    setPage('dashboard');
    if (typeof SL.modules.dashboard.render === 'function') SL.modules.dashboard.render();
  }

  SL.modules = SL.modules || {};
  SL.app = {
    init,
    saveState,
    setPage,
    getCurrentPage: () => SL.currentPage,
  };

  document.addEventListener('DOMContentLoaded', init);
})();

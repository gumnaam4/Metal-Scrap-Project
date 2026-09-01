(function () {
  const SL = window.ScrapLedger = window.ScrapLedger || {};

  function formatCurrency(amount) {
    const value = Number(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(value) || 0);
  }

  function toNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  function todayString() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function dateToInput(date) {
    const d = new Date(date);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function randomId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }

  function safeText(value) {
    return String(value || '').trim();
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<strong>${type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info'}:</strong> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2800);
  }

  function debounce(fn, delay = 250) {
    let timeoutId = null;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  SL.utils = {
    formatCurrency,
    formatNumber,
    toNumber,
    todayString,
    dateToInput,
    randomId,
    safeText,
    showToast,
    debounce,
    deepClone,
  };
})();

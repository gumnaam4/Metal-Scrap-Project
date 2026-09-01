(function () {
  const SL = window.ScrapLedger = window.ScrapLedger || {};
  SL.modules = SL.modules || {};

  function renderResults(results, term) {
    const panel = document.getElementById('globalSearchResults');
    if (!panel) return;

    if (!term || !results.length) {
      panel.innerHTML = '<div class="search-result-item">No results found.</div>';
      panel.classList.add('open');
      if (!term) panel.classList.remove('open');
      return;
    }

    panel.innerHTML = results.slice(0, 8).map((item) => {
      let type = 'Record';
      let text = '';
      if (item.name) {
        type = item.company ? 'Customer' : 'Supplier';
        text = item.name;
      } else if (item.purchaseId) {
        type = 'Purchase';
        text = item.purchaseId;
      } else if (item.saleId) {
        type = 'Sale';
        text = item.saleId;
      } else if (item.metalName) {
        type = 'Metal';
        text = item.metalName;
      } else if (item.party) {
        type = 'Payment';
        text = item.party;
      }
      return `<div class="search-result-item"><strong>${type}</strong><div>${text || JSON.stringify(item)}</div></div>`;
    }).join('');
    panel.classList.add('open');
  }

  SL.modules.search = { renderResults };
})();

(function () {
  const SL = window.ScrapLedger = window.ScrapLedger || {};
  SL.modules = SL.modules || {};

  const DEFAULT_PARTS = [
    { name: 'Engine', condition: 'Working', estimatedBuyPrice: 0, estimatedSellPrice: 22000, confidence: 'Medium' },
    { name: 'Gearbox', condition: 'Working', estimatedBuyPrice: 0, estimatedSellPrice: 12000, confidence: 'Medium' },
    { name: 'Alternator', condition: 'Working', estimatedBuyPrice: 0, estimatedSellPrice: 4000, confidence: 'Medium' },
    { name: 'Starter motor', condition: 'Working', estimatedBuyPrice: 0, estimatedSellPrice: 3500, confidence: 'Medium' },
    { name: 'ECU', condition: 'Working', estimatedBuyPrice: 0, estimatedSellPrice: 6500, confidence: 'Medium' },
    { name: 'AC compressor', condition: 'Working', estimatedBuyPrice: 0, estimatedSellPrice: 5500, confidence: 'Medium' },
    { name: 'Radiator', condition: 'Working', estimatedBuyPrice: 0, estimatedSellPrice: 2800, confidence: 'Medium' },
    { name: 'Doors', condition: 'Repairable', estimatedBuyPrice: 0, estimatedSellPrice: 4000, confidence: 'Medium' },
    { name: 'Bonnet', condition: 'Repairable', estimatedBuyPrice: 0, estimatedSellPrice: 2500, confidence: 'Medium' },
    { name: 'Headlights', condition: 'Working', estimatedBuyPrice: 0, estimatedSellPrice: 1800, confidence: 'Medium' },
    { name: 'Tail lights', condition: 'Working', estimatedBuyPrice: 0, estimatedSellPrice: 1400, confidence: 'Medium' },
    { name: 'Wheels', condition: 'Repairable', estimatedBuyPrice: 0, estimatedSellPrice: 2800, confidence: 'Medium' },
    { name: 'Tyres', condition: 'Working', estimatedBuyPrice: 0, estimatedSellPrice: 2000, confidence: 'Medium' },
    { name: 'Catalytic converter', condition: 'Working', estimatedBuyPrice: 0, estimatedSellPrice: 7500, confidence: 'Medium' },
    { name: 'Suspension components', condition: 'Repairable', estimatedBuyPrice: 0, estimatedSellPrice: 4200, confidence: 'Medium' },
    { name: 'Other', condition: 'Scrap', estimatedBuyPrice: 0, estimatedSellPrice: 1500, confidence: 'Low' },
  ];

  function createEmptyVehicleRecord() {
    return {
      id: SL.utils.randomId('veh'),
      make: '',
      model: '',
      year: new Date().getFullYear(),
      variant: '',
      fuelType: '',
      engine: '',
      engineDisplacement: '',
      bodyType: '',
      transmission: '',
      drivetrain: '',
      dimensions: '',
      curbWeightKg: 0,
      dataSource: 'Manual Entry',
      lastUpdated: new Date().toISOString(),
      isFavorite: false,
      parts: DEFAULT_PARTS.map((part) => ({ ...part })),
      valuation: null,
      notes: '',
    };
  }

  function ensureVehicleRecord(rawVehicle) {
    const base = rawVehicle || createEmptyVehicleRecord();
    const normalized = {
      ...createEmptyVehicleRecord(),
      ...base,
      parts: Array.isArray(base.parts) && base.parts.length ? base.parts.map((part) => ({ ...part })) : DEFAULT_PARTS.map((part) => ({ ...part })),
      id: base.id || SL.utils.randomId('veh'),
      lastUpdated: base.lastUpdated || new Date().toISOString(),
    };

    if (!normalized.make && !normalized.model) {
      normalized.make = 'Unknown';
      normalized.model = 'Vehicle';
    }

    return normalized;
  }

  function calculateVehicleValuation(vehicle, scrapRates = SL.state.scrapRates || {}, parts = []) {
    const safeVehicle = ensureVehicleRecord(vehicle);
    const composition = SL.state.vehicleComposition || {
      ferrousPercent: 65,
      aluminiumPercent: 8,
      copperPercent: 2,
      batteryPercent: 1.5,
      otherPercent: 23.5,
    };

    const curbWeight = Number(safeVehicle.curbWeightKg || 0);
    const ageYears = Math.max(0, new Date().getFullYear() - Number(safeVehicle.year || new Date().getFullYear()));
    const ageFactor = Math.max(0, 1 - (ageYears * 0.015));

    const ferrousKg = curbWeight * (composition.ferrousPercent / 100) * ageFactor;
    const aluminiumKg = curbWeight * (composition.aluminiumPercent / 100) * ageFactor;
    const copperKg = curbWeight * (composition.copperPercent / 100) * ageFactor;
    const batteryKg = curbWeight * (composition.batteryPercent / 100) * ageFactor;
    const otherKg = curbWeight * (composition.otherPercent / 100) * ageFactor;

    const scrapValue = (
      ferrousKg * Number(scrapRates.ferrous || 0) +
      aluminiumKg * Number(scrapRates.aluminium || 0) +
      copperKg * Number(scrapRates.copper || 0) +
      batteryKg * Number(scrapRates.battery || 0) +
      otherKg * Number(scrapRates.other || 0)
    );

    const totalPartsValue = (Array.isArray(parts) ? parts : safeVehicle.parts || []).reduce((sum, part) => {
      const sellValue = Number(part.estimatedSellPrice || 0);
      return sum + sellValue;
    }, 0);

    const dismantlingCost = Number(safeVehicle.dismantlingCost || 12000);
    const transportCost = Number(safeVehicle.transportCost || 3000);
    const otherCosts = Number(safeVehicle.otherCosts || 2000);
    const desiredProfit = Number(safeVehicle.desiredProfit || 20000);

    const netRecovery = scrapValue + totalPartsValue - dismantlingCost - transportCost - otherCosts;
    const recommendedMaxBuyPrice = Math.max(0, netRecovery - desiredProfit);

    return {
      vehicle: safeVehicle,
      composition: {
        ferrousKg,
        aluminiumKg,
        copperKg,
        batteryKg,
        otherKg,
      },
      scrapValue,
      totalPartsValue,
      netRecovery,
      recommendedMaxBuyPrice,
      desiredProfit,
      dismantlingCost,
      transportCost,
      otherCosts,
      ageYears,
      dataSources: {
        vehicle: safeVehicle.dataSource || 'Manual Entry',
        scrapRates: 'Business rate board',
        parts: 'Business database',
        composition: 'Business estimate',
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  function getVehicleRecordById(id) {
    return (SL.state.vehicleRecords || []).find((record) => record.id === id);
  }

  function saveVehicleRecord(record) {
    const safeRecord = ensureVehicleRecord(record);
    const records = SL.state.vehicleRecords || [];
    const index = records.findIndex((item) => item.id === safeRecord.id);
    if (index >= 0) {
      records[index] = safeRecord;
    } else {
      records.unshift(safeRecord);
    }
    SL.state.vehicleRecords = records;
    SL.app.saveState();
    return safeRecord;
  }

  function updateRecentVehicles(vehicle) {
    const label = `${vehicle.make || 'Unknown'} ${vehicle.model || 'Vehicle'} ${vehicle.year || ''}`.trim();
    const recent = (SL.state.recentVehicles || []).filter((entry) => entry && entry.id !== vehicle.id);
    recent.unshift({
      id: vehicle.id || SL.utils.randomId('veh'),
      label,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      variant: vehicle.variant,
      timestamp: new Date().toISOString(),
    });
    SL.state.recentVehicles = recent.slice(0, 6);
    SL.app.saveState();
  }

  function toggleFavoriteVehicle(recordId) {
    const favorites = new Set(SL.state.favoriteVehicleIds || []);
    if (favorites.has(recordId)) {
      favorites.delete(recordId);
    } else {
      favorites.add(recordId);
    }
    SL.state.favoriteVehicleIds = [...favorites];
    SL.app.saveState();
    render();
  }

  function getVehicleSearchOptions() {
    return {
      makes: [],
      models: [],
      years: [],
      variants: [],
    };
  }

  function render() {
    const root = document.getElementById('vehiclevaluation-page');
    if (!root) return;

    const favorites = (SL.state.favoriteVehicleIds || [])
      .map((id) => getVehicleRecordById(id))
      .filter(Boolean);

    const recentVehicles = (SL.state.recentVehicles || []).slice(0, 6);

    root.innerHTML = `
      <div class="section-head">
        <h2>Vehicle Valuation</h2>
      </div>

      <div class="card" style="padding: 18px; margin-bottom: 18px;">
        <div class="section-head" style="margin-bottom: 12px;">
          <h3 style="margin: 0;">Vehicle Search</h3>
        </div>
        <form id="vehicle-search-form" class="form-grid">
          <div class="form-group">
            <label>Brand</label>
            <select name="make" id="vehicle-make-select"></select>
          </div>
          <div class="form-group">
            <label>Model</label>
            <select name="model" id="vehicle-model-select"></select>
          </div>
          <div class="form-group">
            <label>Year</label>
            <select name="year" id="vehicle-year-select"></select>
          </div>
          <div class="form-group">
            <label>Variant/Trim</label>
            <select name="variant" id="vehicle-variant-select"></select>
          </div>
        </form>
        <div class="form-actions">
          <button class="button button-primary" type="button" id="vehicle-search-btn">Look up vehicle</button>
          <button class="button button-secondary" type="button" id="manual-vehicle-btn">Manual entry</button>
        </div>
      </div>

      <div class="metrics-row">
        <div class="card chart-card">
          <div class="chart-title">
            <span>Favorites</span>
          </div>
          <div class="flex-row">
            ${(favorites.length ? favorites : [{ make: 'Maruti Suzuki', model: 'Swift', year: 2012 }, { make: 'Hyundai', model: 'i10', year: 2014 }]).map((vehicle) => `
              <button class="button button-secondary" type="button" data-select-favorite="${vehicle.make}|${vehicle.model}|${vehicle.year}|${vehicle.variant || ''}">${vehicle.make} ${vehicle.model} ${vehicle.year}</button>
            `).join('')}
          </div>
        </div>

        <div class="card chart-card">
          <div class="chart-title">
            <span>Recently Viewed</span>
          </div>
          <ol style="margin: 0; padding-left: 20px;">
            ${(recentVehicles.length ? recentVehicles : [
              { label: 'Maruti Swift 2012' },
              { label: 'Hyundai i10 2014' },
              { label: 'Tata Indica 2010' },
              { label: 'Honda City 2013' }
            ]).map((vehicle) => `<li>${vehicle.label}</li>`).join('')}
          </ol>
        </div>
      </div>

      <div class="section-head" style="margin-top: 20px;">
        <h3 style="margin: 0;">Vehicle Database</h3>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Make</th>
              <th>Model</th>
              <th>Year</th>
              <th>Variant</th>
              <th>Fuel</th>
              <th>Weight</th>
              <th>Last Updated</th>
              <th>Data Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${(SL.state.vehicleRecords || []).length ? (SL.state.vehicleRecords || []).map((vehicle) => `
              <tr>
                <td>${vehicle.make || '-'}</td>
                <td>${vehicle.model || '-'}</td>
                <td>${vehicle.year || '-'}</td>
                <td>${vehicle.variant || '-'}</td>
                <td>${vehicle.fuelType || '-'}</td>
                <td>${vehicle.curbWeightKg ? `${vehicle.curbWeightKg} kg` : '-'}</td>
                <td>${new Date(vehicle.lastUpdated || Date.now()).toLocaleDateString()}</td>
                <td>${vehicle.dataSource || 'Manual Entry'}</td>
                <td>
                  <span class="flex-row">
                    <button class="button button-secondary" type="button" data-view-vehicle="${vehicle.id}">View</button>
                    <button class="button button-secondary" type="button" data-edit-vehicle="${vehicle.id}">Edit</button>
                    <button class="button button-danger" type="button" data-delete-vehicle="${vehicle.id}">Delete</button>
                    <button class="button button-primary" type="button" data-recalc-vehicle="${vehicle.id}">Recalculate</button>
                  </span>
                </td>
              </tr>
            `).join('') : `<tr><td colspan="9"><div class="empty-state">No vehicles stored yet.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    const form = document.getElementById('vehicle-search-form');
    const makeSelect = document.getElementById('vehicle-make-select');
    const modelSelect = document.getElementById('vehicle-model-select');
    const yearSelect = document.getElementById('vehicle-year-select');
    const variantSelect = document.getElementById('vehicle-variant-select');

    populateSelect(makeSelect, ['-- Select brand --', ...getVehicleSearchOptions().makes], 'Select brand');
    populateSelect(modelSelect, ['-- Select model --'], 'Select model');
    populateSelect(yearSelect, ['-- Select year --'], 'Select year');
    populateSelect(variantSelect, ['-- Select variant --'], 'Select variant');

    const loadVehicleDropdowns = async () => {
      const makes = await VehicleAPI.searchMakes();
      populateSelect(makeSelect, ['-- Select brand --', ...makes], 'Select brand');
      makeSelect.value = makes[0] || '';
      const modelOptions = await VehicleAPI.searchModels(makeSelect.value || '');
      populateSelect(modelSelect, ['-- Select model --', ...modelOptions], 'Select model');
      const yearOptions = await VehicleAPI.searchYears(makeSelect.value || '', modelSelect.value || '');
      populateSelect(yearSelect, ['-- Select year --', ...yearOptions.map(String)], 'Select year');
      const variantOptions = await VehicleAPI.getVariants(makeSelect.value || '', modelSelect.value || '', yearSelect.value || '');
      populateSelect(variantSelect, ['-- Select variant --', ...variantOptions], 'Select variant');
    };

    makeSelect.addEventListener('change', async () => {
      const list = await VehicleAPI.searchModels(makeSelect.value || '');
      populateSelect(modelSelect, ['-- Select model --', ...list], 'Select model');
      const years = await VehicleAPI.searchYears(makeSelect.value || '', modelSelect.value || '');
      populateSelect(yearSelect, ['-- Select year --', ...years.map(String)], 'Select year');
      const variants = await VehicleAPI.getVariants(makeSelect.value || '', modelSelect.value || '', yearSelect.value || '');
      populateSelect(variantSelect, ['-- Select variant --', ...variants], 'Select variant');
    });

    modelSelect.addEventListener('change', async () => {
      const years = await VehicleAPI.searchYears(makeSelect.value || '', modelSelect.value || '');
      populateSelect(yearSelect, ['-- Select year --', ...years.map(String)], 'Select year');
      const variants = await VehicleAPI.getVariants(makeSelect.value || '', modelSelect.value || '', yearSelect.value || '');
      populateSelect(variantSelect, ['-- Select variant --', ...variants], 'Select variant');
    });

    yearSelect.addEventListener('change', async () => {
      const variants = await VehicleAPI.getVariants(makeSelect.value || '', modelSelect.value || '', yearSelect.value || '');
      populateSelect(variantSelect, ['-- Select variant --', ...variants], 'Select variant');
    });

    loadVehicleDropdowns();

    document.getElementById('vehicle-search-btn').addEventListener('click', async () => {
      const make = makeSelect.value;
      const model = modelSelect.value;
      const year = yearSelect.value;
      const variant = variantSelect.value;

      if (!make || !model || !year || !variant) {
        SL.utils.showToast('Please choose brand, model, year and variant.', 'error');
        return;
      }

      const vehicle = await VehicleAPI.getVehicleDetails({ make, model, year, variant });
      const record = ensureVehicleRecord(vehicle || { make, model, year, variant, dataSource: 'Manual Entry' });

      if (!vehicle) {
        SL.utils.showToast('Vehicle database temporarily unavailable. You can enter the vehicle details manually.', 'error');
      }

      saveVehicleRecord(record);
      updateRecentVehicles(record);
      openVehicleDetails(record);
    });

    document.getElementById('manual-vehicle-btn').addEventListener('click', () => {
      openVehicleDetails(createEmptyVehicleRecord());
    });

    root.querySelectorAll('[data-select-favorite]').forEach((button) => {
      button.addEventListener('click', () => {
        const [make, model, year, variant] = button.dataset.selectFavorite.split('|');
        if (!make) return;
        const detail = { make, model, year: Number(year), variant: variant || 'Standard' };
        VehicleAPI.getVehicleDetails(detail).then((vehicle) => {
          const record = ensureVehicleRecord(vehicle || detail);
          saveVehicleRecord(record);
          updateRecentVehicles(record);
          openVehicleDetails(record);
        });
      });
    });

    root.querySelectorAll('[data-view-vehicle]').forEach((button) => {
      button.addEventListener('click', () => {
        const record = getVehicleRecordById(button.dataset.viewVehicle);
        if (record) openVehicleDetails(record);
      });
    });

    root.querySelectorAll('[data-edit-vehicle]').forEach((button) => {
      button.addEventListener('click', () => {
        const record = getVehicleRecordById(button.dataset.editVehicle);
        if (record) openVehicleDetails(record, true);
      });
    });

    root.querySelectorAll('[data-delete-vehicle]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.deleteVehicle;
        SL.state.vehicleRecords = (SL.state.vehicleRecords || []).filter((item) => item.id !== id);
        SL.state.favoriteVehicleIds = (SL.state.favoriteVehicleIds || []).filter((favoriteId) => favoriteId !== id);
        SL.app.saveState();
        render();
      });
    });

    root.querySelectorAll('[data-recalc-vehicle]').forEach((button) => {
      button.addEventListener('click', () => {
        const record = getVehicleRecordById(button.dataset.recalcVehicle);
        if (record) {
          const valuation = calculateVehicleValuation(record, SL.state.scrapRates || {}, record.parts || []);
          record.valuation = valuation;
          saveVehicleRecord(record);
          openVehicleDetails(record);
        }
      });
    });

    form.reset();
  }

  function populateSelect(selectElement, options, placeholder) {
    if (!selectElement) return;
    selectElement.innerHTML = '';
    const list = Array.isArray(options) ? options : [placeholder];
    list.forEach((optionValue) => {
      const option = document.createElement('option');
      const value = typeof optionValue === 'string' ? optionValue : String(optionValue);
      option.value = value === placeholder ? '' : value;
      option.textContent = value === placeholder ? placeholder : value;
      selectElement.appendChild(option);
    });
  }

  function openVehicleDetails(vehicle, isEditMode = false) {
    const record = ensureVehicleRecord(vehicle);

    const valuation = calculateVehicleValuation(record, SL.state.scrapRates || {}, record.parts || []);
    record.valuation = valuation;
    saveVehicleRecord(record);

    const root = document.getElementById('vehiclevaluation-page');
    if (!root) return;

    const detailHtml = `
      <div class="card" style="padding: 18px; margin-top: 20px;">
        <div class="section-head">
          <h3 style="margin: 0;">Vehicle Details</h3>
          <button class="button button-primary" type="button" id="save-vehicle-record-btn">${isEditMode ? 'Update' : 'Save'} Vehicle</button>
        </div>

        <div class="form-grid">
          <div class="form-group"><label>Make</label><input name="make" value="${record.make || ''}" /></div>
          <div class="form-group"><label>Model</label><input name="model" value="${record.model || ''}" /></div>
          <div class="form-group"><label>Year</label><input type="number" name="year" value="${record.year || new Date().getFullYear()}" /></div>
          <div class="form-group"><label>Variant/Trim</label><input name="variant" value="${record.variant || ''}" /></div>
          <div class="form-group"><label>Fuel type</label><input name="fuelType" value="${record.fuelType || ''}" /></div>
          <div class="form-group"><label>Engine</label><input name="engine" value="${record.engine || ''}" /></div>
          <div class="form-group"><label>Engine displacement</label><input name="engineDisplacement" value="${record.engineDisplacement || ''}" /></div>
          <div class="form-group"><label>Body type</label><input name="bodyType" value="${record.bodyType || ''}" /></div>
          <div class="form-group"><label>Transmission</label><input name="transmission" value="${record.transmission || ''}" /></div>
          <div class="form-group"><label>Drivetrain</label><input name="drivetrain" value="${record.drivetrain || ''}" /></div>
          <div class="form-group"><label>Dimensions</label><input name="dimensions" value="${record.dimensions || ''}" /></div>
          <div class="form-group"><label>Curb/kerb weight (kg)</label><input type="number" name="curbWeightKg" value="${record.curbWeightKg || ''}" /></div>
          <div class="form-group" style="grid-column: 1 / -1;"><label>Other specifications</label><textarea name="otherSpecs">${record.otherSpecs || ''}</textarea></div>
          <div class="form-group" style="grid-column: 1 / -1;"><label>Notes</label><textarea name="notes">${record.notes || ''}</textarea></div>
        </div>

        <div class="form-actions">
          <button class="button button-secondary" type="button" id="toggle-favorite-btn">${(SL.state.favoriteVehicleIds || []).includes(record.id) ? '★ Unfavorite' : '☆ Favorite'}</button>
        </div>
      </div>

      <div class="card" style="padding: 18px; margin-top: 20px;">
        <div class="section-head">
          <h3 style="margin: 0;">Estimated composition</h3>
        </div>
        <div class="form-grid">
          <div class="form-group"><label>Ferrous %</label><input type="number" id="ferrousPercent" value="${SL.state.vehicleComposition.ferrousPercent || 65}" /></div>
          <div class="form-group"><label>Aluminium %</label><input type="number" id="aluminiumPercent" value="${SL.state.vehicleComposition.aluminiumPercent || 8}" /></div>
          <div class="form-group"><label>Copper %</label><input type="number" id="copperPercent" value="${SL.state.vehicleComposition.copperPercent || 2}" /></div>
          <div class="form-group"><label>Battery %</label><input type="number" id="batteryPercent" value="${SL.state.vehicleComposition.batteryPercent || 1.5}" /></div>
          <div class="form-group"><label>Other %</label><input type="number" id="otherPercent" value="${SL.state.vehicleComposition.otherPercent || 23.5}" /></div>
        </div>
      </div>

      <div class="card" style="padding: 18px; margin-top: 20px;">
        <div class="section-head">
          <h3 style="margin: 0;">Recoverable Parts</h3>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Part</th>
                <th>Condition</th>
                <th>Estimated Buy Price</th>
                <th>Estimated Sell Price</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              ${(record.parts || []).map((part) => `
                <tr>
                  <td>${part.name}</td>
                  <td><select data-part-condition="${part.name}"><option value="Working" ${part.condition === 'Working' ? 'selected' : ''}>Working</option><option value="Repairable" ${part.condition === 'Repairable' ? 'selected' : ''}>Repairable</option><option value="Damaged" ${part.condition === 'Damaged' ? 'selected' : ''}>Damaged</option><option value="Scrap" ${part.condition === 'Scrap' ? 'selected' : ''}>Scrap</option><option value="Unknown" ${part.condition === 'Unknown' ? 'selected' : ''}>Unknown</option></select></td>
                  <td><input type="number" data-part-buy="${part.name}" value="${part.estimatedBuyPrice || 0}" /></td>
                  <td><input type="number" data-part-sell="${part.name}" value="${part.estimatedSellPrice || 0}" /></td>
                  <td><select data-part-confidence="${part.name}"><option value="High" ${part.confidence === 'High' ? 'selected' : ''}>High</option><option value="Medium" ${part.confidence === 'Medium' ? 'selected' : ''}>Medium</option><option value="Low" ${part.confidence === 'Low' ? 'selected' : ''}>Low</option></select></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card" style="padding: 18px; margin-top: 20px;">
        <h3 style="margin-top: 0;">VEHICLE VALUATION</h3>
        <div class="form-grid">
          <div class="form-group"><label>Vehicle</label><input value="${record.make || ''} ${record.model || ''} ${record.year || ''} ${record.variant || ''}" readonly /></div>
          <div class="form-group"><label>Estimated Scrap Value</label><input value="${SL.utils.formatCurrency(valuation.scrapValue)}" readonly /></div>
          <div class="form-group"><label>Estimated Spare Parts Value</label><input value="${SL.utils.formatCurrency(valuation.totalPartsValue)}" readonly /></div>
          <div class="form-group"><label>Estimated Total Recovery</label><input value="${SL.utils.formatCurrency(valuation.scrapValue + valuation.totalPartsValue)}" readonly /></div>
          <div class="form-group"><label>Dismantling Cost</label><input value="${SL.utils.formatCurrency(valuation.dismantlingCost)}" readonly /></div>
          <div class="form-group"><label>Transport</label><input value="${SL.utils.formatCurrency(valuation.transportCost)}" readonly /></div>
          <div class="form-group"><label>Other Costs</label><input value="${SL.utils.formatCurrency(valuation.otherCosts)}" readonly /></div>
          <div class="form-group"><label>Estimated Net Recovery</label><input value="${SL.utils.formatCurrency(valuation.netRecovery)}" readonly /></div>
          <div class="form-group"><label>Desired Profit</label><input value="${SL.utils.formatCurrency(valuation.desiredProfit)}" readonly /></div>
          <div class="form-group"><label>Recommended Max Buy Price</label><input value="${SL.utils.formatCurrency(valuation.recommendedMaxBuyPrice)}" readonly /></div>
        </div>
        <p class="small-text">Vehicle specifications: ${record.dataSource || 'Manual Entry'}<br />Scrap rates: Business rate board<br />Parts prices: Business database<br />Vehicle composition: Business estimate<br />Last updated: ${new Date(valuation.lastUpdated || Date.now()).toLocaleString()}</p>
      </div>
    `;

    root.insertAdjacentHTML('beforeend', detailHtml);

    const saveButton = document.getElementById('save-vehicle-record-btn');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        const inputs = root.querySelectorAll('input, textarea, select');
        const updated = {
          ...record,
          make: root.querySelector('[name="make"]').value,
          model: root.querySelector('[name="model"]').value,
          year: Number(root.querySelector('[name="year"]').value || new Date().getFullYear()),
          variant: root.querySelector('[name="variant"]').value,
          fuelType: root.querySelector('[name="fuelType"]').value,
          engine: root.querySelector('[name="engine"]').value,
          engineDisplacement: root.querySelector('[name="engineDisplacement"]').value,
          bodyType: root.querySelector('[name="bodyType"]').value,
          transmission: root.querySelector('[name="transmission"]').value,
          drivetrain: root.querySelector('[name="drivetrain"]').value,
          dimensions: root.querySelector('[name="dimensions"]').value,
          curbWeightKg: Number(root.querySelector('[name="curbWeightKg"]').value || 0),
          notes: root.querySelector('[name="notes"]').value,
          otherSpecs: root.querySelector('[name="otherSpecs"]').value,
          lastUpdated: new Date().toISOString(),
          parts: (record.parts || []).map((part) => ({
            ...part,
            condition: root.querySelector(`[data-part-condition="${part.name}"]`)?.value || part.condition,
            estimatedBuyPrice: Number(root.querySelector(`[data-part-buy="${part.name}"]`)?.value || 0),
            estimatedSellPrice: Number(root.querySelector(`[data-part-sell="${part.name}"]`)?.value || 0),
            confidence: root.querySelector(`[data-part-confidence="${part.name}"]`)?.value || part.confidence,
          })),
        };

        SL.state.vehicleComposition = {
          ...SL.state.vehicleComposition,
          ferrousPercent: Number(document.getElementById('ferrousPercent')?.value || 65),
          aluminiumPercent: Number(document.getElementById('aluminiumPercent')?.value || 8),
          copperPercent: Number(document.getElementById('copperPercent')?.value || 2),
          batteryPercent: Number(document.getElementById('batteryPercent')?.value || 1.5),
          otherPercent: Number(document.getElementById('otherPercent')?.value || 23.5),
        };

        saveVehicleRecord(updated);
        updateRecentVehicles(updated);
        render();
      });
    }

    const favoriteButton = document.getElementById('toggle-favorite-btn');
    if (favoriteButton) {
      favoriteButton.addEventListener('click', () => {
        toggleFavoriteVehicle(record.id);
      });
    }
  }

  SL.modules.vehicleValuation = {
    render,
    calculateVehicleValuation,
    saveVehicleRecord,
    getVehicleRecordById,
    toggleFavoriteVehicle,
    openVehicleDetails,
  };
})();

(function () {
  const SL = window.ScrapLedger = window.ScrapLedger || {};

  const VEHICLE_API_CONFIG = {
    provider: 'vehdb',
    baseUrl: 'https://vehdb.com/api/v1/cars',
    apiKey: '107|vqB3qIXBkgIH5CjgYpxLjuMOxnU0OGRV4gefTrgV1ae42359',
  };

  SL.VEHICLE_API_CONFIG = SL.VEHICLE_API_CONFIG || VEHICLE_API_CONFIG;
  const API_CONFIG = SL.VEHICLE_API_CONFIG;

  const DEMO_VEHICLES = [
    {
      make: 'Maruti Suzuki',
      model: 'Swift',
      year: 2012,
      variant: 'VXi',
      fuelType: 'Petrol',
      engine: '1.2L K-Series',
      engineDisplacement: '1197 cc',
      bodyType: 'Hatchback',
      transmission: 'Manual',
      drivetrain: 'FWD',
      dimensions: 'Length 3,995 mm, Width 1,690 mm, Height 1,510 mm',
      curbWeightKg: 1090,
      dataSource: 'Vehicle API',
    },
    {
      make: 'Maruti Suzuki',
      model: 'Swift',
      year: 2014,
      variant: 'ZDi',
      fuelType: 'Diesel',
      engine: '1.3L DDiS',
      engineDisplacement: '1248 cc',
      bodyType: 'Hatchback',
      transmission: 'Manual',
      drivetrain: 'FWD',
      dimensions: 'Length 3,995 mm, Width 1,690 mm, Height 1,510 mm',
      curbWeightKg: 1120,
      dataSource: 'Vehicle API',
    },
    {
      make: 'Hyundai',
      model: 'i10',
      year: 2014,
      variant: 'Sportz',
      fuelType: 'Petrol',
      engine: '1.2L Kappa',
      engineDisplacement: '1197 cc',
      bodyType: 'Hatchback',
      transmission: 'Manual',
      drivetrain: 'FWD',
      dimensions: 'Length 3,595 mm, Width 1,595 mm, Height 1,545 mm',
      curbWeightKg: 980,
      dataSource: 'Vehicle API',
    },
    {
      make: 'Hyundai',
      model: 'i20',
      year: 2016,
      variant: 'Sportz',
      fuelType: 'Petrol',
      engine: '1.2L Kappa',
      engineDisplacement: '1197 cc',
      bodyType: 'Hatchback',
      transmission: 'Manual',
      drivetrain: 'FWD',
      dimensions: 'Length 3,995 mm, Width 1,730 mm, Height 1,505 mm',
      curbWeightKg: 1060,
      dataSource: 'Vehicle API',
    },
    {
      make: 'Tata',
      model: 'Indica',
      year: 2010,
      variant: 'DLS',
      fuelType: 'Diesel',
      engine: '1.4L',
      engineDisplacement: '1405 cc',
      bodyType: 'Hatchback',
      transmission: 'Manual',
      drivetrain: 'FWD',
      dimensions: 'Length 3,715 mm, Width 1,630 mm, Height 1,590 mm',
      curbWeightKg: 1080,
      dataSource: 'Vehicle API',
    },
    {
      make: 'Tata',
      model: 'Ace',
      year: 2018,
      variant: 'Mini Truck',
      fuelType: 'Diesel',
      engine: '1.5L',
      engineDisplacement: '1496 cc',
      bodyType: 'Truck',
      transmission: 'Manual',
      drivetrain: 'RWD',
      dimensions: 'Length 3,525 mm, Width 1,550 mm, Height 1,910 mm',
      curbWeightKg: 1225,
      dataSource: 'Vehicle API',
    },
    {
      make: 'Mahindra',
      model: 'Bolero',
      year: 2014,
      variant: 'SLE',
      fuelType: 'Diesel',
      engine: '2.5L CRDe',
      engineDisplacement: '2498 cc',
      bodyType: 'SUV',
      transmission: 'Manual',
      drivetrain: 'RWD',
      dimensions: 'Length 3,995 mm, Width 1,745 mm, Height 1,895 mm',
      curbWeightKg: 1710,
      dataSource: 'Vehicle API',
    },
    {
      make: 'Honda',
      model: 'City',
      year: 2013,
      variant: 'VX',
      fuelType: 'Petrol',
      engine: '1.5L i-VTEC',
      engineDisplacement: '1497 cc',
      bodyType: 'Sedan',
      transmission: 'Manual',
      drivetrain: 'FWD',
      dimensions: 'Length 4,440 mm, Width 1,695 mm, Height 1,480 mm',
      curbWeightKg: 1110,
      dataSource: 'Vehicle API',
    },
  ];

  function isApiConfigured() {
    return !!(API_CONFIG && API_CONFIG.baseUrl && API_CONFIG.baseUrl !== 'YOUR_API_URL' && API_CONFIG.provider !== 'YOUR_PROVIDER');
  }

  function normalizeVehicle(raw = {}) {
    const make = raw.make || raw.Make || raw.manufacturer || 'Unknown';
    const model = raw.model || raw.Model || raw.modelName || 'Unknown';
    const year = Number(raw.year || raw.Year || raw.modelYear || new Date().getFullYear());
    const variant = raw.variant || raw.variantName || raw.trim || raw.Trim || 'Standard';
    const fuelType = raw.fuelType || raw.fuel_type || raw.fuel || 'Unknown';
    const engine = raw.engine || raw.engineName || raw.engineType || raw.engineSize || 'Unknown';
    const engineDisplacement = raw.engineDisplacement || raw.engine_displacement || raw.displacement || 'Unknown';
    const bodyType = raw.bodyType || raw.body_type || raw.body || 'Unknown';
    const transmission = raw.transmission || raw.transmissionType || raw.gearbox || 'Unknown';
    const drivetrain = raw.drivetrain || raw.drive || raw.drivetrainType || 'Unknown';
    const dimensions = raw.dimensions || raw.vehicleDimensions || raw.dimensionsMm || 'Not available';
    const curbWeightKg = Number(raw.curbWeightKg || raw.curbWeight || raw.kerbWeight || raw.weightKg || raw.weight || 0);

    return {
      id: raw.id || `${String(make).trim()}|${String(model).trim()}|${year}|${String(variant).trim()}`,
      make: String(make).trim(),
      model: String(model).trim(),
      year,
      variant: String(variant).trim(),
      fuelType: String(fuelType).trim(),
      engine: String(engine).trim(),
      engineDisplacement: String(engineDisplacement).trim(),
      bodyType: String(bodyType).trim(),
      transmission: String(transmission).trim(),
      drivetrain: String(drivetrain).trim(),
      dimensions: String(dimensions).trim(),
      curbWeightKg,
      dataSource: raw.dataSource || 'Vehicle API',
      lastUpdated: raw.lastUpdated || new Date().toISOString(),
    };
  }

  function vehicleKey(make, model, year, variant) {
    return [make, model, year, variant]
      .map((part) => String(part || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'))
      .join('|');
  }

  function openVehicleDb() {
    return new Promise((resolve) => {
      if (!('indexedDB' in window)) {
        resolve(null);
        return;
      }

      const request = window.indexedDB.open('scrapledger-vehicle-cache', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('vehicles')) {
          db.createObjectStore('vehicles', { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }

  async function getCachedVehicle(key) {
    const db = await openVehicleDb();
    if (!db) return null;

    return new Promise((resolve) => {
      const transaction = db.transaction('vehicles', 'readonly');
      const store = transaction.objectStore('vehicles');
      const request = store.get(key);

      request.onsuccess = () => {
        const item = request.result;
        if (!item) {
          resolve(null);
          return;
        }

        const validUntil = new Date(item.fetchedAt).getTime() + 1000 * 60 * 60 * 24 * 30;
        if (Date.now() > validUntil) {
          resolve(null);
          return;
        }

        resolve(item.vehicle);
      };
      request.onerror = () => resolve(null);
    });
  }

  async function saveCachedVehicle(vehicle) {
    const db = await openVehicleDb();
    if (!db) return;

    const key = vehicleKey(vehicle.make, vehicle.model, vehicle.year, vehicle.variant);
    const record = {
      key,
      fetchedAt: new Date().toISOString(),
      vehicle,
    };

    return new Promise((resolve) => {
      const transaction = db.transaction('vehicles', 'readwrite');
      const store = transaction.objectStore('vehicles');
      const request = store.put(record);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }

  function fallbackVehicles(make, model, year, variant) {
    const filtered = DEMO_VEHICLES.filter((vehicle) => {
      const matchesMake = !make || vehicle.make.toLowerCase() === make.toLowerCase();
      const matchesModel = !model || vehicle.model.toLowerCase() === model.toLowerCase();
      const matchesYear = !year || Number(vehicle.year) === Number(year);
      const matchesVariant = !variant || vehicle.variant.toLowerCase() === variant.toLowerCase();
      return matchesMake && matchesModel && matchesYear && matchesVariant;
    });

    return filtered.map(normalizeVehicle);
  }

  async function buildVehicleQueryUrl(query) {
    if (!isApiConfigured()) return null;

    try {
      const url = new URL(API_CONFIG.baseUrl);
      if (query.make) url.searchParams.set('make', query.make);
      if (query.model) url.searchParams.set('model', query.model);
      if (query.year) url.searchParams.set('year', String(query.year));
      if (query.variant) url.searchParams.set('variant', query.variant);
      url.searchParams.set('format', 'json');
      return url.toString();
    } catch (error) {
      console.warn('Vehicle API config is invalid.', error);
      return null;
    }
  }

  async function requestExternalVehicleData(query) {
    if (!isApiConfigured()) return null;

    const url = await buildVehicleQueryUrl(query);
    if (!url) return null;

    try {
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      if (API_CONFIG.apiKey) {
        headers.Authorization = `Bearer ${API_CONFIG.apiKey}`;
        headers['x-api-key'] = API_CONFIG.apiKey;
        headers['api-key'] = API_CONFIG.apiKey;
        url = new URL(url);
        url.searchParams.set('api_key', API_CONFIG.apiKey);
      }

      const response = await fetch(url, { headers });
      if (!response.ok) {
        return null;
      }

      const payload = await response.json();
      const list = Array.isArray(payload) ? payload : Array.isArray(payload.results) ? payload.results : Array.isArray(payload.data) ? payload.data : Array.isArray(payload.vehicles) ? payload.vehicles : [];

      if (!list.length) return null;
      return list.map(normalizeVehicle);
    } catch (error) {
      console.warn('Vehicle API request failed.', error);
      return null;
    }
  }

  async function searchMakes() {
    const base = fallbackVehicles();
    const sorted = [...new Set(base.map((vehicle) => vehicle.make))].sort();

    if (!isApiConfigured()) {
      return sorted;
    }

    const external = await requestExternalVehicleData({});
    const externalMakes = (external || []).map((vehicle) => vehicle.make);
    return [...new Set([...sorted, ...externalMakes])].sort();
  }

  async function searchModels(make) {
    const mapped = fallbackVehicles(make);
    const models = [...new Set(mapped.map((vehicle) => vehicle.model))].sort();

    if (!isApiConfigured() || !make) {
      return models;
    }

    const external = await requestExternalVehicleData({ make });
    const externalModels = (external || []).map((vehicle) => vehicle.model);
    return [...new Set([...models, ...externalModels])].sort();
  }

  async function searchYears(make, model) {
    const mapped = fallbackVehicles(make, model);
    const years = [...new Set(mapped.map((vehicle) => Number(vehicle.year)))].sort((a, b) => a - b);

    if (!isApiConfigured() || !make || !model) {
      return years;
    }

    const external = await requestExternalVehicleData({ make, model });
    const externalYears = (external || []).map((vehicle) => Number(vehicle.year));
    return [...new Set([...years, ...externalYears])].sort((a, b) => a - b);
  }

  async function getVariants(make, model, year) {
    const mapped = fallbackVehicles(make, model, year);
    const variants = [...new Set(mapped.map((vehicle) => vehicle.variant))].sort();

    if (!isApiConfigured() || !make || !model || !year) {
      return variants;
    }

    const external = await requestExternalVehicleData({ make, model, year });
    const externalVariants = (external || []).map((vehicle) => vehicle.variant);
    return [...new Set([...variants, ...externalVariants])].sort();
  }

  async function getVehicleDetails({ make, model, year, variant }) {
    const key = vehicleKey(make, model, year, variant);
    const cached = await getCachedVehicle(key);
    if (cached) {
      return { ...cached, dataSource: cached.dataSource || 'IndexedDB Cache' };
    }

    const matched = fallbackVehicles(make, model, year, variant)[0];
    if (matched) {
      await saveCachedVehicle(matched);
      return matched;
    }

    if (!isApiConfigured()) {
      return null;
    }

    const external = await requestExternalVehicleData({ make, model, year, variant });
    const vehicle = (external || []).find((entry) => {
      const normalized = normalizeVehicle(entry);
      return (
        normalized.make.toLowerCase() === String(make).toLowerCase() &&
        normalized.model.toLowerCase() === String(model).toLowerCase() &&
        Number(normalized.year) === Number(year) &&
        normalized.variant.toLowerCase() === String(variant).toLowerCase()
      );
    });

    if (!vehicle) {
      return null;
    }

    const normalized = normalizeVehicle(vehicle);
    await saveCachedVehicle(normalized);
    return normalized;
  }

  const VehicleAPI = {
    config: API_CONFIG,
    searchMakes,
    searchModels,
    searchYears,
    getVariants,
    getVehicleDetails,
    normalizeVehicle,
    vehicleKey,
    clearCache: async () => {
      const db = await openVehicleDb();
      if (!db) return true;
      return new Promise((resolve) => {
        const request = db.transaction('vehicles', 'readwrite').objectStore('vehicles').clear();
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    },
  };

  window.VehicleAPI = VehicleAPI;
})();

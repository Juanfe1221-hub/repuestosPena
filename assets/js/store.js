/* Capa de datos. La interfaz usa solo estos métodos, así que funciona igual en local o con BD. */
(function () {
  const cfg = window.CONFIG, KD = 'tp_db', KM = 'tp_mode', KT = 'tp_token', KS = 'tp_seeded_v6';

  /* Puntos interactivos por defecto sobre el vehículo de muestra (coordenadas en % X, Y) */
  const DEFAULT_HOTSPOTS = [
    { id: 'hs-frenos', category: 'Frenos', label: 'Frenos (Pastillas, Discos, Mordazas)', icon: 'bi-disc-fill', x: 48, y: 74 },
    { id: 'hs-motor', category: 'Motor', label: 'Motor (Bujías, Kit Repartición, Empaques)', icon: 'bi-gear-wide-connected', x: 26, y: 50 },
    { id: 'hs-filtros', category: 'Filtros', label: 'Filtros (Aceite, Aire, Combustible, Cabina)', icon: 'bi-funnel-fill', x: 20, y: 63 },
    { id: 'hs-electrico', category: 'Eléctrico', label: 'Eléctrico (Batería, Alternador, Sensores)', icon: 'bi-lightning-charge-fill', x: 35, y: 45 },
    { id: 'hs-iluminacion', category: 'Iluminación', label: 'Iluminación (Farolas, Bombillos LED, Exploradoras)', icon: 'bi-lightbulb-fill', x: 36, y: 58 },
    { id: 'hs-suspension', category: 'Suspensión', label: 'Suspensión (Amortiguadores, Tijeras, Espirales)', icon: 'bi-arrows-collapse-vertical', x: 86, y: 69 }
  ];

  const SEED = {
    categories: ['Frenos', 'Filtros', 'Eléctrico', 'Motor', 'Suspensión', 'Iluminación'].map((name, i) => ({ id: i + 1, name })),
    brands: ['Bosch', 'Brembo', 'Denso', 'Depo', 'Fram', 'KYB', 'MAC', 'Mann', 'Monroe', 'NGK', 'Philips'].map((name, i) => ({ id: i + 1, name })),
    vehicles: [
      { id: 1, name: 'Kia', model_sample: 'Kia Picanto GT Line / Vibrant', logo: 'assets/img/brands/picanto.webp', car_image: 'assets/img/brands/picanto.webp' },
      { id: 2, name: 'Mazda', model_sample: 'Mazda 3 Sport Skyactiv', logo: 'assets/img/brands/mazdaCar.png', car_image: 'assets/img/brands/mazdaCar.png' },
      { id: 3, name: 'Subaru', model_sample: 'Subaru WRX Symmetrical AWD', logo: 'assets/img/brands/subaru.webp', car_image: 'assets/img/brands/subaru.png' },
      { id: 4, name: 'Toyota', model_sample: 'Toyota Corolla / Hilux', logo: 'assets/img/brands/toyota.webp', car_image: 'assets/img/brands/subaru.png' },
      { id: 5, name: 'Chevrolet', model_sample: 'Chevrolet Onix / Tracker', logo: 'assets/img/brands/chevrolet.webp', car_image: 'assets/img/brands/picanto.webp' },
      { id: 6, name: 'Renault', model_sample: 'Renault Logan / Duster / Sandero', logo: '', car_image: 'assets/img/brands/mazdaCar.png' }
    ],
    products: [
      {
        id: 1,
        name: 'Pastillas de Freno Delanteras Cerámicas',
        category_id: 1,
        brand_id: 2,
        price: 185000,
        description: 'Juego de pastillas delanteras en compuesto cerámico de alto desempeño. Frenado silencioso, baja emisión de polvo y máxima disipación térmica.',
        specs: 'Compuesto: Cerámico OEM+\nPosición: Eje delantero (set x4)\nIncluye láminas antirruido\nSensor de desgaste acústico',
        image: '',
        active: 1,
        vehicles: [1, 2, 3, 4, 5, 6]
      },
      {
        id: 2,
        name: 'Amortiguador Delantero a Gas Excel-G',
        category_id: 5,
        brand_id: 6,
        price: 265000,
        description: 'Amortiguador bitubo presurizado con nitrógeno que restaura el control de estabilidad y confort original del vehículo en carretera y ciudad.',
        specs: 'Tecnología: Gas Nitrógeno (Bitubo)\nVástago cromado de triple labio\nVálvula de control gradual\nGarantía de fábrica: 12 meses',
        image: '',
        active: 1,
        vehicles: [1, 2, 3, 4, 5, 6]
      },
      {
        id: 3,
        name: 'Batería Silver Plus 750 AMP Libre Mantenimiento',
        category_id: 3,
        brand_id: 7,
        price: 420000,
        description: 'Batería automotriz sellada con tecnología de rejilla expandida de plata-calcio para arranque confiable en todo tipo de clima.',
        specs: 'Capacidad de arranque: 750 A\nReserva: 95 minutos\nVoltaje: 12V libre de mantenimiento\nBornes estándar reforzados',
        image: '',
        active: 1,
        vehicles: [1, 2, 3, 4, 5, 6]
      },
      {
        id: 4,
        name: 'Kit x4 Bujías Iridium IX Encendido Avanzado',
        category_id: 4,
        brand_id: 10,
        price: 168000,
        description: 'Bujías con electrodo central de iridio soldado por láser de 0.6 mm. Mejora la respuesta del acelerador y optimiza el consumo de combustible.',
        specs: 'Material: Iridio de alta pureza\nPresentación: Caja x 4 unidades\nVida útil estimada: 60.000 km\nRosca de 14 mm con asiento cónico',
        image: '',
        active: 1,
        vehicles: [1, 2, 3, 4, 5, 6]
      },
      {
        id: 5,
        name: 'Filtro de Aceite Sintético de Alto Flujo',
        category_id: 2,
        brand_id: 8,
        price: 42000,
        description: 'Filtro blindado con válvula antirretorno de silicona y medio filtrante sintético que retiene hasta el 99% de impurezas del motor.',
        specs: 'Válvula de derivación calibrada\nRetención de partículas desde 20 micras\nCompatible con aceites minerales y sintéticos',
        image: '',
        active: 1,
        vehicles: [1, 2, 3, 4, 5, 6]
      },
      {
        id: 6,
        name: 'Bombillos LED X-tremeUltinon H4 6000K (Par)',
        category_id: 6,
        brand_id: 11,
        price: 195000,
        description: 'Set de iluminación automotriz LED de luz blanca fría 6000K. Hasta +200% más proyección luminosa sin encandilar en vía.',
        specs: 'Conector: H4 Alta y Baja\nTemperatura de color: 6000K Blanco Puro\nDisipador activo de aluminio aeronáutico\nResistencia IP65 contra agua y polvo',
        image: '',
        active: 1,
        vehicles: [1, 2, 3, 4, 5, 6]
      },
      {
        id: 7,
        name: 'Discos de Freno Ventilados Delanteros (Par)',
        category_id: 1,
        brand_id: 2,
        price: 290000,
        description: 'Par de discos de freno ventilados con recubrimiento anticorrosión UV y balanceo electrónico de fábrica para frenadas precisas sin vibración.',
        specs: 'Tipo: Ventilado de alto flujo\nAleación: Hierro de alto carbono G3000\nIncluye par de discos delanteros',
        image: '',
        active: 1,
        vehicles: [1, 2, 3, 4, 5, 6]
      }
    ],
    settings: { name: 'AUTOREPUESTOS Y ACCESORIOS PEÑA', whatsapp: '573232705498', address: 'Cra 27 #63-40, Bogotá, Colombia', hours: 'Lun a Sáb: 7:30 a. m. – 6:30 p. m.' }
  };

  const clone = o => JSON.parse(JSON.stringify(o));
  const mode = () => localStorage.getItem(KM) || (cfg.MODE === 'auto' ? (location.protocol === 'file:' ? 'local' : 'api') : cfg.MODE);
  const readLocal = () => { try { return JSON.parse(localStorage.getItem(KD)); } catch (e) { return null; } };
  const writeLocal = d => {
    try { localStorage.setItem(KD, JSON.stringify(d)); }
    catch (e) { throw new Error('Almacenamiento del navegador lleno. Usa imágenes más livianas.'); }
  };

  const OLD_NAMES = ['Repuestos Carro & Accesorios', 'TurboParts Neiva', 'Repuestos'];
  const CAR_DEFAULTS_BY_NAME = {
    'kia': { car_image: 'assets/img/brands/picanto.webp', model_sample: 'Kia Picanto GT Line / Vibrant', logo: 'assets/img/brands/picanto.webp' },
    'mazda': { car_image: 'assets/img/brands/mazdaCar.png', model_sample: 'Mazda 3 Sport Skyactiv', logo: 'assets/img/brands/mazdaCar.png' },
    'subaru': { car_image: 'assets/img/brands/subaru.png', model_sample: 'Subaru WRX Symmetrical AWD', logo: 'assets/img/brands/subaru.webp' },
    'toyota': { car_image: 'assets/img/brands/subaru.png', model_sample: 'Toyota Corolla / Hilux', logo: 'assets/img/brands/toyota.webp' },
    'chevrolet': { car_image: 'assets/img/brands/picanto.webp', model_sample: 'Chevrolet Onix / Tracker', logo: 'assets/img/brands/chevrolet.webp' },
    'renault': { car_image: 'assets/img/brands/mazdaCar.png', model_sample: 'Renault Logan / Duster / Sandero' }
  };

  const enrichVehicles = (vehicles) => {
    return (vehicles || []).map(v => {
      const key = String(v.name || '').toLowerCase().trim();
      const def = CAR_DEFAULTS_BY_NAME[key] || {};
      return {
        ...v,
        logo: v.logo || def.logo || '',
        car_image: v.car_image || def.car_image || v.logo || 'assets/img/brands/picanto.webp',
        model_sample: v.model_sample || def.model_sample || (v.name ? v.name + ' · Modelo de muestra' : 'Vehículo de muestra')
      };
    });
  };

  const local = () => {
    let d = readLocal();
    if (!d || !localStorage.getItem(KS)) {
      d = clone(SEED);
      writeLocal(d);
      localStorage.setItem(KS, '1');
    } else {
      if (d.settings && (d.settings.whatsapp === '573001234567' || OLD_NAMES.includes(d.settings.name))) {
        Object.assign(d.settings, SEED.settings);
      }
      d.vehicles = enrichVehicles(d.vehicles);
      writeLocal(d);
    }
    return d;
  };

  const same = (a, b) => String(a) === String(b);

  async function api(r, method, body, q) {
    const t = sessionStorage.getItem(KT);
    let res;
    try {
      res = await fetch(`${cfg.API_URL}?r=${r}${q || ''}`, {
        method: method || 'GET',
        headers: Object.assign({ 'Content-Type': 'application/json' }, t ? { 'X-Token': t } : {}),
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (e) { throw new Error('No hay conexión con el servidor (' + cfg.API_URL + ').'); }
    const j = await res.json().catch(() => ({}));
    if (res.status === 401) sessionStorage.removeItem(KT);
    if (!res.ok) throw new Error(j.error || 'Error ' + res.status);
    return j;
  }

  const normalize = d => {
    ['categories', 'brands', 'vehicles', 'products'].forEach(k => { if (!Array.isArray(d[k])) throw new Error('Archivo inválido: falta "' + k + '"'); });
    d.settings = d.settings || {};
    d.vehicles = enrichVehicles(d.vehicles);
    return d;
  };

  window.Store = {
    mode,
    defaultHotspots: () => clone(DEFAULT_HOTSPOTS),
    setMode(m) { localStorage.setItem(KM, m); sessionStorage.clear(); },
    authed: () => mode() === 'api' ? !!sessionStorage.getItem(KT) : sessionStorage.getItem('tp_ok') === '1',

    async login(pw) {
      if (mode() === 'api') { sessionStorage.setItem(KT, (await api('login', 'POST', { password: pw })).token); return; }
      if (pw !== cfg.ADMIN_PIN) throw new Error('PIN incorrecto');
      sessionStorage.setItem('tp_ok', '1');
    },
    logout() { sessionStorage.clear(); },

    async all() {
      if (mode() === 'api') {
        const res = await api('all');
        res.vehicles = enrichVehicles(res.vehicles);
        return res;
      }
      const d = local();
      if (!this.authed()) d.products = d.products.filter(p => p.active);
      return d;
    },

    async save(ent, item) {
      if (ent === 'vehicles') {
        if (!item.car_image && item.logo) item.car_image = item.logo;
        if (!item.logo && item.car_image) item.logo = item.car_image;
        if (!item.model_sample) item.model_sample = item.name + ' · Vehículo Interactivo';
      }
      if (mode() === 'api') return api(ent, 'POST', item);
      const d = local(), list = d[ent];
      if (ent !== 'products' && list.some(x => !same(x.id, item.id) && x.name.toLowerCase() === item.name.toLowerCase()))
        throw new Error('Ya existe "' + item.name + '"');
      if (item.id) { const i = list.findIndex(x => same(x.id, item.id)); list[i] = Object.assign(list[i], item); }
      else { item.id = list.reduce((m, x) => Math.max(m, x.id), 0) + 1; list.unshift(item); }
      writeLocal(d); return item;
    },

    async remove(ent, id) {
      if (mode() === 'api') return api(ent, 'DELETE', null, '&id=' + id);
      const d = local();
      if (ent === 'categories' && d.products.some(p => same(p.category_id, id))) throw new Error('Hay productos en esta categoría');
      if (ent === 'brands' && d.products.some(p => same(p.brand_id, id))) throw new Error('Hay productos con esta marca');
      if (ent === 'vehicles') d.products.forEach(p => p.vehicles = (p.vehicles || []).filter(v => !same(v, id)));
      d[ent] = d[ent].filter(x => !same(x.id, id));
      writeLocal(d);
    },

    async saveSettings(s) {
      if (mode() === 'api') return api('settings', 'POST', s);
      const d = local(); d.settings = Object.assign(d.settings, s); writeLocal(d);
    },

    async importData(data) {
      data = normalize(data);
      if (mode() === 'api') return api('import', 'POST', data);
      writeLocal(data);
    },
    localData: () => readLocal(),
    async exportData() { const d = mode() === 'api' ? await api('all') : local(); return JSON.stringify(d, null, 2); },
    reset() { localStorage.setItem(KS, '1'); writeLocal(clone(SEED)); }
  };
})();

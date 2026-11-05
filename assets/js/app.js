/* Catálogo público Bootstrap 5 + enrutador Cliente / Admin independiente. */
(function () {
  const S = window.Store, $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const COP = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
  const same = (a, b) => String(a) === String(b);
  const nm = (l, id) => (l.find(x => same(x.id, id)) || {}).name || '';
  window.esc = esc; window.COP = COP; window.nm = nm;

  let D = { settings: {}, products: [], categories: [], brands: [], vehicles: [] };
  let cat = '', veh = '', brd = '', sort = 'recent', q = '', cart = {};
  let bsProductModal = null;

  try { cart = JSON.parse(localStorage.getItem('tp_cart')) || {}; } catch (e) {}

  const vnames = p => (p.vehicles || []).map(id => nm(D.vehicles, id)).filter(Boolean);
  const NAME = 'AUTOREPUESTOS Y ACCESORIOS PEÑA';
  /* Número de WhatsApp en formato internacional (Colombia = 57). Acepta "3232705498" o "573232705498". */
  const waNum = () => {
    let d = String(D.settings?.whatsapp || '').replace(/\D/g, '');
    if (d.length === 10 && d[0] === '3') d = '57' + d;
    return d;
  };
  const fmtPhone = () => {
    const d = waNum();
    return d.length === 12 && d.startsWith('57') ? `+57 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}` : (d ? '+' + d : '');
  };
  const wa = t => 'https://wa.me/' + waNum() + '?text=' + encodeURIComponent(t);
  const mapEmbed = a => 'https://www.google.com/maps?q=' + encodeURIComponent(a) + '&hl=es&z=17&output=embed';
  const mapDir = a => 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(a);
  const mapView = a => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(a);
  const byId = id => (D.products || []).find(p => same(p.id, id));

  let tt;
  window.toast = t => {
    const e = $('#toast');
    if (!e) return;
    e.innerHTML = `<i class="bi bi-check-circle-fill text-success me-2"></i>${esc(t)}`;
    e.classList.add('show');
    clearTimeout(tt);
    tt = setTimeout(() => e.classList.remove('show'), 2300);
  };

  /* Icono automotriz según categoría */
  function catIcon(catName) {
    const n = String(catName || '').toLowerCase();
    if (n.includes('freno')) return 'bi-disc-fill';
    if (n.includes('filtro')) return 'bi-funnel-fill';
    if (n.includes('eléctr') || n.includes('electr') || n.includes('bater')) return 'bi-lightning-charge-fill';
    if (n.includes('motor') || n.includes('bují') || n.includes('buji')) return 'bi-gear-wide-connected';
    if (n.includes('suspens') || n.includes('amortigu')) return 'bi-arrows-collapse-vertical';
    if (n.includes('ilumin') || n.includes('luz') || n.includes('bombill')) return 'bi-lightbulb-fill';
    return 'bi-box-seam-fill';
  }
  window.catIcon = catIcon;

  const thumb = (p, large = false) => {
    const cName = nm(D.categories, p.category_id);
    const icon = catIcon(cName);
    if (p.image) {
      return `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.outerHTML='<div class=\'tp-product-placeholder\'><i class=\'bi ${icon}\'></i></div>'">`;
    }
    return `<div class="tp-product-placeholder" style="${large ? 'width:110px;height:110px;font-size:3rem;' : ''}"><i class="bi ${icon}"></i></div>`;
  };

  /* ---------- Enrutador Principal: separa 100% Vista Cliente y Vista Admin ---------- */
  let wasAdmin = null;
  async function route() {
    const isAdminRoute = location.hash === '#admin';
    wasAdmin = isAdminRoute;
    const clientApp = $('#clientApp');
    const adminApp = $('#adminApp');

    if (isAdminRoute) {
      document.body.classList.remove('client-body');
      document.body.classList.add('admin-body');
      clientApp.hidden = true;
      adminApp.hidden = false;

      if (bsProductModal) try { bsProductModal.hide(); } catch (e) {}

      if (!window.Admin) {
        try {
          await new Promise((ok, no) => {
            const s = document.createElement('script');
            s.src = 'assets/js/admin.js?v=4.0';
            s.onload = ok;
            s.onerror = () => no(new Error('No se pudo cargar admin.js'));
            document.head.appendChild(s);
          });
        } catch (err) {
          adminApp.innerHTML = `<div class="container py-5"><div class="alert alert-danger">${esc(err.message)}</div></div>`;
          return;
        }
      }
      return window.Admin.mount(adminApp, route);
    }

    // Modo Cliente
    document.body.classList.remove('admin-body');
    document.body.classList.add('client-body');
    adminApp.hidden = true;
    clientApp.hidden = false;

    try {
      D = await S.all();
    } catch (e) {
      $('#grid').innerHTML = `<div class="col-12"><div class="alert alert-warning rounded-4 p-4 text-center">
        <i class="bi bi-exclamation-triangle-fill fs-3 d-block mb-2"></i>
        <strong>No se pudo cargar el catálogo</strong><br><span class="small text-muted">${esc(e.message)}</span>
      </div></div>`;
      return;
    }

    const st = D.settings || {};
    document.title = (st.name || NAME) + ' · Catálogo';
    $('#brand').textContent = st.name || NAME;
    $('#topAddress').innerHTML = `<i class="bi bi-geo-alt-fill text-info me-1"></i>${esc(st.address || 'Cra 27 #63-40, Bogotá, Colombia')}`;
    $('#topHours').innerHTML = `<i class="bi bi-clock-fill text-info me-1"></i>${esc(st.hours || 'Atención continua')}`;

    const generalWa = wa(`Hola ${st.name || ''}, necesito asesoría para cotizar un repuesto.`);
    $('#topWaLink').href = generalWa;
    $('#navWaBtn').href = generalWa;
    $('#waFloat').href = generalWa;

    renderClientCatalog();
    renderLocation(st);
    renderFooter(st);
    upd();
  }

  /* ---------- Ubicación + mapa ---------- */
  function renderLocation(st) {
    const box = $('#locBox');
    if (!box) return;
    const addr = st.address || 'Cra 27 #63-40, Bogotá, Colombia';
    const phone = fmtPhone();
    box.innerHTML = `
      <div class="col-lg-5">
        <div class="tp-map-card h-100 p-4 d-flex flex-column gap-3">
          <div class="tp-loc-item"><div class="tp-loc-ico"><i class="bi bi-geo-alt-fill"></i></div>
            <div><div class="fw-bold text-dark">Dirección</div><div class="text-secondary">${esc(addr)}</div></div></div>
          ${st.hours ? `<div class="tp-loc-item"><div class="tp-loc-ico"><i class="bi bi-clock-fill"></i></div>
            <div><div class="fw-bold text-dark">Horario</div><div class="text-secondary">${esc(st.hours)}</div></div></div>` : ''}
          ${phone ? `<div class="tp-loc-item"><div class="tp-loc-ico"><i class="bi bi-whatsapp"></i></div>
            <div><div class="fw-bold text-dark">WhatsApp</div><div class="text-secondary">${esc(phone)}</div></div></div>` : ''}
          <div class="d-grid gap-2 mt-auto pt-2">
            <a class="btn btn-accent fw-bold rounded-3" href="${mapDir(addr)}" target="_blank" rel="noopener"><i class="bi bi-sign-turn-right-fill me-1"></i>Cómo llegar</a>
            <a class="btn btn-whatsapp fw-bold rounded-3" href="${wa('Hola ' + (st.name || NAME) + ', quiero preguntar por un repuesto.')}" target="_blank" rel="noopener"><i class="bi bi-whatsapp me-1"></i>Escribir por WhatsApp</a>
          </div>
        </div>
      </div>
      <div class="col-lg-7">
        <div class="tp-map-card h-100" style="min-height:340px;">
          <iframe class="tp-map-frame" title="Mapa de ${esc(st.name || NAME)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen src="${mapEmbed(addr)}"></iframe>
        </div>
      </div>`;
  }

  /* ---------- Renderizado del Catálogo Cliente ---------- */
  function renderClientCatalog() {
    const activeProducts = (D.products || []).filter(p => p.active);

    // 1. Marcas de vehículos + Visor de Carro Interactivo
    const vStrip = $('#vehicleStrip');
    const vWrap = $('#vehicleFilterWrap');
    const carWrap = $('#interactiveCarWrap');
    if (D.vehicles && D.vehicles.length) {
      vWrap.classList.remove('d-none');
      vStrip.innerHTML = D.vehicles.map(v => {
        const count = activeProducts.filter(p => (p.vehicles || []).some(id => same(id, v.id))).length;
        const isAct = same(veh, v.id);
        const ini = (v.name || '?')[0].toUpperCase();
        const imgSrc = v.car_image || v.logo;
        const logoHtml = imgSrc
          ? `<img src="${esc(imgSrc)}" alt="${esc(v.name)}" loading="lazy" onerror="this.outerHTML='<div class=\'tp-vehicle-fallback\'>${esc(ini)}</div>'">`
          : `<div class="tp-vehicle-fallback">${esc(ini)}</div>`;
        return `<div class="tp-vehicle-card ${isAct ? 'active' : ''}" data-v="${v.id}" title="Ver carro interactivo y repuestos para ${esc(v.name)}">
          <div class="tp-vehicle-logo">${logoHtml}</div>
          <div>
            <div class="tp-vehicle-name">${esc(v.name)}</div>
            <small class="text-muted d-block" style="font-size:11px;">${count} ${count === 1 ? 'repuesto' : 'repuestos'}</small>
          </div>
        </div>`;
      }).join('');
      $('#clearVehicleBtn').classList.toggle('d-none', !veh);

      // Renderizar el carro interactivo de la marca seleccionada (o la primera marca como demostración interactiva)
      if (carWrap) {
        const activeVeh = D.vehicles.find(v => same(v.id, veh)) || D.vehicles[0];
        const carImg = activeVeh.car_image || activeVeh.logo || 'assets/img/brands/picanto.webp';
        const hotspots = (S.defaultHotspots ? S.defaultHotspots() : []).map(hs => {
          const matchedCat = (D.categories || []).find(c => c.name.toLowerCase().includes(hs.category.toLowerCase()) || hs.category.toLowerCase().includes(c.name.toLowerCase()));
          const catId = matchedCat ? matchedCat.id : '';
          const isHotspotActive = catId && same(cat, catId);
          return `<button type="button" class="tp-hotspot ${isHotspotActive ? 'active' : ''}" style="left:${hs.x}%;top:${hs.y}%;" data-hs-cat="${esc(catId)}" data-hs-name="${esc(hs.category)}" data-hs-veh="${esc(activeVeh.id)}" title="${esc(hs.label)}">
            <i class="bi ${hs.icon}"></i>
            <span class="tp-hotspot-tip"><i class="bi ${hs.icon} me-1 text-info"></i>${esc(hs.label)}</span>
          </button>`;
        }).join('');

        carWrap.innerHTML = `<div class="tp-car-showcase-box">
          <div class="row align-items-center g-3 mb-2">
            <div class="col-lg-7">
              <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
                <span class="badge rounded-pill bg-accent px-3 py-1"><i class="bi bi-car-front-fill me-1"></i>Marca: ${esc(activeVeh.name)}</span>
                <span class="badge rounded-pill bg-dark bg-opacity-10 text-dark px-3 py-1"><i class="bi bi-hand-index-thumb-fill text-accent me-1"></i>Vehículo Interactivo</span>
              </div>
              <h3 class="h5 fw-extrabold text-dark mb-1">${esc(activeVeh.model_sample || (activeVeh.name + ' · Selecciona una parte del vehículo'))}</h3>
              <p class="text-muted small mb-0">
                Haz clic sobre los <strong>puntos azules del carro</strong> (ej: <em>Frenos, Motor, Suspensión, Filtros, Eléctrico</em>) para ir directo a ese apartado de repuestos.
              </p>
            </div>
            <div class="col-lg-5 text-lg-end">
              <div class="d-flex flex-wrap gap-1 justify-content-lg-end">
                ${(D.categories || []).map(c => `<button type="button" class="btn btn-sm ${same(cat, c.id) ? 'btn-accent' : 'btn-outline-secondary'} rounded-pill fw-semibold" data-hs-cat="${c.id}" data-hs-name="${esc(c.name)}" data-hs-veh="${esc(activeVeh.id)}">
                  <i class="bi ${catIcon(c.name)} me-1"></i>${esc(c.name)}
                </button>`).join('')}
              </div>
            </div>
          </div>

          <div class="tp-car-stage">
            <img src="${esc(carImg)}" alt="Carro ${esc(activeVeh.name)}" class="tp-car-img" onerror="this.src='assets/img/brands/picanto.webp'">
            ${hotspots}
          </div>
        </div>`;
      }
    } else {
      vWrap.classList.add('d-none');
      if (carWrap) carWrap.innerHTML = '';
    }

    // 2. Chips de Categorías
    const cats = D.categories.filter(c => activeProducts.some(p => same(p.category_id, c.id)));
    if (cat && !cats.some(c => same(c.id, cat))) cat = '';
    $('#chips').innerHTML = `<button type="button" class="tp-chip ${cat ? '' : 'on'}" data-c="">
        <i class="bi bi-grid-fill me-1"></i>Todas las categorías
      </button>` +
      cats.map(c => `<button type="button" class="tp-chip ${same(c.id, cat) ? 'on' : ''}" data-c="${c.id}">
        <i class="bi ${catIcon(c.name)} me-1"></i>${esc(c.name)}
      </button>`).join('');

    // 3. Selector de Marcas de Repuesto
    const usedBrands = D.brands.filter(b => activeProducts.some(p => same(p.brand_id, b.id)));
    if (brd && !usedBrands.some(b => same(b.id, brd))) brd = '';
    const bSel = $('#brandFilter');
    bSel.innerHTML = `<option value="">Todas las marcas de repuesto</option>` +
      usedBrands.map(b => `<option value="${b.id}" ${same(b.id, brd) ? 'selected' : ''}>${esc(b.name)}</option>`).join('');

    $('#sortFilter').value = sort;
    $('#q').value = q;
    $('#navSearchInput').value = q;

    grid();
  }

  function updateActiveFiltersBar() {
    const bar = $('#activeFiltersBar');
    const container = $('#activeFilterBadges');
    const badges = [];

    if (q) badges.push(`<span class="badge rounded-pill bg-dark d-inline-flex align-items-center gap-1 py-2 px-3">Búsqueda: "${esc(q)}" <i class="bi bi-x-circle ms-1" data-clear="q" style="cursor:pointer"></i></span>`);
    if (veh) badges.push(`<span class="badge rounded-pill bg-accent d-inline-flex align-items-center gap-1 py-2 px-3"><i class="bi bi-car-front me-1"></i>Vehículo: ${esc(nm(D.vehicles, veh))} <i class="bi bi-x-circle ms-1" data-clear="veh" style="cursor:pointer"></i></span>`);
    if (cat) badges.push(`<span class="badge rounded-pill bg-secondary d-inline-flex align-items-center gap-1 py-2 px-3">Categoría: ${esc(nm(D.categories, cat))} <i class="bi bi-x-circle ms-1" data-clear="cat" style="cursor:pointer"></i></span>`);
    if (brd) badges.push(`<span class="badge rounded-pill bg-secondary d-inline-flex align-items-center gap-1 py-2 px-3">Marca: ${esc(nm(D.brands, brd))} <i class="bi bi-x-circle ms-1" data-clear="brd" style="cursor:pointer"></i></span>`);

    if (badges.length > 0) {
      bar.classList.remove('d-none');
      container.innerHTML = `<small class="text-muted fw-semibold me-1">Filtros activos:</small>` + badges.join('');
    } else {
      bar.classList.add('d-none');
      container.innerHTML = '';
    }
  }

  function grid() {
    updateActiveFiltersBar();
    const qLower = q.toLowerCase().trim();

    let L = (D.products || []).filter(p => {
      if (!p.active) return false;
      if (cat && !same(p.category_id, cat)) return false;
      if (brd && !same(p.brand_id, brd)) return false;
      if (veh && !(p.vehicles || []).some(v => same(v, veh))) return false;
      if (qLower) {
        const hay = [p.name, p.description, p.specs, nm(D.brands, p.brand_id), nm(D.categories, p.category_id), vnames(p).join(' ')].join(' ').toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      return true;
    });

    if (sort === 'price_asc') L.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sort === 'price_desc') L.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sort === 'name_asc') L.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    else L.sort((a, b) => (b.id || 0) - (a.id || 0));

    $('#resultsCount').innerHTML = `Mostrando <strong>${L.length}</strong> ${L.length === 1 ? 'repuesto disponible' : 'repuestos disponibles'}`;

    if (!L.length) {
      const hasAny = (D.products || []).some(p => p.active);
      $('#grid').innerHTML = `<div class="col-12">
        <div class="card border-0 shadow-sm rounded-4 p-5 text-center">
          <div class="mx-auto mb-3 text-muted" style="font-size:3rem;"><i class="bi bi-search"></i></div>
          <h4 class="fw-bold mb-2">${hasAny ? 'No encontramos repuestos con esos filtros' : 'Aún no hay productos publicados'}</h4>
          <p class="text-muted mb-4">${hasAny ? 'Intenta buscar con otra palabra clave o limpia los filtros activos.' : 'Ingresa al panel de administración para agregar tus primeros repuestos.'}</p>
          ${hasAny ? `<div class="d-flex justify-content-center gap-2">
            <button type="button" class="btn btn-accent rounded-pill px-4 fw-semibold" data-clear="all">Ver todo el catálogo</button>
            <a href="${wa('Hola, busco un repuesto que no encontré en el catálogo: ' + q)}" target="_blank" rel="noopener" class="btn btn-outline-success rounded-pill px-4 fw-semibold"><i class="bi bi-whatsapp me-1"></i>Preguntar por WhatsApp</a>
          </div>` : `<a href="admin.html" class="btn btn-accent rounded-pill px-4 mx-auto">Ir al Panel Admin</a>`}
        </div>
      </div>`;
      return;
    }

    $('#grid').innerHTML = L.map(p => {
      const cName = nm(D.categories, p.category_id);
      const bName = nm(D.brands, p.brand_id);
      const vList = vnames(p);
      const singleWa = wa(`Hola ${D.settings?.name || ''}, me interesa este repuesto:\n• ${p.name}${bName ? ' (' + bName + ')' : ''} — ${COP(p.price)}\n¿Está disponible?`);

      return `<div class="col">
        <article class="tp-product-card" data-p="${p.id}">
          <div class="tp-product-img-wrap">
            ${cName ? `<span class="tp-cat-badge"><i class="bi ${catIcon(cName)} me-1"></i>${esc(cName)}</span>` : ''}
            ${thumb(p)}
          </div>
          <div class="p-3 d-flex flex-column flex-grow-1">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="tp-brand-pill">${esc(bName || 'Genérico / OEM')}</span>
              <span class="badge bg-success bg-opacity-10 text-success fw-semibold" style="font-size:11px;"><i class="bi bi-check-circle-fill me-1"></i>Disponible</span>
            </div>
            <h3 class="tp-product-title mb-2">${esc(p.name)}</h3>
            ${vList.length ? `<div class="d-flex flex-wrap gap-1 mb-3">
              ${vList.slice(0, 4).map(n => `<span class="tp-vehicle-tag"><i class="bi bi-car-front-fill text-muted"></i>${esc(n)}</span>`).join('')}
              ${vList.length > 4 ? `<span class="tp-vehicle-tag">+${vList.length - 4}</span>` : ''}
            </div>` : '<div class="mb-3"></div>'}
            <div class="mt-auto pt-2 border-top d-flex align-items-center justify-content-between gap-2">
              <div>
                <small class="text-muted d-block" style="font-size:11px;line-height:1;">Precio unitario</small>
                <span class="tp-price">${COP(p.price)}</span>
              </div>
              <div class="d-flex align-items-center gap-1">
                <a href="${singleWa}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-success rounded-3 px-2 py-2" title="Consultar directo por WhatsApp" onclick="event.stopPropagation();">
                  <i class="bi bi-whatsapp"></i>
                </a>
                <button type="button" class="btn btn-sm btn-accent rounded-3 px-3 py-2 fw-bold d-inline-flex align-items-center gap-1" data-a="${p.id}">
                  <i class="bi bi-cart-plus"></i> Agregar
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>`;
    }).join('');
  }

  /* ---------- Modal Detalle de Producto ---------- */
  function detail(id) {
    const p = byId(id);
    if (!p) return;
    let n = 1;
    const specs = String(p.specs || '').split('\n').map(s => s.trim()).filter(Boolean);
    const cName = nm(D.categories, p.category_id);
    const bName = nm(D.brands, p.brand_id);
    const compatVehicles = (p.vehicles || []).map(vid => D.vehicles.find(v => same(v.id, vid))).filter(Boolean);

    const content = $('#productModalContent');
    content.innerHTML = `<div class="row g-0">
      <div class="col-md-5 tp-modal-img-col position-relative">
        ${cName ? `<span class="tp-cat-badge"><i class="bi ${catIcon(cName)} me-1"></i>${esc(cName)}</span>` : ''}
        ${thumb(p, true)}
      </div>
      <div class="col-md-7 p-4 p-lg-4 d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <span class="badge bg-primary bg-opacity-10 text-accent fw-bold text-uppercase px-2 py-1">${esc(bName || 'Repuesto Garantizado')}</span>
            <span class="badge bg-success bg-opacity-10 text-success ms-1"><i class="bi bi-check2-circle me-1"></i>En stock para cotizar</span>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>

        <h3 class="h4 fw-extrabold text-dark mb-2">${esc(p.name)}</h3>
        <div class="fs-3 fw-extrabold text-accent mb-3">${COP(p.price)}</div>

        ${p.description ? `<p class="text-secondary small mb-3">${esc(p.description)}</p>` : ''}

        ${specs.length ? `<div class="bg-light rounded-3 p-3 mb-3">
          <h6 class="small fw-bold text-uppercase text-muted mb-2"><i class="bi bi-list-check me-1"></i>Especificaciones técnicas</h6>
          <ul class="list-unstyled mb-0 small d-grid gap-1">
            ${specs.map(s => `<li><i class="bi bi-check-circle-fill text-success me-2"></i>${esc(s)}</li>`).join('')}
          </ul>
        </div>` : ''}

        ${compatVehicles.length ? `<div class="mb-3">
          <small class="text-muted fw-bold d-block mb-2"><i class="bi bi-car-front-fill me-1"></i>Marcas de vehículos compatibles:</small>
          <div class="d-flex flex-wrap gap-2">
            ${compatVehicles.map(v => `<span class="badge bg-white text-dark border px-2 py-1 d-inline-flex align-items-center gap-1">
              ${v.logo ? `<img src="${esc(v.logo)}" alt="" style="height:14px;width:auto;object-fit:contain;">` : '<i class="bi bi-car-front text-accent"></i>'}
              ${esc(v.name)}
            </span>`).join('')}
          </div>
        </div>` : ''}

        <div class="mt-auto pt-3 border-top">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <span class="small fw-semibold text-muted">Cantidad requerida:</span>
            <div class="tp-qty-box">
              <button type="button" id="m">−</button>
              <span id="n">1</span>
              <button type="button" id="pl">+</button>
            </div>
          </div>
          <div class="row g-2">
            <div class="col-12 col-sm-6">
              <button type="button" class="btn btn-accent w-100 py-2 fw-bold rounded-3" id="ad">
                <i class="bi bi-cart-plus me-1"></i>Agregar al pedido
              </button>
            </div>
            <div class="col-12 col-sm-6">
              <a class="btn btn-whatsapp w-100 py-2 fw-bold rounded-3" id="w" target="_blank" rel="noopener">
                <i class="bi bi-whatsapp me-1"></i>Pedir por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>`;

    const up = () => {
      $('#n').textContent = n;
      $('#w').href = wa(`Hola ${D.settings?.name || ''}, quiero cotizar:\n• ${n}x ${p.name} — ${COP(p.price * n)}\n¿Está disponible?`);
    };
    $('#m').onclick = () => { n = Math.max(1, n - 1); up(); };
    $('#pl').onclick = () => { n++; up(); };
    $('#ad').onclick = () => {
      add(id, n);
      if (bsProductModal) bsProductModal.hide();
    };
    up();

    if (!bsProductModal) {
      bsProductModal = new bootstrap.Modal($('#productModal'));
    }
    bsProductModal.show();
  }

  /* ---------- Carrito / Pedido ---------- */
  function add(id, n) {
    cart[id] = (cart[id] || 0) + (n || 1);
    upd();
    window.toast('Repuesto agregado a tu pedido');
  }

  function upd() {
    localStorage.setItem('tp_cart', JSON.stringify(cart));
    const noteInput = $('#cartCustomerNote');
    const customerNote = noteInput ? noteInput.value.trim() : '';

    let t = 0, c = 0;
    let msg = `Hola ${D.settings?.name || ''}, quiero cotizar el siguiente pedido:\n\n`;
    if (customerNote) msg += `👤 Cliente / Vehículo: ${customerNote}\n\n`;

    const rows = Object.keys(cart).map(k => {
      const p = byId(k);
      if (!p) { delete cart[k]; return ''; }
      const qn = cart[k];
      const sub = p.price * qn;
      t += sub;
      c += qn;
      const bName = nm(D.brands, p.brand_id);
      msg += `• ${qn}x ${p.name}${bName ? ' [' + bName + ']' : ''} — ${COP(sub)}\n`;

      return `<div class="tp-cart-item">
        <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
          <div>
            <span class="badge bg-light text-secondary border mb-1" style="font-size:10px;">${esc(bName || 'Repuesto')}</span>
            <h6 class="fw-bold mb-0 small text-dark">${esc(p.name)}</h6>
            <small class="text-muted">${COP(p.price)} c/u</small>
          </div>
          <button type="button" class="btn btn-sm text-danger p-0" data-q="${k}:${-qn}" title="Quitar">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="d-flex justify-content-between align-items-center pt-1 border-top">
          <strong class="text-accent small">${COP(sub)}</strong>
          <div class="tp-qty-box" style="transform:scale(0.88);transform-origin:right center;">
            <button type="button" data-q="${k}:-1">−</button>
            <span>${qn}</span>
            <button type="button" data-q="${k}:1">+</button>
          </div>
        </div>
      </div>`;
    }).join('');

    $('#items').innerHTML = rows || `<div class="text-center py-5 text-muted">
      <i class="bi bi-cart-x display-4 d-block mb-3 opacity-50"></i>
      <h6 class="fw-bold text-dark">Tu pedido está vacío</h6>
      <p class="small mb-0 px-3">Agrega repuestos del catálogo para armar tu cotización y enviarla por WhatsApp.</p>
    </div>`;

    $('#cnt').textContent = c;
    $('#navCartTotal').textContent = COP(t);
    $('#total').textContent = COP(t);
    $('#clearCartBtn').classList.toggle('d-none', c === 0);

    $('#waCart').href = wa(
      c
        ? msg + `\n💰 *Total estimado: ${COP(t)}*\n¿Me confirman disponibilidad y tiempo de entrega?`
        : `Hola ${D.settings?.name || ''}, necesito asesoría con un repuesto.`
    );
  }

  /* ---------- Footer Cliente ---------- */
  function renderFooter(st) {
    $('#foot').innerHTML = `<div class="container">
      <div class="row g-4 pb-4 border-bottom border-secondary border-opacity-25">
        <div class="col-lg-5">
          <div class="d-flex align-items-center gap-3 mb-3">
            <div class="tp-footer-logo-box">
              <img src="assets/img/logo.webp?v=4.0" alt="Logo" height="72" style="height:72px;width:auto;max-width:120px;object-fit:contain;">
            </div>
            <div>
              <span class="fw-extrabold fs-6 text-white d-block" style="max-width:240px;line-height:1.15;">${esc(st.name || NAME)}</span>
              <small class="text-info fw-semibold">Bogotá, Colombia</small>
            </div>
          </div>
          <p class="small text-secondary mb-3" style="max-width:400px;">
            Tu aliado confiable en autopartes, frenos, suspensión, filtros, baterías e iluminación automotriz. Atención rápida y personalizada.
          </p>
        </div>
        <div class="col-sm-6 col-lg-4">
          <h6 class="text-white fw-bold mb-3">Contacto y Punto de Venta</h6>
          <ul class="list-unstyled small d-grid gap-2 mb-0">
            ${st.address ? `<li><a class="text-decoration-none text-secondary" href="${mapView(st.address)}" target="_blank" rel="noopener"><i class="bi bi-geo-alt-fill text-accent me-2"></i>${esc(st.address)}</a></li>` : ''}
            ${st.hours ? `<li><i class="bi bi-clock-fill text-accent me-2"></i>${esc(st.hours)}</li>` : ''}
            ${fmtPhone() ? `<li><i class="bi bi-whatsapp text-success me-2"></i>WhatsApp: ${esc(fmtPhone())}</li>` : ''}
          </ul>
        </div>
        <div class="col-sm-6 col-lg-3">
          <h6 class="text-white fw-bold mb-3">Acceso Rápido</h6>
          <div class="d-grid gap-2">
            <a href="${wa('Hola, necesito cotizar un repuesto.')}" target="_blank" rel="noopener" class="btn btn-sm btn-whatsapp rounded-3 fw-semibold">
              <i class="bi bi-whatsapp me-1"></i>Atención por WhatsApp
            </a>
            <a href="admin.html" class="btn btn-sm btn-outline-secondary text-white-50 rounded-3">
              <i class="bi bi-shield-lock me-1"></i>Panel de Administración
            </a>
          </div>
        </div>
      </div>
      <div class="d-flex flex-wrap justify-content-between align-items-center pt-3 small text-secondary">
        <span>© ${new Date().getFullYear()} <strong class="text-white">${esc(st.name || NAME)}</strong> · Todos los derechos reservados.</span>
        <span>Catálogo Digital Pro</span>
      </div>
    </div>`;
  }

  /* ---------- Eventos Globales Vista Cliente ---------- */
  document.addEventListener('click', e => {
    if (location.hash === '#admin') return;
    const t = e.target;

    // Búsqueda rápida desde las etiquetas del Hero
    const quickBtn = t.closest('[data-quick]');
    if (quickBtn) {
      q = quickBtn.dataset.quick;
      if ($('#q')) $('#q').value = q;
      if ($('#navSearchInput')) $('#navSearchInput').value = q;
      grid();
      document.getElementById('catalogSection')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Agregar al carrito
    const addBtn = t.closest('[data-a]');
    if (addBtn) {
      e.stopPropagation();
      return add(addBtn.dataset.a, 1);
    }

    // Filtro por categoría (chips)
    const chipBtn = t.closest('[data-c]');
    if (chipBtn && chipBtn.closest('#chips')) {
      cat = chipBtn.dataset.c;
      renderClientCatalog();
      return;
    }

    // Clic en un punto interactivo (hotspot) del carro de muestra
    const hsBtn = t.closest('[data-hs-cat]');
    if (hsBtn) {
      const targetCatId = hsBtn.dataset.hsCat;
      const targetVehId = hsBtn.dataset.hsVeh;
      if (targetVehId) veh = targetVehId;
      if (targetCatId) {
        cat = same(cat, targetCatId) ? '' : targetCatId;
      }
      renderClientCatalog();
      const catName = nm(D.categories, cat);
      if (catName) window.toast(`Apartado seleccionado: ${catName} (${nm(D.vehicles, veh)})`);
      document.getElementById('chips')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Filtro por marca de vehículo
    const vehCard = t.closest('[data-v]');
    if (vehCard) {
      const vid = vehCard.dataset.v;
      veh = same(veh, vid) ? '' : vid;
      renderClientCatalog();
      return;
    }

    // Limpiar filtros individuales o todos
    const clearTarget = t.closest('[data-clear]');
    if (clearTarget) {
      const kind = clearTarget.dataset.clear;
      if (kind === 'q' || kind === 'all') { q = ''; $('#q').value = ''; $('#navSearchInput').value = ''; }
      if (kind === 'veh' || kind === 'all') veh = '';
      if (kind === 'cat' || kind === 'all') cat = '';
      if (kind === 'brd' || kind === 'all') brd = '';
      renderClientCatalog();
      return;
    }

    // Modificar cantidad en el carrito
    const qtyBtn = t.closest('[data-q]');
    if (qtyBtn) {
      const [k, d] = qtyBtn.dataset.q.split(':');
      cart[k] = (cart[k] || 0) + Number(d);
      if (cart[k] <= 0) delete cart[k];
      return upd();
    }

    // Abrir modal de detalle de producto
    const cardEl = t.closest('[data-p]');
    if (cardEl && !t.closest('#cartOffcanvas')) {
      return detail(cardEl.dataset.p);
    }
  });

  // Sincronización de buscadores (Hero y Navbar)
  const handleSearch = val => {
    q = val;
    if ($('#q') && $('#q').value !== val) $('#q').value = val;
    if ($('#navSearchInput') && $('#navSearchInput').value !== val) $('#navSearchInput').value = val;
    grid();
  };
  $('#q')?.addEventListener('input', e => handleSearch(e.target.value));
  $('#navSearchInput')?.addEventListener('input', e => handleSearch(e.target.value));

  $('#brandFilter')?.addEventListener('change', e => { brd = e.target.value; grid(); });
  $('#sortFilter')?.addEventListener('change', e => { sort = e.target.value; grid(); });
  $('#clearVehicleBtn')?.addEventListener('click', () => { veh = ''; renderClientCatalog(); });
  $('#resetAllFilters')?.addEventListener('click', () => {
    q = ''; veh = ''; cat = ''; brd = '';
    renderClientCatalog();
  });
  $('#clearCartBtn')?.addEventListener('click', () => {
    if (confirm('¿Deseas vaciar todos los repuestos de tu pedido?')) {
      cart = {};
      upd();
    }
  });
  $('#cartCustomerNote')?.addEventListener('input', () => upd());

  window.addEventListener('hashchange', () => {
    // Solo reenrutar al entrar/salir del admin (los anclas como #ubicacion no recargan nada)
    if ((location.hash === '#admin') !== wasAdmin) route();
  });
  route();
})();

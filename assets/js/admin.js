/* Panel de administración Enterprise (Bootstrap 5): completamente diferenciado de la tienda cliente. */
window.Admin = (function () {
  const S = window.Store;
  const esc = (...a) => window.esc(...a), COP = (...a) => window.COP(...a), nm = (...a) => window.nm(...a);
  const same = (a, b) => String(a) === String(b);
  let el, D, tab = 'products', refresh;
  let admSearch = '', admCatFilter = '';
  let bsAdmModal = null;
  let photoVal = '';   // foto del producto en edición ('' = sin foto; ruta/URL = la actual; data:image = nueva)

  const F = {
    products: [
      { k: 'name', l: 'Nombre del repuesto / referencia', req: 1, col: 'col-12', ph: 'Ej: Pastillas de Freno Delanteras Cerámicas' },
      { k: 'image', l: 'Foto del repuesto', t: 'photo', col: 'col-12' },
      { k: 'category_id', l: 'Categoría', t: 'select', o: () => D.categories, col: 'col-md-6', add: 'categories' },
      { k: 'brand_id', l: 'Marca del repuesto', t: 'select', o: () => D.brands, col: 'col-md-6', add: 'brands' },
      { k: 'price', l: 'Precio de venta (COP)', t: 'number', req: 1, col: 'col-12 col-md-6', ph: 'Ej: 185000' },
      { k: 'description', l: 'Descripción comercial', t: 'area', col: 'col-12', ph: 'Describe los beneficios y aplicación del repuesto...' },
      { k: 'specs', l: 'Ficha técnica / Características (una por línea)', t: 'area', col: 'col-12', ph: 'Posición: Delantera\nGarantía: 6 meses\nMaterial: Cerámico' },
      { k: 'vehicles', l: 'Marcas de carros compatibles', t: 'checks', o: () => D.vehicles, col: 'col-12' },
      { k: 'active', l: 'Publicar como visible en el catálogo del cliente', t: 'bool', col: 'col-12' }
    ],
    categories: [{ k: 'name', l: 'Nombre de la categoría', req: 1, col: 'col-12', ph: 'Ej: Frenos, Suspensión, Motor...' }],
    brands: [{ k: 'name', l: 'Nombre de la marca de repuesto', req: 1, col: 'col-12', ph: 'Ej: Brembo, Bosch, NGK...' }],
    vehicles: [
      { k: 'name', l: 'Marca de vehículo', req: 1, col: 'col-md-6', ph: 'Ej: Kia, Mazda, Subaru, Toyota...' },
      { k: 'model_sample', l: 'Modelo del carrito de muestra (opcional)', col: 'col-md-6', ph: 'Ej: Kia Picanto GT Line / Mazda 3 Sport' },
      { k: 'car_image', l: 'Imagen del vehículo de muestra / marca (Subir foto o elegir precargada)', t: 'photo', col: 'col-12', presets: [
        { label: 'Kia Picanto (picanto.webp)', url: 'assets/img/brands/picanto.webp' },
        { label: 'Mazda 3 Rojo (mazdaCar.png)', url: 'assets/img/brands/mazdaCar.png' },
        { label: 'Subaru WRX Azul (subaru.png)', url: 'assets/img/brands/subaru.png' },
        { label: 'Logo Toyota (toyota.webp)', url: 'assets/img/brands/toyota.webp' },
        { label: 'Logo Chevrolet (chevrolet.webp)', url: 'assets/img/brands/chevrolet.webp' },
        { label: 'Logo Subaru (subaru.webp)', url: 'assets/img/brands/subaru.webp' }
      ]},
      { k: 'logo', l: 'Ruta o URL manual (opcional si subiste foto arriba)', col: 'col-12', ph: 'Ej: assets/img/brands/picanto.webp' }
    ]
  };

  const TABS = {
    products: { label: 'Productos (Catálogo)', icon: 'bi-box-seam-fill' },
    categories: { label: 'Categorías', icon: 'bi-tags-fill' },
    brands: { label: 'Marcas de Repuestos', icon: 'bi-award-fill' },
    vehicles: { label: 'Marcas de Vehículos', icon: 'bi-car-front-fill' },
    dashboard: { label: 'Resumen General', icon: 'bi-speedometer2' },
    settings: { label: 'Ajustes y Datos', icon: 'bi-sliders' }
  };

  const ONE = {
    products: 'producto',
    categories: 'categoría',
    brands: 'marca de repuesto',
    vehicles: 'marca de vehículo'
  };

  const isApi = () => S.mode() === 'api';
  const msg = t => window.toast(t);

  async function mount(e, cb) {
    el = e;
    refresh = cb;
    if (!S.authed()) return login();
    try {
      D = await S.all();
    } catch (err) {
      return failed(err);
    }
    draw();
  }

  /* ---------- Pantalla de Login Admin ---------- */
  function login(err) {
    el.innerHTML = `<div class="adm-login-wrapper">
      <div class="adm-login-card">
        <div class="p-4 p-sm-5">
          <div class="d-flex align-items-center justify-content-between mb-4">
            <div class="d-flex align-items-center gap-2">
              <div class="adm-brand-badge border shadow-sm"><img src="assets/img/logo.webp?v=4.0" alt="Logo" style="height:36px;width:auto;max-width:58px;object-fit:contain;"></div>
              <div>
                <h5 class="fw-extrabold mb-0 text-dark">Panel Admin</h5>
                <small class="text-muted">Consola de Gestión</small>
              </div>
            </div>
            <span class="badge rounded-pill ${isApi() ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-primary bg-opacity-10 text-primary border border-primary'} px-3 py-2">
              <i class="bi ${isApi() ? 'bi-database-check' : 'bi-laptop'} me-1"></i>${isApi() ? 'Modo BD (API)' : 'Modo Local'}
            </span>
          </div>

          <h4 class="fw-bold text-dark mb-1">Iniciar sesión</h4>
          <p class="text-muted small mb-4">
            ${isApi() ? 'Ingresa la contraseña de administrador configurada en el servidor.' : 'Ingresa tu PIN de acceso local para gestionar productos y categorías.'}
          </p>

          ${err ? `<div class="alert alert-danger d-flex align-items-center gap-2 py-2 small rounded-3">
            <i class="bi bi-exclamation-octagon-fill"></i><span>${esc(err)}</span>
          </div>` : ''}

          <form id="lf">
            <div class="mb-3">
              <label class="form-label small fw-bold text-secondary">${isApi() ? 'Contraseña de Administrador' : 'PIN de Acceso'}</label>
              <div class="input-group input-group-lg">
                <span class="input-group-text bg-light border-end-0 text-muted"><i class="bi bi-key-fill"></i></span>
                <input type="password" id="pw" class="form-control bg-light border-start-0 fs-6" placeholder="${isApi() ? '••••••••' : 'Ej: 1234'}" autofocus required>
              </div>
              ${!isApi() ? `<div class="form-text small"><i class="bi bi-info-circle me-1"></i>PIN de pruebas por defecto: <code>${esc(window.CONFIG?.ADMIN_PIN || '1234')}</code></div>` : ''}
            </div>

            <div class="d-grid gap-2 mt-4">
              <button type="submit" class="btn btn-primary btn-lg fw-bold rounded-3 fs-6 py-2">
                Entrar al Panel <i class="bi bi-arrow-right ms-1"></i>
              </button>
              <a href="index.html" class="btn btn-light text-secondary fw-semibold rounded-3 py-2">
                <i class="bi bi-shop me-1"></i>Volver a la vista del cliente
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>`;

    el.querySelector('#lf').onsubmit = async ev => {
      ev.preventDefault();
      try {
        await S.login(el.querySelector('#pw').value);
        mount(el, refresh);
      } catch (x) {
        login(x.message);
      }
    };
  }

  /* ---------- Pantalla de Error de Conexión ---------- */
  function failed(err) {
    el.innerHTML = `<div class="adm-login-wrapper">
      <div class="adm-login-card p-4 p-sm-5 text-center">
        <div class="text-danger display-4 mb-3"><i class="bi bi-hdd-network"></i></div>
        <h4 class="fw-bold text-dark mb-2">No se pudo conectar al servidor</h4>
        <p class="text-muted small mb-4">${esc(err.message)}</p>
        <div class="d-grid gap-2">
          <button type="button" class="btn btn-primary fw-bold" id="retry"><i class="bi bi-arrow-clockwise me-1"></i>Reintentar conexión</button>
          ${isApi() ? '<button type="button" class="btn btn-outline-secondary fw-semibold" id="tolocal">Cambiar al modo pruebas (Local)</button>' : ''}
          <a href="index.html" class="btn btn-link text-decoration-none">Ir al catálogo público</a>
        </div>
      </div>
    </div>`;
    el.querySelector('#retry').onclick = () => mount(el, refresh);
    const b = el.querySelector('#tolocal');
    if (b) b.onclick = () => { S.setMode('local'); mount(el, refresh); };
  }

  /* ---------- Shell Principal del Admin ---------- */
  function draw() {
    const counts = {
      products: (D.products || []).length,
      categories: (D.categories || []).length,
      brands: (D.brands || []).length,
      vehicles: (D.vehicles || []).length
    };

    el.innerHTML = `<div class="adm-shell">
      <!-- Sidebar Izquierdo -->
      <aside class="adm-sidebar">
        <div class="adm-sidebar-brand">
          <div class="adm-brand-badge"><img src="assets/img/logo.webp?v=4.0" alt="Logo" style="height:36px;width:auto;max-width:58px;object-fit:contain;"></div>
          <div class="overflow-hidden">
            <div class="fw-extrabold text-white text-truncate">${esc(D.settings?.name || 'AUTOREPUESTOS Y ACCESORIOS PEÑA')}</div>
            <small class="text-secondary d-block" style="font-size:11px;">Backoffice &amp; Inventario</small>
          </div>
        </div>

        <nav class="adm-nav">
          <div class="adm-nav-label">Gestión de Catálogo</div>
          ${Object.keys(TABS).map(k => `
            <button type="button" data-t="${k}" class="adm-nav-btn ${k === tab ? 'on' : ''}">
              <span><i class="bi ${TABS[k].icon} me-2"></i>${TABS[k].label}</span>
              ${counts[k] !== undefined ? `<span class="badge rounded-pill ${k === tab ? 'bg-white text-primary' : 'bg-dark text-secondary'}">${counts[k]}</span>` : ''}
            </button>
          `).join('')}
        </nav>

        <div class="p-3 border-top border-secondary border-opacity-25 d-none d-lg-grid gap-2">
          <a href="index.html" class="btn btn-sm btn-outline-light rounded-3 d-flex align-items-center justify-content-center gap-2">
            <i class="bi bi-box-arrow-up-right"></i><span>Ver Tienda Cliente</span>
          </a>
          <button type="button" data-x="out" class="btn btn-sm btn-danger bg-opacity-25 border-0 text-white rounded-3">
            <i class="bi bi-power me-1"></i>Cerrar sesión
          </button>
        </div>
      </aside>

      <!-- Área Principal -->
      <div class="adm-main">
        <!-- Topbar Admin -->
        <header class="adm-topbar">
          <div>
            <h1 class="h5 fw-extrabold text-dark mb-0">
              <i class="bi ${TABS[tab].icon} text-primary me-2"></i>${TABS[tab].label}
            </h1>
            <small class="text-muted">Panel de administración independiente del catálogo público</small>
          </div>
          <div class="d-flex flex-wrap align-items-center gap-2">
            <span class="badge rounded-pill ${isApi() ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-warning bg-opacity-10 text-dark border border-warning'} px-3 py-2 fw-semibold">
              <i class="bi ${isApi() ? 'bi-database-fill-check' : 'bi-hdd-fill'} me-1"></i>
              ${isApi() ? 'Conectado: Base de Datos MySQL' : 'Modo Pruebas (Navegador Local)'}
            </span>
            <button type="button" class="btn btn-sm btn-primary fw-bold rounded-3 px-3" data-n="products">
              <i class="bi bi-plus-lg me-1"></i>Nuevo Producto
            </button>
            <button type="button" class="btn btn-sm btn-outline-primary fw-bold rounded-3 px-3" data-n="categories">
              <i class="bi bi-tag-fill me-1"></i>Nueva Categoría
            </button>
            <a href="index.html" class="btn btn-sm btn-outline-secondary rounded-3">
              <i class="bi bi-shop me-1"></i>Ver Tienda
            </a>
            <button type="button" class="btn btn-sm btn-outline-danger rounded-3 d-lg-none" data-x="out">
              <i class="bi bi-power"></i>
            </button>
          </div>
        </header>

        <!-- Contenido de la Pestaña Activa -->
        <div class="adm-content" id="pane"></div>
      </div>
    </div>

    <!-- Modal Bootstrap para Formularios CRUD -->
    <div class="modal fade" id="admModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 rounded-4 shadow-lg" id="admModalBody"></div>
      </div>
    </div>`;

    bsAdmModal = null;
    const pane = el.querySelector('#pane');
    if (tab === 'dashboard') pane.innerHTML = renderDashboard();
    else if (tab === 'settings') pane.innerHTML = settings();
    else pane.innerHTML = list(tab);

    bindPaneEvents();
  }

  /* ---------- Vista Resumen / Dashboard ---------- */
  function renderDashboard() {
    const totalProd = (D.products || []).length;
    const activeProd = (D.products || []).filter(p => p.active).length;
    const hiddenProd = totalProd - activeProd;
    const recent = (D.products || []).slice(0, 5);

    return `
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-xl-3">
          <div class="adm-kpi-card">
            <div>
              <span class="text-muted small fw-semibold d-block mb-1">Total Productos</span>
              <h3 class="fw-extrabold mb-0 text-dark">${totalProd}</h3>
              <small class="text-success fw-semibold"><i class="bi bi-eye-fill me-1"></i>${activeProd} visibles</small>
              ${hiddenProd ? `<small class="text-muted ms-2">(${hiddenProd} ocultos)</small>` : ''}
            </div>
            <div class="adm-kpi-icon bg-primary bg-opacity-10 text-primary"><i class="bi bi-box-seam-fill"></i></div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="adm-kpi-card">
            <div>
              <span class="text-muted small fw-semibold d-block mb-1">Categorías</span>
              <h3 class="fw-extrabold mb-0 text-dark">${(D.categories || []).length}</h3>
              <small class="text-muted">Secciones activas</small>
            </div>
            <div class="adm-kpi-icon bg-info bg-opacity-10 text-info"><i class="bi bi-tags-fill"></i></div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="adm-kpi-card">
            <div>
              <span class="text-muted small fw-semibold d-block mb-1">Marcas de Repuestos</span>
              <h3 class="fw-extrabold mb-0 text-dark">${(D.brands || []).length}</h3>
              <small class="text-muted">Fabricantes registrados</small>
            </div>
            <div class="adm-kpi-icon bg-warning bg-opacity-10 text-warning"><i class="bi bi-award-fill"></i></div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="adm-kpi-card">
            <div>
              <span class="text-muted small fw-semibold d-block mb-1">Marcas de Vehículos</span>
              <h3 class="fw-extrabold mb-0 text-dark">${(D.vehicles || []).length}</h3>
              <small class="text-muted">Compatibilidad automotriz</small>
            </div>
            <div class="adm-kpi-icon bg-success bg-opacity-10 text-success"><i class="bi bi-car-front-fill"></i></div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-4">
          <div class="adm-card p-4 h-100">
            <h6 class="fw-bold text-dark mb-3"><i class="bi bi-lightning-charge-fill text-warning me-2"></i>Acciones Rápidas</h6>
            <div class="d-grid gap-2">
              <button type="button" class="btn btn-primary fw-semibold text-start p-3 rounded-3 d-flex align-items-center justify-content-between" data-n="products">
                <span><i class="bi bi-plus-circle-fill me-2"></i>Crear nuevo repuesto</span>
                <i class="bi bi-chevron-right"></i>
              </button>
              <button type="button" class="btn btn-light border fw-semibold text-start p-3 rounded-3 d-flex align-items-center justify-content-between" data-n="categories">
                <span><i class="bi bi-tag-fill text-info me-2"></i>Nueva categoría</span>
                <i class="bi bi-chevron-right"></i>
              </button>
              <button type="button" class="btn btn-light border fw-semibold text-start p-3 rounded-3 d-flex align-items-center justify-content-between" data-n="brands">
                <span><i class="bi bi-award-fill text-warning me-2"></i>Nueva marca de repuesto</span>
                <i class="bi bi-chevron-right"></i>
              </button>
              <button type="button" class="btn btn-light border fw-semibold text-start p-3 rounded-3 d-flex align-items-center justify-content-between" data-n="vehicles">
                <span><i class="bi bi-car-front-fill text-success me-2"></i>Nueva marca de vehículo</span>
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="col-lg-8">
          <div class="adm-card h-100">
            <div class="p-3 px-4 border-bottom d-flex justify-content-between align-items-center">
              <h6 class="fw-bold text-dark mb-0">Últimos repuestos registrados</h6>
              <button type="button" class="btn btn-sm btn-link text-decoration-none fw-semibold" data-t="products">Ver todos →</button>
            </div>
            <div class="table-responsive">
              <table class="table adm-table mb-0">
                <thead>
                  <tr>
                    <th>Repuesto</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Estado</th>
                    <th class="text-end">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  ${recent.length ? recent.map(p => `
                    <tr>
                      <td class="fw-bold text-dark">${esc(p.name)}</td>
                      <td><span class="badge bg-light text-secondary border">${esc(nm(D.categories, p.category_id) || '—')}</span></td>
                      <td class="fw-bold">${COP(p.price)}</td>
                      <td>
                        <span class="badge rounded-pill ${p.active ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'}">
                          ${p.active ? 'Visible' : 'Oculto'}
                        </span>
                      </td>
                      <td class="text-end">
                        <button type="button" class="btn btn-sm btn-outline-primary rounded-2" data-e="products:${p.id}">
                          <i class="bi bi-pencil-square"></i>
                        </button>
                      </td>
                    </tr>
                  `).join('') : `<tr><td colspan="5" class="text-center text-muted py-4">No hay productos registrados.</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* ---------- Listado y Tablas de Entidades ---------- */
  function list(ent) {
    const P = D.products || [];
    let items = [...(D[ent] || [])];

    if (ent === 'products') {
      const qL = admSearch.toLowerCase().trim();
      items = items.filter(p => {
        if (admCatFilter && !same(p.category_id, admCatFilter)) return false;
        if (qL) {
          const hay = [p.name, nm(D.brands, p.brand_id), nm(D.categories, p.category_id)].join(' ').toLowerCase();
          if (!hay.includes(qL)) return false;
        }
        return true;
      });
    }

    const rows = items.map(x => {
      let cells;
      if (ent === 'products') {
        const cName = nm(D.categories, x.category_id);
        const bName = nm(D.brands, x.brand_id);
        const vList = (x.vehicles || []).map(id => nm(D.vehicles, id)).filter(Boolean);
        const thumbHtml = x.image
          ? `<img src="${esc(x.image)}" alt="" onerror="this.outerHTML='<i class=\'bi bi-box-seam\'></i>'">`
          : `<i class="bi ${window.catIcon ? window.catIcon(cName) : 'bi-box-seam'}"></i>`;

        cells = `
          <td>
            <div class="d-flex align-items-center gap-3">
              <div class="adm-thumb">${thumbHtml}</div>
              <div>
                <div class="fw-bold text-dark">${esc(x.name)}</div>
                <small class="text-muted">${esc(bName || 'Sin marca')}</small>
              </div>
            </div>
          </td>
          <td><span class="badge bg-light text-dark border">${esc(cName || '—')}</span></td>
          <td>
            <div class="d-flex flex-wrap gap-1" style="max-width:220px;">
              ${vList.length ? vList.map(v => `<span class="badge bg-secondary bg-opacity-10 text-secondary">${esc(v)}</span>`).join('') : '<span class="text-muted small">—</span>'}
            </div>
          </td>
          <td class="fw-extrabold text-dark">${COP(x.price)}</td>
          <td>
            <span class="badge rounded-pill ${x.active ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'} px-2 py-1">
              <i class="bi ${x.active ? 'bi-check-circle-fill' : 'bi-eye-slash-fill'} me-1"></i>${x.active ? 'Visible' : 'Oculto'}
            </span>
          </td>`;
      } else {
        const used = ent === 'categories'
          ? P.filter(p => same(p.category_id, x.id)).length
          : ent === 'brands'
            ? P.filter(p => same(p.brand_id, x.id)).length
            : P.filter(p => (p.vehicles || []).some(v => same(v, x.id))).length;

        cells = `
          ${ent === 'vehicles' ? `<td style="width:95px;">
            <div class="adm-thumb bg-white p-1" style="width:72px;height:48px;">${(x.car_image || x.logo) ? `<img src="${esc(x.car_image || x.logo)}" alt="">` : `<span class="small fw-bold">${esc((x.name || '?')[0])}</span>`}</div>
          </td>` : ''}
          <td>
            <div class="fw-bold text-dark">${esc(x.name)}</div>
            ${ent === 'vehicles' && x.model_sample ? `<small class="text-muted"><i class="bi bi-car-front me-1"></i>${esc(x.model_sample)}</small>` : ''}
          </td>
          <td><span class="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3">${used} ${used === 1 ? 'producto' : 'productos'}</span></td>`;
      }

      return `<tr>
        ${cells}
        <td class="text-end text-nowrap">
          <button type="button" class="btn btn-sm btn-outline-primary rounded-2 me-1" data-e="${ent}:${x.id}">
            <i class="bi bi-pencil-square me-1"></i>Editar
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger rounded-2" data-d="${ent}:${x.id}">
            <i class="bi bi-trash3"></i>
          </button>
        </td>
      </tr>`;
    }).join('');

    const head = ent === 'products'
      ? '<th>Producto / Marca</th><th>Categoría</th><th>Vehículos Compatibles</th><th>Precio</th><th>Estado</th>'
      : (ent === 'vehicles' ? '<th>Logo</th>' : '') + '<th>Nombre</th><th>Productos Asociados</th>';

    const filterToolbar = ent === 'products' ? `
      <div class="p-3 bg-light border-bottom">
        <div class="row g-2 align-items-center">
          <div class="col-md-6">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-white"><i class="bi bi-search text-muted"></i></span>
              <input type="search" id="admProdSearch" class="form-control" placeholder="Filtrar productos por nombre o marca..." value="${esc(admSearch)}">
            </div>
          </div>
          <div class="col-md-4">
            <select id="admProdCat" class="form-select form-select-sm">
              <option value="">Todas las categorías</option>
              ${(D.categories || []).map(c => `<option value="${c.id}" ${same(c.id, admCatFilter) ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
            </select>
          </div>
          <div class="col-md-2 text-md-end small text-muted fw-semibold">
            ${items.length} registros
          </div>
        </div>
      </div>` : '';

    return `
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h4 class="fw-bold text-dark mb-0">${TABS[ent].label}</h4>
          <small class="text-muted">Administra los registros que alimentan el catálogo público</small>
        </div>
        <button type="button" class="btn btn-primary fw-bold rounded-3 px-3" data-n="${ent}">
          <i class="bi bi-plus-lg me-1"></i>Nuevo ${ONE[ent]}
        </button>
      </div>
      <div class="adm-card">
        ${filterToolbar}
        <div class="table-responsive">
          <table class="table adm-table table-hover mb-0">
            <thead><tr>${head}<th class="text-end">Acciones</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="8" class="text-center text-muted py-5">Todavía no hay registros en esta sección.</td></tr>`}</tbody>
          </table>
        </div>
      </div>`;
  }

  /* ---------- Pestaña de Ajustes y Datos ---------- */
  function settings() {
    const s = D.settings || {};
    const inp = (k, l, ic, ph = '') => `
      <div class="col-md-6">
        <label class="form-label small fw-bold text-secondary"><i class="bi ${ic} me-1"></i>${l}</label>
        <input name="${k}" class="form-control" value="${esc(s[k])}" placeholder="${esc(ph)}">
      </div>`;

    return `<div class="row g-4">
      <div class="col-lg-7">
        <form class="adm-card p-4" id="sf">
          <h5 class="fw-bold text-dark mb-1"><i class="bi bi-shop text-primary me-2"></i>Datos del Negocio</h5>
          <p class="text-muted small mb-4">Esta información se muestra en el encabezado, pie de página y enlaces de WhatsApp de la vista del cliente.</p>
          <div class="row g-3 mb-4">
            ${inp('name', 'Nombre comercial', 'bi-building', 'Ej: AUTOREPUESTOS Y ACCESORIOS PEÑA')}
            ${inp('whatsapp', 'WhatsApp de pedidos (con indicativo 57)', 'bi-whatsapp', 'Ej: 573232705498')}
            ${inp('address', 'Dirección (también se usa para el mapa)', 'bi-geo-alt', 'Ej: Cra 27 #63-40, Bogotá, Colombia')}
            ${inp('hours', 'Horario de atención', 'bi-clock', 'Ej: Lun a Sáb: 7:30 a. m. – 6:30 p. m.')}
          </div>
          <button type="submit" class="btn btn-primary fw-bold px-4 rounded-3">
            <i class="bi bi-check2-circle me-1"></i>Guardar cambios
          </button>
        </form>
      </div>

      <div class="col-lg-5 d-flex flex-column gap-4">
        <div class="adm-card p-4">
          <h5 class="fw-bold text-dark mb-2"><i class="bi bi-hdd-stack text-primary me-2"></i>Modo de Almacenamiento</h5>
          <p class="text-muted small mb-3">
            Modo activo: <strong class="text-dark">${isApi() ? 'Base de datos (API MySQL)' : 'Pruebas (Guardado en este navegador)'}</strong>.
            ${isApi() ? 'Los cambios se publican para todos los visitantes.' : 'Los datos actuales viven localmente en este navegador.'}
          </p>
          <div class="d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-outline-primary fw-semibold rounded-3" data-x="mode">
              <i class="bi bi-arrow-left-right me-1"></i>Cambiar a ${isApi() ? 'modo pruebas' : 'base de datos'}
            </button>
            ${isApi() ? '' : `<button type="button" class="btn btn-outline-danger fw-semibold rounded-3" data-x="reset">
              <i class="bi bi-arrow-counterclockwise me-1"></i>Restablecer datos demo
            </button>`}
          </div>
        </div>

        <div class="adm-card p-4">
          <h5 class="fw-bold text-dark mb-2"><i class="bi bi-cloud-arrow-up text-primary me-2"></i>Copia de Seguridad y Migración</h5>
          <p class="text-muted small mb-3">
            Exporta el catálogo completo a un archivo <code>.json</code> o restaura una copia previa.
            ${isApi() ? 'También puedes migrar los datos de prueba de este navegador directo a la base de datos.' : ''}
          </p>
          <div class="d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-light border fw-semibold rounded-3" data-x="export">
              <i class="bi bi-download me-1"></i>Exportar JSON
            </button>
            <label class="btn btn-light border fw-semibold rounded-3 mb-0" style="cursor:pointer;">
              <i class="bi bi-upload me-1"></i>Importar JSON
              <input type="file" id="imp" accept=".json" hidden>
            </label>
            ${isApi() ? `<button type="button" class="btn btn-primary fw-semibold rounded-3" data-x="migrate">
              <i class="bi bi-database-up me-1"></i>Subir datos de pruebas a la BD
            </button>` : ''}
          </div>
        </div>
      </div>
    </div>`;
  }

  function bindPaneEvents() {
    const searchEl = el.querySelector('#admProdSearch');
    if (searchEl) {
      searchEl.oninput = e => {
        admSearch = e.target.value;
        const pos = searchEl.selectionStart;
        el.querySelector('#pane').innerHTML = list('products');
        bindPaneEvents();
        const newSearch = el.querySelector('#admProdSearch');
        if (newSearch) { newSearch.focus(); newSearch.setSelectionRange(pos, pos); }
      };
    }
    const catEl = el.querySelector('#admProdCat');
    if (catEl) {
      catEl.onchange = e => {
        admCatFilter = e.target.value;
        el.querySelector('#pane').innerHTML = list('products');
        bindPaneEvents();
      };
    }
  }

  /* ---------- Formularios CRUD en Modal Bootstrap ---------- */
  function field(f, v) {
    const col = f.col || 'col-12';
    const lbl = `<label class="form-label small fw-bold text-secondary mb-1">${f.l}${f.req ? ' <span class="text-danger">*</span>' : ''}</label>`;

    if (f.t === 'photo') {
      const presetsHtml = f.presets ? `<div class="mt-2">
        <select id="photoPresetSelect" class="form-select form-select-sm">
          <option value="">— O elegir un carrito/logo incluido en el proyecto —</option>
          ${f.presets.map(p => `<option value="${esc(p.url)}"${v === p.url ? ' selected' : ''}>${esc(p.label)}</option>`).join('')}
        </select>
      </div>` : '';
      return `<div class="${col}">${lbl}
        <div class="adm-photo-box">
          <div class="adm-photo-prev" id="photoPrev" style="width:130px;height:96px;"></div>
          <div class="flex-grow-1">
            <div class="d-flex flex-wrap gap-2 justify-content-center justify-content-sm-start">
              <label class="btn btn-primary fw-semibold rounded-3 mb-0" style="cursor:pointer;">
                <i class="bi bi-camera-fill me-1"></i><span id="photoBtnTxt">Subir imagen desde tu equipo</span>
                <input type="file" id="photoFile" accept="image/*" hidden>
              </label>
              <button type="button" class="btn btn-light border fw-semibold rounded-3" id="photoDel"><i class="bi bi-trash3 me-1"></i>Quitar</button>
            </div>
            ${presetsHtml}
            <div class="form-text mt-2 mb-0">Soporta PNG transparente, WebP o JPG. Se guarda automáticamente para mostrar el vehículo interactivo.</div>
          </div>
        </div>
      </div>`;
    }
    if (f.t === 'select') {
      const sel = `<select name="${f.k}" class="form-select">
        <option value="">— Seleccionar —</option>
        ${f.o().map(o => `<option value="${o.id}"${same(o.id, v) ? ' selected' : ''}>${esc(o.name)}</option>`).join('')}
      </select>`;
      if (!f.add) return `<div class="${col}">${lbl}${sel}</div>`;
      const what = f.add === 'brands' ? 'marca' : 'categoría';
      return `<div class="${col}">${lbl}
        <div class="input-group">${sel}
          <button type="button" class="btn btn-outline-primary fw-semibold" data-addnew="${f.k}" title="Agregar una ${what} nueva"><i class="bi bi-plus-lg me-1"></i>Nueva</button>
        </div>
        <input name="new_${f.k}" class="form-control mt-2 d-none" maxlength="80" placeholder="Escribe la ${what} nueva (se crea al guardar el producto)">
      </div>`;
    }
    if (f.t === 'area') {
      return `<div class="${col}">${lbl}<textarea name="${f.k}" class="form-control" rows="3" placeholder="${esc(f.ph || '')}">${esc(v)}</textarea></div>`;
    }
    if (f.t === 'bool') {
      return `<div class="${col}">
        <div class="form-check form-switch p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between">
          <label class="form-check-label fw-bold text-dark" for="chk_${f.k}">${f.l}</label>
          <input class="form-check-input ms-0" style="width:2.5em;height:1.3em;" type="checkbox" role="switch" id="chk_${f.k}" name="${f.k}"${v ? ' checked' : ''}>
        </div>
      </div>`;
    }
    if (f.t === 'checks') {
      const opts = f.o();
      return `<div class="${col}">
        ${lbl}
        <div class="adm-veh-grid">
          ${opts.length ? opts.map(o => `
            <label class="form-check d-flex align-items-center gap-2 mb-0 bg-white p-2 rounded border" style="cursor:pointer;">
              <input class="form-check-input mt-0" type="checkbox" name="${f.k}" value="${o.id}"${(v || []).some(x => same(x, o.id)) ? ' checked' : ''}>
              <span class="small fw-semibold text-dark text-truncate">${esc(o.name)}</span>
            </label>
          `).join('') : '<span class="text-muted small">Primero crea marcas de carros en la pestaña "Marcas de Vehículos".</span>'}
        </div>
      </div>`;
    }
    return `<div class="${col}">${lbl}<input name="${f.k}" class="form-control" type="${f.t || 'text'}" value="${esc(v)}" placeholder="${esc(f.ph || '')}"${f.req ? ' required' : ''}${f.t === 'number' ? ' min="0" step="any"' : ''}></div>`;
  }

  function read(form, fs) {
    const o = {};
    fs.forEach(f => {
      if (f.t === 'photo') o[f.k] = photoVal;
      else if (f.t === 'checks') o[f.k] = [...form.querySelectorAll(`[name="${f.k}"]:checked`)].map(x => +x.value);
      else if (f.t === 'bool') o[f.k] = form.elements[f.k].checked;
      else {
        let v = form.elements[f.k].value.trim();
        if (f.t === 'number') v = +v;
        if (f.t === 'select') v = v ? +v : null;
        o[f.k] = v;
      }
    });
    return o;
  }

  /* Redimensiona la foto en el navegador (máx. 1000 px) y la devuelve como data URL WebP/JPEG liviana. */
  function fileToDataUrl(file, max = 1000) {
    return new Promise((ok, no) => {
      if (!/^image\//.test(file.type)) return no(new Error('El archivo debe ser una imagen (JPG, PNG o WebP).'));
      if (file.size > 20 * 1024 * 1024) return no(new Error('La imagen pesa más de 20 MB.'));
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        g.clearRect(0, 0, w, h);
        g.drawImage(img, 0, 0, w, h);
        let d = c.toDataURL('image/webp', 0.86);
        if (!d.startsWith('data:image/webp')) d = c.toDataURL('image/png');
        ok(d);
      };
      img.onerror = () => { URL.revokeObjectURL(url); no(new Error('No se pudo leer la imagen. Prueba con JPG o PNG.')); };
      img.src = url;
    });
  }

  /* Devuelve el id de una marca/categoría por nombre; si no existe la crea. */
  async function ensure(ent, name) {
    const hit = (D[ent] || []).find(i => String(i.name).toLowerCase() === name.toLowerCase());
    if (hit) return hit.id;
    const r = await S.save(ent, { name });
    return r.id;
  }

  function form(ent, id) {
    const x = id ? D[ent].find(i => same(i.id, id)) : { active: true, vehicles: [] };
    photoVal = ent === 'products' ? (x.image || '') : (ent === 'vehicles' ? (x.car_image || x.logo || '') : '');
    const body = el.querySelector('#admModalBody');
    body.innerHTML = `<form>
      <div class="modal-header border-bottom px-4 py-3">
        <h5 class="modal-title fw-extrabold text-dark">
          <i class="bi ${id ? 'bi-pencil-square' : 'bi-plus-circle'} text-primary me-2"></i>
          ${id ? 'Editar' : 'Nuevo'} ${ONE[ent]}
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>
      <div class="modal-body p-4">
        <div class="row g-3">
          ${F[ent].map(f => field(f, x[f.k])).join('')}
        </div>
      </div>
      <div class="modal-footer bg-light border-top px-4 py-3">
        <button type="button" class="btn btn-light border fw-semibold" data-bs-dismiss="modal">Cancelar</button>
        <button type="submit" class="btn btn-primary fw-bold px-4">
          <i class="bi bi-check2 me-1"></i>Guardar
        </button>
      </div>
    </form>`;

    const modalEl = el.querySelector('#admModal');
    bsAdmModal = new bootstrap.Modal(modalEl);

    const frm = body.querySelector('form');

    /* Foto: vista previa, subir, quitar */
    const prev = frm.querySelector('#photoPrev');
    const drawPhoto = () => {
      if (!prev) return;
      prev.innerHTML = photoVal ? `<img src="${esc(photoVal)}" alt="Vista previa">` : '<i class="bi bi-image"></i>';
      const t = frm.querySelector('#photoBtnTxt');
      if (t) t.textContent = photoVal ? 'Cambiar foto' : 'Subir o tomar foto';
      const d = frm.querySelector('#photoDel');
      if (d) d.classList.toggle('d-none', !photoVal);
    };
    if (prev) {
      drawPhoto();
      frm.querySelector('#photoFile').onchange = async e => {
        const f = e.target.files[0];
        if (!f) return;
        try { photoVal = await fileToDataUrl(f); drawPhoto(); }
        catch (err) { alert(err.message); }
        e.target.value = '';
      };
      frm.querySelector('#photoDel').onclick = () => { photoVal = ''; drawPhoto(); };
      const presetSel = frm.querySelector('#photoPresetSelect');
      if (presetSel) {
        presetSel.onchange = e => {
          if (e.target.value) {
            photoVal = e.target.value;
            if (frm.elements['logo']) frm.elements['logo'].value = e.target.value;
            drawPhoto();
          }
        };
      }
    }

    /* "+ Nueva" marca / categoría desde el mismo formulario del producto */
    frm.querySelectorAll('[data-addnew]').forEach(btn => {
      btn.onclick = () => {
        const k = btn.dataset.addnew, inp = frm.elements['new_' + k], sel = frm.elements[k];
        const open = inp.classList.contains('d-none');
        inp.classList.toggle('d-none', !open);
        sel.disabled = open;
        btn.innerHTML = open ? '<i class="bi bi-x-lg me-1"></i>Cancelar' : '<i class="bi bi-plus-lg me-1"></i>Nueva';
        if (open) inp.focus(); else inp.value = '';
      };
    });

    frm.onsubmit = async ev => {
      ev.preventDefault();
      const o = read(ev.target, F[ent]);
      if (id) o.id = id;
      try {
        for (const f of F[ent]) {
          if (!f.add) continue;
          const inp = ev.target.elements['new_' + f.k];
          const nombre = inp && !inp.classList.contains('d-none') ? inp.value.trim() : '';
          if (nombre) o[f.k] = await ensure(f.add, nombre);
        }
        if (ent === 'vehicles') {
          if (o.car_image) o.logo = o.car_image;
          else if (o.logo) o.car_image = o.logo;
        }
        await S.save(ent, o);
        bsAdmModal.hide();
        D = await S.all();
        if (tab === 'dashboard') tab = ent;
        draw();
        msg('Registro guardado correctamente');
      } catch (e) {
        alert(e.message);
      }
    };

    bsAdmModal.show();
  }

  /* ---------- Acciones del Sistema ---------- */
  async function act(a) {
    if (a === 'out') { S.logout(); return mount(el, refresh); }
    if (a === 'mode') {
      if (!confirm('¿Cambiar el modo de almacenamiento? Cada modo conserva sus propios datos.')) return;
      S.setMode(isApi() ? 'local' : 'api');
      return mount(el, refresh);
    }
    if (a === 'reset') {
      if (confirm('Se restaurarán los datos de demostración iniciales en este navegador. ¿Continuar?')) {
        S.reset();
        D = await S.all();
        draw();
        msg('Datos de demostración restablecidos');
      }
      return;
    }
    if (a === 'export') {
      const url = URL.createObjectURL(new Blob([await S.exportData()], { type: 'application/json' }));
      const l = document.createElement('a');
      l.href = url;
      l.download = 'repuestos-' + new Date().toISOString().slice(0, 10) + '.json';
      l.click();
      URL.revokeObjectURL(url);
      return;
    }
    if (a === 'migrate') {
      const local = S.localData();
      if (!local) return alert('No hay datos de pruebas guardados en este navegador.');
      if (!confirm('Esto REEMPLAZA el contenido de la base de datos con los datos de pruebas. ¿Continuar?')) return;
      try {
        await S.importData(local);
        D = await S.all();
        draw();
        msg('Datos subidos a la base de datos');
      } catch (e) {
        alert(e.message);
      }
    }
  }

  /* ---------- Listeners Delegados ---------- */
  document.addEventListener('click', async e => {
    if (!el || !el.isConnected || el.hidden) return;
    const t = e.target.closest('[data-t],[data-e],[data-d],[data-n],[data-x]');
    if (!t) return;
    const ds = t.dataset;
    try {
      if (ds.t) { tab = ds.t; draw(); }
      else if (ds.n) { tab = ds.n; draw(); form(ds.n); }
      else if (ds.e) form(...ds.e.split(':'));
      else if (ds.d) {
        const [ent, id] = ds.d.split(':');
        if (confirm('¿Eliminar este registro de forma permanente?')) {
          await S.remove(ent, id);
          D = await S.all();
          draw();
          msg('Registro eliminado');
        }
      } else if (ds.x) await act(ds.x);
    } catch (err) {
      alert(err.message);
    }
  });

  document.addEventListener('submit', async e => {
    if (e.target.id !== 'sf') return;
    e.preventDefault();
    const o = {};
    new FormData(e.target).forEach((v, k) => o[k] = v.trim());
    if (o.whatsapp !== undefined) {   // solo números; si son 10 dígitos (celular colombiano) agrega el 57
      o.whatsapp = o.whatsapp.replace(/\D/g, '');
      if (o.whatsapp.length === 10 && o.whatsapp[0] === '3') o.whatsapp = '57' + o.whatsapp;
    }
    try {
      await S.saveSettings(o);
      D = await S.all();
      draw();
      msg('Ajustes del negocio actualizados');
    } catch (err) {
      alert(err.message);
    }
  });

  document.addEventListener('change', e => {
    if (e.target.id !== 'imp' || !e.target.files[0]) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        if (!confirm('Se reemplazarán los datos actuales con los del archivo JSON. ¿Continuar?')) return;
        await S.importData(JSON.parse(r.result));
        D = await S.all();
        draw();
        msg('Datos importados correctamente');
      } catch (err) {
        alert(err.message);
      }
    };
    r.readAsText(e.target.files[0]);
  });

  return { mount };
})();

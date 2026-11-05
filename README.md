# AUTOREPUESTOS Y ACCESORIOS PEÑA · Catálogo + Panel de administración

Catálogo público para cotizar repuestos por WhatsApp (**+57 323 270 5498**) y panel de administración.
Punto de venta: **Cra 27 #63-40, Bogotá, Colombia** (con mapa de Google en la tienda).
Todo se guarda en **base de datos MySQL**, incluidas las fotos de los repuestos (la BD guarda la ruta; el archivo queda en `/uploads`).

## Qué puedes hacer en el panel (`/admin.html` o `/#admin`)
- **Productos:** nombre, **foto** (subir o tomar con la cámara del celular), categoría, **marca del repuesto**, precio, descripción, ficha técnica y vehículos compatibles.
- **Marca / categoría nueva al vuelo:** en el formulario del producto, botón **“+ Nueva”** junto a Marca y Categoría (si ya existe, la reutiliza).
- **Ajustes:** nombre, WhatsApp (acepta `3232705498` o `573232705498`), dirección (la usa el mapa) y horario.

## Publicar en el dominio (PHP + MySQL)
1. En el hosting crea una base de datos y un usuario; en **phpMyAdmin → Importar** sube `database/schema.sql`.
2. Copia `api/config.example.php` como `api/config.php` y completa: datos de la BD, `admin_hash` y `secret`.
   Hash de la clave: `php -r "echo password_hash('TU_CLAVE', PASSWORD_DEFAULT);"` (o un generador bcrypt online).
3. Sube **todo el proyecto** a `public_html` (o a la carpeta del dominio).
4. Asegura que la carpeta **`uploads/products`** tenga permiso de escritura (755; si falla, 775).
5. Abre `https://tudominio.com/admin.html`, entra con tu clave y carga los productos.
   (`assets/js/config.js` ya viene en `MODE: 'auto'`: en el dominio usa la BD; con doble clic al archivo usa modo pruebas.)
6. Con SSL activo, descomenta las 3 líneas de `.htaccess` para forzar HTTPS.

## Probar sin hosting
Abre `index.html` con doble clic (modo pruebas, datos en el navegador). PIN del panel: `1234`.
Para pasar esos datos a la BD: en el dominio, Panel → Ajustes → **Subir datos de pruebas a la BD**.

## Seguridad incluida
- Las fotos se validan en el servidor (solo JPG/PNG/WebP reales, máx. 4 MB) y se renombran; en `uploads/` no se ejecuta código.
- `api/config.php` y `database/` están bloqueados por `.htaccess`.

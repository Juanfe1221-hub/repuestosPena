/* Configuración general · AUTOREPUESTOS Y ACCESORIOS PEÑA
   MODE: 'local' → (activo para pruebas inmediatas en el navegador sin servidor MySQL).
         'auto'  → en el dominio usa la base de datos (API); si abres el archivo con doble clic usa modo pruebas.
         'api'   → siempre base de datos MySQL a través de /api.
   El modo también se puede cambiar desde Administración → Ajustes, sin tocar este archivo. */
window.CONFIG = {
  MODE: 'local',
  API_URL: 'api/index.php',
  ADMIN_PIN: '1234'   // Solo para el modo pruebas local. En modo api la clave vive en el servidor (api/config.php).
};

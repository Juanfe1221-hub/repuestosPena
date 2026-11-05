<?php
// Copia este archivo como config.php y completa los datos de tu hosting (phpMyAdmin / cPanel).
// Para generar el hash de la clave de admin:  php -r "echo password_hash('TU_CLAVE', PASSWORD_DEFAULT);"
// (si no tienes acceso a consola, usa un generador online de "bcrypt" y pega el resultado)
return [
  'dsn'        => 'mysql:host=localhost;dbname=NOMBRE_BD;charset=utf8mb4',
  'user'       => 'USUARIO_BD',
  'pass'       => 'CLAVE_BD',
  'admin_hash' => 'PEGA_AQUI_EL_HASH',
  'secret'     => 'CAMBIA_ESTO_POR_UN_TEXTO_LARGO_Y_ALEATORIO',
  'cors'       => '*',   // Web y API en el mismo dominio: no se usa. Si no, pon aquí el dominio de la web, ej: 'https://tudominio.com'
];

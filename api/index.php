<?php
// API REST mínima. Rutas por parámetro (?r=) para no depender de reescrituras de URL.
//   GET  ?r=all                 catálogo completo (público: solo productos visibles)
//   POST ?r=login               {password} -> {token}
//   POST ?r=products|categories|brands|vehicles   crear (sin id) o actualizar (con id)   [admin]
//   DELETE ?r=<entidad>&id=N                                                              [admin]
//   POST ?r=settings            {clave: valor}                                            [admin]
//   POST ?r=import              reemplaza todo (migración desde modo pruebas)             [admin]
// Fotos: el panel envía la foto como data URL en el campo "image" del producto; aquí se valida,
// se guarda como archivo en /uploads/products/ y en la base de datos queda solo la ruta.
$c = require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . ($c['cors'] ?? '*'));
header('Access-Control-Allow-Headers: Content-Type, X-Token');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

function out($d, $s = 200) { http_response_code($s); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
try { $db = new PDO($c['dsn'], $c['user'], $c['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]); }
catch (Exception $e) { out(['error' => 'No se pudo conectar a la base de datos'], 500); }

const COLS = [
  'categories' => ['name'],
  'brands'     => ['name'],
  'vehicles'   => ['name', 'model_sample', 'logo', 'car_image'],
  'products'   => ['name', 'category_id', 'brand_id', 'price', 'description', 'specs', 'image', 'active'],
];
function sign($exp, $c) { return $exp . '.' . hash_hmac('sha256', (string)$exp, $c['secret']); }
function isAdmin($c) { $t = $_SERVER['HTTP_X_TOKEN'] ?? ''; $p = explode('.', $t); return count($p) === 2 && (int)$p[0] > time() && hash_equals(sign($p[0], $c), $t); }
function admin($c) { if (!isAdmin($c)) out(['error' => 'Sesión no válida. Vuelve a iniciar sesión.'], 401); }
function nul($v) { return ($v === '' || $v === null) ? null : $v; }

const UPLOAD_DIR = __DIR__ . '/../uploads/products';
const UPLOAD_PATH_RE = '#^uploads/products/[a-f0-9]{24}\.(jpg|png|webp)$#';

/* Convierte una foto "data:image/...;base64,..." en archivo y devuelve su ruta relativa (uploads/products/xxx.webp). */
function saveImage($dataUrl) {
  if (!preg_match('#^data:image/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=\s]+)$#', $dataUrl, $m)) out(['error' => 'Formato de imagen no válido (usa JPG, PNG o WebP)'], 422);
  $bin = base64_decode($m[1], true);
  if ($bin === false || strlen($bin) > 4 * 1024 * 1024) out(['error' => 'La imagen es inválida o pesa más de 4 MB'], 422);
  $info = @getimagesizefromstring($bin);   // valida que de verdad sea una imagen, sin fiarse del encabezado
  $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$info['mime'] ?? ''] ?? null;
  if (!$ext) out(['error' => 'El archivo no es una imagen válida'], 422);
  if (!is_dir(UPLOAD_DIR) && !@mkdir(UPLOAD_DIR, 0755, true)) out(['error' => 'No se pudo crear la carpeta uploads/products (revisa permisos)'], 500);
  $name = bin2hex(random_bytes(12)) . '.' . $ext;
  if (@file_put_contents(UPLOAD_DIR . '/' . $name, $bin) === false) out(['error' => 'No se pudo guardar la imagen (revisa permisos de uploads/)'], 500);
  return 'uploads/products/' . $name;
}
/* Borra el archivo de una foto antigua solo si es nuestra y ningún otro producto la usa. */
function dropImage($db, $path, $exceptId = 0) {
  if (!$path || !preg_match(UPLOAD_PATH_RE, $path)) return;
  $st = $db->prepare('SELECT COUNT(*) FROM products WHERE image=? AND id<>?'); $st->execute([$path, $exceptId]);
  if ((int)$st->fetchColumn() === 0) @unlink(__DIR__ . '/../' . $path);
}

function row($t, $in) {
  $v = [];
  foreach (COLS[$t] as $k) $v[$k] = $in[$k] ?? null;
  if ($t === 'products') {
    $v['active'] = empty($in['active']) ? 0 : 1;
    $v['price'] = (float)($in['price'] ?? 0);
    foreach (['category_id', 'brand_id', 'description', 'specs', 'image'] as $k) $v[$k] = nul($v[$k]);
    $img = $v['image'];
    if ($img !== null) {
      if (strpos($img, 'data:image/') === 0) $v['image'] = saveImage($img);
      elseif (!preg_match('#^(https?://|uploads/|assets/)#', $img) || strlen($img) > 255) $v['image'] = null;
    }
  }
  if ($t === 'vehicles') {
    foreach (['model_sample', 'logo', 'car_image'] as $k) $v[$k] = nul($v[$k] ?? null);
    foreach (['logo', 'car_image'] as $k) {
      if ($v[$k] !== null && strpos($v[$k], 'data:image/') === 0) $v[$k] = saveImage($v[$k]);
    }
    if (!$v['car_image'] && $v['logo']) $v['car_image'] = $v['logo'];
    if (!$v['logo'] && $v['car_image']) $v['logo'] = $v['car_image'];
  }
  return $v;
}
function links($db, $pid, $ids) {
  $db->prepare('DELETE FROM product_vehicles WHERE product_id=?')->execute([$pid]);
  $st = $db->prepare('INSERT INTO product_vehicles (product_id, vehicle_id) VALUES (?,?)');
  foreach (array_unique((array)$ids) as $vid) $st->execute([$pid, (int)$vid]);
}
function insert($db, $t, $in, $withId = false) {
  $v = row($t, $in); $cols = array_keys($v);
  if ($withId) { $v = ['id' => (int)$in['id']] + $v; $cols = array_keys($v); }
  $db->prepare("INSERT INTO $t (" . implode(',', $cols) . ') VALUES (:' . implode(',:', $cols) . ')')->execute($v);
  return $withId ? (int)$in['id'] : (int)$db->lastInsertId();
}
function everything($db, $admin) {
  $d = [];
  foreach (['categories', 'brands', 'vehicles'] as $t) {
    $d[$t] = $db->query("SELECT * FROM $t ORDER BY name")->fetchAll();
    foreach ($d[$t] as &$x) $x['id'] = (int)$x['id'];
    unset($x);
  }
  $pv = [];
  foreach ($db->query('SELECT product_id, vehicle_id FROM product_vehicles') as $x) $pv[$x['product_id']][] = (int)$x['vehicle_id'];
  $d['products'] = $db->query('SELECT id,name,category_id,brand_id,price,description,specs,image,active FROM products' . ($admin ? '' : ' WHERE active=1') . ' ORDER BY id DESC')->fetchAll();
  foreach ($d['products'] as &$p) {
    $p['id'] = (int)$p['id']; $p['price'] = (float)$p['price']; $p['active'] = (int)$p['active'];
    foreach (['category_id', 'brand_id'] as $k) $p[$k] = $p[$k] === null ? null : (int)$p[$k];
    $p['vehicles'] = $pv[$p['id']] ?? [];
  }
  unset($p);
  $d['settings'] = [];
  foreach ($db->query('SELECT k, v FROM settings') as $s) $d['settings'][$s['k']] = $s['v'];
  return $d;
}

$r = $_GET['r'] ?? ''; $m = $_SERVER['REQUEST_METHOD'];
$in = json_decode(file_get_contents('php://input'), true) ?: [];

try {
  if ($r === 'all' && $m === 'GET') out(everything($db, isAdmin($c)));

  if ($r === 'login' && $m === 'POST') {
    if (!password_verify($in['password'] ?? '', $c['admin_hash'])) { usleep(400000); out(['error' => 'Clave incorrecta'], 401); }
    out(['token' => sign(time() + 8 * 3600, $c)]);
  }

  admin($c);

  if (isset(COLS[$r])) {
    if ($m === 'POST') {
      if (empty($in['name'])) out(['error' => 'El nombre es obligatorio'], 422);
      if (!empty($in['id'])) {
        $old = null;
        if ($r === 'products') { $q = $db->prepare('SELECT image FROM products WHERE id=?'); $q->execute([(int)$in['id']]); $old = $q->fetchColumn(); }
        $v = row($r, $in); $set = implode(',', array_map(fn($k) => "$k=:$k", array_keys($v))); $v['id'] = (int)$in['id'];
        $db->prepare("UPDATE $r SET $set WHERE id=:id")->execute($v); $id = $v['id'];
        if ($r === 'products' && $old && $old !== $v['image']) dropImage($db, $old, $id);   // foto reemplazada o quitada
      } else $id = insert($db, $r, $in);
      if ($r === 'products') links($db, $id, $in['vehicles'] ?? []);
      out(['id' => $id]);
    }
    if ($m === 'DELETE') {
      try {
        $did = (int)($_GET['id'] ?? 0); $old = null;
        if ($r === 'products') { $q = $db->prepare('SELECT image FROM products WHERE id=?'); $q->execute([$did]); $old = $q->fetchColumn(); }
        $db->prepare("DELETE FROM $r WHERE id=?")->execute([$did]);
        if ($old) dropImage($db, $old, $did);
        out(['ok' => true]);
      }
      catch (PDOException $e) { out(['error' => 'No se puede eliminar: está en uso por productos'], 409); }
    }
  }

  if ($r === 'settings' && $m === 'POST') {
    $st = $db->prepare('REPLACE INTO settings (k, v) VALUES (?,?)');
    foreach ($in as $k => $v) if (preg_match('/^[a-z_]{1,40}$/', $k)) $st->execute([$k, (string)$v]);
    out(['ok' => true]);
  }

  if ($r === 'import' && $m === 'POST') {
    $db->beginTransaction();
    foreach (['product_vehicles', 'products', 'vehicles', 'brands', 'categories', 'settings'] as $t) $db->exec("DELETE FROM $t");
    foreach (['categories', 'brands', 'vehicles', 'products'] as $t)
      foreach ($in[$t] ?? [] as $x) { insert($db, $t, $x, true); if ($t === 'products') links($db, (int)$x['id'], $x['vehicles'] ?? []); }
    $st = $db->prepare('INSERT INTO settings (k, v) VALUES (?,?)');
    foreach ($in['settings'] ?? [] as $k => $v) $st->execute([$k, (string)$v]);
    $db->commit(); out(['ok' => true]);
  }

  out(['error' => 'Ruta no encontrada'], 404);
} catch (Throwable $e) {
  if ($db->inTransaction()) $db->rollBack();
  out(['error' => 'Error del servidor'], 500);
}

-- AUTOREPUESTOS Y ACCESORIOS PEÑA · MySQL / MariaDB
-- Crea la base de datos desde el panel del hosting (phpMyAdmin) e importa este archivo.
SET NAMES utf8mb4;

CREATE TABLE categories (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE brands (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE vehicles (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(80) NOT NULL UNIQUE,
  model_sample VARCHAR(120) NULL,
  logo         VARCHAR(255) NULL,
  car_image     VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(160) NOT NULL,
  category_id INT NULL,
  brand_id    INT NULL,
  price       DECIMAL(12,0) NOT NULL DEFAULT 0,
  description TEXT NULL,
  specs       TEXT NULL,
  image       VARCHAR(255) NULL,
  active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (brand_id)    REFERENCES brands(id)     ON DELETE RESTRICT,
  INDEX (active), INDEX (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE product_vehicles (
  product_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  PRIMARY KEY (product_id, vehicle_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE settings (
  k VARCHAR(40) PRIMARY KEY,
  v TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Datos iniciales con vehículos interactivos de muestra
INSERT INTO categories (name) VALUES ('Frenos'),('Filtros'),('Eléctrico'),('Motor'),('Suspensión'),('Iluminación');
INSERT INTO brands (name) VALUES ('Bosch'),('Brembo'),('Denso'),('Depo'),('Fram'),('KYB'),('MAC'),('Mann'),('Monroe'),('NGK'),('Philips');
INSERT INTO vehicles (name, model_sample, logo, car_image) VALUES
  ('Kia', 'Kia Picanto GT Line / Vibrant', 'assets/img/brands/picanto.webp', 'assets/img/brands/picanto.webp'),
  ('Mazda', 'Mazda 3 Sport Skyactiv', 'assets/img/brands/mazdaCar.png', 'assets/img/brands/mazdaCar.png'),
  ('Subaru', 'Subaru WRX Symmetrical AWD', 'assets/img/brands/subaru.webp', 'assets/img/brands/subaru.png'),
  ('Toyota', 'Toyota Corolla / Hilux', 'assets/img/brands/toyota.webp', 'assets/img/brands/subaru.png'),
  ('Chevrolet', 'Chevrolet Onix / Tracker', 'assets/img/brands/chevrolet.webp', 'assets/img/brands/picanto.webp'),
  ('Renault', 'Renault Logan / Duster / Sandero', NULL, 'assets/img/brands/mazdaCar.png');
INSERT INTO settings (k, v) VALUES ('name','AUTOREPUESTOS Y ACCESORIOS PEÑA'),('whatsapp','573232705498'),('address','Cra 27 #63-40, Bogotá, Colombia'),('hours','Lun a Sáb: 7:30 a. m. – 6:30 p. m.');

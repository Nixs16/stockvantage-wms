-- Creation of StockVantage WMS Database
CREATE DATABASE IF NOT EXISTS `stockvantage_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `stockvantage_db`;

-- 1. Table Users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Table Warehouses
CREATE TABLE IF NOT EXISTS `warehouses` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `color` VARCHAR(20) DEFAULT 'blue',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Table Racks
CREATE TABLE IF NOT EXISTS `racks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `warehouse_id` VARCHAR(50) NOT NULL,
  `rack_letter` VARCHAR(10) NOT NULL,
  `capacity` INT NOT NULL,
  UNIQUE KEY `unique_wh_rack` (`warehouse_id`, `rack_letter`),
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Table Items
CREATE TABLE IF NOT EXISTS `items` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `sku` VARCHAR(100) UNIQUE NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `price` DECIMAL(15,2) NOT NULL,
  `quantity` INT DEFAULT 0,
  `min_stock` INT DEFAULT 5,
  `warehouse_id` VARCHAR(50) NOT NULL,
  `rack_letter` VARCHAR(10) NOT NULL,
  `slot` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`),
  FOREIGN KEY (`warehouse_id`, `rack_letter`) REFERENCES `racks` (`warehouse_id`, `rack_letter`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Table Transactions
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` VARCHAR(50) PRIMARY KEY,
  `item_id` VARCHAR(50) NOT NULL,
  `item_name` VARCHAR(200) NOT NULL,
  `type` VARCHAR(10) NOT NULL, -- 'in' or 'out'
  `quantity` INT NOT NULL,
  `timestamp` VARCHAR(50) NOT NULL, -- Format display: '04 Jun, 14:25'
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- Insert Default / Demo Data
-- ==========================================

-- Insert Users (Password is plain-text for demo ease, or can be hashed)
INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES
('Budi Wibowo', 'manager@stockvantage.com', 'manager123', 'Manager'),
('Siti Aminah', 'supervisor@stockvantage.com', 'supervisor123', 'Supervisor'),
('Agus Prasetyo', 'staff@stockvantage.com', 'staff123', 'Staff Admin')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Insert Warehouses
INSERT INTO `warehouses` (`id`, `name`, `description`, `color`) VALUES
('wh-1', 'Gudang 1', 'Gudang utama untuk Elektronik & Suku Cadang', 'blue'),
('wh-2', 'Gudang 2', 'Gudang Furnitur & Alat Tulis', 'green'),
('wh-3', 'Gudang 3', 'Gudang cadangan (buffer stock)', 'purple')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Insert Racks for Warehouses
INSERT INTO `racks` (`warehouse_id`, `rack_letter`, `capacity`) VALUES
('wh-1', 'A', 150),
('wh-1', 'B', 100),
('wh-2', 'C', 300),
('wh-2', 'D', 150)
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Insert Items
INSERT INTO `items` (`id`, `name`, `sku`, `category`, `price`, `quantity`, `min_stock`, `warehouse_id`, `rack_letter`, `slot`) VALUES
('item-1', 'Laptop Asus Zenbook 14', 'EL-LPT-001', 'Elektronik', 15499000.00, 42, 10, 'wh-1', 'A', '1'),
('item-2', 'Kursi Kantor Ergonomis Koenig', 'FR-CHR-002', 'Furnitur', 1850000.00, 8, 12, 'wh-1', 'B', '4'),
('item-3', 'Monitor Dell 27 Inch 4K', 'EL-MON-003', 'Elektronik', 5699000.00, 15, 5, 'wh-1', 'A', '3'),
('item-4', 'Kertas HVS A4 Sinar Dunia 80g', 'AT-PPR-004', 'Alat Tulis', 48000.00, 180, 30, 'wh-2', 'C', '1'),
('item-5', 'Obeng Set Toolkit Bosch', 'SC-TLK-005', 'Suku Cadang', 320000.00, 3, 8, 'wh-2', 'D', '2'),
('item-6', 'Meja Rapat Kayu Jati', 'FR-TBL-006', 'Furnitur', 7800000.00, 0, 2, 'wh-1', 'B', '1'),
('item-7', 'Keyboard Mechanical Keychron K2', 'EL-KEY-007', 'Elektronik', 1450000.00, 24, 6, 'wh-1', 'A', '2')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Insert Initial Transactions
INSERT INTO `transactions` (`id`, `item_id`, `item_name`, `type`, `quantity`, `timestamp`) VALUES
('TRX-101', 'item-1', 'Laptop Asus Zenbook 14', 'in', 15, '03 Jun, 14:25'),
('TRX-102', 'item-2', 'Kursi Kantor Ergonomis Koenig', 'out', 4, '03 Jun, 16:10'),
('TRX-103', 'item-5', 'Obeng Set Toolkit Bosch', 'out', 2, '04 Jun, 01:15'),
('TRX-104', 'item-4', 'Kertas HVS A4 Sinar Dunia 80g', 'in', 50, '04 Jun, 03:40')
ON DUPLICATE KEY UPDATE `id`=`id`;

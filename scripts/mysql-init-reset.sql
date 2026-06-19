ALTER USER 'root'@'localhost' IDENTIFIED BY 'Dailytaaza@123';
ALTER USER 'root'@'127.0.0.1' IDENTIFIED BY 'Dailytaaza@123';
CREATE DATABASE IF NOT EXISTS `daily_taaza` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'daily_taaza'@'localhost' IDENTIFIED BY 'Dailytaaza@123';
CREATE USER IF NOT EXISTS 'daily_taaza'@'127.0.0.1' IDENTIFIED BY 'Dailytaaza@123';
GRANT ALL PRIVILEGES ON `daily_taaza`.* TO 'daily_taaza'@'localhost';
GRANT ALL PRIVILEGES ON `daily_taaza`.* TO 'daily_taaza'@'127.0.0.1';
FLUSH PRIVILEGES;
-- Adds the Admin and Enabled flags.
-- Guarded so this stays a no-op on any database where the columns already exist.

SET @admin_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'Admin'
);
SET @admin_sql := IF(
  @admin_exists = 0,
  'ALTER TABLE `Users` ADD COLUMN `Admin` tinyint(1) NOT NULL DEFAULT ''0''',
  'SELECT ''Users.Admin already exists'''
);
PREPARE stmt FROM @admin_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @enabled_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'Enabled'
);
SET @enabled_sql := IF(
  @enabled_exists = 0,
  'ALTER TABLE `Users` ADD COLUMN `Enabled` tinyint(1) NOT NULL DEFAULT ''1''',
  'SELECT ''Users.Enabled already exists'''
);
PREPARE stmt FROM @enabled_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

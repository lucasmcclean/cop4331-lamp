-- Default admin account required by the spec: root / Application Administrator.
-- Password is the bcrypt hash of "root". Change it after first login.
-- Guarded so re-running never creates a second root or overwrites the live one.

INSERT INTO `Users` (`First Name`, `Last Name`, `Login`, `Password`, `Admin`, `Enabled`)
SELECT 'Application', 'Administrator', 'root',
       '$2y$10$MnXLgIr.Pxt5VPve5JbjAudcK./9XKxB79PO9oXNvQMk/d1Hs4pCS', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `Users` WHERE `Login` = 'root');

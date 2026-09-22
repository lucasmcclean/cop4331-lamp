<?php
// Prevent execution over HTTP, this is CLI only
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Forbidden: this script can only be run from the command line.\n");
}

require_once __DIR__ . '/../api/config/db.php';

$db = getDB();

$db->exec(
    "CREATE TABLE IF NOT EXISTS `schema_migrations` (
        `version` varchar(255) NOT NULL,
        `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`version`)
    )"
);

$applied = array_flip($db->query("SELECT `version` FROM `schema_migrations`")->fetchAll(PDO::FETCH_COLUMN));

$files = glob(__DIR__ . '/migrations/*.sql');
sort($files);

$count = 0;
foreach ($files as $file) {
    $version = basename($file, '.sql');

    if (isset($applied[$version])) {
        echo "Skipped (already applied): $version\n";
        continue;
    }

    $db->exec(file_get_contents($file));
    $db->prepare("INSERT INTO `schema_migrations` (`version`) VALUES (?)")->execute([$version]);
    echo "Applied: $version\n";
    $count++;
}

echo $count === 0 ? "Nothing to apply.\n" : "Done — $count migration(s) applied.\n";

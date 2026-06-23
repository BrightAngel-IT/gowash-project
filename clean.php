<?php
// clean.php
// Delete all files and folders recursively in the directory where this script is placed

function deleteDirectoryContent($dir) {
    if (!file_exists($dir)) {
        return true;
    }

    // Folder eka delete karanna kalin eke permission 777 karanna
    @chmod($dir, 0777);

    if (!is_dir($dir)) {
        @chmod($dir, 0777);
        return @unlink($dir);
    }

    foreach (scandir($dir) as $item) {
        if ($item == '.' || $item == '..') {
            continue;
        }

        // Script eka (clean.php) delete nokara inna
        if ($item == 'clean.php') {
            continue;
        }

        $path = $dir . DIRECTORY_SEPARATOR . $item;

        // File eke/folder eke permission 777 karanna force karanna
        @chmod($path, 0777);

        if (is_dir($path)) {
            deleteDirectoryContent($path);
            @rmdir($path);
        } else {
            @unlink($path);
        }
    }

    return true;
}

$dir = dirname(__FILE__);

if (deleteDirectoryContent($dir)) {
    echo "<h1>Okkoma files & folders walata 777 permission deela successfully delete kara!</h1>";
    echo "<p>Dan oyata aluth dist folder eka upload karanna puluwan.</p>";
} else {
    echo "<h1>Samahara files delete karanna bari wuna.</h1>";
}
?>

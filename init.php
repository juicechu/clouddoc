<?php

define('SYSTEM_DEBUG', false);

define('SAE_MYSQL_HOST_M', 'localhost');
define('SAE_MYSQL_PORT', '3306');
define('SAE_MYSQL_DB', 'clouddoc');
define('SAE_MYSQL_USER', 'root');
define('SAE_MYSQL_PASS', 'root');

if(! function_exists('sae_debug')) {
    function sae_debug() {}
}

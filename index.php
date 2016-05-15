<?php
    require('init.php');
    ini_set('display_errors',SYSTEM_DEBUG);
    $req_uri = $_SERVER['REQUEST_URI'];
    $req_querystring = $_SERVER["QUERY_STRING"];
    $req_controller = str_replace(($req_querystring),"",$req_uri);

    include($_SERVER['DOCUMENT_ROOT']."/route.php");
    $route = new Route();
    $match = $route -> processURL($req_controller);
    if($match){
        $file = $route->getFilePath();
        $controller = $route->getClassName();
        $id = $route->getID();
        include($_SERVER['DOCUMENT_ROOT'].$file);
        $base = new $controller($id);
        $base->excute();
    }
    else{
        echo "not found router";
    }

?>

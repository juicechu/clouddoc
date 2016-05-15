<?php
if(class_exists('MySqlUtil') != true)   
{
class MySqlUtil
{
    public function __construct()  
    {
    }

    public function query($sql, $params)
    {
        $result = array();
        /*
        $link = mysql_connect ( SAE_MYSQL_HOST_M . ':' . SAE_MYSQL_PORT, SAE_MYSQL_USER, SAE_MYSQL_PASS );
        mysql_select_db ( SAE_MYSQL_DB, $link );
        mysql_set_charset("utf8");
        $query = mysql_query ( $sql );
        while ( $row = mysql_fetch_array ( $query, MYSQL_ASSOC ) ) {
            $result[] = $row;
        }
        mysql_free_result ( $query );
        mysql_close( $link );
        */

        $dsn = 'mysql:host=' . SAE_MYSQL_HOST_M . ';port=' . SAE_MYSQL_PORT . ';dbname=' . SAE_MYSQL_DB;
        $ops = array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8");
        $pdo  = new PDO($dsn, SAE_MYSQL_USER, SAE_MYSQL_PASS, $ops);
        $pre = $pdo->prepare($sql); 
        $pre->execute($params); 
        $query = $pre->fetchAll();
        foreach ($query as $row) { 
            $result[] = $row;
        }
        $pdo = null;
        return $result;
    }

    public function insert($sql, $params)
    {
        $id = -1;
        /*
        $link = mysql_connect ( SAE_MYSQL_HOST_M . ':' . SAE_MYSQL_PORT, SAE_MYSQL_USER, SAE_MYSQL_PASS );
        mysql_select_db ( SAE_MYSQL_DB, $link );
        mysql_set_charset("utf8");
        $query = mysql_query ( $sql );
        if($query){
            $id = mysql_insert_id();
        }
        mysql_close( $link );
        */

        $dsn = 'mysql:host=' . SAE_MYSQL_HOST_M . ';port=' . SAE_MYSQL_PORT . ';dbname=' . SAE_MYSQL_DB;
        $ops = array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8");
        $pdo  = new PDO($dsn, SAE_MYSQL_USER, SAE_MYSQL_PASS, $ops);
        $pre = $pdo->prepare($sql); 
        $pre->execute($params); 
        $id = $pdo->lastInsertId(); 
        return $id;
    }

    public function excute($sql, $params)
    {
        /*
        $link = mysql_connect ( SAE_MYSQL_HOST_M . ':' . SAE_MYSQL_PORT, SAE_MYSQL_USER, SAE_MYSQL_PASS );
        mysql_select_db ( SAE_MYSQL_DB, $link );
        mysql_set_charset("utf8");
        $query = mysql_query ( $sql );
        mysql_close( $link );
        */
        $dsn = 'mysql:host=' . SAE_MYSQL_HOST_M . ';port=' . SAE_MYSQL_PORT . ';dbname=' . SAE_MYSQL_DB;
        $ops = array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8");
        $pdo  = new PDO($dsn, SAE_MYSQL_USER, SAE_MYSQL_PASS, $ops);
        $pre = $pdo->prepare($sql); 
        $pre->execute($params); 
        $count = $pre->rowCount();
        return $count;
    }
}
}
?>
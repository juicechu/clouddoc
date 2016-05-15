<?php
global $SDK_VER;

global $QINIU_UP_HOST;
global $QINIU_RS_HOST;
global $QINIU_RSF_HOST;

global $QINIU_ACCESS_KEY;
global $QINIU_SECRET_KEY;


$SDK_VER = "6.1.9";

/*
$QINIU_UP_HOST	= 'http://upload.qiniu.com';
$QINIU_RS_HOST	= 'http://rs.qbox.me';
$QINIU_RSF_HOST	= 'http://rsf.qbox.me';
$QINIU_ACCESS_KEY	= '';
$QINIU_SECRET_KEY	= '';
$BUCKET = 'pchou002';
*/

include $_SERVER['DOCUMENT_ROOT'].'/db.php';

if (! isset($params)) {
    $params = [];
}
$config = array();
$mysql = new MySqlUtil();
$sql = 'select name, value from config';
$dataset = $mysql->query($sql,$params);
foreach ($dataset as $raw){
	$config[$raw['name']] = $raw['value'];
}

$QINIU_UP_HOST	= $config['QINIU_UP_HOST'];
$QINIU_RS_HOST	= $config['QINIU_RS_HOST'];
$QINIU_RSF_HOST	= $config['QINIU_RSF_HOST'];
$QINIU_ACCESS_KEY	= $config['QINIU_ACCESS_KEY'];
$QINIU_SECRET_KEY	= $config['QINIU_SECRET_KEY'];
$BUCKET = $config['BUCKET'];
$BUCKETHOST = $config['BUCKET_HOST'];

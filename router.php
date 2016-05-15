<?php

/**
 *路由配置文件编写说明： 
 *  路由配置在一个array数组中，一条记录代表一个规则
 *  优先匹配索引低的规则
 *  key:   只接受2中规则 '/{controller}'和'/{controller}/{id}'。{controller}可用字符包括：字母，数字，_
 *  value: 第一项controller类名(文件名除去扩展名必须与类名相同);
 *         第二项id只能为正整数(包含0)
 *  controller文件必须位于'/controller'文件夹下；类名必须与文件名相同(除去扩展名.php)，区分大小写。
**/

$routes= array(
	'/resources' => array('resources',''),
	'/resources/id' => array('resources','id'),
	'/qiniuuptoken' => array('qiniuuptoken',''),
	'/qiniucallback' => array('qiniucallback',''),
	'/qiniunotify' => array('qiniunotify',''),
	'/qiniuprefop' => array('qiniuprefop','')
);

?>

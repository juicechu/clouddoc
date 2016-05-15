<?php

include $_SERVER['DOCUMENT_ROOT'].'/controller/base.php';
require_once("qiniu/rs.php");
include_once $_SERVER['DOCUMENT_ROOT'].'/db.php';

//input POST key: fname: fsize ...
//output { id: lastid  }
class qiniucallback extends Base
{
	public function post(){
		sae_debug('callback comes : ' . file_get_contents('php://input'));
		if(!$this->IsQiniuCallback()){
			$this->_Response->sendResponse(403,'no zuo no die, why you try?','text/plain');
			return;
		}

		//vars from qiniu
		//save them into db and get the last id
		$key = $_POST['key'];
		$fname = $_POST['fname']; //if fname is empty use cfname instead of fname
		$fname = $_POST['fname'];
		$fsize = $_POST['fsize'];
		$mimeType = $_POST['mimeType'];
		$persistentId = $_POST['persistentId']; //may empty
		$bucket = $_POST['bucket'];
		$pid = $_POST['pid']; //parent folder id
		$cfname = $_POST['cfname']; //if fname is empty use cfname instead of fname
		$mysql = new MySqlUtil();
		$sql = 'INSERT INTO upload_file (type, parent_id, owner_account_id, file_name, key_preview, key_thumb, is_processing, persistent_id,create_time, mod_time, bucket, file_size, mime_type, key_orignal) ' .
            'VALUES (1, :parent_id, 490, :file_name, :key_preview,:key_thumb ,:is_processing, :persistent_id, NOW(), NOW(), :bucket, :file_size,:mime_type, :key_orignal)';
		$params = array();
		$params[':parent_id'] = ($pid != null && $pid != '' && is_numeric($pid)) ? $pid : null;
		$params[':file_name'] = ($fname != null && $fname != '') ? $fname : $cfname;
		if(stripos($mimeType,"image") !== false || stripos($mimeType,"application/pdf") !== false ){
			$params[':key_preview'] = $key;
		}
		else{
			$params[':key_preview'] = null;
		}
		//set thumb url for image
		if(stripos($mimeType,"image") !== false){
			$params[':key_thumb'] = $key . '?imageView2/1/w/100/h/100';
		}
		else{
			$params[':key_thumb'] = null;
		}

		$params[':is_processing'] = ($persistentId != null && $persistentId != '') ? 1 : null;
		$params[':persistent_id'] = ($persistentId != null && $persistentId != '') ? $persistentId : null;
		$params[':bucket'] = $bucket;
		$params[':file_size'] = $fsize;
		$params[':mime_type'] = $mimeType;
		$params[':key_orignal'] = $key;


		$id = $mysql->insert($sql, $params);
		$fake = array('id' => $id,);
		$this->_Response->sendResponse(200,json_encode($fake),'application/json');

	}
}

?>

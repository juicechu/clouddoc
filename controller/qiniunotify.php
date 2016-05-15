<?php

include $_SERVER['DOCUMENT_ROOT'].'/controller/base.php';
include_once $_SERVER['DOCUMENT_ROOT'].'/db.php';
require_once("qiniu/rs.php");


class qiniunotify extends Base
{
	public function post(){
		// if(!$this->IsQiniuCallback()){
		// 	$this->_Response->sendResponse(403,'no zuo no die, why you try?','text/plain');
		// 	return;
		// }

		sae_debug('notify comes : ' . file_get_contents('php://input'));

		$data = $this->_Request->getData();
		if($data == null){
			$this->_Response->sendResponse(400);
		}
		$persistentId = null;

		if(array_key_exists('id',$data)){
			$persistentId = $data['id'];
		}
		//persistent id must be exist
		if($persistentId == null){
			$this->_Response->sendResponse(400);
		}


		if(array_key_exists('code',$data) && $data['code'] == 0){
			sae_debug("code is 0");
			$mysql = new MySqlUtil();
			$sql = 'SELECT id,key_preview,key_thumb FROM upload_file WHERE persistent_id = :persistent_id';
			$params = array(':persistent_id'=>$persistentId);
			$dataset = $mysql->query($sql,$params);
			foreach ($dataset as $raw){
				sae_debug('get id is: ' . $raw['id']);
				if(!$raw['id']) continue;
				$sql = 'UPDATE upload_file SET key_preview=:key_preview,key_thumb=:key_thumb,is_processing=:is_processing WHERE id=:id';
				$params = array(
					':id'=>$raw['id'],
					':key_preview'=>$raw['key_preview'],
					':key_thumb'=>$raw['key_thumb'],
					':is_processing'=>0
					);
				foreach ($data['items'] as $item) {
					sae_debug('item cmd is: ' . $item['cmd'] . ' item key is:' . $item['key']);
					if(stripos($item['cmd'],"avthumb") !== false
						&& $item['code'] == 0){
						$params[':key_preview'] = $item['key'];
					}
					elseif (stripos($item['cmd'],"vframe") !== false
						&& $item['code'] == 0) {
						$params[':key_thumb'] = $item['key'];
					}
					elseif (stripos($item['cmd'],"odconv") !== false
						&& $item['code'] == 0) {
						$params[':key_preview'] = $item['key'];
					}
				}
				sae_debug('last sql is: ' . $sql);
				$success = $mysql->excute($sql, $params);
				$result = array(
					'Message' => 'modified successfully.'
				);
				$this->_Response->sendResponse(200,json_encode($result),'application/json');

			}
		}
		else{
			$this->_Response->sendResponse(200); //do nothing
		}

	}
}

?>

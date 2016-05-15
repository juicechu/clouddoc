<?php
include $_SERVER['DOCUMENT_ROOT'].'/controller/base.php';
include_once $_SERVER['DOCUMENT_ROOT'].'/db.php';
require_once("qiniu/rs.php");

class resources extends Base
{
	public function get()
	{
		global $BUCKETHOST;
		$pid = null;
		$request_vars = $this->_Request->getRequestVars();
		$id = $request_vars[id];
		if(array_key_exists('pid',$request_vars)){
			$pid = $request_vars['pid'];
		}
		$result = array();
		$mysql = new MySqlUtil();
		$sql = '';
		$params = array();
		if($id != null && $id != '' && $id != 'null')
		{
			$sql = 'SELECT * FROM upload_file WHERE id = :id';
			$params[':id'] = $id;
		}
		else if($pid != null && $pid != '' && $pid != 'null')
		{
			$sql = 'SELECT * FROM upload_file WHERE parent_id = :pid';
			$params[':pid'] = $pid;
		}
		else
		{
			$sql = 'SELECT * FROM upload_file WHERE parent_id is null';
		}
		$dataset = $mysql->query($sql,$params);
		foreach ($dataset as $raw){
			$download_url = $raw['type'] == 0 ? null :
			    ($BUCKETHOST . "/" . $raw['key_orignal'] . "?download/" . $raw['file_name']);
			$thumb_url = ($raw['type'] == 0 || $raw['key_thumb'] == null || $raw['key_thumb'] == '') ? null : ($BUCKETHOST . "/" . $raw['key_thumb']);
			$preview_url = ($raw['type'] == 0 || $raw['key_preview'] == null || $raw['key_preview'] == '') ? null : ($BUCKETHOST . "/" . $raw['key_preview']);
			if($raw['key_thumb']==null || $raw['key_thumb'] == '')
			{
				$thumb_url = $this->extend($raw['file_name']);
			}
			$result[] = array(
				'id' => (int)$raw['id'],
				'type' => (int)$raw['type'],
				'parent_id' => (int)$raw['parent_id'],
				'owner_id' => urlencode($raw['owner_account_id']),
				'file_name' => urlencode($raw['file_name']),
				'download_url' => urlencode($download_url),
				'thumb_url' => urlencode($thumb_url),
				'preview_url' => urlencode($preview_url),
				'mediatype' => urlencode($raw['mime_type']),
				'order' => urlencode($raw['order_x']),
				'is_processing' => urlencode($raw['is_processing']),
				'is_dir_viewable' => urlencode($raw['is_dir_viewable']),
				'is_publish' => urlencode($raw['is_publish']),
				'create_time' => urlencode($raw['create_time']),
				'mod_time' => urlencode($raw['mod_time']),
				'key_thumb' => urlencode($raw['key_thumb']),
				'file_size' => (int)$raw['file_size'],
				'persistent_id' => urlencode($raw['persistent_id']),
			);
		}
		if($id != null && $id != '' && $id != 'null')
		{
			$result = $result[0];
		}
		$this->_Response->sendResponse(200,urldecode(json_encode($result)),'application/json');
	}

	//create a folder
    //this api is only avaliable for folder create
	public function post()
	{
		$data = $this->_Request->getData();
		$file_name = null;
		$parent_id = null;
		if(array_key_exists('file_name',$data)){
			$file_name = $data['file_name'];
		}
		if(array_key_exists('parent_id',$data)){
			$parent_id = $data['parent_id'];
		}
		if($file_name == null || $file_name=='')
		{
			$result = array('Message' => 'Folder file_name must be provided.');
			$this->_Response->sendResponse(405,json_encode($result),'application/json');
		}
		$mysql = new MySqlUtil();
		$sql = "";
		$params = array();
		if($parent_id == null || $parent_id=='' || $parent_id == 'null')
		{
			$sql = 'INSERT INTO upload_file (file_name, owner_account_id, type, create_time, mod_time) VALUES (:file_name, 490, 0, NOW(), NOW())';
			$params[':file_name'] = $file_name;
		}
		else
		{
			$sql = 'INSERT INTO upload_file (file_name, owner_account_id, type, create_time, mod_time, parent_id) VALUES (:file_name, 490, 0, NOW(), NOW(), :parent_id)';
			$params[':file_name'] = $file_name;
			$params[':parent_id'] = $parent_id;
		}
		$id = $mysql->insert($sql, $params);
		$result = array(
			'id' => $id,
			'Message' => 'Folder create successfully.'
		);
		$this->_Response->sendResponse(201,json_encode($result),'application/json');

	}

	//modify some properties for a folder or file
	public function patch()
	{
		$request_vars = $this->_Request->getRequestVars();
		$data = $this->_Request->getData();
		$id = $request_vars[id];
		if($id == null || $id == '' || $id == 'null')
		{
			$result = array('Message' => 'url path must contain id.');
			$this->_Response->sendResponse(405,json_encode($result),'application/json');
		}
		$file_name = null;
		$parent_id = null;
		$is_processing = null;
		$is_publish = null;
		$order = null;
		if(array_key_exists('file_name',$data)){
			$file_name = $data['file_name'];
		}
		if(array_key_exists('parent_id',$data)){
			$parent_id = $data['parent_id'];
		}
		if(array_key_exists('is_processing',$data)){
			$is_processing = $data['is_processing'];
		}
		if(array_key_exists('is_publish',$data)){
			$is_publish = $data['is_publish'];
		}
		if(array_key_exists('order',$data)){
			$order = $data['order'];
		}
		$this->fetchcheck($id,$parent_id);
		$mysql = new MySqlUtil();
		$sql = 'UPDATE upload_file SET mod_time = NOW()';
		$params = array();
		if($file_name != null && $file_name != '' && $file_name != 'null')
		{
			$sql =  $sql . ', file_name = :file_name';
			$params[':file_name'] = $file_name;
		}
		if($parent_id != null && $parent_id != '' && $parent_id != 'null')
		{
			$sql =  $sql . ', parent_id = :parent_id';
			$params[':parent_id'] = $parent_id;
		}
		else
		{
			$sql =  $sql . ', parent_id = :parent_id';
			$params[':parent_id'] = null;
		}
		if($is_processing != null && $is_processing != '' && $is_processing != 'null')
		{
			$sql =  $sql . ', is_processing = :is_processing';
			$params[':is_processing'] = $is_processing;
		}
		if($is_publish != null && $is_publish != '' && $is_publish != 'null')
		{
			$sql =  $sql . ', is_publish = :is_publish';
			$params[':is_publish'] = $is_publish;
		}
		if($order != null && $order != '' && $order != 'null')
		{
			$sql =  $sql . ', order_x = :order';
			$params[':order'] = $order;
		}
		$sql = $sql . ' WHERE id = :id';
		$params[':id'] = $id;
		$success = $mysql->excute($sql, $params);
		if($success>0)
		{
			$result = array(
				'Message' => 'modified successfully.'
			);
			$this->_Response->sendResponse(200,json_encode($result),'application/json');
		}
		else
		{
			$result = array(
				'Message' => 'modified failed.'
			);
			$this->_Response->sendResponse(500,json_encode($result),'application/json');
		}
	}

	public function delete()
	{
		$request_vars = $this->_Request->getRequestVars();
		$id = $request_vars[id];
		if($id == null || $id == '' || $id == 'null')
		{
			$result = array('Message' => 'url path must contain id.');
			$this->_Response->sendResponse(405,json_encode($result),'application/json');
		}

		$mysql = new MySqlUtil();
		$sql = 'SELECT key_orignal FROM upload_file WHERE id = :id';
		$params = array(':id'=>$id);
		$dataset = $mysql->query($sql,$params);
		global $BUCKET;
		foreach ($dataset as $raw){
			if($raw['key_orignal']){
				//delete resorce from qiniu
				$client = new Qiniu_MacHttpClient();
				Qiniu_RS_Delete( $client,$BUCKET, $raw['key_orignal'] );
			}
		}

		$sql = 'DELETE FROM upload_file WHERE id = :id';
		$params = array(':id'=>$id);


		$result = array(
			'Message' => 'forbidden delete resources.'
		);
		//$this->_Response->sendResponse(405,json_encode($result),'application/json');


		$success = $mysql->excute($sql, $params);
		if($success>0)
		{
			$result = array(
				'Message' => 'deleted successfully.'
			);
			$this->_Response->sendResponse(200,json_encode($result),'application/json');
		}
		else
		{
			$result = array(
				'Message' => 'deleted failed.'
			);
			$this->_Response->sendResponse(500,json_encode($result),'application/json');
		}
	}

	private function extend($file_name)
	{
		$extend = explode("." , $file_name);
		$lower = strtolower(end($extend));
		if($lower == "avi" || $lower == "mp4" || $lower == "flv" || $lower == "wmv" || $lower == "mov")
		{
			return "/img/video_pending_ico.png";
		}
		else if($lower == "doc" || $lower == "docx")
		{
			return "/img/word_ico.png";
		}
		else if($lower == "ppt" || $lower == "pptx")
		{
			return "/img/ppt_ico.png";
		}
		else if($lower == "pdf")
		{
			return "/img/pdf_ico.png";
		}
		else
		{
			return "/img/document_ico.png";
		}
	}

	private function fetchcheck($id, $pid)
	{
		$mysql = new MySqlUtil();
		$sql = 'SELECT * FROM upload_file WHERE id = :id';
		$params[':id'] = $id;
		$dataset = $mysql->query($sql, $params);
		if(count($dataset)<=0)
		{
			$result = array(
				'Message' => 'resource not found.'
			);
			$this->_Response->sendResponse(404,json_encode($result),'application/json');
		}
		else
		{
			$file = $dataset[0];
			if($pid == null || $pid == $file['parent_id'] || $file['type'] == 1)
			{
				return true;
			}
			else
			{
				$this->recursioncheck($pid, $id);
			}
		}

	}

	private function recursioncheck($sourceid, $targetid)
	{
		$mysql = new MySqlUtil();
		$sql = 'SELECT * FROM upload_file WHERE id = :id';
		$params[':id'] = $sourceid;
		$dataset = $mysql->query($sql, $params);
		if(count($dataset)<=0)
		{
			$result = array(
				'Message' => 'the data in db table upload_file is error.'
			);
			$this->_Response->sendResponse(405,json_encode($result),'application/json');
		}
		$sourcefile = $dataset[0];
		if($sourcefile['parent_id'] == 0 || $sourcefile['parent_id'] == null)
		{
			return true;
		}
		else if($sourcefile['parent_id'] == $targetid)
		{
			$result = array(
				'Message' => 'move a folder to its children folder.'
			);
			$this->_Response->sendResponse(405,json_encode($result),'application/json');
		}
		else
		{
			$this->recursioncheck($sourcefile['parent_id'], $targetid);
		}
	}
}

?>

<?php

include $_SERVER['DOCUMENT_ROOT'].'/controller/base.php';

class qiniuprefop extends Base
{
	public function get()
	{
		$request_vars = $this->_Request->getRequestVars();
		$pid = $request_vars[pid];
		if($pid == null || $pid == '' || $pid == 'null')
		{
			$result = array('Message' => 'url path must contain pid.');
			$this->_Response->sendResponse(405,json_encode($result),'application/json');
		}
		$url='http://api.qiniu.com/status/get/prefop?id=' . $pid;  
		$output = file_get_contents($url); 
		if($output)
		{
			$result =  json_decode($output,true);
			$this->_Response->sendResponse(200,json_encode($result),'application/json');
		}
		else
		{
			$result = array('Message' => 'can not get prefop message from Qiniu.');
			$this->_Response->sendResponse(405,json_encode($result),'application/json');
		}
	}
}


?>
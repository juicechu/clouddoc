<?php

include $_SERVER['DOCUMENT_ROOT'].'/request.php';
include $_SERVER['DOCUMENT_ROOT'].'/response.php';

class Base
{
	public $_Request;
	public $_Response;

	public function __construct($id = null)
	{
		$this->_Request = new Request($id);
		$this->_Response = new Response();
	}

	public function excute()
	{
		switch($this->_Request->getMethod())
		{
			case 'get':
				$this->get();
				break;
			case 'post':
				$this->post();
				break;
			case 'put':
				$this->put();
				break;
			case 'delete':
				$this->delete();
				break;
			case 'patch':
				$this->patch();
				break;
		}
	}

	public function get()
	{
	}

	public function post()
	{
	}

	public function put()
	{
	}

	public function delete()
	{
	}

	public function patch()
	{
	}

	public function IsQiniuCallback(){

		global $QINIU_ACCESS_KEY;
		global $QINIU_SECRET_KEY;

        //$_SERVER['Authorization'] not work
        //see http://stackoverflow.com/questions/2902621/fetching-custom-authorization-header-from-incoming-php-request
        //$headers = apache_request_headers();
		//$authstr = $headers['Authorization'];
        $authstr = $_SERVER['HTTP_AUTHORIZATION'];
		if(strpos($authstr,"QBox ")!=0){
        	return false;
    	}
        $auth = explode(":",substr($authstr,5));
    	if(sizeof($auth) != 2 || $auth[0] != $QINIU_ACCESS_KEY){
	        return false;
	    }

		$mac = new Qiniu_Mac($QINIU_ACCESS_KEY, $QINIU_SECRET_KEY);

		return $mac->VerifyCallback(
			$authstr,
			$_SERVER['REQUEST_URI'] ,
			file_get_contents('php://input'));
	}
}

?>

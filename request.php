<?php

class Request
{
	private $request_vars;  
    private $data;  
    private $http_accept;  
    private $method; 
    private $ID; 
  
    public function __construct($id = null)  
    {  
        $this->request_vars      = array();  
        $this->data              = array(); 
        $this->http_accept       = 'application/json';  
        $this->method            = 'get';  
        $this->ID                = $id;  
        $this->processRequest();
    }  

    public function processRequest()
    {
    	$request_method = strtolower($_SERVER['REQUEST_METHOD']);
        $this->setMethod($request_method);  

        $request_vars = $_GET;
        if($request_vars != ''){
            $this->setRequestVars($request_vars); 
        }  

        $data = file_get_contents('php://input');
        if($data != ''){
            $this->setData(json_decode($data,TRUE));  
        } 
    } 

    public function setID($id)  
    {  
        $this->ID = $id;  
    }  
  
    public function setData($data)  
    {  
        $this->data = $data;  
    }  
  
    public function setMethod($method)  
    {  
        $this->method = $method;  
    }  
  
    public function setRequestVars($request_vars)  
    {  
        $this->request_vars = $request_vars;  
    }

    public function getID()  
    {  
        return $this->ID;  
    }  
  
    public function getData()  
    {  
        return $this->data;  
    }  
  
    public function getMethod()  
    {  
        return $this->method;  
    }  
  
    public function getHttpAccept()  
    {  
        return $this->http_accept;  
    }  
  
    public function getRequestVars()  
    {  
        $this->request_vars['id'] = $this->ID;
        return $this->request_vars;  
    }  
}  

?>
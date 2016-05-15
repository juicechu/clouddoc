<?php

class Route
{
	private $filepath;  
    private $classname;    
    private $id; 
    private $routepatterns; 
 
	public function __construct()
	{
		$this->filepath      = '';    
        $this->classname     = '';  
        $this->id            = null;
		$this->routepatterns = array(); 
		$this->initRoutes();
	}

	private function initRoutes()
	{
		$reg_m1 = '#^/(\w+)$#';
		$reg_m2 = '#^/(\w+)/id$#';
		$matches = array();
		$routes = array();
		include 'router.php';
		foreach($routes as $key=>$value){  
			
			if(preg_match($reg_m1,$key,$matches)){
				$this->routepatterns[] = array('#^/('.$matches[1].')\??$#i', array('controller/'.$value[0].'.php',$value[0]));
			}
			else if(preg_match($reg_m2,$key,$matches)){
				$this->routepatterns[] = array('#^/('.$matches[1].')/(\d+)\??$#i', array('controller/'.$value[0].'.php',$value[0]));
			}
		}
	}

	public function processURL($urlpath)
	{
		$matches = array();
		foreach($this->routepatterns as $router){
		 	if(preg_match($router[0],$urlpath,$matches)){
		 		$filepath_ = '/'.$router[1][0];
		 		$classname_ = $router[1][1];
		 		$id_ = count($matches)>2?$matches[2]:null;
		 		$this->setFilePath($filepath_);
		 		$this->setClassName($classname_);
		 		$this->setID($id_);
		 		return true;
		 	}
		 }
		 return false;
	}

	public function setFilePath($filepath)  
    {  
        $this->filepath = $filepath;  
    }  
  
    public function setClassName($classname)  
    {  
        $this->classname = $classname;  
    }  
  
    public function setID($id)  
    {  
        $this->id = $id;  
    }  
  
    public function getFilePath()  
    {  
        return $this->filepath;  
    }  
  
    public function getClassName()  
    {  
        return $this->classname;  
    }  
  
    public function getID()  
    {  
        return $this->id;  
    }  
  
}

?>
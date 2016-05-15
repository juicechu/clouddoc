<?php

include $_SERVER['DOCUMENT_ROOT'].'/controller/base.php';
require_once("qiniu/rs.php");


//input POST fname: fsize: ftype
//output { uptoken:  }
class qiniuuptoken extends Base
{
	public function post()
	{
		global $BUCKET;
		$mimetocmd = array(
			'video/x-ms-wmv' => 'vframe/jpg/offset/7/w/480/h/360', //wmv
			'video/x-msvideo' => 'avthumb/mp4/ab/160k/ar/48000/acodec/libfaac/r/30/vb/2200k/vcodec/libx264/s/1280x720/autoscale/1/stripmeta/0;vframe/jpg/offset/7/w/480/h/360', //avi
			'video/quicktime' => 'avthumb/mp4/ab/160k/ar/48000/acodec/libfaac/r/30/vb/2200k/vcodec/libx264/s/1280x720/autoscale/1/stripmeta/0;vframe/jpg/offset/7/w/480/h/360', //mov
			'application/msword' => 'odconv/pdf', //doc
			'application/vnd.ms-powerpoint' => 'odconv/pdf', //ppt
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'odconv/pdf', //docx
			'application/vnd.openxmlformats-officedocument.presentationml.presentation' => 'odconv/pdf', //pptx
		);

		//TODO the host is hard code
		$host = 'http://' . $_SERVER['HTTP_HOST'] . '/';
		$custome_callback_var = '&pid=$(x:pid)&cfname=$(x:cfname)';

		//post data
		$fname = $_POST['fname'];
		$fsize = $_POST['fsize'];
		$ftype = $_POST['ftype'];
		$putPolicy = new Qiniu_RS_PutPolicy($BUCKET);
		
		$putPolicy->CallbackUrl = $host . 'qiniucallback';
		$putPolicy->CallbackBody = 'key=$(key)&fname=$(fname)&fsize=$(fsize)&mimeType=$(mimeType)&persistentId=$(persistentId)&bucket=$(bucket)' . $custome_callback_var;
		if($mimetocmd[$ftype]){
			$putPolicy->PersistentOps = $mimetocmd[$ftype];
			$putPolicy->PersistentNotifyUrl = $host . 'qiniunotify';
			$putPolicy->PersistentPipeline = 'pchouqueue';//hardcode
		}

		$upToken = $putPolicy->Token(null);
		$resp = array("uptoken" => $upToken);
		$this->_Response->sendResponse(200,json_encode($resp),'application/json');
	}
}

?>
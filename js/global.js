define(['jquery'], function ($) {

    var Global = {
        Api: {
            _webApi_resources: '/resources?pid={pid}',
            _webApi_resourcesPost: '/resources',
            _webApi_qiniuupToken: '/qiniuuptoken',
            _webApi_qiniumkblk: 'http://up.qiniu.com/mkblk/',
            _webApi_qiniuup: 'http://up.qiniu.com/',
            _weiApi_qiniumkfile: 'http://up.qiniu.com/mkfile/'
        }
    }

    window.formatSize = function (sizeOfByte) {
        if (sizeOfByte < 1024) {//B
            return sizeOfByte + 'B';
        }
        else if (sizeOfByte >= 1024 && sizeOfByte < 1024 * 1024) {//KB
            return (sizeOfByte / 1024).toFixed(2) + 'KB';
        }
        else if (sizeOfByte >= 1024 * 1024 && sizeOfByte < 1024 * 1024 * 1024) {//MB
            return (sizeOfByte / (1024 * 1024)).toFixed(2) + 'MB';
        }
        else if (sizeOfByte >= 1024 * 1024 * 1024) {//GB
            return (sizeOfByte / (1024 * 1024 * 1024)).toFixed(2) + 'GB';
        }
    }

    window.formatSeconds = function(ts) {

        var format = function(_int){
            if(_int < 10){
                return '0' + parseInt(_int);
            }
            else{
                return parseInt(_int);
            }
        }

        var tempts = parseInt(ts);
        if(tempts < 60){
            return format(0) + ':' + format(0) + ':' + format(tempts);
        }
        else if(tempts < 3600){
            var m = Math.floor(tempts/60);
            return format(0) + ':' +  format(m) + ':' + format( tempts-m*60 );
        }
        else {
            var h = Math.floor(tempts/3600);
            var m = Math.floor((tempts-h*3600)/60);
            return format(h) + ':' +  format(m) + ':' + format( tempts-h*3600-m*60 );
        }
    }

    window.HTMLEnCodeNoBr = function(str){  
        var s = "";  
        if(!str || str.length == 0) return "";  
        s = str.replace(/&/g,"&amp;");  
        s = s.replace(/</g,"&lt;");  
        s = s.replace(/>/g,"&gt;");  
        s = s.replace(/ /g,"&nbsp;");  
        s = s.replace(/\'/g,"&#39;");  
        s = s.replace(/\"/g,"&quot;");  
        return s;  
    } 

    //(new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
    if (!(new Date).Format) {
      Date.prototype.Format = function (fmt) {
          var o = {
              "M+": this.getMonth() + 1,                 //月份 
              "d+": this.getDate(),                    //日 
              "h+": this.getHours(),                   //小时 
              "m+": this.getMinutes(),                 //分 
              "s+": this.getSeconds(),                 //秒 
              "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
              "S": this.getMilliseconds()             //毫秒 
          };
          if (/(y+)/.test(fmt))
              fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
          for (var k in o)
              if (new RegExp("(" + k + ")").test(fmt))
                  fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
          return fmt;
      }
    }

    //ajaxStart似乎只会调用一次
    //希望实现的效果是，加载时间超过1000ms后出现loading-mod
    $(document).ajaxStart(function (event,a,b) {
        _ajax_loading_flag = true;
        setTimeout(function () {
            if(_ajax_loading_flag){
                $('body').append('<div class="loading-mod"> \
                  <div class="spinner"> \
                    <div class="rect1">&nbsp;</div> \
                    <div class="rect2">&nbsp;</div> \
                    <div class="rect3">&nbsp;</div> \
                    <div class="rect4">&nbsp;</div> \
                    <div class="rect5">&nbsp;</div> \
                  </div> \
                </div>');    
            }
        }, 1000);
    });

    //对于API的请求，将没有替换的{xxx}参数忽略掉
    $(document).ajaxSend(function(evt, request, settings){
        settings.url = settings.url.replace(/\{[\w_\-\d]+\}/g,'');
    });

    //ajax完成后去掉loading-mod
	$(document).ajaxComplete(function(a,xhr,c) {
        _ajax_loading_flag = false;
        $('.loading-mod').remove();
	});
    
	return Global;
    
});

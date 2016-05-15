define(['jquery','underscore','backbone','app/global',
	'text!tmpl/uploader.html',
    'text!tmpl/upload_item.html',
    'text!tmpl/filepicker.html','jquery.fancybox'],
    function ($, _, Backbone, Global,UploaderHtml, UploadItemHtml , FilePickerHtml) {

        /** 基本资源类型 **/
    	//单个资源文件的模型，可能是文件夹或者是文件
        var ResourceModel = Backbone.Model.extend({
        	urlRoot: Global.Api._webApi_resourcesPost,

        	defaults:{
        		id:void 0,
        		mod_time: new Date(),
        		is_publish: null,
        		is_processing: null,
				type:0,
				file_size:void 0,
				thumb_url:void 0,
                status: 'normal', //normal, waiting, proccessing, failed, notify_failed, previewable
                status_desc: '',

				//view purpose for ResourceSelectView
				open :void 0
        	},

            initialize: function(){
                if(this.get('persistent_id') && this.get('is_processing') == 1){
                    $.ajax({
                        //dataType: 'jsonp',
                        //url : 'http://api.qiniu.com/status/get/prefop?id=' + this.get('persistent_id'),
                        url : '/qiniuprefop?pid=' + this.get('persistent_id'),
                        context: this,
                        success: this.changeStatus,
                        error: this.changeStatus
                    })
                }

                if(this.get('preview_url')){
                    this.set({ status : 'icon-ordinaryliulan',status_desc: '可预览'}, { silent: true }); 
                }

                //try to fix safari date
                //http://stackoverflow.com/questions/3085937/safari-js-cannot-parse-yyyy-mm-dd-date-format
                var d=this.get('mod_time');
                if(_.isString(d)){
                    this.set('mod_time',d.replace(/-/g, "/") , { silent: true }); 
                }
                
            },

            changeStatus: function(resp){
                if(resp.code == 0){
                    this.set({ status : 'normal',status_desc: ''});
                }
                else if(resp.code == 1){
                    this.set({ status : 'icon-kafei',status_desc: '等待转化'});
                }
                else if(resp.code == 2){
                    this.set({ status : 'icon-kafei',status_desc: '正在转化'});
                }
                else if(resp.code == 3){
                    this.set({ status : 'icon-chucuo',status_desc: '转化失败'});
                }
                else if(resp.code == 4){
                    this.set({ status : 'icon-jingshi',status_desc: '回调失败'});
                }
                else{
                    this.set({ status : 'icon-yiwen',status_desc: '未知状态'});
                }
            },

        	//check if file_name is empty
        	validate: function(){
        		return !this.get('file_name');
        	}
        })


        /******************** 预览开始 ********************/
		//使用时初始化model为ResourceModel对象，并指定el，el中的内容将被填充
		var ResourcePreivew = Backbone.View.extend({

			initialize: function(){
				//this.listenTo(this.model,'change',this.render);
			},

			imageRender:function(){
				var img = $('<img/>');
                img.attr('src', this.model.get('preview_url'));
                this.$el.append(img);
			},

			videoRender: function(){
                
				// this.$el.jwPlayer({
    //                 id:_.uniqueId('jwp_'),
    //                 swf: '/js/player.swf',
    //                 file: this.model.get('preview_url'),
    //                 image: this.model.get('thumb_url'),
    //                 height: 500,
    //                 width: 800,
    //                 provider:"http",
    //                 streamer:"start"
    //             });
                var video = $('<video class="video-js vjs-default-skin vjs-big-play-centered"><source src="' + this.model.get('preview_url') + '" type="video/mp4" /><p class="vjs-no-js">To view this video please enable JavaScript, and consider upgrading to a web browser that <a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a></p></video>');
                this.$el.append(video);
                videojs(video.get(0), {
                    controls: true,
                    preload: 'auto',
                    width: 640,
                    height: 264,
                    poster: this.model.get('thumb_url'),
                }, function() {

                });

			},

			pdfRender: function(){
				//this.$el.append('<iframe width="800px" height="600px" src="' + '/pdfjs/web/viewer.html?file=' +  encodeURIComponent(this.model.get('preview_url')) + '"></iframe>');
                this.$el.append('<iframe width="800px" height="600px" src="' +  this.model.get('preview_url') + '"></iframe>');
			},

			render: function(){
				var model_json = this.model.toJSON();
				//如果是类型不是文件的话
				if(!model_json.type || model_json.type == 0)
					return this;
				//如果没有preview_url，什么都不做
				if(!model_json.preview_url)
					return this;

				//reset
				this.$el.html('');
				this.$el.removeAttr('height');
				this.$el.removeAttr('width');

                var splited = model_json.preview_url.split('/'),ext=null;
                var lastpath = splited[splited.length-1];
                var dots = lastpath.split('.');
                if(dots && dots.length > 1) ext = dots[dots.length-1];
                if(ext) ext = ext.toUpperCase();

                if(ext == 'PDF' || (ext == null && (model_json.mediatype.indexOf('msword') > -1 || model_json.mediatype.indexOf('officedocument.word') > -1 || model_json.mediatype.indexOf('powerpoint') > -1 || model_json.mediatype.indexOf('officedocument.presentation') > -1))){
                    this.pdfRender();
                }
                else if(ext == 'FLV' || ext == 'MP4' || (ext == null && (model_json.mediatype.indexOf('video') > -1 || model_json.mediatype.indexOf('audio') > -1))){
                    this.videoRender();
                }
				if(ext == 'JPG' || ext == 'JPEG' || ext == 'GIF' || ext == 'PNG' || ext == 'BMP' || (ext == null && model_json.mediatype.indexOf('image') > -1 )){
					this.imageRender();
				}

				return this;
			}

		})

        /******************** 预览结束 ********************/

        /******************** 上传模块 开始 ************************/
		//每个正在上传或者上传成功的文件项
		var FileItem = Backbone.Model.extend({

			defaults:{
				id: void 0, //the id returned by server and indicate success
				name:void 0,
				size: 0,
				speed: 0,
				percent: 0,
				file_uuid: null,
				ctx:'',
				error: void 0
			},

			initialize: function(){
				this.on('change:error',this.clearStorage);
				this.uploader = this.get('uploader');//short up
			},

			//each file before upload will call this
			//and try to change the option here
			beforeUpload: function(up,file){
                var chunk_size = up.getOption && up.getOption('chunk_size'),_this=this;
                chunk_size = chunk_size || (up.settings && up.settings.chunk_size);

                var x_vars = up.getOption('x_vars');
                //添加cfname的自定义变量
                up.setOption('x_vars',$.extend(x_vars,{ cfname:file.name }));

                //获取token
                this.token = this.requestToken(up,file);

                if (up.runtime === 'html5' && chunk_size) {
                    if (file.size < chunk_size) {
                        _this.directUpload(up, file);
                    } else {

                        //check if the file has been upload partialy
                        //we store the partial info in html5 localStorage in order to get more space(5mb)
                        var blockSize = chunk_size;
                        _this.ctx = '';

                        if (window.localStorage) {
                           //file.name the the key for the partial info
                           var partial = window.localStorage.getItem(file.name);
                           if (partial) {
                               //parse the value into json ctxs array
                               var ctxs = $.parseJSON(partial);
                               //reset the  file loaded to ctxs.length * chunk_size
                               file.loaded = ctxs.length * chunk_size;
                               //re append the ctx str : ctx1,ctx2,ctx3
                               for (var i = 0; i < ctxs.length; i++) {
                                   _this.ctx = _this.ctx ? _this.ctx + ',' + ctxs[i].ctx : ctxs[i].ctx
                               }
                               //cal the rest blocksize
                               if (file.size - file.loaded < chunk_size) {
                                   blockSize = file.size - file.loaded;
                                   if(blocksize <= 0){
                                   		up.trigger('FileUploaded');
                                   }
                               }
                           }
                        }

                    	up.setOption({
                            'url': Global.Api._webApi_qiniumkblk + blockSize,
                            'multipart': false,
                            'chunk_size': chunk_size,
                            'headers': {
                               'Authorization': 'UpToken ' + _this.token
                            },
                            //'multipart_params': {}
                        });
                    }
                } else {
                    _this.directUpload(up, file);
                }

			},


			chunkUploaded: function(up,file,info){
                var res = $.parseJSON(info.response);
                //store the ctx in localstorage
                if (window.localStorage) {
                    var ctxs = [],partial = window.localStorage.getItem(file.name);
                    if (partial) {
                        ctxs = $.parseJSON(partial);
                    }
                    ctxs.push(res);
                    window.localStorage.setItem(file.name, JSON.stringify(ctxs));
                }
                //append this.ctx
                this.ctx = this.ctx ? this.ctx + ',' + res.ctx : res.ctx;

            	var leftSize = info.total - info.offset;
	            var chunk_size = up.getOption && up.getOption('chunk_size');
	            chunk_size = chunk_size || (up.settings && up.settings.chunk_size);
	            if (leftSize < chunk_size) {
	                up.setOption({
	                    'url': Global.Api._webApi_qiniumkblk + leftSize
	                });
	            }

			},

			fileUploaded: function(up,file,info){
				var res = $.parseJSON(info.response),_this = this,id=void 0;//fi.set('id',res.id);
				
                _this.ctx = _this.ctx ? _this.ctx : res.ctx;
                if (_this.ctx) {
                    var key = '';
                	key = '/key/' + _this.URLSafeBase64Encode(_this.getFileKey(file));
                    
                    var x_vars = up.getOption('x_vars'),
                        x_vars_url = '';
                    if (x_vars !== undefined && typeof x_vars === 'object') {
                        for (var x_key in x_vars) {
                            var x_value = _.result(x_vars,x_key);
                            if(!x_value) continue;
                            x_value = _this.URLSafeBase64Encode(x_value);
                            x_vars_url += '/x:' + x_key + '/' + x_value;
                        }
                    }

                    var url = Global.Api._weiApi_qiniumkfile + file.size + key + x_vars_url;
                    $.ajax({
	            		url: url,
	            		type:'POST',
	            		dataType: 'json',
	            		async: false,
	            		headers:{
	            			Authorization: 'UpToken ' + _this.token
	            		},
	            		data: _this.ctx,
	            		success: function(resp){
	            			id = resp.id;
	            		},
	            		error: function(XMLHttpRequest, textStatus, errorThrown){
	            			up.trigger('Error', {
                                status: textStatus,
                                response: XMLHttpRequest.responseText,
                                file: file,
                                code: -200
                            });
	            		}
	            	})

                    this.clearStorage();
                }
                else{
                	id = res.id;
                }

                this.set('id',id);
			},

			//this.token should be get before call this
			directUpload : function (up, file) {
				var multipart_params_obj = {
                    'key': this.getFileKey(file),
                    'token': this.token
                };
				
                var x_vars = up.getOption('x_vars');
                if (x_vars !== undefined && typeof x_vars === 'object') {
                    for (var x_key in x_vars) {
                        var x_value = _.result(x_vars,x_key);
                        if(!x_value) continue;
                        multipart_params_obj['x:' + x_key] = x_value;
                    }
                }

                up.setOption({
                	'url': Global.Api._webApi_qiniuup,
                    'multipart': true,
                    'chunk_size': undefined,
                    'multipart_params': multipart_params_obj
                });
            },

            requestToken : function (up,file) {
            	var token ='',url = Global.Api._webApi_qiniuupToken;
            	$.ajax({
            		url: url,
            		type:'POST',
            		dataType: 'json',
            		async: false,
            		data:{
            			fname: file.name,
            			fsize: file.size,
            			ftype: file.type
            		},
            		success: function(resp){
            			token = resp.uptoken
            		}
            	})
            	return token;
            },

            destroy: function(options){
            	if(this.uploader){
	            	this.clearStorage();
	            	this.uploader.removeFile(this.get('file_uuid'));
        			this.trigger('destroy', this, this.collection, options);
            	}
            },

            clearStorage:function(){
            	//clear the localStorage
            	if(this.uploader && window.localStorage){
            		var file = this.uploader.getFile(this.get('file_uuid'));
            		if(file){
            			window.localStorage.removeItem(file.name);
            		}
            	}
            },

            getFileExtension : function(filename) {
		        var tempArr = filename.split(".");
		        var ext;
		        if (tempArr.length === 1 || (tempArr[0] === "" && tempArr.length === 2)) {
		            ext = "";
		        } else {
		            ext = tempArr.pop().toLowerCase(); //get the extension and make it lower-case
		        }
		        return ext;
		    },

		    getFileKey: function(file){
		    	var ext = this.getFileExtension(file.name);
		    	return ext ? file.id + '.' + ext : file.id;
		    },

		    URLSafeBase64Encode : function(v) {
		        v = this.base64_encode(v);
		        return v.replace(/\//g, '_').replace(/\+/g, '-');
		    },

		    base64_encode : function(data) {
		        var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
		        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
		            ac = 0,
		            enc = '',
		            tmp_arr = [];

		        if (!data) {
		            return data;
		        }

		        data = this.utf8_encode(data + '');

		        do { // pack three octets into four hexets
		            o1 = data.charCodeAt(i++);
		            o2 = data.charCodeAt(i++);
		            o3 = data.charCodeAt(i++);

		            bits = o1 << 16 | o2 << 8 | o3;

		            h1 = bits >> 18 & 0x3f;
		            h2 = bits >> 12 & 0x3f;
		            h3 = bits >> 6 & 0x3f;
		            h4 = bits & 0x3f;

		            // use hexets to index into b64, and append result to encoded string
		            tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
		        } while (i < data.length);

		        enc = tmp_arr.join('');

		        switch (data.length % 3) {
		            case 1:
		                enc = enc.slice(0, -2) + '==';
		                break;
		            case 2:
		                enc = enc.slice(0, -1) + '=';
		                break;
		        }

		        return enc;
		    },

		    utf8_encode: function(argString) {
		        if (argString === null || typeof argString === 'undefined') {
		            return '';
		        }

		        var string = (argString + ''); // .replace(/\r\n/g, '\n').replace(/\r/g, '\n');
		        var utftext = '',
		            start, end, stringl = 0;

		        start = end = 0;
		        stringl = string.length;
		        for (var n = 0; n < stringl; n++) {
		            var c1 = string.charCodeAt(n);
		            var enc = null;

		            if (c1 < 128) {
		                end++;
		            } else if (c1 > 127 && c1 < 2048) {
		                enc = String.fromCharCode(
		                    (c1 >> 6) | 192, (c1 & 63) | 128
		                );
		            } else if (c1 & 0xF800 ^ 0xD800 > 0) {
		                enc = String.fromCharCode(
		                    (c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
		                );
		            } else { // surrogate pairs
		                if (c1 & 0xFC00 ^ 0xD800 > 0) {
		                    throw new RangeError('Unmatched trail surrogate at ' + n);
		                }
		                var c2 = string.charCodeAt(++n);
		                if (c2 & 0xFC00 ^ 0xDC00 > 0) {
		                    throw new RangeError('Unmatched lead surrogate at ' + (n - 1));
		                }
		                c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
		                enc = String.fromCharCode(
		                    (c1 >> 18) | 240, ((c1 >> 12) & 63) | 128, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
		                );
		            }
		            if (enc !== null) {
		                if (end > start) {
		                    utftext += string.slice(start, end);
		                }
		                utftext += enc;
		                start = end = n + 1;
		            }
		        }

		        if (end > start) {
		            utftext += string.slice(start, stringl);
		        }

		        return utftext;
		    }
		})

		//每个正在上传或者上传成功的文件项 视图
		var FileItemView = Backbone.View.extend({

			events:{
				'click .cancel-item': 'cancelItem'
			},

			tagName: 'div',

            className:'uploadarea-item',

			template:_.template(UploadItemHtml),

			initialize: function(){
				this.listenTo(this.model,'change',this.render);
			},

			cancelItem: function(){
				if(confirm("确定要取消上传吗")){
					this.model.destroy();	
				}
			},

			render: function(){

				this.$el.html(this.template(this.model.toJSON()));

				if(this.model.get('id')){
					this.$el.addClass('pass');
					this.$el.removeClass('normal');
					this.$el.removeClass('err');
				}
				else{
					if(this.model.get('error')){
						this.$el.addClass('err');
						this.$el.removeClass('normal');
						this.$el.removeClass('pass');
					}
					else{
						this.$el.addClass('normal');
						this.$el.removeClass('err');
						this.$el.removeClass('pass');
					}
					
				}

				return this;
			}
		})

		//文件项的集合类
		var FileItemCollection = Backbone.Collection.extend({
			model : FileItem
		})


		//文件项的集合类 视图
		var FileItemCollectionView = Backbone.View.extend({
			tagName: 'div',
			className: 'uploadarea-mod',

			initialize: function(){
				this.listenTo(this.collection, 'change',this.render );
				this.listenTo(this.collection, 'add',this.addOne );
				this.listenTo(this.collection, 'reset',this.render );
				this.listenTo(this.collection, 'remove',this.render );

				this.views = [];
			},

			addOne: function(fileitem){

				var fileitem_view = new FileItemView({ model : fileitem });
				this.$el.append(fileitem_view.render().$el);
				this.views.push(fileitem_view);
			},

	        clear: function(){
	        	this.collection.reset();
	        	this.$el.remove();
	        	_.each(this.views,function(view){
					view.remove();
				})

				this.views =[];

				return this;
	        },

			render: function(){

				var _this = this;
				_.each(this.views,function(view){
					view.remove();
				})

				this.views =[];

				this.collection.each(function(fileitem){
					_this.addOne(fileitem);
				})

				return this;
			}
		})

		//自定义事件finish
        //由于plupload绑定了browse_button控件，所以必须单例
		var UploaderView = Backbone.View.extend({

			el: '#BasePanel3',

			events:{
				'click a.close-link': 'cancel',
				'click .cancel': 'cancel',
				'click .ok': 'finish'
			},

			initialize: function(options){
				var _options =  _.extend({
					url: 'should_be_changed_later',
	                browse_button: 'pickfiles',       //上传选择的点选按钮，**必需**
	                runtimes: 'html5,flash,html4',    //上传模式,依次退化
	                max_file_size: '20mb',           //最大文件体积限制
	                flash_swf_url: 'js/plupload/Moxie.swf',  //引入flash,相对路径
	                max_retries: 0,                   //上传失败最大重试次数
	                dragdrop: true,                   //开启可拖曳上传
	                chunk_size: '4mb',                //分块上传时，每片的体积
	                drop_element: 'upload-list-box'
	            },
	            options);
				//初始化plupload对象
				this.uploader = new plupload.Uploader(_options);

				this.uploader.init();

				this.uploader.bind('FilesAdded', this.onFilesAdded,this);
				this.uploader.bind('UploadProgress', this.onUploadProgress,this);
				this.uploader.bind('BeforeUpload',this.onBeforeUpload,this);
				this.uploader.bind('ChunkUploaded', this.onChunkUploaded,this);
				this.uploader.bind('FileUploaded', this.onFileUploaded,this);
				this.uploader.bind('Error',this.onError,this);

				this.fileItems = new FileItemCollection();
				this.fileItemsView = new FileItemCollectionView({ collection : this.fileItems });
			},

			onUploadProgress: function(up, file){
				var fi = this.getFileItem(file);
				if(fi){
					fi.set({
						speed: up.total.bytesPerSec,
						percent: file.percent
					})
				}
			},

			onError: function(up, err, errTip){
				var fi = this.getFileItem(err.file);
				console.log(err);
				if(!fi){
					alert(err.message);
				}
				else{
					fi.set('error',errTip || 'error');
				}
			},

			onBeforeUpload: function(up,file){
				var fi = this.getFileItem(file);
				if(fi){
					fi.beforeUpload(up,file);
				}
			},

			onChunkUploaded: function (up, file, info) {
				var fi = this.getFileItem(file);
				if(fi){
					fi.chunkUploaded(up,file,info);
				}
			},

			onFileUploaded: function (up, file,info) {
				var fi = this.getFileItem(file);
				if(fi){
					fi.fileUploaded(up,file,info);
				}
			},

			onFilesAdded: function(up,files){
				var _this  = this;
				this.$el.find('.uploadarea-mod').addClass('active');//添加uploadarea-mod一个class，这样可以取消拖拽提示
				$.each(files, function (i, file) {
					var fileItem = new FileItem({ name: file.name, size: file.size, file_uuid: file.id,uploader: up });
					_this.fileItems.add(fileItem);
                    up.start();
                });
                up.refresh(); // Reposition Flash/Silverlight
			},

			//find fileItem model instance by file
			getFileItem: function(file){
				return this.fileItems.find(function(fileItem){
					return fileItem.get('file_uuid') == file.id;
				})
			},

			show: function(x_vars){
				if(x_vars){
					var _x_vars = this.uploader.getOption('x_vars');
            		this.uploader.setOption('x_vars', _.extend({},_x_vars, x_vars));
				}
				this.$el.show();
			},

			cancel: function(){
				if(this.uploader.state == plupload.STARTED){
					if(confirm("确定要取消上传吗")){
						this.uploader.stop();
						var temp = [];

						this.fileItems.each(function(fileItem){
							temp.push(fileItem);
						})

						_.each(temp,function(fileItem){
							fileItem.destroy();
						})

						this.$el.hide();
					}
				}
				else{
					this.$el.hide();
				}
			},

			finish: function(){
				if(this.uploader.state == plupload.STARTED){
					if(confirm("上传正在进行中确定要完成并结束上传吗")){
						this.uploader.stop();

						var temp = [];

						this.fileItems.each(function(fileItem){
							if(!fileItem.id){//如果不存在id，才表示没有上传完成
								temp.push(fileItem);
							}
						})

						_.each(temp,function(fileItem){
							fileItem.destroy();
						})

						this.$el.hide();
						this.trigger('finish');
					}
				}
				else{
					this.$el.hide();
				}

				this.trigger('finish');
			},

	  		render: function(){
	  			this.fileItemsView.clear();
                this.$el.find('.pop-box').css({
                    'width':'60%',
                    'margin-left':'-30%',
                    'top':'25%'
                }) ;
	  			this.$el.find('#upload-list-box').append(this.fileItemsView.render().$el);
	  			return this;
	  		}
		})

        /******************** 上传模块 结束 ************************/

		var _export =  {
			ResourceModel: ResourceModel,
			ResourcePreivew: ResourcePreivew,
			UploaderView: UploaderView
		}

		//inject UploaderHtml if not exsit
		if($('#BasePanel3').length < 1){
			$('body').append(UploaderHtml);
		}

        //inject filepicker html if not exsit
        if($('#BasePanel2').length < 1){
            $('body').append(FilePickerHtml);
        }

        if($('#previewDiv').length < 1){
            $('body').append('<div id="previewDiv"></div>');
        }
		return _export;

});
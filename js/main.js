requirejs.config({

	baseUrl: '/js/lib',

	paths: {
		'app': '../',
		'tmpl': '../tmpl'
	},

    shim: {
        'jquery': {
            exports: ['jQuery', '$']
        },

        'underscore': {
            exports: '_'
        },

        'backbone':{
            dep: ['jquery','underscore'],
        }
    }
});

require(['jquery','underscore','backbone','app/file','app/global'
	,'text!tmpl/index.html'
	,'text!tmpl/ritem_exist.html'
	,'text!tmpl/ritem_new.html'
	,'text!tmpl/ritem_rename.html'],function ($, _, Backbone, File,Global
		,Temple
		,RitemExist
		,RitemNew
		,RitemRename) {
        
        //用于文件夹选择时，互斥选中的效果
    	var temp = [];

        //单个资源文件的视图类，列表视图
        var ResourceItemView = Backbone.View.extend({

        	tagName: 'li',
        	events: {
        		'click input[type=checkbox]':'toggleCheck',
        		'click span.text': 'fileClick',
        		'blur input[type=text]':'unfocusInput',
        		'keydown input[type=text]':'enterInput',
        		'click': 'toggleCheck'
        	},

        	initialize: function(){
        		this.listenTo(this.model,'change',this.render);
        	},

        	new_template: _.template(RitemNew),
	       	rename_template: _.template(RitemRename),
        	exist_template: _.template(RitemExist),

        	toggleCheck: function(ev){
        		//可能是input什么的冒泡上来的
        		if(!$(ev.target).is('div')  && !$(ev.target).is('input[type=checkbox]') && !$(ev.target).is('li')){
        			ev.stopPropagation();
        			return;
        		}
        		if( this.model.get('id') ){
        			var checked = this.model.get('checked');
        			this.model.set('checked',!checked);
        		}
        		if($(ev.target).is('input[type=checkbox]')){
        			ev.stopPropagation();
        		}
        	},

        	//有两种情况
        	//1.新建文件夹
        	//2.重命名
        	unfocusInput: function(){

        		var _inputValue = this.$el.find('input[type=text]').val();
        		if( this.model.set('file_name',_inputValue,{ silent: true }) ){
    				if(this.model.get('renaming')){
    					var changed = this.model.changedAttributes();
    					if(changed){
    						//异步是为了不然render先触发，否则由于render中会重置html。会无限触发blur
    						this.model.save(changed,{ patch:true,async:false });
    					}
    					//取消renaming，后触发render
    					this.model.unset('renaming');
    				}
    				else{
    					//会产生POST，依赖于POST返回的id，并自动设置id，后触发render
    					this.model.save(null,{ async:false });
    				}
    				
    			}
        	},

        	enterInput: function(event){
        		if(event.keyCode==13){
        			this.unfocusInput();
        		}
        	},

        	fileClick: function(){

        		if( this.model.get('preview_url') ){
	        		if(!this.preiviewView){
	        			this.preiviewView = new File.ResourcePreivew({ model : this.model,el : '#previewDiv' });
	        		}
	        		$.fancybox(this.preiviewView.render().$el);
        		}
        	},

        	render: function(){

        		var data = this.model.toJSON();

        		if(!this.model.get('id')){
        			this.$el.html(this.new_template(data));
        			//this.$el.find('input').select(); 由于还没有渲染到界面，所以select不能用?
        		}
        		else if(this.model.get('renaming')){
        			this.$el.html(this.rename_template(data));
        		}
        		else{
        			this.$el.html(this.exist_template(data));
        		}
        		var checked = this.model.get('checked');
    			this.$el.toggleClass('active', checked ? checked : false);
                this.$el.find('input[type=checkbox]').attr('checked', checked ? checked : false);

        		return this;
        	}

        })


		//FolderSelect使用的视图类
		//侦听了Resource模型的change
		var ResourceSelectView = Backbone.View.extend({
			tagName: 'li',
			className: 'folder',

			events:{
				'click .node-ctn': 'collapse'
			},

			template: _.template('<% if(open) { %> \
					<span class="folder-img-open folder">&nbsp;</span> \
				<% } else { %> \
				 	<span class="folder-img-closed folder">&nbsp;</span> \
				 <% } %> \
				<div class="node-ctn"> \
				<% if(open) { %> \
					<span class="folder-icon-open">&nbsp;</span> \
				<% } else { %> \
				 	<span class="folder-icon-closed">&nbsp;</span> \
				 <% } %> \
				<span title="<%= HTMLEnCodeNoBr(file_name) %>"><%= HTMLEnCodeNoBr(file_name) %></span></div>'),

			initialize: function(){

				this.listenTo(this.model, 'change',this.render);

				//指示是否进行过加载
				this.fetched = false;

				temp.push(this);

				if(!this.model.children){
					this.model.children = new ResourceSelectCollection();
					this.model.children.setId(this.model.get('id'));
				}
				this.childrenView = new ResourceSelectCollectionView({ collection : this.model.children });
			},

			collapse: function(){
				var opened = this.model.get('open'),active = this.model.get('active');
				this.model.set('open',!opened || !active);
				//如果还没有加载过，则加载一下
				if(!opened && !this.fetched){
					this.model.children.fetch({ parse:true });
					this.fetched = true;
				}

				_.each(temp,function(rv){
					if(rv !== this){
						rv.setActive(false);
					}
				})

				this.setActive(true);
			},

			setActive: function(b){
				this.model.set('active',b);
			},

			render: function(){
				this.$el.empty();

				var opened = this.model.get('open'),active = this.model.get('active');
				this.$el.toggleClass('folder-open',opened ? true : false);
				this.$el.toggleClass('folder-closed',opened ? false : true);

				this.$el.html(this.template(this.model.toJSON()));

				this.$el.find('div.node-ctn').toggleClass('over',active ? true : false);

				var childrenEL = this.childrenView.render().$el;
				this.$el.append(childrenEL);
				childrenEL.css( 'display', opened ? 'block' : 'none' );

				return this;
			}
		})

		
		//侦听了集合的add和reset
		var ResourceSelectCollectionView = Backbone.View.extend({

			tagName : 'ul',
			attributes:{
				style : 'height: 300px;overflow:auto;' //bug fix
			},

			initialize: function(){
				this.listenTo(this.collection, 'add', this.addOne);
				this.listenTo(this.collection, 'reset', this.render);
				this.item_views = [];
			},

			addOne:function(resource){
				var item_view = new ResourceSelectView({ model : resource });
				temp.push(item_view);
				this.$el.append(item_view.render().$el);
				this.item_views.push(item_view);
			},

			render:function(){
				var _this = this;
				_.each(this.item_views,function(item_view){
					item_view.remove();
				})

				this.item_views=[];

				this.collection.each(function(resource){
					_this.addOne(resource);
				})

				return this;
			}
		})


		//资源文件的集合类，表征当前某个目录下的文件集合
		var ResourceCollection = Backbone.Collection.extend({
			model: File.ResourceModel,

			url: function(){
				return Global.Api._webApi_resources.replace('{uid}','').replace('{pid}', this._id ? this._id : '');	
			},

			setId: function(id){
				this._id = id;
			},


			additionalComparator : function(r1,r2){
				return new Date(r1.get('mod_time')).getTime() - new Date(r2.get('mod_time')).getTime();
			},

			//默认排序按照
			//dir=0小于file=1
			//时间顺序
			comparator: function(r1,r2){
				var dir_first = r1.get('type') - r2.get('type');
				if(dir_first != 0)
					return dir_first;
				if(_.isFunction(this.additionalComparator)){
					return this.additionalComparator(r1,r2);
				}
				else {
					var a = r1.get(this.additionalComparator);
					var b = r2.get(this.additionalComparator);
					if(a !== b){
		                if (a > b || a === void 0) return 1;
                		if (a < b || b === void 0) return -1;
					}
					else{
						return 0;
					}
				}
				
			}

		})

		//文件夹选择控件使用的资源列表类，继承自ResourceCollection，在其基础上增加了过滤函数
		var ResourceSelectCollection = ResourceCollection.extend({
			parse: function(resp){
				if(!_.isArray(resp)) return;
				return _.filter(resp,function(r){ return  r.type == 0 });
			}
		})

		//资源文件的集合视图类，表征当前某个目录下的文件集合
		var ResourceCollectionView = Backbone.View.extend({

			tagName: 'ul',
			className: 'cloud-ul',
			initialize: function(){
				this.listenTo(this.collection, 'add', this.render);
				this.listenTo(this.collection, 'reset', this.render);
				this.listenTo(this.collection, 'sort', this.render);
				this.listenTo(this.collection, 'remove', this.render);
				this.item_views = [];
			},

			addOne:function(resource){
				var item_view = new ResourceItemView({ model : resource });
				this.$el.append(item_view.render().$el);
				this.item_views.push(item_view);
			},

			render:function(){
				var _this = this;
				_.each(this.item_views,function(item_view){
					item_view.remove();
				})

				this.item_views = [];

				this.collection.each(function(resource){
					_this.addOne(resource);
				})

				return this;
			}

		})


		//路径地图堆栈
		var CrumbCollection = Backbone.Collection.extend({
			model: File.ResourceModel,

			popToId:function(id){
				while(this.last().get('id') != id){
					this.pop();
				}
			},

			//model only has id
			//need to fetch
			pushNew : function(model){
				var _this = this;
				_this.add(model,{silent:true,at:0});
				model.fetch();
				_this.listenToOnce(model,'sync',function(){
					if(model.get('parent_id')){
						_this.pushNew(new File.ResourceModel({ id: model.get('parent_id') }));
					}
					else{
						_this.add(new File.ResourceModel(),{silent:true,at:0});
						_this.trigger('change');
					}
				})
			},
		})

		var CrumbCollectionView = Backbone.View.extend({

			tagName: 'ul',
			className: 'breadcrumb-mod mb-10',

			initialize: function(){
				this.listenTo(this.collection , 'change',this.render);
				this.listenTo(this.collection , 'add',this.render);
				this.listenTo(this.collection , 'remove',this.render);
				this.listenTo(this.collection , 'reset',this.render);

			},

			render: function(){
                var _this = this,length = this.collection.models.length;
                this.$el.empty();
                //如果堆栈里面没有任何对象的话，直接返回
                if(length == 0)
                    return this;
                //如果只有一个元素的话，应该是根目录，即全部文件
                if(length == 1){
                    this.$el.append('<li title="全部文件">全部文件</li>');
                }
                //如果元素>1的话，需要显示返回上一级，和完整的crumb
                else if(length > 1){
                    //显示返回上一级
                    var back_id = this.collection.at(length-2).get('id');
                    this.$el.append('<li title="返回上一级"><a href="#/' + (back_id ? back_id : "" )+ '">返回上一级</a></li>');
                    //显示完整crumb
                    this.collection.each(function(resource,index){
                        if(index == 0){ //第一个应该是 '+ Global.Lang.file["全部文件"] + '
                            _this.$el.append('<li title="全部文件"><a href="#/">全部文件</a></li>');
                        }
                        else if(index < length-1){
                            _this.$el.append('<li title="' + HTMLEnCodeNoBr(resource.get('file_name')) + '"><a class="path-item" title="' + HTMLEnCodeNoBr(resource.get('file_name')) + '" style="max-width: 98%;" href="#/' + resource.get('id') + '">' + HTMLEnCodeNoBr(resource.get('file_name')) + '</a></li>');
                        }
                        else{ //last
                            _this.$el.append('<li title="' + HTMLEnCodeNoBr(resource.get('file_name')) + '"><span title="' + HTMLEnCodeNoBr(resource.get('file_name')) + '" style="max-width: 98%;">' + HTMLEnCodeNoBr(resource.get('file_name')) + '</span></li>');
                        }
                    })
                }

                return this;
            }

		})

		//toolbar需要侦听资源列表，当资源列表发生变化（即选中状态发生变化时），需要根据选中的情况变化控件的显示和隐藏
		var ToolbarView = Backbone.View.extend({
			el :'#toolbar',

			events:{
				'click #tbDel': 'remove',
				'click #tbNew': 'newFolder',
				'click #tbRename': 'remane',
				'click #tbDl': 'download',
				'click #tbMove': 'move',
				'click #tbUpload': 'upload',
				'change #tbSort': 'sort',
			},

			initialize: function(options){
				this.listenTo(this.collection,'change',this.render);
				this.listenTo(this.collection,'reset',this.render);
				this.router = options.router;
			},

			newFolder: function(){

				var parent_id = this.router.crumbs.last().get('id');
				var new_folder = new File.ResourceModel({ 
					file_name: 'New Folder',
					parent_id : parent_id
				});

				this.collection.add(new_folder,{ at: 0 });
			},

			remove: function(){
				alert('删除功能被禁用，请留言联系管理员'); return;
				if(!confirm("确实要删除所选的资源")) return;
				var checkeds = this.getCheckeds();
				var option = {
					wait:true//wait until server success
				}
				_.each(checkeds,function(checked){
					checked.destroy(option);
				})
			},

			remane: function(){
				var checkeds = this.getCheckeds();
				if(checkeds.length < 1) return;
				checkeds[0].set('renaming',true);
			},

			download: function(){
				var checkeds = this.getCheckeds();
				if(checkeds.length < 1) return;
				var download_url = checkeds[0].get('download_url');
				window.open(download_url);
			},

			move: function(){
				if(!this.router.folderSelector){
					this.router.folderResources = new ResourceSelectCollection();
					this.router.folderResourcesView = new ResourceSelectCollectionView({ collection: this.router.folderResources });
					this.router.folderSelector = new FolderSelectView({ view: this.router.folderResourcesView });
					this.router.folderSelector.render();
					this.listenTo(this.router.folderSelector,'submit',this.changeMove);
				}
				temp = [];
				//this.router.folderResources.fetch({ reset : true });
				this.router.folderResources.reset([{
					id:null,
					open :void 0,
					file_name: '/'
				}])
				this.router.folderSelector.show();
			},

			upload: function(){
				var _this = this;
				if(!this.router.uploader){
					this.router.uploader = new File.UploaderView();
					this.listenTo(this.router.uploader,'finish',function(){
					    _this.router.resources.fetch({ reset: true });
					});
				}
				this.router.uploader.render();
				this.router.uploader.show({
					pid : this.router.crumbs.last().get('id')
				});
			},

			changeMove: function(){

				var target = _.find(temp,function(t){ 
					return t.model.get('active');
				});
				if(!target) return;
				var pid = target.model.get('id');
				this.router.resources.each(function(resource){
					if(resource.get('checked')){
						resource.set('parent_id',pid);
						var changed = resource.changedAttributes();
						if(changed){
							resource.save(changed,{ patch:true, async: false });
						}
					}
				})

				this.router.resources.fetch({ reset : true });
				this.router.folderSelector.hide();
			},

			getCheckeds: function(){
				return this.collection.filter(function(resource){
					return resource.get('checked');
				});
			},

			sort: function(ev){

				this.collection.additionalComparator = $(ev.target).val();
				this.collection.sort();
			},

			//render实际不输出任何html
			//只是根据collection控制按钮
			render: function(){
				var checkeds = this.getCheckeds();

				//下载按钮只有在有一个文件选中的情况下才能显示
				this.$el.find('#tbDl').toggle(checkeds.length == 1 && checkeds[0].get('type') == 1);
				//删除按钮只有在一个或多个文件或文件夹选中的情况下才能显示
				this.$el.find('#tbDel').toggle(checkeds.length >= 1);
				//分享按钮只有在一个或多个文件或文件夹选中的情况下才能显示
				this.$el.find('#tbLink').toggle(checkeds.length >= 1);
				//重命名按钮只有在有一个文件或文件夹选中的情况下才能显示
				this.$el.find('#tbRename').toggle(checkeds.length == 1);
				//移动按钮只有在一个或多个文件或文件夹选中的情况下才能显示
				this.$el.find('#tbMove').toggle(checkeds.length >= 1);
			}

		})


		var HeaderView = Backbone.View.extend({
			el : '#listHeader',

			events:{
				'change input[type=checkbox]': 'checkAll'
			},

			initialize: function(){
				this.listenTo(this.collection,'reset',this.clearCheck);
			},

			clearCheck:function(){
				this.$el.find('input[type=checkbox]').attr('checked',false);
			},

			checkAll: function(ev){
				this.collection.each(function(r){
					r.set('checked',$(ev.target).is(':checked'));
				})
			}
		})

		var FolderSelectView = Backbone.View.extend({
			el: '#BasePanel4',

			events: {
				'click .close-link': 'hide',
				'click a.move': 'submit'
			},

			initialize: function(options){
				//options.view is instance of folderResourcesView
				this.view = options.view;
			},

			show: function(){
				this.$el.show();
			},

			hide: function(){
				this.$el.hide();
			},

			submit: function(){
				this.trigger('submit');
			},

			render: function(){
	  			// this.$el.css('left',(window.screen.width-this.$el.find('.hd').width() )/2) ;
	  			// this.$el.css('top',(window.screen.height-374 )/2);
                this.$el.find('.pop-box').css({
                    'width':'50%',
                    'margin-left':'-25%',
                    'top':'25%'
                }) ;
				this.$el.find('.tree-wrap').html(this.view.render().$el);
				return this;
			}
		})	

		var ResourceRouter = Backbone.Router.extend({
			
			routes: {
				'': 'Default',
				':id' : 'ById' 
			},

			initialize: function(){

				//load html
				$('.content-mod').html(_.template(Temple));

				//init crumbs
				this.crumbs = new CrumbCollection();
				this.crumbs_view = new CrumbCollectionView({ collection : this.crumbs });
				this.crumbs_view.render().$el.appendTo($('#crumb'));

				//init data
				this.resources = new ResourceCollection();
				this.resources_view = new ResourceCollectionView({ collection : this.resources });
				this.resources_view.render().$el.appendTo($('#listHolder'));

				//init toolbar view
				this.toolbar = new ToolbarView({ collection: this.resources , router: this });
				this.toolbar.render();

				new HeaderView({ collection: this.resources });

				//init folder selector in the toolbar ,trigger by tbMove
				//this.folderSelector
				//this.folderResources
				//this.folderResourcesView

			},

			Default: function(){
				this.resources.setId(void 0);
				this.resources.fetch({ reset : true });
				this.resources.sort();
				
				this.crumbs.reset();//重置crumb堆栈
				//init resourcemodel repsent the current folder
				this.crumbs.push(new File.ResourceModel());
			},

			ById: function(id){
				this.resources.setId(id);
				this.resources.fetch({ reset : true });
				this.resources.sort();

				var exist = this.crumbs.find(function(resource){ 
					return resource.get('id') == id;
				})
				if(exist){
					this.crumbs.popToId(id)
				}
				else{
					var crumb_resource = new File.ResourceModel({ id: id});
					//if size < 1 means user refresh the broswer directly
					//at this point the path should be re fetch instead of relying on stack
					if(this.crumbs.size() < 1){
						this.crumbs.pushNew(crumb_resource);
					}
					else{
						this.crumbs.push(crumb_resource); //normally push
						crumb_resource.fetch();
					}

				}
			}

		})

		new ResourceRouter();
		Backbone.history.start();

})
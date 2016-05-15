## 项目概述

本项目基于七牛云存储实现一个简单的在线云盘，请使用`chrome`浏览器测试。用户可以构建自己的目录结构，管理文件结构。上传、下载文件，对一些文档类的文件(DOC、PPT、DOCX、PPTX)可以在线查看，一些视频(AVI、WMV、MOV)经过转换后可以在线观看

[Demo地址](http://clouddoc.sinaapp.com/index.html)

## 技术概述

本项目采用如下技术实现：

1. 使用[七牛云](http://www.qiniu.com/)保存上传的文件。
2. 上传使用js完成，参考七牛云的[js-sdk](https://github.com/qiniupd/qiniu-js-sdk/)，使用[plupload](http://www.plupload.com/)上传组件。
3. 单页面应用，前端使用[require.js](http://requirejs.org/)、[Backbone.js](backbonejs.org)、jquery.js等，使用REST接口存取数据
4. 后端使用PHP+Mysql，实现REST接口。
5. Demo托管于[SAE](http://sae.sina.com.cn/)，代码托管于[GitCafe](https://gitcafe.com)。
6. 用到的七牛云服务包括：文件简单上传、大文件分片上传（支持断点续传）、视频编码转化和截图的预处理、文档转化的预处理、图片缩放。演示了使用七牛的callback和notify机制，并且在实现callback和notify时校验合法性。
7. 视频播放采用[videojs](http://www.videojs.com/)。
8. 文档统一使用七牛云转化成pdf，如需在线预览，请确保您的浏览器支持pdf。


## 截图

![](http://pchou.qiniudn.com/mutiupload.png)

![](http://pchou.qiniudn.com/newfolder.png)

![](http://pchou.qiniudn.com/videoplayer.png)

![](http://pchou.qiniudn.com/filemove.png)

![](http://pchou.qiniudn.com/docview.png)

## 开发者

[P_Chou](http://www.pchou.info)([Github](https://github.com/PChou))

[wang di](mailto:coldlern@163.com)

[鱼叉斯基](http://weibo.com/yuchav)

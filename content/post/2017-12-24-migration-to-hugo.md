---
title: 使用Hugo在GitHub Pages上搭建免费个人网站
date: 2017-12-26
categories:
- article
- programming
tags:
- technique
slug: personal site with hugo
autoThumbnailImage: false
#thumbnailImagePosition: left
#thumbnailImage: /images/2017-12-24/example.jpg
#coverImage: /images/2017-12-24/example.jpg
metaAlignment: center
draft: true
---

This article talks about how to use [Hugo](https://gohugo.io/) to build a personal website hosted on [Github Pages](https://pages.github.com/). It also introduces how to find a free custom domain name from [Freenom](http://www.freenom.com/) and migrated the DNS server to [CloudFlare](https://www.cloudflare.com/) in order to use HTTPs with chosen custom domain name on GitHub Pages.

本文讲述了如何使用[Hugo](https://gohugo.io/)将个人网页托管在[Github Pages](https://pages.github.com/)上。同时也介绍了如何在[Freenom](http://www.freenom.com/)上找到免费个人域名并利用[CloudFlare](https://www.cloudflare.com/)的免费DNS服务在Github Pages上以HTTPs协议加载个人域名。
<!--more-->

### 前言

最开始写博客始于2015年末，当时因为自制了几个单簧管演奏的视频，心想可以建一个简易的网站把录制背后的故事和想法集合起来。由于个人网站一般不需要太多交互，使用静态网页生成器并托管在Github Pages上成为了首选方案（能使用git实现版本控制更是个加分项）。彼时没想太多直接选了Github Pages原生支持的网页生成器Jekyll。随便搜了一个主题，第一版网站便这么建了起来：

在为期一年断断续续的更新中总计写下了十余篇音乐视频和程序算法相关的博客后，第一代模板差不多也看腻了，突然觉得是时候该把网站升级下。遂决定新的博客应更简洁规整，首页加入图片预览功能并减去不必要的视觉干扰，菜单栏里应有分类、标签和归档功能。一番搜寻后，目光落在Hugo。主要原因在于Hugo简单易用——不需要安装太多Hexo中的依赖库，更换主题也比Jekyll方便，生成速度还很快。以下便是我的配置过程。

### 安装Hugo

> 本文在macOS High Sierra环境下写成。Windows平台可参考官方文档做相应修改。

如果Mac上已经装上了Homebrew，在命令行中直接敲下面的命令安装：

```shell
brew install hugo
```

如果Mac上没有安装Homebrew，可以考虑先装Homebrew再按上述步骤安装Hugo；也可以在Hugo官网直接下载进行安装。

至此Hugo就安装完毕了。So easy.

### 在Hugo中写文章

硬盘中选取合适的存储位置，然后在命令行中使用如下命令生成网页本地文档：

```shell
hugo new personal-site
```

由此可生成如下文件目录：

```
personal-site
├── archetypes
├── config.toml
├── content
├── layouts
├── static
└── themes
```

各目录用处如下

|子目录名称|功能|
|---|---|
|archetypes|新文章模板|
|config.toml|Hugo配置文档|
|content|存放所有Markdown格式的文章|
|layouts|存放自定义的view，可为空|
|static|存放图像、CNAME、css、js等资源，发布后该目录下所有资源将处于网页根目录|
|themes|存放下载的主题|


使用下面的命令生成新的文章：

```shell
hugo new ??
```

为了预览网页效果，使用如下命令并在浏览器中输入网址`http://localhost:1313/`就可以在本地查看网页效果了。

```shell
hugo server -D
```

如果觉得没有问题了便可以使用如下命令将网页生成在默认的public子目录中：

```shell
hugo
```

### 配置Hugo主题

由于并没有加载任何主题，网站会显得非常单薄。为了增添些设计感，可以在[官方主题]页面选择自己喜欢的主题，然后下载到网站本地文档的themes子目录中(我选择的主题是[tranquilpeak](https://themes.gohugo.io/hugo-tranquilpeak-theme/))：

```shell
cd themes
git clone https://github.com/kakawait/hugo-tranquilpeak-theme.git
```

此时再点开网页`http://localhost:1313/`，可以发现新的主题已经加载上去了。

### 发布并托管到Github

上传到Github之前，先在Github中添加一个空白repository，注意不要添加如readme，gitignore等文档。

由此得到Github中repository的网址：`https://github.com/Nianze/personal-site.git`

复制该网址后，在本地网站根目录将初始化git：

```shell
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/Nianze/personal-site.git
git push -u origin master
```

至此所有源文档就都push到Github上了。然而此时Github对待这些源文档跟其他任何普通的repository中的代码并没有任何不同，从而也并不会将public子目录中的网页托管在Github Pages上。

参见[Hugo官方文档]()，有以下两种方式可以让Github识别出我们希望Github Pages加载我们想要托管的网页：

1. 将网页生成到docs子目录，然后直接push到master branch
2. 单独建立一个gh-pages branch并使用默认的publish子目录，分别push到Github上。

#### 发布到master branch

第一种方案的好处在于一次push即可将源文档和对应生成的网页文档都发布到Github，操作非常简单。所需要的仅是在config.toml中添加如下一行配置，使得生成的网页默认保存在docs子目录下：

```shell
public = docs
```

自此运行hugo后生成的网页文件将保存在docs子目录下。将所有文档push到Github后，在Github对应repository的settings标签菜单下，选择use docs:

![]()

等待片刻即可访问`http://your_name.github.io`看到之前用hugo生成的网页了。

#### 发布到gh-pages branch

如果希望单独控制源文档和生成的网页文件的版本，可以使用单独建立一个gh-pages branch的方法。首先在本地和Github端添加一个名为gh-pages的branch.

```shell

```

为了提高以后每次发布的效率，可以考虑在网站本地根目录中将下述命令存在一个脚本文件中，以后每次只需要运行该脚本即可将gh-pages branch中的文章发布到Github repository中：

```shell
#!/bin/sh

if [[ $(git status -s) ]]
then
    echo "The working directory is dirty. Please commit any pending changes."
    exit 1;
fi

echo "Deleting old publication"
rm -rf public
mkdir public
rm -rf .git/worktrees/public/

echo "Checking out gh-pages branch into public"
git worktree add -B gh-pages public origin/gh-pages

echo "Removing existing files"
rm -rf public/*

echo "Generating site"
hugo

echo "Updating gh-pages branch"
cd public && git add --all && git commit -m "Publishing to gh-pages (publish.sh)"

echo "Push to origin"
git push origin gh-pages

```

将源文档和网页文档分别push到Github对应branch后，和上述步骤类似，进入Github储存该网页的repository，选择settings标签菜单，然后选择use gh-pages branch选项：

![]()

同样等待片刻，即可访问`https://your_name.github.io`看到之前用hugo生成的网页了。

### 配置个人域名

如果觉得使用`your_name.github.io`不够酷炫，可以考虑使用自选的个人域名。好的个人域名自然是需要到对应服务商购买的。常见的服务商有Freenom, 阿里云， 。。。。常见的域名如`.com`, `.net`, `.me`一般都不免费但只要不是太珍贵的域名一般年费也不会太贵。由于我建立网站的初衷只是自娱自乐，所以暂时没有付费购买域名的意向，索性直接在[Freenom](http://www.freenom.com/)上找免费域名来用。目前Freenom平台提供的免费域名后缀为`.tk`, `.ml`等。购买域名很简单，先在[Freenom](http://www.freenom.com/)
网站上注册账号，然后查看自己想要的域名的价格并下单。考虑到现在machine leanring这么火，我就选了**nianze.ml**这个免费域名。

在Freenom的域名配置页面添加如下重定向规则：

1. 添加类型为A，名称为www，网址填Github Pages通用网址或者[your_name.github.io]网址，ttl默认
2. 添加类型为CNAME，名称为@，网址填[your_name.github.io]，ttl默认

其中，Github Pages通用网址是？？？或？？？，[your_name.github.io]网址可以在命令行中使用ping命令得到：

ping image

添加完毕后页面将如下图所示：

image

为了让DNS服务器确认对应的Github Pages网址，`personal-site/public`子目录中需要添加一个名为CNAME的文件，该文件只包含想要替换的个人域名，对我来说即是nianze.ml（不加http）。由于每次使用hugo
命令生成网页子目录的时候该CNAME文件都会被删除，所以最好将该文件放在`personal-site/static`子目录中，这样运行hugo后该CNAME文件将自动复制到public根目录中。

等待最多几个小时，在浏览器中访问`nianze.ml`就可以看到熟悉的个人网站页面了。

### 配置CloudFlare以使用HTTPs

之所以想要使用CloudFlare，是因为上一步当我们配置好个人域名后，由于Github Pages不支持在自定义域名中使用https协议，所以浏览器中访问nianze.ml时会发现使用的是http协议。这造成一个弊端：每回用Chrome打开nianze.ml，Chrome都提示该网页不受信任，如果网页根目录中有js script,需要单独点load js按钮才能正常加载全部页面。考虑到https协议的诸多优势——速度更快，访问更安全。。。显然应该想办法解决这个问题。

好在[CloudFlare](http://www.freenom.com/)为我们提供了这样一套方便的解决方案，而且是免费的！

首先点开CloudFlare注册账号，输入前面选好的个人域名（nianze.ml），CloudFlare会给我们提供众多服务套餐，选择免费的那个套餐进行如下配置：

首先，由于我们希望使用CloudFlare的DNS服务器，所以需要先在Freenom的域名管理页面中更改DNS服务商为CloudFlare：



在Page Rule页面配置：

在。。页面配置。。：

至此配置完毕。等待几小时，再次访问[nianze.ml]，可以看到网页已经在https协议下加载了。

### 参考文档

1. [Hugo Tranquilpeak Theme](https://themes.gohugo.io/hugo-tranquilpeak-theme/)
2. [Using HTTPs with Custom Domain Name](https://www.jonathan-petitcolas.com/2017/01/13/using-https-with-custom-domain-name-on-github-pages.html)
3. [Deploy Hugo to Github]
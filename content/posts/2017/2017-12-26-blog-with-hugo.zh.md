---
title: 使用Hugo在GitHub Pages上搭建免费个人网站
date: 2017-12-26
categories:
- coding
tags:
- technique
- hugo
- chinese
slug: personal site with hugo
autoThumbnailImage: false
thumbnailImagePosition: top
featured_image: 2017/2017-12-26/braid.png
coverImage: /images/2017/2017-12-26/braid.png
metaAlignment: center
---

This article talks about how to use [Hugo](https://gohugo.io/) to build a personal website hosted on [Github Pages](https://pages.github.com/). It also introduces how to find a free custom domain name from [Freenom](http://www.freenom.com/) and migrated the DNS server to [CloudFlare](https://www.cloudflare.com/) in order to use HTTPs with chosen custom domain name on GitHub Pages.  
本文讲述了如何使用[Hugo](https://gohugo.io/)将个人网页托管在[Github Pages](https://pages.github.com/)上。同时也介绍了如何在[Freenom](http://www.freenom.com/)上找到免费个人域名并利用[CloudFlare](https://www.cloudflare.com/)的免费DNS服务在Github Pages上以HTTPs协议加载个人域名。
<!--more-->
<!-- toc -->

# 前言

最开始写博客始于2015年末，当时因为自制了几个单簧管演奏的视频，心想可以建一个简易的网站把录制背后的故事和想法集合起来。由于个人网站一般不需要太多交互，使用静态网页生成器并托管在`Github Pages`上成为了首选方案（能使用git实现版本控制更是个加分项）。彼时没想太多直接用了`Github Pages`原生支持的网页生成器[Jekyll](https://jekyllrb.com/)。随便搜了一个主题，第一版网站便这么建了起来：

{{< img src="/images/2017/2017-12-26/old_blog1-1.png" thumbnail="/images/2017/2017-12-26/old_blog1-1.png" >}}
{{< img src="/images/2017/2017-12-26/old_blog2.png" thumbnail="/images/2017/2017-12-26/old_blog2.png" >}}
{{< img src="/images/2017/2017-12-26/old_blog1.png" thumbnail="/images/2017/2017-12-26/old_blog1.png" >}}

在为期一年断断续续的更新中总计写下了十余篇音乐和程序相关的（毫无营养的）文章后，第一代模板差不多也看腻了，突然觉得是时候该把网站升级下。遂决定新的博客应更简洁规整，首页加入图片预览功能并减去不必要的视觉干扰，菜单栏里应有分类、标签和归档功能。一番搜寻后，目光落在[Hugo](https://gohugo.io/)。主要原因在于`Hugo`简单易用——不需要安装太多[Hexo](https://hexo.io/)中的依赖库，更换主题也比`Jekyll`方便，生成速度还很快。以下便是我的配置过程。

# 安装Hugo

> 本文在macOS High Sierra环境下写成。Windows平台可参考官方文档做相应修改。

如果Mac上已经装上了[Homebrew](https://brew.sh/)，在命令行中直接敲下面的命令安装：

```shell
brew install hugo
```

如果Mac上没有安装`Homebrew`，可以考虑先装`Homebrew`再按上述步骤安装`Hugo`；也可以在[Hugo官网](https://github.com/gohugoio/hugo/releases)直接下载使用可运行文件。

至此Hugo就安装完毕了。So easy.

# 在Hugo中写文章

在硬盘中选取合适的存储路径，然后命令行中使用如下指令生成网页本地文档：

```shell
hugo new site personal-site
```

由此可得到如下文件目录：

```
personal-site
├── archetypes
├── config.toml
├── content
├── data
├── layouts
├── static
└── themes
```

常用目录用处如下

| 子目录名称  | 功能                                                                   |
| ----------- | ---------------------------------------------------------------------- |
| archetypes  | 新文章默认模板                                                         |
| config.toml | `Hugo`配置文档                                                         |
| content     | 存放所有`Markdown`格式的文章                                           |
| layouts     | 存放自定义的`view`，可为空                                             |
| static      | 存放图像、CNAME、css、js等资源，发布后该目录下所有资源将处于网页根目录 |
| themes      | 存放下载的主题                                                         |

使用下面的命令生成新的文章草稿：

```shell
hugo new posts/first-post.md
```

在content目录中会自动以`archetypes/default.md`为模板在`content/posts`目录下生成一篇名为`first-post.md`的文章草稿：

```
---
title: "First Post"
date: 2017-12-27T23:15:53-05:00
draft: true
---

```

我们可以加一个标题在下面并去掉标记为草稿的这一行：`draft: true`

```
---
title: "First Post"
date: 2017-12-27T23:15:53-05:00
---

## Hello world

```

然后随便下载一个主题并加载到`config.toml`文件中：

```shell
git init
git submodule add https://github.com/budparr/gohugo-theme-ananke.git themes/ananke

# Edit your config.toml configuration file
# and add the Ananke theme.
echo 'theme = "ananke"' >> config.tomlecho 'theme = "ananke"' >> config.toml
```

现在使用如下命令建立本地服务器：

```shell
hugo server
```

并在浏览器中输入网址`http://localhost:1313/`就可以在浏览器中查看网页效果了：

![local_page](/images/2017/2017-12-26/local_page.png)

如果觉得没有问题了便可以使用如下命令：

```shell
hugo
```

如此一来网页便生成在默认的public子目录中了。

# 发布并托管到Github

上传到Github之前，先在Github中添加一个空白repository，注意不要添加如`README`，`.gitignore`等文档。由此得到Github中该repository的网址：`https://github.com/Nianze/personal-site.git`

![new repo](/images/2017/2017-12-26/repo.png)

复制该网址后，在网站本地文档根目录中初始化git：

```shell
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/Nianze/personal-site.git
git push -u origin master
```

至此所有源文档就都push到Github上了。然而此时Github对待这些源文档跟其他任何普通的repository中的代码并没有任何不同，并不会将public子目录中的网页托管在`Github Pages`上。

参见[Hugo官方文档](https://gohugo.io/hosting-and-deployment/hosting-on-github/)，可以选择以下两种方式让`Github Pages`加载我们想要托管的`/public`子目录中的网页：

1. 配置`Hugo`将网页生成在名为`/docs`的子目录中，然后直接push到`master branch`
2. 仍然使用默认的`/public`子目录存储网页，再单独建立一个`gh-pages branch`

## 使用`/docs`发布到master branch

第一种方案的好处在于一次push即可将源文档和对应生成的网页文档都发布到Github，操作非常简单。所需要的仅是在config.toml中添加如下一行配置，使得生成的网页默认保存在`/docs`子目录下：

```shell
publishDir = docs
```

自此运行`hugo`命令后生成的网页文件将保存在`/docs`子目录下。将所有文档push到Github的`master branch`，进入Github对应repository的Settings标签菜单，在`GitHub Pages`选项的Source栏选择`master branch /docs folder`:

![docs](/images/2017/2017-12-26/docs_folder.png)

等待片刻即可访问`http://your_name.github.io`看到之前用`Hugo`生成的网页了。

## 发布到gh-pages branch

如果希望单独控制源文档和生成的网页文档的版本历史，可以使用单独建立一个`gh-pages branch`的方法托管到`Github Pages`——先将`/public`子目录添加到`.gitignore`中，让`master branch`忽略其更新，然后在本地和Github端添加一个名为`gh-pages`的branch：

```shell
//忽略public子目录
echo "public" >> .gitignore
//初始化gh-pages branch
git checkout --orphan gh-pages
git reset --hard
git commit --allow-empty -m "Initializing gh-pages branch"
git push origin gh-pages
git checkout master
```

为了提高每次发布的效率，可以将下述命令存在脚本中，每次只需要运行该脚本即可将`gh-pages branch`中的文章发布到Github的repo中：

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

最后将`master branch`中的源文档和`gh-pages branch`中的网页文档分别push到Github repo中，进入Settings标签菜单，选择`Github Pages`项中的Source栏，点`gh-pages branch`选项：

![gh-pages](/images/2017/2017-12-26/gh-pages.png)

同样等待片刻，即可访问`https://your_name.github.io`看到之前用`Hugo`生成的网页了。

# 配置个人域名

如果觉得使用`your_name.github.io`不够酷炫，还可以考虑使用自选的个人域名。好的个人域名自然是需要到对应服务商购买的。常见的域名如`.com`, `.net`, `.me`一般都不免费，但好在非顶级域名的年费其实也不贵。由于我建网的初衷只是自娱自乐，暂时并没有付费购买域名的意向，索性直接去[Freenom](http://www.freenom.com/)找了免费域名来用。目前Freenom平台提供的免费域名后缀为`.tk`, `.ml`,`ga`,`cf`,`gq`等。购买域名很简单，先在[Freenom](http://www.freenom.com/)
网站上注册账号，然后查看自己想要的域名的价格并根据提示下单即可。考虑到现在machine leanring这么火，我就选了`nianze.ml`这个免费域名。

域名买好后还需要设置下域名解析。由于默认使用的是Freenom的DNS服务器，所以需要在`Manage Domain`菜单中配置域名解析规则。在`Manage Freeenom DNS`选项中添加如下两条规则：

1. 添加A记录（即地址记录，用来指定域名的IP地址），主机记录（Name）栏填www，记录值(Target)那栏填Github服务器IP地址（或者`your_name.github.io`的IP地址）
2. 添加CNAME记录（用于将一个域名映射到另一个域名），主机记录栏填@，记录值那栏填`your_name.github.io`

其中，Github服务器IP地址是`192.30.252.153`和`192.30.252.154`，而`your_name.github.io`的IP地址可以在命令行中使用ping命令得到：

![ping](/images/2017/2017-12-26/ping.png)

最后还需要在`personal-site/public`子目录中需要添加一个名为CNAME的文档，该文件只包含想要替换的个人域名，对我来说即是nianze.ml（不加http）。由于每次使用`hugo`命令
在`/public`子目录生成网页的时候该CNAME文件都会被删除，所以最好将该文件放在`personal-site/static`子目录中，这样运行`hugo`后该CNAME文件将自动复制到`/public`目录中。

等待几小时，在浏览器中访问`nianze.ml`就可以看到熟悉的个人网站页面了。

# 配置CloudFlare以使用HTTPs

之所以想要使用[CloudFlare](https://www.cloudflare.com/)，是因为上一步当我们配置好个人域名后，由于`Github Pages`不支持在自定义域名中使用`HTTPs`协议，所以浏览器中访问`nianze.ml`使用的是`HTTP`协议。这造成一个弊端：每回用Chrome打开`nianze.ml`，浏览器都提示该网页不受信任，如果网页中还有待加载的`JavaScript`代码,就得单独点浏览器地址栏右侧的`load`按钮才能正常加载全部页面，非常麻烦。再加上考虑到`HTTPs`协议比`HTTP`更快更安全，显然应该想办法解决这个问题。

好在[CloudFlare](http://www.freenom.com/)为我们提供了一套方便的解决方案，而且是免费的！

首先点开`CloudFlare`注册账号，输入前面选好的个人域名`nianze.ml`，`CloudFlare`会给我们提供众多服务套餐，选择免费的那个套餐即可:)

此时`CloudFlare`会给我们提供其DNS服务器的IP，此时需要去`Freenom`的域名管理页面中更新默认DNS服务商到CloudFlare：

![dns_server](/images/2017/2017-12-26/dns_server.png)

更改完DNS服务器就可以设置`CloudFlare`中的各个选项了。首先在`Crypto`选项标签下，选择使用`Full SSL`模式以`HTTPs`协议加载网页：

![cf_ssl](/images/2017/2017-12-26/cf_ssl.png)

然后是`DNS`标签栏配置，跟`Freenom`设置类似：

![cf_dns](/images/2017/2017-12-26/cf_dns.png)

最后再设置下`Page Rules`标签：

![page_rules](/images/2017/2017-12-26/cf_page_rules.png)

至此配置完毕。其实`CloudFlare`中还有很多别的选项，可以根据个人喜好进行相应配置。等待几小时，再次访问`nianze.ml`，可以发现网页已经在`HTTPs`协议下加载了。这样以来就再也不用去点那个烦人的load按钮了。

# 后记

至此我的新版博客就迁移完毕了，基本满足我现在写文章、摄影和音乐的各项需求。下一步准备在摄影栏目中加上一个照片墙功能。

# 参考文档

1. [Hugo Tranquilpeak Theme](https://themes.gohugo.io/hugo-tranquilpeak-theme/)
2. [Using HTTPs with Custom Domain Name](https://www.jonathan-petitcolas.com/2017/01/13/using-https-with-custom-domain-name-on-github-pages.html)
3. [Deploy Hugo to Github](https://gohugo.io/hosting-and-deployment/hosting-on-github/)

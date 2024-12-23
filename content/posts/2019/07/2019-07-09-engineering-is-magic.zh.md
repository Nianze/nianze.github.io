---
title: "Engineering Is Magic"
date: 2019-07-09T12:56:29-04:00
categories:
- thoughts
tags:
- code
- generative art
- chinese
slug: engineering-is-magic
thumbnailImagePosition: right
featured_image: 2019/07/09/thumbnail/sicp.jpg
coverImage: /images/2019/07/09/sicp.jpg
metaAlignment: center
---

>Or at least the closest thing to magic that exists in the real world[^1].
<!--more-->

Code is the spell. Computer is the wand. Use the magic to create fun stuff might be one of the most exciting things in this age. Starting each day with a creative spell might be a good ritual to become a good magician.

最近稍稍了解了下[generative art](https://www.artnome.com/news/2018/8/8/generative-art-finds-its-prodigy)，感觉很适合加入到weekly project中：不妨先用[processing](https://processing.org/)或者[P5.js](http://p5js.org/)做原型设计，遇到性能/实时性要求高的成品可以用[cinder](https://libcinder.org/)或[openframeworks](https://openframeworks.cc/)来进一步实现。

说起来大二的时候就有了解过processing，彼时还在参加电子设计竞赛，玩TI的[MSP430](https://www.ti.com/microcontrollers/msp430-ultra-low-power-mcus/overview.html)；后来注意力被[Kinect](https://youtu.be/Y7ey0uSVP0o)吸引，伙同MangoSister和Sirius参加了微软的[Imagine Cup](/images/2019/07/09/demo.jpg)和创客大赛，先后去了济南，上海和北京参赛，最后以混进人民大会堂领了个事后证明无关轻重的[奖](/images/2019/07/09/chuangke.jpg)收尾。现在想来还真是够折腾，曾差点因为比赛行程耽搁了提交实验室的[论文](http://pubs.rsc.org/en/content/articlelanding/2015/nr/c4nr06883a#!divAbstract)，间接影响了之后GRE备考以及出国申请的时间线。

唯一的遗憾，是因为怕时间冲突没去微软亚研院实习——暑假的南京，傍晚的暖风吹来，我从四牌楼的显示技术研究中心实验室走出来，感到有些闷热。想着今晚是吃沙塘园还是香园的食堂，又或者去马路对面的沙县小吃匆匆果腹晚上继续做实验时，那通毫无预兆的电话打来，而搞不清状况的我以大四开学提交论文备考GRE有可能没时间去北京实习为由，草草拒绝了这offer。

图样。

那是2014年的夏天(也不记得，那晚最后去哪家吃的饭)。五年后的今天，地球的另一端，我在纽约东村的一隅，解决了养活自己的问题，即将回归校园，开始寻思目的的时候，回想起当年的往事，突然有点“浪子回头”的意味。就想到木心先生的话：

>什么是目的？太难说——黑格尔、笛卡尔建立方法论，马克思太重方法——为什么目的难说？  
因为宇宙是无目的。  
...  
宗教是什么？就因为宇宙无目的，方法论无目的，也是架空。宗教是想在无目的的宇宙中，虚构一目的。此即宗教。  
哲学家是怀疑者、追求者。科学家解释，分析，过程中有所怀疑者，则兼具哲学家气质了。或曰，这样的科学家是有宗教信仰的，为宗教服务的。西方大科学家不满于老是追求科学，总想进入哲学、宗教，进进退退，很有趣。  
艺术家可以做哲学家、宗教家、科学家不能做的事。艺术家是浪子。宗教太沉闷，科学太枯燥，艺术家是水淋淋的浪子。他自设目的，自成方法。以宗教设计目的，借哲学架构方法。  
然而这不是浪子回头，而是先有家，住腻了，浪出来，带足哲学、宗教的家产，浪出来。  
不能太早做浪子，要在宗教、哲学里泡一泡。  
  
不敢说我“住腻了”，毕竟在哲学和宗教的领域，我门都还没进。不过这一出一进，重返校园，心态是不同的。不敢说清楚了自己想要的是什么，只是更明白自己不想要的是什么，从而不那么容易分心。

科技日新月异，人心亘古难变。相通的那部分，离永恒更近一些。我想以“美”的名义为之命名，算作当下的目的。音乐，摄影，绘画，都是很好的媒介。生成艺术（generative art）可以看作以代码作笔刷的绘画。

提起美，不得不提生成艺术领域里结合AI作画的新分支。[Tweeter](https://twitter.com/js_horne/status/1032038186858426374)上很多人看了这类作品会觉得“creepy”，不太符合传统和谐的“美”感，但确实具有随机的趣味性。我感觉比起[传统](https://vimeo.com/22955812)的generative art从无到有按照某些规则生成图像，AI作画倒更像摄影：创作者掌控取景的自由度，可以调整“相机”的参数，最后成像的过程交由“相机”来完成。不同的是，AI作画过程中生成网络这台“相机”具有更多的参数，同时因为学习对象的不同会引入某种程度的“不可控性”，从而产生趣味性；但如果只利用别人训练好的网络去创作，很多时候就沦为“调参侠”，创作者的自由度局限在学习图片/测试图片的选取和模型参数的调整中，根据生成结果再反回去调整参数的选取，在无数次尝试后炼出一套精致的风格迁移滤镜,有些“炼丹师”般的试验性质。但滤镜毕竟只是滤镜，画风再怎么迁移，依然需要有滤镜下的初始图像作为素材，有时甚至会带来作品归属权的问题[^2]。这个角度看，如果摄影是捕捉决定性瞬间的艺术，那么AI作画倒有点像“炼丹的艺术”。目前来看，它可以很好的作为一种试验性质的画面风格变换/融合手段，并引入一些额外的随机性增添趣味，从而增强作品的表现力。新的发展方向，依赖于深刻理解机器学习有能力训练出原创新网络的“相机制造者”的进一步探索。

>As AI technology becomes increasingly available, artistry and technical advancement will only become more important in separating the remarkable AI artists from those repurposing old tools built by others or simply pushing a button to achieve an overused visual paradigm.[^3]

# Substrate

Anyway，着手AI之前，我先小试了下p5.js，复现了Jared Tarbell在2003年的作品[Substrate](http://www.complexification.net/gallery/machines/substrate/)。将动态生成的过程迁移到浏览器以方便传播，效果还是很不错的。

<div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.7.1/p5.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.7.1/addons/p5.dom.min.js"></script>
    <script src="/js/p5js-projects/substrate.js"></script>
</div>
<div id="canvasParent"></div>

期待有一天能做出类似[Greatness](https://vimeo.com/155733402)这样的作品来，再配合自己作的曲子就更完美了。

[^1]: [Twitter by Elon Musk](https://twitter.com/elonmusk/status/1012784447005995008?lang=en).
[^2]: [Sollfrank’s Warhol Flowers](https://www.artnome.com/news/2019/4/17/giving-generative-art-its-due)
[^3]: [why love generative art](https://www.artnome.com/news/2018/8/8/why-love-generative-art).
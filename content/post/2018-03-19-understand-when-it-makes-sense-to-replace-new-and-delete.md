---
title: "Item-50 Understand when it makes sense to replace new and delete"
date: 2018-03-19T10:54:04-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: understand when it makes sense to replace new and delete
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-19.gif
---

There are many valid reasons for writing custom versions of `new` and `delete`, including improving performance, debugging heap usage errors, and collecting heap usage information.
<!--more-->

There are three most common reasons to replace the compiler-provided versions of `operator new` and `operator delete`:

1. **To detect usage errors**:
    * By having `operator new` keep a list of allocated addresses and `operator delete` remove addresses from the list, it's easy to detect usage errors such as memory leaks (fail to `delete` memory conjured up by `new`) or over-`delete`(using more than one `delete` on `new`ed memory)
    * By customizing `operator new` to overallocate blocks so there's room to put known byte patterns ("signatures) before and after the memory made avaiblable to clients, `operator delete`s can check to see if the signatures are still intact, so that the abnormal pattern resulted from overrun (writing beyond the end of an allocated block) or underrun (writing prior to the begining of an allocated block) could be logged down, along with the value of the offending pointer.
2. **To improve efficiency**:
    * The `operator new`s and `operator delete`s that ship with compilers are designed for general-purpose use, which means they work reasonably well for everybody, but optimally for nobody. For some applications, replacing the stock `new` and `delete` with custom versions is an easy way to pick up significant performance improvements in terms of both speed (sometimes orders of magnitude faster) and memory (up to 50% less).
3. **To collect usage statistics**:
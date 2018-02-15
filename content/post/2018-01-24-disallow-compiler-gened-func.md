---
title: "Item-6 Disallow unwanted compiler-generated functions"
date: 2018-01-24T16:18:59-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: functions silently created
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-01/2018-01-24.jpg
---

Declare unwanted member functions _private_ without implementations to disallow functionality automatically provided by compilers.
<!--more-->

If we want to prevent functions such as copy constructor being generated in order to maintain the object uniqueness, explicitly declare the copy constructor and the copy assignment operator _private_, so that the client of the class will not be able to copy the object.

To make it foolproof, declare member functions _private_ and deliberately not implemente them so that member and friend functions will not be able to copy the object, either.

Another possible solution to prevent copying is to inherit from a well-designed base class such as this:

```cpp
class Uncopyable {
protected:
    Uncopyable() {}    // allow construction of derived objects
    ~Uncopyable() {}   // allow destruction of derived objects
private:
    Uncopyable(const Uncopyable&);            // prevent copying
    Uncopyable& operator=(const Uncopyable&); // prevent copying
};
```

To inherit from the base class, simply:

```cpp
class HomeForSale: private Uncopyable {
... // no copy ctor or copy assign. operator declaration
};
```

This will be the same effect as the following design:

```cpp
class HomeForSale{
public:
...
private:
...
HomeForSale(const HomeForSale&);
HomeForSale& operator=(const HomeForSale&);
};
```

There are some subtleties about the implementation and use of `Uncopyable`:  

1. inheritance from `Uncopyable` needn't be public (item 32 and 39)
2. `Uncopyable` destructor needn't be _virtual_ (item 7: the base class is not designed to be used polymorphically)
3. it's eligible for the empty bass class optimization described in item 39, but use of this technique could lead to multiple inheritance (item 40), which will sometimes in turn disable the empty base class optimization (item 39)
4. Boost (item 55) provides a similar class named `noncopyable`
---
title: "Item-13 Use objects to manage resources"
date: 2018-02-01T18:20:10-05:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: use objects to manage resources
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-02/2018-02-01.jpg
---

Use RAII objects such as `tr1::shared_ptr` and `auto_ptr` to prevent resource leaks.
<!--more-->
<!-- toc -->

First of all, let's make clear the concept: a resource is something that we need to return to the system once we're done using it, such as dynamically allocated memory, file descriptors, mutex locks, fonts and brushes in graphical user interfaces (GUIs), database connections, and network sockets.

The motivation of using objects to manage resources is that, it is hard to write manually managed code to deal with complex control flow where necessary resource handling operation such as `delete` may have to be skipped due to premature `continue` statement or unexpected exception, ending up with resource leak.

On the other hand, by putting resources inside objects, we can rely on C++'s automatic destructor invocation to make sure that the resources are released properly. Luckily, there're two kinds of _smart pointer_ that is ideal for this kind of situation:

1. `std::auto_ptr`: destructor automatically calls `delete` on what it points to when the `auto_ptr` is destroyed. There's only one `auto_ptr` pointing to the underlying resoures each time
2. `std::tr1::shared_ptr`: is a `reference-counting smart pointer (RCSP)`. Similar to garbage collection but can't break cycles of references (e.g.: two otherwise unused objects pointing to one another).

# 1. `auto_ptr`

We can use `auto_ptr` to manage a class `Investment` that comes with a factory function (item 7) without worrying about resource leak:

```cpp
Investment* createInvestment();  // factory function, return ptr to dynamically allocated object

void f() 
{
    std::auto_ptr<Investment> pInv(createInvestment()); // call factory function
    ...  // use pInv like a pointer
}        // automatically delete pInv via auto_ptr's dtor
```

There are two critical aspects worth noting:

1. Resources are acquired and immediately turned over to resource-managing objects. It is a common trick to acquire a resource and initialize a resource-managing object in the same statement, which is called _Resource Acquisition Is Initialization (**RAII**)_.
2. Resource-managing objects use their destructors to ensure that resources are released. Things could be tricky when the act of releasing resources can lead to exceptions being thrown, which is the matter addressed in Item 8.

Pay attention to the limitation of `auto_ptr`: its **sole ownership of the resource policy** requires that copying `auto_ptr`s via copy constructor or copy assignment operator sets them to null:

```cpp
std::auto_ptr<Investment> pInv1(createInvestment()); // pInv1 points to the object returned from the factory function

std::auto_ptr<Investment> pInv2(pInv1);  // pInv2 now points to the object; pInv1 is null 

pInv1 = pInv2;  // pInv1 points to the object, and pInv2 is null now
```

# 2. `shared_ptr`

An alternative **RAII** object, `shared_ptr`, is an RCSP(reference-counting smart pointer), which is a smart pointer that keeps track of how many objects point to a particular resource and automatically deletes  the resource when nobody is pointing to it any longer. The code above is almost the same as with `shared_ptr`, but copying behavior is much more natural:

```cpp
void f()
{
    std::tr1::shared_ptr<Investment> pInv(createInvestment()); // call factory function
    ...  // use pInv as before

    std::tr1::shared_ptr<Investment> pInv1(createInvestment()); // pInv1 points to the object returned from createInvestment

    std::tr1::shared_ptr<Investment> pInv2(pInv1); // both pInv1 and pInv2 now point to the object

    pInv1 = pInv2;  // nothing has changed

}        // automatically delete pInv via shared_ptr's dtor
```

There is more information on `tr1::shared_ptr` in item 14, item 18, and item 54. For now, another point worth noting is that, since both `auto_ptr` and `tr1::shared_ptr` use `delete` in their destructors rather than `delete []` (item 16), it is a bad idea to wrap dynamically allocated arrays with `auto_ptr` or `tr1::shared_ptr`:

```cpp
std::auto_ptr<std::string> pStr(new std::string[10]); // wrong delete form will be used, bad idea!

std::tr1::shared_ptr<int> pInt(new int[1024]); // same problem
```

Since having `createInvestment` returning a raw pointer type is error-prone, we'll see in item 18 that an interface modification is preferred.

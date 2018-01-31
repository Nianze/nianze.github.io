---
title: "Item-11 Handle self assignment in operator="
date: 2018-01-30T18:34:01-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: handle self assignment
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018-01-30.png
---

Solve self assignment situation in operator= by comparing addresses of source and target objects, careful statement ordering, and copy-and-`swap`.
<!--more-->

When operator= applies on more than one object, two or more of the objects may be the same:

```cpp
a[i] = a[j]  // potential assignment to self
*px = *py;   // potential assignment to self
```

This is the result of _aliasing_ (having more than one way to refer to an object). In general, operations on references or pointers to multiple objects of the same type (or objects of different types derived from the same base class) need to consider that the objects might be the same.

When trying to manage resources manually rather than to take advantage of resource-managing objects (item 13, item 14), it is possible to accidentally release a resource before being done using it:

```cpp
class Bitmap{...};
class Widget{
    ...
private:
    Bitmap *pb;  // ptr to a heap-allocated object
};

Widget&
Widget::operator=(const Widget& rhs)  // unsafe impl. of operator=
{
    delete pb;                // stop using cur. bitmap
    pb = new Bitmap(*rhs.pb); // start using a copy of rhs's bitmap
    return *this;             // item 10
}
```

When `*this` (the target of the assignment) and `rhs` (the source of the assignment) are the same object, `delete` destroys both of them in the begining, resulting to the fact that `this` points to a deleted object instead of being unchanged by the assignment to self. Moreover, besides self-assignment-unsafe, this implementation of operator= is also exception-unsafe.

There are three possible ways to solve the problem:

1. Identity test at the top (solve self-assignment-unsafe)
2. A careful ordering of statements (solve both self-assignment-unsafe and exception-unsafe)
3. Copy and swap. (solve both potential unsafe situation)

#### 1. Identity test

```cpp
Widget& Widget::operator=(const Widget& rhs)
{
    if (this == &rhs) return *this; // test: if a self-assignment, do nothing
    delete pb;
    pb = new Bitmap(*rhs.pb);
    return *this;
}
```

The problem here is that once the `new Bitmap` expression yields an exception (due to insufficient memory or `Bitmap`'s copy constructor throwing one), `this` will end up refer to a deleted `Bitmap`, which is toxic for there's no way to safely delete them or even safely read them.

#### 2. Careful reorder

```cpp
Widget& Widget::operator=(const Widget& rhs)
{
    Bitmap *pOrig = pb;  // remember original pb
    pb = new Bitmap(*rhs.pb); // point pb to a copy of rhs' bitmap
    delete pOrig;  // delete the original pb
    return *this;
}
```

Under this implementation, even it `new Bitmap` throws an exception, `pb` and `this` remain unchanged. Moreover, it does work even without the identity test.

Considering efficiency, it may be sensible to put the identity test back at the top. However, considering the frequency of self-assignment situation as well as the longer codes and more branches in the flow of control, it may actually decrease runtime speed (at least the effectiveness of instruction prefetching, caching, and pipelining can be reduced).

#### 3. Copy and swap

This is an alternative way to the above careful reordering technique, which is closely associated with exception safety (item 29).

```cpp
class Widget {
    ...
    void swap(Widget& rhs); // exchange *this's and rhs's data; see item 29 for details
};

Widget& Widget::operator=(const Widget& rhs)
{
    Widget temp(rhs);   // make a copy
    swap(temp);         // swap *this's data with the copy's
    return *this;
}
```
A variation taking advantage of the fact that passing by value makes a copy of it (item 20):

```cpp
Widget& Widget::operator=(Widget rhs)  // pass by value, rhs is a copy of the object passed in
{
    swap(rhs);         // swap *this's data with the copy's
    return *this;
}
```

This variation sacrifices the clarity but may let compilers generate more efficient code by moving the copying operation from the body of the function to construction of the parameter.
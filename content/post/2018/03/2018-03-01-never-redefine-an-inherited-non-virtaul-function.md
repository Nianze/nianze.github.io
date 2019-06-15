---
title: "Item-36 Never redefine an inherited non-virtaul function"
date: 2018-03-01T20:22:17-05:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Never redefine an inherited non-virtaul function
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-01.gif
---

A generalized basic rule from item 7.
<!--more-->

Suppose we have an inheritance hierarchy defined like this:

```cpp
class B {
public:
    void mf();
    ...
};

class D: public B {
public: 
    void mf();  // hide B::mf
    ...
};
```

According to item 33, this will lead to following behavior:

```cp
D x;  // x is an object of type D
B *pB = &x;  // get pointer to x
D *pD = &x;  // get pointer to x

pB->mf();  // calls B::mf
pD->mf();  // calls D::mf
```

The reason for this two-faced behavior if that non-virtual functions like `B::mf` and `D::mf` are statically bound (item 37), which means that non-virtual functions invoked through pB will _always_ be those defined for class B, even if pB points to an object of a class derived from `B`. This mismatched behavior exhibits inconsistent behavior, since any given D object may act like either a B or a D (depending on the pointer type) when `mf` is called.

On the other hand, virtual functions are dynamically bound (item 37), so if `mf` were a virtual function, a call to `mf` through either pB or pD would result in an invocation of `D::mf`, because pB and pD _really_ point to is an object of type D.

Worse than the inconsistent behavior problem in the real world, the example above basically shows a contradiction in class design, theoretically:

* public inheritance means is-a (item 32), so everything that applies to B object also applies to D object
* a non-virtual function in the base class establishes an invariant over specialization that classes derived from `B` must inherit both the interface _and_ the implementation (item 34), and `mf` is such an non-virtual function in `B`

As long as we redefine the `mf`, an inherited non-virtual function, one of the conditions above will break, leading to two solutions: either make the `mf` virtual, or change the class relationship from 'is-a' to something else.

In fact, this is exactly the same argument in item 7, which exlains why destructors in polymophic base classes should be virtual. In essence, item 7 is nothing more than a special case of this item.

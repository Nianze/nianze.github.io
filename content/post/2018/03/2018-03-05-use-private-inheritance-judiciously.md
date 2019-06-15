---
title: "Item-39 Use private inheritance judiciously"
date: 2018-03-05T18:42:43-05:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: use private inheritance judiciously
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-05.gif
---

Private inheritance means is-implemented-in-terms-of. It is usually inferior to composition, but it makes sense when a derived class needs access to protected base members or needs to redefine inherited virtual functions. For library developers who strive to minimize object sizes, it also offers the ability of empty base optimization.
<!--more-->

The behavior of private inheritance is that

* Compilers will generally _not_ convert a derived class object into a base class object
* members inherited from a private base class (protected or public ones) become private members of the derived class

With such behaviors, private inheritance means is-implemented-in-terms-of. Thus, private-inherited derived class D has no conceptual relationship with the base class B - private inheritance is purely an implementation technique in the _implementation domain_. Using the terms introduced in item 34:

>private inheritance means to ignore interface, and **only** inherit implementation.

Compared to the composition, which also has the meaning of "is-implemented-in-terms-of", the preference is simple:

>use composition whenever we can, and use private inheritance whenever we must.

When must we? 

* Primarily when we need to inherit protected members and/or virtual functions 
* Sometimes when we want to take advance of empty base optimization (which is the edge case)

## Typical usage

Let's see a typical usecase for private inheritance. Suppose we want to periodically examine the the internal status of class `Widget`, and we'd like to reuse the following utility class:

```cpp
class Timer {
public:
    explicit Timer(int tickFrequency);
    virtual void onTick() const;  // automatically called for each tick
    ...
};
```

A `Timer` object can be configured to tick with whatever frequency we need, and on each tick, it calls a virtual function, which we can redefine so that it examines the current state of the `Widget` object. In order to redefine a virtual function, `Widget` must inherit from `Timer`. But public inheritance is inappropriate in this case: it's not true that a `Widget` is-a `Timer`, because `Widget` clients should not be able to call `onTick` on a `Widget`[^1].

Public inheritance is not a valid option here. Instead, we inherit privately:

```cpp
class Widget: private Timer {
private:
    virtual void onTick() const; // look at Widget usage data, etc.
};
```

After private inheritance, `Timer`'s public `onTick` function becomes private in `Widget`, so keep it as private when we redeclare it[^2].

### Alternatives

This is a nice design, but it's worth noting that private inheritance isn't strictly necessary - we could use composition instead:

```cpp
class Widget {
private:
    class WidgetTimer: public Timer {
    public:
        virtual void onTick() const;
        ...
    };
    WidgetTimer timer;
    ...
};
```

This design is more complicated involving both (public) inheritance and composition, but we do get two more advantages from its complixity:

1. Because `Widget`'s derived classes have no access to the private `WidgetTimer` data member, we prevent derived classes from redefining `onTick`[^3].
2. We've minimized `Widget`'s compilation dependencies: if `Widget` inherits from `Timer`, `Timer`'s definition must be available when `Widget` is compiled, so we probably has to `#include Timer.h`. If `WidgetTimer` is moved out of `Widget` and `Widget` only contains a pointer to  a `WidgetTimer`, we only need to simply forward decalare the `WidgetTimer` class without `#include` anything. Such decouplings can be important for large systems (details in item 31).

## Edge case

The edge case, as the name suggests, is edgy indeed: it applies only when we're dealing with a class that has no data in it: no non-static data members; no virtual functions (which introduces `vptr` to each object, item 7); and no virual base classes (which also incurs a size overhead, item 40). Conceptually, such an _empty_ class should use no space, but C++ requires that freestanding objects must have non-zero size for some technical reasons. That being said,

```cpp
class Empty {}; // has no data, so obj. should use no memory

class HoldsAnInt {
private:
    int x;
    Empty e;  // should use no memory
};
```

We'll find that  `sizeof(HoldsAnInt) > sizeof(int)`, so `Empty` data member does require extra memory. With most compilers, `sizeof(Empty)` is 1, which is a silently inserted `char` inside the `Empty` objects to satisfy C++'s requirements. However, alignment requirements (see item 50) may casue compilers to add padding to `HoldsAnInt` classes, so the objects of `HoldsAnInt` may gain more than just the size of a char - they would actually enlarge enough to hold a second int.

Now comes the point of using private inheritance: rather than containing "freestanding" objects that can not have zero size, we could inherit from `Empty` type:

```cpp
class HoldsAnInt: private Empty {
private:
    int x;
};
```

Now `sizeof(HoldsAnInt) == sizeof(int)`, thanks to _empty base optimization (EBO)_, which is typically supported by most compilersp[^4].

In practice, "empty" base classes often contain typedefs, enums, static data members, or non-virtual functions, such as those in the STL that contains useful members (usually typedefs), and thus classes for user-defined function objects may inherit from them without worrying about size increase thanks to EBO.

## In summary

Private inheritance is most likely to be a legitimate design strategy when we're dealing with two classes not related by is-a where one either needs access to the protected members of another or needs to redefine one or more of its virtual functions. Even in this case, however, a mixture of public inheritance and composition can often yield the expected behavior, albeit with more design complexity. 

Most classes aren't empty, so the EBO is rarely a legitimate justification for private inheritance.

Using private inheritance _judiciously_ means employing it when, having considered all the alternatives, it's the best way to express the relationship between two classes.

[^1]: Allowing adding `onTick` into the conceptual `Widget` interface would make it easy for clients to use the `Widget` interface incorrectly, a clear violation of item 18's advice to make interfaces easy to use correctly and hard to use incorrectly.
[^2]: Putting `onTick` in the public side will not change its accessibility, only to mislead clients into thinking they could call it, and this, again, violates item 18's advice.
[^3]: If `Widget` inherits directly from `Timer`, `Widget`'s derived classes may redefine `onTick` even if `onTick` is private (recall item 35 that derived classes may redefine virtual functions even if they are not permitted to call them). By the way, Java or C# would not have such trouble due to their keyword `final` or `sealed`.
[^4]: It is worth knowing that the EBO is generally viable only under insgle inheritance, and can't be applied to derived classes taht have more than one base.

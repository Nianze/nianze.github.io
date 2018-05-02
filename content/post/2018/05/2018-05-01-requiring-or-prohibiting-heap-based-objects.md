---
title: "[MECpp]Item-27 Requiring or Prohibiting Heap Based Objects"
date: 2018-05-01
categories:
- article
- coding
tags:
- technique
- cpp
slug: Requiring or Prohibiting Heap Based Objects
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-04/2018-04-25.gif
---

Techniques for requiring or prohibiting heap-based objects
<!--more-->

## Requiring Heap-Based Objects

### 1. The straightforward way

The brutle way is to declare the constructors and the destructor `private`, but this is overkill. Either one of them need to be private to ensure objects only be created on the heap. Since there are usually many constructors but only one destructor per class, a more elegant way is to make the destructor private and the constructors public, prividing privileged pseudo-destructor function (which has access to the real destructor) for clients to call, as suggested in MECpp item 26.

Example:

```cpp
class UPNumber { // unlimited precision numbers that should only exist on the heap
public:
    UPNumber();
    UPNumber(int initValue);
    UPNumber(double initValue);
    UPNumber(const UPNumber& rhs);
    // pseudo-destructor (a const member function, because even const obj. may be destroyed)
    void destroy() const { delete this; }
    ...
private:
    ~UPNumber();
};
```

Clients would program like this:

```cpp
UPNumber n; // error! (legal here, but illegal when n's dtor is implicitly invoked later)
UPNumber *p = new UPNumber; // fine
...
delete p; // error! attempt to call private dtor
p->destroy(); // fine
```

### 2. Inheritance-and-containment friendly

Restricting access to a class's destructor or constructors prevents the creation of not only non-heap objects, but also both inheritance and containment. To work this out:

* To be friendly for inheritance, we declare `protected` for `UPNumber`'s destructor.
* To be friendly for containment, classes that need objects of type `UPNumber` can be modified to contain pointers to `UPNumber` object instead:

```cpp
class UPNumer {...};  // declare dtor protected
class NonNegativeUPNumber: public UPNumber {...}; // okay to access protected members

class Asset {
public:
    Asset(int initValue);
    ~Asset();
    ...
private:
    UPNumber *value;
};

Asset::Asset(int initValue)
: value(new UPNumber(initValue)) // fine
{...}

Asset::~Asset()
{ value->destroy(); }  // fine
```

### 3. Determining Whether an Object is On The Heap

It's hard to tell whether an object is on the heap. For example, given the class definition above, it's ligal to define a non-heap `NonNegativeUPNumber` object, which will not construct its base `UPNumber` part on the heap. There is no way to detect whether a constructor is being invoked as the base class part of a heap-based object, which means for the following contexts, it is not possible for the `UPNumber` constructor to detect the difference:

```cpp
NonNegativeUPNumber *n1 = new NonNegativeUPNumber; // on heap
NonNegativeUPNumber n2; // not on heap
```

Sadly, there's no portable way to determine whether an object is on the heap, and there isn't even a semi-portable way that works most of the time. Detailed dicussion on this topic could be found at [Comments on Item 27 of More Effective C++](http://www.aristeia.com/BookErrata/M27Comments.html).

We'll have to turn to unportable, implementation-dependent system calls if we absolutely have to tell whether an address is on the heap. That being the case, we'd better off trying to redesign the software so we don't need to determine whether an object is on the heap in the first place.

#### 4. Determine whether it's safe to ddelete a pointer

To answer this eaier question, all we need to do is create a collection of addresses that have been returned by `operator new`.



## Prohibiting Heap-Based Objects


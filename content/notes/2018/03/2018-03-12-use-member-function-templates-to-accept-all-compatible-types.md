---
title: "Item-45 Use member function templates to accept all compatible types"
date: 2018-03-12T20:14:47-04:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: use member function templates to accept all compatible types
autoThumbnailImage: false
thumbnailImagePosition: right
featured_image: 2018/2018-03/2018-03-12.gif
---

In order to implicitly convert all compatible types for a template class, we neet not a constructor _function_ but a constructor _template_ - _member functoin templates_ that generate member functions of a class.
<!--more-->

Implicit conversion is a big convenient advantage offered by pointers: derived class pointers convert into base class pointers implicitly, pointers to non-`const` objects convert into pointers to `const` implicitly, etc. For a three-level hierarchy, following code makes perfect sense:

```cpp
class Top {...};
class Middle: public Top {...};
class Bottom: public Middle {...};
Top *pt1 = new Middle;  // convert Middle* -> Top*
Top *pt2 = new Bottom;  // convert Bottom* -> Top*
const Top *pct = pt1;   // convert Top* -> const Top*
```

In the world of template, we'd really like to emulate such conversions for our user-defined smart pointer classes:

```cpp
template<typename T>
class SmartPtr {
public:
    explicit SmartPtr(T *realPtr) // initialized by built-in pointers
    ...
};

SmartPtr<Top> pt1 = SmartPtr<Middle>(new Middle);  // convert SmartPtr<Middle> -> SmartPtr<Top>
SmartPtr<Top> pt2 = SmartPtr<Bottom>(new Bottom);  // convert SmartPtr<Bottom> -> SmartPtr<Top>
SmartPtr<const Top> pct = pt1;  // convert SmartPtr<Top> -> SmartPtr<const Top>
```

However, there's no inherent relationship among different instantiations of the same template, so compilers view `SmartPtr<Middle>` and `SmartPtr<Top>` as completely different classes. We need to write smart pointer constructors that is not only able to construct `SmartPtr<Top>` from `SmartPtr<Middle>`, but also capable to convert any compatible types in the hierarchy (we may extend the hierarchy in the future and add `class BelowBottom: public Bottom`). In principle, such constructors are countless.

Considering the fact that a template can be instantiated to generate an unlimited number of functions, what we need here is not a constructor _function_, but a constructor _template_, the _member function templates_ (also known as _member templates_) that generate member functions of a class:

```cpp
template<typename T>
class SmartPtr {
public:
    template<typename U>  // member template for a "generalized copy constructor"
    SmartPtr(const SmartPtr<U>& other);  // not declared as "explicit" for implicit conversion
    ...
};
```

Constructors like this - ones that create one object from anothe object whose type is a different instantiation of the same template (e.g., create a `SmartPtr<T>` from a `SmartPtr<U>`) - are known as _generalized copy constructors_.

However, this member template will generate more member functions than we need: as declared, it is possible to create a `SmartPtr<Bottom>` from a `SmartPtr<Top>`, which is contrary to the meaning of public inheritance (item 32). We need to restrict the conversions to those we want:

```cpp
template<typename T>
class SmartPtr {
public:
    template<typename U>
    SmartPtr(const SmartPtr<U>& other)  // initialize this held ptr with other's held ptr
    : heldPtr(other.get()) {...}
    T* get() const { return heldPtr; }
    ...
private:         
    T *heldPtr; // built-in ptr held by the smartPtr
};
```

Since we initialize `SmartPtr<T>`'s data member of type `T*` with the pointer of type `U*` held by `SmartPtr<U>`, the code above will compile only if there is an implicit conversion from a `U*` pointer to a `T*` pointer, and this is exactly what we want.

Apart from constructors, we can also apply member function tmeplates to assignment. A good example is from TR1's `shared_ptr` (item 13):

```cpp
template<class T> class shared_ptr {
public:
    shared_ptr(shared_ptr const& r);  // "normal" copy constructor
    template<class Y>
      explicit shared_ptr(Y * p);  // generalized copy constructor from any compatible built-in pointer
    template<class Y>
      shared_ptr(shared_ptr<Y> const& r);  // from compatible shared_ptr
    template<class Y>
      explicit shared_ptr(weak_ptr<Y> const& r);  // from compatible weak_ptr
    template<class Y>
      explicit shared_ptr(auto_ptr<Y>& r);  // from compatible auto_ptr

    shared_ptr& operator=(shared_ptr const& r); // "normal" copy assignment
    template<class Y>
      shared_ptr& operator=(shared_ptr<Y> const& r);  // generalized copy assign from any compatible shared_ptr
    template<class Y>
      shared_ptr& operator=(auto_ptr<Y>& r);  // assign from any compatible auto_ptr
    ...
};
```

Note that 

* the generalized copy constructor is not declared `explicit` in order to support implicit conversion from one type of `shared_ptr` to another. 
* All other constructors are `explicit`, so _implicit_ conversion from a built-in pointer or other smart pointer type is not permitted (explicit conversion via a cast is okey).
* `auto_ptr` passed to `tr1::shared_ptr` constructors and assignment operators are not declared `const`, because `auto_ptr` will be modifies when they're copyed (item 13).
* both a generalized copy constructor (and assignment) as well as the "normal" copy constructor (and copy assignment) are declared, because declaring a generalized copy constructor (a member template) in a class doesn't keep compilers from generating their own copy constructor (a non-template version), so if we want to control all aspect of copy construction, we declare both.

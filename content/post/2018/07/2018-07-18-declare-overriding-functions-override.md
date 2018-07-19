---
title: "[EMCpp]Item-12 Declare Overriding Functions Override"
date: 2018-07-18T19:19:07-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Declare Overriding Functions Override
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-07/18.gif
---

C++11 gives us a way to make explicit that a derived class function is supposed to override a base class version: `override`.
<!--more-->

There are several requirements for overriding to occur:

* The base class function must be virtual
* The base and derived funciton names must be identical (except in the case of destructors)
* The parameter types of the base and derived functions must be identical
* The `const`ness of the base and derived functions must be identical
* The return types and exception specifications of the base and derived functions must be compatible
* The functions' _reference qualifiers_ mmust be identical (new from C++11)

All these requirements for overriding mean that small mistakes can make a big difference. Code containing unintended overriding errors is typically still valid, so compilers may fail to notify us the errors. For example, following code is completely legal:

```cpp
class Base {
public:
    virtual void mf1() const;
    virtual void mf2(int);
    virtual void mf3() &;
    void mf4() const;
};

class Derived: public Base {
public:
    void mf1();  // virtual is optional here for derived classes
    void mf2(unsigned int);
    void mf3() &&;
    virtual void mf4() const;
};
```

However, we almost certainly intend to override base class functions with derived class ones with the same names, yet none of the derived class functions are tied to the base class ones:

* `mf1` is declared `const` in `Base`, but not in `Derived`
* `mf2` takes an `int` in `Base`, but an `unsigned int` in `Derived`
* `mf3` is lvalue-qualified in `Base`, but `rvalue-qualified` in `Derived`
* `mf4` isn't declared `virtual` in `Base`

If we explicitly declare with the _contextual keyword_ `override`:

```cpp
class Derived: public Base {
public:
    virtual void mf1() override;
    virtual void mf2(unsigned int) override;
    virtual void mf3() && override;
    virtual void mf4() const override;
};
```

Then the code won't compile, because compilers will complain the overriding-related problems above, which is exactly what we want.

Moreover, taking use of compilers' ability to diagnostic overriding problems, we can easily use `override` keyword to gauge the ramifications if we're contemplating changing the signature of a virtual funciton in a base class: if derived classes use `override` everywhere, we can just change the signature, recompile the system, see how much damage we've caused, and then decide whether the signature change is worth the trouble.


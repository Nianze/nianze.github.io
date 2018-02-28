---
title: "Item-33 Avoid hiding inherited names"
date: 2018-02-26T20:18:55-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: avoid hiding inherited names
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-02/2018-02-26.gif
---

Names in derived classes hide names in base classes, which is not desirable in public inheritance. To fix it, employ `using` declarations or forwarding functions to make hidden names visible again.
<!--more-->

As we all know, names in inner scopes hide ("shadow") names in outer scopes. Specifically, whether the names correspond to the same or different types is immaterial. In the world of inheritance, the scope of a derived class is nested inside its base class's scope, so if we define following classes:

```cpp
class Base {
private:
    int x;
public:
    virtual void mf1() = 0;
    virtual void mf2();
    void mf3();
};
```

```cpp
class Derived: public Base {
public:
    virtual void mf1();
    void mf4();
};

void Derived::mf4()
{
    ...
    mf2();
    ...
}
```

When compilers see the use of the name `mf2` here, they figure out what it refers to by searching scopes for a declaration of something named `mf2` by following order:

* first they look in the local scope of `mf4`
* then they search the containing scope, that of the class `Derived`
* they move on to the next containing scope, that of the base class (there they found something named `mf2`, so the search stops)
* if there were no `mf2` in `Base`, the search will continue, first to the namespace(s) containing `Base`, and finally to the global scope

Consider again what will happen if the two classes are defined in the following way, with `mf1` and `mf3` overloaded in `Base` and a new `mf3` added in `Derived`:

```cpp
class Base {
private:
    int x;
public:
    virtual void mf1() = 0;
    virtual void mf1(int);
    virtual void mf2();
    void mf3();
    void mf3(double);
};
```

```cpp
class Derived: public Base {
public:
    virtual void mf1();
    void mf3();
    void mf4();
};
```

From the perspective of name lookup, `Base::mf1` and `Base::mf3` are no longer inherited by `Derived`, because all functions names `mf1` and `mf3` in the base class are hidden by the functions names `mf1` and `mf3` in the derived class. This leads to following behavior:

```cpp
Derived d;
int x;
...
d.mf1();  // fine, calls Derived::mf1
d.mf1(x); // error! Derived::mf1 hides Base::mf1
d.mf2();  // fine, calls Base::mf2
d.mf3();  // fine, calls Derived::mf3
d.mf3(x); // error! Derived::mf3 hides Base::mf3
```

Even though the functions in the base and derived classes take different parameter types, and no matter those functions are virtual or non-virtual, the name lookup rule applies regardlessly. The rationale behind this behavior is to prevent us from accidentally inheriting overloads from distant base classes when we create a new derived class in a library or application framework. However, sometimes we _want_ to inherit the overloads[^1].

To access the hidden names, we have two ways to go: `using` declarations and forwarding function.

### `using` declarations

```cpp
class Base{...}; // the same

class Derived: public Base {
public:
    using Base::mf1;  // make all things in Base named mf1 and mf3 
    using Base::mf3;  // visible (and public) in Derived's scope

    virtual void mf1();
    void mf3();
    void mf4();
};
```

And now inheritance will work as expected:

```cpp
Derived d;
int x;
...
d.mf1();  // fine, calls Derived::mf1
d.mf1(x); // now ok, call Base::mf1
d.mf2();  // fine, calls Base::mf2
d.mf3();  // fine, calls Derived::mf3
d.mf3(x); // now ok, call Base::mf3
```

This tells us that

> if we inherit from a base class with overloaded functions and we want to redefine or override only some of them, we need to include a `using` declaration for each name we'd otherwise be hiding. If we don't, some of the names we'd like to inherit will be hidden.

Unser public inheritance, we always want to inherit all the functions from the base classes to follow public inheritance's is-a relationship between base and derived classes, which is why the `using` declarations above are in the public part of the derived class (names that are public in a base class should also be public in a publicly derived class).

However, under private inherits (item 39), it can make sense to inherit only part of the functions from the base classes. A the `using` declaration won't do the trick here, for it makes _all_ inherited functions with a given name visible in the derived class. We use a different technique: forwarding function.

### Forwarding function



[^1]: In fact, in public inheritance, if we don't inherit the overloads, we're violating the is-a relationship between base and derived classes, which, as explained in item 32, is fundamental to public inheritance.
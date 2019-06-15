---
title: "[EMCpp]Item-16 Make Const Member Functions Thread Safe"
date: 2018-07-24T10:26:02-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Make Const Member Functions Thread Safe
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-07/24.gif
---

Make `const` member functions thread safe unless we're _certain_ they'll never be used in a concurrent context.
<!--more-->

Due to `mutable` member datas, `const` member functions may not be thread safe. For a classic use case for `mutable`:

```cpp
class Polynomial {
public:
    using RootsType = std::vector<double>;  // holding val. where poly. evals to zero
    RootsType roots() const
    {
        if (!rootsAreValie) {       // if cache not valid
            ...                     // compute roots, store them in rootVals
            rootsAreValid = true; 
        }
        return rootVals;
    }
    ...
private:
    mutable bool rootsAreValid{ false };
    mutable RootsType rootVals{};
};
```

Here `roots()` retrieves the roots of a polynomial without changing the value of the `Polynomial` object on which it operates, so `const` declaratoin is correct. However, `rootVals` and `rootsAreValid` might be modified for the purpose of caching. Seeing the `const` interface for `roots()`, clients are perfectly reasonable to do something like this:

```cpp
Polynomial p;
...
// thread 1                   // thread 2
auto rootsOfP = p.roots();    auto valsGivingZero = p.roots();
```

Having multiple threads perform a read operation without synchronization is safe. However, although `roots` is declared `const`, it's not thread safe: more than one threads might try to modify the data members `rootsAreValid` and `rootVals` inside `roots`, reading and writing the same memory without synchronization - which is data racing, leading to undefined behavior.

#### Solution: mutex

```cpp
class Polynomial {
public:
    using RootsType = std::vector<double>;  // holding val. where poly. evals to zero
    RootsType roots() const
    {
        std::lock_guard<std::mutex> g(m);  // lock mutex
        if (!rootsAreValie) {       // if cache not valid
            ...                     // compute roots, store them in rootVals
            rootsAreValid = true; 
        }
        return rootVals;
    }                                      // unlock mutex
    ...
private:
    mutable std::mutex m;
    mutable bool rootsAreValid{ false };
    mutable RootsType rootVals{};
};
```

`roots` is a `const` member function, inside which `std::mutex m` would be considered a `const` object, while `locking` and `unlocking` are non-`const` member functions, so we need to declared `m` as `mutable`.

Another point worth noting is that `std::mutex` can be neither copied nor moved, so a side effect of adding `m` to `Polynomial` is that `Polynomial` loses the ability to be copied and moved.

#### For a single variable requiring synchronization

Sometimes when there's only one variable or memory location requiring synchronization, `mutex` might be overkill, and we might consider `std::atomic` counter (EMCpp item 40), which is often a less expensive way to go[^1]:

```cpp
class Point {
public:
    ...
    double distanceFromOrigin() const noexcept
    {
        ++callCount;   // atomic increment
        return std::hypot(x, y);
    }
private:
    mutable std::atomic<unsigned> callCount{ 0 };
    double x, y;
};
```

The same side effect goes here: the existance of `callCount` in `Point` makes `Point` neither copyable nor movable. 

#### Summary

The point in this item: when we write a `const` member function, we might avoid the costs associated with mutexes and `std::stomic`s as well as the side effect of uncopyability as well as unmovability, if we can guarantee that there will never be more than one thread executing that member function on an object.

However, such threading-free scenarios are increasingly uncommon. In order to support concurrent execution, we should unsure that `const` member functions are thread safe.


[^1]: Whether it actually is less expensive depends on the hardware we're runnig on and the implementation of mutexes in our Standard Library.

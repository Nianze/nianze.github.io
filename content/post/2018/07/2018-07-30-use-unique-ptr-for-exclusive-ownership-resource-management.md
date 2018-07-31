---
title: "[EMCpp]Item-18 Use unique_ptr for Exclusive-ownership Resource Management"
date: 2018-07-30T15:18:04-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Use unique_ptr for Exclusive-ownership Resource Management
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-07/30.gif
---

`std::unique_ptr` is a small, fast, move-only smart pointer for managing resources with exclusive-ownership semantics.
<!--more-->

Some facts:

* `std::unique_ptr` embodies _exclusive ownership_ semantics: a non-null `std::unique_ptr` owns what it points to
* Moving a `std::unique_ptr` transfers ownershiip from the source pointer to the destination pointer
* Copying a `std::unique_ptr` isn't allowed (it's _move-only type_)
* Upong destruction, a non-null `std::unique_ptr` destroys its resource by calling its deleter (by default the deleter simply applies `delete` to the raw pointer inside the `std::unique_ptr`) 
* `std::unique_ptr` can easily and efficiently converts to a `std::shared_ptr`

Factory functions and Pimpl Idiom are two common use case for `std::ptr`s. For example, supporse we have a hierarchy for types of investments (e.g., stocks, bonds, real estate, etc.) with a factory function alllocating an object on the heap and returning a pointer to it:

```cpp
class Investment {
public:
    ...
    virtual ~Investment();
    ```
};

class Stock: public Investment {...};
class Bond: public Investment {...};
class RealEstate: public Invesetment {...};

template<typename... Ts>
std::unique_ptr<Investment, decltype(delInvmt)>  // return std::unique_ptr to an object 
makeInvestment(Ts&&... params);  // created from the given args with cutomized deleter
```

By the help of `std::unique_ptr`, clients will no longer worry about deleting it:

```cpp
{
    ...
    auto pInvestment = makeInvestment( arguments );
    ...
}  // destroy *pInvestment
```

Callers can also take use of `std::unique_ptr`'s feature to adapt it to its more flexible sibling `std::shared_ptr`:

```cpp
std::shared_ptr<Investment> sp = makeInvestment( arguments );
```

#### Implementation

For C++11, we can implement the factory function this way:

```cpp
auto delInvmt = [](Investment* pInvestment)       // custom deleter
                {                                 // (a lambda expression)
                    makeLogEntry(pInvestment);   
                    delete pInvestment;
                };

template<typename... Ts>
std::unique_ptr<Investment, decltype(delInvmt)>
makeInvestment(Ts&&... params)
{
    std::unique_ptr<Investment, decltype(delInvmt)>
        pInv(nullptr, delInvmt);
    if ( /* a Stock should be created */ )
    {
        pInv.reset(new Stock(std::forward<Ts>(params)...));
    }
    else if ( /* a Bond should be created */ )
    {
        pInv.reset(new Bond(std::forward<Ts>(params)...));
    }
    else if ( /* a RealEstate should be created */ )
    {
        pInv.reset(new RealEstate(std::forward<Ts>(params)...));
    }
    return pInv;
}
```

In C++14, we could use function return type deduction to make it simpler and more encapsulated:

```cpp
template<typename... Ts>
auto makeInvestment(Ts&&... params) // C++14
{
    auto delInvmt = [](Investment* pInvestment)     // now inside makeInvestment
                    {
                        makeLogEntry(pInvestment);
                        delete pInvestment;
                    };
    std::unique_ptr<Investment, decltype(delInvmt)>
        pInv(nullptr, delInvmt);
    ... // as before
}
```

It is worth thinking about the size impact on a `std::unique_ptr` after introducing a custome deleter:

* if the deleter is a function pointer, the size of a `std::unique_ptr` generally grow from one (the size of a raw pointer) to two
* if the deleter is a function object, the change in size depends on how much state is stored in the function object
    - Stateless function objects (e.g., from lambda expressions with no captures) typically incur no size penalty when used as deleters (still one word)
    - Function object deleters with extensive state can yield `std::unique_ptr` objects of significant size.

#### Two forms

`std::unique_ptr` comes in two forms

* `std::unique_ptr<T>` for individule objects, which lacks indexing operator (`operator[]`)
* `std::unique_ptr<T[]>` for arrays, which lacks dereferencing operators (`operator*` and `operator->`)

Generally, `std::array`, `std::vector`, and `std::string` are always better data structure choices than raw arrays, so the only situation where `std::unique_ptr<T[]>` makes sense would be when we're using a C-like API that returns a raw pointer to a heap array that we assume ownership of.
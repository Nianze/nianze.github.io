---
title: "[EMCpp]Item-31 Avoid Default Capture Modes"
date: 2018-08-21T19:22:22-04:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: Avoid Default Capture Modes
autoThumbnailImage: true
thumbnailImagePosition: right
featured_image: 2018/2018-08/21.gif
---

Default by-reference capture can lead to dangling references; default by-value capture is susceptible to dangling pointers, while misleadingly susggests the lambdas are self-contained.
<!--more-->
<!-- toc -->

# Default by-reference capture

If the lifetime of a closure created from a lambda exceeds the lifetime of the local variable or parameter captured by-reference, the reference in the closure will dangle:

```cpp
using FilterContainer = std::vector<std::function<bool(int)>>;
FilterContainer filters;

void addDivisorFilter()
{
    auto calc1 = computeSomeValue1();
    auto calc2 = computeSomeValue2();

    auto diviser = coputeDiviser(calc1, calc2);

    filters.emplace_back(
        [&](int value) { return value % divisor = 0; }  // ref to divisor will dangle
    );
}
```

Long-term, it's better software engineering to explicitly list the local variables and parameters that a lambda depends on.

# Default by-value capture

Capture by value will solve the dangling problem in above example, but it can't guarantee the safety if we capture a pointer and that pointer is deleted outside the lambda, which causes our copied pointer to dangle. This usually happens where `this`, a raw pointer, implicitly shows up, for example:

```cpp
class Widget {
public:
    ...
    void addFilter() const;
private:
    int divisor;
};

void Widget::addFilter() const
{
    filters.emplace_back(
        [=](int value) { return vlaue % diviser == 0; }
    );
}
```

Captures apply only to non-static local variables (including parameters) visible in the scope where the lambda is created. Since `diviser` above is a data member of the `Widget` class, instead of a local variable, what compilers see is as if it had been written as follows:

```cpp
void Widget::addFilter() const
{
    auto currentObjectPtr = this;
    filters.emplace_back(
        [currentObjectPtr](int value)
        { return value % currentObjectPtr->divisor == 0; }
    );
}
```

and now consider this:

```cpp
void doSomeWork()
{
    auto pw = std::make)unique<Widget>();
    pw->addFilter();
    ...
}  // destroy Widget; filters now holds dangling pointer
```

In this code above, a filter is created containing a copy of a `this` pointer to the newly created `Widget`, and then we add this filter to `filters`. When `doSomeWork` finishes, the `Widget` object is destroyed by `std::unique_ptr`, and `filters` contains an entry with a dangling pointer.

To solve the problem, just make a local copy of the data member we want to capture and then capture the copy:

```cpp
void Widget::addFilter() const
{
    auto currentObjectPtr = divisor;  // copy data member
    filters.emplace_back(
        [divisorCopy](int value)
        { return value % divisor == 0; }
    );
}
```

In C++14, a better way to capture a data member is to use generalized lambda capture (Item 32):

```cpp
void Widget::addFilter() const
{    
    filters.emplace_back(  // C++14
        [divisor = divisor](int value)  // copy divisor to closure
        { return value % divisor == 0; } // use the copy
    );
}
```

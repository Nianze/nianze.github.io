---
title: "[EMCpp]Item-25 Use std::move on Rvalue References, std::forward on Universal References"
date: 2018-08-11T15:26:53-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Use std::move on Rvalue References, std::forward on Universal References
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-08/11.gif
---

But don't apply `std::move` or `std::forward` to local objects if they would otherwise be eligible for the return value optimization.
<!--more-->
<!-- toc -->

# Normal cases

When forwarding them to other functions, rvalue references, which is always bound to rvalues, should be _unconditionally_ cast to rvalues (via `std::move`), while universal references, which is sometimes bound be rvalues, should be _conditionally_ cast to rvalues (via `std::forward`):

```cpp
class Widget {
public:
    Widget(Widget&& rhs)          // rhs is rvalue reference
    : name(std::move(rhs.name)),
      p(std::move(rhs.p))
      {...}
    template<typename T>
    void setName(T&& newName)     // newName is rvalue reference
    { name = std::forward<T>(newName); }
    ...
private:
    std::string name;
    std::shared_ptr<SomeDataStructure> p;
};
```


# What if

You may wonder, what will happen if we exchange `std::forward` ans `std::move`:

* applying `std::forward` on rvalue references can exhibit the proper behavior, but the source code is wordy, error-prone[^1], and unidiomatic:

    ```cpp
    Widget::Widget(Widget&& rhs) : 
        name(std::forward<std::string>(rhs.name)), 
        p(std::forward<std::shared_ptr<SomeDataStructure>>(rhs.p))
    {...}
    ```
* using `std::move` on universal refenreces can have the effect of unexpectedly modifying lvalues (e.g., local variables):
    ```cpp
    template<typename T>
    void Widget::setName(T&& newName)
    { name = std::move(newName); } // compiles, but is bad!

    std::string getWidgetName();   // factory function
    Widget w;
    auto n = getWidgetName();      // n is local variable
    w.setName(n);                  // moves n into w
    ...                            // n's value now unkown!
    ```

Another alternative is to replace the template taking a universal reference with a pair of functions overloaded on lvalue references and rvalue references:

```cpp
class Widget {
public:
    void setName(const std::string& newName)  // set from const lvalue
    { name = newName; }
    void setName(std::string&& newName)      // set from rvalue
    { name = std::move(newName); }
    ...
};
```

The cost we pay for this replacement is:

1. More source code to write and maintain (two functions instead of a single template)
2. Less efficient in some cases such as this[^2]:  
    ```cpp
    w.setName("John Smith");
    ```
3. Poor scalability of the design if more parameters come (each of which can be an lvalue or rvalue):   

    ```cpp
    tempalte<class T, class... Args> 
    shared_ptr<T> make_shared(Args&&... args);  // can't overload on lvalues and rvalues on args. universal reference is used and std::forward is applyied
    ```


# Other usage

Moreove, sometimes we want to apply `std::move` or `std::forward` to only the final use of the reference when an rvalue reference or a universal reference will be used more than once in a single function:

```cpp
template<typename T>
void setSignText(T&& text)  // text is a universal reference
{
    sign.setText(text);  // use text, but do not modify it
    auto now = std::chrono::system_clock::now();
    signHistory.add(now, std::forward<T>(text)); // conditionally cast to rvalue
}
```

The same logic applies to `std::move`, except that in rare cases, we want to call `std::move_if_noexcept` instead of `std::move` (refer to EMCpp item 14).

If a function _returns be value_, and the returning object is bound to an rvalue refernece or a universal reference, we also want to apply `std::move` or `std::forward` to support potential move construction and get more efficient:

```cpp
Matric operator+(Matric&& lhs, const Matrix& rhs)
{
    lhs += rhs;
    return std::move(lhs);  // move lhs into return value
}

template<typename T>
Fraction reduceAndCopy(T&& frac)
{
    frac.reduce();
    return std::forward<T>(frac);  // move rvalue into return value; copy lvalue
}
```


# When not to

According to Standardization Committee, there's a kind of optimizatoin called _return value optimization (RVO)_:

> the “copying” version of makeWidget can avoid the need to copy the local variable w by constructing it in the memory alloted for the function’s return value

Due to this optimization, we should not use `std::move` on a local object being returnd from a function that's returning by value so that we won't precluding the RVO that compilers will do for the return value.

[^1]: The type we pass to `std::forward` should be a non-reference, according to the convention for encoding that the argument being passed is an rvalue (see EMCpp Item 28).
[^2]: With the universal reference version, there's only one call to `std::string` assignment operator for `w.name`, since the string literal would be passed to this function as a `const char*` pointer; the overloaded versions entail execution of one `std::string` constructor (to create a temporary), one `std::string` move assignment operator (to move `newName` into `w.name`), and one `std::string` destructor (to destroy the temporary), which is almost certainly more expensive.

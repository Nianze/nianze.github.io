---
title: "[EMCpp]Item-5 Prefer Auto to Explicit Type Declarations"
date: 2018-07-07T13:33:06-04:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: Prefer Auto to Explicit Type Declarations
autoThumbnailImage: true
thumbnailImagePosition: right
featured_image: 2018/2018-07/07.gif
---

Despite some pitfalls described in EMCpp item 2 and 6, `auto` variables are preferred for they must be initialized, are generally immune to type mismatches that can lead to portability or efficiency problems, can ease the process of refactoring, and typically require less typing than variables with explicitly specified types.
<!--more-->
<!-- toc -->

# Avoidance of Uninitialized variables

`auto` variavbles have their type deduced from their initializer, so they must be initialized.

```cpp
int x1;  // potentially unintialized
auto x2;  // error! initializer required
auto x3 = 0; // fine, x3's value is well-defined
```


# Avoidance of Syntactic Verbosity 

In order to express the type of the value pointed to by an iterator, without `auto`, we may write like this:

```cpp
template<typename It>
void dwim(It b, It e) // "do what I mean". for all elements in range from b to e
{
    for (; b != e; ++b) {
        typename std::iterator_traits<It>::value_type currValue = *b;
        ...
    }
}
```

Thanks to `auto`, now we can declare a local variable whose value is that of a dereferenced iterator with ease:

```cpp
template<typename It>
void dwim(It b, It e)
{
    for (; b != e; ++b) {
        auto currValue = *b;
        ...
    }
}
```


# Ability to Hold Closure

Because `auto` uses type deduction, it can represent types known only to compilers, such as lambda expressions:

```cpp
// C++14
auto derefLess =           // comparison func. for values pointed
    [](const auto& p1,     // to by anything pointer-like
       const auto& p2) 
    { return *p1 < *p2; };  
```

or in C++11, a little more verbose:

```cpp
// C++11 doesn't support auto for parameters to lambda, so more verbose.
auto derefUPLess =  // comparison func. for Wdigets pointed
    [](const std::unique_ptr<Widget>& p1,  // to by std::unique_ptr
       const std::unique_ptr<Widget>& p2)  
    { return *p1 < *p2; }; 
```

Without using `auto`, since lambda expressions yield closures, which are callable objects, we can store them in `std::function` objects:

```cpp
std::function<bool(const std::unique_ptr<Widget>&, 
              bool(const std::unique_ptr<Widget>&)>
    derefUPLess = [](const std::unique_ptr<Widget>& p1, // comparison func. for Wdigets pointed
                     const std::unique_ptr<Widget>& p2) // to by std::unique_ptr
                    { return *p1 < *p2; };
```

As we can see, syntactic verbosity makes `auto` a preferred choice. Besides that, there are two more reasons to choose `auto`: 

1. `std::function` object typically uses more memory than the `auto`-declared object[^1].
2. invoking a closure via a `std::function` object is almost certain to be slower than calling it via an `auto`-declared object[^2]. 

In summary, `auto` wins the competition between `auto` and `std::function` for holding a closure.


# Avoidance of Unexpected Implicit Conversions

Consider this code:

```cpp
std::unordered_map<std::string, int> m;
...
for (const std::pair<std::string, int>& p : m)
{
    ...
}
```

This looks perfectly reasonable, but there's a problem: the key part of a `std::unorderd_map` is `const`, so the type of `std::pair` in the hash table isn't `std::pair<std::string, int>`, but `std::pair<const std::string, int>`. Since the constness hasn't been declared for the variable `p` in the loop, compilers will create a temporary object of the type that `p` wants to bind to by coping each object in `m`, then binding the reference `p` to that temporary object, and finally destroy the temporary at the end of each loop iteration. This is almost certain to be an unwanted behavior - we probably intend to simply bind the reference `p` to each element in `m` directly.

Such unintentional type mismatches can be `auto`ed away:

```cpp
for (auto& p : m)
{
    ...
}
```


# Avoidance of Explicit Type Revising during Refactoring

`auto` types automatically change if the type of their initializing expression changes, and that means that some refactoring (e.g., change the return type of a function from `int` to `long`) are facilitated by the use of `auto`: 

* if the results of calling the function are stored in `auto` variables, the calling code automatically updates itself the next time we compile
* if the results are stored in varibles explicitly declared to be `int`, we have to find all the call sites so that we can revise them.

[^1]: An `auto`-declared variable holding a closure has the same type as the closure, and uses only as much memory as the closure requires. The type of a `std::function`-declared variable holding a closure is an instantiation of the `std::function` template, and that has a fixed size for any given signature. When this size is not adequate for the closure, `std::function` constructor will allocate heap memory to store the closure - leading to typical result that `std::function` object uses more memory than the `auto`-declared object.
[^2]: This slowness comes from the implementation details of `std::function`, which restrict inlining and yield indirect function calls.

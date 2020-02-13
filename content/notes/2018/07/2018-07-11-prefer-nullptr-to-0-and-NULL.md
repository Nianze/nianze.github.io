---
title: "[EMCpp]Item-8 Prefer Nullptr to 0 and NULL"
date: 2018-07-11T18:03:51-04:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: Prefer Nullptr to 0 and NULL
autoThumbnailImage: true
thumbnailImagePosition: right
featured_image: 2018/2018-07/11.gif
---

`nullptr` doean't suffer from the overloading problem or the template deduction problem that 0 and `NULL` are susceptible to. It also improves code clarity.
<!--more-->

In C++98, a null pointer can be represented by an `int` 0 or `NULL`[^1], which introduses some controdiction between the _apparent_ meaning (mean to refer to a null pointer) and _actual_ meaning (the representation is some kind of integer). Neither `0` nor `NULL` has a pointer type - it's just that C++ will (reluctently) interpret them as a null pointer in the context where a pointer a pointer is wanted but can't be found.

That's why `nullptr` is introduced: its type is not integral, but `std::nullptr_t`[^2], which could be treated as a pointer of all types due to its ability to implicitly convert to all raw pointer types.

Compared with 0 and `NULL`, the obvious advantages shown by `nullptr` is its better support for overloading and template, as well as its improved code clarity.

#### Overloading

```cpp
void f(int);
void f(bool);
void f(void*);

f(0); // calls f(int)
f(NULL); // might not compile, but typically calls f(int), never calls f(void*)
f(nullptr); // calls f(void*)
```

#### Template

Inside a template, if an `int` or `NULL` (which is `int`-like type) is being passed to a function that requires a pointer, type errors occur:

```cpp
// call these only then approriate mutix is locked
int f1(std::shared_ptr<Widget> spw);
int f2(std::unique_ptr<Widget> upw);
bool f3(Widget* pw);

template<typename FuncType,
         typename MuxType,
         typename PtrType>
declType(auto) lockAndCall(FuncType func,  // C++14
                           MuxType& mutex
                           PtrType ptr)
{
    using MuxGuard = std::lock_guard<std::mutex>;
    MuxGuard g(mutex);  // lock mutex for func
    return func(ptr);   // pass ptr (pointer type) to func
}                       // unlock mutex

std::mutex f1m, f2m, f3m;
auto result1 = lockAndCall(f1, f1m, 0);        // error
auto result2 = lockAndCall(f2, f2m, NULL);     // error
auto result3 = lockAndCall(f3, f3m, nullptr);  // fine
```

In contrast, here, when `nullptr` is passed to `lockAndCall`, the type for `ptr` is deduced to be `std::nullptr_t` instead of previous `int` (or `int`-like one), and when `ptr` is passed to `f3`, there is an implicit conversion from `std::nullptr_t` to `Widget*`.

#### Code clarity

Using 0, the return type may not be obvious, is it an integral type or a pointer type?

```cpp
auto result = findRecord(/* args. */);
if (result == 0) {
    ...
}
```

There's no ambiguity when using `nullptr`:

```cpp
auto result = findRecord( /* args */ );
if (result == nullptr) {
    ...
}
```

[^1]: There is some leeway regarding the implementaition of the type of `NULL` - possibly, `NULL` will be defined to be `0L` as a `long`.

[^2]: `std::nullptr_t`, techniquely, is not a pointer type. The type is in a circular definition: `std::nullptr_t` is defined to be the type of `nullptr`.

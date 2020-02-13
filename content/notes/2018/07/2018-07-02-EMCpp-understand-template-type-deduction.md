---
title: "[EMCpp]Item-1 Understand Template Type Deduction"
date: 2018-07-02T22:44:34-04:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: Understand Template Type Deduction
autoThumbnailImage: true
thumbnailImagePosition: right
featured_image: 2018/2018-07/02.gif
---

There are three sets of rules for type deduction in modern C++: one for function templates, one for `auto`, and one for `decltype`. Without a solid understanding of how deduction operates, effective programming in modern C++ is all but impossible.
<!--more-->
<!-- toc -->

Since type deduction for templates is the basis of that for `auto`, it's important to truly understand the aspects of template type deduction that `auto` builds on: during template type deduction, there are three cases for parameter types:

1. pointer type or non-universal reference type
2. universal reference type
3. neither a pointer nor a reference (value type)

Moreover, there's a niche case worth knowing about, that arguments that are array or function names decay to pointers unless they're used to initialize references.

To tell the difference, let's think of a function template as looking like this:

```cpp
tempalte<typename T>
void f(ParamType param);
f(expr); // deduce T and ParamType from expr
```

# Case 1: `ParamType` is Reference or Pointer, but not a Universal Reference

The rules in this case works like this:

1. If `expr`'s type is a reference, ignore the reference part.
2. Then pattern-match `expr`'s type against `ParamType` to determine T.

For example,

```cpp
template<typename T>
void f(T& param);  // param is a reference

int x = 27;         // x is an int
const int cx = x;   // cx is a const int
const int& rx = x;  // rx is a refrence to x as a const int

f(x);   // T is int, param's type is int&
f(cx);  // T is const int, param's type is const int&
f(rx);  // T is const int, param's type is const int&
```

Note that even though rx's type is a reference, T is deduced to be a non-reference, because rx's reference-ness is ignored during type deduction.

```cpp
template<typename T>
void f(const T& param);  // param is now a ref-to-const, 
                         // so there's no longer a need for const to be deduced as part of T
f(x);  // T is int, param's type is const int&
f(cx); // T is int, param's type is const int&
f(rx); // T is int, param's type is const int&
```

As before, rx's reference-ness is ignored during type deduction.

```cpp
template<typename T>
void f(T* param);     // param is now a pointer

int x = 27;           // x is an int
const int *px = &x;   // px is a ptr to x as a const int

f(&x);   // T is int, param's type is int*
f(px);   // T is const int, param's type is const int*
```

As shown above, when param were a pointer (or a pointer to const), things work essentially the same way.

# Case 2: `ParamType` is a Universal Reference

Things are less obvious for templates taking universal reference paramters:

1. If `expr` is an lvalue, both `T` and `ParamType` are deduced to be lvalue references.
2. If `expr` is an rvalue, the "normal" (i.e., case 1) rules apply.

For example:

```cpp
template<typename T>
void f(T&& param);  // param is now a universal reference

int x = 27;         // as before
const int cx = x;   // as before
const int& rx = x;  // as before

f(x);  // x is lvalue, so T is int&, param's type is also int&
f(cx); // x is lvalue, so T is const int&, param's type is also const int&
f(rx); // x is lvalue, so T is const int&, param's type is also const int&
f(27); // x is rvlaue, so T is int, param's type is therefore int&&
```

EMCpp Item24 explains why these examples play out the way they do.

# Case 3: `ParamType` is Neither a Pointer nor a Reference

In this case, we're dealing with pass-by-value. That means that `param` will be a new object, which motivates the rules below:

1. As before, if `expr`'s type is a reference, ignore the reference part
2. If, after ignoring `expr`'s reference-ness, `expr` is const, ignore that, too. If it's `volatile`, also ignore that (refer to EMCpp item 40 for `volatile`).

```cpp
template<typename T>
void f(T param);  // param is now passed by value

int x = 27;         // as before
const int cx = x;   // as before
const int& rx = x;  // as before
const char* const ptr = "Fun with pointers"; // ptr is const ptr to const obj.

f(x);  // T's and param's types are both int
f(cx); // T's and param's types are both int
f(rx); // T's and param's types are both int
f(ptr); // T's and param's types are const char*, the constness of ptr is ignored.
```

# Array Arguments

Even though they sometimes seems to be interchangeable, array types are, in fact, different from pointer types. We had such equivalence illusion because, in many contexts, an array _decays_ into a pointer to its first element:

```cpp
const char name[] = "J.P. Briggs";  // name's type is const char [13]
const char * ptrToName = name;      // array decays to pointer
```

Array parameter declarations are treated as if they were pointer parameters, so `void myFunc(int param[]);` is equivalent to `void myFunc(int* param);`. Thus, the type of an array that's passed to a template function by value is deduced to be a pointer type:

```cpp
template<typename T>
void f(T param);

f(name);  // name is array, but T deduced as const char*
```

Although functions can't declare parameters that are truly arrays, they _can_ declare parameters that are _references_ to arrays. Thus,

```cpp
template<typename T>
void f(T& param);  // template with by-reference parameter

f(name);  // T is deduced as array type: const char [13], type of param is const char (&)[13]
```

The actual type of the array includes the array size, so in this example, `T` is deduced to be `const char[13]`, and the type of `f`'s parameter (a reference to this array) is `const char (&)[13]`.

Using this ability to declare references to arrays enables creation of a template that deduces the number of elements that an array contains:

```cpp
// return size of an array as a compile-time constant.
// array parameter has no name because we don't care its name
template<typename T, std::size_t N>
constexpr std::size_t arraySize(T (&)[N]) noexcept
{
    return N;
}
```

There are two points worth noting in this declaration:

1. `constexpr`, as explained in EMCpp 15, makes the function result available during compilation, which makes it possible to declare an array with the same number of elements as a second array whose size is computed from a braced initializer:

    ```cpp
    int keyVals[] = { 1, 3, 7, 9, 11, 22, 35 };  // 7 elements
    int mappedVals[arraySize(keyVals)]; // 7 elements
    std::array<int, arraySize(keyVals)> values;  // size == 7
    ```
2. `noexcept`, as explained in EMCpp 14, helps compilers generate better code.

# Function Arguments

Apart from arrays, function types can decay into function pointers, too. As a result:

```cpp
void someFunc(int, double); // someFunc is a function, type is void(int, double)

template<typename T>
void f1(T param);  // in f1, param passed by value

template<typename T>
void f2(T& param);  // in f2, param passed by ref

f1(someFunc);  // param deduced as ptr-to-func, type is void (*)(int, double)

f2(someFunc);  // param deduced as ref-to-func, type is void (&)(int, double)
```

This rarely makes any difference in practice.

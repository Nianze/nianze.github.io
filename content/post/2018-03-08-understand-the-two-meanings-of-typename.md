---
title: "Itemr-42 Understand the two meanings of typename"
date: 2018-03-08T19:19:28-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: understand the two meanings of typename
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-08.gif
---

When declaring template parameters, both `class` and `typename` are interchangeable. When identifying nested dependent type names, use `typename`, except in base class lists or as a base class identifier in a member initialization list.
<!--more-->

## In template parameter declaration

In the template declarations such as below:

```cpp
template<class T> class Widget;  // uses "class"
template<typename T> class Widget;  // uses "typename"
```

There's no difference between these two declarations, though using `typename` may be helpful to imply that the parameter need not be a class type. From C++'s point of view, `class` and `typename` means exactly the same in this case.

## Nested dependent type

Names in a template that are dependent on a template parameter are called `dependent names`. When a dependent name is nested inside a class, we can call it a _nested dependent name_. For example, considering following code, which actually won't compile due to the lack of `typename`:

```cpp
template<typename C>  // print 2nd element in container
void print2nd(const C& container)
{
    if (container.size() >= 2){
        C::const_iterator iter(container.begin()); // get iterator to 1st element
        ++iter;  // move iter to 2nd element
        int value = *iter;  // copy the 2nd element to an int
        std::cout << value;  // print the int
    }
}
```

In this example, `C::const_iterator` is not only a dependent name on the template parameter `C`, but also a nested dependent name, or more specifically, a _nested dependent type name_ (a nested dependent name that refers to a type). As a comparason, local variable `value` is of type int, independent of any template parameter, which is known as `non-dependent name`.

The reason why the code above doesn't compile is that, without `typename`, it is difficult to parse those nested dependent names. For example, if we make following declaration:

```cpp
template<typename C>
void print2nd(const C* container)
{
    C::const_iterator * x;
    ...
}
```

There are multiple possible ways to interprete this statement:

1. We assume `C::const_iterator` is a type, thus we're declaring `x` as a local variable that's a pointer to a `C::const_iterator`
2. We assume `C` has a static member that happens to be named `const_iterator`, and `x` happens to be the name of a global variable, so this statement is a multiplication of `C::const_iterator` by `x`

To resolve this ambiguity, C++ rules that the parser should not assume a nested dependent name in a template as a _type_, unless we explicitly specify it through `typename` keyword. Thus, the valid code for the above example should be like this:

```cpp
template<typename C>  // print 2nd element in container
void print2nd(const C& container)
{
    if (container.size() >= 2){
        typename C::const_iterator iter(container.begin()); // get iterator to 1st element
        ...
    }
}
```

### Real world usecase

In real code, it's representative that sometimes `typename` shows with another keyword `typedef` to save some typing time:

```cpp
template<typename IterT>
void workWithIterator(IterT iter)
{
    typedef typename std::iterator_traits<IterT>::value_type value_type;
    value_type temp(*iter);
}
```

Basically, this statement is to declare a local variable `temp` of the same type as what `IterT` objects point to, and it initializes `temp` with the object that `iter` points to. Here, the standard traits class (item 47) is to represent the type of thing pointed to by objects of type `IterT`. For example, if `IterT` is `list<string>::iterator`, then `temp` is of type `string`. Since `value_type` is nested inside `iterator_traits<IterT>`, and `IterT` is a template parameter, we must precede it by `typename`.

It is also worth noting that `typename` should be used to identify only nested dependent type names; other names shouldn't have it:

```cpp
template<typename C>                  // typename allowed (class also allowed): template parameter declaration
void f(const C& container,            // typename not allowed: C is not a nested dependent type name
       typename C::iterator iter);    // typename required: iter is a nested dependent type name
```

As a summary the general rule is: anytime we refer to a nested dependent type name in a template, we must immediately precede it by the word `typename`, except for the following two cases:

### Exceptions

There are two exception cases where `typename` must not precede nested dependent type names:

1. in a list of base classes
2. as a base class idenfifier in a member initialization list

For example:

```cpp
template<typename T>
class Derived: public Base<T>::Nested{  // case 1 - base class list: typename not allowd
public:
    explicit Derived(int x)            
    : Base<T>::Nested(x)    // case 2 - base class identifier in mem init. list: typename not allowd
    {
        typename Base<T>::Nested temp; // typename required: nested dependent type not in the two exception cases
        ...
    }
    ...
};
```

>P.S.: Actually, enforcement of the rules surrounding `typename` vary from compiler to compiler. Some compilers accept code where `typename` is required but missing; some accept code where `typename` is present but not allowd. This means the interaction of `typename` and nested dependent type names can lead to some portability headaches.
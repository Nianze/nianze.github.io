---
title: "[EMCpp]Item-27 Alternatives to Overloading on Universal References"
date: 2018-08-15T18:25:27-04:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: Alternatives to Overloading on Universal References
autoThumbnailImage: true
thumbnailImagePosition: right
featured_image: 2018/2018-08/15.gif
---

Universal reference parameters often have efficiency advantages, but they typically have usability disadvantages.
<!--more-->
<!-- toc -->

# Abandon overloading

This solution works for overloaded `logAndAdd` example in Item 26, where we break the overloaded function into two: `logAndAddName` and `logAndAddIdx`. However, this will not work for `Person` constructor - the constructor names are fixed by the language.

# Pass by `const T&`

This is the original function `void logAndAdd(const std::string& name)` we see in Item 26. Not efficient in some cases, but works as expected.

# Pass by value

According to the advice in Item 41, we may consider passing objects by value when we know we'll copy them. Thus, the `Person` example may get revised like this:

```cpp
class Person {
public:
    explicit Person(std::string n)
    : name(std::move(n)) {}
    explicit Person(int idx)
    : name(nameFromIdx(idx)) {}
    ...
private:
    std::string name;
};
```

With this design, `int`-like arguments get passed to `int` overload, and arguments of type `std::string` (and anything from which `std::string` could be created, e.g., literals) get passed to the `std::string` overload.


# Use Tag dispatch

Add another "tag" parameter to help compiler differentiate the overloading cases as we want:

```cpp
template<typename T>
void logAndAdd(T&& name)
{
    logAndAddImpl(
        std::forward<T>(name),
        std::is_integral<typename std::remove_reference<T>::type>()
    );
}

template<typename T>
void logAndAddImpl(T&& name, std::false_type)
{
    auto now = std::chrono::system_clock::now();
    log(now, "logAndAdd");
    names.emplace(std::forward<T>(name));
}

std::string nameFromIdx(int idx);

template<typename T>
void logAndAddImpl(T&& name, std::true_type)
{
    logAndAdd(nameFromIdx(idx));
}
```

Conceptually, `true` and `false` are _runtime_ values, and what we need here for the tag parameter should be _compil-time_ types that corresponds to `true` and `false`, which in the Standard Library are called `std::true_type` and `std::false_type`. This compile-time variables serve no purpose at runtime, so some compilers who's smart enough may recognize these tag parameters and optimize them out of the program's execution image.

Tag dispatch is a standard building block of template metaprogramming to let the tag determine which overload gets called, so that overloading on universal references may work as expect.

# Use `enable_if` to constrain templates that take universal references

Tag dispatch solves some of the problems related with templates taking universal references, but not all of them. The perfect-forwarding constructor for the `Person` class, for example, remains problematic: even if we write only one constructor and apply tag dispactch technique to it, some constructor calls (copy from `const` vs non-`const` lvalues) may sometimes be handled by compiler-generated functions (e.g., copy and move constructors) that bypass the tag dispatch system.

Thus, we want to constrain on when the function template is permitted to be employed. By default, all templates are _enabled_, but a template using `std::enable_if` is enabled only if the condition specified by `std::enable_if` is satisfied. 

In the case of `Person`'s perfect forwarding constructor, we want to enable its instantiation only if the type being passed isn't `Person`, so that the class's copy or move constructor my handle the calls where a `Person` object gets passed in. Specifically, when checking the type of the argument being passed, we want to ignore its referenceness, constness, and volatileness using `std::decay<T>`:

```cpp
class Person {
public:
    template<
        typename T,
        typename = typename std::enable_if<
                        !std::is_same<Person,
                                      typename std::decay<T>::type
                                     >::value
                   >::type
    >
    explicit Person(T&& n);
    ...
};
```

Moreover, if we want to make sure the derived class work properly, the conditions for `std::enble_if` get more restricted: we want to enable it for any argument type other than _`Person` or a type derived from `Person`_. To determian whether one type is derived from another, we can use `std::is_base_of<T1, T2>`:

```cpp
class Person {
public:
    template<
        typename T,
        typename = typename std::enable_if<
                        !std::is_base_of<Person,
                                         typename std::decay<T>::type
                                        >::value
                   >::type
    >
    explicit Person(T&& n);
    ...
};
```

In C++14, by employing alias templates, we can save some typing for `typename` and `::type`:

```cpp
class Person {
public;
    template<
        typename T,
        typename = std::enbale_if_t<
            !std::is_base_of<Person, std::decay_t<T>>::value
        >
    >
    explicit Person(T&& n);
    ...
};
```

Finally, to get our perfect forwarding constructor to work with the `int` overload, we have to add another constrain in `std::enbale_if` to check the integral arguments type:

```cpp
class Person {
public;
    template<
        typename T,
        typename = std::enbale_if_t<
            !std::is_base_of<Person, std::decay_t<T>>::value
            &&
            !std::is_integral<std::remove_reference_t<T>>::value
        >
    >    
    explicit Person(T&& n)   // ctor for std::strings and args convertible to std::strings
    : name(std::forward<T>(n))
    { ... }

    explicit Person(int idx) // ctor for integral args
    : name(nameFromIdx(idx))
    { ... }

    ...                      // copy and move ctors, etc.
private:
    std::string name;
};
```

To make even more effective code, considering some kinds of arguments can't be perfect-forwarded, as well as the fact that forwarding functions tend to create lengthy error messages, which is debug-unfriendly, we can use `static_assert`, accompanied with `std::is_constructible`, to perform a compile-time test to determine whether an object of one type can be constructed from an object (or a set of objects) of a different type (or set of types):

```cpp
class Person {
public;
    template<
        typename T,
        typename = std::enbale_if_t<
            !std::is_base_of<Person, std::decay_t<T>>::value
            &&
            !std::is_integral<std::remove_reference_t<T>>::value
        >
    >    
    explicit Person(T&& n)   // ctor for std::strings and args convertible to std::strings
    : name(std::forward<T>(n))
    { 
        static_assert(
            std::is_constructible<std::string, T>::value,
            "Parameter n can't be used to construct a std::string"
        );
        ...  // the usual ctor work goes here
    }
    ...
};
```

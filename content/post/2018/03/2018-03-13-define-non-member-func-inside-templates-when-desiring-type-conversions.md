---
title: "Item-46 Define non-member function inside templates when type conversions are desired"
date: 2018-03-13T12:23:40-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: define non-member function inside templates when type conversions are desired
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-13.gif
---

When writing a class template that offers functions related to the template that support implicit type conversions on all parameters, define those functions as friends inside the class template.
<!--more-->

If we want  to do implicit type conversion on all arguments, we should use non-member functions (item 24). Now we want a templatized version of `Rational` class to support the same mixed-mode arithmetic as shown in item 24, and the code could start like this:

```cpp
template<typename T>
class Rational {
public:
    Rational(const T& numerator = 0, // see item 20 for why params are passed by ref
             const T& denominator = 1);
    const T numerator() const;    // see item 28 for why return values are passed by value
    const T denominator() const;  // see item 3 for why return values are const
};

template<typename T>
const Rational<T> operator*(const Rational<T>& lhs,
                            const Rational<T>& rhs)
{...}
```

However, this simple update to templatized version will not compile for following code:

```cpp
Rational<int> oneHalf(1, 2);
Rational<int> result = oneHalf * 2;  // error! won't compile
```

The problem here is that **implicit type conversion functions are _never_ considered during template argument deduction**. This means it is impossible for the compilers to convert the second parameter `2` into a `Rational<int>` using non-explicit constructor, so compilers can't figure out what `T` is for this function template named `operator*` taking two parameters of type `Rational<T>`, can't deduce parameter types for this function templates, and thus can't instantiate the appropriate functions. In the end, the function we want to call fails to be declared, before we could apply implicit type conversions during a later function call.

### Solve the compiling issue

How to declare the `operator*` properly? Notice that class templates don't depend on template argument deduction (this process only applies to function templates), so `T` is always known at the time the class `Rational<T>` is instantiated. Combine this knowledge with another fact that a `friend` declaration in a template class refers to a specific _function_ (not a function _template_), so as part of the class instantiation process, the friend function will be automatically declared. Taking advantage of these 2 points, we could update the code to a new version[^1]:

```cpp
template<typename T>
class Rational {
public:
    ...
    friend  // declare operator* function
    const Rational operator*(const Rational& lhs, 
                             const Rational& rhs);
};
```
```cpp
template<typename T>  // define operator* function
const Rational<T> operator*(const Rational<T>& lhs,  
                            const Rational<T>& rhs)
{...}
```

When the `oneHalf` is declared to be of type `Rational<int>`, the class `Rational<int>` is instantiated, and the friend function `operator*` that takes `Rational<int>` parameters is then declared automatically. As a declared function, compilers can use implicit conversion functions (such as `Rational`'s non-explicit constructor) when calling it, making the mixed-mode call compile.

### Solve the linking issue

Yes, the code compiles. Yet it won't link.

This time, the problem is that the target function `operator*` is only _declared_ inside `Rational`, not _defined_ there. Indeed, the `operator*` template outside the class is intended to provide that definition, but things don't work this way, and linkers can't find the definition. 

To solve it, the simplest thing is to put the function body into its declaration:

```cpp
template<typename T>
class Rational {
public:
    ...
    friend 
    const Rational operator*(const Rational& lhs, 
                             const Rational& rhs)
    {
        return Rational(lhs.numerator() * rhs.numerator(),
                        lhs.denominator() * rhs.denominator()); // same impl as item 24
    }

};
```

This works as intended: mixed-mode calls to `operator*` now compiles, link, and run.

This design is, in some sense, kind of unconventional, because the use of friendship has nothing to do with a need to access non-public parts of the class. We declared it as `friend` because it is the only choise we have:

* to make type conversions possible on all arguments, we need a non-member function (item 24)
* to have the proper function automatically instantiated, we need to declare the function inside the class
* the only way to declare a non-member function inside a class is to make it a friend

### Have the friend call a helper

Such functions as `operator*` defined inside a class are implicitly declared `inline` (item 30), so we may minimize the impact of such `inline` declarations by having `operator*` do nothing but call a helper function defined outside of the class, especially when the function body is complex.

```cpp
template<typename T> class Raional;  // declare Rational template

template<typename T>  // helper template
const Rational<T> doMultiply(const Rational<T>& lhs,
                             const Rational<T>& rhs); 
template<typename T>
class Rational {
public:
    ...
    friend // have friend call helper
    const Rational operator*(const Rational& lhs, 
                             const Rational& rhs)
    { return doMultiply(lhs, rhs); }
    ...
};
```

Many compilers force us to put all template definitions in header files, so we may need to define `doMultiply` in the header as well:

```cpp
template<typename T> 
const Rational<T> doMultiply(const Rational<T>& lhs,
                             const Rational<T>& rhs)
{
    return Rational<T>(lhs.numerator() * rhs.numerator(),
                       lhs.denominator() * rhs.denominator());
}
```

Here, `doMultiply` is a template, so it won't support mixed-mode multiplication. The workflow is like this:

* The friend function `operator*` supports mixed-mode operations and is in charge of necessary type conversions, ending with two `Rational` objects passed to `doMultiply`
* These two objects are feed to an appropriate instantiation of the `doMultiply` helper _template_, which then do the actual multiplication

[^1]: It is worth to know the syntax used to decalre `operator*` inside `Rational`. Inside a class template, the name of the template can be used as shorthand for the template and its parameters, so inside `Rational<T>`, we can write `Rational` instead of `Rational<T>`. It will be the same effect if we declare `operator*` inside `Rational<T>` like this: `friend const Rational<T> operator*(const Rational<T>& lhs,  const Rational<T>& rhs)`.

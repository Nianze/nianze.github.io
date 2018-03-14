---
title: "Item-46 Define non-member function inside templates when type conversions are desired"
date: 2018-03-13T12:23:40-04:00
categories:
- article
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

The problem here is that implicit type conversion functions are _never_ considered during template argument deduction. Let's view this problem in the perspective of compilers: for some function named `operator*` taking two parameters of type `Rational<T>`, compilers found a type of `Rational<int>`   thus C++ compilers can't figure out what T is, thus unable to do the instantiation . before we can call a function, we have to know which functions exist. In order to know that, we have to deduce parameter types for the relevant function templates so that we can instantiate the appropriate functions
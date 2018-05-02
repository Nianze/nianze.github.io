---
title: "Item-24 Declare non-member functions when type conversions should apply to all parameters"
date: 2018-02-12T22:47:20-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: when to declare non-member functions 
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-02/2018-02-12.jpg
---

If we need type conversions on all parameters to a function including the one pointed to by the `this` pointer, the function must be a non-member.
<!--more-->

Having classes support implicit type conversions is generally a bad idea. One good and common exception to the rule is when creating numerical types, for example, we want to allow implicit conversions from integers to user-defined rationals type:

```cpp
class Rational {
public:
    Rational(int numerator = 0,    // ctor is deliberately not explicit, 
             int denominator = 1); // allowing implicit int-to-Rational conversion
    int numerator() const;     // accessor for numerator
    int denominator() const;   // accessor for denominator, see item 22
private:
    ...
};
```

We'd like to support arithmetic operation of multiplication, and one way is to declare it as a member function of `Rational`:

```cpp
class Rational {
public:
    ...
    const Rational operator*(const Rational& rhs) const; // return const: item 3; taking a reference-to-const as argument: item 20, 21
};
```

This design is fine to multiply rationals with rationals:

```cpp
Rational oneEighth(1, 8);
Rational oneHalf(1, 2);

Rational result = oneHalf * oneEighth;  // fine
result = result * oneEighth;   // fine
```

However, for mixed-mode operations, where `Rational`s is multiplied with `int`s, there will be a potential error:

```cpp
result = oneHalf * 2;  // fine
result = 2 * oneHalf;  // error!
```

This problem is clearer for analysis when we rewrite the last two examples in their equivalent functional form:

```cpp
result = oneHalf.operator*(2);   // fine
result = 2.operator*(oneHalf);   // error!
```

For the first statement:   
the object oneHalf is an instance of a class that contains an `operator*` taking a `Rational` as its argument. Compilers know we're passing an `int` and that the function requires a `Rational`, and they also know they can conjure up a suitable `Rational` by implicit type conversion - calling the `Rational` constructor with the `int` we provided, so compilers will happily call that function as if it had been written like this:

```cpp
const Rational temp(2);  // create a temporary Rational object from 2
result = oneHalf * temp;  // same as oneHalf.operator*(temp);
```

Of course, compilers are allowed to do this implicit type conversion only because a non-explicit constructor is involved. If we add keyword `explicit` before the constructor above, neither of the two mixed-type multiplication statements would compile.

Now for the second statement:   
it turns out that parameters are eligible for implicit type conversion _only if they are listed in the parameter list_. The implicit parameter pointed to by `this`, which is also the obejct on which the member function is invoked, is _never_ eligible for implicit conversions. Back to the second statement, `int` type `2` does not have associated class containing a function `operator*` taking a `Rational` type object as its argument, nor is `2` listed in the parameter list for an implicit type conversion to `Rational`. That is the cause of compilation failure.

In fact, when compilers fail to find a matching member function, they will also look for non-member `operator*`s (i.e., ones at namespace or global scope) that can be called like this:

```cpp
result = operator*(2, oneHalf);
```

And this is exactly what we want if we'd like to support mixed-mode arithmetic: make `opeartor*` a non-member function, thus allowing compilers to perform implicit type conversions on _all_ arguments:

```cpp
class Rational {
    ...     // contains no operator*
};
const Rational operator*(const Rational& lhs, const Rational& rhs)  // now a non-member function
{
    return Rational(lhs.numerator() * rhs.numerator(),
                    lhs.denominator() * rhs.denominator());
}

Rational oneForth(1, 4);
Rational result;

result = oneForth * 2;  // fine
result = 2 * oneForth;  // it works now
```

Now comes anoter worry: should `operator*` be made a friend of the `Rational` class?   
In this case, the answer is no, because `operator*` can be implemented entirely through `Rational`'s public interface. This leads to an important observation:

>The opposite of a member function is a non-member function, not a frient function.

There's some misunderstanding that if a function is related to a class and should not be a member (due, for example, to type conversions on all arguments), it should be a friend. This reasoning turns out to be flawed. The basic rule is to avoid friend functions whenever we can.

>P.S.: This item contains the truth, but it is not the whole truth. When we cross the line from Object-Oriented C++ into Template C++ (item 1), and make `Rational` a class _template_ instead of a class, refer to item 46 for some new issues to consider, new ways to solve them, and new design implications.
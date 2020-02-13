---
title: "Item-21 Don't return a reference when we have to return an object"
date: 2018-02-09T18:02:23-05:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: do not return a ref when must return an object
autoThumbnailImage: false
thumbnailImagePosition: right
featured_image: 2018/2018-02/2018-02-09.jpg
---

Never return a pointer or reference to a local stack object, a refenrence to a heap-allocated object, or a pointer or reference to a local static object if there is a change that more than one such object will be needed (item 4 provides a "counter" example that is reasonable in single-threaded environments).
<!--more-->
<!-- toc -->

# Case Study

There are some situations where we **must** return an object, no matter how much effort we want to put into rooting out the evil of pass-by-value to pursue the heighest efficiency. Otherwise, we may invariably make a fatal mistake: pass references to objects that don't exist.

Consider following class for representing rational numbers with a multiplying function:

```cpp
class Rational {
public:
    Rational(int numerator = 0,     // see item 24 for why this
            int denominator = 1);   // ctor isn't declared explicit
...
private:
    int n,d; // numerator and denominator
friend:
    const Rational  // see item 3 for why the return type is const
    operator**(const Rational& lhs,
               const Rational& rhs);
};
```

We may want to remove the cost of construction and destruction from return-by-value, considering using return by reference instead. However, a reference is just a name for some _existing_ object. In the case of `opeartor*`, the product of the two object does not exist before we call the function, so if `operator*` want to return a reference to the product, it must create the result itself.

A function can create a new object in only two ways: on the stack or on the heap.

# Return a pointer or reference to a local stack object

Creation on the stack is accomplished by defining a local variable:

```cpp
const Rational& operator*(const Rational& lhs, const Rational& rhs) // bad code !
{
    Rational result(lhs.n * rhs.n, lhs.d * rhs.d);
    return result;
}
```

There's a serious problem: the function returns a reference to `result`, which is a local object, and local objects are destroyed when the function exits, ending to return a reference to an ex-`Rational`. Any caller glancing at this return value would instantly enter the realm of undefined behavior.

The fact is, any function returning a reference (or a pointer) to a local object is brocken.

# Return a reference to a heap-allocated object

Heap-based objects come into being through the use of `new`, so the heap-based `opearator*` looks like this:

```cpp
const Rational& operation*(const Rational& lhs, const Rational& rhs) // bad code !
{
    Rational *result = new Raional(lhs.n * rhs.n, lhs.d * rhs.d);
    return *result;
}
```

Now comes a different problem: who will apply `delete` matching the use of `new`?

Even if callers are conscientious and well intentioned, there's not much they can do to prevent leaks in reasonable usage scenarios like this:

```cpp
Rational x, y, z;

Rational w = x * y * z; // same as operator*(operator*(x,y),z)
```

There are twoe uses of `new` that need to be undone with uses of `delete`. Yet there's no reasonable way for clients to get at the pointers hidden behind the references being returned from the calls to `operator*` and make calls to `delete`. This is a guaranteed resource leak.

# Return a reference to a local static object

If, however, we jump outside of the box, considering returning a reference to a _static_ `Rational`, and think that this will avoid all but one initial constructor call without suffering from calling a constructor for each product result returned from `operatior*` in above on-the-stack and on-the-heap approaches:

```cpp
const Rational& operator*(const Rational& lhs, const Rational& rhs) // bad code !
{
    static Rational result;  // static object
    result = ...; // put the product inside result
    return result;
}
```

Like all designs employing the use of static objects, this one immediately raises thread-safety hackles, but there's a deeper flaw: consider following perfectly reasonable client code:

```cpp
bool operator==(const Rational& lhs, const Rational& rhs); 
Rational a,b,c,d;
...
if ((a * b) == (c * d)) {
    // do whatever appropriate when the products are equal
} else {
    // do whatever appropriate when the products are unequal
}
```

Problem here is that the expression `((a * b) == (c * d))` will _always_ evaluate to `true`, regardless of the values of a, b, c, and d.

Let's rewrite the code in its equivalent functional form to understand what happened:

```cpp
if (operator==(operator*(a, b), operator*(c, d)))
```

When `operator==` is called, there will already be two active calls to `opearator*`, each of which will return a reference to the static `Rational` object inside `opeartion*`, which, as is a static local object, will always be the exact one, with same value.

Some may ask,

> Well, if _one_ static isn't enough, maybe a static _array_ will do the trick...

The problem is, however, it is very hard to implement this arry of size `n`:

* if `n` is too small, we may run out of places to store return values and fall back to the single-static design situation; 
* if `n` is too big, we'll decrease the performance of the program, because every object in the array will be constructed the first time the function is called - a cost of `n` constructors and equally `n` destructors even if the function is called only once.
* how to put the values we need into the array's objects and what is the cost. The most direct way is via assignment, which cost the same as a call to a destructor (to destroy the old value) plus a call to a constructor (to copy over the new value)
* how to decide the position of target result in the array

# The right way: return by value

The right way to write a function that must return a new object is to have that function reutrn a new object like this or something essentially equivalent:

```cpp
inline const Rational operator*(const Rational& lhs, const Rational& rhs)
{
    return Rational(lhs.n * rhs.n, lhs.d * rhs.d);
}
```

In the long run, the cost of constructing and destructing `operator*`'s return value is a small price to pay for correct behavior. What's more, since C++ allows compiler implementers to apply optimizations to immprove the performance of the generated code, it turns out that in some cases, construction and destruction of `operator*`'s return value can be safely eliminated, so the program will run faster than we expect and still behave correctly as it's supposed to be.

In summary, when deciding between returning a reference and returning an object, we should make choice that offers correct behavior.

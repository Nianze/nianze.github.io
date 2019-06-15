---
title: "[MECpp]Item-5 Be Wary of User Defined Conversion Functions"
date: 2018-03-27T18:53:56-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Be Wary of User Defined Conversion Functions
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-27.gif
---

Implicit type conversions usually lead to more harm than good, so don't provide conversion functions unless we're sure we want them.
<!--more-->

There are two kinds of functions allowing compilers to perform implicit type conversions: 

* implicit type conversion operators
* non-explicit single-argument constructors

## Implicit type conversion operators

```cpp
class Rational {
public:
    ...
    operator double() const; // converts Rational to double
};
```

This implicit type conversion function will be automatically invoked in contexts like this:

```cpp
Rational r(1, 2);    // r has a value 1/2
double d = 0.5 * r;  // converts r to a double, then do multiplication
count << r;          // will print a floating point number instead of 1/2 if lacking difinition of operator<<
```

Suppose we forget to write an `operator<<` for `Rational` objects, and expect the attempt to print `r` would fail due to the lack of appropriate `operator<<` to call. However, in the lack of `operator<<`, compilers are happy to find an acceptable sequence of implicit type conversions they could apply to make the call succeed. In this case, they will discover they could make the call succeed by implicitly converting `r` to a `double` by calling `Rational::operator double`, leading to _wrong_ (often unexpected) function being called.

Solution: replace the implicit type conversion operators with equivalent functions that don't have the syntactically magic names, just like the explicit member function `c_str` in `string` type from standard C++ library (MECpp item 35):

```cpp
class Rational {
public:
    ...
    double asDouble() const;  // converts Rational to double
};
```

```cpp
Rational r(1, 2);

cout << r; // error! no operator<< for Rationals
cout << r.asDouble();  // fine, prints r as a double
```

## Single-argument constructor

```cpp
template<class T>
class Array {
public:
    Array(int lowBound, int highBound); // specify a range of array indices, ineligible for type-conversion
    Array(int size);  // specify the number of elements in the array, can be used as a type conversion function
    
    T& operator[](int index);
    ...
};
```

The problem of implicit type conversion occurs in following condition:

```cpp
bool operator==(const Array<int>& lhs, const Array<int>& rhs);
Array<int> a(10);
Array<int> b(10);
...
for (int i = 0; i < 10; ++i) {  // oops! "a" should be "a[i]"
    if (a == b[i]) {
        ....
    } else {
        ...
    }
}
```

Here, we mistakenly omitted the subscripting syntax when typing `a`. We expect this will cause compilers complaining, but they will not:

* Compilers see a call to `operator==` taking type `Array<int>` (for `a`) and `int` (for `b[i]`), and fail to find the corresponding function
* There's a `operator==` taking two `Array<int>` type arguments, and compilers are able to convert the `int` into an `Array<int>` object by calling `Array<int>` constructor that taking a single `int` as an argument, ending up with something like this[^1]:

    ```cpp
    for (int i = 0; i < 10; ++i) {
        if (a == static_cast< Array<int> >(b[i])) ...
    }
    ```

Each iteration through the loop compares the contents of `a` with the contents of a temporary array of size `b[i]` (whose contents are presumably undefined and will be created and destroyed in every loop, see MECpp item 19), which is both unwanted and tremendously inefficient behavior.

There are two solutions: use keyword `explicit` or creating proxy classes.

### Solution 1: Keyword `explicit`

```cpp
template<class T>
class Array {
public:
    ...
    explicit Array(int size);  // use "explicit" to prevent implicit type conversion    
    ...    
};
```

### Solution 2: Proxy classes

```cpp
template<class T>
class Array {
public:
    class ArraySize {
    public:
        ArraySize(int numElements): theSize(numElements) {}
        int size() const { return theSize; }
    private:
        int theSize;
    };

    Array(int lowBound, int highBound);
    Array(ArraySize size);  // new declaration
    ...
};
```

```cpp
Array<int> a(10); // convert 10 to a temp. ArraySize object, then feed that temp. object to Array<int> ctor.

for (int i = 0; i < 10; ++i) {
    if (a == b[i]) ...   // error now!
}
```

One of the rules governing implicit type conversions is that no sequence of conversions is allowed to contain more than one user-defined conversion (i.e., a call to a single-argument constructor or an implicit type conversion operator). The above class difinition adopting a general technique called _proxy classes_ takes advantage of this rule, ending up with ideal behavior that the object constructions we want to allow are legal, but the implicit conversions we don't want to allow are illegal (compilers in one implicit conversion can't call two user-defined conversions, one from `int` to `ArraySize` and one from `ArraySize` to `Array<int>`).

Proxy objects can give us control over aspects of software's behavior that is otherswise beyond our grasp. For more detail, refer to MECpp item 30.

[^1]: The space separating the two ">" characters has its purpose: without it, the statement will be like `static_cast<Array<int>>(b[i])`, and some C++ compilers parsing ">>" as a single token, ending up with a syntax error.

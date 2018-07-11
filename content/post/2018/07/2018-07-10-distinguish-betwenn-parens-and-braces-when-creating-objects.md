---
title: "[EMCpp]Item-7 Distinguish Betwenn () and {} When Creating Objects"
date: 2018-07-10T18:55:06-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Distinguish Betwenn () and {} When Creating Objects
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-07/10.gif
---

Braced initialization is the most widely usable initialization syntax, which can also prevent narrowing conversions, as well as being immune to C++'s most vexing parse.
<!--more-->

## The good part

#### Syntacticly widest usage

Syntax choices for object initialization in C++11 are confusing to support 3 forms: parentheses, equal signs, and braces.

```cpp
int x(0);   // initializer with parentheses
int y = 0;  // initializer with "="
int z{ 0 }; // initializer with braces
int zz = {0}; // initializer with "=" and braces, treated the same as braces-only version.

Widget w1;  // default ctor.
Widget w2 = w1; // copy ctor
w1 = w2;  // assignment, calls copy operator=

// easy to specify the init. content of a container
std::vector<int> v{ 1, 3, 5 };  // v's init. content is 1, 3, 5

// specify default init. value for non-static data members, where parentheses not allowed
class Widget {
    ...
private:
    int x{ 0 }; // fine
    int y = 0;  // fine
    int z(0);   // error
};

// specify init. value for uncopyable objects (EMCpp item 40), where "=" not allowed
std::atomic<int> ai1{ 0 }; // fine
std::atomic<int> ai2(0);   // fine
std::atomic<int> ai3 = 0;  // error
```

From the example above, it's easy to see why braced initialization is called "uniform" - a single initialization syntax that aims to be used anywhere and express everything.

#### Preventing narrowing conversion

Braced initialization prohibits implicit _narrowing conversions_ among built-in types:

```cpp
double x, y, z;
...
int sum1{ x + y + z }; // error
int sum2(x + y + z);  // okay to truncate value of expression to an int
int sum3 = x + y + z; // ditto
```

#### Immune to most vexing parse

_Most vexing parse_: anything that can be parsed as a declaration must be interpreted as one. This may be annoying when developers want to default-construct an object, but inadvertently end up declaring a function instead. Using braces, we don't have such an issue:

```cpp
Widget w1(10); // call Widget ctor with arg. 10
Widget w2();  // intend to call a Widget const. with zero arg., end up declaring a func. named w2 that returns a Widget
Widget w3{}; // calls Widget ctor with no args.
```

## The not-so-good part

#### Unintuitive behavior with `auto`

As EMCpp item 2 explains, when an `auto`-declared variable has a braced initializer, the type deduced is `std::initializer_list`, which may lead to surprising behaviors sometimes.

#### (Too) high overloading priority

Calls using braced initialization syntax strongly prefer the overloads taking `std::initializer_list`s: if there's any way for compilers to construe a call using a braced initializer to be to a constructor taking a `std::initializer_list`, compilers will employ that interpretation:

```cpp
class Widget {
public:
    Widget(int i, bool b);
    Widget(int i, double d);
    Widget(std::initializer_list<long double> il);
    operator float() const; // convert to float
    ...
};

Widget w1(10, true); // calls first ctor.
Widget w2{10, true}; // calls std::initializer_list ctor, 10 and true convert to long double
Widget w3(10, 5.6); // calls second ctor
Widget w4{10, 5.6}; // calls std::initializer_list ctor, 10 and 5.6 convert to long double
Widget w5(w4); // calls copy ctor
Widget w6{w4}; // calls std::initializer_list ctor, w4 converts to float, and float converts to long double
Widget w7(std::move(w4)); // calls move ctor
Widget w8{std::move(w4)}; // calls std::initializer_list ctor, same conversion as w6
```

The priority is so high that it prevails even if the best-match `std-initializer_list` constructor can't be called:

```cpp
class Widget {
public:
    Widget(int i, bool b);
    Widget(int i, double d);
    Widget(std::initializer_list<bool> il); // no implicit conversion funcs
    ...
};

Widget w{10, 5.0}; // error: requires narrowing conversions. The other callable ctors is shadowed
```

Only if there's no way to convert the types of the arguments in a braced initializer to the type in a `std::initializer_list` do compilers fall back on normal overload resolution:

```cpp
class Widget {
public:
    Widget(int i, bool b);
    Widget(int i, double d);
    Widget(std::initializer_list<std::string> il); // no implicit conversion funcs
    ...
};

Widget w1(10, true);  // calls first ctor
Widget w2{10, true};  // calls first ctor
Widget w3(10, 5.0);  // calls second ctor
Widget w3{10, 5.0};  // calls second ctor
```

**Edge case**: Empty braces mean no arguments, not an empty `std::initializer_list`. For example

```cpp
class Widget {
public:
    Widget();
    Widget(std::initializer_list<int> il); // no implicit conversion funcs
    ...
};

Widget w1; // calls default ctor
Widget w2(); // calls default ctor
Widget w3{}; // calls default ctor
Widget w4({}); // calls std::initializer_list ctor with empty list
```
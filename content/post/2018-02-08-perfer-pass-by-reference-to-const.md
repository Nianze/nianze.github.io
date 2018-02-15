---
title: "Item-20 Perfer pass-by-reference-to-const to pass-by-value"
date: 2018-02-08T16:26:33-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: perfer pass-by-reference-to-const
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-02/2018-02-08.jpg
---

Pass by reference-to-`const` is typically more efficient than pass by value and avoids the slicing problem. 
<!--more-->

Pass-by-value can be an expensive operation. For example, consider the following class hierarchy:

```cpp
class Person {
public:
    Person();  // parameters omitted for simplisity
    virtual ~Person();  // item 7 explains why virtual
    ...
private:
    std::string name;
    std::string address;
};

class Student:public Person {
public:
    Student();   // parameters omitted for simplisity
    ~Student();
    ...
private:
    std::string schoolName;
    std::string schoolAddress;
};
```

Now consider what will happen if we call a function `validateStudent`, which takes a `Student` argument (by value) and returns whether it is a real student:

```cpp
bool validateStudent(Student s);  // pass a Student object by value
Student plato;
bool platoIsOK = validateStudent(plato); // call the function
```

A `Student` object has two `string` object within it, while its base class `Person` contains two additional `string` type data members. So the parameter-passing cost of this function is one call to the `Student` copy constructor matched with two `string` copy constructor, and one call to the base class `Person`'s copy constructor, which also entails two more `string` construction. When the `Student` object is destroyed, each constructor call is matched by a destructor call. Overall, the cost of passing a `Student` by value is six constructors and six destructors.

It would be nice is there were a way to bypass all those constructions and destructions. The answer is: pass by reference-to-`const`:

```cpp
bool validateStudent(const Student& s);
```

Since no new objects are being created, there's no constructor or destructor call. The `const` in the revised parameter declaration is important, for it guarantees that the callers would not worry about `validateStudent` making changes to the `Student` they passed in (when passing by value, `validateStudent` would be able to modify only a _copy_ of the `Student` they passed in, so the callers know they are shielded from any changes the function might make to the `Student`).

Apart from efficiency, passing parameters by reference also avoids the `slicing problem`: when a derived class object is passed (by value) as a base class object, the base class copy constructor is called, and the extra features in derived class object are "sliced" off. For example:

```cpp
class Window {
public:
    ...
    std::string name() const;     // return name of window
    virtual void display() const; // draw window and contents
};

class windowWiScroBars: public Window {
public:
    ...
    virtual void display() const;
};
```

Below is a bad example if you want to write a function to print out a window's name and then display the window:

```cpp
void printNameAndDisplay(Window w)
{
    std::cout << w.name();
    w.displey();
}
```

When you call this functiona with a `WindowWithScrollBars` object:

```cpp
WindowWithScrollBars wwsb;
printNameAndDisplay(wwsb);
```

Since it is passed by value, the parameter `w` will be constructed as a `Window` object. Regardless of the type of object passed to the function, inside `printNameAndDisplay`, `w` will act like an object of class `Window` (it *is* an object of class `Window` after all), and all the specialized information that made `wwsb` act like a `WindowWithScrollBars` object will be sliced off.

However, if we revised the function declaration like this:

```cpp
void printNameAndDisplay(const Window& w)  // fine, parameter won't be sliced
{
    std::cout << w.name();
    w.display();
}
```

Now `w` will act like whatever kind of window is actually passed in.

### Exception

In general, the only types for which we can reasonably assume that pass-by-value is inexpensive are:

* built-in types
* STL iterator 
* function object types

Under the hood of the C++ compiler, a reference is implemented as pointers, so passing by reference usually means passing a pointer. This is why for built-in types (e.g., an `int`), it's more efficient to pass it by value than by reference. Also, iterators and function objects in the STL are more efficient to copy and are not subject to the slicing problem because they are designed to be passed by value (this is an example where rules change depending on which part of C++ we are using, see item 0).

On the other hand, we can not conclude that all small types are necessarily good pass-by-value candidate:

1. the user-defined types, despite being small in terms of size, may have expensive copy constructors, such as most STL containers that contain little more than a pointer but leading to copying everything they point to when applying copying operation.

2. even if the copy constructors are inexpensive, compilers may treat user-defined small types differently with buiilt-in types: for example, some compilters refuse to put objects consisting of only a `double` into a register, even though they will happily place naked `double`s there, so we can be better off passing such objects by reference, for compilers will certainly put pointers (the implementation of references) into registers.

3. a type that is small now may be bigger in a future release, for its internal implementation may change; things can even change when we switch to a different C++ implementation, for example, some implementations of the standard library's `string` type are seven times as big as others.

In summary, for everything else other than built-in types and STL iterator and function object types, follow the advice and prefer pass-by-reference-to-`const` over pass-by-value.
---
title: "Item-5 What functions C++ silently generates"
date: 2018-01-23T18:42:07-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: functions silently created
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-01/2018-01-23.jpg
---

Compilers may implicitly generate their own versions of default constructor, copy constructor, copy assignment operator, and destructor.
<!--more-->

All the compiler generated functions will be both `public` and `inline` (item 30). An empty class declared like this:

```cpp
class Empty{};
```

is essentially equivalent to:

```cpp
class Empty {
public:
    Empty() { ... } // default constructor
    Empty(const Empty& rhs) { ... } // copy constructor
    ~Empty() { ... }  // destructor
                      // will be _virtual_ only if inheriting 
                      // from a base class with virtual destructor
    Empty& operator=(const Empty& rhs) { ... } // copy assignment operator
};
```

These functions are generated only if they are needed:

```cpp
Empty e1;     // default constructor and destructor generated
Empty e2(e1); // copy constructor generated
e2 = e1;      // copy assignment operator generated
```

Basically, the generated default `constructor` and the `destructor` will invocate constructors and destructors of base classes and non-static data members, while the `copy constructor` will simply copy each non-static data member of the source object to the target object.

>specifically,   
1. for data member of user-defined type, call the data member's copy constructor with source object's corresponding member's value as argument  
2. for data member of built-in type, directly copy the corresponding source data member's bits

Copy assignment operator behaves generally the same as copy constructor, but the code is only generated when the resulting code is both legal and has a reasonable chance of making sense. For example:

```cpp
template<class T>
class NamedObject {
public:
    NamedObject(std::string& name, const T& value);
    ...
private:
    std::string& nameValue;  // a reference
    const T objectValue;     // a const
}
```

In below situation, implicitly generated copy assignment operator will make no sense for nameValue and illegal for objectValue:

```cpp
std::string youngMan("child");
std::string oldMan("adult");

NamedObject<int> p(youngMan, 10);
NamedObject<int> s(oldMan, 50);

p = s; // nameValue assignment will make no sense!
       // objectValue assignment will be illegal due to its constness
```

Since p.nameValue and s.nameValue refer to different string object, the assignment will be in a conundrum: 

1. should compiler choose to let p.nameValue refer to new string object? (actually C++ does not allow reference referring to different one)?
2. should compiler choose to change the string content "child" to "adult"? (this will affect other objects that hold pointers or references to original string "child")

Neither will be sensible, so C++ refuses to compile the code. In this situation, a copy assignment operator must be defined manually.

Finally, derived classes will not be able to have generated implicit copy assignment operators if base classes declare the copy assignment operator _private_, for derived copy assignment operators are supposed to handle base class parts, but they don't have the right to invoke the base member functions in this situation.
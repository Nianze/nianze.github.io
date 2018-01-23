---
title: "Initialize objects before they're used"
date: 2018-01-22T18:47:54-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: initialize before use
autoThumbnailImage: false
#thumbnailImagePosition: right
#thumbnailImage: /images/2018-01-19.jpg
---

Since C++ is fickle about initialization, some good coding style is suggested.
<!--more-->

There are basically only 3 rules we need to remember if wanting to avoid tragedy of using objects before they're initialized:

1. always manually initialize non-member objects of _built-in_ type, becauese C++ sometimes initializes them and sometimes not.
2. in constructors, prefer use member initialization list to assignment inside the constructor body; data members in the initialization list is suggested to be in the same order as they are declared in the class (which helps to avoid reader confusion)
3. replacing non-local static objects with local static objects in order to avoid initialization order problems across translation units.

## Initialize non-member _built-in_ type object

No need to remember rules about when built-in type object initialization is guaranteed to take place and when it isn't, for they're too complicated to know.

Just form a good habit to always initialize objects before using them manually.

```cpp
int x = 0; // manual init. of an int
const char *text = "A C-style string"; // manual init. of a pointer
double d;
std::cin >> d;
```

## Initialize data member with member initialization list

The arguments in the initialization list are used as constructor arguments for the various data members (will be copy-constructed), which will be more efficient than a call to the default constructor followed by a calll to the copy assignment operator.

1. For data members of `const` and references, since they can't be assigned (item 5), initialization list must be used.
2. For built-in type data members, even though there's no difference in cost betweeen initialization and assignment, it is a good habit to place them in member initialization list for consistency.
3. For data members of user-defined type, since compilers will automatically call default constructors for absent ones in initialization list, even if you just want to call the default constructor, it is still a good habit to call the default constructors in the initialization list, just to make a good habbit to guarantee there's no data member left uninitialzed. 

Exception: multiple constructors share large common member initialization list may consider moving assignment to a single (private) function called by all the constructors, which will be helpful for initializing values from reading a file or database.

## Initialze non-local static objects defined in different translation units

>meaning:
1. _static object_: one that exists from the time it's constructed until the end of the program (i.e., their destructors will be called when _main_ finishes executing);
2. **local** _static object_:
3. **non-local** _static object_: 
3. _translation unit_:



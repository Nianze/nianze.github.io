---
title: "Item-16 Use the same form in corresponding uses of new and delete"
date: 2018-02-04
categories:
- article
- coding
tags:
- technique
- cpp
slug: use the same form in matching new and delete
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018-02-04/.png
---

If you use [] in a `new` expression, use [] in the corresponding `delete` expression; If not, no [] in the matching `delete` expression.
<!--more-->

When employing a `new` expression, two things happen:

1. membory is allocated (via the function `operator new`, item 49, 51)
2. one or more constructors are called for that memory

When a `delete` is used, two other things happen:

1. one or more destructors are called for the memory
2. The memory is deallocated (via the function `operator delete`, item 51)

The fact is that the memory layout for single objects is generally different from the memory layout for arrays, and the memory for an array usually includes extra area for the size of the array (making it easier for `delete` to know how many destructor to call) while memory for a single object lacks this information:

| Memory type   | Memory layout |
| ------------- | ------------- |
| Single object | `Object`      |
| Array         | `n            | Object | Object | Object | ...` |

When we use `delete` on a pointer, `delete []` will assumes an array is pointed to, otherwise it assumes a single object. Let's see what will happen if the corresponding uses of `new` and `delete` is not the same:

```cpp
std::string *stringPtr1 = new std::string;
std::string *stringPtr2 = new std::string[100];
```

* `delete [] stringPtr1;`

The result is undefined. `delete` will read some memory and interpret what it read as an array size, then start invoking the destructors, and it's probably not holding the objects of the type it's busy destructing at this point.

* `delete stringPtr2;`

It's undefined behavior too. It's easy to see the expression would lead to too few destructors being called. Furthermore, it's also undefined for built-in types (which lack destructors), too.

The rule is particularly important to bear in mind when writing a class containing a pointer to dynamically allocated memory and also offering multiple constructors, for we must be careful to use the same form of `new` in all the constructors to initialize the pointer member. After all, there's only one form of `delete` in the destructor.

The rule is also noteworthy for `typedef`-inclined:

```cpp
typedef std::string AddressLines[4];  // a person's address has 4 lines
std::string *pal = new AddressLines;  // return type is string*, just like "new string[4]" would

delete pal;  // undefined!
delete [] pal;  // fine, array form of delete is the matched version
```

To avoid such confusion, abstain from `typedef`s for array types. Try using `string` and `vector` from the standard C++ library (item 54), and those templates reduce the need for dynamically allocated arrays to nearly zero: for example, we may define `AddressLines` as type `vector<string>`.
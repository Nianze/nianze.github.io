---
title: "[MECpp]Item-19 Understand the Origin of Temporary Objects"
date: 2018-04-13T17:06:28-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Understand the Origin of Temporary Objects
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-04/2018-04-13.gif
---

Unnamed non-heap objects are invisible temporary objects in C++.
<!--more-->

Temporary objects arise in two situations:

1. when implicit type conversions are applied to make function calls succeed
2. when functions return objects

It's important to understand how and why these temporary objects are created and destroyed because their construction and destruction can have noticeable impact on the performance of the program.

### Implicit conversion

When the type of object passed to a function is not the same as the type of the parameter to which it is being bound, temporary objects are created during the implicit conversion to make function calls succeed.

For example,

```cpp
size_t countChar(const string& str, char ch);

char buffer[MAX_STRING_LEN];
char c;

// read in a char and a string; use setw to avoid 
// overflowing buffer when reading the string
cin >> c >> setw(MAX_STRING_LEN) >> buffer;
cout << "There are " << countChar(buffer, c)
     << " occurrences of the character " << c
     << " in " << buffer << endl;
```

Here is what will happen:

1. By passing a `char` array into function `countChar` which expects a `const string&`, compilers will create a temporary object of type `string` constructed by calling the `string` constructor with `buffer` as its argument. 
2. The `str` parameter of `countChar` is then bound to this temporary `string` object.
3. When the statement containing the call to `countChar` finishes executing, the temporary object is automatically destroyed.

Needless to say, such implicit conversion (with pointless construction and destruction of temporary objects)  is not efficient and should be eliminated:

* by redesigning the code to forbid such implicit conversion, MECpp item 5
* by modifying the code the same as described in MECpp item 21

#### Restrictions on implicit conversion

These conversions occur only when passing objects by value or when passing to a reference-to-`const` parameter, so when passing an object to a reference-to-non-`const` parameter, there is no implicit conversion. For example,

```cpp
void uppercasify(string& str);
char bookTitle[] = "Effective C++";
uppercasify(bootTitle);  // error!
```

Here, temporary would not be created for parameter `str`, which is declared to be of type "non-`const` reference", because it is the `bookTitle` that is supposed to be updated, instead of a newly created temporary.

### Function return value

```cpp
const Number operator+(const Number& lhs, const Number& rhs);
```

The return value of `operator+` is a temporary, because it is just the function's return value and has no name, and we must pay to construct and destruct this object each time we call the function. (`const` is added for the same reason in MECpp item 6);

To avoid such costs, 

* switch to a similar function `operator+=`, MECpp item 22
* if, in most cases, conceptually the construction and destruction can not be avoided, we optimize the program using the technique `return value optimization` instroduced in MECpp item 20

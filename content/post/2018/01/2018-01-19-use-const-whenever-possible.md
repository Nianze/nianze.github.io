---
title: "Item-3 Use const whenever possible"
date: 2018-01-19T14:31:40-05:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: use const whenever possible
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-01/2018-01-19.jpg
---

Useful tips on using `const` in C++.
<!--more-->

The `const` keyword allows you to specify a semantic constraint and compilers will enforce that constraint. It is remarkably versatile:

1. outside of class, you may use it for constants at global or namespace scope, as well as for objects declared static at file, function or block scope
2. inside classes, you may use it for both static and non-static data members, for pointers
3. when declaring functions, you may also refer `const` to function's return value, function parameters, and, for member functions, to the function as a whole

## 1. `const` pointer

```cpp
char greeting[] = "Hello";
char *p = greeting; // non-const pointer, non-const data
const char *p = greeting; // non-const pointer, const data
char * const p = greeting; // const pointer, non-const data
const char * const p = greeting; // const pointer, const data
char const * const p = greeting; // const pointer, const data
```

If the `const` appears to the left of the asterisk, what's pointed to is constant; if the word `const` appears to the right of the asterisk, the pointer itself is constant. It's helpful to read pointer declarations right to left: `const char * const p` reads as "p is a constant pointer to constant chars".

## 2. `const` iterator

STL iterators are modeled on pointers. Treat it like this:

1. iterator -> `T*` pointer
2. const iterator -> `T* const` pointer
3. const_iterator -> `const T*` pointer

```cpp
std::vector<int> vec;
...
const std::vector<int>::iterator iter = vec.begin(); // acts like T* const
*iter = 10; // OK.
++iter;     // error.

std::vector<int>::const_iterator cIter = vec.begin(); // acts like const T*
*cIter = 10; // error.
++cIter;     // OK.
```

## 3. `const` function return value

Generally speaking, having a function return a constant value is inappropriate, but sometimes doing so may reduce implicit errors out of incidence without giving up safety or efficiency.

```cpp
class Rational {
... // contains no operator*
};
const Rational operator*(const Rational& lhs, 
                         const Rational& rhs);
```

Declaring the return value of `operator*` to be const prevent typos like this:

```cpp
if (a * b = c) // meant to do a comparison for some user-defined objects
```

## 4. `const` function parameters

`const` parameters act just like local `const` objects. Unless there's a need to modify aparameter or local object, be sure to declare it `const`, for it may save you from annoying errors like `if (a = b)` above.

## 5. `const` member functions

The purpose of `const` on member functions is to identify which member functions may be invoked on `const` objects, which benefits us for:

1. making the interface of a class easier to understand (which functions may modify an object and which may not)
2. making it possible to work with `const`-qualified objects (which makes up a very important C++ feature: overloading member functions differing only in their constness)

### 5.1 Bitwise constness vs. Logical constness

#### 5.1.1 Bitwise constness

>Bitwise constness: a member function is const if and only if it doesn't modify any of the object's data members (excluding those that are static). This is also C++'s definition of constness

However, member functions that don't act very _const_ pass the bitwise test, such as a function including a `char* const` pointer manipulating a `char*` type class member:

```cpp
class CTextBlock {
public:
...
    //inappropriate but bitwise const declaration of operator[]
    char& operator[](std::size_t position) const 
    {return pText[position];}
private:
    char *pText;
};
```

Since operator[]'s implementation doesn't modify pText in any way, compilers will happily generate code after verifying that it is indeed bitwise const. However, when you create a constant object with a particular value and invoke only `const` member functions on it, you can still change its value:

```cpp
const CTextBlock cctb("Hello"); // declare constant object
char *pc = &cctb[0]; // call the const operator[]
*pc = 'J'  // cctb has value "Jello" now
```

To solve this problem, we may store data as a string instead of communicating through a C API char*:

```cpp
class TextBlock {
public:
...
    // operator[] for const objects
    const char& operator[] (const std::size_t position) const
    {return text[position];}
    // operator[] for non-const objects
    char& operator[] (const std::size_t position) const
    {return text[posion];}
private:
    std::string text;
};
```

Remeber the C++ feature mentioned above? By overloading operator[] and giving the different versions different return types, we can handle const and non-const TextBlock objects differently:

```cpp
TextBlock tb("Hello");
const TextBlock ctb("World");
std::cout << tb[0];  // fine, call and reading a non-const TextBlock object
tb[0] = 'x';         // fine, call and writing a non-const TextBlock object
std::cout << ctb[0]; // fine, call and reading a const TextBlock object
ctb[0] = 'x';        // error! call to a const TextBlock object is fine
                     // but making an assignment to returned const char& type gives us an error
```

#### 5.1.2 Logical constness

>Logical constness: a const member function might modify some of the bits in the object on which it's invoked, but only in ways that clients cannot detect.

A typical example of logical constness shows in such a scenario: say we want to cache the length for a CTextBlock object, and we define it like as

```cpp
class CTextBlock {
public:
...
    std::size_t length() const;
private:
    char *pText;
    std::size_t textLength;
    book lengthIsValid;
};

std::size_t CTextBlock::length() const
{
    if(!lengthIsValid) {
        textLength = std::strlen(pText); // error: can't asssign to textLength 
        lengthIsValid = true;            // and lengthIsValid in a const member function
    }
    return textLength;
}
```

Bitwise constness test fails and compilers complains due to the assignment to textLength and lengthIsValid, but it is supposed to be valid for `const` CTextBlock objects. The solution is to take advantage of C++'s keyword `mutable`, which frees non-static data members from the constraints of bitwise constness:

```cpp
class CTextBlock {
public:
...
    std::size_t length() const;
private:
    char *pText;
    mutable std::size_t textLength;
    mutable book lengthIsValid;
};

std::size_t CTextBlock::length() const
{
    if(!lengthIsValid) {
        textLength = std::strlen(pText); // error: can't asssign to textLength 
        lengthIsValid = true;            // and lengthIsValid in a const member function
    }
    return textLength;
}
```

According to the mutable's definition, you may notice that `const` member function will not check bitwise constness for static data members. This is because following [facts](https://stackoverflow.com/questions/43936404/why-can-a-const-member-function-modify-a-static-data-member):

1. The `this` pointer in a `const` qualified member function is a `const` type, and `this` is inherently related to an _instance_ of a class
2. `static` data members are not related to a class instance
3. For non-static data member `lengthIsValid = true;`, think of it as `this->lengthIsValid = true;`, which is not compilable when the type of `this` is `const CTextBlock*` without `mutable` added.
4. Think of static data member `staticMember` as `CTextBlock::staticMember`, so there's no constraints from `const` type `this` pointer.

### 5.2 Avoiding duplication in `const` and non-`const` member function

There are two versions of operator[] in class TextBlock, which is duplication and tempts us to have one version of operator[] call the other one. Although generally speaking casting is a bad idea, here we may find enough reasons to justify its usage so long as we use it properly (note that we call `const` version in non-`const` version, not the other way around!):

```cpp
class TextBlock {
public:
...
    const char& operator[](const std::size_t position) const
    {
        ...    // some extra tasks such as bounds checking, 
        ...    // log access data, verify data integrity 
        ...    // to make code duplication unbearablly tedious
        return text[position];
    }
    char& operator[](const std::size_t position) const 
    {
        return const_cast<char&> ( // cast away const on return type
            static_cast<const TextBlock&>(*this)[position]; // add const to *this's type in order to call const version of operator[]
        );
    }
};
```

It's definitely worth knowing this technique of implementing a non-`const` member function in terms of its `const` twin, although the syntax is somehow ungainly.

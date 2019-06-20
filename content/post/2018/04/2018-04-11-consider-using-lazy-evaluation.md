---
title: "[MECpp]Item-17 Consider Using Lazy Evaluation"
date: 2018-04-11T14:02:18-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Consider Using Lazy Evaluation
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-04/2018-04-11.gif
---

The best computations are those we never perform at all.
<!--more-->
<!-- toc -->

Lazy evaluation is applicable in an enormous variety of application areas.

# Reference Counting

```cpp
class String {...};

String s1 = "Hello";

String s2 = s1;  // call String copy ctor
```

The lazy approach: instead of giving `s2` a copy of `s1`'s value, we have `s2` share `s1`'s value to save the cost of a call to `new` and the expense of copying anything, until any one is modified (i.e., `s2.convertToUpperCase();` will change only `s2`'s value by making a private copy of shared value before modification). Refer to MECpp item 29 for implementation details.

# Distinguishing Reads from Writes

```cpp
cout << s[2];  // read
s[2] = 'x';    // write
```

For `operator[]`, we'd like to distinguish the read call from the write so that a reference-counted string reading is cheap. In order to determine whether `operator[]` has been called in a read or in a write context, we use lazy evaluation and proxy classes as described in MECpp item 30.

# Lazy Fetching

```cpp
class LargeObject {
public:
    LargeObject(ObjectID id);

    const string& field1() const;
    int field2() const;
    double field3() const;
    const string& field4() const;
    ...
private:
    ObjectID oid;
    mutable string *field1Value;
    mutable int *field2Value;
    mutable double *field3Value;
    mutable string *field4Value;
    ...    
};

LargeObject::LargeObject(ObjectID id)
: oid(id), field1Value(0), field2Value(0), field3Value(0), field4Value(0)...
{}

const string& LargeObject::field1() const
{
    if (field1Value == 0) {
        read the data for field 1 from the database
        and make field1Value point to it;
    }
    return *field1Value;
}
```

Because `LargeObject` instances are big, getting all the data at once is a costly database operation. The lazy approach to this problem is to create only a skeleton of an object, without reading any data from disk when a `LargeObject` instance is created. Each field in the object is represented as a pointer to the necessary data, initialized as null pointers, which signify fields that have not yet been read from the database.

Since null pointers may need to be initialized to point to real data from inside any member function, including `const` member functions like `field1`, we declare the pointer fields `mutable` to tell compilers that they can be modified inside any member function.

As an alternative, we can replace pointers with smart pointers (MECpp item 28), which does not need to be declared as `mutable`.

# Lazy Expression Evaluation

```cpp
template<class T>
class Matrix { ... };

Matrix<int> m1(1000, 1000);  // a 1000 by 1000 matrix
Matrix<int> m2(1000, 1000);  // a 1000 by 1000 matrix
...
Matrix<int> m3 = m1 + m2;
```

Instead of compute and return the sum of `m1` and `m2` (which cost 1,000,000 additions and corresponding memory allocation), lazy evaluation sets up a data structure inside `m3` indicating that `m3`'s value is the sum of `m1` and `m2` (which may just consisting of two pointers to each of `m1` and `m2` and an enum indicating the additional operation). In most scenarios, we need only _part_ of a computation (i.e., `cout << m3[4];` instead of `cout << m3;`), so laziness generally pays off.

However, due to these dependencies between values, there are extra maintainence to notice: when one of the matrices on which `m3` is dependent is to be modified, we have to make sure the correctness:

```cpp
m3 = m1 + m2;
m1 = m4; // m3 is the sum of m2 and the old value of m1
```

Inside the `Matrix<int>` assignment opertaor, we might compute `m3`'s value prior to changing `m1` or we may take a copy of the old value of `m1` and make `m3` dependent on that. 

Those extra mentainence efforts often ends up saving significant amounts of time and space during program runs, which is a payoff that justifies the lazy evaluation.

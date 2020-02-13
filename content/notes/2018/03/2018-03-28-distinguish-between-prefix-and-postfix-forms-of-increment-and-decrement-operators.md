---
title: "[MECpp]Item-6 Distinguish Between Prefix and Postfix Forms of Increment and Decrement Operators"
date: 2018-03-28T13:03:10-04:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: Distinguish Between Prefix and Postfix Forms of Increment and Decrement Operators
autoThumbnailImage: false
thumbnailImagePosition: right
featured_image: 2018/2018-03/2018-03-28.gif
---

The prefix and postfix forms of increment and decrement operators return _different types_: prefix forms return a reference, while postfix forms return a _const_ object. For efficiency, prefer prefix forms unless the behavior of postfix ones is necessary. To guarantee consistency, implement postfix operators in terms of the prefix operators.
<!--more-->
<!-- toc -->

# Case Study

Overloaded functions are differentiated on the basis of the parameter types they take, but neither prefix nor postfix increment or decrement takes an argument. To surmount this linguistic pothole, it was decreed that postfix forms take in `int` argument, and compilers silently pass 0 as that `int` when those functions are called:

```cpp
class UPInt {  // customized "unlimited precisioin int"
public:
    UPInt& operator++();           // prefiex ++
    const UPInt operator++(int);   // postfix ++

    UPInt& operator--();           // prefiex --
    const UPInt operator--(int);   // postfix --
    
    UPInt& operator+=(int);        // += operator for UPInts and ints
    ...    
};

UPInt i;

++i;  // calls i.operator++();
i++;  // calls i.operator++(0);

--i;  // calls i.operator--();
i--;  // calls i.operator--(0);
```

The return types difference is caused by the different behavior between prefix forms and postfix forms. For `++operator`:

* Prefix form is "increment and fetch"
* Postfix form is "fetch and increment"

```cpp
// prefix form: increment and fetch
UPInt& UPInt::operator++()
{
    *this += 1;    // increment
    return *this;  // fetch
}

// postfix form: fetch and increment
const UPInt UPInt::operator++(int)
{
    const UPInt oldVal = *this;  // fetch
    ++(*this);                   // increment
    return oldVal;               // return what was fetched
}
```

Apart from the obvious inefficiency resulting from the fact that postfix increment function creates a temporary object for its return value (MECpp item 19), as well as the explicit temporary object `oldVal` that has to be constructed and destructed, leading to the conclusion that prefix increment should be used whenever possible for its inherently higher efficiency, there are three points worth noting for the implementation of postfix form of `operator++`:

## 1. Omit the parameter name

Since the purpose of the parameter is only to distinguish prefix from postfix function invocation, the postfix operator makes no use of its parameter. Omitting parameter names avoids warnings from some compilers who insist that we use named parameters in the body of the function to which they apply.

## 2. Return a `const` object

There are two reasons to return a `const` object:

* it's consistent with the behavior of the built-in types, since `int`s most certainly do not allow double application of postfix increment:
 
    ```cpp
    int i;
    i++++;  // error!
    ```
* if return value is not const, the behavior will be counterintuitive and confusing: after applying `i++++`, the second `operator++` changes the value of the object returned from the first invocation, instead of the value of the original object. Hence, `i` ends up being incremented only once.

## 3. Implement postfix operators in terms of the prefix ones

Both the prefix and postfix increment operators do the same thing: incrementing a value. In order to guarantee implementation won't diverge over time, postfix increment and decrement should be implemented _in terms of_ their prefix counterparts. Then we only need to maintain the prefix versions.

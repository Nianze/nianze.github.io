---
title: "[MECpp]Item-7 Never Overload \'&&\', \'||\', or \',\'"
date: 2018-03-29T11:18:24-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: never overload AND OR comma operator
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-29.gif
---

If we don't have a good reason for overloading an operator, don't overload it. In the case of `&&`, `||`, and `,`, it's difficult to have a good reason: we can't make them behave the way they're supposed to.
<!--more-->

## Overloading `operator&&` and `operator||`

C++ employs short-circuit evaluation of boolean expressions: once the truth or falsehood of an expression has been determined, evaluation of the expression ceases, even if somem parts of the expression haven't yet been examined.

The operators associated with short-circuit evaluation are `||` and `&&`, which C++ allows us to customize for user-defined types. However, once we overloading the functions `operator&&` and `operator||` (at the global scope or on a  per-class basis), we are replacing short-circuit semantics with _function call_ semantics, ending up changing the rules of the game quite radically. For example, after we overload `operator&&`, the following code:

```cpp
if (expression1 && expression2)  ...
```

looks to compilers like one of these:

```cpp
if (expression1.operator&&(expression2)) ... // when operator&& is a member function

if (operator&&(expression1, expression2)) ... // when operator&& is a global function
```

In two crucial ways, the funciton call semantics differ from short-circuit semantics:

1. when a funciton all is made, _all_ parameters must be evaluated. Thus there is no short circuit.
2. the order of evaluation of parameters to a function all is undefined, so there is no way of knowing whether `expression1` or `expression2` will be evaluated first.

As a result, overloaded `&&` or `||` will never offer programmers the behavior they both exprect and have come to depend on. So do not overload `&&` or `||`.

## Overloading `operator,`

The comma operator is used for _expressions_, and we're most likely to run across it in the update part of a `for` loop:

```cpp
void reverse(char s[]) 
{
    for (int i = 0, j = strlen(s)-1;
    i < j;
    ++i, --j)  // the comma operator
    {
        int c = s[i];
        s[i] = s[j];
        s[j] = c;
    }
}
```

An expression containing a comma is evaluated by first evaluating the part of the expression to the left of the comma, then evaluating the expression to the right of the comma; the result of the overall comma expression is the value of the expression on the right. So the result for `++i, --j` is the value returned from `--j`.

Unfortunately, when writing our own comma operator, we can't mimic this behavior for the same reason as the case in overriding `||` and `&&`: 

* if we write `operator,` as a non-member function, then both operands around `,` will be passed as arguments in a function call, and there's no way to control over the order in which a funciton's arguments are evaluated.
* if we write `operator,` as a member function, we still can't rely on the left-hand operand to the comma being evaluated first, because compilers are not constrained to do thing that way.

## Limits on operator overloading

According to C++, following operators can't be overloaded:

 | | | 
|:---:|:---:|:---:|:---:|
|`.`   | `.*`     | `::`     |  `?:`   |
|`new` | `delete` | `sizeof` | `typeid`|
|`static_cast` | `dynamic_cast` | `const_cast` | `reinterpret_cast`|

We can overload these:

 | | | 
|:---:|:---:|:---:|:---:|
|`operator new` | `operator delete` | `operator new[]` | `operator delete[]`|
|`+` | `-` | `*` | `/`|
|`%` | `^` | `&` | \| |
|`~` | `!` | `<` | `>`|
|`+=` | `-=` | `*=` | `/=` | 
|`%=` | `^=` | `&`  | `|=` |
|`<<` | `>>` | `>>=`| `<<=`|
|`==` | `!=` | `<=` | `>=` |
|`->*`| `->` | `++` | `--` |
|`,`  |`&&`  | \|\| |
| `()`| `[]`|

Just because we can overload there operators is no reason to run off and do it. The purpose of operator overloading is to make programs easier to read, write, and understand. If we don't have a good reason for overloading an operator, don't overload it, as is the case for `&&`, `||`, and `,`.

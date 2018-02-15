---
title: "Item-26 Postpone variable definitions as long as possible"
date: 2018-02-14T10:50:18-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: postpone variable definitions
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018-02-14.jpg
---

Postponing variable definitions as long as possible increases program clarity and improves progranm efficiency.
<!--more-->

After defining a variable of a type with a constructor or destructor, there's a cost of construction when control reaches a variable's definition and a cost of destruction when the variable goes out of scope. if the variable is unused, the cost is wasted, which is the case we want to avoid.

Nobody declares unused variables on purpose, but chances are we may still encounter them unexpectedly: suppose there's a function that returns an encrypted version of a password as long as the password is long enough and may throw an exception of type `logic_error` (defined in standard C++ library, item 54) if the passwod is too short:

```cpp
std::string encryptPassword(const std::string& password)
{
    using namespace std;
    string encrypted; // definition is too soon
    if (password.length() < MinimumPasswordLength) {
        throw logic_error("Password is too short");
    }
    ...   // do whatever is necessary to place an encrypted version of password in encrypted
    return encrypted;
}
```

Apparently, the object `encrypted` is unused if an exception is thrown, and we still have to pay the cost of construction and destruction of `encrypted`.

A better solution is to postpone `encrypted`'s definition until we _know_ we'll need it:

```cpp
std::string encryptPassword(const std::string& password)
{
    using namespace std;

    if (password.length() < MinimumPasswordLength) {
        throw logic_error("Password is too short");
    }

    string encrypted; // postpones encrypted's definition until it's truly necessary
    ...   // do whatever is necessary to place an encrypted version of password in encrypted
    return encrypted;
}
```

This code still isn't as tight as it might be, because `encrypted` is defined without any initialization arguments, leading to its default constructor getting called and an extra aassignment operation being used later. As item 4 suggests,

> default-constructing an object and then assigning to it is less efficient than initializing it with the value we really want it to have.

Suppose the hard part of `encryptPassword` is performed in this function:

```cpp
void encrypt(std::string& s);  // encrypts s in place
```

Then we'd better skip the pointless and potentially expensive default construction, directly initializing `encrypted` with `password` until right before we have to use the variable:

```cpp
std::string encryptPassword(const std::string& password)
{
    using namespace std;

    if (password.length() < MinimumPasswordLength) {
        throw logic_error("Password is too short");
    }

    string encrypted(password); // define and initialize via copy constructor right before we have to use it
    encrypt(encrypted);
    return encrypted;
}
```

This gives us certain benifits: 
1. we avoid constructing and destructing unneeded obejcts
2. we avoid unnecessary default constructions
3. we help document the purpose of variables by initializing them in contexts in which their meaning is clear

## Loop

If a variable is used only inside a loop, should we define it outside the loop and make an assignment to it on each loop iteration, or to define the variable inside the loop:

```cpp
// Approach A: define outside loop
Widget w;
for (int i = 0; i < n; ++i)
{
    w = some value dependent on i;
    ...
}
```

```cpp
// Approach B: define inside loop
for (int i = 0; i < n; ++i) 
{
    Widget w(some value dependent on i);
    ...
}
```

Let's see the costs of the two approaches above:

* Approach A: 1 constructor + 1 destructor + n assignments
* Approach B: n constructor + n destructors

Since Approach A makes the name `w` visible in a larger scope than Approach B, which is contrary to program comprehensibility and maintainability, generally we choose Approach B as default, unless we know that

1. assignment is less expensive than a constructor-destructor pair
2. we're dealing with a performance-sensitive part of our code 
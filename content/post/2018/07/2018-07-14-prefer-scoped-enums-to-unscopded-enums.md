---
title: "[EMCpp]Item-10 Prefer Scoped enums to Unscopded enums"
date: 2018-07-14T13:33:33-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Prefer Scoped enums to Unscopded enums
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-07/14.gif
---

Enumerators of scoped `enum`s are visible only within the `enum`, convert to other types only with a cast, and always support forward-declared because their default underlying type is `int`.
<!--more-->

#### Scope

Generally speaking, declaring a name inside curly braces limits the visibility of that name to the scope defined by the braces, with one exception: the C++98-style `enum`s, which lead to enumerator names leaking into the scope containing their `enum` definition, and thus have an official term - _unscoped_ `enum`s.

```cpp
enum Color { black, white, red }; // black, white, red are in same scope as Color
auto white = false; // error! white already declared in this scope
```

As their new C++11 counterparts, by adding a `class` in declaration, _scoped_ `enum`s don't leak names:

```cpp
enum class Color { black, white, red };
auto white = false; // fine. no other "whate" in scope
Color c = white; // error
auto c = Color::white; // fine, type of c is Color
```

#### Implicit conversion

The fact that scoped `enum`s have strong typed enumerators results in their inability to implicitly convert to integral types (and, from there, to floating-point types), which behavior is otherwise permited in terms of unscoped `enum`s:

```cpp
Color c = Color::red;
std::vector<std::size_t> primeFactors(std:size_t x); // func. returning prime factors of x
...
if (c < 14.5) {  // error! can't compare Color and double
    auto factors = primeFactors(c);  // error! can't pass Color to function expecting std::size_t
}
```

Instead, in order to convert typefrom `Color` to a different type, we need a cast:

```cpp
if (static_cast<double>(c) < 14.5 ) {  // odd code, but valid
    auto factors = primeFactors(static_cast<std::size_t>(c));
}
```

#### Forward declaration

Technically speaking, both scoped and unscoped `enum`s may be forward-declared, except that unscoped ones need a bit of additional work - by specifying the underlying type for unscoped `enum`s[^1]:

```cpp
enum Status: std::unit8_t;  // fwd decl for unscoped enum;
```

Since scoped `enum`s have a default underlying type of `int`, forward declaration is always supported:

```cpp
enum class Status; // forward declaration
void continueProcessing(Status s); // use of fwd-declared enum
```

With the help of forward declaration, the header containing the declarations requires no recompilation if `Status`'s definition is revised. Furthermore, it is also possible that `continueProcessing`'s implementation need not be recompiled[^2].

#### Twist

There's still some situation where unscoped `enum`s may be useful: when referring to fields within C++11's `std::tuple`s. Suppose we have a tuple holding values for the name, email address, and reputation value for a user at a social networking website:

```cpp
using UserInfo =            // type alias
    std::tuple<std::string  // name
               std::string  // email
               std::size_t> // reputation
```

To get field value, using an unscoped `enum` to associate names with field numbers may be helpful:

```cpp
enum UserInfoFields { uiName, uiEmail, uiReputation };
UserInfo uInfo;
...
auto val = std::get<uiEmail>(uInfo); // implicit conversion from UserInfoFields to std::size_t
```

To mimic the similar behavior, using scoped `enum`s is more verbose:

```cpp
enum class UserInfoFields { uiName, uiEmail, uiReputation };
...
auto val = std::get<static_cast<std::size_t>(UserInfoFields::uiEmail)>(uInfo);
```

To save some typing, we might consider define a helper function, or in a more generalized form, a function template `toUType` that takes an arbitrary enumerator and return its value as a compile-time constant:

```cpp
template<typename E>
constexpr typename std::underlying_type<E>::typename // see item 9 for info on type traits
    toUType(E enumerator) noexcept
{
    return static_cast<typename std::underlying_type<E>::type>(enumerator);
}
```

In C++14, we may simplify the `toUType` to a sleeker form:

```cpp
template<typename E>
constexpr auto toUType(E enumerator) noexcept
{
    return static_cast<std::underlying_type_t<E>>(enumerator);
}
```

And then we access a field of the tuple like this:

```cpp
auto val = std::get<toUType(<UserInfoFields::uiEmail)>(uInfo);
```

Still more to write than use of the unscoped `enum`, but it also avoids namespace pollution and inadvertent conversions involving enumerators, so those extra characters might still be a reasonable to pay for.

[^1]: Since there is no default underlying type for unscoped `enum`s, to make it possible for compilers to select an underlying type for each `enum` prior to the `enum` being used, C++98 supports only `enum` definitions (when all enumerators are listed), while `enum` declarations are not allowed.
[^2]: This happens if `Status` is modified (e.g., add a new enumerator), but `continueProcessing`'s behavior is unaffected (e.g., the function doesn't use the newly added enumerator).

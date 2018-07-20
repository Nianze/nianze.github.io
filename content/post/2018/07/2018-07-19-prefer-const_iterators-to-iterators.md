---
title: "[EMCpp]Item-13 Prefer Const_iterators to Iterators"
date: 2018-07-19T18:48:52-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Prefer Const_iterators to Iterators
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-07/19.gif
---

In maximally generic code, prefer non-member versions of `begin`, `end`, `rbegin`, etc., over their member function counterparts.
<!--more-->

In C++98, using `const` whenever it's meaningful wasn't practical: it wasn't that easy to create them, and once we had one, the ways we could use it were limited. For example:

```cpp
std::vector<int> values;
...
std::vector<int>::iterator it = 
    std::find(values.begin(), values.end(), 1983);
values.insert(it, 1998);
```

The code above search for the first occurrence of 1983 (the year "C++" replaced "C with Classes"), then insert the value 1998 (first ISO C++ Standard was adopted) at that location. If no 1983 found, insert at the end of the vector. Since the code never modifies what an `iterator` points to, so acoording to the convention to use `const` whenever possible, we should use the const-iterator. 

However, in C++98, there was no simple way to get a `const_iterator` from a non-`const` container. To work it out, we might concider using the cast like the following code, which conceptually works but probably won't compile:

```cpp
typedef std::vector<int>::iterator IterT;
typedef std::vector<int>::const_iterator ConstIterT;

std::vector<int> values;
...
ConstIterT ci = 
    std::find(static_cast<ConstIterT>(values.begin()),
              static_cast<ConstIterT>(values.end()),
              1983);
values.insert(static_cast<IterT>(ci), 1998); // may not compile
```

The problem here is that in C++98, `const_iterator`s weren't acceptable for insertions and erasures, so we cast `ci` into its non-const version. However, in C++98, there's no portable conversion from a `const_iterator` to an `iterator`[^1], so the last statement probably won't compile. The conclusion: `const_iterator`s were so much trouble in C++98.

Now that we in the new world of C++11, `const_iterator`s are both easy to get and easy to use. Even for non-const containers, we get `cbegin` and `cend` to produce `const_iterator`s:

```cpp
std::vector<int> values;
...
auto it = std::find(values.cbegin(), values.cend(), 1983);
values.insert(it, 1998);
```

#### Maximally Generic Support

Taking into account that some containers and container-like data structures offer `begin` and `end` as _non-member_ functions, C++11 added the non-member functions `begin` and `end` to make sure some generic library code using non-member functions is possible.

C++14 rectified the oversight in C++11, adding the support for `cbegin`, `cend`, `rbegin`, `rend`, `crbegin`, and `crend`. Now we could generalize the code above into a `findAndInsert` template as follow:

```cpp
template<typename C, typename V>
void findAndInsert(C& container,       // find first occurrence of targetVal in container
                   const V& targetVal, // then insert insertVal there
                   const V& insertVal)
{
    using std::cbegin;
    using std::cend;

    auto it = std::find(cbegin(container),  // non-member cbegin
                        cend(container),    // non-member cend
                        targetVal);
    container.insert(it, insertVal);
}
```

If we're using C++11 and want to write maximally generic code, we may build our own implementation for non-member `cbegin`:

```cpp
template<class C>
auto cbegin(const C& container) -> decltype(std::begin(container))
{
    return std::begin(container);
}
```

Point here is: through its reference-to-`const` parameter, `container`, we are invoking the non-member `begin` function (provided by C++11) on a `const` container, and this process yields a `const_iterator`. In fact, this template works even if `C` is a built-in array type[^2].

[^1]: It's true in C++11, too.
[^2]: For insight into how a template can be specialized for built-in arrays, consult EMCpp item 1's discussion of type deduction in templates that take reference parameters to arrays.
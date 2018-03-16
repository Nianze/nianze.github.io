---
title: "Item-47 User traits classes for information about types"
date: 2018-03-14T18:49:03-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: User traits classes for information about types
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-13.gif
---

Implemented by templates and template specializations, traits classes make information about types available during compilation. Combining traints with overloading, it is possible to perform compile-time `if...else` tests on types.
<!--more-->

In this item, let's look at how STL supports the utility template `advance`, which moves a specified iterator a specified distance:

```cpp
template<typename IterT, typename DistT>  
void advance(IterT& iter, DistT d); // move iter d units forward; if d < 0, move iter backward
```

Before we step into the field of `advance` implementation, we should be familiar about STL iterator categoryies, because different iterators support different operations.

### 5 Iterator categories

According to the operations they support, there are five categories of iterators:

* _Input iterators_ can move only one step forward at a time, can only read, and can read what they're pointing to only once (e.g., `istream_iterator`)
* _Output iterators_ can move only one step forwrad at a time, can only write, and can write what they're pointing to only once (e.g., `ostream_iterator`)
* _Forward iterators_ can do whatever input and output iterators can do, and they can read or write what they point to momre than once (e.g., singly linked list or iterators into TR1's hashed containers (item 54) may be in the forward category)
* _Bidirectional iterators_ add to forward iterators the ability to move backward as well as forward (e.g., iterators for `list`, `set`, `multiset`, `map`, `multimap` in STL)
* _Random access iterators_ are the most powerful ones: they add to bidirectional iterators the ability to perform "iterator arithmetic" - to jump forward or backward an arbitrary distance in constant time, which is similar to pointer arithmetic (e.g., iterators for `vector`, `deque`, `string`)

Input and output iterators, as two least powerful iterator categories, are modeled on the read (into an input file) and write (into an output file) pointer, suitable only for one-pass algorithm. Forward (and higher level iterators) can do multi-pass algoritms. The most powerful random access iterators are modeled on built-in pointers.

For each of the five iterator categories, C++ has a "tag struct" in the standard library that serves to identify it:

```cpp
struct input_iterator_tag {};
struct output_iterator_tag {};
struct forward_iterator_tag: public input_iterator_tag {};
struct bidirectional_iterator_tag: public forward_iterator_tag {};
struct random_access_iterator_tag: public bidirectional_iterator_tag {};
```

### Implementing `advance`

Knowing that different categories support different operations, `advance` will essentially be implemented like this:

```cpp
template<typename IterT, typename DistT>
void advance(IterT& iter, DistT d)
{
    if (iter is a random access iterator) {
        iter += d; // use iterator arithmetic for random access iters
    }
    else {
        if (d >= 0) { while (d--) ++iter; } // use iterative calls 
        else { while (d++) --iter; }        // to ++ or -- for other iterator categories
    }
}
```

Now comes the question: how to determine whether `iter` is a random access iterator? Here comes the technique of _traits_, which allow us to get type information during compilation.

### Traits

Traits aren't a keyword or a predefined construct in C++, but simply a technique and a convention followed by C++ programmers. It has some demands, one of which asks that it has to work as well for built-in types as it does for user-defined types. This demand leads to the conclusion that the traits information for a type must be external to the type[^1], and the standard technique is to put it into a template and one or more specializations of that template. For iterators, the template in the standard library is named `iterator_traits`[^2]:

```cpp
// the iterator_category for type IterT is whatever IterT says it is
// see item 42 for info on the use of "typedef typename"
template<typename IterT>
struct iterator_traits {
    typedef typename IterT::iterator_category iterator_category;
    ...
};
```

How does `iterator_traits` work? Since `iterator_traits` just parrots back the iterator class's nested typedef, it requires that any user-defined iterator type must contain a nested typedef named `iterator_category`, which identifies the appropriate tag struct. For example, `deque` iterators belong to random access category, and `list`'s iterators are bidirectional:

```cpp
template<...>
class deque {
public:
    class iterator {
    public:
        typedef random_access_iterator_tag iterator_category;
        ...
    };
    ...
};
```

```cpp
template<...>
class list {
public:
    class iterator {
    public:
        typedef bidirectional_iterator_tag iterator_category;
        ...
    };
    ...
};
```

Since there's no such thing as a nested typedef inside a built-in pointer, we need the support of _partial template specialization_:

```cpp
template<typename IterT>
struct
```

[^1]: For example, if `advance` is called with a pointer `const char*` and an `int`, since traits technique must apply to built-in types like `const char*`, and there's no way to nesting information inside pointers, thus the traits information for a type must be external to the type.

[^2]: By convention, traits are always implemented as structs, but that  structs are called "traits classes" - not joking.
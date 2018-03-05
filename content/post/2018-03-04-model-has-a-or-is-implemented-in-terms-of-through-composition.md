---
title: "Item-38 Model 'has-a' or 'is-implemented-in-terms-of' through composition"
date: 2018-03-04T15:49:31-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Model has-a or is-implemented-in-terms-of through composition
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-04.gif
---

In the application domain, composition means has-a. In the implementation domain, it means is-implemented-in-terms-of.
<!--more-->

_Composition_ is the relationship where objects of one type contain objects of another type. It's also known as _layering_, _containment_, _aggregation_, and _embedding_. As public inheritance means "is-a", there're are two meanings for composition:

* "has-a" in the application domain (where we model things in the world with objects, such as people, vehicles, video frames, etc.)
* "is-implemented-in-terms-of" in the implementation domain (where the objects are purely implementation artifacts, e.g., buffers, mutexes, search trees, etc)

While the has-a relationship is easy enough to understand, the distinction between is-a and is-implemented-in-terms-of is sometimes troublesome. For example, suppose we'd like to (re)use the `list` template in the standard C++ library to represent fairly small sets of objeccts, i.e., collections without duplicates. 

In the first glimpse, we may consider the following implementation:

```cpp
template<typename T>   // the wrong way to use list for Set
class Set: public std::list<T> {...};
```

As item 32 explains, if D is-a B, everything true of B is also true of D. However, a list object may contains duplicates, but a Set may not contain duplicates. It is thus untrue that a Set is-a list, and public inheritance is the wrong way to model this relationship.

The right relationship between the Set and the list should be **is-implemented-in-terms-of**:

```cpp
template<typename T>
class Set {
public:
    bool member(const T& item) const;
    void insert(const T& item);
    void remove(const T& item);
    std::size_t size() const;
private:
    std::list<T> rep;  / representation for Set data
};
```

```cpp
template<typename T>
bool Set<T>::member(const T& item) const
{
    return std:find(rep.begin(), rep.end(), item) != rep.end();
}

template<typename T>
void Set<T>::insert(const T& item)
{
    if (!member(item)) rep.push_back(item);
}

template<typename T>
void Set<T>::remove(const T& item)
{
    typename std::list<T>::iterator it =   // see item 42 for info on typename
        std::find(rep.begin(), rep.end(), item);
    if (it != rep.end()) rep.erase(it);
}

template<typename T>
std::size_t Set<T>::size() const
{
    return rep.size();
}
```

As above shows, Set's member functions can lean heavily on functionality already offered by `list` and other parts of the standard library. Since they are so simple, they make reasonable candidates for inlining (refer to item 30 before confirming doing so).
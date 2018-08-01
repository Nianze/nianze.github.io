---
title: "[EMCpp]Item-20 Use Weak_ptr for Shared_ptr Like Pointers That Can Dangle"
date: 2018-08-01T18:44:19-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Use Weak_ptr for Shared_ptr Like Pointers That Can Dangle
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-08/01.gif
---

Potential use cases for `std::weak_ptr` include caching, observer lists, and the prevention of `std::shared_ptr` cycles.
<!--more-->

From an efficiency perspective, the `std::weak_ptr` is essentially the same as `std::shared_ptr`, except that they don't participate in the _shared ownership_ of objects and hence don't affect the _pointed-to object's reference count_. However, they do manipulate a second reference count in the control block (_weak count_), so they actually do all the same operations such as construction, destruction, and assignment involve atomic reference count manipulations.

As a fact, `std::weak_ptr` isn't a standalone smart pointer, but an augmentation of `std::shared_ptr`:

```cpp
auto spw = std::make_shared<Widget>(); // reference count (RC) is 1 after spw is constructed
...
std::weak_ptr<Widget> wpw(spw);   // RC remains 1 
...
spw = nullptr; // RC becomes 0, Widget gets destroyed, wpw dangles
if (wpw.exipred()) ...  // true
```

Usually, the purpose of creating a `std::weak_ptr` is to check the dangling `std::weak_ptr` (when the related control block has zero-value reference count), and if it hasn't expired, we may access the object it points to. Separating the check and the dereference would introduce a race condition, so we need an atomic operation to check and access the object at the same time. There are two ways to do this:

```cpp
auto spw1 = wpw.lock();  // spw1 type is shared_ptr<Widget>; if wpw's expired, spw1 is null
std::shared_ptr<Widget> spw2(wpw);  // if wpw's expired, throw std::bad_weak_ptr
```

There are at least three use cases for `std::weak_ptr`. 

#### Caching

Given a factory function returning `std::unique_ptr`:

```cpp
std::unique_ptr<const Widget> loadWidget(WidgetID id);
```

We might consider wrap a cache layer on top of `loadWidget` due to considerations such as expensive database I/O cost or frequent queries from clients. A quick-and-dirty implementation using `std::weak_ptr` may fit the requirement[^1]:

```cpp
std::shared_ptr<const Widget> fastLoadWidget(WidgetID id)
{
    static std::unordered_map<WidgetID, 
                              std::weak_ptr<const Widget>> cache;
    auto objPtr = cache[id].lock();
    if (!objPtr) {
        objPtr = loadWidget(id);
        cache[id] = objPtr;
    }
    return objPtr;
}
```

#### Observer list

In the Observer design pattern, there are two components:

1. subjects: whose state may change
2. observers: who will be notified when state changes occur

Each subject may contain a data member holding pointers to its observers to issue state change notifications. Since subjects only cares if an observer gets destroyed (to cancel subsequent notifications) and needn't control the lifetime of their observers, a reasonable design, therefore, is to let each subject hold a container of `std::weak_ptr`s to its observers, and check if a pointer dangles before using it.

#### Cycling prevention

In strictly hierarchal data structures such as trees, child nodes are typially owned only by their parents. When a parent node is destroyed, child nodes are destroyed, too. Links from parents to children are generally best represented by `std::unique_ptr`, while back-links from children to parents can be safely implemented as raw pointers[^2].

In other pointer-based non-strict-hierarchical data structure, however, forward-links may be best implemented in terms of `std::shared_ptr`, and to prevent cycles, which will lead to resource leak[^3], back-link should use `std::weak_ptr`.

[^1]: A potential refinement is to remove the expired cache, since right now the cache accumulate `std::weak_ptr` corresponding to `Widget`s that are no longer in use (and have therefore been destroyed).
[^2]: Children have a shorter lifetime than their parent node, so there's no risk of a child node dereferencing a dangling parent pointer.
[^3]: Two `std::shared_ptr`s point to each other wil prevent both from being destroyed: even if both object are unreachable from other program data structures, each will have a reference count of one.
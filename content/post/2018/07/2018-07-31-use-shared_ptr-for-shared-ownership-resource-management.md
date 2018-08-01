---
title: "[EMCpp]Item-19 Use std::Shared_ptr for Shared-ownership Resource Management"
date: 2018-07-31T17:59:25-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Use Shared_ptr for Shared-ownership Resource Management
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-07/31.gif
---

`std::shared_ptrs` offer convenience approaching that of garbage collection for the shared lifetime management of arbitrary resources.
<!--more-->

#### Some facts

* `std::shared_ptr`s are twice the size of a raw pointer: 
    * a raw pointer to the resource
    * a raw pointer to the resource's _control block_, which is dynamically allocated and contains
        * reference count
        * weak count
        * other optional data (e.g., custom deleter, allocator, etc)
* increments and decrements of the reference count are atomic 
    * reading and writing reference counts is typically slower than non-atomic operations and comparatively costly
    * the related atomic operations typically map to individual machine instructions. Admittedly, they are expensive compared to non-atomic instructons, but they're still just single instructions
    * move-constructing a `std::shared_ptr` from another `std::shared_ptr` requires no refernece count manipulation
* Default resource destruction is via `delete`, but custom deleters are supported
    * the type of the deleter has no effect on the type of the `std::shared_ptr` (they're in the control block)
* `std::shared_ptr` is designed only for pointers to single objects, and can't work with arrays, unlike `std::unique_ptr`

Basically, this is how a `std::shared_ptr<T>` object looks like in the memory:

```
 std::shared_ptr<T>
┌──────────────────────┐   ┌──────────┐
│      Ptr to T        ├──>│ T Object │
├──────────────────────┤   └──────────┘
│ Ptr to Control Block ├───┐
└──────────────────────┘   ↓     Control Block
                           ┌───────────────────────┐
                           │    Reference Count    │
                           ├───────────────────────┤
                           │      Weak Count       │
                           ├───────────────────────┤
                           │      Other Data       │
                           │ (e.g., custom deleter,│
                           │   allocator, etc.)    │
                           └───────────────────────┘

``` 

It is worth noting that `std::shared_ptr` design is more flexible than `std::unique_ptr` in the aspect of specifying custom deleters, because, unlike `std::unique_ptr`, the type of the deleter is not part of the type of the `std::shared_ptr`:

```cpp
auto customDeleter1 = [](Widget *pw) {...};
auto customDeleter2 = [](Widget *pw) {...};

std::unique_ptr<Widget, decltype(customDeleter1)> upw1(new Widget, customDeleter1);
std::unique_ptr<Widget, decltype(customDeleter2)> upw2(new Widget, customDeleter1);

std::shared_ptr<Widget> spw1 (new widget, customDeleter1);
std::shared_ptr<Widget> spw2 (new widget, customDeleter2);
std::vector<std::shared_ptr<Widget>> vpw { spw1, spw2 };
```

Apart from placing `spw1` and `spw2` in the same container, we could also assign one to another, or pass them into a function taking a parameter of type `std::shared_ptr<Widget>`. None of these things can be done with `std::unique_ptr`s, since their types differ due to different custom deleters.

#### Avoid multiple control blocks from `this` pointer 

Below is the rules to create the control block:

* a control block is created when `std::make_shared` (EMCpp item 20) is called (which manufactures a new object to point to)
* a control block is created when `std::shared_ptr` is constructed from a unique-ownership pointer (i.e., a `std::unique_ptr` or `std::auto_ptr`), and the unique-ownership pointer is set to null later.
* a control block is created when a `std::shared_ptr` is called with a raw pointer
    * this may lead to double deletion issue (creating two control blocks with the same raw pointer), so avoid passing raw pointers to a `std::shared_ptr`
    * if have to, do in this form `std::shared_ptr<Widget> spw(new Widget, loggingDel);` to use `new` directly
* the same control block will be shared if a `std::shared_ptr` is constructed using another `std::shared_ptr` as initialization argument (by calling `std::shared_ptr` copy constructor)

Even though we remember the rule to restrict the creation of `std::shared_ptr` from raw pointers, we might surprisingly create multiple control blocks through the `this` pointer, which is also a raw pointer. For example, `Widget` has a member function `void processing();`, and we use a vector to keep track of `Widget`s that have been processed. A reasonable-looking approach looks like this:

```cpp
std::vector<std::shared_ptr<Widget>> processedWidgets;
class Widget {
public:
    ...
    void process();
    ...
};

void Widget::process(){
    ...
    processedWidgets.emplace_back(this);  // add current Widget to list of processed Widgets
    ...
}
```

This code will compiler, but it has potential danger: `process()` passes raw pointer `this` to a container of `std::shared_ptr`, resulting to a new control block for pointed-to `Widget`(`*this`); as long as there are `std::shared_ptr`s outside the `process()` that already point to that `Widget`, undefined behavior shows up.

Here, we want a class managed by `std::shared_ptr`s to be able to safely create a `std::shared_ptr` from a `this` pointer without creating multiple control blocks. The solution is to inherit from a base class template  `std::enable_shared_from_this`, which contains a member function `shared_from_this()`, which points to the same object as the `this` pointer. We can use this function to create a `std::shared_ptr` worring about creating a new control block.

```cpp
class Widget: public std::enable_shared_from_this<Widget> {
public:
    ...
    void process();
    ...
};

void Widget::process()
{
    ...
    processedWidgets.emplace_back(shared_from_this());
    ...
}
```

Two points worth noting:

1. Here, the derived class(`Widget`) inherites from a base class templatized on the derived class. This design pattern is called _CRTP_: The Curiously Recurring Template Pattern.
2. Internally, `shared_from_this()` looks up the control block for the current object, and it creates a new `std::shared_ptr` referring to that control block. This means there must be an existing `std::shared_ptr` that points to the current object. If no such `std::shared_ptr` exists, behavior is undefined (typically an exception will be thrown)

To prevent invoking `shared_from_this()` before a `std::shared_ptr` points to the object, classes inheriting from `std::enable_shared_from_this` often declare their constructors `private` and provide factory functions returning  `std::shared_ptr`s to clients:

```cpp
class Widget: public std::enable_shared_from_this<Widget> {
public;
    template<typename... Ts>
    static std::shared_ptr<Widget> create(Ts&&... params);
    ...
    void process(); // as before
    ...
private:
    ... // ctors
};
```


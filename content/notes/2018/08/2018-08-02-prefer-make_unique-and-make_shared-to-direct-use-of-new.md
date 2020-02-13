---
title: "[EMCpp]Item-21 Prefer std::make_unique and std::make_shared to Direct Use of New"
date: 2018-08-02T18:45:53-04:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: Prefer make_unique and make_shared to Direct Use of New
autoThumbnailImage: true
thumbnailImagePosition: right
featured_image: 2018/2018-08/02.gif
---

Compared to `new`, make functions eliminate source code duplication, improve exception safety, and, for `std::make_shard` and `std::allocate_shared`, generate code that's smaller and faster.
<!--more-->

_Make functions_ take an arbitrary set of arguments, perfect forward them to the constructor for a dynamically allocacted object, and return a smart pointer to that objet. There are three _make functions_:

* `std::make_unique`
* `std::make_shared`
* `std::allocate_shared`[^1]

According to the description above, a basic version of `std::make_unique` is simply:

```cpp
template<typename T, typename... Ts>
std::unique_ptr<T> make_unique(Ts&&... params){
    return std::unique_ptr<T>(new T(std::forward<Ts>(params)...));
}
```

#### Good parts

There are thee reasons to prefer make functions to direct use of `new`.

1. Eliminate code duplication

    ```cpp
    auto upw1(std::make_unique<Widget>());
    std::unique_ptr<Widget> upw2(new Widget);
    ```

    As we can see above, using make functions avoids code duplication of the repeating type `Widget`.

2. Improve exception safety

    Given following functions:

    ```cpp
    void processWidget(std::shared_ptr<Widget> spw, int priority);
    int computePriority();
    ```

    then there will be potential resource leak if we directly use `new` like this:

    ```cpp
    processWidget(std::shared_ptr<Widget>(new Widget), computePriority());
    ```

    The potential edge case comes with compilers' translation of source code into object code: compilers may emit code to execute the operations in this order:

    1. Perform "new Widget"
    2. Execute `computePriority`
    3. Run `std::shared_ptr` constructor

    At runtime, if `computePriority` produces an exception, the dynamically allocated Widget from Step 1 will be leaked, since it will never be stored in the `std::shared_ptr` that's supposed to start managing it in Step 3. 

    If we use `std::make_shared` instead of using `new` inside `std::shared_ptr`, there's no Step 1, so Step 2 will never be executed between a `new` operation and the construction of `std::shared_ptr`, which is thus exception-safe.

3. Smaller and faster code for `std::shared_ptr`

    Compared with direct use of `new`, the improved efficiency provided by `std::make_shared` and `std::allocate_shared` is related with its memory allocation mechanism.

    * If we directly use `new` like this - `std::shared_ptr<Widget> spw(new Widget);` - there are two phaces of allocation involved: 
        * one for `Widget` object, 
        * another for the control block associated with that object.
    * Instead, `auto spw = std::make_shared<Widget>();`, one allocation suffices: `std::make_shared` allocates a single chunk of memory to hold both the `Widget` object and the constrol block. 
        * This optimization reduces the static size of the program, since the code contains only one memory allocation call
        * This operation also increases the speed of the executable code, since memory is allocated only once
        * Further more, total memory footprint is potentially reduced, since some of the bookkeeping information in the control block is obviated.

#### Weak parts

1. Specify custom deleters

    There's no way to specify a custom deleter using a make function, but using `new` is straightforward:

    ```cpp
    auto widgetDeleter = [](Widget* pw) {...};
    std::unique_ptr<Widget, decltype(widgettDeleter)> upw(new Widget, widgetDeleter);
    std::shared_ptr<Widget> spw(new Widget, widgetDeleter);
    ```

2. Pass braced initializers

    In these calls,

    ```cpp
    auto upv = std::make_unique<std::vector<int>>(10, 20);
    auto spv = std::make_shared<std::vector<int>>(10, 20);
    ```

    the resulting smart pointers point to `std::vector`s with 10 elements, each of value 20, which means within the make functions, the perfect forwarding code uses the non-`std::initializer_list` constructor. If we do want to perfect-forward a braced initializer, we use following workaround;

    ```cpp
    auto initList = { 10, 20 }; // create std::initializer_list
    auto spv = std::make_shared<std::vector<int>>(initList); // create std:vector using std::initializer_list cotr
    ```

3. Custom memory management or memory restriction concerns for `std::shared_ptr`

    Due to the extra control block in `std::shared_ptr`, there are two more edge cases where make functions may be ill-advised:

    * classes with custom memory management: 
        * if a class defines its own versions of `operator new` and `operator delete`, it implies the global memory allocation and deallocation routines for objects of this class are inappropriate. 
        * class-specific routines are often designed only to allocate and deallocate chunks of memory of pricisely the size of objects of this class
        * `std::allocate_shared` however requests to allocate the size of one object plus the size of a control block, so the class-specific routines are poor fit for `std::allocate_shared` and custom deleters.
    * systems with memory concerns
        * when using `std::make_shared`, the memory allocation for the object and the control block is at the same time, which brings us the smaller and faster code mentioned above; however, this also means that the deallocation for the same chunk of memory has to be at the same time
        * when an object's reference count goes to zero, the object is destroyed (via its destructor), but the memory it occupies will wait to be released until the control block also gets destroyed
        * control block contains a _weak count_ (a second reference count for `std::weak_ptr`); as long as the weak count is greater than zero, the control block must continue to exist
        * if the object type is quite large and the time between destrution of the last `std::shared_ptr` and the last `std::weak_ptr` is significant, a lag occurres between when an object is destroyed and when the memory this object (and its control block) occupied is freed
        * if memory is a concern, this lag will make us frown

Due to the reasons above, we may have to give up make function and directly use `new`, but we also want to keep our program exception-safe. Here is a workaround, take the same `processWidget` for example:

```cpp
std::shared_ptr<Widget> spw(new Widget, cusDel);
processWidget(std::move(spw), computePriority());  // keep arg as rvalue, so it's move-enabled
```

The `std::move` here is to make sure the argument we pass to `processWidget` is rvalue, so that expensive copy construction for a `std::shared_ptr` object, which involves atomic increment of its reference count, will be replaced by a move construction, which requires no reference count manipulation.

[^1]: `std::allocate_shared` acts just like `std::make_shared`, except its first argument is an allocator object to be used for the dynamic memory allocation.

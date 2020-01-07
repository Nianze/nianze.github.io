---
title: "Item-49 Understand the behavior of the new handler"
date: 2018-03-16T19:52:09-04:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: understand the behavior of the new handler
autoThumbnailImage: false
thumbnailImagePosition: right
featured_image: 2018/2018-03/2018-03-16.gif
---

`set-new-handler` allows you to specify a function to be called when memory allocation requests cannot be satisfied.
<!--more-->
<!-- toc -->

# The basic

If `operator new` can't satisfy a memory allocation request, it will call a client-specifiable error-handling function called a `new-handler` before throwing a `bad_alloc` exception. To specify this out-of-memory-handling function, clients call `set_new_handler`, a standard library function declared in `<new>`:

```cpp
namespace std {
    typedef void (*new_handler)();
    new_handler set_new_handler(new_handler p) throw();
}
```

The `throw()` here is an exception specification, telling us that function `set_new_handler` won't throw any exceptions (though there's more truth, refer to item 29).

`set_new_handler`'s parameter is the new `new_handler` we want to specify, which is a pointer to the function `operator new` should call if it fails to allocate the requested memory, and the return value if the previous `new_handler`. Once `operator new` fails to fulfill a memory request, it calls the `new_handler` function repeatedly until it _succeeds_ to find enough memory (more details in item 51), so this default behavior gives us following conclusion - a well-designed new-handler function must do one of the following:

* **Make more memory available** to allow the next memory allocation attempt inside `operator new` to succeed[^1].
* **Install a different new-handler** that may be capable to make more memory [^2]. A variation is to modify the behavior of current `new-handler` (via modifying static, namespace specific, or global data the affects the new-handler's behavior)
* **Deinstall the new-handler**, i.e., pass the null pointer to `set_new_handler`, which leads to `operator new` throwing a `bad_alloc` exception.
* **Throw an exception** of type `bad_alloc` or some type derived from `bad_alloc`, which will firstly be caught by `operator new` and then propagate to the site originating the request for memory.
* **Not return**, typically by calling `abort` or `exit`.

For example, to use `set-new-handler`:

```cpp
// new handler to install
void outOfMem()
{
    std::cerr << "Unable to satisfy request for memory\n";
    std::about();
}

int main()
{
    std::set_new_handler(outOfMem);
    int *pBigDataArray = new int[100000000L];
}
```

# Customize the `new-handler` per class

C++ has no support for class-specific new-handlers, so we implement this by ourselves: we have each class provide its own versions of `set_new_handler` (which allows clients to specify the customized `new-handler`) and `operator new` (which ensures the class-specific `new-handler` is used in place of the global `new-handler` when memory allocation request fails).

To make thie ensurance confirmed, this class-specific `operator new` should do the following stuff:

1. Call the standard `set_new_handler` to install `Widget`'s own error-handling function as the global new-handler.
2. Call the global `operator new` to perform the actual memory allocation. Two things may happen during this step:
    * if allocation ultimately fails and a `bad_alloc` is thrown by the global `operator new`, restore the original global new-handler, and then propagate the exception
    * if allocation succeeds, return a pointer to the allocated memory, and then restore the original global new-handler prior to the call to `Widget::operator new`.

To ensure that the original new-handler is always reinstalled, we can treat the global new-handler as a resource and follow the advice of item 13 to use resource-managing objects to prevent resource leaks:

```cpp
class NewHandlerHolder {
public:
    explicit NewHandlerHolder(std::new_handler nh) // aquire the original new-handler
    :handler(nh) {}
    ~NewHandlerHolder()
    { std::set_new_handler(handler); }  // release the original new-handler
private:
    std::new_handler handler;  // remember the original new-handler
    NewHandlerHolder(const NewHandlerHolder&); // prevent copying see item 14
    NewHandlerHolder& operator=(const NewHandlerHolder&); // prevent copying see item 14
};
```

Since the behavior of setting a class-specific new-handler is the same regardless of the class, we can reuse the setting procedure by creating a "mixin-style" base class (i.e., a base class that's designed to allow derived classes to inherit a single specific capability), so that each derived class not only inherits the `set_new_handler` and `operator new` functions from the base class, but also gets a different class-specific `new-handler` from the template.

```cpp
template<typename T>      // "mixin-style" base class 
class NewHandlerSupport { // for class-specific set_new_handler support
public:
    static std::new_handler set_new_handler(std::new_handler p) throw();
    static void* operator new(std::size_t size) throw(std::bad_alloc);
    ... // other versions of op. new - see item 52
private:
    static std::new_handler currentHandler;
};
```

```cpp
template<typename T>
std::new_handler NewHandlerSupport<T>::set_new_handler(std::new_handler p) throw()
{
    std::new_handler oldHandler = currentHandler;
    currentHandler = p;
    return oldHandler;
}

template<typename T>
void* NewHandlerSupport<T>::operator new(std::size_t size) throw(std::bad_alloc)
{
    NewHandlerHolder h(std::set_new_handler(currentHandler)); // install new-handler
    return ::operator new(size);  // allocate memory or throw
} // restore global new-handler

template<typename T>
std::new_handler NewHanderSupport<T>::currentHandler = 0; // init.  currentHandler to null
```

With this class template, adding `set_new_handler` support to `Widget` is easy: `Widget` just inherits from `NewHandlerSupport<Widget>`:

```cpp
class Widget: public NewHandlerSupport<Widget> {
public:
    ... // without declaration for set_new_handler or operator new
};
```

One interesting point for this design is that  `Widget` inheriting from a templatized base class that takes `Widget` itself as a type parameter, and this technique has a straightforwart name: _curiously recurring template pattern (CRTP)_. 

Another point worth noting is that the `NewHandlerSupport` template never uses its type parameter `T`, because it doesn't need to: all we need is a different copy of static data member `currentHJandler` for each class inheriting from `NewHandlerSupport`, and template parameter `T` just makes it possible to distinguish these derived classes - the template mechanism automatically generates a copy of `currentHandler` for each `T` with which `NewHandlerSupport` is instantiated.

Finally, let's take a look at how to use the new-handling capabilities in `Widget`:

```cpp
void outOfMem(); // decl. of class-specific new-handler func.
Widget::set_new_handler(outOfMem); // set outOfMem as Widget's new-handler
Widget *pw1 = new Widget; // if mem. alloc. fails, call outOfMem
std::string *ps = new std::string; // if mem. alloc. fails, call the original global new-handler (if there is one)
Widget::set_new_handler(0);  // set the Widget-specific new-handler to nothing (null)
Widget *pw2 = new Widget;  // there's no new-handling func. for Widget now, so if mem. alloc. fails, throw an exception immediately
```

# Traditional failure-yields-null alternative for `operator new`

Althought now it is specified to throw a `bad_alloc` exception, until 1993, C++ required that `operator new` return null when it way unable to allocate the requested memory. Unwilling to abandon the traditional behavior, the C++ standardization committee provided an alternative form of `operator new` called "nothrow" forms, in part because the forms employ `nothrow` objects defined in the header `<new>`:

```cpp
class Widget {...};
Widget *pw1 = new Widget;  // throws bad_alloc if allocation fails
if (pw1 == 0) ... // this test must fail
Widget *pw2 = new (std::nothrow) Widget; // returns 0 if allocation fails
if (pw2 == 0) ... // this test may succeed
```

However, using `new (std::nothrow) Widget` only guarantees that `operator new` won't throw, not the whole expression: after the nothrow versoin of `operator new` succeeds to allocate enough memory for a `Widget` object, and then the `Widget` constructor is called, chances are that the `Widget` constructor might itself new up some memory and throw, and then the exception will be propagated as usual. 

Conclusion: we never have a need for nothrow new.

[^1]: One way to achieve this strategy is to allocate a large block of memory at program start-up, then release it for use in the program the first time the new-handler is invoked.

[^2]: The strategy may be implemented by calling `set_new_handler` inside current `new-handler`. The next time `operator new` call the `new-handler` function, it will get the one most recently installed.

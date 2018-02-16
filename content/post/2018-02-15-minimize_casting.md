---
title: "Minimize_casting"
date: 2018-02-15T17:43:53-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: postpone variable definitions
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-02/gif/0.gif
---

Avoid casts and develop a cast-free alternative whenever practical, especially `dynamic_cast` in performance-sensitive code.
<!--more-->

Casts subvert the C++ type system, so it is a feature we want to approach with great respect.

### Cast style

There are three different ways to write the same cast:

1. C-style casts:
    ```cpp
    (T) expression // cast expression to be of type T
    ```
2. Function-style casts  
    ```cpp
    T(expression)  // There's no difference in meaning between C-style and function-style casts. Both of them are old-style casts
    ```
3. C++-style casts (new-style casts)
    ```cpp
    const_cast<T>(expression)
    dynamic_cast<T>(expression)
    reinterpret_cast<T>(expression)
    static_cast<T>(expression)
    ```
    Each serves a distinct purpose:  
    * `const_cast` is used to cast away the constness of objects, which is the only C++-style cast that can do this.
    * `dynamic_cast` is primarily used to perform "safe downcasting," i.e., to determine whether an object is of a particular type in an inheritance hierarchy. This is the only cast that cannot be performed using the old-style syntax. It is also the only cast that may have a significant runtime cost.
    * `reinterpret_cast` in intended for low-level casts that yield implementation-dependent (i.e., unportable) results, e.g., casting a pointer to an `int`. Item 50 shows once its usage.
    * `static_cast` is used to force implicit conversions (e.g., non-`const` object to `const` object (item3), `int` to `double`, etc.) as well as some reverse of such conversions (e.g., `void*` pointers to typed pointers, pointer-to-base to pointer-to-derived), but it cannot cast from `const` to non-`const` objects.

The good points of using new style casts are:  
1. new styles are much easier to identify in code for both humans and for tools like `grep`, thus simplifying the process of locating the code during debugging.
2. The more narrowly specified purpose of each cast makes it possible for compilers to diagnose usage errors.

Sometimes an old-style cast may "feel" better: suppose we want to call an `explicit` constructor to pass an object to a function:

```cpp
class Widget {
public:
    explicit Widget(int size);
    ...
};
void doSomeWork(const Widget& w);

doSomeWork(Widget(15));  // create Widget from in with function-style cast
doSomeWork(static_cast<Widget>(15)); // cast with C++-style
```

Still, feeling is just feeling. Code that leads to a core dump feels pretty reasonable when we write it, so we'd better ognore feelings and use new-style casts all the time.

## Behind cast

Type conversions often lead to code that is executed at runtime, more than simply telling compilters to treat one type as another:

```cpp
int x, y;
...
double d = static_cast<double>(x) / y;  // divide x by y using floating point division
```

the cast from the `int x` to a `double` almost certainly generates code, because on most architectures, the underlying representation for an `int` is different from that for a `double`. 

Let's see another example:

```cpp
class Base {...};
class Derived: public Base {...};

Derived d;
Base *pb = &d;  // implicitly convert Derived* to Base*
```

When creating the base class pointer to a derived class object, sometimes, depending on the various compilers, an offset may be applied at runtime to the `Derived*` pointer to get the correct `Base*` pointer value, and now a single object of type `Derived` now have more than one address! This can't happen in Java, or C#, or C, but it _does_ happen in C++, virtually all the time in the case of multiple inheritance, and some of the times under single inheritance. 

The lesson we learn:

> we should generally avoid making assumptions about how things are laid out in C++, and certainly not perform casts based on such assumptions.

For example: casting object addresses to `char*` pointers and then using pointer arithmetic on them almost always yields undefined behavior.

Another lesson we may learn from: many application frameworks requires that virtual member function implementations in derived classes call their base class conterparts first, and below is a wrong version to make the `SpecialWindow::onResize()` (derived class virtual function) to invoke its base class `Window`'s conterparts:

```cpp
class Window {  // baes class
public:
    virtual void onResize();  // base on Resize impl
    ...
};
class SpecialWindow: public Window {  // derived class
public:
    virtual void onResize() {  // derived onResize impl
        static_cast<Window>(*this).onResize(); // cast *this to Window, then call its onResize
        ... // do SpecialWindow-specific stuff
    }
    ...
};
```

The code casts `*this` to a `Windnow`, so the call to `onResize` will invoke `Window::onResize`. However, surprisingly, the cast will secretly create a new, temporary _copy_ of the base class part of `*this`, then invoke `onResize` on the copy - the `Window::onResize` does not apply on the current object, while the `SpecialWindow`-specific actions apply on that object, leading to the prospect that the code will leave the current object in an invalid state, if the base class virtual function is supposed to do some modifications on current object but fails to do so.

The solution is to eliminate the cast, and call the base class version of `onResize` on the current object:

```cpp
class SpecialWindow: public Window {
public:
    virtual void onResize() {
        Window::onResize();  // call Window::onResize on *this
        ...
    }
    ...
}
```

## Cost of `dynamic_cast`

One common implementatino of `dynamic_cast` is based in part on string comparisons of class names, so if we're performing a `dynamic_cast` on an object in a single-inheritance hierarchy four levels deep, each `dynamic_cast` could cost us up to four calls to `strcmp`. A deeper hierarchy or one using multiple inheritance would be more expensive. So for performance-sensitive code, we should be especially leery of `dynamic_cast`.

When we need `dynamic_cast`? Generally, the need arises because we want to perform derived class operations on a derived class object via a base pointer or base reference. Say in our `Window`/`SpecialWindow` hierarchy, only `SpecialWindow` supports blinking, so we may use `dynamic_cast` this way:

```cpp
class Window {...};
class SpecialWindow: public Window {
public:
    void blink();
    ...
};
typedef std::vector<std::tr1::shared_ptr<Window>> VPW; // item 13 on tr1::shared_ptr

VPW winPtrs;
...
for (VPW::iterator iter = winPtrs.begin();
    iter != winPtrs.end();
    ++iter) {
        if (SpecialWindow *psw = dynamic_cast<SpecialWindow*>(iter->get())) {
            psw->blink();
        }
    }
```

In order to eliminate the `dynamic_cast`, there are two approaches:

1. Use specific containers  
    We could use containers that store pointers to derived class objects directly, so that there's no need to manipulate derived class through base class interfaces:
    ```cpp
    typedef std::vector<std::tr1::shared_ptr<SpecialWindow>> VPSW;

    VPSW winPtrs;
    ...
    for (VPSW::iterator iter = winPtrs.begin();
        iter != winPtrs.end();
        ++iter) {
            (*iter)->blink();
        }
    ```
    Of course, we cannot store all possible `Window` derivatives in the same container under this approach, instead, we may work with multiple type-safe containers.

2. Use virtual functions  
    If we insist on manipulating all possible `Window` derivatives through a base class interface, we could declare a useless `blink` as a virtual functions in base class (if it makes sense):

    ```cpp
    class Window {
    public:
        virtual void blink() {}  // default impl is no-op; see item 34 for why a default impl may be a bad idea
        ...
    };
    class SpecialWindow: public Window {
    public:
        virtual void blink() {...};  // do something in blink
        ...
    };
    typedef std::vector<std::tr1::shared_ptr<Window>> VPW;

    VPW winPtrs;  // container holds ptrs to all possible Window types
    ...
    for (VPW::iterator iter = winPtrs.begin();
        iter != winPtrs.end();
        ++iter) {
            (*iter)->blink();  // no dynamic_cast
        }
    ```

Neigther of two approaches above are universally applicable, but they do provide a viable alternative to `dynamic_cast`. As long as they work, we should embrace them.

Another thing we want to avoid about `dynamic_casts` is designs that involve cascading `dynamic_casts`:

```cpp
class Window {...};
...  // derived clases
typedef std::vector<std::tr1::shard_ptr<Window>> VPW;

VPW winPtrs;
...
for (VPW::iterator iter = winPtrs.begin(); 
    iter != winPtrs.end(); 
    ++iter) {
        if (SpecialWindow1 *psw1 = 
            dynamic_cast<SpecialWindow1*>(iter->get())) {...}
        else if (SpecialWindow2 *psw2 = 
            dynamic_cast<SpecialWindow2*>(iter->get())) {...}
        else if (SpecialWindow3 *psw3 = 
            dynamic_cast<SpecialWindow3*>(iter->get())) {...} 
        ...        
    }
```

This design generates code that is big and slow, and is hard to maintain, for we have to update the condition branch every time we update the base class `Window`. Code like this should almost always be replaced with something based on virtual funciton calls.

In summary, although it's generally not practical to get rid of casts, we should use as few as possible. If we have to use them, like most suspicious constructs, we should isolate casts as much as possible, typically hide them inside functions whose interfaces shiled callers from the work inside.
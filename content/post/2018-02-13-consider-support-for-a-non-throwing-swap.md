---
title: "Item-25 Consider support for a non-throwing swap"
date: 2018-02-13T19:11:15-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: when to declare non-member functions 
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018-02-13.jpg
---

When `std::swap` would be inefficient for your type,provide a non-throwing `swap` member function, a non-member `swap` calling the member, and possibly a specialized `std::swap` for the case of classes (not templates).
<!--more-->

`swap`, since its introduction into STL, is useful for exception-safe programming (item 29) and a common mechanism for coping with the possibility of assignment to self (item 11). Due to its importance, it should be implemented properly, which is exactly what this item explores about.

By default, swapping is accomplished via the standard `swap` algorithm:

```cpp
namesapce std {
    template<typename T>    // typical implementation of std::swap
    void swap(T& a, T& b)   // swaps a's and b's values
    {
        T temp(a);
        a = b;
        b = temp;
    }
}
```

As long as our types support copying (via copy constructor and copy assignment operator), the default `swap` implementation will work. However, for some types, none of these copies are really necessary. For example: there's a common design manifestation called "pimpl idiom" ("pointer to implementation", item 31) that consisting primarily of a pointer to another type that contains the real data:

```cpp
class WidgetImpl {            // class for Widget data
public:
    ...
private:
    int a, b, c;
    std::vector<double> v;    // possibly lots of data:
    ...                       // expensive to copy
};
```

```cpp
class Widget {                    // class using the pimpl idiom
public:
    Widget(const Widgtet& rhs);
    Widget& operator=(const Widget& rhs)  //to copy a Widget,
    {                             // copy its WidgetImpl object.
        ...                       // for details on operator=, see item 10, 11, 12
        *pImpl = *(rhs.pImpl);
        ...
    }
    ...
private:
    WidgetImpl *pImpl;             // ptr to object with real data
};
```

To swap the value of two `Widget` objects, all we need to do is swap their `pImpl` pointers instead of copying three `Widget`s as well as three underlying `WidgetImpl` objects. In order to let default `swap` know this information, we need to specialize `std::swap` for `Widget`:

namespace std {
template<>              // a specialized version of std::swap
void swap<Widget>(Widget& a, Widget& b)  // for when T is Widget
{
    swap(a.pImpl, b.pImpl);       // won't compile here
}
}

The `template<>` at the begining says that this is a _total template specialization_ for `std::swap`, and the `<Widget>` after the name of the function says that the specialization is for when `T` is `Widget`, so compilter knows that when the general `swap` template is applied to `Widget`s, this is the implementation to use - although we are not allowed to alter the contents of the `std` namespace, it is totally fine to specialize standard templates (like `swap`) for our own types (such as `Widget`).

However, this implementation won't compile, because we can't access the private `pImpl` pointers inside `a` and `b`. To solve the problem, we declare a public member function called `swap` that does the actual swapping, then specialize `std::swap` to call the member function:

```cpp
class Widget { // same as above except for the addition of the swap mem func
public:
    ...
    void swap(Widget& other)
    {
        using std::swap;              // use the std::swap
        swap(pImple, other.pImpl);    // to swap Widgets, swap their pImpl pointers
    }
    ...
};

namespace std {
template<>      // revised version of std::swap
void swap<Widget>(Widget& a, Widget& b)  
{
    a.swap(b);  // to swap Wiidgets, call their swap mem func
}
}
```

This implementation will compile and be consistent with the STL container. However, if the `Widget` and `WidgetImpl` were class _template_ instead of classes (so that we could parameterize the type of the data stored in `WidgetImpl`), things get more complicated:

```cpp
template<typename T>
class WidgetImpl {...};

template<typename T>
class Widget {...};
```

It is still easy to put a `swap` member function inside `Widget` the same way as before, but there's a trouble with the specialization for `std::swap`:

```cpp
namespace std {
template<typename T>
void swap<Widget<T>>(Widget<T>& a, Widget<T>& b)  // illegal code!
{
    a.swap(b);
}
}
```

Apparently we're partially specializing a function template `std::swap` here, and the problem is that, although C++ allows partial specialization of class templates, it doesn't allow it for function templates (though some compilers may erroneously accept it). 

The usual approach to "partially specialize" a function template is to add an overload like this:

```cpp
namespace std {
    template<typename T>   // an overloading of std::swap
    void swap(Widget<T>& a, Widget<T>& b)  // note the lack of "<...>"
    {                                      // after "swap"
        a.swap(b);
    }
}
```

However, rather than overloading a common function template, what we do here is overloading a function template `std::swap` in the special `std` namesapce, where it's not allowed to add _new_ templates or classes or functions or anything else into it (the contens of `std` are determined solely by the C++ standardization committee). Programs that cross the line
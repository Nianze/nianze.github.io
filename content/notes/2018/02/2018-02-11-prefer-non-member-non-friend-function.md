---
title: "Item-23 Prefer non-member non-friend function to member function"
date: 2018-02-11T21:33:28-05:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: Prefer non-member non-friend function to member function
autoThumbnailImage: false
thumbnailImagePosition: right
featured_image: 2018/2018-02/2018-02-11.jpg
---

Prefer non-member non-friend functions to member functions for better encapsulation, packaging flexibility, and functional extensibility.
<!--more-->

Suppose there's a class representing web browsers containing following three functions:

```cpp
class WebBrowser {
public:
    ...
    void clearCache();
    void clearHistory();
    void removeCookies();
    ...
};
```

Clients may want to perform these three actions together, so `WebBrowser` might offer two ways to achieve the goal:

* Add a member function

```cpp
class WebBrowser {
public:
    ...
    void clearEverything(); // calls clearCache(), clearHistory(), and removeCookies()
    ...
};
```

* Add a non-member non-friend function

```cpp
void clearBrowser(WebBrowser& wb) 
{
    wb.clearCache();
    wb.clearHistory();
    wb.removeCookies();
}
```

As the title suggests, the non-member approach is better, and below is the reasons:

# Encapsulation

If something is encapsulated, it's hidden from view. The more something is encapsulated, the fewer things can see it, the fewer impact clients get affected by potential change, and the greater flexibility we have to change the inmplementation.

>As a coarse-grained measure of how much code can see a piese of data, we can count the number of functions that can access that data: the more functions that can access it, the less encapsulated the data. 

According to item 22, data members should all be private, so the number of functions that can access them is the number of member functions of the class plus the number of friend functions. Thus, given a member function `clearEverything()` (which can access not only the private data of a class, but also private functions, enums, typedefs, etc) and a non-member non-friend function `clearBrower()`, the latter yields greater encapsulation.

Two more things worth noting are:

1. Friend functions have the same access to a class's private members, hence the same impact on encapsulation. So from an encapsulation point of view, the choice is between member functions and non-member non-friend functions. (BTW, under the view point of implicit type conversion, item 24, the choice is between member and non-member functions)
2. A function being a non-member of one class can still be a member of another class. For example, `clearBrowser()` could be declared as a static member function in some utility class. As long as it is not part of (or a friend of) `WebBrowser`, it doens't affect the encapsulation of `WebBrowser`'s private members.

## Packaging flexibility

In C++, rather than declared in a class, a more natural approach would be to make `clearBrowser()` a non-member function in the same namespace as `WebBrowser`:

```cpp
namespace WebBrowserStuff {
class WebBrowser {...};
void clearBrowser {...};
...
}
```

Unlike classes, namespace can be spread across multiple source file. For convenience functions like 'clearBrowser', this is important, because clients will generally be interested in only some of the convenience functions, and there's no reason for them to compile all of the functions including those they don't need. A straight forward way to separate convenience functions by their functionalities is to declare them in different header files:

```cpp
// header "webbrowser.h" - header for class WebBrowser itself 
// as well as "core" WebBrowser-related functionality
namespace WebBrowserStuff {
    class WebBrowser {...};
    ...  // "core" related functionality, e.g.: non-member functions almost all clients need
}
```

```cpp
// header "webbrowserbookmarks.h"
namespace WebBrowserStuff {
    ...  // bookmark-related convenience functions
}
```

```cpp
// header "webbrowsercookies.h"
namespace WebBrowserStuff {
    ...  // cookie-related convenience functions
}
```

This is exactly how the standard C++ library is organized: there are dozens of headers (e.g.: `<vector>`, `<algorithm>`, `<memory>`, etc.), each declaring some of the functionality in `std`. This allows clients to be compilation dependent only on the parts of the system they actually use (item 31 shows other ways to reduce compilation dependencies). 

On the other side, partitioning is not possible for member functions, because a class must be defined in its entirety.

## Extensibility

Putting all convenience functions in multiple header files but one namespace also means that clients can easily _extend_ the set of convenience functions. All they have to do is add more non-member non-friend functions to the namespace, which is another feature classes can't offer, because class definitions are closed to extension by clients. Even though clients can derive new classes, the derived classes have no access to private members in the base class, so such "extended functionality" has second-class status. Besides, as item 7 explains, not all classes are designed to be base classes.

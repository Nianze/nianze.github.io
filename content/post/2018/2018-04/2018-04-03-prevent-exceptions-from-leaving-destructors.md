---
title: "[MECpp]Item-11 Prevent Exceptions From Leaving Destructors"
date: 2018-04-03T10:54:39-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Prevent Exceptions From Leaving Destructors
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-04/2018-04-02.gif
---

Keep exceptions from propagating out of destructors to prevent C++ calling `terminate` during the statck-unwinding part of exception propagation and ensure that every neccessary cleanup is accomplished.
<!--more-->

Destructor is called in two situations:

* when an object is destroyed under "normal" conditions, e.g., when it goes out of scope, or is explicitly `delete`d.
* when an object is destroyed by the exception-handling mechanism during the stackunwinding part of exception propagation.

According to C++:

>When control leaves a destructor due to an exception while another exception is active, C++ calls the `termiante` function immediately, and any remaining local objects may not get a chance to be destroyed.

For example, consider a `Session` class that will record object creations and destructions:

```cpp
class Session {
public:
    Session();
    ~Session();
    ...
private:
    static void logCreation(Session *objAddr);
    static void logDestruction(Session *objAddr);
};

Session::~Session()
{
    logDestruction(this);
}
```

Because there's no `try...catch` statement, any exception inside the destructor will be propagated to the caller of the destructor. Thus once `logDestructoin` throws an exception during a special case when the destructor itself is called due to some other exception, the `terminate` function would automatically be invoked. So we prefer this design:

```cpp
Session::~Session()
{
    try {
        logDestruction(this);
    }
    catch (...) {}  // do nothing!
}
```

The point here is that the `catch` block shouldn't hold any statement that has potential of throwing exception, and its only purpose here is to prevent exception thrown from `logDestruction` from propagating beyond `Session`'s destructor. Another good reason of catching the exception and prevent the propagation is to make sure the destructor will run to completion, so that any leftover cleanup code after the exception-thrown statement is able to run properly, without being interrupted by the excpetion propagation.
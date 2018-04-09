---
title: "[MECpp]Item-14 Use Exception Specifications Judiciously"
date: 2018-04-08T23:51:00-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Use Exception Specifications Judiciously
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-04/2018-04-08.gif
---

Exception specifications provide a documentation aid and an enforcement mechanism for constraints on exception usage, but they are only partly checked by compilers and they are easy to violate inadvertently.
<!--more-->

## The good points

* Explicitly state what exception a function may throw  

* Compilers are sometimes able to detect inconsistent exception specfications during compilation  

* If the inconsistency is not found during compilation but detected at runtime, the special funciton `unexpected` is automatically invoked to constrain exception usage.  

    - There is a reason for compilers to _partially_ check exception usage for consistency with exception: the language standard _prohibits_ compilers from rejecting a call to a function that _might_ violate the exception specification of the function making the call in order to integrate with older code lacking such specifications:

    ```cpp
    extern void f1();  // might throw anything
    void f2() throw (int)
    {
        ...
        f1();  // legal even if f1 might throw sth other than an int
        ...
    }
    ```

## The unwanted points

* The default behavior for `unexpected` is to call `terminate`, which by default will call `abort`, preventing possible high-level exception handlers from dealing with unexpected exceptions.
    
    Sometimes the default behavior of immediate program termination is not what we want. For example, like the example code below, when an unanticipated exception propagates from inside the `logDestruction` (which isn't supposed to happen due to the assertion `throw()` in exception specification after `logDestruction`, but it's possible due to a call to some other function that throws), by default, `unexpected` will be called, and that will result in termination of the program, without letting the high-level destructor to catch and deal with the exception.

    ```cpp
    class Session {
    public:
        ~Session();
        ...
    private:
        static void logDestruction(Session *objAddr) throw();
    };

    Session::~Session()
    {
        try {
            logDestruction(this);
        }
        catch (...) {}
    }
    ```

## The solution

To avoid calls to `unexpected`:

1. A good way to start is to avoid putting exception specifications on templates that take type argements, because there's no way to know anything about the exceptions thrown by a template's type parameters.
2. A second technique is to omit exception specifications on functions making calls to functions that themselves lack exception specifications.
3. A third technique is to handle exceptions "the system" may throw, such as `bad_alloc` thrown by `operator new` and `operator new[]` when a memory allocation fails (MECpp item 8).

To cope with unexpected exceptions:

* Exploit the fact that C++ allows us to replace unexpected exceptions with exceptions of a different type (`UnexpectedException`), and add this type in the exception specification.

    ```cpp
    class UnexpectexException {};  // all unexpected exception obj. will be replaces
                                   // by obj. of this type
    void convertUnexpected()       // function to call is an unexpected exception is thrown
    {
        throw UnexpectedException();
    }

    set_unexpected(convertUnexpected); // replace the default `unexpected` function with `convertUnexpected`
    ```

* Another way is to translate unexpected exceptions into `bad_exception` by rethrowing the current exception in the customized `unexpected` function, and include `bad_exception` or its base class `exception` in the exception specifications.

    ```cpp
    void convertUnexpected()       // function to call is an unexpected exception is thrown
    {
        throw;  // just rethrow the current exception
    }

    set_unexpected(convertUnexpected); // install convertUnexpected as the unexpected replacement
    ```



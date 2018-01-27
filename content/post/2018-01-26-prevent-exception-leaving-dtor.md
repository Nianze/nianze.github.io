---
title: "Item-8 Prevent exception from leaving destructor"
date: 2018-01-26T20:15:48-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: prevent exception from leaving dtor
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018-01-26.png
---

It is discouraged practice to emit exceptions from destructors.
<!--more-->

Consider what should be done to create a resource-managing class for DBConnection class below:

```cpp
class DBConnection {
public:
    ...
    static DBConnection creast();  // return DBConnection obj
    void close();                  // close connection; throw an exception if closing fails
};
```

To ensure clients don't forget to call `close()` on DBConnection objects, we may want to put `close()` inside the destructor of managing class:

```cpp
class DBConn {    // class to manage DBConnection object
public:
    ...
    ~DBConn()     // make sure database connections are closed
    {
        db.close();
    }
private:
    DBConnetion db;
};
```

However, once `db.close()` yields an exception, `DBConn`'s destructor will propogate the exception, which would be a problem: considering `std::vector<DBConn> v`, chances are that two simultaneously active exceptions (from calling `~DBConn()`) arise during destroying the vector `v`, and program execution will either terminate or yield undefined behavior. Moreover, premature program termination or undefined behavior can result from destructors emitting exceptions even without using containers and arrays. There are 2 ways to handle the situation:  

* Terminate the program  
 
```cpp
DBConn::~DBConn()
{
    try { db.close(); }
    catch(...) {
        // make log entry: the call to close failed;
        std::abort();
    }
}
```

This will prevent the exception from propagating out of the destructor and then leading to undefined behavior.  

* Swallow the exception

```cpp
DBConn::~DBConn()
{
    try { db.close(); }
    catch(...) {
        // make log entry: the call to close failed;
    }
}
```

In general, swallowing exception is a bad idea for it suppresses imporant information, but it is preferable sometimes when the program is asked to be able to reliably continue execution even after an error has been encountered.

A better strategy is to design `DBConn`'s interface so that its clients have an opportunity to handle the possible exception by themselves:

```cpp
class DBConn {
public:
    ...
    void close()         // new interface for clients
    {                    // to handle possible exception outside dtor
        db.close();
        closed = true;   // keep track of whether db has been closed
    }
    ~DBConn()
    {
        if (!closed) {
            try {              // close the connecton
                db.close();    // if the client didn't
            }
        }
        catch (...) {
            // make log entry: the call to close failed;
            //  terminate or swallow
        }
    }
private:
    DBConnection db;
    bool closed;
};
```

Under such a design, if clients decide to ignore the opportunity to close the connection and handle the possible exception by themselves for they believe that no error will occur, they can rely on `DBConn`'s destructor to call `close()` for them. However, if `close()` does throw in `~DBConn`, they're in no position to complain if `DBConn` swallows the exception or terminates the program.

In summary,   
* Never emit exceptions from destructors. If functions in a destructor may throw, catch it and then either swallow it or terminate the program.  
* When class clients need to be able to react to any operation that may throw exceptions, provide a non-destructor function for them to handle such exceptions.

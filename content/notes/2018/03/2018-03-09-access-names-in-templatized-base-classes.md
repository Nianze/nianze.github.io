---
title: "Item-43 Know how to access names in templatized base classes"
date: 2018-03-09T21:48:26-05:00
series:
- effective c++
categories:
- coding
tags:
- technique
- cpp
slug: know how to access names in templatized base classes
autoThumbnailImage: false
thumbnailImagePosition: right
featured_image: 2018/2018-03/2018-03-09.gif
---

In derived class templates, refer to names in base class templates via a `this->` prefix, via `using` declarations, or via an explicit base class qualification.
<!--more-->
<!-- toc -->

# Case Study

Sometimes when we cross from Object-oriented C++ to Template C++ (item 1), inheritance seem to stop working. For example, we'd like to log some information for the `sendMsg` function in base class `MsgSender`, so we make following derived class `LoggingMsgSender`:

```cpp
class CompanyA {
public:
    ...
    void sendClearText(const std::string& msg);
    ...
};

class CompanyB {
public:
    ...
    void sendClearText(const std::string& msg);
    ...
}

class MsgInfo {...};  // class for holding information used to create msg

template<typename Company>
class MsgSender {
public:
    ...  // ctor, dtor, etc.
    void sendClear(const MsgInfo& info)
    {
        std::string msg;
        // create msg from info;
        Company c;
        c.sendClearText(msg);
    }
    ...
};

template<typename Company>
class LoggingMsgSender: public MsgSender<Company> {
public:
    ... // ctor, dtor, etc.
    void sendClearMsg(const MsgInfo& info)
    {
        // write "before sending" info to the log
        sendClear(info);  // call base class function -> not compile
        // write "after sending" info to the log
    }
    ...
};
```

Note that the message-sending function in the derived class has a different name `sendClearMsg` from its counterpart `sendClear` in the base class: this is good design for two reasongs:

1. it avoids the issue of hiding inherited names (item 33)
2. it side-steps the problems inherent in redefining an inherited non-virtual function (item 36)

However, the code above will not compile, because, by default, compilers will not look for the function `sendClear` in the base class. The behavior seems to break our expected inheritance concept from Object-oriented world, but compilers do this for a good reason: they will not know what the base class `MsgSender<Company>` really looks like until when `LoggingMsgSender` is instantiated, so it is possible that there's a special template parameter class `CompanyC` that, instead of providing function `sendClearText`, only supports `sendEncrypted`:

```cpp
class CompanyZ {  // this class offers no sendClearText Fucntion
public:
    ...
    void sendEncrypted(const std::string& msg);
    ...
};
```

In this case, `sendClear` function in `MsgSender` base class will make no sense. To rectify the problem, we can create a specialized version of `MsgSender` for `CompanyZ`:

```cpp
template<>  // signifies this is neither a template nor a standalone class
class MsgSender<CompanyZ> { // but a total specialization of MsgSender
public:
    ... // the same as the general template, except sendCleartext is omitted
};
```

This syntax is known as a _total template specialization_: the template `MsgSender` is specialized for the type `CompanyZ`, and the specialization is _total_ - once the type parameter has been defined to be `CompanyZ`, no other aspect of the template's parameters can vary.

Since base class templates may be specialized and that such specializations may not offer the same interface as the general template, C++ generally  refuses to look in templatized base classes for inherited names. That's why we say inheritance stops working in Template C++ wolrd.

To force C++ to look in templatized base classes, there are three ways:

## 1. Call with "this->"

```cpp
template<typename Company>
class LoggingMsgSender: public MsgSender<Company> {
public:
    ... // ctor, dtor, etc.
    void sendClearMsg(const MsgInfo& info)
    {
        // write "before sending" info to the log
        this->sendClear(info);  // assumes that sendClear will be inherited
        // write "after sending" info to the log
    }
    ...
};
```

## 2. Employ a "using" declaration

This is the same trick we use in item 33, which explains how `using` declaration brings hidden base class names into a derived class's scope[^1]:

```cpp
template<typename Company>
class LoggingMsgSender: public MsgSender<Company> {
public:
    using MsgSender<Company>::sendClear;  // tell compilers to assume that sendClear is in the base class
    ... // ctor, dtor, etc.
    void sendClearMsg(const MsgInfo& info)
    {
        // write "before sending" info to the log
        sendClear(info);  // assumes that sendClear will be inherited
        // write "after sending" info to the log
    }
    ...
};
```

## 3. Explicitly specify the base class qualification

```cpp
template<typename Company>
class LoggingMsgSender: public MsgSender<Company> {
public:
    ... // ctor, dtor, etc.
    void sendClearMsg(const MsgInfo& info)
    {
        // write "before sending" info to the log
        MsgSender<Company>::sendClear(info);  // assumes that sendClear will be inherited
        // write "after sending" info to the log
    }
    ...
};
```

This approach is less desirable, because if the function being called is virtual, explicit qualification turns off the virtual binding behavior.

# Summary

From a name visibility point of view, each of these approaches does the same thing: it promises  compilers that any subsequent specializations of the base class template will support the interface  offered by the general template. However, if the promise turns out to be unfounded, the subsequent compilation will still diagnose invalid references to base class members and reveal the truth:

```cpp
LoggingMsgSender<CompanyZ> zMsgSender;

MsgInfo msgData;
... // put info in msgData
zMsgSender.sendClearMsg(msgData);  // error! won't compile. Compilers know the base class MsgSender<CompanyZ> 
                                   // doesn't offer the sendClear function for this template specilization
```

>Fundamentally, compilers will diagnose invalid references to base class members sooner (when derived class template definitions are parsed) or later (when templates are instantiated with specific template arguments). C++'s policy is to prefer early diagnoses, and that's why it assumes it knows nothing about the contents of base classes when those classes are instantiated from templates.

[^1]: Note that there's difference between the problem solved in this item from that in item 33: here, the problem is that compilers don't search base class scopes unless we explicitly specify it; in item 33, it is due to the derived class names that hide base class names.

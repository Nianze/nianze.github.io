---
title: "Item-41 Understand inplicit interfaces and compile time polymorphism"
date: 2018-03-07T14:21:33-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Understand Inplicit Interfaces and Compile Time Polymorphism
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-07.gif
---

Classes support explicit interfaces based on function signatures, as well as runtime polymorphism through virtual functions; templates support implicit interfaces based on valid expressions, as well as compile-time polymorphism through template instantiation and function overloading resolution.
<!--more-->

## Interface and Polymorphism in OOP

The world of object-oriented programming revolves around _explicit_ interfaces and _runtime_ polymorphism. For example:

```cpp
class Widget {
public:
    Widget();
    virtual ~Widget();

    virtual std::size_t size() const;
    virtual void normalize();
    void swap(Widget& other);  // see item 25
    ...
};
```

```cpp
void doProcessing(Widget& w)
{
    if (w.size() > 10 && w != someNastyWidget){
        Widget temp(w);
        temp.normalize();
        temp.swap(w);
    }
}
```

Regarding the `w` in `doProcessing`, we could conclude:

* _explicit interface_: `w` is of type `Widget`, so it must support the `Widget` interface, which is an _explicit interface_, because it is explicitly visible in the source code (e.g., the .h file for `Widget`)
* _runtime polymorphism_: `w`'s call to some of its virtual member functions exhibits _runtime polymorphism_, because the specific function to call will be determined at runtime based on `w`'s dynamic type (item 37)

Specifically, the explicit interface of `Widget` consists of its function signatures: a constructor, a destructor, and the functions `size`, `normalize`, and `swap`, along with the parameter types, return types, and constnesses of these functions, as well as compilter-generated copy constructor and copy assignment operator (item 5). Potentially, it could also include typedefs, and data members.

## Interface and Polymorphism in templates and generic programming

In the world of templates and generic programming, the explicit interfaces and runtime polymorphism continue to exist, but we also have to consider _implicit interfaces_ and _compile-time polymorphism_. As a comparison, let's take a look at the template version of `doProcessing`:

```cpp
template<typename T>
void doProcessing(T& w)
{
    if (w.size() > 10 && w != someNasyWidget) {
        T temp(w);
        temp.normalize();
        temp.swap(w);
    }
}
```

For `w` in the template `doProcessing`:

* _implicit interface_: `w` must support all the operations performed on it, but there is no explicit function signatures to follow. Rather, there's an implicit interface consists of valid _expressions_ that set constraints on `w`.
* _compile-time polymorphism_: `w` is one of the parameters in `operator>` and `operator!=`, which may involve instantiating function templates with different template parameters, leading to different functions being called during compilation. This is similar to the process to determine which of a set of overloaded functions should be called during compilation.

Specifically, let's take a look those constrains on `w`'s type `T` in the implicit interface:

1. whatever `w.size() > 10 && w != someNasyWidget` yields, the expression as a whole must be compatible with `bool`
2. calls to the copy constructor, to `normalize`, and to `swap` must be valid for objects of type `T`

However, inside the expression `w.size() > 10 && w != someNasyWidget`, constraints on compatibal type regarding the functions `size`, `operator>`, `operator&&`, or `operator!=` are pretty flexible, thanks to the possibility of operator overloading and implicit conversion:

* there's no requirement that `size` returns an integral value - it may simply return an object of some type `X` such that there is an `operator>` that can be called with an object of type `X` and an `int` (10 is of type int)
* there's no requirement that `operator>` take a parameter of type `X` - it may take a parameter of type `Y`, as long as there were an implicit conversion from objects of type X to objects of type `Y`
* there's no requirement that `T` support `operator!=` - it would be just as acceptable for `operator!=` to take one object of type `X` and one object of type `Y`, as long as `T` can be converted to `X` and `someNastyWidget`'s type can be converted to `Y`
* potentially, even `operator&&` could be overloaded, changing the meaning of the above expression from a conjunction to something quite different

Anyway, the implicit interfaces imposed on a template's parameters are just as real as the explicit interfaces imposed on a class's objects, and both are checked during compilation.
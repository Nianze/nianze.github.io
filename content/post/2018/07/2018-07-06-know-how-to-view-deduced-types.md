---
title: "[EMCpp]Item-4 Know How to View Deduced Types"
date: 2018-07-06T10:08:00-04:00
categories:
- technology
- coding
tags:
- technique
- cpp
slug: Know How to View Deduced Types
autoThumbnailImage: true
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-07/06.gif
---

Deduced types can often be seen using IDE editors, compiler error messages, and the Boost TypeIndex library, but the results of some tools may be neither helpful nor accurate.
<!--more-->

Dependending on the phase of the software development process, we might get type deduction information during coding, compilation, and runtime.

#### IDE Editors

Code editors in IDEs often show the types of program entities when we hover our cursor over the entity. In order for the IDE to offer this kind of information, our code must be in a more or less compilable state. Moreover, when more complicated types are involved, the information displayed by IDEs may not be helpful.

#### Compiler Diagnostics

We can get a compiler to show what it deduced for a type by causing a compilation problem using that type:

```cpp
template<typename T> // Declaration only.
class TD; // TD == "Type Displayer". 
```

```cpp
const int theAnser = 42;
auto x = theAnswer;
auto y = &theAnswer;

TD<decltype(x)> xType;
TD<decltype(y)> yType;
```

For the code above, since there's no template definition to instantiate, compiler will yield the error messages like this:

```cpp
error: 'xType' uses undefined class 'TD<int>'
error: 'yType' uses undefined class 'TD<const int *>'
```

Through these errors, we get useful type information.

#### Runtime Output

Consider a more complex example involving a user-defined type (`Widget`), an STL container(`std::vector`), and an `auto` variable (`vm`), which is more representative of the situation where we want to see deduced type information:

```cpp
template<typename T>               // template function to
void f(const T& param);            // be called

std::vector<Widget> createVec();   // factory function
const auto vw = createVec();       // init vm with factory return

if (!vm.empty()) {  
    f(&vm[0]);                     // call f
    ...
}
```

This time, if we want to see what type is deduced for `T` and `param`, the type information displayed by IDE editors is not reliably useful. For example, the deduced type for `T` is shown as:

```cpp
conststd::_Simple_types<std::_Wrap_alloc<std::_Vec_base_types<Widget,std::allocator<Widget> >::_Alloc>::value_type>::value_type *
```

and the `param`'s type is:

```cpp
const std::_Simple_types<...>::value_type *const &
```

In order to create a textual representation of the type we care about and print it out on screen, we might consider the Boost TypeIndex library[^1]. For example:

```cpp
#include <boost/type_index.hpp>
template<typename T>
void f(const T& param)
{  
    using std::cout;  
    using boost::typeindex::type_id_with_cvr;  

    // show T  
    cout << "T =     "       
         << type_id_with_cvr<T>().pretty_name() 
         << '\n';  
    // show param's type  
    cout << "param = "
         << type_id_with_cvr<decltype(param)>().pretty_name()       
         << '\n';  
    ...
}
```

Under compilers from GNU and Clang, Boost.TypeIndex produces this accurate output:

```cpp
T =     Widget const*
param = Widget const* const&
```

[^1]: There is something similar called `typeid` and `std::type_info::name` in Standard C++ that could also display the type, but the output text may not be straightforward (for example, using "PK" to stand for "pointer to const") and might not be reliable.

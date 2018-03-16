---
title: "Item-48 Be aware of template metaprogramming"
date: 2018-03-15T23:00:22-04:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: be aware of template metaprogramming
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-03/2018-03-15.gif
---

Template metaprogramming can shift work from runtime to compile-time (thus enabling earlier error dettection and higher runtime performance), can be used to generate custom code based on combinations of policy choices, and can also be used to avoid generating code inappropriate for particular types.
<!--more-->

Template metaprogramming (TMP) is the process of writing template-based C++ programs that execute inside the C++ compiler, ending up with pieces of C++ source code instantiated from templates, which are then compiled as usual. TMP was discovered, not designed, in the early 1990s, and has later been shown to be Turing-complete, which means that it is powerful enough to compute anything (declare variables, perform loops, write and call functions, etc).

## Strength of TMP

TMP has two great strengths:

1. it makes some things easy that would otherwise be hard or impossiblle
2. it shifts work from runtime to compile-time[^1]

By making use of TMP, we can expect following good consequences:

* Some kinds of errors originally detected at runtime could be found during compilation
* C++ progrmas become more efficient in about every way: smaller executables, shorter runtimes, lesser memory requirements

To take a glimpse into how things work in TMP, let's look at two examples.

### Examples

* `if...else` conditionals in TMP

As item 47 shows, `if...else1` conditionals in TMP are expressed via templates and template specializations[^2]. Let's take a comparason between the "normal" C++ (using `typeid`) and TMP (using traits) based on implementing the pseudo part of `if (iter is a random access iterator)` from STL's `advance`.

    * "normal" C++ approach: evaluate at runtime

    ```cpp
    template<typename IterT, typename DistT>
    void advance(IterT& iter, DistT d)
    {
        if (typeid(typename std::iterator_traits<IterT>::iterator_categoray) == 
            typeid(std::random_access_iterator_tag)) {
                iter += d; // use iterator arithmetic for random access iters
        }
        else {
            if (d >= 0) { while(d--) ++iter; }
            else { while(d++) --iter; }
        }
    }
    ```
    Compared to the one using traits, the `typeid`-based approach has following issues:

    1. less efficient: testing occurs at runtime; executable is larger (since the code to do the testing must be present in the executable)
    2. introduce compilation problems: if `iter` isn't a random access iterator, `iter` will not support operator `+=`, so `iter += d` will not be valid, but compilers will still check this part of code and complain about its invalidation, because they are obliged to make sure that all source code is valid, even if it's not executed.

* Loops in TMP

    TMP has no real looping construct, so the effect of loops is accomplished via recursion, or more specifically, recursive _template instantiations_. As an example, TMP factorial computation demonstates how it works:

    ```cpp
    template<unsigned n>  // general case: the value of Factorial<n> is n times the value of Factorial<n-1>
    struct Factorial {
        enum { value = n * Factorial<n-1>::value };
    };

    template<>
    struct Factorial<0> {
        enum { value = 1 };
    };
    ```

    The looping part of the code occurs where the template instantiation `Factorial<n>` references the tempalte instantiation `Factorial<n-1>`, until hitting the special case, `Factorial<0>`, that causes the recursion to terminate. 
    
    Each instantiation of the `Factorial` template is a struct, and each struct uses the enum hack (item 2) to declare a TMP variable named `value`, which holds the current value of the factorial computation. After recursive template instantiation, each instantiation gets its own copy of `value`.

    To use `Factorial`:

    ```cpp
    int main()
    {
        std::cout << Factorial<5>::value;  // prints 120
        std::cout << Factorial<10>::value; // prints 3628800
    }
    ```

    To sum up the technique keywords: templates and specializations and recursive instantiations and enum hacks.

## What can be accomplished in TMP

### Ensuring dimensional unit correctness

In scientific and engineering applications, it's essential that dimensional units (e.g., mass, distance, time, etc.) be combined correctly. Using TMP, it's possible to ensure (during compilation) that all dimensional unit combinations in a program are correct, no matter how complex the calculations - good example for early error detection.

### Optimizang matrix operations

Consider the following code,

```cpp
typedef SqureMatrix<double, 10000> BigMatrix;
BigMatrix m1, m2, m3, m4, m5;  // create matrices
... // give them values
BigMatrix result = m1 * m2 * m3 * m4 * m5; // compute the product
```

Calculating `result` in the "normal" way calls for the creation of four temporary matrices, one for the reuslt of each call to `operator*`. Furthermore, the independent multiplications generate a sequence of four loops over the matrix elements. 

Using an advanced template technology related to TMP called _expression templates_, it's possible to eliminate the temporaries and merge the loops, without changing the syntax of the client code above while enabling the program consume less memory and run dramatically fast.

### Generating custom design pattern implementations

Design patterns like Strategy (item 35), Observer, Visitor, etc. can be implemented in many ways. Using a TMP-based technology called `policy-based design`, it's possible to create templates representing independent design choices ("policies") that can be combined in arbitrary ways to yield pattern implementations with custom behavior.

Generalized beyond the domain of programming artifacts like design patterns, this technology is a basis for what's known as _generative programming_.

[^1]: Programs using TMP may take _much_ longer to compile than their non-TMP counterparts.

[^2]: Such basic constructs as declaring variables, performing loops, and calling function may look very different from their "normal" C++ counterparts, but that's assembly-level TMP - it's worth to know that libraries for TMP (e.g., Boost's MPL, item 55) offer a higher-level syntax.
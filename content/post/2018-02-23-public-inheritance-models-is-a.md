---
title: Item-32 Make sure public inheritance models "Is-A"
date: 2018-02-23T12:59:53-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: Make sure public inheritance models is a
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018/2018-02/2018-02-23.gif
---

To minimize compilation dependencies, depend on declarations instead of definitions via techniques such as Handle classes and Interface classes.
<!--more-->

C++ doesn't do a very good job of separating interfaces from implementations. A  class definition specifies not only a class interface but also a fair number of implementation details. For example:

```cpp
class Person {
public:
    Person(const std::string& name, cnost Data& birthday, const Address& addr);
    std::string name() const;
    std::string birthDate() const;
    std::string address() const;
    ...
private:
    std::string theName; // implementation detail
    Date theBirthdate;   // implementation detail
    Address theAddress;  // implementation detail
};
```

Here, to compile `Person`, definitions for the data members `string`, `Date`, and `Address` that `Person` uses must be provided, typically through `#include` directives:

```cpp
#include <string>
#include "date.h"
#include "address.h"
```

Unfortunately, this inclusion sets up a compilation dependency between the file defining `Person` and these header files. If any of these header files or the header files' dependent header files is changed, the file containing the `Person` class must be recompiled, as must any files that use `Person`. Such cascading compilation dependencies are annoying.


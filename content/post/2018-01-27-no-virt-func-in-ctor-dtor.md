---
title: "Item-9 不要在构造函数和析构函数中触发虚函数"
date: 2018-01-27T21:03:05-05:00
categories:
- article
- coding
tags:
- technique
- cpp
slug: no virtual func in ctor dtor
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018-01-27.jpg
---

不同于Java或者C#,在C++中构造函数和析构函数里的虚函数不会实现多态的效果。
<!--more-->

假设我们想要构造一个类来记录股票交易的数据，每次有新交易都应把交易信息记录到文档里。由于交易种类多种多样，我们希望用一个统一的抽象基类`Transaction`里相同的接口`logTransaction()`来记录不同的派生类信息：

```cpp
class Transaction {   // 所有交易记录的基类，含纯虚函数所以是抽象类
public:
    Transaction();
    virtual void logTransaction() const = 0;  // 根据不同交易派生类的类型重载对应函数，此处定义为纯虚函数
    ...
};

Transaction::Transaction()
{
    ...
    logTransaction();   // 在构造函数中触发虚函数，记录派生类的交易信息
}
```

对应不同交易的派生类定义如下：

```cpp
class BuyTransaction: public Transaction {
public:
    virtual void logTransaction() const;  // 记录买方交易信息
    ...
}

class SellTransaction: public Transaction {
public:
    virtual void logTransaction() const;  // 记录卖方交易信息
}
```

按照上述函数申明和定义，如果我们构造一个买方派生类的实例：

```cpp
BuyTransaction buy;
```

此时`BuyTransaction`派生类的构造函数会被触发，但是在执行派生类构造函数之前，基类的构造函数会先被触发以构造新实例基类那部分的成员变量。当执行到基类构造函数最后一行的`logTransaction()`时，即使此时创建的实例属于派生类`BuyTransaction`，执行的虚函数依然是基类`Transaction`里面定义的版本。原因有二：

1. 理论上讲，派生类的虚函数可能会用到派生类里多出来的成员变量，而这些成员变量在最开始执行基类的构造函数时还没有被分配资源初始化，为了杜绝这种危险操作所以C++选择执行基类的虚函数。
2. 更底层的原因在于，在第一阶段执行基类构造函数的时候，`buy`在运行时(`runtime`)里的类型信息本来就是被标记为基类的类型`Transaction`的。只有到第二阶段执行派生类`BuyTransaction`的构造函数时，`buy`实例才成为`BuyTransaction`类型。

基于相同的道理，执行析构函数的时候，一旦最开始触发的派生类析构函数开始运行，派生类部分的成员变量就被标记为未定义（`undefined`）；而第二阶段进入基类的析构函数，`buy`实例的类型就被标记为基类，此时在虚函数和`dynamic_cast`等运行时相关的操作看来这就是一个`Transaction`类型的实例。

接着讲上述的例子：如果按照上述定义编译，部分编译器会提出警告(某些则不会，见Item 53)；即使没有警告，由于`logTransaction()`是纯虚函数，没有定义函数体，所以即使通过了编译器这关，在下个阶段由于链接器找不到函数的定义所以也不会生成最终的可执行文件。但如果有人鸡贼的这样定义：

```cpp
class Transaction {
public:
    Transaction()
    { init(); }   // 构造函数里“没有”直接触发虚函数
private:
    void init()
    {
        ...
        logTransaction();  // 但虚函数在第三方函数init()中被调用
    }
};
```

虽然本质上跟之前的程序没有区别，但这样写很可能可以蒙混过链接器这关。一旦程序开始运行，执行到纯虚函数`logTransaction()`的时候程序就会崩溃并停止运行（`abort`）；而如果`logTransaction()`是添加了函数实体定义的普通虚函数，虽然程序可以运行，但无论之后怎样花式捉虫（`debug`），最后在创建实例`buy`时log记录文档里留下的也都是基类`Transaction`版本的交易记录。

---

所以问题来了：

>要怎么实现根据不同派生类以多态方式自动记录交易信息的功能呢？

方法有很多。讲一个常见的：既然不可以在基类构造函数中使用派生类版本的虚函数，那就让派生类在构造实例的时候把自己的交易信息传回基类的(非虚)构造函数中：

```cpp
class Transaction {
public:
    explicit Transaction(const std::string& logInfo); // “explicit”关键词防止隐式转换
    void logTransaction(const std::string& logInfo) const; // 不再是虚函数了
    ...
};

Transaction::Transaction(const std::string& logInfo)
{
    ...
    logTransaction(logInfo);  // 不是虚函数，放心call
}

class BuyTransaction: public Transaction {
public:
    BuyTransaction( parameters )
    : Transaction(createLogString( parameters )) // 将交易信息以传参方式传给基类构造函数
    {...}
private:
    static std::string createLogString( parameters ); // 静态函数，杜绝使用派生类中新定义的成员变量的可能性
};
```

注意上述`createLogString()`函数定义为`static`可以防止出现在构造函数第一阶段（触发基类构造函数的阶段）中使用处于`undefine`状态的派生类成员变量的情形（这也正是上述第一点C++不让在基类构造函数中使用派生类虚函数的原因）。

>P.S.:   
今天是周六，脑抽想试着用中文写下C++复习笔记。。。  
然后发现写这篇花费的时间是之前的至少两倍，主要是寻找各种英文技术术语对应的中文翻译很心累，思维还得在英文和中文中相互转换，翻译真是个累人的活。。。  
以后还是用回英文吧，省心太多。
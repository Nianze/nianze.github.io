---
title: When use Dueque
date: 2016-10-30
categories:
- article
- coding
tags:
- algorithm
- deque
- java
slug: dueque
thumbnailImagePosition: right
thumbnailImage: /images/2016/2016-10-30.jpg
---

Deque vs. LinkedList vs. Stack
<!--more-->

Quote From javadoc:

> ArrayDeque is likely to be faster than Stack when used as a stack, and faster than LinkedList when used as a queue.

## Use ArrayDeque or LinkedList as queue[^0]

### Cons of Linked List
 * Linked structures are the worst structure to iterate with a cache miss on each element
 * Have to allocating a node for each item to insert, which essentially involves JVM/OS and expensive
 * For pop() operation, it mark internal nodes eligible for garbage collection and that's more work behind the scene

### Pros of Linked List
  * When **removing the current element** during iteration, LinkedList has better performance
  * Worth to note: LinkedList supports null element

### When use ArrayDeque as queue
  * if only need to add/remove of both ends, use ArrayDeque
  * e.g.: when using BFS, consider ArrayDeque first.

## Use ArrayDeque or Stack as Stack[^1]

`Deque` exposes a set of operations which is all about being able to fetch/add/remove items from the start or end of a collection, iterate etc. There's deliverately no way to access an element by position, which `Stack` exposes because it's a subclass of `Vector`, making the `Stack` **inconsistent**.

[^0]: <http://stackoverflow.com/questions/6163166/why-is-arraydeque-better-than-linkedlist>
[^1]: <http://stackoverflow.com/questions/12524826/why-should-i-use-deque-over-stack>
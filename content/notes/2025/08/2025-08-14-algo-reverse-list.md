---
title: "Algo Review: reverse list"
date: 2025-08-14T15:11:00
series:
- algorithm
categories:
- coding
tags:
- algorithm
- linkedlist
- reverse
slug: "2025 08 14 Algo Review reverse list"
featured_image: 2025/08/14/linked-list-reverse-n.jpg
---

A review on basic operation of list reversing.
<!--more-->

# Base template

{{< img src="/images/2025/08/14/linked-list-reverse-n.jpg">}}

```python
# iteration
def reverseN(head: listNode, n: int) -> listNode:
    if head is None or head.next is None:
        return head
    pre, cur, nxt = None, head, head.next
    while n and cur:
        cur.next = pre
        pre = cur
        cur = nxt
        if nxt is not None:
            nxt = nxt.next
        n -= 1
    head.next = cur
    return pre
```

{{< img src="/images/2025/08/14/linked-list-reverse-n-rec.jpg">}}

```python
# recursion
successor = None
def reverseN(head: ListNode, n: int):
    global successor
    if n == 1:
        successor = head.next
        return head
    last = reverseN(head.next, n-1)
    head.next.next = head
    head.next = successor
    return last
```

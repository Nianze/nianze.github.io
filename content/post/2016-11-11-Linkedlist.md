---
title: LinkedList reversing
date: 2016-11-11
categories:
- article
- programming
tags:
- algorithm
- linkedlist
slug: linkedlist reversing
thumbnailImagePosition: right
thumbnailImage: /images/2016-11-11.jpg
---

Summary on LinkedList reversing.
<!--more-->


### Starter

#### Special case: LC206 reverse all the nodes in one pass:

```java
public ListNode reverseList(ListNode head) {
    ListNode newHead = null;
    while (head != null) {
        ListNode next = head.next;
        head.next = newHead;
        newHead = head;
        head = next;
    }
    return newHead;
}
```

#### General case: LC92 reverse nodes from position m to n

```java
public ListNode reverseBetween(ListNode head, int m, int n) {
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    ListNode pre = dummy, end, cur;
    for (int i = 0; i < m-1; i++) { pre = pre.next; }
	end = pre.next;
    cur = end.next;
    for (int i = 0; i < n - m; i++) {
        end.next = cur.next;
        cur.next = pre.next;
        pre.next = cur;
        cur = end.next;
    }
    return dummy.next;
}
```

### Main dish: LC25 Reverse Nodes in k-Groups

```java
/**
 * Reverse a link list between pre and next exclusively
 * e.g.: 
 * 0->1->2->3->4->5->6
 * |           |   
 * pre        next
 *
 * after call pre = reverse(pre, next):
 * 0->3->2->1->4->5->6
 *          |  |
 *          pre next
 * @param pre 
 * @param next
 * @return the precedence of parameter next
 */
private static ListNode reverse(ListNode pre, ListNode next) {
    ListNode end = pre.next, cur = end.next;
    while (cur != next) {
        end.next = cur.next;
        cur.next = pre.next;
        pre.next = cur;
        cur = end.next;
    }
    return end;
}
public ListNode reverseKGroup(ListNode head, int k) {
    if (head == null || k == 1) return head;
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    ListNode pre = dummy;
    int i = 0;
    while (head != null) {
        head = head.next;            
        if (++i % k == 0) pre = reverse(pre, head);
    }
    return dummy.next;
}
/**
 * Note: the while loop is the same as following process, which is easier to understand:
 * while(head != null){
 *    i++;
 *    if(i % k ==0){
 *        pre = reverse(pre, head.next);
 *        head = pre.next;
 *    }else {
 *        head = head.next;
 *    }
 * }
 */

}
```
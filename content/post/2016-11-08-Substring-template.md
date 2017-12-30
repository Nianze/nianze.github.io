---
title: Substring type problem's template
date: 2016-11-08
categories:
- article
- programming
tags:
- algorithm
- string
- two pointer
slug: substring template
thumbnailImagePosition: right
thumbnailImage: /images/2016-11-08.jpg
---

Two pointer template to solve substring problem.
<!--more-->

### LC76 Minimum Window Substring

#### Method: Two Pointer with map

1. Scanning from left to right, keep the head and length of minimum window substring so far.
2. Use an `int[256]` array or a `HashMap` to store target charater counts.

```java
public String minWindow(String s, String t) {
    int[] map = new int[256];
    for (char c : t.toCharArray()) { map[c]++; }
    int start = 0, end = 0, len = Integer.MAX_VALUE, head = 0, count = t.length();
    while (end < s.length()) {
        if (map[s.charAt(end++)]-- > 0) count--;
        while (count == 0) {
            if (end - start < len) len = end - (head = start);
            if (map[s.charAt(start++)]++ == 0) count++;
        }
    }
    return len == Integer.MAX_VALUE ? "" : s.substring(head, head + len);
}    
```

### Template[^1]

For most substring problem, we are given a string and need to find a substring of it which satisfy some restrictions. A general way is to use a hashmap assisted with two pointers.

One thing needs to be mentioned is that when asked to find maximum substring, we should update maximum after the inner while loop to guarantee that the substring is valid. On the other hand, when asked to find minimum substring, we should update minimum inside the inner while loop.

```java
int findSubstring(string s){
    int[] map = new int[256];
    int counter; // check whether the substring is valid
    int start = 0, end = 0; //two pointers, one point to tail and one head
    int d; //the length of substring
    for() { /* initialize the hash map here */ }
    while(end < s.length()){
        if(map[s.charAt(end++)]-- ?){  /* modify counter here */ }
        while(/* counter condition */){              
            /* update d here if finding minimum */
            //increase start to make it invalid/valid again            
            if(map[s[start++]]++ ?){ /*modify counter here*/ }
        }  
        /* update d here if finding maximum*/
    }
    return d;
}
```

[^1]: <https://discuss.leetcode.com/topic/30941/here-is-a-10-line-template-that-can-solve-most-substring-problems>
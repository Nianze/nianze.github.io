---
title: Remove Invalid Parentheses
date: 2016-11-06
categories:
- article
- coding
tags:
- algorithm
- DFS/BFS
- java
slug: invalid parentheses
thumbnailImagePosition: right
thumbnailImage: /images/2016/2016-11-06.jpg
---

Several ways to remove invalid parentheses problem.
<!--more-->


### Starter

> Return only one possible result

#### Method: Two pass with `counter`

1. Scanning from left to right, ending up removing extra ')'
2. Scanning from right to left, ending up removing extra '('

```java
public String removeInvalidParantheses(String s) {
    StringBuilder firstPass = new StringBuilder();
    int counter = 0;
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (c == '(') {
            counter++;
            firstPass.append('(');
        } else if (c == ')' && counter > 0) {
            counter--;
            firstPass.append(')');
        } else if (c != ')' && c != '(') {
            firstPass.append(c);
        }
    }
    if (counter == 0) return firstPass.toString();
    counter = 0;
    StringBuilder sb = new StringBuilder();
    for(int i = firstPass.length() - 1; i >= 0; i--) { 
        char c = firstPass.charAt(i);
        if (c == ')') {
            counter--;
            sb.append(')');
        } else if (c == '(' && counter < 0) {
            counter++;
            sb.append('(');
        } else if (c != ')' && c != '(') {
            sb.append(c);
        }
    }
    return sb.reverse().toString();
}    
```

### Main dish (follow up)

> Return all the possible results

#### Method 1: Two pass with [**DFS**][1]

* same idea as starter question: using dfs searching for valid candidate without extra ')', then reverse the string and search for the second pass to remove all the extra '('
* for continuous ')', say "())", always remove the first ')' firstly, so "(`)`)" -> "()": for j:[prev_j ~ i], if (s[j] == par[1] && (j == prev_j || s[j-1] != par[1])), remove s.charAt(j)
* each recursive call, store previous i to `prev_i` to indicate that first half of string before i is valid, so no need to check again
* each recursive call, store previous j to `prev_j` in order to prevent duplicate answers. e.g.:  
    if no prev_j stored, it's hard to prevent the same result from two different ching branches:
    * "()a)a)" -> "(a)a)" -> "(aa)" 
    * "()a)a)" -> "()aa)" -> "(aa)"
* Time : every path generates one valid answer, if there's k valid answer, the search  will have k leaves. Since each recursive call requires O(n) time from string atenatino. O(n*m) may be fair enough to describe the time complexity, where n is length of string and m is the total nodes (numver of all the rec calls) in the ch tree
* Space: O(n*k) due to stringbuilder, k is the number of valid answer, n is the length of string

```java
public List<String> removeInvalidParentheses(String s) {
    List<String> ans = new ArrayList<>();
    remove(s, ans, 0, 0, new char[]{'(', ')'});
    return ans;
}
private void remove(String s, List<String> ans, int prev_i, int prev_j, char[] par) {
    for (int count = 0, i = prev_i; i < s.length(); i++) {
        if (s.charAt(i) == par[0]) count++;
        if (s.charAt(i) == par[1]) count--;
        if (count >= 0) continue;
        for (int j = prev_j; j <= i; j++) { // count < 0, there's extra par[1] 
            if (s.charAt(j) == par[1] && (j == prev_j || s.charAt(j-1) != par[1])) {
                remove(s.substring(0,j) + s.substring(j+1), ans, i, j, par);
            }
        }
        return;
    }
    StringBuilder reversed = new StringBuilder();
    for (int i = s.length() - 1; i >= 0; i--) { reversed.append(s.charAt(i)); }
    if (par[0] == '(') { remove(reversed.toString(), ans, 0, 0, new char[]{')', '('}); }
    else { ans.add(reversed.toString()); }
}
```

#### Method 2: BFS

Naive way of thinking: 

For a string with n length, each char have 2 states "keep/remove", which is 2^n states, and each state requires checkValid, which runs in O(n). Together the BFS require O(n*2^n).

Ideally, it should be O(C(n,k) + n), where k is the number of chars needs removal. To avoid generating duplicate strings, refer to [this post][2]


[1]: <https://discuss.leetcode.com/topic/34875/easy-short-concise-and-fast-java-dfs-3-ms-solution>
[2]: <https://discuss.leetcode.com/topic/28855/java-bfs-solution-16ms-avoid-generating-duplicate-strings>
---
title: Alien dictionary
date: 2016-11-26
categories:
- article
- programming
tags:
- algorithm
- graph
- DFS
- BFS
slug: alien dictionary
thumbnailImagePosition: right
thumbnailImage: /images/2016-11-26.jpg
---

Build a graph to solve alien dictionary problem via DFS/BFS.
<!--more-->

## Alien Dictionary

There is a new alien language which uses the latin alphabet. However, the order among letters are unknown to you. You receive a list of words from the dictionary, where **words are sorted lexicographically by the rules of this new language**. Derive the order of letters in this language.

For example, 

Given the following words in dictionary,

```
[
  "wrt",
  "wrf",
  "er",
  "ett",
  "rftt"
]
```

The correct order is: "wertf".

Note:

1. You may assume all letters are in lowercase.
2. If the order is invalid, return an empty string (["abcd","ab"] is invalid).
3. There may be multiple valid order of letters, return any one of them is fine.

## Method 1: DFS

Build the graph (post-adjacency list and visited list), then use `DFS` to build the correct order, while checking the loop at the same time.

Note:

1. visited[]: -1(not exist), 0(no pre-node), 1(visiting), 2(visited)
2. The order of adding char into stringbuilder is reversed: add post nodes to sb firstly in order to avoid missing pre-nodes for current nodes later. e.g.: for correct order "abc", if meet 'b' firstly, build the sb as "cb", and then meet 'a', build it as "cba"; otherwise, when meet 'b', build sb as "bc", and then meet 'a', resulting in "bca", which is incorrect.)


```java
    private static int N = 26;
    public String alienOrder(String[] words) {
        boolean[][] adj = new boolean[N][N];
        int[] visited = new int[N];
        if (!buildGraph(words, adj, visited)) return ""; // "abcd" -> "ab"

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < N; i++) {
            if (visited[i] == 0) {
                if (!dfs(adj, visited, sb, i)) return "";
            }
        }
        return sb.reverse().toString();
    }
    private boolean dfs(boolean[][] adj, int[] visited, StringBuilder sb, int i) {
        visited[i] = 1;  // visiting
        for (int j = 0; j < N; j++) {
            if (adj[i][j]) { // connected post nodes
                if (visited[j] == 1) return false;  // loop case
                if (visited[j] == 0) {
                    if (!dfs(adj, visited, sb, j)) return false;
                }
            }
        }
        visited[i] = 2; // visited
        sb.append((char)('a' + i));
        return true;
    }        
    private boolean buildGraph(String[] words, boolean[][] adj, int[] visited) {
        Arrays.fill(visited, -1); // init to not existed
        for (int i = 0; i < words.length; i++) {
            for (char c : words[i].toCharArray()) visited[c - 'a'] = 0;
            if (i > 0) {
                String w1 = words[i-1], w2 = words[i];
                int len = Math.min(w1.length(), w2.length()), j = 0;
                for (; j < len; j++) {
                    char c1 = w1.charAt(j), c2 = w2.charAt(j);
                    if (c1 != c2) {
                        adj[c1 - 'a'][c2 - 'a'] = true;
                        break;
                    }
                }
                if (j == len && w1.length() > w2.length()) return false; // "abcd" -> "ab"
            }
        }
        return true;
    }
```

## Method 2: BFS

Build the graph(post-adjacency list and visited list), then use Karn's algorithm to do topological sort (essentially BFS).

Note:

1. visited[]: -1(not exist), 0(no pre-node), 1,2,3...(pre-nodes number)

```java
    public String alienOrder(String[] words) {
        List<Set<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < 26; i++) adj.add(new HashSet<Integer>());
        int[] degree = new int[26];
        Arrays.fill(degree, -1);
        // init the adj and degree list
        for (int i = 0; i < words.length; i++) {
            for (char c : words[i].toCharArray()) {
                if (degree[c-'a'] < 0) degree[c-'a'] = 0;
            }
            if (i > 0) {
                String w1 = words[i-1], w2 = words[i];
                int len = Math.min(w1.length(), w2.length());
                for (int j = 0; j < len; j++) {
                    int c1 = w1.charAt(j) - 'a', c2 = w2.charAt(j) - 'a';
                    if (c1 != c2) {
                        if (!adj.get(c1).contains(c2)) {
                            adj.get(c1).add(c2);
                            degree[c2]++;
                        }
                        break;
                    }
                    if (j == len-1 && w1.length() > w2.length()) return ""; // "abcd" -> "ab"   
                }
            }
        }
        // topological sort
        Deque<Integer> q = new ArrayDeque<>();
        for (int i = 0; i < degree.length; i++) {
            if (degree[i] == 0) q.offer(i);
        }
        StringBuilder sb = new StringBuilder();
        while (!q.isEmpty()) {
            int i = q.poll();
            sb.append((char) ('a' + i));
            for (int j : adj.get(i)) {
                degree[j]--;
                if (degree[j] == 0) q.offer(j);
            }
        }
        for (int d : degree) if (d > 0) return ""; // has loop
        return sb.toString();
    }
```
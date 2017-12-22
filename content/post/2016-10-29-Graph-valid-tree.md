---
title: Valid tree
date: 2016-10-29
categories:
- article
- programming
tags:
- algorithm
- graph
- DFS
- BFS
- Union-find
slug: valid tree
---

DFS, BFS and Union-find comparison.
<!--more-->

### Judge if the given graph is a tree ###

Remember to check 2 things:

1. whether the graph has cycle
2. whether number connected component(s) is more than 1

#### DFS:

```java
    // time: O(max(E,n)) space: O(n) for adjacency list
    public boolean validTree(int n, int[][] edges) {
        int[] visited = new int[n];
        List<List<Integer>> adjList = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            adjList.add(new ArrayList<Integer>());
        }
        for (int[] e : edges) {
            adjList.get(e[0]).add(e[1]);
            adjList.get(e[1]).add(e[0]);
        }
        if (hasCycle(-1, 0, visited, edges)) { return false; } // cycle case
        for (int i : visited) { if (i == 0) { return false; } } // not single connected components
        return true;
    }
    
    private boolean hasCycle(int prev, int cur, int[] visited, List<List<Integer>> adjList) {
        visited[cur] = 1; // 1 means current vertex is being visited
        for (Integer succ : adjList.get(cur)) {
            if (succ == prev) continue; // exclude curr's prev node
            if (visited[succ] == 1) { return true; } // has cycle
            if (visited[succ] == 0) {
                if (hasCycle(cur, succ, visited, adjList)) { return true; }
            } 
        }
        visited[cur] = 2; // complete visiting
        return false;
    }
```

#### BFS:

```java
    // O(max(E,n)), space: O(n) for adjacency list
    public boolean validTree(int n, int[][] edges) {
        int[] visited = new int[n];
        List<List<Integer>> adjList = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            adjList.add(new ArrayList<Integer>());
        }
        for (int[] e : edges) {
            adjList.get(e[0]).add(e[1]);
            adjList.get(e[1]).add(e[0]);
        }
        Deque<Integer> queue = new ArrayDeque<>();
        queue.addLast(0);
        visited[0] = 1; // mark curr node as being visited
        while (!queue.isEmpty()) {
            int cur = queue.removeFirst();
            for (Integer succ : adjList.get(cur)) {
                if (visited[succ] == 1) { return false; } // has cycle
                if (visited[succ] == 0) {
                    visited[succ] = 1;
                    queue.addLast(succ);
                }
            }
            visited[cur] = 2; // compete visiting
        }
        for (int i : visited) { if (i == 0) { return false; } } // not single connected components
        return true;        
    }
```

#### Union-find:

```java
    // time: O(E), space: O(n) for union-find set
    class UnionFind {
        int[] parent;
        int[] rank;
        int count;

        UionFind(int n) {
            parent = new int[n];
            rank = new int[n];
            count = n;
            for (int i = 0; i < n; i++) { parent[i] = i; } // initially each node's paren is itself
        }
        int find(int x) {
            if (x != parent[x]) {
                x = find(parent[x]); // path compression
            }
            return parent[x];
        }
        boolean union(int x, int y) {
            int X = find(x), Y = find(y);
            if (X == Y) { return false; }
            if (rank[Y] < rank[X]) { parent[Y] = X; } // Y is lower
            else if (rank[X] < rank[Y]) { parent[X] = Y;} // X is lower
            else {  // rank of X, Y is the same
                parent[Y] = X;
                rank[X]++;
            }
            count--;
            return true;
        }
    }    
    public boolean validTree(int n, int[][] edges) {
        UnionFind uf = new UnionFind(n);
        for (int[] edge : edges) {
            int x = edge[0], y = edge[1];
            if (!uf.union(x, y)) { return false; } // has cycle
        }
        return uf.count == 1;
    }
```
---
title: Machine learning overview
date: 2018-01-04
categories:
- article
- programming
tags:
- technique
- machine learning
slug: start of machine learning series
autoThumbnailImage: false
thumbnailImagePosition: right
thumbnailImage: /images/2018-01-04-ml.jpg
#coverImage: /images/2018-01-04-ml.jpg
#metaAlignment: center
---

My first post in the new `machine learning` series.
<!--more-->

Although I've chosen `https://nianze.ml` as my personal website domain name, I haven't really posted any article on **M**achine **L**earning at all, which may somehow be _misleading_. Considering it's new year and my website has just been re-designed, it's perfect time for new plans, so I've made a dicision to begin a new series related to `ml`: I'll write down learning notes during my self-study in machine learning. Recently I'm reading the book [_Hands-On Machine Learning with Scikit-Learn and TensorFlow_](https://www.safaribooksonline.com/library/view/hands-on-machine-learning/9781491962282/) by Aurélien Géron, which should be a good start for this new series. 

At first the post is intended to be written in Chinese, but considering there're so many technique terms in English that I do not know the exact Chinese translation, I'll just start with English.

As the first post in this series, let's just take a overview on machine learning system.

## Types of machine learning

There are broadly three ways to classify machine learning systems, and each of these three could be further categorized into multiple sub-categories:

```
Machine learning system
├── trained with supervision or without
│   ├── supervised learning
│   │   ├── k-Nearest Neighbors
│   │   ├── Linear Regression
│   │   ├── Logistic Regression
│   │   ├── Support Vector Machines (SVMs)
│   │   ├── Decision Trees and Random Forests
│   │   └── Neural networks
│   ├── unsupervised learning
│   │   ├── clustering
│   │   │   ├── k-Means
│   │   │   ├── Hierarchical Cluster Analysis (HCA)
│   │   │   └── Expectation Maximization
│   │   ├── Visualization and dimensionality reduction
│   │   │   ├── Principal Component Analysis (PCA)
│   │   │   ├── Kernel PCA
│   │   │   ├── Locally-Linear Embedding (LLE)
│   │   │   └── t-distributed Stochastic Neighbor Embedding (t-SNE)
│   │   └── Association rule learning
│   │       ├── Apriori
│   │       └── Eclat
│   ├── semisupervised learning
│   └── reinforcement learning
├── learn incrementally or in a whole batch
│   ├── online learning (incremental learning)
│   └── batch learning
└── predict based on a model or not
    ├── instance-based learning (using a similarity measure)
    └── model-based learning
```

## Main challenges of machine learning

* Bad data
    * [Insufficient quantity](http://static.googleusercontent.com/media/research.google.com/fr//pubs/archive/35179.pdf) of training data
    * Nonrepresentative training data
    * Poor-quality data
    * Irrelevant features
* Bad algorithm
    * Overfitting the training data
    * Underfitting the training data

We reduce overfitting by constrain the degrees of freedom the model has, which is called _regularization_. The amount of regularizatoin can be controlled by a hyperparametr, which is a parameter of a learning algorithm (not of the model). The larger the hyperparameter, the smaller the model parameter, ending up with more constrain we apply to the model and less degrees of freedom.

On the contrary, to solve underfitting problem, we may consider:

* select more powerful model with more parameters
* feed better fetures
* reduce the constraints (e.g., reducing the regularization hyperparameter)

## Testing and validating

Usually we split data into three groups:

* training set
* validation set
* test set

And take following common workflow:

1. train multiple models with various hyperparameters using the **training set**
2. select the model and hyperparameters tht perform best on the **validation set**
3. run a single final tets against the **test set** to get an estimate of the _generalization error_ (_out-of-sample error_)

Further, we can use cross-validation technique to reuse data:

1. split trainig set into complementary subsets
2. train each model against a different combination of these subsets and validate against the remaining parts
3. select the model type and hyperparameters with best performance
4. train the final model by feeding the full training set to the chosen model and hyperparameters
5. measure the generalized error on the test set
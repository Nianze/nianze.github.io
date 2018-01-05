---
title: Machine learning note 001
date: 2018-01-04
categories:
- article
- programming
tags:
- technique
- machine learning
slug: start of my machine learning notes
autoThumbnailImage: false
thumbnailImagePosition: right
#thumbnailImage: /images/2018-01-04/?.jpg
#coverImage: /images/2018-01-04/?.jpg
#metaAlignment: center
---

My study notes on machine learning
<!--more-->

Although I've chosen `https://nianze.ml` as my personal website domain name, I haven't really posted any article on `**m**achine **l**earning` before, which may somehow be _misleading_. Considering it's new year and my website has just been re-designed, it's perfect time for new plans, so I've made a dicision to begin a new series related to `ml`: I'll write down learning notes during my self-study in machine learning. Recently I'm reading the book [_Hands-On Machine Learning with Scikit-Learn and TensorFlow_](https://www.safaribooksonline.com/library/view/hands-on-machine-learning/9781491962282/) by Aurélien Géron, which should be a good start for this new series. I intended to write this series in Chinese, but considering there're so many technique terms in English that I do not know the exact Chinese translation, I'll start with English now.

As the first post in this series, let's just take a look at the overview of machine learning.

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

* [Insufficient](http://static.googleusercontent.com/media/research.google.com/fr//pubs/archive/35179.pdf) quantity of training data
* Nonrepresentative training data
* Poor-quality data
* Irrelevant features
* Overfitting the training data
* Underfitting the training data

## Testing and validating

* training set
* validation set
* test set

Usual steps to take:

1. train multiple models with various hyperparameters using the training set
2. select the model and hyperparameters tht perform best on the validation set
3. run a single final tets against the test set to get an estimate of the _generalization error_ (_out-of-sample error_)

Cross-validation technique:

1. split trainig set into complementary subsets
2. train each model against a different combination of these subsets and validate against the remaining parts
3. select the model type and hyperparameters with best performance
4. train the final model by feeding the full training set to the chosen model and hyperparameters
5. measure the generalized error on the test set
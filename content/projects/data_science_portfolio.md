---
title: "Data Science Portfolio"
frameworks: [pandas, matplotlib, scikit-learn, Pytorch, BERT, transformers]
show_readme: false
---

A collection of case studies and analysis notebooks showing how data science can solve real-world business problems.

## Backstory

I've always had a passion for data science, visualization, analysis, and ML. After working in the corporate world for a year or so, I realized that data science and BI teams are often seen as supplementary teams, rather than core RnD resources.

With that in mind, I started to put together a series of case studies showing how data science can solve real business problems, not just make spreadsheets look nice. This series is still growing as I find more use cases.

## Architecture

Each case study centers on a specific business problem--sales forecasting, estimating customer LTV, etc. Each case uses different frameworks and analysis techniques, though they all use some combo of pandas/numpy/matplotlib/seaborn at the core.

### Churn Prediction

Can we predict when a customer is most likely to churn?

Concepts:

- Logistic Regression Classifiers
- Random Forest Classifiers
- XGBoost Classifiers
- Support Vector Machine Classifiers

### Customer Segmentation

Can we identify meaningful patterns or groups among a customer base?

Concepts:

- Hierarchical Clustering
- K-Means Clustering

### Customer Lifetime Value

Can we accurately estimate the total monetary worth of a given customer?

Concepts:

- Average Method
- Cohorts
- BG/NBD+GG: Beta Geometric/Negative Binomial Distribution with Gamma Gamma extension (now there's a concise name)

### Sentiment Analysis

Can we programmatically and accurately determine the sentiment of customer reviews?

Concepts:

- VADER
- BERT
- Sentence Transformers/Hugging Face
- Pytorch
- Aspect-Based Thematic Similarity

### Sales Forecasting

Can we accurately forecast sales revenue?

Concepts:

- Linear Regression
- SARIMA
- Deep Learning (rolling our own 9-layer model)

### Upselling

Can we make purchase recommendations to customers based on their purchase history?

Concepts:

- Apriori
- Eclat

---
title: "{{ replace .TranslationBaseName "-" " " | title }}"
date: {{ .Date }}
series:
- s
categories:
- c
tags:
- t
slug: "{{ replace .TranslationBaseName "-" " " | title }}"
featured_image: {{  replace .Date "-" "/" }}.JPG
draft: true
---


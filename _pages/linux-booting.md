---
title: "Booting"
permalink: /kdb/linux/boot/
toc_sticky: true
toc_ads : true
layout: single
---

# Boot Protocol
v5.7-rc3 기준으로 boot protocol은 2.15 version 까지 존재한다.   
kernel size가 512kb를 넘으면 사용하는(사실상 모든 kernel이 사용하는) 메모리 layout은 다음과 같다.    
![bzImage](https://devdevil1901.github.io/assets/images/linux-bzImage-in-memory-layout.png)   



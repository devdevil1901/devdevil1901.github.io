---
title: "Linker"
permalink: /kdb/android/linker/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content

# Outline
android가 linux와는 다른 부분 중에 가장 크게 와 닫는 부분이 바로 bionic이다.   
libc와 dynamic linker의 구현이 바로 bionic.
다양한 회사에서 Windows, Android, IOS에서 게임 보안 솔루션을 제작하였다.   
그때 마다, binary를 보호하는 packer의 개발은 필수 였다.   
또, pen-testing을 할 때에는 packer의 보호를 항상 bypass해야 했다.    
아르마딜로의 debug attach를 무력화 시키고, 더미다가 적용된 packer를 뽀록과 뽀록을 더해서 우회해 

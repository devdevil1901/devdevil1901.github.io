---
title: "ART"
permalink: /kdb/android/art/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content

# Outline
ART(Android Runtime)에 대해서 알아보자.   
내가 ART를 처음 접한 것은 게임보안팀에서 게임보안 솔루션을 개발하다가,   
다른 프로젝트를 하러 팀을 옮겼을 때였는데,   
IOS 처엄 native code로 변환해서, runtime에서 실행된다는 이야기에 적잖이 당황했었다.   
난독화 등에서 Dalvik에 dependency가 있는 부분들이 있었던 것이다.   
부랴부랴 급하게 ART를 공부하던 때가 엊그제 같은데 벌써 시간이 엄청 흘렀다.    

Android 5.0(API 31)에서 도이보디었다.   

# Major Feature
1. AOT(Ahead-of-time) compilation  
app이 install 되면, dex2oat binary를 실행해서, DEX를 native code로 compile한다.  
그 결과물이 oat파일.  



---
title: "Crash"
permalink: /kdb/android/crash/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content

# Outline

# Native
c++로 작성된 native code에서의 crash 발생관련 정보를 수집하기 위해서, bionic linker를 사용하고 있다.   
즉 chrominum의 breakpad를 사용하게 되면, signal handler를 overwrite하기 때문에,    

[breakpad](https://chromium.googlesource.com/breakpad/breakpad)는 자유롭게 사용이 가능한 crash 수집 library로   
최근에는 새 버전인 [crashpad](https://chromium.googlesource.com/crashpad/crashpad)가 개발되었다.   

## 1. Out-Of-Process Model  
대 부분의 crash library들이 이 방식을 따르고 있다.   
이것은 crash가 발생한 process가 아니라, 별도의 crash 관리 process가 crash report를 생성하는 방식을 의미한다.   
crash가 발생한 process는 신뢰할 수 없는 부분들이 많기 때문에 이를 별도의 프로세스에서 처리하는 것.   
windows의 SEH handler를 overwrite하는 buffer overflow exploit을 생각해 보면 수긍이 가는 부분이다.   
즉 stack이 크게 망가지거나, key data 구조가 손상될 수 있는 것.   

Android도 이 model을 사용하고 있다.    
기존에는 debuggerd process가 이 역활을 수행하고 있었는데,  
최근에는 crash_dump64, crash_dump32가 이것을 수행하고 있다.    

## 3. Crash log checking with adb
crash가 발생하면 logcat에 기본적인 crash dump가 기록되고,       
전체 thread이의 stack trace, 전체 memory map, open된 file descriptor의 stack trace를 추가한 정보는    
/data/tombstones에 기록된다.   
```
/data/tombstones # ls -l
total 764
-rw-r----- 1 tombstoned system 776973 2020-06-05 14:48 tombstone_00
```




```
$ adb bugreport
/data/user_de/0/com.android.shell/files/bugreports/bugreport-aosp_x86_64-QQ3A.200605.002.A1-2020-06-07-20-33-48.zip: 1 file pulled. 151.5 MB/s (1703913 bytes in 0.011s)

```

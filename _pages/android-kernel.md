---
title: "Android Kernel"
permalink: /kdb/android/kernel/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content

# Outline
1991년에 토발즈가 개발한 linux [kernel](https://www.kernel.org)은 the Linux Kernel Organization Inc.에 의해    
유지되고 있다.   


Google에서 kernel을 개발하였지만,  현재는 많은 부분이 linux kernel의 mainline에 반영되었다.   
(때문에 mainline 커컬로 android에서 직접 booting도 가능하다.)    
다음은 mainline에서 android kernel 구현의 위치이다.  
사실 SoC에서 linux kernel은 각 vendor로 구현이 있다.   

[google](https://android.googlesource.com/kernel/)   
[msm](https://android.googlesource.com/kernel/msm)   
[mediatek](https://android.googlesource.com/kernel/mediatek)   
[samsung](https://opensource.samsung.com/uploadList?menuItem=mobile)   
[lg](http://opensource.lge.com/osList/list?m=Mc001&s=Sc002)    
[linaro](https://android-git.linaro.org/gitweb/kernel/linaro-android.git)  


linux의 android 구현은 다음과 같다.   
|entry|location|desc|
|ASM(Android Shared Memory)|drivers/staging/android|ashmem(Android Shared Memory), 와 ION Heap의 구현이 들어있다.|
|Binder|drivers/android/|binder|IPC와 RPC인 Binder|
|logger||write에 최적화된 고속 kernel 로깅|
|paranoid networking||네트워크 I/O를 특정 프로세스로 제한하는 메커니즘|
|PMEM(Physical memory)||user 공간의 physical 메모리의 큰 chunks mapping을 위한 driver|
|Viking killer||low memory 상황에서 최근에 사용된 process를 kill하기 위한 구현.<br/>OOM killer의 대체.|
|wakelocks||Android의 고유한 파워관리 솔루션|



# HAL(Hardware Abstract Layer)

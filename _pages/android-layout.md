---
title: "Android Layout"
permalink: /kdb/android/layout/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content

# Outline
Android System을 이해하기 위해서는 전체 Layout을 이해해야 한다.   
먼저 Android System의 block diagram을 살펴 보도록 하자.   
![구조도](https://docs.google.com/drawings/d/e/2PACX-1vQ3OwEk8LXV6lvNBIfisbbTQlXqWLVxprdWYjl2sC5qUoA5j8HY7Ns3dELE_M5m-rXJTsy5NKPKlX8i/pub?w=1440&h=1080)   


<pre>
다음 부분들은 적당히 정리해야 한다.   
이걸 통해서 전체 구조를 파악해야 함.
예를 들어서 Sound 관련한 framework의 구조는, 다음과 같다.   
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++   
+ Application                                                           +   
+ Application Framework | MediaPlayer                                   +   
+ Service Framework     | (jni)MediaPlayer---RPC Binder--->AudioFlinger +    
+ HAL                   | libaudio.so                                   +   
+ Library               | Alsa library                                  +   
+ device driver         | Alsa driver                                   +   
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++       

Serice Framework는 Outline에서 살펴본, System Service 부분.  
Application에서 직접적으로 호출하는,  Application Framework의 위치는 다음과 같다.   
frameworks/base/media/java/android/media/MediaPlayer.java
./frameworks/base/media/apex/java/android/media/MediaPlayer2.java

</pre>

# Component
여기서의 component는 Android Layout을 이해하기 위한 구성요소의 의미로서,   
일반적인 Android component와는 구별된다.  
android가 설치된 시스템은 다음과 같은 구조를 가진다.   
![큰 구성](https://docs.google.com/drawings/d/e/2PACX-1vQwsFLEnaNYPMCv-oar0SR3rDjjEiG0NV1CpXpjhzxadGOgjB0SuW2utrOcxRxgLHARbmKh33hL8fvi/pub?w=1440&h=1080)  

|component|desc|
|---|---|
|System Server|afa|
|Android Service|[Service](https://developer.android.com/guide/components/services?hl=ko)는 background에서 UI없이 실행되는 component<br/>Service와 통신하던 Application이 종료나 전환되어도</br>계속해서 실행된다.|
|Zygote|Android Runtime을 초기화 시켜 적재하고, System Server를 실행한다.<br/>App이 실행 요청을 하게되면, socket을 통해 이를 전달 받고, fork()를 해서 앱을 실행한다.   

## 1. system_server
Hardware와 같은 raw level과 Application Framework가 communication할 수 있게 해주는 layer.   
App을 개발하는 개발자들은 Android Framework에서 제공하는 API를 이용해서 개발을 하게 되는데.   
이 API들중에 일부는 System Service를 통해서 구현되어 있다.   
Window Manager, Notification Manager, Playing Manager, SurfaceFlinger, netd, logcatd, rild등이 있다.    
System Service의 구현을 살펴보도록 하자.    
각 System Service는 SystemServer class를 상속받아 구현하고, com.android.server domain을 가진다.   

## 2. Zygote
App 실행 요청을 처리한다.   
이를 위해서, /dev/socket/zygote라는 socket을 이용한다.   
```
# ls -l /dev/socket
srw-rw---- 1 root        system       0 2020-06-14 12:59 zygote
srw-rw---- 1 root        system       0 2020-06-14 12:59 zygote_secondar
```
2bit process의 경우는 zygote_secondary socket을 이용.

이런 방식을 사용하는 이유는 결국 App을 적은 메모리를 차지 하면서 빠르게 실행하고자 함이다.
fork가 COW(Copy-On-Write)을 사용하기 때문에 이 장점을 그대로 가지고 갈 수 있는 것이다.
AndroidRuntime 적재의 overhead가 큰데 이것에 대한 부하를 최소화 하고,
각종 class들의 memory를 공유하는 등의 장점을 취하는 것.
fork()를 하면서, setuid(), setgid()로 권한을 APP 권한으로 전환한다.

## 3. Service
[Service](https://developer.android.com/guide/components/services?hl=ko)는 background에서 UI없이 실행되는 component이다. 

1. System Service   
Android System에서 제공하는 Service   
	1. Java System Service
		1. Core Platform Service
		2. Hardware Service    
	2. Native System Service
2. Application Service   
Application 개발자가 구현한 Service이다.   
	1. Local Service   
	같은 Process에서 사용하는 것.   
	2. Remote Service   
	다른 Process에서 사용하는 것.   

## 4. mediaserver
init에서 zygote를 실행할때, init.zygote64_32.rc에서 zygote를 start 시키면서,    
onrestart restart media를 기억할 것이다.    
여기서의 media는 다음에 선언되어 있다.   
```
[frameworks/av/media/mediaserver/Android.bp]
cc_binary {
    name: "mediaserver",
    srcs: ["main_mediaserver.cpp"],
    shared_libs: [
        "libresourcemanagerservice",
        "liblog",
        "libmediaplayerservice",
        "libutils",
        "libbinder",
        "libandroidicu",
        "android.hardware.media.omx@1.0",
    ],
[frameworks/av/media/mediaserver$ vi mediaserver.rc]
service media /system/bin/mediaserver
```
media는 mediaserver를 실행한다.   

## 5. drm

framework/services/mediadrm/Android.mk
```
LOCAL_SRC_FILES:= \
    MediaDrmService.cpp \
    main_mediadrmserver.cpp

LOCAL_MODULE:= mediadrmserver
```


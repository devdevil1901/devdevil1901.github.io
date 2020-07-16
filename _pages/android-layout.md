---
title: "Android Layout"
permalink: /kdb/android/layout/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content

# Outline

# Android System
Android System을 이해하기 위해서는 전체 Layout을 이해해야 한다.   
bootloader를 거쳐 실행된, init process는 이제 실제 Android System을 실행하게 된다.   
init process에 의해서 다음과 같이 Android System이 실행된다.   
![큰 구성](https://docs.google.com/drawings/d/e/2PACX-1vQwsFLEnaNYPMCv-oar0SR3rDjjEiG0NV1CpXpjhzxadGOgjB0SuW2utrOcxRxgLHARbmKh33hL8fvi/pub?w=1440&h=1080)  

# package


# Framework for App
Android의 System 초기화가 완료되고, App이 실행되는 구조를 block diagram 으로 표현해 보자.    
![구조도](https://docs.google.com/drawings/d/e/2PACX-1vQ3OwEk8LXV6lvNBIfisbbTQlXqWLVxprdWYjl2sC5qUoA5j8HY7Ns3dELE_M5m-rXJTsy5NKPKlX8i/pub?w=1440&h=1080)   
즉 App에서 Framework의 API를 호출하는 구조는 일반적으로 다음과 같다.   
1. Java layer를 호출
2. Jni layer를 호출(from Java layer)   
3. binder를 호출
4. Native Framework(system_server, mediaserver등과 같은)에서 요청을 처리한다.

|component|desc|
|---|---|
|System Server|afa|
|Android Service|[Service](https://developer.android.com/guide/components/services?hl=ko)는 background에서 UI없이 실행되는 component<br/>Service와 통신하던 Application이 종료나 전환되어도</br>계속해서 실행된다.|
|Zygote|Android Runtime을 초기화 시켜 적재하고, System Server를 실행한다.<br/>App이 실행 요청을 하게되면, socket을 통해 이를 전달 받고, fork()를 해서 앱을 실행한다.   

## 1. Application Framework
App에서 호출하는 google에서 제공하는 API이다.    
보통 java framework에서 jni framework를 호출하게 된다.   

## 2. Binder Framework(IPC Proxies)
Application Framework와 Native Framework와의 통신을 위한 Binder Framework이다.      
간단하게 설명하면 다음과 같은 형태일 것이고,  
**Application Framework <---- Binder -------> Native Framework**   
여기서 Binder를 통해 연결된 것을 Binding되었다고 한다.   
위의 간단한 표현은 추상화 시킨 것으로 한 단게 정확하게 표현하자면 다음과 같을 것이다.    
**Application Framework(Binder client) <-------------> Native Framework(Binder server)**   

Binder client와 Binder server의 역활을 해 주는 것이 바로 **libbinder.so**의 <span style="color:red">**ServiceManager**</span>이다.   
source위치는 다음과 같다.    
```
[frameworks/native/libs/binder/include/binder/IServiceManager.h]   
[frameworks/native/libs/binder/IServiceManager.cpp]   
namespace android {   
class IServiceManager : public IInterface  
```

Binder **Server** 쪽에서는 다음과 같이 ServiceManager에 특정 서비스를 추가한다.    
```
sp < IServiceManager > sm = defaultServiceManager();   
sm->addService(String16("service.xxxService"), new XXXService());   
ProcessState::self()->startThreadPool();   
IPCThreadState::self()->joinThreadPool();   
```
IServiceManager::<span style="color:blue">**addSerice()**</span>   
로 Service를 등록한다.  

Binder **Client** 쪽에서는 다음과 같이 SerivceManager에서 특정 서비스를 가져온다.   
```
sp < IServiceManager > sm = defaultServiceManager();   
sp < IBinder > binder = sm->getService(String16("service.xxxService"));   
sp<IXXXService> cs = interface_cast<XXXService>(binder);            
cs->communicate();   
```
IServiceManager::<span style="color:blue">**getSerice()**</span>   
로 Service를 가져온다.   

즉 addService()와 getService()에서 사용되는 **service의 이름이 키의 역활**을 하여,    
Service를 return하게 되고, 이 Service가 binder의 역활로서, RPC를 넘어 API를 실행하게 하여 주는 것이다.   

ServiceManager의 객체를 구하는 defaultServiceManager()는 다음과 같다.   
source의 위치는 [frameworks/native/libs/binder]이다.       
```
[frameworks/native/libs/binder/IServiceManager.cpp]
sp<IServiceManager> defaultServiceManager() {
	..
	return gDefaultServiceManager;
}
[frameworks/native/libs/binder/Static.cpp]
sp<IServiceManager> gDefaultServiceManager;
```
defaultServiceManager()로 전역변수로 공유되는 ServiceManager의 객체를 return하는것.   
sp는 smart pointer template로 reference counter가 사라지면 자동 삭제해 주는 macro.  

> JetPack의 MediaPlayer가 아니라, android.media.MediaPlayer를 예로 들어보자.   

Server쪽에서는 Native Framework를 사용하여 다음과 같이 호출한다.   

|mediaserver|libmediaplayerservice|libbinder.so|
|---|---|---|
|frameworks/av/media/mediaserver/main_mediaserver.cpp<br/>int main()|frameworks/av/media/libmediaplayerservice/MediaPlayerService.cpp<br/>MediaPlayerService::instantiate()|defaultServiceManager()->addService(String16("media.player")|


자 정리 하자.   
frameworks/av/media/libmedia에서   
transact()를 실행하는 것은 전부
IXXXX.cpp이다.  즉 I로 시작한다.    
class IMediaPlayer: public IInterface
class BpMediaPlayer: public BpInterface<IMediaPlayer> {
void disconnect()
    {
        Parcel data, reply;
        data.writeInterfaceToken(IMediaPlayer::getInterfaceDescriptor());
        remote()->transact(DISCONNECT, data, &reply);
    }

Client쪽에서는(App 프로세스를 의미, Application Framework를 사용한다.) 
다음과 같이 호출된다.   

|Java Framework->|Jni Framework->|IPC Proxies|
|---|---|---|
|frameworks/base/media/java/android/media/MediaPlayer.java<br/><span style="color:blue">MediaPlayer</span>|frameworks/base/media/jni/android_media_MediaPlayer.cpp<br/><span style="color:blue">libmedia_jni.so</span>|frameworks/av/media/libmedia/mediaplayer.cpp<br/><span style="color:blue">libmedia.so</span>|

libmedia.so는 위에서 살펴본 libbinder.so를 dependency로 가지고 있다.     
또 Native Framework단에서는 mediaserver binary가 


일종의 Native Framework로서 servermanager라는 별도의 프로세스로 구현되어 있다.   
이 binder의 정체는 libbinder.so로서,  **frameworks/native/libs/binder**에 위치한다.   

보통 각 Framework의 binder는 별도로 구현되어 있는데 실제 IPC 처리는 이 libbinder.so에서 처리하게 된다.    
즉 MediaPlayer의 binder인 libmedia.so는 libbinder.so를 호출한다.   
각각의 Framework는 IServiceManager를 통해 binding을 수행한다.    
frameworks/native/libs/binder/include/binder/IServiceManager.h   
frameworks/native/libs/binder/IServiceManager.cpp    

linux kernel에서의 처리는 [이곳](/kdb/android/kernel/#binder)을 참조 한다.  

## 3. Native Framework
위에서 살펴보았듯이, system_server나 mediaserver는 앱과는 다른 프로세스이다.   
바로 이것이 Native Framework로서 App에서 사용한 API의 실제 구현을 처리하는 곳이다.   

### 1. servicemanager
실제 libbinder가 kernel driver의 통신하는 역활을 수행한다.   
즉 /dev/binder를 이 binary가 열어서, driver와 통신한다.   

source는 여기에서 제공한다.    
```
frameworks/native/cmds/servicemanager/service_manager.c
frameworks/native/cmds/servicemanager/binder.c
```

### 2. Media
Android에서는 두 가지의 Media 관련 서비스를 제공한다.   
첫 번째는 Application Framework를 통해 제공하는 MediaPlaer이다.   
여기서는 OpenMAX 통합 코덱 및 DRM을 포함하는 미디어 재생엔진 Stagefright를 제공한다.   
**android.media.MediaPlayer**가 이것.   

두 번째는 [ExoPlayer](https://exoplayer.dev/hello-world.html)이다.   
이것은 open source로서 SDK를 통해서 제공된다.   
Google의 IMA Sdk도 이것을 사용중이다.       
**androidx.media2.player.MediaPlayer**가 이것이다.   
JetPack으로 제공되느니 만큼 이것을 표준으로 봐야 할 것이지만 본 단락은 Android System의 layout을 다루고자 하기 때문에,    
첫 번째의 MediaPlayer를 기준으로 설명한다.         
[ExoPlayer의 공식샘플](https://github.com/google/ExoPlayer)  

## 2. deamons

### 1. system_server
Hardware와 같은 raw level과 Application Framework가 communication할 수 있게 해주는 layer.   
App을 개발하는 개발자들은 Android Framework에서 제공하는 API를 이용해서 개발을 하게 되는데.   
이 API들중에 일부는 System Service를 통해서 구현되어 있다.   
Window Manager, Notification Manager, Playing Manager, SurfaceFlinger, netd, logcatd, rild등이 있다.    
System Service의 구현을 살펴보도록 하자.    
각 System Service는 SystemServer class를 상속받아 구현하고, com.android.server domain을 가진다.   

### 2. Zygote
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

### 3. Service
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


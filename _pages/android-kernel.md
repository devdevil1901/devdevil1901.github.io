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
|---|---|
|ASM(Android Shared Memory)|drivers/staging/android|ashmem(Android Shared Memory), 와 ION Heap의 구현이 들어있다.|
|Binder|drivers/android/binder|IPC와 RPC인 Binder|
|logger||write에 최적화된 고속 kernel 로깅|
|paranoid networking||네트워크 I/O를 특정 프로세스로 제한하는 메커니즘|
|PMEM(Physical memory)||user 공간의 physical 메모리의 큰 chunks mapping을 위한 driver|
|Viking killer||low memory 상황에서 최근에 사용된 process를 kill하기 위한 구현.<br/>OOM killer의 대체.|
|wakelocks||Android의 고유한 파워관리 솔루션|

# HAL(Hardware Abstract Layer)

# Binder
user level의 ioctl쪽을
servicemanager가 /dev/binder를 통해 character device를 ...

```
[aosp_output/soong/ndk/sysroot/usr/include/linux/android/binder.h]
#define BINDER_WRITE_READ _IOWR('b', 1, struct binder_write_read)
#define BINDER_SET_IDLE_TIMEOUT _IOW('b', 3, __s64)
#define BINDER_SET_MAX_THREADS _IOW('b', 5, __u32)
#define BINDER_SET_IDLE_PRIORITY _IOW('b', 6, __s32)
#define BINDER_SET_CONTEXT_MGR _IOW('b', 7, __s32)
#define BINDER_THREAD_EXIT _IOW('b', 8, __s32)
#define BINDER_VERSION _IOWR('b', 9, struct binder_version)
#define BINDER_GET_NODE_DEBUG_INFO _IOWR('b', 11, struct binder_node_debug_info)
#define BINDER_GET_NODE_INFO_FOR_REF _IOWR('b', 12, struct binder_node_info_for_ref)
#define BINDER_SET_CONTEXT_MGR_EXT _IOW('b', 13, struct flat_binder_object)
```

kernel에서 이를 처리하는 코드는 다음에 존재 한다.
```
[drivers/android/binder.c]
    switch (cmd) {
    case BINDER_WRITE_READ:
    case BINDER_SET_MAX_THREADS: 
    case BINDER_SET_CONTEXT_MGR_EXT: 
    case BINDER_SET_CONTEXT_MGR:
    case BINDER_THREAD_EXIT:
    ..
```

# Development

커널의 버전을 확인한다.   
```
# uname -a
Linux localhost 4.14.150+ #1 SMP PREEMPT Fri Mar 20 01:43:59 UTC 2020 x86_64
```
**4.14.150+**가 확인할 버전.  
다음의 버전이 유력해 보인다.   
android-goldfish-4.14-dev.150   

[android kernel 사이트](https://android.googlesource.com/kernel/goldfish/+refs)에서, 이에 맞는 소스를 찾는다.    
```
git clone https://android.googlesource.com/kernel/goldfish -b 4.14.150
```


환경 변수를 설정한다.   
```
export ARCH=x86_64
export BRANCH=x86_64
export CLANG_TRIPLE=x86_64-linux-gnu-
export CROSS_COMPILE=x86_64-linux-androidkernel-
export LINUX_GCC_CROSS_COMPILE_PREBUILTS_BIN=prebuilts/gcc/linux-x86/x86/x86_64-linux-android-4.9/bin
```

.config 파일을 생성한다.   
make x86_64_ranchu_defconfig

변경할 것이 있다면,   
make menuconfig

만약 drivers/android와 같이 external device driver 부분을 추가하거나 수정했다면 다음을 수행해 주어야 한다.    
그렇지 않으면 다음의 error를 만나게 될 것이다.    
```xxx no symbol version for module_layout```     
**make prepare**    
**make scripts**   
**make M=drivers/xxxx/**

compile을 수행한다.   
make -j$(nproc --all)    

재컴파일 시는    
make mrproper   

## 1. LKM
먼저 kernel을 compile해야 한다.  
build.config.goldfish.x86_64 파일을 보면,   
arch/x86/configs의 x86_64_ranchu_defconfig을 사용해야 하는 것을 확인할 수 있다.   
즉 다음과 같이 컴파일 수행.   
```
export ARCH=x86_64
export CROSS_COMPILE=x86_64-linux-androidkernel-
make ARCH=x86_64 x86_64_ranchu_defconfig
make -j16
```

이렇게 compile한 위치를 make -C 로 지정하여 compile해야 한다.   
생성된 ko 파일은 modinfo로 상세 정보 확인 가능.   
모듈 로드는 modprobe를 이용한다.   

최신 버전의 avd에서는 /lib/modules 경로 문제가 발생한다.   

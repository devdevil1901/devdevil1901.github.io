---
title: "Android Booting"
permalink: /kdb/android/write/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content

# Outline
작성중이다.  

Android에서는 dt.img가 있고, dtbTool로 만들수가 있다.   
Bootloader는 dtb와 dtbo의 무결성을 검증해야한다.   
이를 위해서, VBoot 1.0, VBoot 2.0(AVB HASH footer)의 booting image 서명 등을 사용할 수 있다.   

<pre>
 __________       __________
| Power on |  -> | bootloader |----------boot recovery-----------------> load recovery.img 
|_________|      |__________  |
                              |-------------------boot normal -------------------> load boot.img ------------> /init ----> init*.rc ------> mount file system ----> start service --->
</pre>

# Android Bootloader
[Android Doc](https://source.android.com/devices/bootloader/)   
일부 제조사에서는 여러 부분으로 bootloader를 만들고 이를 하나의 bootloader.img  파일로 결합한다.   
Open source인 U-Boot가 유명해서, 많은 개발 보드들에서 사용된다.   

Android-specific feature들은 다음과 같다.   
* normal boot mode, recovery boot mode   
* Ramdisk + kernel을 load(boot.img and recovery.img) 
* fastboot protocol(fastboot mode)   j
* adb reboot bootloader   
* Download mode   

Bootloader가 가지는 책임은 다음과 같다.   
* Early hardware 초기화  
* Boot kernel과 ramdisk로드   
* System maintenance   
* Loading and Flashing new kernel과 system image   
* Security   
* Boot와 recovery partition의 무결성 검증   
* TEE 초기화   


# AndroidRuntime Initialization
Zygote가 실행되면서, AndroidRuntime을 초기화 시켜 적재하고, System Server를 실행하게 된다.    
App이 실행 요청을 하게되면, Zygote는 fork()를 해서, 앱을 실행한다.    
이를 위해서 /dev/socket/zygote라는 socket을 이용한다.       
```
# ls -l /dev/socket
srw-rw---- 1 root        system       0 2020-06-14 12:59 zygote
srw-rw---- 1 root        system       0 2020-06-14 12:59 zygote_secondary
```
32bit process의 경우는 zygote_secondary socket을 이용.   

이런 방식을 사용하는 이유는 결국 App을 적은 메모리를 차지 하면서 빠르게 실행하고자 함이다.    
fork가 COW(Copy-On-Write)을 사용하기 때문에 이 장점을 그대로 가지고 갈 수 있는 것이다.   
AndroidRuntime 적재의 overhead가 큰데 이것에 대한 부하를 최소화 하고,   
각종 class들의 memory를 공유하는 등의 장점을 취하는 것.    
fork()를 하면서, setuid(), setgid()로 권한을 APP 권한으로 전환한다.   



init process가 init.rc를 보고, zygote를 실행한다.  
```
[init.rc]
import /init.${ro.zygote}.rc
trigger zygote-start
```
zygote.rc는 app_process를 실행 한다.   
```
init.zygote64_32.rc
service zygote /system/bin/app_process64 -Xzygote /system/bin --zygote --start-system-server --socket-name=zygote
...

service zygote_secondary /system/bin/app_process32 -Xzygote /system/bin --zygote --socket-name=zygote_secondary --enable-lazy-preload
...
```
app_process64가 main으로서, 64bit app을 처리하게 되고,  system_server도 실행한다.   
Qemu에서 확인해 보면, 다음과 같이 zygote process가 실행되고 있다.   
```
root          1503     1 0 17:05:41 ?     00:00:00 zygote64
root          1504     1 0 17:05:41 ?     00:00:00 zygote
```
zygote는 사실 app_process의 다른 이름인 것이다.       
app_process의 소스는 다음에 위치하고 있다.   
```
[frameworks/base/cmds/app_process/Android.mk]
LOCAL_MODULE:= app_process
LOCAL_MULTILIB := both
LOCAL_MODULE_STEM_32 := app_process32
LOCAL_MODULE_STEM_64 := app_process64

app_process_src_files := \
    app_main.cpp \

LOCAL_SRC_FILES:= $(app_process_src_files)
```
즉 Source file은 frameworks/base/cmds/app_process/app_main.cpp에 위치한다.    
이 파일의 main()에서 Zygote는 시작된다.   
app_process64의 --start-system-server option을 다음과 같이 처리하고 있다.
```
if (strcmp(arg, "--zygote") == 0) {
            zygote = true;
            niceName = ZYGOTE_NICE_NAME;
        }

if (strcmp(arg, "--start-system-server") == 0) {
            startSystemServer = true;
        }

 if (startSystemServer) {
            args.add(String8("start-system-server"));
        }

 if (zygote) {
        runtime.start("com.android.internal.os.ZygoteInit", args, zygote);
    }
```
여기서 AppRuntime의 start를 실행한다.   
AppRuntime은 AndroidRuntime의 자식이고, start()는 이 부모의  method로서,    
Frameworks로 흐름이 넘어가게 된다.   
AndroidRuntime은 다음에 구현되어 있다.   
```
frameworks/base/core/jni/AndroidRuntime.cpp   
```

AndroidRuntime은 ZygoteInit의 main() method를 호출한다.   
이때 app_process의 main()에서 전달 받은 “start-system-server” string을 optons로 인자로 전달 한다.   
ZygotInit의 main()에서는 이 option이 설정되어 있다면 다음과 같이, Thread를 생성해서 forkSystemServer()를 실행하게 된다.    
```
zygoteServer = new ZygoteServer(isPrimaryZygote);

f (startSystemServer) {
                Runnable r = forkSystemServer(abiList, zygoteSocketName, zygoteServer);
                ...
                    r.run();
            }
```
ZygoteInit::forkSystemServer()는 Zygote::forkSystemServer()를 실행한다.   


---
title: "Android Booting"
permalink: /kdb/android/boot/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content

# Outline

# Boot Sequence

## 1. From bootloader to execution of init process

1. init process는 init.rc를 보고 zygote를 실행하게 된다.   
init.zygote.xx.rc를 import하고, zygote라는 service를 start 시킨다.     
```
[system/core/rootdir/init.rc]
import /init.${ro.zygote}.rc
trigger zygote-start
on zygote-start && property:ro.crypto.state=unencrypted
    start zygote
    start zygote_secondary
```
zygote_secondary는 32bit zygote를 의미한다.   
import된 zygote.rc에서, zygote의 실체인 app_process를 실행하고,   
audioserver, cameraserver, mediaserver netd wificond 등등을 실행한다.   
```
[system/core/rootdir/init.zygote64_32.rc]
service zygote /system/bin/app_process64 -Xzygote /system/bin --zygote --start-system-server --socket-name=zygote
	onrestart restart audioserver
    onrestart restart cameraserver
    onrestart restart media
    onrestart restart netd
    onrestart restart wificond
..
service zygote_secondary /system/bin/app_process32 -Xzygote /system/bin --zygote --socket-name=zygote_secondary --enable-lazy-preload
```
뒤에 살펴보겠지만, app_process는 인자인 --start-system-server를 통해서 system_server를 실행하게 된다.   
Qemu에서 확인해 보면, 다음과 같이 zygote process가 실행되고 있다.   
```
root          1503     1 0 17:05:41 ?     00:00:00 zygote64
root          1504     1 0 17:05:41 ?     00:00:00 zygote
```

2. app_process가 실행된다.      
```
[frameworks/base/cmds/app_process/Android.mk]
LOCAL_MODULE:= app_process
LOCAL_MULTILIB := both
LOCAL_MODULE_STEM_32 := app_process32
LOCAL_MODULE_STEM_64 := app_process64
..
app_process_src_files := \
    app_main.cpp \
..
LOCAL_SRC_FILES:= $(app_process_src_files)
```
즉 Source file은 frameworks/base/cmds/app_process/app_main.cpp에 위치한다.   
이 파일의 main()에서 Zygote는 시작된다.   
app_process64의 –start-system-server option을 다음과 같이 처리하고 있다.   
```
if (strcmp(arg, "--zygote") == 0) {   
            zygote = true;  
            niceName = ZYGOTE_NICE_NAME;  
        }  
..   
if (strcmp(arg, "--start-system-server") == 0) {  
            startSystemServer = true;  
        }   
..   
 if (startSystemServer) {    
            args.add(String8("start-system-server"));   
        }   
..   
 if (zygote) {   
        runtime.start("com.android.internal.os.ZygoteInit", args, zygote);   
    }   
```
여기서 <span style="color:red">**AppRuntime의 start()**</span>를 실행한다.   
AppRuntime은 AndroidRuntime의 자식이고, start()는 이 부모의 method로서,   
Frameworks로 흐름이 넘어가게 된다.   
AndroidRuntime은 ZygoteInit의 main() method를 호출한다.   
이때 app_process의 main()에서 전달 받은 “start-system-server” string을 optons로 인자로 전달 한다.   
ZygotInit의 main()에서는 이 option이 설정되어 있다면 다음과 같이, Thread를 생성해서 forkSystemServer()를 실행하게 된다.   
```
[frameworks/base/core/jni/AndroidRuntime.cpp]   
zygoteServer = new ZygoteServer(isPrimaryZygote);
..
if (startSystemServer) {
		Runnable r = forkSystemServer(abiList, zygoteSocketName, zygoteServer);
		...
		r.run();
}
```



## 2. Execution of the zygote


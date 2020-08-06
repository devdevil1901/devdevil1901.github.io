---
title: "Flash"
permalink: /kdb/android/flash/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content

# Outline

# Background
Image를 phone에 적용하는 방법은 두 가지가 존재 한다.   
하나는 flash를 통해 raw level로 Image를 교체하는 방법으로, Factory image와 custom rom을 가지고 image를 업데이트 시키는 것이다.   
다른 하나는 OTA(Over-The-Air)를 통해서 업데이트를 하는 방법으로 Full OTA Image가 사용된다.   

# Update
OTA update를 사용한다.  
OS, read only App, 시간대 규칙등을 업그레이드 하기 위한 것.   
A/B Update 방식을 사용하는데, 각 파티션의 두개의 사본인 A와 B가 있고, A는 사용하면서 B에다가 업데이트 수행하는 식으로 동작한다.   

## APEX(Android Pony Express)  
Android 10에 도입 된 컨테이너 형식으로, HAL, ART, clsas library등과 같은 System 구성 요소의 업데이트를 쉽게 한다.   

Zip 파일 안에 다음과 같은 구성을 가진다.      
* **apex_manifest.json**    
package 이름과 version AndroidManifest.xml의 내용도 여기에서도 제공됨    
* **AndroidManifest.xml**   
* **apex_pubkey**   
서명하는데 사용된 공개키       
* **apex_payload.img**   
dm-verity가 지원하는 ext4 file system image   

# Image


|image|desc|
|---|---|
|ramdisk.img|root file system(/)은 여기에 포함되어 있었지만<br/>Android 10에서 부터 system.img에 병합되었다.<br/>BoardConfig.mk에서 BOARD_BUILD_SYSTEM_ROOT_IMAGE가 true인 것 처럼 생성된다.<br/>BOARD_BUILD_SYSTEM_ROOT_IMAGE는 항상 false로 해야 한다. 이제 이 옵션은 ramdisk를 사용하지 않고,<br/>직접 system.img를 mount하는 것으로 동작한다.<br/>|
|boot.img|kernel + ramdisk|
|recovery.img|kernel + ramdisk|
|system.img|File system image<br/>기존에 /system Android 10 부터는  /|
|userdata.img|/data를 위한 file system|
|cache.img|/cache를 위한 file system|

대략적인 memory에서의 layout은 다음과 같다.  
<pre>
 ______________________________________
|  bootloader
|______________________________________
|  misc(optional - used during OTA update)
|______________________________________
|  boot(kernel + ramdisk)
|______________________________________
|  recovery (kernel+ ramdisk)
|______________________________________
|  /system (read-only)
|______________________________________
|  /data (read/write)
|______________________________________
|  /cache
|______________________________________
</pre>


## Dynamic partition

## Factory Images
구글의 Pixel과 Nexus의 Factory Image는 [다음](https://developers.google.com/android/images)에서 확인 다운로드 가능.   

full OTA image

## Fastboot
bootloader와의 protocol.  
Ethernet이나, USB를 통해 communication.  

source 위치는 system/core/fastboot   


```
adb reboot-bootloader

fastboot devices
fastboot getvar
fastboot continue
fastboot reboot
fastboot erase <boot, recovery, system, userdata, cache중의 하나>
fastboot flash <boot, recovery, system, userdata, cache중의 하나> 
fastboot flash <boot, recovery, system, userdata, cache중의 하나> <$ANDROID_PRODUCT_OUT에 있는 image>
fastboot flashall
```

# Rooting

## Magisk

가장 큰 특징은  Systemless 방식으로 /system을 변조하지 않는다.   
심지어 Xposed도 Systemless로 포함시키고 있다.   
Magisk Hide로 Xposed를 빼고는, SafetyNet을 우회할 수 있다.   

[공식 Github](https://github.com/topjohnwu/Magisk)를 기준으로 현재 Android 9.0+까지 지원한다.   
10.0은 아직 지원 안함.  

### How to root

apk파일을 다운로드 받아서, 매우 쉽게 rooting할 수 있는 Magisk Manager를 제공한다.  
[공식사이트](https://magiskroot.net)   


---
title: "Flash"
permalink: /kdb/android/flash/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content

# Outline
Nexus 5.0L phone에서 custom rom형태의 android app 동적 분석 솔루션을 개발 하였었다.   
그때는 매우 쉽게 flash 하였었는데, 지금은 좀더 복잡 다단해진 면이 있어 정리 한다.   
재밌는것은 구글 Pixel의 경우, Android Flash tool이라는 [website](https://flash.android.com)에서 가능하다.   


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

## Layout

|image|desc|
|---|---|
|ramdisk.img|root file system(/)은 여기에 포함되어 있었지만<br/>Android 10에서 부터 system.img에 병합되었다.<br/>BoardConfig.mk에서 BOARD_BUILD_SYSTEM_ROOT_IMAGE가 true인 것 처럼 생성된다.<br/>BOARD_BUILD_SYSTEM_ROOT_IMAGE는 항상 false로 해야 한다. 이제 이 옵션은 ramdisk를 사용하지 않고,<br/>직접 system.img를 mount하는 것으로 동작한다.<br/>|
|boot.img|kernel + ramdisk|
|recovery.img|kernel + ramdisk|
|system.img|File system image<br/>기존에 /system Android 10 부터는  /|
|userdata.img|/data를 위한 file system|
|cache.img|/cache를 위한 file system|

> **boot.img**  
boot.img와 recovery.img의 기본 구조는 다음과 같다.   
 ______________________________________   
|  ramdisk ( linux compressed cpio format )   
|______________________________________   
|  kernel ( compressed kernel )   
|______________________________________    
|  header   
|______________________________________  
   
 +---------------------------------------+    
 | boot header                           | 1 page   
 +---------------------------------------+    
 | kernel (compressed)                   | n pages   
 +---------------------------------------+    
 | ramdisk  (compressed cpio format)     | m pages   
 +---------------------------------------+    
 | second stage    	                     | o pages   
 +---------------------------------------+    
 | recovery dtbo/acpio                   | p pages   
 +---------------------------------------+    
 | dtb             	                     | q pages   
 +---------------------------------------+    


header의 format은 **aosp/system/core/mkbootimg/include/bootimg/bootimg.h**에서 확인할 수 있다.        

|v0|v1|v2|
|---|---|---|
|



Image의 종류에 따라 format과 flash 하는 방식도 다르다.  
factory image는 bootloader로, ota는 recovery의 sideload로 flash를 해야한다.      

## Factory Image  
공장 출하 상태의 image로서, bootloader image, radio image, 그리고 update할 image가 포함되어 있다.    

> **bootloader를 unlock**   
**bootloader를 unlock** 하게되면, 개인정보 보호를 위해 사용자 data가 모두 삭제된다.    
또한 이동통신사에서 device의 SIM을 잠궜다면 bootloader를 unlock할 수 없다.    
내 기억으로는 Nexus 5L 까지는 잘 되었고, Pixel 2에서는 막혔던 것으로 기억한다.   
최신 기기(구글의 경우 2015년 이후)    
```fastboot flashing unlock```   
이전 devices들에서는     
```fastboot oem unlock```   
bootloader를 다시 잠그려면, 마찬가지로   
```
fastboot flashing lock
fastboot oem lock
```    

> **bootloader flash**   
bootloader.img를 flash한다.  
```
adb reboot bootloader
fastboot flash bootloader bootloader.img
fastboot reboot-bootloader
```   

> **radio image flash**   
 공장 출하 상태의 image를 flash한다.    
 ```
 fastbot flash radio radio.img
 fastboot reboot-bootloader
 ```

> **update image를 flash**    
boot.img dtbo.img product.img super_empty.img system.img system_other.img vbmeta.img vbmeta_system.img vendor.img등을 포함한,    
압축파일로 업데이트를 수행한다.    
```
fastboot -w update update.zip
```

## **OTA Image or Full OTA Image**   
OTA(Over-the-air)로 update 하는 image.  
OAT full image가, 여러 패치등이 포함된 상태이고, 더 쉽고 안전하게 적용 가능하다.      
먼저 모든 OTA를 업데이트 시켜 놓아야 하고, bootloader를 unlock할 필요는 없다.   
**recovery로 flash된다**     
```
adb reboot recovery
adb devices
adb sideload ota.zip
```
ota.zip에는  payload.bin이 포함되어 있다.    
```
$ AOSP/system/update_engine/scripts/payload_info.py ./payload.bin
Payload version:         	2
Manifest length:         	105508
Number of partitions:    	18
  Number of "boot" ops:  	32
  Number of "system" ops:	383
  Number of "vbmeta" ops:	1
  Number of "dtbo" ops:  	4
  Number of "product" ops:   1059
  Number of "vbmeta_system" ops: 1
  Number of "vendor" ops:	309
  Number of "abl" ops:   	1
  Number of "aop" ops:   	1
  Number of "devcfg" ops:	1
  Number of "hyp" ops:   	1
  Number of "keymaster" ops: 1
  Number of "qupfw" ops: 	1
  Number of "tz" ops:    	2
  Number of "uefisecapp" ops: 1
  Number of "xbl" ops:   	2
  Number of "xbl_config" ops: 1
  Number of "modem" ops: 	41
Block size:              	4096
Minor version:           	0
```
이 안에 다양한 image파일들을 포함하고 있는 것을 확인할 수 있다.   
image 파일들을 추출하기 위해서는 [payload_dumper](https://www.droidmirror.com/download/download-payload_dumper-zip/)를 사용한다.    
```
python payload_dumper.py ./payload.bin
boot
system
vbmeta
dtbo
..
```

> **Stock rom**  
제조사에서 특정 device를 위해서 제조한 ROM.  
즉 custom rom과 반대의 개념의 기본적으로 제공되는 ROM.        

## download
[Google](https://developers.google.com/android/images)   


## Dynamic partition


## Fastboot
bootloader와의 protocol.  
device가 bootloader mode에서, Ethernet이나, USB를 통해 communication한다.     



fastboot protocol을 사용하기 위해서는 [platform-tools](https://developer.android.com/studio/releases/platform-tools.html?hl=ko)를  
설치해야한다.   

source 위치는 system/core/fastboot   

사용을 위해서는 adb reboot bootloader로 bootloader로 진입해야 한다.   

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
크게 다음과 같은 과정을 거친다.  
* Phone의 개발자 모드 enable후 OEM Unlocking enable, usb debugging enable
* bootloader unlock
* twrp recovery rom을 overwrite  
* twrp로 magisk를 flash


> **phone정보 파악**    
먼저 자신의 phone의 정보를 정확하게 파악하는 것이 좋다.    
|항목|내폰예제|
|---|---|
|휴대전화 정보 - 모델 및 하드웨어|SKW-H0|
|Android 버전|9|
|IMEI|LGU+(sym slot2)|
|uname -a|Linux localhost 4.14.83-perf+ #2 SMP PREEMPT Mon Mar 9 17:34:21 CST 2020 aarch64|
|cat /proc/cpuinfo|Hardware        : Qualcomm Technologies, Inc SM8150로 Snapdragon 855 processor인것을 알수 있다.|


## Magisk

가장 큰 특징은  Systemless 방식으로 /system을 변조하지 않는다.   
심지어 Xposed도 Systemless로 포함시키고 있다.   
Magisk Hide로 Xposed를 빼고는, SafetyNet을 우회할 수 있다.   

[공식 Github](https://github.com/topjohnwu/Magisk)를 기준으로 현재 Android 9.0+까지 지원한다.   
10.0은 아직 지원 안함.  

# Downlaod

[공식사이트](https://magiskroot.net)   
[삼성롬](https://www.sammobile.com/firmwares/archive/)   

TWRP recovery   
[SamSung](https://twrp.me/Devices/Samsung/)     
[Xiaomi](https://twrp.me/Devices/Xiaomi/)    
[Xiaomi Unofficail](https://unofficialtwrp.com/category/xiaomi/)    




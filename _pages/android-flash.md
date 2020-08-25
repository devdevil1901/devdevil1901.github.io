---
title: "Flash"
permalink: /kdb/android/flash/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content
* [Outline](#outline)   
* [Background](#background)  
	* [Ramdisk](#ramdisk)   
	* [Fastboot](#fastboot)   
	* [Update](#update)    
	* [File System](#file-system)    
	* [APEX(Android Pony Express)](#apexandroid-pony-express)    
* [Image](#image)    
	* [Type](#type)   
	* [Boot,Recovery](#bootrecovery)       
	* [Factory Image](#factory-image)    
	* [OTA Image or Full OTA Image](#ota-image-or-full-ota-image)    
* [Rooting](#rooting)   
	* [Magisk](#magisk)  
* [References](#reference)    

# Outline
Nexus 5.0L phone에서 custom rom형태의 android app 동적 분석 솔루션을 개발 하였었다.   
그때는 매우 쉽게 flash 하였었는데, 지금은 좀더 복잡 다단해진 면이 있어 정리 한다.   
구글 Pixel의 경우, Android Flash tool이라는 [website](https://flash.android.com)에서 가능하다.   

# Background

## ramdisk
swap과는 반대의 개념으로, dram이나, flash에 disk를 구현하는 것.    
initrd 즉 initial ramdisk는 특수한 상황을 위한 ramdisk로서, booting process를 위한    
kernel module과 이를 로드하기 위한 tool(insmod등)들을 포함하게 된다.    
smartphone에서는 별도의 disk가 없기 때문에, initrd는 boot 이후로도 계속 사용된다.   
또한 이 때문에 apex, init.rc, init등이 ramdisk에 들어있다.   
즉 boot 시에는 root에 mount되었다가, 이후 다른 file system에 mount되고, init은 진짜 root file system을 로드하게 된다.   

Android에서 initrd는 boot.img에 통합되었고, flash memory에 구성되며, mkbootfs command로 생성된다.    
또한 init, init.rc, /apex, 대 부분의 command들 모두 ramdisk에서 포함하고 있다.   
거의 boot를 위한 것이라기 보다는 file system을 포함하고 있는 수준. [참조](#bootrecovery)    

## Fastboot
bootloader와의 protocol.  
device가 bootloader mode에서, Ethernet이나, USB를 통해 communication한다.     

fastboot protocol을 사용하기 위해서는 [platform-tools](https://developer.android.com/studio/releases/platform-tools.html?hl=ko)를  
설치해야한다.   

source 위치는 system/core/fastboot   
사용을 위해서는 adb reboot bootloader로 bootloader로 진입해야 한다.   

1. **연결된 device 확인**   
devices 명령을 사용한다.   
```
$ fastboot devices
4bb11ec2        fastboot
```

2. **bootloader 정보 확인**
oem device-info를 사용한다.   
```
$ fastboot oem device-info
(bootloader) Verity mode: true
(bootloader) Device unlocked: true
(bootloader) Device critical unlocked: false
(bootloader) Charger screen enabled: false
(bootloader) Console enabled: false
OKAY [  0.007s]
finished. total time: 0.007s
```

3. **relace recovery**   
flash recovery를 이용.   
```
fastboot flash recovery new_recovery.img    
fastboot reboot   
```

4. **다양한 mode로 재부팅**   
일반적인 부팅인 rom으로 부팅시,   
```
fastboot reboot
```
bootloader로 재 부팅    
```
fastboot reboot-bootloader
```
recovery로   
```
fastboot reboot recovery
```

5. **특정 image로 부팅**   
```
fastboot boot image.img
```

6. **bootloader unlock**   
flashing unlock and flashing unlock_critical   

7. **oem command**     
제조사 마다 다른 구현의 명령어들이다.  
예를 들면,   
oem device-info   
oem oem get_imei1   
제조사의 구현이기 때문에, 일반적인 명령도 특정 device에서는 안 먹히는 경우가 많다.    
이런 경우, fastboot를 막아 놓지 않았다면, oem으로 별도로 구현되어 있는 경우도 많다.    
그 예로 샤오미의 Blackshark2 pro에서는   
다음과 같이 bootloader를 unlock 해야 한다.        
```
$ fastboot oem bs_unlock
$ fastboot oem bs_unlock_critical
$ fastboot oem device-info
. . .
(bootloader) Verity mode: true
(bootloader) Device unlocked: true
(bootloader) Device critical unlocked: true
(bootloader) Charger screen enabled: false
(bootloader) Console enabled: false
OKAY [  0.008s]
finished. total time: 0.008s
```

## Update
Over-The-Air(OTA)를 이용해서, /system partition에 설치된 읽기 전용 앱, OS, 시간대 규칙(8.1 부터는 OTA 사용하지 않고, push할 수 있게 됨)등을 업데이트 한다.   
최신 Android device에서는 각 partition의 두 사본이 있어서, a와 b라고 부른다.   
즉 A는 사용하면서 B에다가 업데이트.  즉 기존에 다운로드 받고 압축해제 해 놓는 등의 작업이 필요없이 바로 적용된다.         

## File System   
> Yaffs2(Yet Another Flash File System)     
Nand Flash를 위한 파일 시스템이다.   
Yaffs2는 좀 더 큰 PAGE와 쓰기 제약이 커진 새로운 디바이스를 지원한다.   
AOSP에서는 yaffs2와 ext3를 지원하고, AVD에서는  yaffs2 file system을 제공.
[공식사이트](https://code.google.com/archive/p/yaffey/)   
[Util](https://code.google.com/archive/p/yaffs2utils/)        


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
Image의 종류에 따라 format과 flash 하는 방식도 다르다.  
factory image는 bootloader로, ota는 recovery의 sideload로 flash를 해야한다.      

## Type

|image|desc|
|---|---|
|ramdisk.img|root file system(/)은 여기에 포함되어 있었지만<br/>Android 10에서 부터 system.img에 병합되었다.<br/>BoardConfig.mk에서 BOARD_BUILD_SYSTEM_ROOT_IMAGE가 true인 것 처럼 생성된다.<br/>BOARD_BUILD_SYSTEM_ROOT_IMAGE는 항상 false로 해야 한다. 이제 이 옵션은 ramdisk를 사용하지 않고,<br/>직접 system.img를 mount하는 것으로 동작한다.<br/>|
|boot.img|kernel + ramdisk|
|recovery.img|kernel + ramdisk|
|system.img|File system image<br/>기존에 /system Android 10 부터는  /|
|userdata.img|/data를 위한 file system|
|cache.img|/cache를 위한 file system|

## Boot,Recovery    
boot.img는 **kernel**과 **ramdisk**, 그리고 optional하게 **dtb**를 포함하고 있다.   
이것은 recovery.img도 마찬가지이다.    
aosp안의 system/core/mkbootimg/unpack_bootimg.py를 이용하여 안의 파일들을 추출할 수 있다.    
```
$ python2 unpack_bootimg.py --boot_img ~/analysis/bootimg/boot.img --out ~/analysis/extracted_boot_img
boot_magic: ANDROID!
kernel_size: 20925820
kernel load address: 0x8000
ramdisk size: 10714425
ramdisk load address: 0x1000000
second bootloader size: 0
second bootloader load address: 0xf00000
kernel tags load address: 0x100
page size: 4096
boot image header version: 2
os version and patch level: 335544634
product name:
command line args: console=ttyMSM0,115200n8 androidboot.console=ttyMSM0 printk.devkmsg=on msm_rtb.filter=0x237 ehci-hcd.park=3 service_locator.enable=1 androidboot.memcg=1 cgroup.memory=nokmem usbcore.autosuspend=7 androidboot.usbcontroller=a600000.dwc3 swiotlb=2048 androidboot.boot_devices=soc/1d84000.ufshc buildvariant=user
additional command line args:
recovery dtbo size: 0
recovery dtbo offset: 0x0
boot header size: 1660
dtb size: 1002744
dtb address: 0x1f00000
devdevil$ cd ~/analysis/extracted_boot_img/
devdevil$ ls -al
합계 31888
drwxr-xr-x 2 devdevil devdevil     4096  2월 11 18:59 .
drwxr-xr-x 7 devdevil devdevil     4096  2월 11 18:59 ..
-rw-r--r-- 1 devdevil devdevil  1002744  2월 11 18:59 dtb
-rw-r--r-- 1 devdevil devdevil 20925820  2월 11 18:59 kernel
-rw-r--r-- 1 devdevil devdevil 10714425  2월 11 18:59 ramdisk
devdevil$ file -s dtb
dtb: Device Tree Blob version 17, size=502451, boot CPU=0, string block size=41355, DT structure block size=461040
devdevil$ file -s kernel
kernel: LZ4 compressed data (v1.4+)
devdevil$ file -s ramdisk
ramdisk: gzip compressed data, from Unix
```

추출된 ramdisk는 다음과 같이 zcat으로 unpack이 가능하다.   
```
$ zcat ./ramdisk | cpio -i
drwxr-xr-x 2 devdevil devdevil     4096  2월 11 19:17 acct
drwxr-xr-x 2 devdevil devdevil     4096  2월 11 19:17 apex
lrwxrwxrwx 1 devdevil devdevil       11  2월 11 19:17 bin -> /system/bin
lrwxrwxrwx 1 devdevil devdevil       50  2월 11 19:17 bugreports -> /data/user_de/0/com.android.shell/files/bugreports
lrwxrwxrwx 1 devdevil devdevil       19  2월 11 19:17 charger -> /system/bin/charger
dr-xr-xr-x 2 devdevil devdevil     4096  2월 11 19:17 config
lrwxrwxrwx 1 devdevil devdevil       17  2월 11 19:17 d -> /sys/kernel/debug
drwxrwx--x 2 devdevil devdevil     4096  2월 11 19:17 data
drwxr-xr-x 2 devdevil devdevil     4096  2월 11 19:17 debug_ramdisk
lrwxrwxrwx 1 devdevil devdevil       12  2월 11 19:17 default.prop -> prop.default
drwxr-xr-x 2 devdevil devdevil     4096  2월 11 19:17 dev
lrwxrwxrwx 1 devdevil devdevil       15  2월 11 19:17 dsp -> /vendor/lib/dsp
lrwxrwxrwx 1 devdevil devdevil       11  2월 11 19:17 etc -> /system/etc
drwxr-xr-x 3 devdevil devdevil     4096  2월 11 19:17 first_stage_ramdisk
lrwxrwxrwx 1 devdevil devdevil       16  2월 11 19:17 init -> /system/bin/init
-rwxr-x--- 1 devdevil devdevil     6343  2월 11 19:17 init.rc
. . . . . . . . . .
```

boot.img와 recovery.img의 기본 구조는 다음과 같다.   
<pre>
+----------------------------------------------+   
|  ramdisk ( linux compressed cpio format )    +  
+----------------------------------------------+   
|  kernel ( compressed kernel )                |    
+----------------------------------------------+   
|  header                                      |    
+----------------------------------------------+   
다음은 memory에서의 layout이다.       
+---------------------------------------+    
| boot header                           | 1 page   
+---------------------------------------+    
| kernel (compressed)                   | n pages   
+---------------------------------------+    
| ramdisk  (compressed cpio format)     | m pages   
+---------------------------------------+    
| second stage    	                    | o pages   
+---------------------------------------+    
| recovery dtbo/acpio                   | p pages   
+---------------------------------------+    
| dtb             	                    | q pages   
+---------------------------------------+    
</pre>

header의 format은 boot_img_hdr 구조체에 구현되어 있으며,   
**aosp/system/core/mkbootimg/include/bootimg/bootimg.h**에서 확인할 수 있다.        
v0, android 9의 v1, android 10의 v2가 있다.   

boot,recovery image를 생성하기 위해서는   
aosp의 system/core/mkbootimg/mkbootimg.py를 이용한다.   
```
mkbootimg.py --kernel kerenel --ramdisk ramdisk --dtb dtb --pagesize 4096 --header_version 2 --base 0 --os_version 0x1400013a --cmdline="console=ttyMSM0,115200n8 androidboot.console=ttyMSM0 printk.devkmsg=on msm_rtb.filter=0x237 ehci-hcd.park=3 service_locator.enable=1 androidboot.memcg=1 cgroup.memory=nokmem usbcore.autosuspend=7 androidboot.usbcontroller=a600000.dwc3 swiotlb=2048 androidboot.boot_devices=soc/1d84000.ufshc buildvariant=user" -o newboot.img
devdevil@devdevil-System-Product-Name:~/tool/bootimg_unpacker/works$ ls -al
합계 62792
drwxr-xr-x 2 devdevil devdevil     4096  2월 14 08:32 .
drwxr-xr-x 7 devdevil devdevil     4096  2월 14 08:31 ..
-rw-r--r-- 1 devdevil devdevil  1002744  2월 13 19:35 dtb
-rw-r--r-- 1 devdevil devdevil 20925820  2월 13 19:35 kerenel
-rw-r--r-- 1 devdevil devdevil 31645696  2월 14 08:33 newboot.img
-rw-r--r-- 1 devdevil devdevil 10714425  2월 13 19:35 ramdisk
devdevil@devdevil-System-Product-Name:~/tool/bootimg_unpacker/works$ ls -al newboot.img
-rw-r--r-- 1 devdevil devdevil 31645696  2월 14 08:33 newboot.img
```

특히 pagesize와 header_version을 신경 써줘야 한다.   
android 10 image라면, pagesize가 4096, header_version이 2일 것이다.   
os_version이 조금 이상한데 추후에 좀더 살펴보자.  

flash를 위해서, boot.img를 생성하기 위해서는 특정 command를 추가한, ramdisk의 수정도 필요할 것이다.   
ramdisk의 repack은 다음과 같이 수행한다.   
```
$ find . | cpio -H newc --owner root:root -ov > ../repack_ramdisk.cpio
40990 blocks
devdevil$ ls -l ../repack_ramdisk.cpio
-rw-r--r-- 1 devdevil devdevil 20986880  2월 11 19:24 ../repack_ramdisk.cpio
devdevil$ cd ..
devdevil$ gzip repack_ramdisk.cpio
devdevil$ ls -l repack_ramdisk.cpio.gz
-rw-r--r-- 1 devdevil devdevil 10694268  2월 11 19:24 repack_ramdisk.cpio.gz
devdevil$ file -s repack_ramdisk.cpio.gz
repack_ramdisk.cpio.gz: gzip compressed data, was "repack_ramdisk.cpio", last modified: Tue Feb 11 10:24:22 2020, from Unix
devdevil$ file -s ramdisk
ramdisk: gzip compressed data, from Unix
devdevil$ ls -lh repack_ramdisk.cpio.gz
-rw-r--r-- 1 devdevil devdevil 11M  2월 11 19:24 repack_ramdisk.cpio.gz
devdevil$ ls -lh ramdisk
-rw-r--r-- 1 devdevil devdevil 11M  2월 11 19:16 ramdisk
```

해보지는 않았지만 다음의 command도 사용가능.   
```
다른데서는 다음의 명령어도 있었다. (해보지는 않음 참조)
ramdisk$ find . ! -name . | LC_ALL=C sort | cpio -o -H newc -R root:root | gzip > ../new-boot.img-ramdisk.gz

```

## Factory Image  
공장 출하 상태의 image로서, bootloader image, radio image, 그리고 update할 image가 포함되어 있다.    

> **bootloader를 unlock**   
**bootloader를 unlock** 하게되면, 개인정보 보호를 위해 사용자 data가 모두 삭제된다.    
또한 이동통신사에서 device의 SIM을 잠궜다면 bootloader를 unlock할 수 없다.    
Samsung등의 phone에서는 fastboot command는 사용할 수 없고, device 별 전용 flash tool을 사용해야 한다.    
* Qualcomm Sanpdragon chipsets를 위한 QPST   
* Samsung devices들을 위한, Odin   
* Xiaomi devices들을 위한 Mi Flashtool   
* MediaaTek Chipsets을 위한 SP Flash Tool   
* Speedtrum Chipsets을 위한 SPD Flashtool   
내 기억으로는 Nexus 5L 까지는 잘 되었고, Pixel 2에서는 초반에 한정 빼고는 막혔던 것으로 기억한다.   

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
AOSP안의 python(2.x) script로 품고 있는 image들을 확인할 수 있다.   
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

# Reference  
> **source**
[TWRP source](https://github.com/omnirom/android_bootable_recovery/)   
[Msgisk](https://github.com/topjohnwu/Magisk)  

> **Magisk**  
[Modules](https://magiskroot.net/)  

> **stock rom sites**   
[삼성롬](https://www.sammobile.com/firmwares/archive/)   

> **recovery**   
[SamSung](https://twrp.me/Devices/Samsung/)     
[Xiaomi](https://twrp.me/Devices/Xiaomi/)    
[Xiaomi Unofficail](https://unofficialtwrp.com/category/xiaomi/)    

  




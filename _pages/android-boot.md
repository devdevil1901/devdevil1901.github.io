---
title: "Android Booting"
permalink: /kdb/android/boot/
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



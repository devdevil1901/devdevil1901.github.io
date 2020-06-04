---
title: "Device Mapper"
permalink: /kdb/android/device_mapper/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of contents

# Outline
Device mapper는 android나 linux 모두에서 disk 관련 작업을 할때 필수 적인 지식이다.       
물리적인 block device를 virtual block 장치로 mapping 하는 kernel driver framework. 
LVM, software방식의 raid, multipath, partition 암호화 등에 사용된다.       
Mapping type에 따라 다음과 같은 방식이 있다.      

* Linear
kerneldrivers/md/dm-linear.c      

* Striped
* Mirror
* snapshot/snapshot-origin
* Error
* Zero
* Multipath
* Crypt


```
/dev/block/dm-2               2.4G  2.3G   64M  98% /
/dev/block/dm-1               124M  123M  444K 100% /vendor

```

Docker는 원래 ubuntu, debian 에서 구동되었고, storage backend로 AUFS를 사용했었다.     
Redhat 계열의 linux에서 사용하기 위해서, kernel에 AUFS를 넣으려고 하다가, device mapper를 이용해서 새로운 storage backend를 개발하였다.     

# LVM(Logical Volume Manage)
한 마디로 물리적인 disk를 추상화 시켜서, 논리적인 볼륨으로 구성하는 것이다.       
논리적인 볼륨(LV)는 group으로 또 묶는다.     
즉 legacy 방식에서 file system에서 block device으로 접근을 한다면, file system에서 lvm을 통해 block device에 접근(읽기 쓰기)을 하게 되는 것이다.       

순서대로 정리하면 다음과 같은 식.       
[Harddrive] -----> fdisk(lvm type) ---> [partition]  ---pvcreate ---> [Physical Voulme)---->vgcreate[voulume group]--lvcreate--->[logical volume]--------mount----->[file system]         
/dev/sda              /dev/sda1               /dev/sda1                          /dev/sda1                    mygroup1                                             /dev/mygroup1/dtlv                      /mnt/data          
                                                          /dev/sda2                          /dev/sda2

다음과 같이 fdisk -l로 harddisk의 논리 partition들을 확인할 수 있다.      
```
sudo fdisk -l /dev/sda    
Disk /dev/sda: 476.9 GiB, 512076283904 bytes, 1000148992 sectors
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 4096 bytes
I/O size (minimum/optimal): 4096 bytes / 1048576 bytes
Disklabel type: gpt
Disk identifier: C4D811EE-15E6-47A7-BEDF-A70C0E10B3A4

Device  	Start   	End   Sectors   Size Type
/dev/sda1  	34	409633	409600   200M EFI System
/dev/sda2  411648 999884799 999473152 476.6G Linux filesystem

Partition 1 does not start on physical sector boundary.
```

# Dynamic Partition
동적 partition은 말 그대로 partition의 생성,삭제, 크기변경을 동적으로 할 수 있는 것이다.   
때문에 /system, /vendor, /product등의 개별크기를 걱정할 필요가 없다.   
Linux kernel의 **dm-linear**(device mapper의 linear mapping 연속적인 block을 여러 device에 mapping)을 이용하여 구현됨.  
User level에서 구현되기 때문에, bootloader가 있는 boot.img, dtbo, vbmeta등은 dynamic partition으로 구현할 수 없다.   

```
```


# References
[Implementing dm-verify](https://source.android.com/security/verifiedboot/dm-verity)      
[android kernel 3.18](https://android.googlesource.com/kernel/common/+/android-3.18/Documentation/device-mapper/)       
[dm-bow](https://android.googlesource.com/kernel/common/+/refs/heads/android-5.4-stable/Documentation/device-mapper/dm-bow.txt)         


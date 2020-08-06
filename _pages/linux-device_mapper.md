---
title: "Device Mapper"
permalink: /kdb/linux/device_mapper/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of contents

# Outline
Device Mapper는 block device단의 추상화를 제공하는 kernel단 framework이기 때문에,    
먼저 block device에 대해서 살펴 볼 필요가 있다.   
block device는 block단위 암호화 방식에서 처럼 16byte와 같은 한 block단위로 I/O를 하는 device를 의미한다.   
harddisk에 접근을 하기 위해서 Random access를 제공한다.(이것이 character device와 가장 큰 차이)    
   


Device Mapper는 물리적인 block device를 가상의 block device로 mapping 하는 kernel framework이다.      
virtual device로의 접근을 실제 물리 device로 device mapper가 전달해 주는 역활을 수행한다.   
때문에 device mapper 단에서 물리적 disk 2개를 하나의 논리 가상 block device로 묶을 수도 있고,   
암호화 복호화를 실행할 수도 있도록 하는 것이다.         
대표적으로 LVM이나 software 기반 RAID가 device mapper를 사용한다.   

character devices와 block devices들의 list를 확인할 수 있는 **/proc/devices**를  체크해보면,   
다음과 같이 block devices로 device-mapper가 존재하는 것을 확인할 수 있다.   
```
$ cat /proc/devices
Character devices:
..
Block devices:
  7 loop
..
253 device-mapper
```     

관련된 소스는 drivers/md/를 참조하자.   

bio는 block I/O를 의미한다.   
disk의 I/O는 비용이 크기 때문에 caching을 통해서 성능을 극대화 한다.   
I/O는 ioctl과 이를 처리하는 device driver단의 handler를 통해서 이루어진다.   
이 부분의 추상화를 통해서 hardware 명세는 필요없게 되는 것.   


## dm-crypt
block device(disk, logical volume partition, 특정 파일)를 암호화 한다.   
Windows의 BitLocker, Apple의 FileVault와 같은 기능으로 전체 디스크를 암호화할 수 있는 기능이다.            
drivers/md/dm-crypt.c에 구현되어 있다.   

## dm-verity
read-only block device의 각 block 단위의 무결성 검사를 수행한다.   
kernel crypto API에 의해 제공되는 hash 값을 이용한다.   
이를 위해서 signed meta-data와 hash tree를 사용한다.   
실제로 block을 접근할 때만 검증한다.   
block을 읽을 때 병렬로 hashing해 놓고, 확인한다.   
hash를 비교해서 틀리면 I/O error를 생성한다.    


Android에서는 4.4에서 도입되었다.   


다음 과정을 수행한다.   
1. ext4 시스템 이미지를 생성합니다.
2. 생성한 이미지의 해시 트리를 생성합니다.
3. 해시 트리의 dm-verity 테이블을 빌드합니다.
4. dm-verity 테이블에 서명하여 테이블 서명을 생성합니다.
5. verity 메타데이터 번들로 dm-verity 테이블 및 테이블 서명을 묶습니다.
6. 시스템 이미지, verity 메타데이터 및 해시 트리를 연결합니다.


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

# dm-verity

```
adb disable-verity 
adb enable-verity
```


# References
[Implementing dm-verify](https://source.android.com/security/verifiedboot/dm-verity)      
[android kernel 3.18](https://android.googlesource.com/kernel/common/+/android-3.18/Documentation/device-mapper/)       
[dm-bow](https://android.googlesource.com/kernel/common/+/refs/heads/android-5.4-stable/Documentation/device-mapper/dm-bow.txt)         


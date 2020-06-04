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
## Image
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


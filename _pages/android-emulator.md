---
title: "Android Emulator"
permalink: /kdb/android/emulator/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content
* [Outline](#outline)   
* [Build](#build)
* [Location](#location)

# Outline
Android Studio team에서 avd의 가장 핵심 과제로 2018년 까지 성능 향상을 추구해왔고,   
이를 위한 feature가 바로 Quickboot와 snapshot이다.    
2017년 도입된 Quick boot는 6초이내에 qemu를 실행할 수 있도록 한다.    
처음에는 cold boot, 그 다음 부터는 snapshot을 이용한 Quickboot이다.   
Legacy emulator snapshot architecture가 virtual sensor들과 GPU acceleration과 동작하게 하기 위해서, 완전히 re-engineering 했다고 한다.    
하지만 때문에 QEMU가 4.2.0이 나온 현재, avd에서는 2.12.0을 사용하고 있다.   
또한 고정된 RAM이 아니라, On-Demand RAM을 사용한다.   
이를 위해서, 가상화를 사용한다.
Linux의 KVM, MAC의 Hypervisor.Framework, Intel의 HAXM을 사용하며, Windows의 AMD cpu에서도 WHPX(Windows Hypervisor Platform API)를 통해,   
가능해 졌다.   


# Build
android.googlesource.com에서 살펴 보면,   
[qemu](https://android.googlesource.com/platform/external/qemu/)와   
[qemu-android](https://android.googlesource.com/platform/external/qemu-android/)를 확인할 수 있다.    

하지만 가장 최신 commit이 5년 전이다.   
```
~/Android/Sdk/emulator/emulator -version
Android emulator version 30.0.12.0 (build_id 6466327) (CL:N/A)
```
이것을 힌트로 소스 위치가,    
[emu-30](https://android.googlesource.com/platform/external/qemu/+log/refs/heads/emu-30-release) 이라는 것을 확인할 수 있다.   

즉 다음과 같이 소스를 다운로드 받을 수 있다.    
```
$ repo init -u https://android.googlesource.com/platform/manifest -b emu-30-release
$ repo sync -j 16
$ cd external/qemu/
$ ./android/rebuild.sh
```

binary들은 objs/ 에서 확인할 수 있다.   

# Location  
Avd를 하나 추가 하면, .android에 생성된다.   
Config.ini에는 image sysdir이 지정되어 있다.   
~/.android/avd/Nexus_5X_API_29_x86.avd$ cat config.ini | grep sys   
image.sysdir.1=system-images/android-29/google_apis/x86/   


## 2. Location where in AOSP
다음은 qemu에서 사용하는 kernel을 살펴보도록 하자.   
AOSP안에는,    
prebuilts/qemu-kernel/x86_64   
에서 확인할 수 있다.    
```
$ file current/kernel-qemu2 
current/kernel-qemu2: Linux kernel x86 boot executable bzImage, version 4.14.112+ (android-build@abfarm-us-east1-c-0070) #1 SMP PREEMPT Thu Aug 1 23:49:42 UTC 2019, RO-rootFS, swap_dev 0x6, Normal VGA
```
current는 symbolic link로서, bzImage 파일인 것을 확인할 수 있다.    


emulator의 version을 확인해 보자.   
```
~/Android/Sdk/emulator/emulator -version
Android emulator version 30.0.12.0 (build_id 6466327) (CL:N/A)
```

## 3. binary

||||
|------|---|---|
|emulator|external/qemu/android/emulator/CMakeLists.txt||
|emulator-crash-service|crash-service.cmake||
|emulator64_test_crasher|crash-service.cmake||
|libandroid-emu-crash-service.a|crash-service.cmake||
|libemulator-libui-headless.a|android-libui.cmake||
|libemulator-libui.a|android-libui.cmake||
|libandroid-emu-base.a|android-emu-base.cmake||
|android-emu_benchmark|android-emu-base.cmake||
|studio_discovery_tester|android-emu.cmake||
|libandroid-emu.a|android-emu.cmake||
|libandroid-emu-shared.so|android-emu.cmake||
|libandroid-mock-vm-operations.a|android-emu.cmake||

Android의 main()은 여기에...    
external/qemu/android/emulator/main-emulator.cpp

# commandline 
/home/devdevil/Android/Sdk/emulator/emulator -verbose -avd Pixel_2_API_29 -kernel ~/supcorp/wonderland/src/King/kernel/414-150/arch/x86/boot/bzImage -show-kernel -selinux permissive -no-snapshot


# virtualbox-based
Genymotion, BlueStacks, AMIDuOS, Andy등의 solution들이 virtual box를 기반으로 하고 있다.   


# Coldboot
emulator를 실행시, -no-snapshot를 주면, coldboot를 disable 시킬 수 있다.   
내 부적으로 
```
external/qemu/objs/avd_config/android/avd/hw-config-defs.h
HWCFG_BOOL(
  fastboot_forceColdBoot,
  "fastboot.forceColdBoot",
  "no",
  "Always use cold boot",
  "If set, AVD will always use the full cold boot instead of snapshot-based quick boot process")
```
결국에는     
```
AndroidOptions::opts->no_snapshot = 1
AndroidOptions::opts->no_snapshot_load = 1;
AndroidOptions::opts->no_snapshot_save = 1
```

code상으로는  
external/qemu/android/android-emu/android/snapshot

Snapshotter::initialize()
RamLoader::start(bool isQuickboot)


Quickboot::load()
snapshotter.load()



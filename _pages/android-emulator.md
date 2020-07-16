---
title: "Android Emulator"
permalink: /kdb/android/emulator/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content

# Outline

## 1. Build
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






















devdevil@devdevil-System-Product-Name:~/supcorp/wonderland/src/King$ /home/devdevil/Android/Sdk/emulator/emulator -verbose -avd Pixel_2_API_29 -kernel ~/supcorp/wonderland/src/King/kernel/414-150/arch/x86/boot/bzImage -show-kernel -selinux permissive
emulator: Android emulator version 30.0.12.0 (build_id 6466327) (CL:N/A)
emulator: Found AVD name 'Pixel_2_API_29'
emulator: Found AVD target architecture: x86_64
emulator: argv[0]: '/home/devdevil/Android/Sdk/emulator/emulator'; program directory: '/home/devdevil/Android/Sdk/emulator'
emulator:  Found directory: /home/devdevil/Android/Sdk/system-images/android-29/google_apis/x86_64/

emulator: emuDirName: '/home/devdevil/Android/Sdk/emulator'
emulator: try dir /home/devdevil/Android/Sdk/emulator
emulator: Trying emulator path '/home/devdevil/Android/Sdk/emulator/qemu/linux-x86_64/qemu-system-x86_64'
emulator: Found target-specific 64-bit emulator binary: /home/devdevil/Android/Sdk/emulator/qemu/linux-x86_64/qemu-system-x86_64
emulator: Adding library search path: '/home/devdevil/Android/Sdk/emulator/lib64'
emulator: Adding library search path: '/home/devdevil/Android/Sdk/emulator/lib64/gles_angle'
emulator: Adding library search path: '/home/devdevil/Android/Sdk/emulator/lib64/gles_angle9'
emulator: Adding library search path: '/home/devdevil/Android/Sdk/emulator/lib64/gles_angle11'
emulator: Adding library search path: '/home/devdevil/Android/Sdk/emulator/lib64/gles_swiftshader'
emulator: Adding library search path: '/home/devdevil/Android/Sdk/emulator/lib64/libstdc++'
emulator: Adding library search path for Qt: '/home/devdevil/Android/Sdk/emulator/lib64/qt/lib'
emulator: Silencing all qWarning(); use qCWarning(...) instead: QT_LOGGING_RULES=default.warning=false
emulator: Setting Qt plugin search path: QT_QPA_PLATFORM_PLUGIN_PATH=/home/devdevil/Android/Sdk/emulator/lib64/qt/plugins
emulator: Setting Qt to use software OpenGL: QT_OPENGL=software
emulator: Setting QML to use software QtQuick2D: QMLSCENE_DEVICE=softwarecontext
emulator: Overriding pre-existing bad Qt high dpi settings...
emulator: Setting LD_PRELOAD to /home/devdevil/Android/Sdk/emulator/lib64/qt/lib/libfreetype.so.6
emulator: Running :/home/devdevil/Android/Sdk/emulator/qemu/linux-x86_64/qemu-system-x86_64
emulator: qemu backend: argv[00] = "/home/devdevil/Android/Sdk/emulator/qemu/linux-x86_64/qemu-system-x86_64"
emulator: qemu backend: argv[01] = "-verbose"
emulator: qemu backend: argv[02] = "-avd"
emulator: qemu backend: argv[03] = "Pixel_2_API_29"
emulator: qemu backend: argv[04] = "-kernel"
emulator: qemu backend: argv[05] = "/home/devdevil/supcorp/wonderland/src/King/kernel/414-150/arch/x86/boot/bzImage"
emulator: qemu backend: argv[06] = "-show-kernel"
emulator: qemu backend: argv[07] = "-selinux"
emulator: qemu backend: argv[08] = "permissive"
emulator: Concatenated backend parameters:
 /home/devdevil/Android/Sdk/emulator/qemu/linux-x86_64/qemu-system-x86_64 -verbose -avd Pixel_2_API_29 -kernel /home/devdevil/supcorp/wonderland/src/King/kernel/414-150/arch/x86/boot/bzImage -show-kernel -selinux permissive
emulator: autoconfig: -skin pixel_2
emulator: autoconfig: -skindir /home/devdevil/Android/Sdk/skins/
emulator: Target arch = 'x86_64'
emulator: Auto-detect: Kernel image requires new device naming scheme.
emulator: Auto-detect: Kernel does not support YAFFS2 partitions.
emulator: autoconfig: -ramdisk /home/devdevil/Android/Sdk/system-images/android-29/google_apis/x86_64//ramdisk.img
emulator: Using initial system image: /home/devdevil/Android/Sdk/system-images/android-29/google_apis/x86_64//system.img
emulator: Using initial vendor image: /home/devdevil/Android/Sdk/system-images/android-29/google_apis/x86_64//vendor.img
emulator: autoconfig: -data /home/devdevil/.android/avd/Pixel_2_API_29.avd/userdata-qemu.img
emulator: autoconfig: -initdata /home/devdevil/.android/avd/Pixel_2_API_29.avd/userdata.img
emulator: autoconfig: -cache /home/devdevil/.android/avd/Pixel_2_API_29.avd/cache.img
emulator: autoconfig: -sdcard /home/devdevil/.android/avd/Pixel_2_API_29.avd/sdcard.img
emulator: Increasing RAM size to 2048MB
emulator: VM heap size 256MB is below hardware specified minimum of 512MB,setting it to that value
emulator: System image is read only
emulator: Found 1 DNS servers: 127.0.0.53
emulator: VERBOSE: FeatureControlImpl.cpp:172: WARNING: unexpected system image feature string, emulator might not function correctly, please try updating the emulator.

emulator: VERBOSE: FeatureControlImpl.cpp:175: Unexpected feature list:

emulator: VERBOSE: FeatureControlImpl.cpp:177: Vulkan
emulator: VERBOSE: FeatureControlImpl.cpp:179: 

emulator: trying to load skin file '/home/devdevil/Android/Sdk/skins//pixel_2/layout'
emulator: registered 'boot-properties' qemud service
emulator: Adding boot property: 'qemu.cmdline' = 'androidboot.logcat=v:* androidboot.consolepipe=qemu_pipe,pipe:logcat'
emulator: Adding boot property: 'qemu.logcat' = 'start'
emulator: CPU Acceleration: working
emulator: CPU Acceleration status: KVM (version 12) is installed and usable.
emulator: GPU emulation enabled using 'host' mode
emulator: Initializing hardware OpenGLES emulation support
emulator: VERBOSE: MultiDisplay.cpp:308: create display 0
emulator: VERBOSE: MultiDisplay.cpp:398: setDisplayPose 0 x 0 y 0 w 1080 h 1920 dpi 0
emulator: Found 1 DNS servers: 127.0.0.53
Content of hardware configuration file:
  hw.cpu.arch = x86_64
  hw.cpu.ncore = 4
  hw.ramSize = 2048
  hw.screen = multi-touch
  hw.mainKeys = false
  hw.trackBall = false
  hw.keyboard = true
  hw.keyboard.lid = false
  hw.keyboard.charmap = qwerty2
  hw.dPad = false
  hw.rotaryInput = false
  hw.gsmModem = true
  hw.gps = true
  hw.battery = true
  hw.accelerometer = true
  hw.gyroscope = true
  hw.audioInput = true
  hw.audioOutput = true
  hw.sdCard = true
  hw.sdCard.path = /home/devdevil/.android/avd/Pixel_2_API_29.avd/sdcard.img
  disk.cachePartition = true
  disk.cachePartition.path = /home/devdevil/.android/avd/Pixel_2_API_29.avd/cache.img
  disk.cachePartition.size = 66m
  test.quitAfterBootTimeOut = -1
  test.delayAdbTillBootComplete = 0
  test.monitorAdb = 0
  hw.lcd.width = 1080
  hw.lcd.height = 1920
  hw.lcd.depth = 16
  hw.lcd.density = 420
  hw.lcd.backlight = true
  hw.lcd.vsync = 60
  hw.gltransport = pipe
  hw.gltransport.asg.writeBufferSize = 1048576
  hw.gltransport.asg.writeStepSize = 4096
  hw.gltransport.asg.dataRingSize = 32768
  hw.gltransport.drawFlushInterval = 800
  hw.displayRegion.0.1.xOffset = -1
  hw.displayRegion.0.1.yOffset = -1
  hw.displayRegion.0.1.width = 0
  hw.displayRegion.0.1.height = 0
  hw.fold.adjust = false
  hw.display1.width = 0
  hw.display1.height = 0
  hw.display1.density = 0
  hw.display1.xOffset = -1
  hw.display1.yOffset = -1
  hw.display1.flag = 0
  hw.display2.width = 0
  hw.display2.height = 0
  hw.display2.density = 0
  hw.display2.xOffset = -1
  hw.display2.yOffset = -1
  hw.display2.flag = 0
  hw.display3.width = 0
  hw.display3.height = 0
  hw.display3.density = 0
  hw.display3.xOffset = -1
  hw.display3.yOffset = -1
  hw.display3.flag = 0
  hw.gpu.enabled = true
  hw.gpu.mode = host
  hw.initialOrientation = Portrait
  hw.camera.back = virtualscene
  hw.camera.front = emulated
  vm.heapSize = 512
  hw.sensors.light = true
  hw.sensors.pressure = true
  hw.sensors.humidity = true
  hw.sensors.proximity = true
  hw.sensors.magnetic_field = true
  hw.sensors.magnetic_field_uncalibrated = true
  hw.sensors.gyroscope_uncalibrated = true
  hw.sensors.orientation = true
  hw.sensors.temperature = true
  hw.useext4 = true
  hw.arc = false
  hw.arc.autologin = false
  kernel.path = /home/devdevil/supcorp/wonderland/src/King/kernel/414-150/arch/x86/boot/bzImage
  kernel.newDeviceNaming = yes
  kernel.supportsYaffs2 = no
  disk.ramdisk.path = /home/devdevil/Android/Sdk/system-images/android-29/google_apis/x86_64//ramdisk.img
  disk.systemPartition.initPath = /home/devdevil/Android/Sdk/system-images/android-29/google_apis/x86_64//system.img
  disk.systemPartition.size = 3083m
  disk.vendorPartition.initPath = /home/devdevil/Android/Sdk/system-images/android-29/google_apis/x86_64//vendor.img
  disk.vendorPartition.size = 800m
  disk.dataPartition.path = /home/devdevil/.android/avd/Pixel_2_API_29.avd/userdata-qemu.img
  disk.dataPartition.size = 800m
  disk.encryptionKeyPartition.path = /home/devdevil/.android/avd/Pixel_2_API_29.avd/encryptionkey.img
  PlayStore.enabled = false
  avd.name = Pixel_2_API_29
  avd.id = Pixel_2_API_29
  fastboot.forceColdBoot = false
  android.sdk.root = /home/devdevil/Android/Sdk
  android.avd.home = /home/devdevil/.android/avd
.
QEMU options list:
emulator: argv[00] = "/home/devdevil/Android/Sdk/emulator/qemu/linux-x86_64/qemu-system-x86_64"
emulator: argv[01] = "-dns-server"
emulator: argv[02] = "127.0.0.53"
emulator: argv[03] = "-mem-path"
emulator: argv[04] = "/home/devdevil/.android/avd/Pixel_2_API_29.avd/snapshots/default_boot/ram.img"
emulator: argv[05] = "-mem-file-shared"
emulator: argv[06] = "-serial"
emulator: argv[07] = "stdio"
emulator: argv[08] = "-device"
emulator: argv[09] = "goldfish_pstore,addr=0xff018000,size=0x10000,file=/home/devdevil/.android/avd/Pixel_2_API_29.avd/data/misc/pstore/pstore.bin"
emulator: argv[10] = "-cpu"
emulator: argv[11] = "android64"
emulator: argv[12] = "-enable-kvm"
emulator: argv[13] = "-smp"
emulator: argv[14] = "cores=4"
emulator: argv[15] = "-m"
emulator: argv[16] = "2048"
emulator: argv[17] = "-lcd-density"
emulator: argv[18] = "420"
emulator: argv[19] = "-object"
emulator: argv[20] = "iothread,id=disk-iothread"
emulator: argv[21] = "-nodefaults"
emulator: argv[22] = "-kernel"
emulator: argv[23] = "/home/devdevil/supcorp/wonderland/src/King/kernel/414-150/arch/x86/boot/bzImage"
emulator: argv[24] = "-initrd"
emulator: argv[25] = "/home/devdevil/Android/Sdk/system-images/android-29/google_apis/x86_64//ramdisk.img"
emulator: argv[26] = "-drive"
emulator: argv[27] = "if=none,index=0,id=system,if=none,file=/home/devdevil/Android/Sdk/system-images/android-29/google_apis/x86_64//system.img,read-only"
emulator: argv[28] = "-device"
emulator: argv[29] = "virtio-blk-pci,drive=system,iothread=disk-iothread,modern-pio-notify"
emulator: argv[30] = "-drive"
emulator: argv[31] = "if=none,index=1,id=cache,if=none,file=/home/devdevil/.android/avd/Pixel_2_API_29.avd/cache.img.qcow2,overlap-check=none,cache=unsafe,l2-cache-size=1048576"
emulator: argv[32] = "-device"
emulator: argv[33] = "virtio-blk-pci,drive=cache,iothread=disk-iothread,modern-pio-notify"
emulator: argv[34] = "-drive"
emulator: argv[35] = "if=none,index=2,id=userdata,if=none,file=/home/devdevil/.android/avd/Pixel_2_API_29.avd/userdata-qemu.img.qcow2,overlap-check=none,cache=unsafe,l2-cache-size=1048576"
emulator: argv[36] = "-device"
emulator: argv[37] = "virtio-blk-pci,drive=userdata,iothread=disk-iothread,modern-pio-notify"
emulator: argv[38] = "-drive"
emulator: argv[39] = "if=none,index=3,id=encrypt,if=none,file=/home/devdevil/.android/avd/Pixel_2_API_29.avd/encryptionkey.img.qcow2,overlap-check=none,cache=unsafe,l2-cache-size=1048576"
emulator: argv[40] = "-device"
emulator: argv[41] = "virtio-blk-pci,drive=encrypt,iothread=disk-iothread,modern-pio-notify"
emulator: argv[42] = "-drive"
emulator: argv[43] = "if=none,index=4,id=vendor,if=none,file=/home/devdevil/Android/Sdk/system-images/android-29/google_apis/x86_64//vendor.img,read-only"
emulator: argv[44] = "-device"
emulator: argv[45] = "virtio-blk-pci,drive=vendor,iothread=disk-iothread,modern-pio-notify"
emulator: argv[46] = "-drive"
emulator: argv[47] = "if=none,index=5,id=sdcard,if=none,file=/home/devdevil/.android/avd/Pixel_2_API_29.avd/sdcard.img.qcow2,overlap-check=none,cache=unsafe,l2-cache-size=1048576"
emulator: argv[48] = "-device"
emulator: argv[49] = "virtio-blk-pci,drive=sdcard,iothread=disk-iothread,modern-pio-notify"
emulator: argv[50] = "-netdev"
emulator: argv[51] = "user,id=mynet"
emulator: argv[52] = "-device"
emulator: argv[53] = "virtio-net-pci,netdev=mynet"
emulator: argv[54] = "-device"
emulator: argv[55] = "virtio-rng-pci"
emulator: argv[56] = "-show-cursor"
emulator: argv[57] = "-device"
emulator: argv[58] = "virtio_input_multi_touch_pci_1"
emulator: argv[59] = "-device"
emulator: argv[60] = "virtio_input_multi_touch_pci_2"
emulator: argv[61] = "-device"
emulator: argv[62] = "virtio_input_multi_touch_pci_3"
emulator: argv[63] = "-device"
emulator: argv[64] = "virtio_input_multi_touch_pci_4"
emulator: argv[65] = "-device"
emulator: argv[66] = "virtio_input_multi_touch_pci_5"
emulator: argv[67] = "-device"
emulator: argv[68] = "virtio_input_multi_touch_pci_6"
emulator: argv[69] = "-device"
emulator: argv[70] = "virtio_input_multi_touch_pci_7"
emulator: argv[71] = "-device"
emulator: argv[72] = "virtio_input_multi_touch_pci_8"
emulator: argv[73] = "-device"
emulator: argv[74] = "virtio_input_multi_touch_pci_9"
emulator: argv[75] = "-device"
emulator: argv[76] = "virtio_input_multi_touch_pci_10"
emulator: argv[77] = "-device"
emulator: argv[78] = "virtio_input_multi_touch_pci_11"
emulator: argv[79] = "-device"
emulator: argv[80] = "virtio-keyboard-pci"
emulator: argv[81] = "-L"
emulator: argv[82] = "/home/devdevil/Android/Sdk/emulator/lib/pc-bios"
emulator: argv[83] = "-soundhw"
emulator: argv[84] = "hda"
emulator: argv[85] = "-vga"
emulator: argv[86] = "none"
emulator: argv[87] = "-append"
emulator: argv[88] = "qemu=1 no_timer_check androidboot.hardware=ranchu androidboot.serialno=EMULATOR30X0X12X0 clocksource=pit no-kvmclock console=ttyS0,38400 android.qemud=1 android.checkjni=1 qemu.gles=1 qemu.settings.system.screen_off_timeout=2147483647 qemu.encrypt=1 qemu.vsync=60 qemu.gltransport=pipe qemu.gltransport.drawFlushInterval=800 qemu.opengles.version=131072 cma=288M@0-4G androidboot.selinux=permissive qemu.wifi=1 mac80211_hwsim.channels=2 loop.max_part=7 androidboot.vbmeta.size=4352 androidboot.vbmeta.hash_alg=sha256 androidboot.vbmeta.digest=9af534b972512e0650fc06dcd3a619d51520b67dc509067c1b9ab0d6227b010e androidboot.boot_devices=pci0000:00/0000:00:03.0 ramoops.mem_address=0xff018000 ramoops.mem_size=0x10000 memmap=0x10000$0xff018000 qemu.dalvik.vm.heapsize=512m"
emulator: argv[89] = "-android-hw"
emulator: argv[90] = "/home/devdevil/.android/avd/Pixel_2_API_29.avd/hardware-qemu.ini"
Concatenated QEMU options:
 /home/devdevil/Android/Sdk/emulator/qemu/linux-x86_64/qemu-system-x86_64 -dns-server 127.0.0.53 -mem-path /home/devdevil/.android/avd/Pixel_2_API_29.avd/snapshots/default_boot/ram.img -mem-file-shared -serial stdio -device goldfish_pstore,addr=0xff018000,size=0x10000,file=/home/devdevil/.android/avd/Pixel_2_API_29.avd/data/misc/pstore/pstore.bin -cpu android64 -enable-kvm -smp cores=4 -m 2048 -lcd-density 420 -object iothread,id=disk-iothread -nodefaults -kernel /home/devdevil/supcorp/wonderland/src/King/kernel/414-150/arch/x86/boot/bzImage -initrd /home/devdevil/Android/Sdk/system-images/android-29/google_apis/x86_64//ramdisk.img -drive if=none,index=0,id=system,if=none,file=/home/devdevil/Android/Sdk/system-images/android-29/google_apis/x86_64//system.img,read-only -device virtio-blk-pci,drive=system,iothread=disk-iothread,modern-pio-notify -drive if=none,index=1,id=cache,if=none,file=/home/devdevil/.android/avd/Pixel_2_API_29.avd/cache.img.qcow2,overlap-check=none,cache=unsafe,l2-cache-size=1048576 -device virtio-blk-pci,drive=cache,iothread=disk-iothread,modern-pio-notify -drive if=none,index=2,id=userdata,if=none,file=/home/devdevil/.android/avd/Pixel_2_API_29.avd/userdata-qemu.img.qcow2,overlap-check=none,cache=unsafe,l2-cache-size=1048576 -device virtio-blk-pci,drive=userdata,iothread=disk-iothread,modern-pio-notify -drive if=none,index=3,id=encrypt,if=none,file=/home/devdevil/.android/avd/Pixel_2_API_29.avd/encryptionkey.img.qcow2,overlap-check=none,cache=unsafe,l2-cache-size=1048576 -device virtio-blk-pci,drive=encrypt,iothread=disk-iothread,modern-pio-notify -drive if=none,index=4,id=vendor,if=none,file=/home/devdevil/Android/Sdk/system-images/android-29/google_apis/x86_64//vendor.img,read-only -device virtio-blk-pci,drive=vendor,iothread=disk-iothread,modern-pio-notify -drive if=none,index=5,id=sdcard,if=none,file=/home/devdevil/.android/avd/Pixel_2_API_29.avd/sdcard.img.qcow2,overlap-check=none,cache=unsafe,l2-cache-size=1048576 -device virtio-blk-pci,drive=sdcard,iothread=disk-iothread,modern-pio-notify -netdev user,id=mynet -device virtio-net-pci,netdev=mynet -device virtio-rng-pci -show-cursor -device virtio_input_multi_touch_pci_1 -device virtio_input_multi_touch_pci_2 -device virtio_input_multi_touch_pci_3 -device virtio_input_multi_touch_pci_4 -device virtio_input_multi_touch_pci_5 -device virtio_input_multi_touch_pci_6 -device virtio_input_multi_touch_pci_7 -device virtio_input_multi_touch_pci_8 -device virtio_input_multi_touch_pci_9 -device virtio_input_multi_touch_pci_10 -device virtio_input_multi_touch_pci_11 -device virtio-keyboard-pci -L /home/devdevil/Android/Sdk/emulator/lib/pc-bios -soundhw hda -vga none -append 'qemu=1 no_timer_check androidboot.hardware=ranchu androidboot.serialno=EMULATOR30X0X12X0 clocksource=pit no-kvmclock console=ttyS0,38400 android.qemud=1 android.checkjni=1 qemu.gles=1 qemu.settings.system.screen_off_timeout=2147483647 qemu.encrypt=1 qemu.vsync=60 qemu.gltransport=pipe qemu.gltransport.drawFlushInterval=800 qemu.opengles.version=131072 cma=288M@0-4G androidboot.selinux=permissive qemu.wifi=1 mac80211_hwsim.channels=2 loop.max_part=7 androidboot.vbmeta.size=4352 androidboot.vbmeta.hash_alg=sha256 androidboot.vbmeta.digest=9af534b972512e0650fc06dcd3a619d51520b67dc509067c1b9ab0d6227b010e androidboot.boot_devices=pci0000:00/0000:00:03.0 ramoops.mem_address=0xff018000 ramoops.mem_size=0x10000 memmap=0x10000$0xff018000 qemu.dalvik.vm.heapsize=512m' -android-hw /home/devdevil/.android/avd/Pixel_2_API_29.avd/hardware-qemu.ini
emulator: Android qemu version 30.0.12.0 (build_id 6466327) (CL:N/A)

emulator: Starting QEMU main loop
emulator: Adding boot property: 'ro.opengles.version' = '131072'
emulator: Adding boot property: 'qemu.sf.fake_camera' = 'front'
emulator: Adding boot property: 'dalvik.vm.heapsize' = '512m'
emulator: Adding boot property: 'qemu.hw.mainkeys' = '0'
emulator: Adding boot property: 'qemu.sf.lcd_density' = '420'
emulator: goldfish_events.have-dpad: false
emulator: goldfish_events.have-trackball: false
emulator: goldfish_events.have-camera: true
emulator: goldfish_events.have-keyboard: false
emulator: goldfish_events.have-lidswitch: false
emulator: goldfish_events.have-tabletmode: false
emulator: goldfish_events.have-touch: false
emulator: goldfish_events.have-multitouch: false
emulator: control console listening on port 5556, ADB on port 5557
Not using any http proxy
emulator: Adding boot property: 'qemu.timezone' = 'Asia/Seoul'
emulator: android_hw_fingerprint_init: fingerprint qemud listen service initialized

E0709 21:21:38.633580841   10661 socket_utils_common_posix.cc:201] check for SO_REUSEPORT: {"created":"@1594297298.633565001","description":"SO_REUSEPORT unavailable on compiling system","file":"/mnt/tmpfs/src/android/emu-master-dev/external/grpc/src/core/lib/iomgr/socket_utils_common_posix.cc","file_line":169}
emulator: VERBOSE: GrpcServices.cpp:267: Started GRPC server at 127.0.0.1:8556, security: Local
emulator: emulator_window_fb_rotate

emulator: VERBOSE: MultiDisplay.cpp:687: config multidisplay with config.ini 0x0 0x0 0x0
emulator: No acpi ini file provided, using default

emulator: Adding boot property: 'qemu.cmdline' = 'androidboot.logcat=v:* androidboot.consolepipe=qemu_pipe,pipe:logcat'
emulator: Adding boot property: 'qemu.logcat' = 'start'
emulator: Adding boot property: 'ro.opengles.version' = '131072'
emulator: Adding boot property: 'qemu.sf.fake_camera' = 'front'
emulator: Adding boot property: 'dalvik.vm.heapsize' = '512m'
emulator: Adding boot property: 'qemu.hw.mainkeys' = '0'
emulator: Adding boot property: 'qemu.sf.lcd_density' = '420'
emulator: Adding boot property: 'qemu.timezone' = 'Asia/Seoul'
emulator: VERBOSE: AdbInterface.cpp:355:  no root specified: 
emulator: VERBOSE: AdbInterface.cpp:385: Found: 2 adb executables
emulator: VERBOSE: AdbInterface.cpp:387: Adb: /home/devdevil/Android/Sdk/platform-tools/adb
emulator: VERBOSE: AdbInterface.cpp:387: Adb: /usr/bin/adb
emulator: VERBOSE: AdbInterface.cpp:408: Path:/home/devdevil/Android/Sdk/platform-tools/adb protocol version: 41
emulator: VERBOSE: AdbInterface.cpp:408: Path:/usr/bin/adb protocol version: 39
Your emulator is out of date, please update by launching Android Studio:
 - Start Android Studio
 - Select menu "Tools > Android > SDK Manager"
 - Click "SDK Tools" tab
 - Check "Android Emulator" checkbox
 - Click "OK"

emulator: _hwFingerprint_connect: connect finger print listen is called

emulator: VERBOSE: AndroidAsyncMessagePipe.cpp:26: Registering pipe service multidisplay
emulator: VERBOSE: MultiDisplayPipe.cpp:33: MultiDisplayPipe created 0x8c94c40
text=u:object_r:default_prop:s0 tclass=file permissive=0
emulator: onGuestSendCommand: [0x8a57380] Adb connected, start proxing data
[ 3517.761718] type=1400 audit(1594278692.756:203): avc: denied { write } for comm="RenderThread" name="property_service" dev="tmpfs" ino=7388 scontext=u:r:priv_app:s0:c512,c768 tcontext=u:object_r:property_socket:s0 tclass=sock_file permissive=0 app=com.google.android.permissioncontroller
[ 3518.907664] init: Untracked pid 10514 exited with status 255
[ 3519.871602] init: Untracked pid 10506 received signal 1


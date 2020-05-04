---
title: "How to build linux kernel"
permalink: /kdb/linux/build/
toc_sticky: true
toc_ads : true
layout: single
---

1. Prepare
<pre>
$ sudo apt-get install libncurses5 libncurses5-dev libssl-dev make gcc
$ sudo apt-get install libelf-dev
</pre>

2. Download source
## android kernel   
[android kernel list](https://android.googlesource.com/kernel/)    
여기에 goldfish, samsung, hikey-linaro, exynos등등이 전부 있다.   
여기에 android-msm 이게 가장 많이 쓰이는(50%정도) 퀄컴 것이다.    
Android emulator를 위해서는 goldfish 커널을 사용해야 한다.   
[goldfish](https://android.googlesource.com/kernel/goldfish/+refs)      
<pre>
$ git clone https://android.googlesource.com/kernel/goldfish -b android-4.14
'goldfish'에 복제합니다...   
remote: Sending approximately 1.52 GiB ...
remote: Counting objects: 781, done
</pre>
## linux kernel
[tags](https://github.com/torvalds/linux/tags)    
에서 rc postfix가 붙은 안정화 버전 중 선택한다.    
선택한 tag name으로 clone한다.   
<pre>
$ git clone -b v5.6-rc3 https://github.com/torvalds/linux.git
</pre>

3. Toolchain download (android case)
x86_64용    
<pre>
$ git clone https://android.googlesource.com/platform/prebuilts/gcc/linux-x86/x86/x86_64-linux-android-4.9
$ git checkout android10-s3-release
$ export PATH=/home/devdevil/tool/x86_64-linux-android-4.9/bin:$PATH
$ export ARCH=x86_64
$ export CROSS_COMPILE=x86_64-linux-android-
</pre>
aarch64용
<pre>
$git clone https://android.googlesource.com/platform/prebuilts/gcc/linux-x86/aarch64/aarch64-linux-android-4.9
$ git checkout android-vts-10.0_r3
다음 directory에 설치됨.
~/tool/aarch64-linux-android-4.9
$ export PATH=~/tool/aarch64-linux-android-4.9/bin:$PATH
$ export ARCH=arm64
$ export CROSS_COMPILE=aarch64-linux-android-
</pre>

4. Make .config
emulator를 위한 x86_64의 경우   
<pre>
arch/x86/config에서 적당한 defconfig을 확인한다.
$ make x86_64_ranchu_defconfig
추가설정이 필요한 경우 수동으로 추가한다.
$ make menuconfig
Qemu kernel debug를 활성화 시키기 위해서, 
Kernel Hacking에서 다음과 같이 설정
“Compile-time checks and compiler options”-”Provide GDB scripts for
kernel debugging”
“KGDB: kernel debugger” -> On
“Dump the EFI pagetable” -> On
“Enable loadable module support“ -> On
</pre>
aarch64부터    
<pre>
arch/arm64/config에서 적당한 defcofig을 확인한다.
(하나뿐임)
$ make defconfig
추가설정이 필요한 경우 수동으로 추가한다.
$ make menuconfig
</pre>

5. Build
<pre>
make -j16
</pre>
이후에 숫자는 Hyperthreading이 반영된 hardware thread 개수(core x 2)를 지정하면 된다.    

6. Post works
android emulator의 경우    
<pre>
export LD_LIBRARY_PATH=~/Android/Sdk/emulator/lib64:~/Android/Sdk/emulator/lib64/qt/lib
./qemu-system-x86_64 -avd target1 -kernel /media/devdevil/kernel/goldfish/arch/x86/boot/bzImage
qemu: could not load PC BIOS 'bios-256k.bin'
</pre>

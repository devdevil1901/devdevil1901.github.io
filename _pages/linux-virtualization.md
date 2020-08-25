---
title: "Virtualization"
permalink: /kdb/linux/vm/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content
* [Outline](#outline)  
* [Type](#type)   
* [KVM(Kernel based Virtual Machine)](#kvmkernel-based-virtual-machine)   
* [CPU](#cpu)   
* [QEMU](#qemu)   
	* [Sparse](#sparse)    
* [Cuttlefish]($cuttlefish)    

# Outline 
이전 보안팀에 있을 때, Host OS Type Virtualization 솔루션에 대한 모의해킹을 한적이 있었는데,   
driver를 올려서 가상화 환경에서 Host의 OS에 접근할 수 있었다.   
또 guest os에 내려준 보안 정책을 역공학으로 분석해서 변경하는 방식으로 보안 정책을 우회할 수 있는,   
취약점도 발견했었다.   
잘못된 설계와 보안의 고려가 되지 않았었기 때문이다.      

linux의 가상화를 이해하기 위해서는 가상화 자체에 대한 이해가 선행되어야 하기 때문에,  
먼저 가상화 전반을 살펴보도록 한다.   

가상화는  cpu, memory, harddisk등과 같은 Hardware Resource를 가상으로 제공하는 기술이다.  
역사적으로는 2001년 vmware가 첫 상용 제품을 출시하였고, 2003년 citrix의 Xen이 출시되었다.   

# Type
가상화를 하는 목적에 따라 다음의 분류가 가능하다.   
1. Hardware resource를 공유해서, resource의 성능을 향상 시킴.   
서버를 클라우드로 구축하는 것이 바로 이 이유이다.   
즉 서버 가상화.    
대 부분의 서버가 10~15% 정도의 용량을 사용하기 때문에 가상화를 통해 70& 정도 까지 사용을 끌어올려서,    
자원을 효율적으로 쓰고자하는 것.    

2. Hardware device를 emulation.   
Android의 AVD가 여기에 해당.   
해당 device가 없는데 이용하고자 하는 경우에 사용한다.   
엄밀히 말하면 가상화가 아니고, emulation.    
 
가상화 방식에 따라 Host OS Type과 Hypervisor type으로 분류한다.   

1. Host OS Type   
Hardware위에 OS를 설치하고, type 2 hypervisor가 올라가는 방식이다.   
Type2 Hypervivor위에 Guest OS를 올려서 이것이 가상화로 동작한다.   
```
++++++++++++++++++++++++++++++++++  
|             |   Applicatoin    |  
|             |   Guest OS       |  
| Application |  Type2 Hypervisor|  
++++++++++++++++++++++++++++++++++  
| OS                             |  
++++++++++++++++++++++++++++++++++  
| Hardware                       |  
++++++++++++++++++++++++++++++++++   
```
즉 Hypervisor는 Host OS의 것들을 이용하게 된다.   
vmware workstation, microsoft virtual pc, virtual box가 이런 방식이다.        
하드웨어를 emulatoin하기 때문에 오버헤드가 발생한다    

2. HyperVisor Type
bare metal hypervisor난 native를 이용하는 가상화.   
```
++++++++++++++++++++++++++++++++++  
| Application |   Applicatoin    |  
| Guest OS    |   GUest OS       |  
++++++++++++++++++++++++++++++++++  
| Type1 Hypervisor               |  
++++++++++++++++++++++++++++++++++  
| Hardware                       |  
++++++++++++++++++++++++++++++++++   
```
Host OS가 아니라, Hypervisor를 통해서, guest os가 hardware resource에 접근하도록 하는 방식이다.  
Hypervisor가 hardware에 대한 접근을 처리해 준다.  
즉 이 녀석은 각각의 Guest OS가 개별적인 시스템 처럼 동작하게된다.   
최신 가상화 기술들은 전부 이것이다.   
Vmware ESXi, Xen/Citrix XenServer, Microsoft Hyper-V등이 여기에 속한다.   
vm(guest os)들을 control하고, hardware접근을 위한 관리자로서, 이  hypervisor의 위치 및 역활에 따라서 Type1과 Type2로 나뉘게 된다.   
Type1은 host os없이, hardware resource위에 hypervisor가 있는 구조이고,   
Type2는 host os위에 hypervisor가 있는 구조이다.   

3. Container  
Guest OS를 올리는 것이 아니라, software를 가상 환경에서 실행하게 해 준다.   
hypervisor(가상화 레이어) 없이, llibraries를 chroot 처럼 가상화 시키는 것 처럼 하는 방식.   
최근 급격히 널리 퍼지고 있다.   
Docker, Linx VServer, OpenVZ, LXC, Oracle Solaris Zones등이 있다.    

4. VDI(Virtual Desktop Infrastructure)   
network 로 data center의 가상 pc에 접근해서 사용하는 방식이다.   

Hardware resource에 대한 접근을 어디서 처리하느냐에 따라서 또 다음과 같이 분류된다.  
보통 Hypervisor Type1에 대해서 이렇게 분류한다.   

1. Full-Virtualization   
**Guest OS는 Hypervisor os를 통해서, hardware와 통신을 하게 된다.**   
여기서 Full이 쓰인 이유는 hardware를 full로 가상화 한다는 의미이다.   
Guest OS에서 add라는 instruction을 실행했다면, hypervisor에서 architecture에 맞게 add를 해석해서, cpu라는 hardware에 전달해 주는 방식이다.    
Guest OS의 수정이 필요없지만, 성능이 Para방식에 비하면 떨어진다.   
이유는 전체 instruction과 trap처리도 hypervisor가 해줘야 한다.   
Xen과 **KVM**은 **QEMU**를 사용해서 전 가상화를 지원하고 있다.   

2. Para-Virtualization   
Guest OS가 직접 hardware와 통신을하게 된다. 때문에 hypervisor는 자원 배분등의 문제에만 관여하게 된다.   
Guest Os가 직접  hardware와 통신을 하기 위해서, os를 수정해서, guest os를 만들어야 한다 그래서 source 수정이 가능한 linux가 먼저 도입되었고,   
현재는 xen이 나오면서 windows도 xen에서 나오는 툴로 가능하게 되었다.   
Hyper call이 있어서, 직접 hypervisor에게 요청을 하는 방식이다.(전체가 아니라)   


# KVM(Kernel based Virtual Machine)  
Linux에 포함되어 있다.    
Hypervisor Type2와 Type1의 특성을 동시에 가지고 있다.   
Host OS가 hypervior역활을 하기 때문이다.   

Qemu의 경우 qemu-kvm이 있어서, qemu가 android device를 emulation 해주고, hypervisor역활을 kvm이 해주는 것이다.   
emulator의 -accel on(off, auto)로  활성화 시킬 수 있다.   
(https://developer.android.com/studio/run/emulator-commandline?hl=ko)    

linux에서 svm이 enable 되었는지 확인하려면,   
```
$ kvm-ok
```
만약 실패했고, cpu가 AMD라면 UEFI/BIOS에서 SVM을 enable 시켜줘야 한다. 
그리고 /dev/kvm에 권한도 부여해 줘야 한다.   

# CPU  
Intel은 HAXM(Hardware Accelerated Execution Manager),   
AMD는 SVM or VT-x,     

Android의 emulator AVD는  MAC이나 Windows에서는 Hypervisor framework로 가상화를 시도하고, 이것을 사용할 수 없다면, HAXM을 이용한다.   
PC가 AMD라면, android studio의 AVD는 동작이 안될 것이다.   
AMD는 VT-x나 SVM은 지원하지 않는다.   
Linux라면 KVM을 이용해서 괜찮은데,   
Windows라면 Hyper-V를 이용해야 한다.    

Hyper-V를 활성화 시키고, Visual Studio의 community를 설치하고, android sdk와 emulator, Xamarin을 설치하면 잘동작한다.   

# QEMU
Dynamic translation을 통해서 Host os의 kernel driver없이 실행이 가능하며, FPU는 software적으로 emulation한다.   
Full emulation 방식과 user mode emulation 방식으로 사용이 가능하다.   
Android emulator에서 사용하는 방식은  full emulation(system emulation이라고도) 방식이다.   
이 방식에서 MMU를 software적으로 emulation 한다.   
Optional하게 kvm과 같은 in-kernel accelerator를 쓸수있다.     
SMP를 지원하는데 지금은 하나이상의 cpu를 쓰려면, in-kernel accelerator를 써야한다.   
-kvm flag를 사용하는 in-kernel accelerator는 host os와 guest os가 동일한 architecture인 경우 vm을 가속할 수 있다   

## Sparse
QEMU의 file system format이다.   
QEMU의 raw imge는 sparse type과 non-sparse type이 존재한다.   
sparse에서는 빈 공간을 header를 포함하여 압축하는 방식이다. 즉 header에는 0x00이 얼마나 있는지가 포함되어 있다.    
[tool](https://github.com/anestisb/android-simg2img)을 이용해서, sparse raw를 non sparse raw로 변환할 수 있다.   
다음과 같이 qemu-img command를 이용할 수도 있다.   
```
qemu-img convert -O raw system.img system.img.raw
devdevil@devdevil-System-Product-Name:~/fixImage$ ls -l
합계 5379872
-rw-r--r-- 1 devdevil devdevil 2796552192  2월  4 17:48 system.img
-rw-r--r-- 1 devdevil devdevil 2796552192  2월  5 11:05 system.img.raw
drwxr-xr-x 2 devdevil devdevil       4096  2월  4 20:28 system_img
```

# Cuttlefish  
다음 살펴 봐야 한다.   
https://github.com/google/android-cuttlefish
https://www.linuxplumbersconf.org/event/2/contributions/269/attachments/56/63/Kernel_Hacking_with_Cuttlefish.pdf
https://ci.android.com/builds/branches/aosp-master/grid?

Best guide
https://sites.google.com/junsun.net/how-to-run-cuttlefish
https://android.googlesource.com/device/google/cuttlefish/


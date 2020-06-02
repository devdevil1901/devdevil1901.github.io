---
title: "BIOS/UEFI"
permalink: /kdb/arch/bios_uefi/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content
1. [BIOS](#bios)   
2. [POST](#post)   
3. [UEFI(Unified Extensible Firmware Interface)](#uefiunified-extensible-firmware-interface)    
	1. [Design](#1-design)     
		1. [UEFI Service](#11-uefi-service)   
		2. [Driver Model](#12-driver-model)   
		3. [UEFI Application](#13-uefi-application)   
		4. [on aarch64](#14-on-aarch64)   
		5. [EFI System Table](#15-efi-system-table)   
		6. [Protocol](#16-protocol)   
	2. [Boot Sequence](#2-boot-sequence)   
		1. [Direct 방식](#21-direct-%EB%B0%A9%EC%8B%9D)   
		2. [Bootloader 이용하는 방식](#22-bootloader-%EC%9D%B4%EC%9A%A9%ED%95%98%EB%8A%94-%EB%B0%A9%EC%8B%9D)   
	3. [GPT](#3gpt)   
	4. [ESP(EFI System Partition)](#4-espefi-system-partition)   
	5. [Secure Boot](#5-secure-boot)   

# BIOS
mainboard의 EEPROM(Electrically Erasable Programmable ROM)이나 flash memory같은 비휘발성 메모리에 존재하는 software, 즉 일종의 firmware이다.   
좁은 의미로는 legacy mainboard firmware라고 볼 수 있고, 크게는 mainboard firmware라고 볼 수 있다.   
최근에 사용되는 UEFI의 경우는 BIOS/UEFI로도 표기한다.   
전원이 들어오면, 가장 먼저 실행하는 코드가 바로 BIOS로서 다음의 역활을 수행한다.   

* Boot option이나 system 설정 값 저장 및 변경등의 관리   
* POST(power-on self Test) 수행   
* hardware관련 초기화 작업을 수행한다.    
* booting    

Real mode에서 동작하는 이 bios interrupt의 handler는 4 byte에 담겨있다.   
이 bios interrupt call의 최대 개수는 256개이다.   
OS의 bootloader는 이것을 이용해서, firmware를 이용한다.   
<pre>
arch/x86/boot/tty.c   
intcall(0x10, &ireg, NULL);   
video-vga.c:    
intcall(0x10, &ireg, &oreg);   
arch/x86/boot/bioscall.S    
.type intcall, @function intcall: .. /* Actual INT */    
.byte 0xcd /* INT opcode */    
.byte 0
</pre>

대표적인 것들은 다음과 같다.
|||
|---|---|
|int 0x00|Devide by zero|
|int 0x01|Single step for debugging|
|int 0x02|NMI(Non-Maskable Interrupt)|
|int 0x11|device list를 반환|
|int 0x12|memory 크기를 반환|
|int 0x13|Disk I/O service|

# POST
쉽게 말해서, PC 부팅하면서 삐소리 내는 부분이다.   
주로 Hardware가 정상인지 검사하는 부분.  
Hardware에서 문제 있다면, Fatal Error를 software에서 문제가 있다면, Non Fatal Error를 발생시킬 수 있다.   

POST 작업의 책임은 다음과 같다.   

* Verify CPU registers.    
* Verify the integrity of the BIOS code itself.    
* Verify some basic components like DMA, timer, interrupt controller.   
* Find, size, and verify system main memory.    
* Initialize BIOS
* Identify, organize, and select which devices are available for booting.

POST 작업 후에 삐 소리가 나면서, 결과를 나타낸다.   

짧은 신호음이 울리면 POST 작업 성공을 의미,   
짧은 신호음이 2개일때는 오류를 나타낸다.   

# UEFI(Unified Extensible Firmware Interface)
EFI(Extensible Firmware Interface)는 BIOS와 같은 legacy firmware design on mainboard을 대체하기 위해 나온 firmware specification.   
BIOS에서 CMOS 설정이라던가, real mode 부터 시작하는 제약등 별 발전없이, 너무 오래 사용되었기 때문이다.    
결국은 bootloader와 OS가 boot process에서 사용할 수 있는 기능의 표준 정도가 되겠다.   
최근 PC는 전부 UEFI를 사용한다고 보면된다.   
하지만 UEFI를 통해서 default는 CSM모드로 BIOS와 유사하게 동작하는 것이 default인 경우도 많다.   
Intel에서 EFI를 만들었는데, UEFI는 EFI를 가지고 OS 마다 필요한 EFI 규격이 다르기 때문에 이를 통합한 규격으로 만든 것이다.   
UEFI standard는 UEFI Forum에 의해 유지된다.   
**Windows**, **MAC**, **Linux** 모두에서 쓰이고 있으며,  
EDK(EFI Dev Kit)을 제공하고 있다.       
[EDK on linux](https://sourceforge.net/projects/efidevkit/files/latest/download)   

※ Specification은 다음에서 확인할 수 있다.   
https://uefi.org/sites/default/files/resources/UEFI_Spec_2_8_A_Feb14.pdf   

## 1. Design
구성을 살펴보자.    
* 기존 BIOS에서 사용되던 table-based interface 형식을 재사용하고 있다.   
* System partition을 사용한다.   
System Partition에는 **UEFI Application**이 위치한다.   
**OS LOADER**도 UEFI application의 일종으로 windows bootmanager 같은 것들이다.   
* Boot Service를 제공한다. Handle과  protocol을 통해서 추상화 시켜서,    
기존 BIOS에서 사용하던 코드들을 최대한 재사용할 수 있도록 한다.   
* OS의 Hardware 부분의 구현을 추상화하는,  Runtime service를 제공한다.   
* **driver model**을 통해서, PCI, USB등의 bus driver와 device driver를 구현하기 위한 mechanism을 제공한다.   

기본적으로 booting은 firmware가 System partition에서 os loader image를 검색해서,   
이루어지지만, disk, cd-rom, dvd, network를 통한 원격 부팅도 지원한다.   

**UEFI Application과 UEFI Driver들이 Runtime service와 Boot service를 이용할 수 있도록 해서,   
Booting을 지원하는 것이 바로 UEFI system인 것이다.**    

UEFI에서는 efi driver와 efi application을 load하는 firmware를 bootmanager라고 지칭하고 있다.    
bootmanager는 PE32+ 파일인 EFI Image(efi driver들과 efi application들)을 로드한후, efi os loader를 로드 한다.        
UEFI에서는 NVRAM 변수를 정의 한다.   
NVRAM은 UEFI application에 전달되는 data나,   
booting 선택 menu에 표시될 수 있는 humanreadable한  string도 포함되어 있다.    

이것을 이용하면, 기존의 firmware booting menu와 os booting menu를 통합할 수 있다.    
이것을 platform firmware menue라고 부른다.   
여기서 OS LOADER를 선택할 수 있게 하는 것이다.    

사실 UEFI가 이정도 까지 앞서 있는데 OS 지원에서는 이런 부분들까지 적용되지는 못한 모습인 것.    
UEFI는 다음의 장점을 제공한다.   

1. real mode를 사용하지 않음.   
   BIOS는 real mode에서 시작하기 때문에, 16bit에 1M의 memory 공간 밖에 없는 제약에서 부터 boot를 시작했다.   
   지금은 UEFI firmware에서 32bit protected mode를 enable 시키고, GPT dsik의 ESP(EFI System Partition)을 로드한다. (/boot/efi)   

2. GUI 개선.   
   firmware 설정을 위해 기존 CMOS와 최근의 마우스를 쓸수 있는 화려한 UI는 큰 차이가 난다.   

3. 6MBR 방식은 2TB의 Harddisk만을 지원하나, GPT 방식으로 partition설치 하여 그 이상의 용량도 지원.   
4. Secure Boot 기능으로, digital signature가 있는 것만 load. (기존의 mbr 건드리는 rootkit들 차단가능)   

### 1.1 UEFI Service
위에서 기술한 바와 같이, 추상화를 통해서,   
platform dependent한 부분을 제공하는 것이 목적이다.    
Runtime Service와 Boot Service가 제공된다.   
Boot Service는    
* Global boot service interface  
* Device handle-based boot service interface  
* Device Protocols  
* Protocol service  
로 구성되어 있다.   

Runtime Service는 booting 과정에서 flat physical addressing(segmentation)mode 에서 동작하며,    
OS는 가상메모리를 사용하기 때문에 SetVirtualAddressMap() service를 이용해야 한다.
 
Runtime Service는 모두 non-block이며,  
interrupt를 비활성화 한 상태로 호출할수 있다.   
이것을 외우는 것은 의미가 없는 것 같고 대략 이런 기능들을 제공하는 구나 하는 정도로만 보고 넘어가자.   

|Runtime Service API|description|
|---|---|
|GetTime()|현재 시간을 구한다.|
|SetTime()|현재 시간을 설정한다.|
|GetWakeupTime()||
|SetWakeupTime()||
|GetVariable()|named 변수의 값을 구한다.|
|GetNextVariableName()|변수이름을 enumerates한다.|
|SetVirtualAddressMap()|모든 runtime function들을 physical에서 가상주소모드로 변환한다.|
|ResetSystem()|reboot한다.|

### 1.2 Driver Model
* high-end 서버, desktop, mobile, embeded 등에서,  
다양한 bus type의 개수와 복작성이  증가하고 있다.   
때문에 UEFI Driver Model에서는 protocol service와 booting service 형식으로 간단하게 제공하고자 하는 것.    

* driver 작성자는 device에 집중하고, platform 종속적인 부분은 신경쓰지 않고, firmware에 맡길수 있도록 해야 한다.   

### 1.3 UEFI Application
ESP(EFI System Partition)에 위치하는 application이다.   
bootmanager에 의해서 load되거나 다른 UEFI Application에 의해서 로드된다.    
종료시는 Boot Service의 EFI_BOOT_SERVICES.Exit()를 호출한다.   
그러면 memory에서 unload된다.   

### 1.4 on aarch64
aarch64에서는 ARMv8 architecture에서는 32bit 와 64bit code가 동일 privilege level에서 실행하는 것을 허용하지 않기 때문에,   
64bit ARM code만을 실행한다.   
booting 중에는 하나의 주 processor(BSP같이)만이 동작하고 다른 processor들은 전원이 꺼지거나 대기 상태로 유지된다.    
주 processor는 다음과 같은 mode에서 동작한다.      
* unaligned access enable   
* MMU는 enabled  
* Instruction and Data cache enabled
* little endian   
* stack alignment enforced

### 1.5 EFI System Table
UEFI images(UEFI Applications, UEFI Drivers(boot service drivers, runtime drivers, ..))에 전달되는,    
중요한 paramter들은 System Table의 pointer로 전달된다.   
이것은 다음 function에서도 확인할 수 있다.     
```
typedef EFI_STATUS(EFIAPI *EFI_IMAGE_ENTRY_POINT)(
	IN EFI_HANDLE ImageHandle,
	IN EFI_SYSTEM_TABLE *SystemTable
);
위 function은 UEFI Image의 entry point이다.   
EFI_BOOT_SERVICES.LoadImage()로 Image가 memory로 relocate되고, EFI_BOOT_SERVICES.StartImage()로,    
Boot가 시작되는 것.   

System Table은 다음을 포함하고 있다.   
* active console devices,   
* **Boot Service Table의 pointer**  
* **Runtime Service Table의 pointer**    
* System Configuration Table의 pointer(ACPI, SMBIOS, SAL System Table과 같은)    
```

System Table은 EFI Table Header를 맨위에 가지고 있다.   
```
typedef struct {
 UINT64 Signature;
 UINT32 Revision;
 UINT32 HeaderSize;
 UINT32 CRC32;
 UINT32 Reserved;
} EFI_TABLE_HEADER;
``` 
* **Signature**는 Boot Service Table인지, RuntimeService Table인지에 따른 고유한 64bit 식별값이다.   
* **HeaderSize**는 EFI_TABLE_HEADER를 포함하는 전체 system table의 size이다.   
* **CRC32**는 HeaderSize 만큼의 crc값.   

다음은 boot service table인 EFI_BOOT_SERVICES의 Definition이다.   
```
#define EFI_BOOT_SERVICES_SIGNATURE 0x56524553544f4f42
#define EFI_BOOT_SERVICES_REVISION EFI_SPECIFICATION_VERSION
typedef struct {
 EFI_TABLE_HEADER Hdr;
 //
 // Task Priority Services
 //
UEFI Specification, Version 2.8 Errata A EFI System Table
UEFI Forum, Inc. February 2020 94
 EFI_RAISE_TPL RaiseTPL; // EFI 1.0+
 EFI_RESTORE_TPL RestoreTPL; // EFI 1.0+
 //
 // Memory Services
 //
 EFI_ALLOCATE_PAGES AllocatePages; // EFI 1.0+
 EFI_FREE_PAGES FreePages; // EFI 1.0+
 EFI_GET_MEMORY_MAP GetMemoryMap; // EFI 1.0+
 EFI_ALLOCATE_POOL AllocatePool; // EFI 1.0+
 EFI_FREE_POOL FreePool; // EFI 1.0+
 //
 // Event & Timer Services
 //
 EFI_CREATE_EVENT CreateEvent; // EFI 1.0+
 EFI_SET_TIMER SetTimer; // EFI 1.0+
 EFI_WAIT_FOR_EVENT WaitForEvent; // EFI 1.0+
 EFI_SIGNAL_EVENT SignalEvent; // EFI 1.0+
 EFI_CLOSE_EVENT CloseEvent; // EFI 1.0+
 EFI_CHECK_EVENT CheckEvent; // EFI 1.0+
 //
 // Protocol Handler Services
 //
 EFI_INSTALL_PROTOCOL_INTERFACE InstallProtocolInterface; // EFI 1.0+
 EFI_REINSTALL_PROTOCOL_INTERFACE ReinstallProtocolInterface; // EFI 1.0+
 EFI_UNINSTALL_PROTOCOL_INTERFACE UninstallProtocolInterface; // EFI 1.0+
 EFI_HANDLE_PROTOCOL HandleProtocol; // EFI 1.0+
 VOID* Reserved; // EFI 1.0+
 EFI_REGISTER_PROTOCOL_NOTIFY RegisterProtocolNotify; // EFI 1.0+
 EFI_LOCATE_HANDLE LocateHandle; // EFI 1.0+
 EFI_LOCATE_DEVICE_PATH LocateDevicePath; // EFI 1.0+
 EFI_INSTALL_CONFIGURATION_TABLE InstallConfigurationTable; // EFI 1.0+
 //
 // Image Services
 //
 EFI_IMAGE_LOAD LoadImage; // EFI 1.0+
 EFI_IMAGE_START StartImage; // EFI 1.0+
 EFI_EXIT Exit; // EFI 1.0+
 EFI_IMAGE_UNLOAD UnloadImage; // EFI 1.0+
 EFI_EXIT_BOOT_SERVICES ExitBootServices; // EFI 1.0+
 //
UEFI Specification, Version 2.8 Errata A EFI System Table
UEFI Forum, Inc. February 2020 95
 // Miscellaneous Services
 //
 EFI_GET_NEXT_MONOTONIC_COUNT GetNextMonotonicCount; // EFI 1.0+
 EFI_STALL Stall; // EFI 1.0+
 EFI_SET_WATCHDOG_TIMER SetWatchdogTimer; // EFI 1.0+
 //
 // DriverSupport Services
 //
 EFI_CONNECT_CONTROLLER ConnectController; // EFI 1.1
 EFI_DISCONNECT_CONTROLLER DisconnectController;// EFI 1.1+
 //
 // Open and Close Protocol Services
 //
 EFI_OPEN_PROTOCOL OpenProtocol; // EFI 1.1+
 EFI_CLOSE_PROTOCOL CloseProtocol; // EFI 1.1+
 EFI_OPEN_PROTOCOL_INFORMATION OpenProtocolInformation; // EFI 1.1+
 //
 // Library Services
 //
 EFI_PROTOCOLS_PER_HANDLE ProtocolsPerHandle; // EFI 1.1+
 EFI_LOCATE_HANDLE_BUFFER LocateHandleBuffer; // EFI 1.1+
 EFI_LOCATE_PROTOCOL LocateProtocol; // EFI 1.1+
EFI_INSTALL_MULTIPLE_PROTOCOL_INTERFACES
 InstallMultipleProtocolInterfaces; // EFI 1.1+
EFI_UNINSTALL_MULTIPLE_PROTOCOL_INTERFACES
 UninstallMultipleProtocolInterfaces; // EFI 1.1+
 //
 // 32-bit CRC Services
 //
 EFI_CALCULATE_CRC32 CalculateCrc32; // EFI 1.1+
 //
 // Miscellaneous Services
 //
 EFI_COPY_MEM CopyMem; // EFI 1.1+
 EFI_SET_MEM SetMem; // EFI 1.1+
 EFI_CREATE_EVENT_EX CreateEventEx; // UEFI 2.0+
} EFI_BOOT_SERVICES;
```

즉 System Table은 실제 function들의 pointer를 제공하는 것이다.   
runtime system table인 EFI_RUNTIME_SERVICE는 다음과 같다.    
```
#define EFI_RUNTIME_SERVICES_SIGNATURE 0x56524553544e5552
#define EFI_RUNTIME_SERVICES_REVISION EFI_SPECIFICATION_VERSION
typedef struct {
 EFI_TABLE_HEADER Hdr;
 //
UEFI Specification, Version 2.8 Errata A EFI System Table
UEFI Forum, Inc. February 2020 98
 // Time Services
 //
 EFI_GET_TIME GetTime;
 EFI_SET_TIME SetTime;
 EFI_GET_WAKEUP_TIME GetWakeupTime;
 EFI_SET_WAKEUP_TIME SetWakeupTime;
 //
 // Virtual Memory Services
 //
 EFI_SET_VIRTUAL_ADDRESS_MAP SetVirtualAddressMap;
 EFI_CONVERT_POINTER ConvertPointer;
 //
 // Variable Services
 //
 EFI_GET_VARIABLE GetVariable;
 EFI_GET_NEXT_VARIABLE_NAME GetNextVariableName;
 EFI_SET_VARIABLE SetVariable;
 //
 // Miscellaneous Services
 //
 EFI_GET_NEXT_HIGH_MONO_COUNT GetNextHighMonotonicCount;
 EFI_RESET_SYSTEM ResetSystem;
 //
 // UEFI 2.0 Capsule Services
 //
 EFI_UPDATE_CAPSULE UpdateCapsule;
 EFI_QUERY_CAPSULE_CAPABILITIES QueryCapsuleCapabilities;
 //
 // Miscellaneous UEFI 2.0 Service
 //
 EFI_QUERY_VARIABLE_INFO QueryVariableInfo;
} EFI_RUNTIME_SERVICES;
```

### 1.6 Protocol
UEFI Driver들은 EFI_BOOT_SERVICES.InstallProtocolInterface()를 호출해서,  
하나 이상의 protocol을 등록한다.   

Protocl의 기본적인 규약은 다음과 같다.   
* 고유한 GUID 존재.   
* Protocol Interface 구조   
* Potocol Service

Device handle이 지원하는 protocol은 EFI_BOOT_SERVICES.HandleProtocol()이나,   
EFI_BOOT_SERVICES.OpenProtocol()을 통해서 확인할 수 있다.   
이 function들이 Protocol Interface를 return한다.   

Protocol들은 상대히 많기 때문에 전부 다루진 않고, 몇개만 살펴보자.   
[좀더 상세한 내용](https://uefi.org/sites/default/files/resources/UEFI_Spec_2_8_A_Feb14.pdf)은 Table 12. UEFI Protocols를 참조한다.   
* EFI_LOADED_IMAGE_PROTOCOL은 UEFI Image의 정보를 제공.  
* EFI_GRAPHICS_OUTPUT_PROTOCOL은 device의 그래픽 출력을 제공.  
* EFI_PCI_IO_PROTOCOL은 [PCI](/kdb/arch/hardware/#2pciperipheral-component-interconnect) BUS를 통해,   
PCI controller에 대한 memory, I/O, PCI 구성 및 DMA access를 추상화 하기 위한 Protocol Interface이다.   

```
typedef
EFI_STATUS
(EFIAPI *EFI_HANDLE_PROTOCOL) (
 IN EFI_HANDLE Handle,
 IN EFI_GUID *Protocol,
 OUT VOID **Interface
 );

Protocol: 
The published unique identifier of the protocol. It is the caller’s
responsibility to pass in a valid GUID. See “Wired For Management
Baseline” for a description of valid GUID values. Type EFI_GUID is
defined in the InstallProtocolInterface() function description

Interface:
Supplies the address where a pointer to the corresponding Protocol
Interface is returned. NULL will be returned in *Interface if a
structure is not associated with Protocol.

The HandleProtocol() function queries Handle to determine if it supports Protocol. If it does, then
on return Interface points to a pointer to the corresponding Protocol Interface. Interface can then be
passed to any protocol service to identify the context of the request. 
```

## 2. Boot Sequence
전통적인 BIOS의 booting process는 다음과 같았다.   

* **stage 1 bootloader**   
MBR에 존재한다.   
446 bytes 크기이다.   
오직 stage 1.5나 2.0의 bootloader를 load하는 역활만 수행한다.   
이 단계에서는 file system을 인지하지 못한다.   
* **stage 1.5 bootloader**   
stage2 bootloader가 인접해 있지 않거나, 파일 시스템 또는 하드웨어가 두 번째 bootloader에 접근하기 위해서 특별한 처리를 요구하는 경우에만 로드됨.   
* **stage 2 bootloader**   
kernel/initrd를 로드 한다.   
grub의 경우 /boot/grub에 boot file system을 로드하고 실행한다.   

> 이하 부분은 linux boot 관련해서 반영한 수정이 필요하다.   

UEFI에서는 다음의 두 가지 booting 방식이 존재한다.   
* Direct 방식   
  Firmware가 별도의 bootloader 없이 EFI stub kernel을 로드하는 방식.   
* bootloader  이용 방식   
  GTP disk 구조에 있는 bootloader를 이용해서, boot를 진행 하는 방식   

### 2.1 Direct 방식
firmware가 직접 EFI stub kernel을 로드하는 방식.   
grub2, elilo등의 bootloader가 필요 없다.   
GPT disk 구조는 필수가 아니지만, ESP(EFI System Partition)은 존재해야 한다.   
kernel binary인 vmlinux를 확장자 .efi로 변경해서, ESP에 위치시킨다.   
UEFI bootmanager가 이 kernel을 직접 로드하는 것이다.   

대략 다음과 같은 작업이 필요하다.
<pre>
$ cp vmlinux /boot/efi/boot/myboot.efi
$ efibootmgr --create --disk /dev/nvme0n1 --part 2 --label "Linux" --loader "\efi\boot\﻿myboot.efi"
$ efibootmgr -c -d /dev/nvme0n1 -p 2 -L "Linux" -l "\efi\boot\myboot.efi" initrd='\myinitramfs'
</pre>

### 2.2 Bootloader 이용하는 방식
GPT disk 구조에 있는 bootloader 사용해서, booting을 진행하는 방식.   
사실상 legacy bios 방식과 거의 유사하다.   
Linux를 쓰고 Grub2를 사용한다면 거의 이 방식을 사용하고 있는 것이다.   

1. **platform init**
UEFI firmware가 load된다.   
GTP header를 parsing해서, ESP의 EFI application을 로드한다.   

2. **EFI Image Load**
ESP안에 .efi 파일이 존재하며 이것이 bootmanager이다.   
\EFI\Microsoft   
\EFI\Ubuntu   
bootmanager에 의해서, EFI application 과 EFI driver가 실행되고 로드된다.   

grub2의 경우 GPT header를 가지고 ESP에 존재하는 .efi 즉 bootmanager를 실행한다.    
default로 on인 secure boot를 사용하는 경우   
/boot/efi/EFI/ubuntu/shimx64.efi   
secure boot 처리후에   
/boot/efi/EFI/ubuntu/grubx64.efi   
를 로드한다.   

이 bootmanager는 /boot/grub/grub.cfg를 확인해서,   
gzio, part_gpt, ext2 등의 kernel module을 load한다.   

3. **EFI OS Loader Load**
/boot/grub/grub.cfg를 확인해서, kernel image와 initrd를 로드한다.    

다음이 /boot/grub/grub.cfg의 내용   
<pre>
menuentry 'Ubuntu, with Linux 5.3.0-42-generic (recovery mode)' --class ubuntu --class gnu-linux --class gnu --class os $menuentry_id_option 'gnulinux-5.3.0-42-generic-recovery-951ee0ca-9caf-4c7a-af6c-11c756c081c6' {
                recordfail
                load_video
                insmod gzio
                if [ x$grub_platform = xxen ]; then insmod xzio; insmod lzopio; fi
                insmod part_gpt
                insmod ext2
                if [ x$feature_platform_search_hint = xy ]; then
                  search --no-floppy --fs-uuid --set=root  951ee0ca-9caf-4c7a-af6c-11c756c081c6
                else
                  search --no-floppy --fs-uuid --set=root 951ee0ca-9caf-4c7a-af6c-11c756c081c6
                fi
                echo    '리눅스 5.3.0-42-generic를 불러옵니다 ...'
                linux   /boot/vmlinuz-5.3.0-42-generic root=UUID=951ee0ca-9caf-4c7a-af6c-11c756c081c6 ro recovery nomodeset 
                echo    '첫 램 디스크를 불러옵니다 ...'
                initrd  /boot/initrd.img-5.3.0-42-generic
        }
</pre>

kernel module들은 /usr/lib/grub/플랫폼명 으로 존재하며, 이것이 /boot/grub/x86_64-efi로 복사되서, grub.cfg에 지정된 것들이 insmod로 로드된다.   
<pre>
/usr/lib/grub/x86_64-efi$ ls
acpi.mod              cmp_test.mod    exfat.mod            gcry_tiger.mod            legacycfg.mod    minix3_be.mod   part_sun.mod         search_label.mod    ufs2.mod
adler32.mod           command.lst     exfctest.mod         gcry_twofish.mod          linux.mod        minix_be.mod    part_sunpc.mod       serial.mod          uhci.mod
affs.mod              config.h        ext2.mod             gcry_whirlpool.mod        linux16.mod      mmap.mod        partmap.lst          setjmp.mod          usb.mod
</pre>

## 3.GPT
GUID Partition Table   
UEFI에서 기술된 disk partition 방식이다.   
firmware가 직접 kernel을 load할때는 필요하지 않다.(ESP는 필요)   
하지만, secure boot를 이용하려면 GPT가 필수이다.   
sector는 LBA를 사용한다.   
한 LBA sector는 512 byte.   
GPT를 적용한  disk의 layout은 다음과 같다.   
```
+---------------------------------------+
|   Protective MBR                      |   LBA 0

+---------------------------------------+
|   GPT Header                          |   LBA 1
+---------------------------------------+
|   partition entry array               |   LBA  2   
+---------------------------------------+
|  ...                                  |
|  ...                                  |
|  ...                                  |
|  ...                                  |
+---------------------------------------+
|   Partition 1                         |
+---------------------------------------+
|   Partition 2                         |
+---------------------------------------+
|   backup(partition entry array)       |
+---------------------------------------+
|  ...                                  |
|  ...                                  |
|  ...                                  |
|  ...                                  |
+---------------------------------------+
|  backup(GPT header)                   |
+---------------------------------------+
```

GPT에도 512 byte MBR이 여전히 존재한다.   
protective MBR이라고 불린다.   
legacy bios firmware를 위한 호환성을 유지하고, MBR 기반 disk utility들이 GPT를 인식하지 못하고, overwrite하지 않도록 하는 역활도 가지고 있다.   
1 LBA는 512 byte이다(0x200) 즉 LBA 1을 확인하려면 0x200부터이다.   
해당 disk를 hexa viewer로 확인해 보자.   

```
sudo xxd /dev/nvme0n1 | less
00000200: 4546 4920 5041 5254 0000 0100 5c00 0000  EFI PART....\...
00000210: c35c 6f98 0000 0000 0100 0000 0000 0000  .\o.............
00000220: 2f60 383a 0000 0000 2200 0000 0000 0000  /`8:....".......
00000230: 0e60 383a 0000 0000 a383 0aa8 fb1e c34d  .`8:...........M
00000240: a8d1 c7e8 80a5 4f41 0200 0000 0000 0000  ......OA........
00000250: 8000 0000 8000 0000 d5d7 2d8a 0000 0000  ..........-.....
```

**LBA1**에 위치하는 GPT header(Partition table header)는,   
disk에서 사용가능한 block의 수,   
partition table을 구성하는 partition 항목의 수와 크기등을 정의한다.   
efi에서 partition entry arrary가 최소 16,384 byte이기 때문에,   
각 128 bytes의 partition 항목이 예약된다.   
Disk의 마지막 sector에는 두 번째 GPT header가 존재한다.   
bootloader, firmware에서는 에서는 이 두 header의 crc를 확인한다고 한다.     
각 항목을 상세히 살펴보도록 하자.     

|offset|size|type|desc|
|---|---|---|---|
|0|8|signature|PE의 "MZ" 같은 것.   "EFI PART"|
|8|4|UEFI version|최신 버전은 2.7 [00 00 01 00]|
|12|4|header size|92 bytes [5c 00 00 00]|
|16|4|crc32 of header||
|20|4|reserved|전부 00으로 채워짐.|
|24|8|current LBA|GTP header가 위치하는 LBA|
|32|8|backup LBA|GTP header의 copy가 위치하는 LBA|
|40|8|first usable LBA|partitioning 할 수 있는 영역의 시작위치|
|48|8|Last usable LBA|partitioning 할 수 있는 영역의 끝 위치|
|56|16|Disk GUID|Mixed Endian이다.|
|72|8|Partition entries starting LBA|partition entry array의 시작 위치.|
|80|4|Number of partition entries|지원 가능한 GPT partition entry 개수|
|84|4|Size of partition entry|현재 GPT Partition entry의 크기<br/>보통 0x80 즉 128이다.|
|88|4|crc32 of partition array||
|92|420|reserved||

이에 따라서 GPT Header를 parsing 해보면   
[+] Primary GPT header   
[-] Signature: EFI PART    
[-] Revision: 65536   
[-] Header Size: 92   
[-] CRC32 of header: 986F5CC3 (VALID) => Real: 986F5CC3   
[-] Current LBA: 0x00000001   
[-] Backup LBA: 0x3A38602F   
[-] First usable LBA for partitions: 0x00000022   
[-] Last usable LBA for partitions: 0x3A38600E   
[-] Disk GUID: A80A83A3-1EFB-4DC3-A8D1-C7E880A54F41   
[-] Partition entries starting LBA: 0x00000002   
[-] Number of partition entries: 128   
[-] Size of partition entry: 0x00000080   
[-] CRC32 of partition array: 0x8A2DD7D5   
[+] Primary GPT header md5: ede09668784f76f435d2e4aecfd0fcd8    

Partition entry array는 LBA2에서 시작 하는 것을 확인할 수 있다.   
LBA2는 +0x200(512)해야 한다. 즉 0x400이다.   
이곳에 들어가는 것도 partition에 대한 정보를 담고 있는 곳이 partition entry이다.   
한 partition entry는 128 byte이기 때문에, 1 LBA에 4개의 entry가 저장된다.   
LBA 2 부터는 partition entry array이다. 각 partition entry의 항목은 다음과 같다.   
|Size|Type|
|---|---|
|16 bytes|Partition Type of GUID|
|16 bytes|Unique Partition GUID|
|8 bytes|First LBA|
|8 bytes|Last LBA|
|8 bytes|Attribute Flags|
|72 bytes|Partition Name|

실제로 확인해 보자.    
<pre>
00000400: 2873 2ac1 1ff8 d211 ba4b 00a0 c93e c93b  (s*......K...>.;
00000410: 3927 eaf7 7362 c043 b609 490b f9ab 4456  9'..sb.C..I...DV
00000420: 0008 0000 0000 0000 ff07 1000 0000 0000  ................
00000430: 0000 0000 0000 0000 4500 4600 4900 2000  ........E.F.I. .
00000440: 5300 7900 7300 7400 6500 6d00 2000 5000  S.y.s.t.e.m. .P.
00000450: 6100 7200 7400 6900 7400 6900 6f00 6e00  a.r.t.i.t.i.o.n.
00000460: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000470: 0000 0000 0000 0000 0000 0000 0000 0000  ................
</pre>

EFI System Partition 즉 ESP에 대한 partition entry이다.   
[-] Partition 1   
[-] Partition type GUID: C12A7328-F81F-11D2-BA4B-00A0C93EC93B   
=> Partition type: EFI System partition, None   
[-] Unique partition GUID: F7EA2739-6273-43C0-B609-490BF9AB4456   
[-] First LBA: 2048   
=> Disk Offset: 0x00100000   
[-] Last LBA: 1050623   
=> Disk Offset: 0x200FFE00   
[-] Attribute flags: 0, System Partition   
[-] Partition Name: EFI System Partition   
전체적인 header를 parsing 해 본 것은 다음과 같다.   

<pre>
$ sudo python2.7 gpt_parser.py /dev/nvme0n1
[+] Primary GPT header
 [-] Signature: EFI PART
 [-] Revision: 65536
 [-] Header Size: 92
 [-] CRC32 of header: 986F5CC3 (VALID) => Real: 986F5CC3
 [-] Current LBA: 0x00000001
 [-] Backup LBA: 0x3A38602F
 [-] First usable LBA for partitions: 0x00000022
 [-] Last usable LBA for partitions: 0x3A38600E
 [-] Disk GUID: A80A83A3-1EFB-4DC3-A8D1-C7E880A54F41
 [-] Partition entries starting LBA: 0x00000002
 [-] Number of partition entries: 128
 [-] Size of partition entry: 0x00000080
 [-] CRC32 of partition array: 0x8A2DD7D5

[+] Primary GPT header md5: ede09668784f76f435d2e4aecfd0fcd8


[+] Partition table
 [-] CRC32 Check : 8A2DD7D5 (VALID)

 [-] Partition 1
  [-] Partition type GUID: C12A7328-F81F-11D2-BA4B-00A0C93EC93B
      => Partition type: EFI System partition, None
  [-] Unique partition GUID: F7EA2739-6273-43C0-B609-490BF9AB4456
  [-] First LBA: 2048
      => Disk Offset: 0x00100000
  [-] Last LBA: 1050623
      => Disk Offset: 0x200FFE00
  [-] Attribute flags: 0, System Partition
  [-] Partition Name: EFI System Partition
</pre>

## 4. ESP(EFI System Partition)
GPT에서 boot를 위해 사용하는 partition이다.   
UEFI firmware가 인식할 수 있는 format인 FAT 계열의 file system을 사용한다.   
보통 첫 번째 혹은 두 번째 partition이다.   
fstab에 /boot/efi가 vfat으로 mout되어 있는 것을 확인할 수 있다.   

<pre>
cat /etc/fstab
# /boot/efi was on /dev/nvme0n1p1 during installation
UUID=8434-6DA1  /boot/efi       vfat    umask=0077      0       1
/swapfile                                 none            swap    sw              0       0
</pre>

## 5. Secure Boot
boot process에서 인가되지 않은 프로그램이 로드되는 것을 차단하기 위한 system.   
/boot/efi/EFI/ubuntu/shimx64.efi는 UEFI secure boot에서 사용.   
Microsoft에 의해 서명된 파일이다.   
결국에는 stage 2 bootloader인 /boot/efi/EFI/ubuntu/grubx64.efi를 로드한다.   
secure boot가 disable되어 있다면, shimx64.efi는 오직 grubx64.efi를 로드한다.   

---
title: "EFI"
permalink: /kdb/linux/boot_efi/
toc_sticky: true
toc_ads : true
layout: single
---

[To parent directory](/kdb/linux/boot/)      

# Table of contents
1. [Outline](#outline)   
2. [Boot with UEFI](#boot-with-uefi)   
	1. [entry point](#1-entry-point)    
		1. [on aarch64](#11-on-aarch64)    

# Outline

# Boot with UEFI
먼저 [boot](/kdb/linux/boot/#2-from-kernel-to-init-process)에서 살펴보았던 그림을 다시 확인해 보자.   
![boot sequence](../../../assets/images/linux-to_start_kernel.png)   

## 1. entry point
efi관련 세 곳의 entry point가 존재한다.   
aarch64의 경우는   
```
efi_status_t efi_entry(efi_handle_t handle, efi_system_table_t *sys_table_arg)
```
x86의 경우는     
```
efi_status_t __efiapi efi_pe_entry(efi_handle_t handle, efi_system_table_t *sys_table_arg)
```

UEFI spec의 [EFI_IMAGE_ENTRY_POINT](/kdb/arch/bios_uefi/#15-efi-system-table)와 정확하게 일치하는 것을 확인할 수 있다.   
즉 linux의 efi_entry는 UEFI IMAGE를 로드하는 UEFI Application인 것이다.   
첫 인자는 로드된 image의 handle이다.    
두번째 인자는 boot service와 runtime service를 이용할 수 있는 system table이다.   

기존의 legacy boot code에서는 OS가 제대로 설정되기 전에  boot 과정을 위해 firmware의 기능을 이용하기 위해서,   
BIOS interrupt를 사용했다.    
UEFI에서는 UEFI firmware가 제공하는 Boot Service와 Runtime Serviec를,   
UEFI Image(UEFI Applicatoin과 UEFI Driver)가 이용하기 위해서,   
[**System Table**](/kdb/arch/bios_uefi/#15-efi-system-table)을 사용한다.   
interrupt와 같이 구시대의 유물 형식이 아니라, System Table을 통해 함수포인터로 제공하고 있는 것이다.   

다음과 같이, System Table은 Boot Service Table과 Runtime Service Table을 포함하고 있다.   
![System Table](../../../assets/images/linux_efi_system_table.png)   
header는 [UEFI](/kdb/arch/bios_uefi)에서 살펴보았듯이 각 table 마다 맨 앞에 존재하는 자료구조이고,   
efi_boot_services가 UEFI Boot Service,  
efi_runtime_serviecs_t가 UEFI Runtime Service이다.   

### 1.1 on aarch64
**efi_entry()**는 다음과 같다.   
![efi_entry](../../../assets/images/linux_efi_entry.png)      
1. 두 번째 인자로 전달된 system table을 hdr의 signature로 검증한다.   
2. check_platform_features()를 실행해서, page가 4K로 설정되어 있다면 ok.  
```
tg = (read_cpuid(ID_AA64MMFR0_EL1) >> ID_AA64MMFR0_TGRAN_SHIFT) & 0xf;
```
**read_cpuid()**는 다음과 같이, system register를 읽는 **mrs**를 실행하는 macro이다.   
```
[arch/arm64/include/asm/cputype.h]
#define read_cpuid(reg)			read_sysreg_s(SYS_ ## reg)
```
ID_AA64MMFR0_EL1(aarch64 memory model feature register on el1)은,   
[system instruction encoding](/kdb/arch/instruction_sets_on_aarch64/#3-system-instruction)에서 살펴보았듯이,  
system instruction을 encoding 해 놓은 것이다.    
AAR64MMFR0_EL1을 encoding 해 놓은 것인데,    
이 instruction은 aarch64에서, memory model과 memory 관리 정보를 제공하는 instruction이다.     
```
[arch/arm64/include/asm/sysreg.h]
#define SYS_ID_AA64MMFR0_EL1		sys_reg(3, 0, 0, 7, 0)
[arch/arm64/include/asm/sysreg.h]
#define sys_reg(op0, op1, crn, crm, op2) \
	(((op0) << Op0_shift) | ((op1) << Op1_shift) | \
	 ((crn) << CRn_shift) | ((crm) << CRm_shift) | \
	 ((op2) << Op2_shift))
```
사용은 다음과 같이 한다. 정보를 Xt에 로드하는 것    
```
MRS <Xt>, ID_AA64MMFR0_EL1 
```
이 instruction으로는  구할 수 있는 정보로는,  
**지원하는 physical memory 범위 (4G ~ 256 TB)**    
**mixed-endian 여부**   
**secure memory인지 non-secure memory인지 여부**   
**TGran4(4K memory translation granule size를 지원하는지)**    
**TGran64(64K memory translation granule size를 지원하는지)**   
**TGran16(16K memory translation granule size를 지원하는지)**    
등이 있다.  
즉 check_platform_feature()에서는 UEFI가 강제적으로 4K granularity를 지원하기 때문에    
kernel config에서 CONFIG_ARM64_4K_PAGES가 설정되어 있는지 그리고, CONFIG_ARM64_64_PAGES가 설정되어 있다면,   
memory가 이것을 지원하는지를 system instruction을 사용해서 검증하는 것이다.   
3. boot service의 handle_protocol()을 실행해서, UEFI Image의 정보를 efi_loaded_image_t에 저장한다.    
[UEFI의 protocol에 대한 상세한 설명은 이곳을 참조하자](/kdb/arch/bios_uefi/#16-protocol)    
```
status = sys_table->boottime->handle_protocol(handle,&loaded_image_proto, (void *)&image);
[drivers/firmware/efi/libstub/efistub.h]
typedef union {
}efi_loaded_image_t;
```

4. get_dram_base()를 실행해서, UEFI memory map을 할당하고 주소를 구해온다.    
이를 위해서, efi_get_memory_map()을 실행하고 그안에서 efi_bs_call()을 실행한다.    
```
status = efi_bs_call(allocate_pool, EFI_LOADER_DATA, *map->map_size, (void **)&m);
```
efi_bs_call()은 다음과 같이 boot service의 allocate_pool()을 실행하게 된다.   
```
#define efi_bs_call(func, ...)	efi_system_table()->boottime->func(__VA_ARGS__)
```

5. efi_convert_cmdline()을 실행해서 UEFI command line을 kernel에 전달할 ascii 값으로 변환한다.    

6. handle_kernel_image()로 kernel의 load할 주소를 계산한다.   

7. efi_get_secureboot()로 secure boot mode인지를 확인한다.   

8. dtb를 로드한다.  
command line에 dtb=문자열리 포함되어 있다면 efi_load_dtb()를 실행해서, 그 경로의 dtb의 주소를 구하고,       
아니면 get_fdt()를 실행해서, system table안에 있는 configuration table로 부터 dtb의 주소를 구한다.   

9. efi_load_initrd()를 실행한다.   
initrd를 로드할 주소를 구한다.   

10. install_memreserve_table()를 실행한다.   
boot service의 allocate_pool()를 실행해서 memoery를 확보한후에, boot service의 install_configuration_table()을 실행한다.   

11. allocate_new_fdt_and_exit_boot()를 실행한다.   
FDT를 위한 memory를 할당하고 EFI commandline, initrd 관련 field를 FDT에 추가한다.    

EFI boot service는 이 function 이후로 종료된다.   


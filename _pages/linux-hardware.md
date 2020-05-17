---
title: "Hardware"
permalink: /kdb/linux/hardware/
toc_sticky: true
toc_ads : true
layout: single
---

# Outline
[numa](/kdb/linux/numa/)에서 살펴 보았듯이, hardware가 어떻게 구성되었는지에 대한 정보를 kernel에서는 필요로 한다.       
왜냐면 RAM,CPU,EMMC등 device들의 상세한 Hardware Spec은 제조사 마다 다를 것이고,      
구성도 제품마다, 틀릴 것이기  때문이다.      
x86에서는 이 정보를 **ACPI** 형식으로 bootloadr나 efi manager가 kernel에 parameter로 전달하고,      
arm64에서는 **DTB** 형식으로 전달한다.       
kernel은 이정보를 가지고 device 관련 data들을 초기화 한다.      
예를 들어 NUMA의 node 구성 정보로 schduling관련 자료구조들의 값을 초기화 해야 하는데 이 정보를 바로 DTB형식으로 전달받는 것이다.        
이전kernel에서 machine descriptor를 이용하던 것을 대체한 개념.       
관련 정보는      
**/sys/firmware/acpi**      
**/sys/firmware/devicetree**     
에서 확인 가능하다. 

# DTB(Device Tree Blob)/FDT(Flattened Device Tree)
DTB가 kernel의 boot parameter로 전달 받는 것이기 때문에,      
page table이 활성화 되기 이전에 사용해야 하는 상황이 된다.     
때문에 Fixmap을 이용해서 mapping한다.      

```
start_kernel()
-> setup_arch()
-> setup_machine_fdt()
-> early_init_dt_scan()
-> early_init_dt_scan_nodes()
-> of_scan_flat_dt()
-> early_init_dt_scan_memory()
```

|||
|---|---|
|DT|Device Tree<br/>node와 node의 property들로 구성된 tree 구조.<br/>|
|DTB|Devie Tree Blob<br/>FDT blob을 의미한다.|
|DTBO|Overlay용 DTB|
|DTC|Device Tree Compiler|
|DTO|Device Tree Overlay|
|DTS|Device Tree Source<br/>board-level definitions|
|DTSI|Device Tree Source Include<br/>SoC-level definition|
|FDT|Flattened Device Tree|


# 1. location
kernel에서, **arch/arm64/boot/dts**에 DTB source가 위치한다.     
dts와 dtsi 파일이 여기에 있으며, kernel을 build하면 dtb 파일이 만들어 진다.       
중국의 hisilicon, 가장 많이 쓰이는 qualcom의 msm등, smart phone의 dtb들도 여기에 위치하고 있다.      



# ACPI(Advanced Configuration and Power Interface) 
DTB와 같이 hardware를 기술하기 위한 표준이다.
[more detail](https://elinux.org/images/f/f8/ACPI_vs_DT.pdf)


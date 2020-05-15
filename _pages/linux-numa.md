---
title: "NUMA(Non-Uniformed Memory Access"
permalink: /kdb/linux/numa/
toc_sticky: true
toc_ads : true
layout: single
---

Random Access인 RAM과 반대되는 개념이다.    
Scheduling과 성능을 위해서 반드시 이해해야 하는 개념이기도 하다.     

# Initialization and enable
리눅스 부팅의 초기단계인  setup_arch() part에서 NUMA가 초기화 된다.    
![numa initialization](../../../assets/images/linux_numa_init.png)    

최신 PC면 UEFI를 쓰고, NUMA를 쓸 것 같지만 실상은 그렇지 않다.    
기존 bios를 지원하는 CSM이 default인 PC가 대다수이고, 내 PC만 해도 NUMA는 사실상 disable되어 있다.    

NUMA를 사용하기 위한 전제 조건은 다음과 같다.    
첫 번째로 NUMA가 kernel compile시에 enable 되어 있어야 한다.(이것은 ubuntu에서 default이다.)    
두 번째로 NUMA node topology specification이 존재해야 한다. 이 정보를 OS에 전달해야지만 정상작동한다.     
내 PC도 두 번째에서 문제가 발생하였다.    

첫 번째를 확인해 보도록 하자.    
```
/boot$ cat config-5.3.0-46-generic | grep -i NUMA
CONFIG_ARCH_SUPPORTS_NUMA_BALANCING=y
CONFIG_NUMA_BALANCING=y
CONFIG_NUMA_BALANCING_DEFAULT_ENABLED=y
CONFIG_X86_NUMACHIP=y
CONFIG_NUMA=y
CONFIG_AMD_NUMA=y
CONFIG_X86_64_ACPI_NUMA=y
CONFIG_USE_PERCPU_NUMA_NODE_ID=y
CONFIG_ACPI_NUMA=y
```

두 번째로, linux kernel source를 보면, numa topology spec은 다음중에 하나여야 한다.    
1. firmware에서 확인 (x86)    
ACPI table 중 SRAT을 확인한다. (x86_acpi_numa_init())    
2. PCI spec에서 AMD topology를 확인한다. (amd_numa_init() )    
3. arm64라면 dtb 파일에서 확인한다.    

ACPI table은 다음과 같이 확인해 볼 수 있다.    
```
$ dmesg
[    0.000000] ACPI: Early table checksum verification disabled
[    0.000000] ACPI: RSDP 0x00000000C529D000 000024 (v02 ALASKA)
[    0.000000] ACPI: XSDT 0x00000000C529D0A0 0000BC (v01 ALASKA A M I    01072009 AMI  00010013)
[    0.000000] ACPI: FACP 0x00000000C52A8538 000114 (v06 ALASKA A M I    01072009 AMI  00010013)
[    0.000000] ACPI: DSDT 0x00000000C529D1F8 00B340 (v02 ALASKA A M I    01072009 INTL 20120913)
[    0.000000] ACPI: FACS 0x00000000DAC42D80 000040
[    0.000000] ACPI: APIC 0x00000000C52A8650 00015E (v03 ALASKA A M I    01072009 AMI  00010013)
[    0.000000] ACPI: FPDT 0x00000000C52A87B0 000044 (v01 ALASKA A M I    01072009 AMI  00010013)
[    0.000000] ACPI: FIDT 0x00000000C52A87F8 00009C (v01 ALASKA A M I    01072009 AMI  00010013)
[    0.000000] ACPI: SSDT 0x00000000C52A8898 0000FC (v02 ALASKA CPUSSDT  01072009 AMI  01072009)
[    0.000000] ACPI: SSDT 0x00000000C52B9FB0 0010AF (v01 AMD    AmdTable 00000001 INTL 20120913)
[    0.000000] ACPI: SSDT 0x00000000C52A89F0 008C98 (v02 AMD    AMD ALIB 00000002 MSFT 04000000)
[    0.000000] ACPI: SSDT 0x00000000C52B1688 00368A (v01 AMD    AMD AOD  00000001 INTL 20120913)
[    0.000000] ACPI: MCFG 0x00000000C52B4D18 00003C (v01 ALASKA A M I    01072009 MSFT 00010013)
[    0.000000] ACPI: HPET 0x00000000C52B4D58 000038 (v01 ALASKA A M I    01072009 AMI  00000005)
[    0.000000] ACPI: SSDT 0x00000000C52B4D90 000024 (v01 AMDFCH FCHZP    00001000 INTL 20120913)
[    0.000000] ACPI: UEFI 0x00000000C52B4DB8 000042 (v01                 00000000      00000000)
[    0.000000] ACPI: BGRT 0x00000000C52B4E00 000038 (v01 ALASKA A M I    01072009 AMI  00010013)
[    0.000000] ACPI: IVRS 0x00000000C52B4E38 0000D0 (v02 AMD    AMD IVRS 00000001 AMD  00000000)
[    0.000000] ACPI: SSDT 0x00000000C52B4F08 002314 (v01 AMD    AMD CPU  00000001 AMD  00000001)
[    0.000000] ACPI: CRAT 0x00000000C52B7220 000F50 (v01 AMD    AMD CRAT 00000001 AMD  00000001)
[    0.000000] ACPI: CDIT 0x00000000C52B8170 000029 (v01 AMD    AMD CDIT 00000001 AMD  00000001)
[    0.000000] ACPI: SSDT 0x00000000C52B81A0 001D4A (v01 AMD    AmdTable 00000001 INTL 20120913)
[    0.000000] ACPI: SSDT 0x00000000C52B9EF0 0000BF (v01 AMD    AMD PT   00001000 INTL 20120913)
```

위의 초기화 흐름도에서 살펴볼 수 있듯이 numa 초기화 과정에서,     
 numa가 disable이거나, num specification을 발견하지 못할 경우, **dummy_numa_init()**을 타게 된다.    
그러면 다음과 같이, boot시 오류를 출력하고,    
```
$ dmesg | grep NUMA
 0.000000] No NUMA configuration found
[    0.000000] Faking a node at [mem 0x0000000000000000-0x000000081f37ffff]
```
다음과 같이 node는 하나만 잡힌다. 

```
$ lscpu 
Socket(s):           1
NUMA node(s):        1
NUMA node0 CPU(s):   0-15
```
즉 NUMA의 장점을 사용하기 위해서는 Node가 여러개여서, local과 remote가 구분되어야 하는 것인데.    
Node가 하나라는 것은 그냥 SMP(Symmetric Multi Processor)와 같은 방식으로 되어 있다고 볼수 있다.    
즉 이것은 장점을 활용하고 있지 못하다는 것이다.    
내 PC에서도,  다음과 같이 interleave_hit 항목에서 interleaving으로 동작하고 있는것을 확인할 수 있다.    
```
$ sudo numastat
                           node0
numa_hit               517299186
numa_miss                      0
numa_foreign                   0
interleave_hit             31454
local_node             517299186
other_node                     0
```
fireware menu에서 지원한다면, interleaving을 명확하게 활성화 시키는 것이 더 낳을 것이다.     


참고로 ACPI(Advanced Configuration and Power Interface)는 DTB와 같이 hardware를 기술하기 위한 표준이다.       
[more detail](https://elinux.org/images/f/f8/ACPI_vs_DT.pdf)        

# Policy
|policy|desc|
|---|---|
|default|특별히 설정하지 않았다면, 이것이 기본이다. 현재 사용중인 process가 포함된 node에서 memory를 먼저 가져다 사용.|
|bind|특정 process를 특정 node에 binding|
|preferred|가능한 특정 process를 특정 node에 binding|
|interleaced|다수의 노드에서 round-robin으로 메모리를 할당 받는다.|

# command line
먼저 numactl을 설치해 준다.   
```
sudo apt-get install numactl
```

## 1. policy 확인
```
$ numactl --show
policy: default
preferred node: current
physcpubind: 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15
cpubind: 0
nodebind: 0
membind: 0
```
## 2. available한 node 확인
```
$ numactl -H
available: 1 nodes (0)
node 0 cpus: 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15
node 0 size: 32113 MB
node 0 free: 20843 MB
node distances:
node   0
  0:  10
```

가용한 노드 확인한다. -H == --hardware    
node 0에 접근 시 10의 시간이 소요됨을 나타낸다    
여기서 확인할 수 있듯이, numa를 사용중이지만, node가 0즉 하나 밖에 없는 것을 확인할 수 있다. Remote access 자체가 없는 상황.    
node가 여러개라면, remote access 시 시간도 확인가능하다.    

## 3. status 확인
```
$ sudo numastat
                           node0
numa_hit                17401639
numa_miss                      0
numa_foreign                   0
interleave_hit             56107
local_node              17401639
other_node                     0
```
|numa_hit|해당 node에 할당성공|
|---|---|
|numa_miss|다른 node에서 할당 실패해서 이곳 node에 할당된 값, 할당 실패 한 노드에는 numa_foreign이 발생|
|numa_foreign|해당 node에 할당 시도했으나 다른 node에 할당된 것|
|interleave_hit|arch의 numa에서 Numa-interleaving을 참조하자. (numa가 아니라 smp처럼 동작) Interleave 정책으로 할당 시도해서 성공한 것.|
|local_node|local memory에 할당 시도해서 성공한 횟수.|
|other_node|remote node에 할당한 횟수.|

-cm option으로 detail 하게 확인도 가능.     
```
$ numastat -cm
sh: 0: getcwd() failed: No such file or directory
Per-node system memory usage (in MBs):
Token Node not in hash table.
Token Node not in hash table.
Token Node not in hash table.
                                   Node 0 Total
                 ------ -----
MemTotal          32113 32113
MemFree           20826 20826
MemUsed           11287 11287
Active             5939  5939
Inactive           3948  3948
Active(anon)       3587  3587
Inactive(anon)      448   448
Active(file)       2352  2352
Inactive(file)     3501  3501
Unevictable           0     0
Mlocked               0     0
Dirty                 0     0
Writeback             0     0
FilePages          6300  6300
Mapped             1000  1000
AnonPages          3588  3588
Shmem               449   449
KernelStack          17    17
PageTables           57    57
NFS_Unstable          0     0
Bounce                0     0
WritebackTmp          0     0
Slab               1152  1152
SReclaimable       1038  1038
SUnreclaim          114   114
AnonHugePages         0     0
HugePages_Total       0     0
HugePages_Free        0     0
HugePages_Surp        0     0
```

## 4. 특정 process의 numa policy 정보 확인
```
/proc/1890$ cat numa_maps
555f105e7000 default file=/usr/lib/gnome-settings-daemon/gsd-a11y-settings mapped=3 active=1 N0=3 kernelpagesize_kB=4
555f107ea000 default file=/usr/lib/gnome-settings-daemon/gsd-a11y-settings anon=1 dirty=1 N0=1 kernelpagesize_kB=4
555f107eb000 default file=/usr/lib/gnome-settings-daemon/gsd-a11y-settings anon=1 dirty=1 N0=1 kernelpagesize_kB=4
555f10a13000 default heap anon=96 dirty=96 N0=96 kernelpagesize_kB=4
7f7934000000 default anon=9 dirty=9 N0=9 kernelpagesize_kB=4
7f7934021000 default
7f7938000000 default anon=17 dirty=17 N0=17 kernelpagesize_kB=4
7f7938021000 default
7f793f7ff000 default
7f793f800000 default anon=2 dirty=2 N0=2 kernelpagesize_kB=4
7f7940000000 default anon=1 dirty=1 N0=1 kernelpagesize_kB=4
7f7940021000 default
```
혹은  taskset command를 이용할 수도 있다.    
```
$ taskset -cp 2661
pid 2661's current affinity list: 0-15
```



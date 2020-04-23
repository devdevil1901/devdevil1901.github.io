# Exception Level
Coretex-a7에서 Priviledge level 처럼 EL0~ EL3의 4가지 Exception Level이 도입되었다.    
EL0 와 EL1은 secure 와 non-secure    
EL2는 hypervisor level이고, non-secure mode에서만 존재한다.    
EL3는 highest priority level이고, secure mode에서만 존재한다.    
    
|level|non-secure mode|secure mode|
|---|---|---|
|el0|User level application||
|el1|Kernel or Guest OS|TEE|
|el2|Hypervisor OS|X|
|el3|X|Secure Monitory|

EL2와 EL3는 optional하게 되어 있다.    
TEE나 virtualization을 사용하기 위해서는 당연히 활성화 되어 있어야 한다.   
Non-secure mode와 secure mode 사이의 전환은 EL3가 담당한다.    
IRQ나 Secure Monitor Call(SMC)를 통해서 EL3에 진입할 수 있다.    
Exception이 발생하면 동일 레벨이나 상위레벨로 전달되기 때문에 EL0에서의 exception은 EL0에서는 처리할 수 없다.    

# Register


# Calling Convention


# Basic structure

# Instruction set

## 1. Data Processing
### 1.1 Arithmetic

---
title: "Scheduling"
permalink: /kdb/linux/scheduling/
toc_sticky: true
toc_ads : true
layout: single
---

# table of contents
1. [Outline](#outline)    
2. [Task state](#task-state)     
3. [RunQueue](#runqueue)    
4. [Scheduler](#scheduler)     
	1. [Time slice](#1-time-slice)        
	2. [Domain](#2-domain)    
	3. [Policy](#3-policy)    
	4. [Scheduler](#4-scheduler)     
	5. [sched_class](#5-sched_class)     
	6. [Priority](#6-priority)     
		1. [top command](#61--top-command)      
	7. [weight](#7-weight)     
	8. [Preemption](#preemption)      
		1. [User Preempt](#1-user-preempt)      
		2. [Preempt level](#2-preempt-level)     
		3. [Preempt-safe](#3-preempt-safe)     
5. [Context Switching](#context-switching)     

# Outline
[Process](/kdb/linux/process)에서 살펴보았듯이 스케줄링은 task 단위로 이루어진다.    
때문에 스케줄링이라는 것은 task를 cpu에 어떻게 배분할 것인지에 대한 방법인 것이다.    
다르게 표현하자면,  process가 cpu를 독식하는 starvation을 회피하고자 하는 방법이다.    

참고로 kernel process는 scheduling 되지 않는다.     

# Task state
process가 생성되면, TASK_RUNNING(runnable) state가 되었다가,    
CPU를 선점하게되면, TASK_RUNNING(running)으로 변경된다.      
```
[include/linux/sched.h]
#define TASK_RUNNING 0x0000 
#define TASK_INTERRUPTIBLE 0x0001 
#define TASK_UNINTERRUPTIBLE 0x0002 
#define __TASK_STOPPED 0x0004 
#define __TASK_TRACED 0x0008
```

특정 상황에서는  debugging중인 상태가 될 것이고, interrupt가 불가능한 상태가 될 수도 있다.     
linux는 이런 상태 정보를 task_struct의 state field에 bitmask로 유지한다.    

특별히 TASK_RUNNING은 **runnable**과 **running**으로 나뉜다.     
이것은 **별도의 bitmask가 지정되어 있는 것이 아니라**,     
다음그림과  같이 linux의 main scheduler인 **__schedule()**을 통해서, **context switching()**으로 이루어진다.    

![runnable에서 running으로 전환](../../../assets/images/linux_task_state.png)    
context_switch의 next에 지정된 task_struct가 바로  running 상태가 되는 것이다.     

이런 state는 task_struct에 유지된다.     
```
[include/linux/sched.h]
struct task_struct  {
...
/* -1 unrunnable, 0 runnable, >0 stopped: */ 
volatile long state;
int exit_state;
}
```

여기서 exit_state는 다음과 같은 bitmask가 set될 수 있다.    
```
[include/linux/sched.h]
#define EXIT_DEAD 0x0010 
#define EXIT_ZOMBIE 0x0020 
#define EXIT_TRACE (EXIT_ZOMBIE | EXIT_DEAD)
```

이렇게 state를 바꾸는 데에는 __set_current_state라는 MACRO를 이용한다.    
```
#define __set_current_state(state_value) \ 
    do { \ 
        WARN_ON_ONCE(is_special_task_state(state_value)); \ 
        current->task_state_change = _THIS_IP_; \ 
        current->state = (state_value); \ 
   } while (0)

#define set_current_state(state_value) \ 
      do { \ WARN_ON_ONCE(is_special_task_state(state_value));\ 
           current->task_state_change = _THIS_IP_; \ 
           smp_store_mb(current->state, (state_value)); \  
     } while (0)
```

**TASK_RUNNING**은 말 그대로 실행이 될 수 있는 상태를 나타낸다. 즉 RunQueue에 enqueue된 상태.    
process가 fork로 **생성되면 바로 이 상태**이다. 또한 **sleep이 끝나거나, yeild된 경우**에도 이 상태가 된다.    

TASK_INTERRUPTIBLE, TASK_UNINTERRUPTIBLE은 둘다 sleep이나,  wait을 하며 event를 기다리고 있는 상황이다.     
interruptiable은 interrupt될 수 있기 때문에 SIGKILL과 같은 signal로 깨어 나게 할 수 있지만,      
uninterruptiable은 오직 event 발생이나 시간이 흐르는 것만이 깨어나게 할 수 있는 방법이다.     
즉 다음과 같이 UNINTERRUPTIABLE로 설정후 sleep, wait등을 하며 대기 중인 상태로 이해하면 된다.    
```
set_current_state(TASK_UNINTERRUPTIBLE);
schedule_timeout(30 * HZ);
```

TASK_STOPPED는 프로세스의 동작이 중단된 상태이다 종료가 아니라, 중단된 상태이다.   
즉 SIGSTOP, SIGTRAP, SIGTTIN, SIGTTOU을 받은 상태.    
TASK_TRACED는 tracer에 의해서 attach된 상태로서, debugger가 attach해서, 실행이 중단 된 경우에도 이 상태이다.    
EXIT_ZOMBIE는 프로세스는 종료되었지만, 자식의 정보를 요청할 수 있기 때문에 바로 종료 시키지 않고 종료 대기 상태를 유지한다.      
부모 프로세스가 자식에 요청하는 정보로는  exit code, disk usable, cpu usage등등이 있다.    
EXIT_DEAD는 부모 프로세스가 wait()을 호출하여 처리완료된 상태로 프로세스를 종료해 삭제하고 있는 상태이다.    

참고로, 종료와 관려하여, 다음과 같은 field가 task_struct에 유지되고 있다.    
```
[include/linux/sched.h]
struct task_struct {
...
int				exit_code;
int				exit_signal;
...
}
```

# RunQueue
CPU에서 실행대기하고 있는 Queue로 이곳에 있는 task를 적절히 CPU에 할당하는 것이 바로 스케줄링.    
다른 말로 하면 task가 실행되기 위해서는 이곳에 enqueue되어야 한다.    
RunQueue는 core마다 존재한다.    

```
kernel/sched/sched.h
//Enqueue된 모든 process 개수. 같은 cache line에 있어야 한다.
unsigned int nr_running;
u64 nr_switches; // Context switching 수자
nr_switches
struct cfs_rq cfs; // Cfs scheduler의 sub run queue
struct rt_rq rt;   // Rt scheduler의 sub run queue
struct dl_rq dl;   // Deadline scheduler의 sub run queue
// task를 점유중인 task
struct task_struct __rcu        *curr;
struct list_head cfs_tasks; // cfs scheduler를 쓰는 task의 link list
```

task가 실행을 위해서 rq에 enqueue를 하면, rq의 cfs_tasks에(linked list) 자신의 task descripter를 추가한다.      


# Scheduler

scheduler는 다음과 같이 발전해 왔다.      
|version|scheduling method|
|---|---|
|2.4 이전| Priority based + Round-robin 방식이었다.|
|2.6|O(1) scheduler 도입됨|
|2.6.3|CFS scheduler로 변경되었다.<br/>load_weight에 기반하여 cpu time을 분배한다.|


## 1. time slice
CPU를 점유하는 단위. 

time slice를 할당받았고, 그 시간 동안 CPU를 점유했다면, 다른 task가 선점하게 된다.    
10ms time slice를 할당 받았는데, preempt되어서 5ms만 사용했다면 다시 cpu를 점유하게 되었을 때,     
나머지 5ms를 사용하게 되며,  remaining time slice라고 한다.      
timer 장치가 hz단위로 local APIC를 통해 interrupt를 발생시키고,     
이것의 interrupt handler인 scheduler_tick()에서 처리함으로서 time slice가 구현된다.    
HZ는 1초에 1000번을 tick하면 1Hz이고, 1 milliseconds가 된다.    
즉 1HZ는 1초에 1000번 interrupt가 발생한다는 의미이다.    
**Jiffies**는 **Booting된 이후에 몇번을 tick했는지 기록한 것**을 지피스라고 한다.   
이 지피스를 설정된 Hz로 나누면 부팅 이후 몇초가 흘렀는지를 알수 있다.     

## 2. domain
스케줄링을 위해서, Hyper Threading과 같은 SMT 구조, NUMA 등과 같은 구조를 고려해야 해야 한다.         
그래서 group과 domain개념이 추가되었다.(sched_group과 sched_domain 자료구조)           
domain들은 하이라키컬하게 구성되며 속성과 정책을 공유한다.        

다음과 같이 os의 domain을 확인할 수 있다. 
```
$ sudo sysctl -a | grep sched_domain
kernel.sched_domain.cpu0.domain1.min_interval = 8
...
kernel.sched_domain.cpu10.domain2.flags = 4143
```

SMT를 통해 core의 2배로 증가된 cpu별로 domain이 존재하며, 여러 cpu를 group으로 묶기도 한다.     
이를 통해서 cpu의 부하를 균등하게 분배 하고자 하는 것이다.     

## 3. policy
**NORMAL**:     
Task를 **CFS Scheduler**에서 동작하도록 한다.     

**RR**:     
Task를 **RT Scheduler**에서 **Round-robin**방식으로 동작하게 한다.     
다만 같은 우선순위를 가진 녀석들끼리 time slice(0.1초) 단위로 분할된다.     

**FIFO**:     
Task를 **RT Scheduler**에서 **FIFO**(선입선출) 방식으로 동작하게 한다.     
**time slice의 개념이 없으며**, 스스로 slip하거나 task가 종료되기 전까지 계속 동작한다.      
즉 non-preemptive 식인 것이다.     

**BATCH**:    
Task를 **CFS Scheduler**에서 동작하게 한다.    
NORMAL과는 다른 부분이 yeild()를 회피해서 현재 task에서 최대한 처리할 수 있도록 한다.    

**DEADLINE**:    
Task를 **deadline scheduler**에서 동작하게 한다.      
kernel 내부적으로만 사용하는 것.     

**IDLE**:    
Task를 **CFS Scheduler**에서 가장 낮은 우선순위로 동작하도록 한다. (nice == 20)       


## 4. scheduler

|scheduler|source location|sched_class|sched_policy|description|
|---|---|---|---|---|
|CFS|kernel/sched/fair.c|fair_sched_class|normal, batch, idle|task들 보통 여기에 할당된다.<br/>한 마디로 preemptive scheduler하고 할 수 있다.<br/>2.6.23부터 O(1)을 대체하였다. <br/>jiffies나 hz에 기초한 ms를 사용했으나, ns(nano sec)를 사용하게 되었다. <br/>Weight과 time slice에 의해서 스케줄링을 수행한다.<br/>|
|RT|kernel/sched/rt.c|rt_sched_class|FIFO,RR|non preemptive scheduler라고 할 수 있다. <br/> Weight이나 time slice의 개념이 없기 때문에 time slice에 영향을 주지 않는다.<br/>즉 다른 task에 preempt되지 않고, 지속적으로 task를 수행하기 위해서 사용된다. <br/>|
|DEADLINE|kernel/sched/deadline.c|dl_sched_class|||
|STOP|kernel/sched/stop_task.c|stop_sched_class||어떤 scheduler 보다도 우선 순위가 높아서 preemption되지 않으며, 다른 cpu로의<br/> migration도 허용되지 않는다.<br/> 때문에 sched_class의 select_task_rq_stop()과 check_preempt_curr_stop()을 보면 <br/> 아무것도 하지 않고 즉시 return 하는 것을 확인할 수 있다. |
|IDLE_TASK|kernel/sched/idle_task.c|idle_sched_class|||

## 5. sched_class
각 scheduler의 동작들은 추상화 되어 있다.    
그리고 추상화된 각 동작들의 실제 구현은 각 scheduler마다 구현되어 있는 형태.    
그 추상화된 자료구조로서 각각의 scheduler가 구분된 동작을 하도록 만드는 것이 바로, sched_class이다.      
task_struct는 scheduler를 유지하고 있는 것이 아니라, 바로 이 sched_class를 유지하고 있다.     
```
include/linux/sched.h
struct task_struct {
    const struct sched_class	*sched_class;
}
```
자 그럼 sched_class의 각 operation을 살펴보자.    
```
// task가 런큐에 enqueue될때 실행됨.(TASK_RUNNING)
void (*enqueue_task) (struct rq *rq, struct task_struct *p, int flags);
// task가 런큐에 dequeue될때 실행됨
void (*dequeue_task) (struct rq *rq, struct task_struct *p, int flags);
// task가 yield() system call을 실행했을 때
void (*yield_task)   (struct rq *rq);
bool (*yield_to_task)(struct rq *rq, struct task_struct *p, bool preempt);
void (*check_preempt_curr)(struct rq *rq, struct task_struct *p, int flags);
// 현재 실행 중인 프로세스를 선점할 수 있는지를 검사.
struct task_struct *(*pick_next_task)(struct rq *rq);
void (*put_prev_task)(struct rq *rq, struct task_struct *p);
void (*set_next_task)(struct rq *rq, struct task_struct *p, bool first);

#ifdef CONFIG_SMP
int (*balance)(struct rq *rq, struct task_struct *prev, struct rq_flags *rf);
int  (*select_task_rq)(struct task_struct *p, int task_cpu, int sd_flag, int flags);
void (*migrate_task_rq)(struct task_struct *p, int new_cpu);
void (*task_woken)(struct rq *this_rq, struct task_struct *task);
void (*set_cpus_allowed)(struct task_struct *p,const struct cpumask *newmask);
void (*rq_online)(struct rq *rq);
void (*rq_offline)(struct rq *rq);
#endif

void (*task_tick)(struct rq *rq, struct task_struct *p, int queued);
void (*task_fork)(struct task_struct *p);
void (*task_dead)(struct task_struct *p);
void (*switched_from)(struct rq *this_rq, struct task_struct *task);
void (*switched_to)  (struct rq *this_rq, struct task_struct *task);
void (*prio_changed) (struct rq *this_rq, struct task_struct *task,int oldprio);
    unsigned int (*get_rr_interval)(struct rq *rq,
    struct task_struct *task);
void (*update_curr)(struct rq *rq);
```

## 6. Priority
task가 더 많은 time slice를 가지기 위한 우선순위 값을 의미한다.    
policy가 normal, batch, idle인 경우는 load_weight에 기반해서,  배분되는 것을 기억하자.     
user level에서 nice 값을 설정하면, system call을 통해서 kernel level로 진입하여, nice 값을 통해 prioirty를 산출하게 된다.     
```
linux/sched/proi.h
#define MAX_PRIO (MAX_RT_PRIO + NICE_WIDTH) // 100 + 40 = 140
#define DEFAULT_PRIO (MAX_RT_PRIO + NICE_WIDTH / 2) // 100 + (40/2) = 120

#define NICE_TO_PRIO(nice)	((nice) + DEFAULT_PRIO) // nice + 120
```

단순히 위에서와 같이, +120이다.     
때문에 nice 값이 가장 높은 우선순위인 -20이라고 해도, priority로 변환되면 100이되는 것이다.    
즉 **user task에서 가장 높은 우선순위는 100이라는 의미**이고, SCHED_RR이나 SCHED_FIFO의 RT Scheduler를 쓰는 task 보다 우선순위가 높을 수가 없게 된다.     

user level에서 nice값을 변경하는 system call을 확인해 보자.    
nice 값의 범위는 -20~19이다.     
```
#include <unistd.h>
int nice(int inc);

#include <sys/time.h>
#include <sys/resource.h>
int setpriority(int which, id_t pid, int prio);

#include <sched.h>
int sched_setparam(
                  pid_t pid, 
                  const struct sched_param *param
);

struct sched_param {
    ...
    int sched_priority;
    ...
};

#include <pthread.h>

int pthread_setschedparam(
          pthread_t thread, 
          int policy,
          const struct sched_param *param
);

추가적으로 scheduler type을 설정할 수 있다.
#define SCHED_NORMAL        0
#define SCHED_FIFO      1
#define SCHED_RR        2
#define SCHED_BATCH     3

/* SCHED_ISO: reserved but not implemented yet */
 #define SCHED_IDLE      5
 #define SCHED_DEADLINE      6 

int pthread_attr_setschedpolicy(
      pthread_attr_t *attr, int policy
);
```

kernel에서 priority를 설정하는 function을 살펴보자.    
priority는 0~139이다.     
```
kernel/sched/core.c

void set_user_nice(struct task_struct *p, long nice)

static void __setscheduler(
           struct rq *rq, struct task_struct *p, 
           const struct sched_attr *attr, 
           bool keep_boost
)
```

task_struct에서 다음과 같이 priority를 유지한다.    
|task_struct field|description|
|---|---|
|prio|동적인 혹은 일시적인 priority이다.<br/> static priority와 동일하게 할당되었다가, boost up될 수 있다.<br/> FIFO나 RR policy를 실행하는 rt scheduler는 이 값을 통해서 <br/> 우선순위를 결정한다.|
|normal_proi|초기 static 값이 설정될 때 같이 설정된다. static 값이 변경되었을 때 원래 값을 확인하기 위한 용도로 사용된다. <br/>즉 rt_se_boosted()에서 p->prio != p->normal_prio<br/> 이런식이다. |
|static_prio|nice값이 변경되는 system call이 실행될 때, 갱신된다.(NICE_TO_PRIO())<br/>load wieght를 계산할 때 사용된다.|
|rt_priority|RT Scheduler를 사용하는 RT task에서만 사용한다.<br/>0~99 즉 100까지만 사용한다. <br/> MAX_RT_PRIO는 100 이다.|

이 값들은 fork될 때 초기값은 부모의 값으로 복사된다.     
 
### 6.1  top command
원래 priority는 nice + 120이지만, top command에서는 nice + 20으로 표시하기 때문에 값이 좀 이상해 보일 수 있다.     
```
 PID  USER      PR  NI VIRT    RES    SHR    S   %CPU %MEM  TIME+ COMMAND   
 5283 devdevil  20   0 4693512 1.035g 348492 S   7.9  3.3  17:55.87 firefox                                                           
 2243 devdevil  20   0 4961880 418696 114012 S   6.6  1.3   7:15.67 gnome-shell                                                       
 2265 devdevil   9 -11 2558856  15852  11916 S   1.3  0.0   1:25.21 pulseaudio                                                        
 1356 root     -51   0       0      0      0 S   0.7  0.0   1:50.42 irq/104-nvidia                                                                                               
    9 root       0 -20       0      0      0 I   0.0  0.0   0:00.00 mm_percpu_wq                                                      
   12 root      rt   0       0      0      0 S   0.0  0.0   0:00.04 migration/0                                                       
   13 root     -51   0       0      0      0 S   0.0  0.0   0:00.00 idle_inject/0
```

nice default값은 0이기 때문에, PR=20 NI 0이 default이다.    
PR이 -로 표시된 root권한으로 실행된 RT task인것을 확인할 수 있다.     
PR이 rt로 표시된 것은 가장 높은 우선 순위를 의미한다.     

## 7. weight
CFS scheduler의 time slice 배분의 기준이 되는 값이다.       
```
[include/linux/sched.h]
struct load_weight {
	unsigned long			weight;
	u32				inv_weight;
};
```
먼저 load_weight의 용도는  cpu에 얼마나 할당해야 하는지를 결정하기 위함이다.     

특정 task가 얻는 cpu time slice는 **task의 load_weight/전체 task의 load_weight** 으로 구할 수 있다.     
전체 task의 load_weight의 합이라는 의미는 runqueue에 있는 task들의 load_weight의 합이라는 의미이다.     
즉 runqueue에서, CFS scheduler의 rq에 있는 load가 바로 그 값이다.     
```
kernel/sched/sched.h
struct rq {
    ...
    cfs_rq cfs;
    ...
}
struct cfs_rq {
    ...
    struct load_weight load;
    ...
}
```

load_weight은 다음과 같이 변환 된다.     
user level의 nice -> kernel level의 priority(task_struct의 static_prio) -> load_weight
nice값이 0에서 1로 우선순위가 하나 떨어지면, CPU time은 10% 감소하게 된다.    
반대로 1에서 0이되면, CPU time은 10% 증가하게 된다.     

cfs scheduler에서 load_weight을 구하는 부분을 살펴보자.     
![to weight from priority](../../../assets/images/linux_load_weight.png)     

여기서 prio는 task_struct의 static_prio이다.      
그리고 미리 0~48까지로 값을 setting해 놓은 것을 확인 할 수 있다.     


# Preemption
일명 컴싸(컴퓨터 사이언스) 채용 문제들에서 Non-preemptive와 preeptive kernel에 대한 문제들이 나오는데,      
잘못된 것들이 매우 많다.    
왜냐하면, non-preemptive os라는 것은 존재하지 않기 때문이다.    
linux에서 non-preemptive option으로 kernel을 compile할 수 있지만,       
여기에서의 preemptive의 의미는 기본적으로 system call 호출등에서 이루어지는 선점 빼고는 추가적 하지 않는다는 의미이다.     
정말 non-preemptive라는 의미는 아니다.     
정말 non-preemptive라면 debugging도 할 수 없게 된다.     
때문에 리눅스에 대해 더 많이 아는 사람이 오히려 헷갈릴 수 있는 tricky한 문제가 될 수 있다.     

선점요청이라는 것은 cpu를 점유하고 있는 task가 다른 task에 cpu를 양보하는 것이다.     
좀 더 detail하게는 task의(task_struct) thread_info.flag에 TIF_NEED_RESCHED를 설정하는 것이다.       
다르게 생각하면, 얼마나 여러 task들이 공정하게 실행되어야 하는 가에 대한 것이다.     
이것은 scheduling에서 가장 핵심적인 부분이라고 할 수 있다.      

선점이 강력하면 강력할 수록 처리량이 줄어들고, kernel code에 대한 **runtime overhead**가 발생한다.     
하지만 interactive한 측면 즉 사용자 반응성 측면에서는 매우 향상된 성능을 보이게 된다.        
예를 들어 사용자 입력이 매우 중요한 게임, 그리고 스마트 폰의 앱들의 경우.      
반응성이 매우 중요 한데, 이것을 가능하게 하려면 더욱 공정하게 선점 될 수 있도록 해야 할 필요성이 생긴다.      

## 1. User Preempt
선점에 있어서 기준이 되는 중요한 개념이다.     
task A가 svc나 system call로 kernel mode로 진입하고, 복귀전에 task B로 선점이 일어나서       
user mode로 복귀후에, task B가 실행될 수 있다는 것이다.     
즉 system call이 발생했을 때, handler를 실행하고,  
사용자 공간으로 복귀직전에 _TIF_NEED_RESCHED flag가 set되어 있다면,      
선점이 일어날 수 있는 것.      
preempt none으로 해도 무조건 일어나는 선점이다.     

상세한 과정은 다음과 같다.  
![user preepmt 과정](../../../assets/images/linux_user_preempt.png)  

## 2. Preempt level

|kernel config|description|frequency p가 선점 발생가능|
|---|---|---|
|CONFIG_PREEMPT_NONE|computing power를 극대화 시키기 위해서 최소한의 선점만 허용 하는 것이다.<br/>한 task를 확실히 처리하고 다음으로 넘기는 식이기 때문에 때때로 더 긴 지연이 가능하지만,<br/>그 만큼 근본적인 처리능력을 최대화 시킬 수 있다.<br/>+ 공평한 scheduling을 위한 처리코드<br/>+runqueue등등에서 쓰이는 lock<br/>+ process context switching<br/>등등의 overheader가 발생.<br/> user preempt는 발생한다. 하지만, kernel mode에서는 선점되지 않늗나.<br/>즉 현재 실행중인 task가 yield()나 sleep()을 하거나,<br/> interrupt가 발생해서 user preempt를 하지 않는다면 선점되지 않는다.<br/>서버 또는 과학, 계산 시스템에 적합하다.<br/>즉 멀티 tasking이나 사용자 반응성 보다는 처리 능력이 중요시 되는 경우에 적합하다. |pnnnnnnnpnnpnnnnnnnp|
|CONFIG_PREEMPT_VOLUNTARY|명확하게(explicit) 선점 point를 추가하여, 커널의 대기시간(latency)를 줄인다.<br/>NONE과 마찬가지로 kernel mode에서 선점되지 않지만,<br/>kernel code 곳곳에 might_sleep()를 넣어 두었다.<br/> 현재 ubuntu desktop이 이걸로 compile된다. none 보다 application이 보다 부드럽게 실행되고,<br/>대화형 이벤트에 빠르게 반응 가능.|pnnnpnnnpnpnnnp|
|CONFIG_PREEMPT|최신 kernel에서는 CONFIG_PREEMPT_LL로 변경되었다.<br/>critical section을 제외한, kernel code 대 부분에서 선점이 가능하다.<br/> work load 중에도 50% 이상의 시간을 선점가능.<br/>thread_info.preempt_count가 0이 되면 선점 가능해짐.<br/>또한 낮은 우선 순위의 task 도 선점될 수 있도록 허용해서 대화형 event들을 반응 할 수 있게 한다.<br/>low-latency desktop, embeded system에서 활용된다. 스마트폰, android emulator kernel인 ranchu에서도 이것이 기본값이다.|pnpppppppnpppppppppn|
|CONFIG_PREEMPT_RT|interrupt도 preempt 될수 있는 상태.<br/> pending의 thread irq를 사용한다. <br/> 즉 IRQ handler가 kernel thread 로 동작해서 hard irq handler는 이것을 wake up만 하고, ksoftirqd는 kernel thread로서<br/>모든 soft irq를 처리한다.<br/>latency가 milli second||
|CONFIG_PREEMPT_RT_FULL|선점이 되지 않는 spinLock을 선점 가능한 Mutext로 대체하고, 거의 대다수의 코드를 선점할 수 있다.<br/>latency가 100 usecs 이하로 응답해야 할 때.||
|CONFIG_PREEMPT_RCU|read only RCU section까지도 선점이 가능. Workload중 95% 이상을 선점할수 있다고 함.||

사실상 CONFIG_PREEPT까지만 쓰이고 있기 때문에 보통은 interrupt와 spinlock은 preempt되지 않는다.      
여담으로 서버로 사용중인 Clude에 들어가보면, 서버용인데 CONFIG_PREEMPT_VOLUNTARY로 되어 있는경우가 많다.     
이것은 이런 지식을 이해하지 못한데서 발생한 일들이다.      

## 3. Preempt-safe
https://elixir.bootlin.com/linux/v5.7-rc5/source/Documentation/preempt-locking.txt   

# Context switching
context switching은    
<pre>
__schedule() -> context_switch() -> switch_to()    
</pre>
순서로 진행된다.         
이렇게 저장되는 정보로는 pid, 등등이 있는데 이런 정보는 사실 task_struct에 원래 저장되어 있지 별도로 context switching시에 하지는 않는다.    
사실 context switching시에 thread_struct나 pstate register를 이용하게 된다    

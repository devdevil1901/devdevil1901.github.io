---
title: "Server"
permalink: /kdb/dev/server/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of contents

# Outline

# Redis(Remote Dictionary Server)
NoSql database or cache로 사용된다.   
Facebook, Instagram, Messanger들이,   
Python의 Dictionary를 생각하면 이해하기 쉽다.    
즉 key-value형태로 저장 되는데, value는 String, Set, Sorted Set, Hash, List의 type을 지원한다.       

memcached와 같이 in-memory의 Non-RDBMS database이지만,    
메모리에만 존재하는 것이 아니라, 성능은 비슷한데  disk에도 저장해서 data persistence를 보장하는 차이점이 있다.    
이를 위해서, RDBMS와 같이 주기적으로 Snapshot을 떠놓고(memory를 disk로), 다음 snapshot 까지 AOF라고 해서,    
모든 write 연산을(update/insert/modify) log 파일에 기록해 놓고, 복구시 순차적으로 실행하는 방식을 사용한다.   
write 성능을 향상시키기 위해서, client쪽 sharding을 지원한다.    
mysql등에 비해서 list형 data의 write가 10배이상 빠르다.    

read의 성능을 향상 시키기 위해서 server replication을 지원한다.   

Non-blocking 형태의 Master-Slave 방식으로 구성가능하고, Clustering을 지원한다.      
동시성 처리를 보장하고, data의 expire 설정이 가능하다.      

내부적으로 slap을 사용하는 memcached에 비해서,   
malloc을 사용하기 때문에 메모리 사용량이 많고, 파편화도 생기는 문제점이 있다.      




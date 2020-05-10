---
layout: post
title:  "Useful Markdown grammer tip"
date:   2020-05-10 20:18:33 +0900
categories: jekyll update
---

대학교 1학년때, 학교에서 LUG(Linux User Group)을 만들어서 Linux를 공부하고,       
전국러그에서 1대 서울러그 리더가 되서 언더그라운드 해커들과 서울러그를 결성해서 헛 소리하던 때가 엇그제 같은데.     
어드덧 이렇게 나이를 먹게 되었다.       
그 당시 내가 좋아하던 리눅스는 console로만 쓰는 linux 였다.      
리눅스를 설치하면 init 3로 부팅되게 수정해서, x-windows 없이 부팅하도록 해놓는게 가장 먼저하는 일이었다.   

하지만 RHCE도 데비안 계열의 ubuntu를 쓰게 만드는 날이 오고, x windows도 많이 발전해서, MAC 짭 정도는 될 수준에 이르렀다.    
이쯤되면 console모드에서 리눅스를 쓰는 것은 너무나도 비효율적인 일일 것이다.     
그래서 나도 x windows에서 작업을 하고 있다.      
내 비디오 카드는 GeForce-GTX1650인데, nvidia에서 제공하는  아직도 graphic card가 windows 만큼 linux에서는 원활하게 동작하지 않는 것으로 보인다.    
그래서 드라이버 재 설정을 위해서 x windows 없이 부팅해야 할 일들이 생긴다.    
그때 유용한 command를 정리 해 둔다.   

x windows 없이 부팅.     
```
$ sudo systemctl set-default multi_user target
$ sudo reboot 0
```

x windows로 다시 복구.     
```
$ sudo systemctl set-default graphical target
$ sudo reboot 0
```


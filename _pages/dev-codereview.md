---
title: "Code Review"
permalink: /kdb/dev/review/
toc_sticky: true
toc_ads : true
layout: single
---

몇년 전부터 code review는 개발 문화로 확실히 자리잡았다.    
Pull Request의 좋은 취지는 십분 이해가 간다.     
새로 개발 팀을 setup 하게 된다면 나 자신도 이것을 도입할 것이다.    
가장 이상적인 부분들은 다음과 같을 것이다.    

* 해당 언어나 구조등에 익숙한 사람이 생소한 사람에게 리뷰를 통해 지도해 줄 수 있는 경우.     
* 서로의 지식을 review로써 공유해서 win win.

하지만 현업에서 이 문화를 치열하게 겪어 본 바로는 바르게 사용하지 않을 때 발생하는 문제점도 심각하다고 본다.    
스크럼과 마찬가지인데, 수직 관계가 아닌 스크럼에서 팀장이 수직 관계를 적용하다보니 생겼던 것과 유사하다고 본다.     
내가 느꼈던 대표적인 문제점들은 다음과 같다.    

**코드의 사유화**
리뷰어가 특정 코드를 자신의 입맛에 맞게 강요하는 것이다.    
코드 표준이 아닌 부분에서 자신이나 몇몇의 스타일을 강요하는 형식이다.     
이것은 reviewer의 권력화로 이어지게 된다.      

해결책으로는 명확한 reviewer의 r&r     

**설계 변경**
library 부분을 만들어서, 적용하는 부분에서 review를 요청한 경우에서,     
interface 부분이나, library의 설계를 변경하는 부분이다.    
최악의 상황은 시간이 촉박한 상황에서 발생 하는 것일 것이다.     
이전 design은 담당자들끼리 완성된 상황에서,    
적용되는 쪽에서 변경하는 상황이다.    
예를 들면 ui를 library쪽에서 그리도록 했는데,     
이것을 사용쪽에서 그리도록 하는 것과 같은 상황.      

이런 문제들이 안나올 것 같지만, 나오게 된다.   
그리고 몇몇 주제들은 communication resource가 개발 비용을 초과하거나,       
자칫 감정 싸움으로 이어지기도 한다.     

# References
[공부할 것](https://soojin.ro/review/)    
[How to do a code review](https://google.github.io/eng-practices/review/reviewer/)     

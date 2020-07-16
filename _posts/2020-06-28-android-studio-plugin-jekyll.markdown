---
layout: post
title:  "How to develop android studio plugin"
date:   2020-06-28 12:38:33 +0900
categories: jekyll update
---

#  

1. IntelliJ에서 Create New Project를 선택한다.  
그리고 Gradle-IntelliJ Platform Plugin과 Kotlin/JVM을 선택.  

2. plugin.xml에서 Name, Company Name등을 적절히 수정한다.    

3. src/main/kotlin에 마우스 오른쪽으로 N


# Plugin의 기능 추가
src/main/kotlin에서 마우스 오른쪽 클릭 후,    
New-Plugin Devkit을 선택하면,  다음과 같은 동작에 대한 정의를 추가할 수 있다.   
Action, Application Service, Module Service, Project Service, Theme가 존재 한다.   

## Application Service
IDE의 생명주기에 대한 것.  
TestApplicationService를 추가한다면,  
src/kotlin/impl/TestApplicationSericeImpl   
src/kotlin/TestApplicationService   
가 추가되고,   
src/resources/META-INF/plugin.xml에 다음의 내용이 추가된다.   
```
<extensions defaultExtensionNs="com.wonderland">
        <!-- Add your extensions here -->
        <applicationService serviceInterface="TestApplicationService"
                            serviceImplementation="impl.TestApplicationServiceImpl"/>
    </extensions>
```

## Reference
[plugin제작](https://madplay.github.io/post/creating-an-intellij-plugin-action)   
[plugin](https://academy.realm.io/kr/posts/android-studio-plugin-development/)  
[findbug](https://github.com/andrepdo/findbugs-idea/blob/master/src/src/impl/org/twodividedbyzero/idea/findbugs/android/AndroidUtil.java)   
[sample](https://github.com/pedrovgs/AndroidWiFiADB/blob/master/src/main/java/com/github/pedrovgs/androidwifiadb/action/AndroidWiFiADBAction.java)   


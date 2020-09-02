---
title: "Kotlin"
permalink: /kdb/dev/kotlin/
toc_sticky: true
toc_ads : true
layout: single
---

# 1.4
내 InteliJ의 kotlin compiler를 stable version에서, early-access 1.4로 바꾸었다.    
1.4 M2가 release 되었기 때문이다.   


# KMP(Kotlin Multi Platform)
작년에 덴마크에서 열린, Kotlin conference에 참여했을 때,   
가장 강조 했던 것이 1.4 compiler의 예고와    
kotlin의 multiplatform이었다.   
그 당시도 상당히 흥미롭다고 생각했었지만,   
개발 프리랜서를 하려고 생각하고 있는 지금에서는 흥미를 넘어서 절실하다고 생각된다.     
앱, 서버 시스템 전반을 혼자 개발하는 원대한 계획을 실행하기 위해서는 극도의 효율성을 추구할 수 밖에 없기 때문이다.     

IntelliJ의 Kotlin/Native Plugin을 이용해서,    
iOS의 개발의 최상위 레벨의 Framework인 Cocoa Touch Framework(Foundation, UIKit등)와 POSIX를 거의 대부분 호출할 수 있다.    
Objective-c,c++과 swift 없이 ios app을 실행할 수 있다니 상당히 매력적이 아닐 수 없다.   

기본적으로 다음과 같은 계층 구조를 가지고 있다.    
![그림](https://4d4f6p22cgml1ale382crgth-wpengine.netdna-ssl.com/wp-content/uploads/2020/01/slide-25.001.jpeg)    

## 구조 
kotlin multiplatform에서는 다음과 같은 platform hierarchy structure를 지원한다.    
![전체 platform 구조](https://kotlinlang.org/assets/images/reference/mpp/flat-structure.png)     

이런 mapping(platform 별 main)을 변경하고 싶다면,     
다음과 같이 build.gradle 파일을 수동으로 수정해 주면 된다.   
```
kotlin {
    sourceSets {
        desktopMain {
            dependsOn(commonMain)
        }
        linuxX64Main {
            dependsOn(desktopMain)
        }
        mingwX64Main {
            dependsOn(desktopMain)
        }
        macosX64Main {
            dependsOn(desktopMain)
        }
    }
```
이때 가각의 main들의 위치는     
src/commonMain   
src/desktopMain    
이런 식이 된다.   

즉 platform 별도 구현해야 할 function과 공통 로직을 분리하게되는데,    
commonMain()에서 expect keyword를 사용했다면, 하위 Main들에서 이를 각각 구현해주어야 하고,    
keyword를 사용하지 않으면 공통적으로 사용가능하다는 것을 의미한다.   
즉 commonMain에 다음과 같이 선언되었다면,   
```
expect fun souldImplementMe()
fun justFunc() {
}
```
jvmMain, jsMain, macosX64Main 등에서는     
~~~~
actual fun souldImplemenatMe() {
}
~~~~
이렇게 되어야 한다는 의미.    


multiplatform에서는 주요한 target shortcut이 미리 내장되어 있다.     
이런 target에는 ios, watchos, tvos등이 있고,    
ios target shortcut에는 iosArm64, iosX64와 같은 target들이 내장되어 있다.   
(각각 iosMain, iosArm64Main, iosX64Main을 지닌고 있다.)    
이런 hierarchical한 구조를 사용하고 싶다면, gradle.properties에 다음을 명시해야 한다.    
```
kotlin.mpp.enableGranularSourceSetsMetadata=true
```

역시 이 부분을 Customizing하고 싶다면,     
```
kotlin {
    sourceSets{
        iosMain {
            dependsOn(commonMain)
            iosX64Main.dependsOn(it)
            iosArm64Main.dependsOn(it)
        }
    }
}
```
이런식으로 해준다.   

platform dependent한 library들은 iosArm64나 iosX64에는 적용되지 않고,    
부모인 iosMain에만 적용 가능하다.   
부모에 적용한 library를 자식들에서 사용하게 하려면, **gralde.properties**에 다음을 추가해 주도록 한다.    
```
kotlin.mpp.enableGranularSourceSetsMetadata=true
kotlin.native.enableDependencyPropagation=false
```

좀더 상세한 내용은 [이곳](https://kotlinlang.org/docs/reference/mpp-intro.html)을 참조하자.       


## Development
Intellij에서 project를 생성하게 되면,    
Mobile Application, Mobile Library, Application, Library, Native Application, Full-Stack Web Application 등을 선택할 수 있다.    

## 정리중.
뭔소리인지는 모르겠지만, 프로젝트를 export하는 구조임에도 이것이 gradle로 자동화된다고 한다... 현재는 잘 이해가 안간다.   
물론 구조는, Unity에서와 비슷하게 Xcode용 project가 생성되고,    
이것을 Xcode로 로드해서 실행하는 구조이다.    

# Chain call
## sequence의 lazy evaluating
kotlin의 collection을 chain call로 호출하게 되면,    
매번 확장 함수마다, 객체가 생성된다.     
대 부분의 경우는 별 상관이 없지만, 큰 자료를 다룰 때는 overhead가 문제가 될 수 있다.     
때문에 실제로 값을 사용할 때만 객체를 생성하고, iterator를 return 하고, value는 지연되어 처리하는 Sequence가 나오게 되었다.      
큰 collection에서 일부만 복작한 작업에 사용될 때, 매우 큰 collection을 다룰 때 Sequence는 매우 유용하다.     
다음의 예에서 그 차이를 확인할 수 있다.    
```
val surnames = listOf("Lee", "Ahn", "Kim", "Park")
surnames.filter { it.startsWith("C") }
    .map { "found $it" }
    .take(1)
```
filter와 map은 각각 collection을 생성한다.    

```
val surnames = sequenceOf("Lee", "Ahn", "Kim", "Park")
surnames.filter { it.startsWith("A") }
    .map { "found $it" }
    .take(1)
```
surnames에서 Lee는 A가 아니기 때문에 pass하고, Ahn을 추려낸다.     
바로 map으로 이동해서 String을 생성해서, return된다.     
Kim, Park은 접근하지 않는다.       
lint가  compile시에 asSequence()를 호출하라고 권고하는 것이 바로 이 이유이다.      
Sequence가 매우 유용한 상황은 또한 File에서일 것이다.      
호출후 file을 close해주는 useLines를 보면 sequence를 사용하고 있다.     
```
fun readLineAndClose(path: String, processLine: (line: String) -> Boolean, charset: Charset = Charsets.UTF_8) =
            File(path).useLines(charset, { line: Sequence<String> ->
            })
...

FileReadWrite.kt
public inline fun <T> File.useLines(charset: Charset = Charsets.UTF_8, block: (Sequence<String>) -> T): T =
    bufferedReader(charset).use { block(it.lineSequence()) }
```

# References
[Jetbrain의 ios news](https://blog.jetbrains.com/kotlin/category/ios/)   


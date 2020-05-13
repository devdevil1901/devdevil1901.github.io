---
title: "Kotlin"
permalink: /kdb/dev/kotlin/
toc_sticky: true
toc_ads : true
layout: single
---


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

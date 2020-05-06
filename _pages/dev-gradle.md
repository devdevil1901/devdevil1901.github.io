---
title: "Gradle"
permalink: /kdb/dev/gradle/
toc_sticky: true
toc_ads : true
layout: single
---

# Install Gradle
gradle을 standalone으로 사용하기 위한 설치를 정리한다.    
```
$ sudo apt update
$ sudo apt install openjdk-8-jdk
$ sudo apt install zsh
$ sudo apt install zip 
$ curl -s http://get.sdkman.io | zsh
$ source ~/.sdkman/bin/sdkman-init.sh
$ sdk install gradle 6.3
$ gradle -version
Welcome to Gradle 6.3!
```

# What is gradle?
gradle은 기존의 Maven이나 Ant의 데이터를 표현하는 xml 형식을 넘어서는 확장성과 강력함을 제공한다.    
DSL(Domain Specific Language)로 표현하는데, groovy와 kotlin 두개가 있다.    
build.gradle은 groovy로 작성한 파일이고, build.gradle.kts는 kotlin으로 작성한 것이다.    
예를 들면 다음과 같은 차이가 있다.     
```
buildCache {
    local {
        directory = new File(rootDir, 'build-cache')
        removeUnusedEntriesAfterDays = 30
    }
}

buildCache {
    local {
        directory = File(rootDir, "build-cache")
        removeUnusedEntriesAfterDays = 30
    }
}
```

개인적으로 gradle로 빌드하는데 엄청나게 빡친적이 많았기 때문에 이해하기 어렵지만, gradle은 flexibility 와  performance에 초점이    
맞추어져 있다고 한다.     
Flexibility 부분은 맞는 것이 Gradle은 Android Studio, Eclipse, IntelliJ IDEA, Visual Studio 2019, XCode들의 거의 모든 IDE를 지원한다.    
가장 기본적인 개념은 projects와 tasks이다.    
하나 이상의 project가 있어야 한다.    
project는 jar나 apk, aar 이런 식으로 아웃풋의 형태가 지정된 구성이다.     

# Configura files in the gradle
Gradle package의 구성은 다음과 같다.    
```
├── build.gradle

├── settings.gradle

├── gradle

│   └── wrapper

│       ├── gradle-wrapper.jar

│       └── gradle-wrapper.properties

├── gradlew

└── gradlew.bat
```

상세한 정보는 properties 파일에서 확인한다.    
```
cat gradle/wrapper/gradle-wrapper.properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-5.6.2-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

# Create standalone project
gradle init으로 쉽게 생성할 수 있다.    
예로 kotlin standalone project를 생성하고자 한다면....     
```
$ gradle init
Starting a Gradle Daemon (subsequent builds will be faster)

Select type of project to generate:
  1: basic
  2: application
  3: library
  4: Gradle plugin
Enter selection (default: basic) [1..4] 2

Select implementation language:
  1: C++
  2: Groovy
  3: Java
  4: Kotlin
  5: Swift
Enter selection (default: Java) [1..5] 4

Select build script DSL:
  1: Groovy
  2: Kotlin
Enter selection (default: Kotlin) [1..2] 1

Project name (default: test): 

Source package (default: test):    

BUILD SUCCESSFUL in 23s
```

# Gradle plugin on AndroidStudio
Gradle을 기반으로 하지만, Android app을 빌드하는데 사용하는 몇 가지 추가 기능이 있다.     
Android Studio의 업데이트에 의해서 같이 업데이트 되지만, 독립적으로 업데이트 할 수도 있다.(Gradle and Added on Android function)    
Gradle의 버전 지정은 최상위 build.gradle 파일의 buildscript-dependencies에서 지정할 수 있다.    
```
buildscript {
	...
        dependencies {
            classpath 'com.android.tools.build:gradle:3.4.2'
        }
    }
```
여기서 버전은 실제 gradle의 version이 아니라, android studio의 gradle version으로써, 위의 3.4.2의 경우도, gradle 5.1.1+을 사용중이다.    
보통 root directory의 build.gradle과 app/build.gradle이 존재한다.    
이것은 setting.gradle에서 다음과 같이 설정하기 때문이다.     
```
include ':app'
```

[More detail](https://developer.android.com/studio/build/index.html?hl=ko)    

# Commandline

* task list를 출력
./gradlew tasks    
./gradlew tasks -all     

* gradle, kotlin, groovy, ant, jvm, os등의 version 확인    
./gradlew -version     
 
* project의 profile 확인    
build 시간등 다양한 정보를 즉시 확인할 수 있다.    
./gradlew --profile    

* project 구조 확인
./gradlew project

* 특정 task만 실행 
./gradlew -q taskname    

* DSL을 groovy에서 kotlin으로 변경(deprecated됨)  
./gradlew generateKtsConfig    
2016년에 Remove generateKtsConfig and patchIdeaConfig tasks라는 commit에서 deprecated 됨.    

* library cache를 지우고 새로 받기
./gradlew build --refresh-dependencies

# Build Scan 이용하기
위에서 본 profile 보다 보다 상세한 정보를 제공해 준다.    
build를 ci로 자동화 해 놓았다면 성능튜닝등을 위해서, 대 부분, build scan까지 자동화 해 놓는다.     
```
$ ./gradlew build --scan
...
https://scans.gradle.com/s/3puee5bqovows
```
실행하면 link를 주는데, 해당 url로 가면 email을 입력하도록 해 놓고,    
![받은메일](../../../assets/images/dev_buildscan.png)
Discover your build를 클릭하면, 웹 보고서가 표시된다.    
자동화를 위해서 로컬에서 처리하게 하려고 하면 다음을 참조하자.    
[자동화](https://docs.gradle.com/enterprise/gradle-plugin/?_ga=2.28707252.946746163.1575942340-1340950123.1570418308#applying_the_plugin)    

# Lint
로컬 빌드시 사용하는, lintChecks와 publish를 위한 lintPublish가 나뉘어 있고, Project 별로 적용할 수 있다.    
```
dependencies {
      // Executes lint checks from the ':lint' project at build time.
      lintChecks project(':lint')
      // Packages lint checks from the ':lintpublish' in the published AAR.
      lintPublish project(':lintpublish')
    }
```

# R8
legacy에서는,    
.java ----------> .class  -----------> .class  ----------------->  .dex    
       javac               proguard                D8+Desugar    
이와 같이,  .java파일들이 javac에 의해서 .class파일로 compile되고,    
.class 파일에 ProGuard가 적용되서 다시 .class가 만들어지고,  이것에 d8이 적용되어, .dex가 만들어졌다.     
하지만 R8을 적용하게 되면,    
.java ----------> .class  -----------------> .dex    
      javac               R8(D8+Desugar)    
즉 한번만 .class를 생성하기 때문에 빌드의 성능을 향상 시킬 수가 있다.     
Default로 On이고, 다음과 같이 해서 끌수 있다.    
```
# Disables R8 for Android Library modules only.
    android.enableR8.libraries = false
    # Disables R8 for all modules.
    android.enableR8 = false
```

[R8 호환성관련 FAQ](https://r8.googlesource.com/r8/+/refs/heads/master/compatibility-faq.md)    

# DSL
## 1. Gradle Scripts
build.gradle과 같은 gradle script는 고유한 class를 상속받아 interface를 구현한 것이다.    
**build script**는 **Project** class를     
**init script**는 **Gradle** class를     
**setting script**는 **Settings**를    

[Script interface 확인](https://docs.gradle.org/current/dsl/org.gradle.api.Script.html)    

### 1.1 Project
build.gradle파일과 1:1대응된다.    
build 초기화 과정에서, Gradle은 각 project 마다, Project object를 assemble한다.     
* settings.gradle script를 가지고,  Settings 객체를 생성한다.   
* Settings를 이용해서, tree 구조의 Project 객체를 설정한다.    

[공부할 것](https://docs.gradle.org/current/dsl/org.gradle.api.Project.html)    
[DSL 문법](https://docs.gradle.org/current/dsl/)    

## 2. Gradle Scripts
[공부할 것](https://docs.gradle.org/current/dsl/org.gradle.api.invocation.Gradle.html)    

## Grammer
### 1. Task 등록
groovy에서는 다음과 같다.    
```
task hello {
    doLast {
        println 'Hello world!'
    }
}
```
kotlin으로는 다음과 같다.    
```
tasks.register("hello") {
    doLast {
        println("Hello world!")
    }
}
Or
task("greeting") {
    doLast { println("Hello, World!") }
}
```

### 2. Plugin 등록
in groovy    
```
apply plugin: 'jacoco'

plugins {
    id 'jacoco'
}

jacoco {
    toolVersion = '0.8.1'
}

apply plugin: "checkstyle"

checkstyle {
    maxErrors = 10
}
```

in kotlin    
```
apply(plugin = "jacoco")

plugins {
    jacoco
}

jacoco {
    toolVersion = "0.8.1"
}

apply(plugin = "checkstyle")

configure<CheckstyleExtension> {
    maxErrors = 10
}
```

### 3. Artifact 선언
in groovy    
```
plugins {
    id 'org.springframework.boot' version '2.0.2.RELEASE'
}

bootJar {
    archiveName = 'app.jar'
    mainClassName = 'com.example.demo.Demo'
}

bootRun {
    main = 'com.example.demo.Demo'
    args '--spring.profiles.active=demo'
}
```

in kotlin    
```
import org.springframework.boot.gradle.tasks.bundling.BootJar
import org.springframework.boot.gradle.tasks.run.BootRun

plugins {
    java
    id("org.springframework.boot") version "2.0.2.RELEASE"
}

tasks.named<BootJar>("bootJar") {
    archiveName = "app.jar"
    mainClassName = "com.example.demo.Demo"
}

tasks.named<BootRun>("bootRun") {
    main = "com.example.demo.Demo"
    args("--spring.profiles.active=demo")
}
```


# Useful function

## 1. Check project tree structure
```
$ ./gradlew -q project
------------------------------------------------------------
Root project
------------------------------------------------------------
Root project 'androidTest'
\--- Project ':app'
```

## 2. Change gradle version
특정 project에서 gradle version을 바꾸는 것은 다음과 같이 간단히 할 수 있다.    
```
hello-world$ ./gradlew wrapper --gradle-version 5.4.1
Downloading https://services.gradle.org/distributions/gradle-6.0.1-bin.zip
.........10%.........20%.........30%.........40%.........50%.........60%.........70%.........80%.........90%.........100%
BUILD SUCCESSFUL in 12s
1 actionable task: 1 executed
~/androiddev/gradle/hello-world$ ./gradlew -version
Downloading https://services.gradle.org/distributions/gradle-5.4.1-bin.zip
........10%........20%........30%.........40%........50%........60%.........70%........80%........90%.........100%
Welcome to Gradle 5.4.1!
Here are the highlights of this release:
 - Run builds with JDK12
 - New API for Incremental Tasks
 - Updates to native projects, including Swift 5 support
For more details see https://docs.gradle.org/5.4.1/release-notes.html
------------------------------------------------------------
Gradle 5.4.1
------------------------------------------------------------
Build time:   2019-04-26 08:14:42 UTC
Revision:     261d171646b36a6a28d5a19a69676cd098a4c19d
Kotlin:       1.3.21
Groovy:       2.5.4
Ant:          Apache Ant(TM) version 1.9.13 compiled on July 10 2018
JVM:          1.8.0_232 (Private Build 25.232-b09)
OS:           Linux 4.4.0-18362-Microsoft amd64
```

# Performance improvement
## 1. Gradle daemon의 heap 크기 조절.    
Gradle 5.0 이상을 사용하면, gradle daemon의 heap 크기가 1GB에서 512M로 줄어들었기 때문에,    
성능저하가 발생가능하다. 때문에 다음과 같이 크기를 확장해 주는 것이 좋다.    
```
in gradle.properties
org.gradle.jvmargs=-Xmx2g -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
```

[참조](https://docs.gradle.org/current/userguide/build_environment.html#sec:configuring_jvm_memory)   

## 2. groovy vs kotlin
Kotlin DSL은 groovy와 비교해서, clean checkout 이나 CI Agent에서 처음 사용하는  부분에서 더 느리다.    
즉 build script의 caching을 이용하지 않고, 재 빌드해야 하는 상황에서 느리게 되는 것이다.    
즉 git을 CI와 연동해 놓은 경우는 매번 새 빌드이기 때문에 치명적인 개발 생산성에 문제를 가져올 수 있다.    
IDE에서도 응답성 문제를 유발할 수 있다.    
[관련기사](https://guides.gradle.org/migrating-build-logic-from-groovy-to-kotlin)    
자체적으로 테스트 해 놓았는데,    
[성능테스트](https://github.com/gradle/kotlin-dsl-samples/issues/902)    
다음과 같이 차이가 적지 않다.(18 vs 75)    
```
Groovy DSL ~18s
scenario: first use of largeJavaMultiProject
template: largeJavaMultiProject
performance test results
Kotlin DSL ~75s
scenario: first use of largeJavaMultiProjectKotlinDsl
template: largeJavaMultiProjectKotlinDsl
performance test results
Both with:
clean checkout
empty local caches
cold daemon
The compilation of the 500 build scripts of the example build by the Kotlin compiler dominates wall clock. Note that script compilation is not parallelized in Kotlin nor Groovy.
See the upstream KT-24668 investigation issue.
```

# References
[Release](https://gradle.org/releases/)    
[Offical Manual](https://docs.gradle.org/current/userguide/userguide.html)    
[User forum](https://discuss.gradle.org)    


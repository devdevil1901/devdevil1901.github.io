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

## Useful function

# Check project tree structure
```
$ ./gradlew -q project
------------------------------------------------------------
Root project
------------------------------------------------------------
Root project 'androidTest'
\--- Project ':app'
```

# Change gradle version
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

# References
[Release](https://gradle.org/releases/)    


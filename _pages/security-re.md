---
title: "Reverse Engineering"
permalink: /kdb/security/re/
toc_sticky: true
toc_ads : true
layout: single
---

# Outline


# Tool
## binary compare

```
$ xxd target.so > v1.hex
$ xxd target2.so > v2.hex
```

# radare2
linux, mac, windows 모두 동작한다.   

## Install

radare2 설치는 [이곳](https://www.radare.org/r/down.html)을 확인하자.   
정리하면 다음과 같다.  
radare2 설치   
```
$ git clone https://github.com/radare/radare2
$ cd radare2
$ sys/install.sh
```   

binding 설치   
```
$ sudo apt-get install -y valac
$ sudo apt-get install -y libvala-0.40
$ sudo dpkg -L libvala-0.40-0
..
/usr/lib/x86_64-linux-gnu/libvala-0.40.so.0.0.0
..


$ git clone https://github.com/radare/valabind

$ git clone https://github.com/radare/radare2-bindings
$ cd radare2-bindings
$ ./configure --prefix=/usr
$ cd python
$ make
$ sudo make install
```

## command option    

|command|desc|
|---|---|
|r2 -c=H|웹을 통한 GUI로 실행한다.<br/>파일이 크면 좀 에바임.|

## inline command   

a?와 같이 끝에 ?를 붙이면, a로 시작하는 command가 출력된다.   

|command|desc|
|---|---|
|aa|flag들을 분석한다.<br/>aa~aaaa까지 좀더 자세히 분석 가능하고,  aaaa까지 치면 function call까지 더 자세히 분석|
|f|심볼들을 출력한다.<br/>pipe로 grep등과 같이 쓸 수 있다.|
|s|seek 지정한 symbol이나 주소로 base를 옮긴다.|
|V|Visual Mode로 전환, vi키 전부 사용 가능<br/>이 안에서는  p로 각화면 전환 가능하고, q로 종료한다.|
|v|좀더 IDA 스러운 Visual Mode로 전환. 마우스 제대로 지원됨, q로 종료|

## function disassemble 하기   
main 함수 disassemble 하기.      
```
[0x0002ddf8]> f | grep main
0x000c89f0 24712 main
0x0002ddf8]> s main
[0x000c89f0]> pd
```

혹은 아무데서나    
```
[0x000c89f0]> pdr. @main
```

## binary diffing

```
```


# reference
[radare](https://www.radare.org/r/down.html)    

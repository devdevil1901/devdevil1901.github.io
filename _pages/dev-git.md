---
title: "Using git in the field"
permalink: /kdb/dev/git/
toc_sticky: true
toc_ads : true
layout: single
---

최근에는 국내 기업들도 공동 작업을 위해서 대 부분 git을 이용하고, 있다.     
code review, git은 이제 개발문화로 자리잡은 듯하다.     
때문에 일반 회사에서 원활히 git을 이용하는 방법을 정리해 보고자 한다.     


# 다수의 인원과 공동개발
fork and upstream에 대한 개념을 이해해야 한다.     
공동작업을 위해서 가장 편한 방법은 upstream에서, fork하는 것이다.     
fork해서 자신의 repository에서 작업을 해서 pull request를 통해서,     
upstream에 merge하는 방식으로 진행될 것이다.     

```
$ git remote -v
origin	https://github.com/0mega999/everything.git (fetch)
origin	https://github.com/0mega999/everything.git (push)

$ git remote add upstream https://github.com/devdevil1901/everything.git

$ git remote -v
origin	https://github.com/0mega999/everything.git (fetch)
origin	https://github.com/0mega999/everything.git (push)
upstream	https://github.com/devdevil1901/everything.git (fetch)
upstream	https://github.com/devdevil1901/everything.git (push)
```

내 repository는 origin으로 표시되고, remote는 의미상 적당한, upstream으로 지정하였다.     
upstream은 각각의 fork로 생성된 repository에서 개발된 결과가 merge되어 있는 곳이다.     
origin은 각각의 개발자가 commit후 push해서 저장해 놓는 곳.    
upstream은 origin에서 개발된 code가 pull request를 통해서 merge가 되는 곳이다.    
upstream에서 누군가가 pull request를 통해서, commit을 update하였다.     
```
in upstream,
$ git log
commit 71f62cf8a692f2a7f621516d38051e9eed6aa9bd (HEAD -> master, origin/master, origin/HEAD)
commit 6a06da704e74199eb86193684792c56037a9d228
commit 5dbb6dcdaf2234c12dd3019ad8042a4174315f25

in my origin
$ git branch -l
* job1
  master
$ git log
commit 5dbb6dcdaf2234c12dd3019ad8042a4174315f25 (HEAD -> job1, origin/master, origin/HEAD, master)
```

위와 같이, 6a06d~와71f6~ 두개의  commit이 추가되었다.    
이제 이 commit들을 가져와 보자. fetch는 merge를 자동으로 하지 않는 pull과 같다.    
```
$ git fetch upstream
remote: Enumerating objects: 21, done.
remote: Counting objects: 100% (21/21), done.
remote: Compressing objects: 100% (3/3), done.
remote: Total 11 (delta 3), reused 11 (delta 3), pack-reused 0
오브젝트 묶음 푸는 중: 100% (11/11), 완료.
https://github.com/devdevil1901/everything URL에서
   6a06da7..71f62cf  master     -> upstream/master
```

두 commit(6a~와 71~)을 가져온 것을 확인할수 있다.     
```
$ git log --oneline --all --graph --decorate --branches
* 71f62cf (upstream/master) Fix invalid argument
* 6a06da7 Add testing Definition from file
* 5dbb6dc (HEAD -> master, origin/master, origin/HEAD, job1) Add utility class to handle file
* ebdc551 Add gpt header binary for unittest
* 4688992 Add simple unittest
* e151a3e Add empty main class
* 514d9dd Add simple extension funtion to log
* 688dbd9 Add result of paring
* e56405a Add Parser
* 0e96b50 Add Wrapper of bytebuffer to handle byte odering or so
* bc5f06c Add Definition class to let parser know
* 277f25e Add definition of data structure for using parser
* 61e2e61 Add default project files that created by 'gradle init' and Intellij
* d768bbf Initial commit

$ git branch -avv
  job1                    5dbb6dc Add utility class to handle file
* master                  5dbb6dc [origin/master] Add utility class to handle file
  remotes/origin/HEAD     -> origin/master
  remotes/origin/master   5dbb6dc Add utility class to handle file
  remotes/upstream/master 71f62cf Fix invalid argument
```

위와 같이 확인해 보면, origin의 HEAD는 새로 가져온 commit을 가르키고 있지는 않다.    
이것은 fetch를 사용했기 때문이다.     
즉 merge나 pull을 별도로 해 주어야 한다. pull을 한 경우, 이미 수행한 fetch를 다시 수행하지는 않는다.    
```
$ git merge upstream/master origin/master
업데이트 중 5dbb6dc..71f62cf
Fast-forward
 src/main/kotlin/org/alitheiavison/devdevil/everything/parser/FileHandler.kt |  5 ++---
 src/test/kotlin/org/alitheiavison/devdevil/everything/AppTest.kt            | 21 +++++++++++++++++++++
 2 files changed, 23 insertions(+), 3 deletions(-)

$ git push
   5dbb6dc..71f62cf  master -> master
```
그리고 push까지 해 주어야 지만, 다음과 같이 HEAD가 최신  HEAD를 가르키게된다.     
```
$ git log --oneline --all --graph --decorate --branches
* 71f62cf (HEAD -> master, upstream/master, origin/master, origin/HEAD) Fix invalid argument
* 6a06da7 Add testing Definition from file
```


# To do
다음 시나리오     
1. 내가 merge한 code 때문에 CI build가 fail됨.
2. 내 repository의 특정 작업 branch의 작업 기간이 길어져서, upstream의 gap이 생김.
3. 특정 hash 들만 체리픽으로 넣어야 하는 경우.
4. submodule 문제.




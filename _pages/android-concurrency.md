---
title: "Concurrency"
permalink: /kdb/android/concurrency/
toc_sticky: true
toc_ads : true
layout: single
---

# Table of content
1. [Outline](#outline)   
2. [UI Thread](#ui-thread)   
3. [Annotation](#annotation)   
4. [AsyncTask](#asynctask)   

# Outline

# UI Thread
application이 실행되면, main 이라는 thread를 만든다.   
main thread는 Android의 UI toolkit의 component(widget, view 등..)   
와 상호작용을 하기 때문에 main thread를 UI Thread라고 부른다.   
Android UI toolkit은 thread safe하지 않다.    
즉 main thread는 UI thread가 아닌 상황도 있고,   
그래서 annotation에서도 main과 ui가 따로 있는 것이다.       
worker thread에서는 view 관련 처리 즉 UI를 조작해서는 안되며,    
ui thread에 작업을 전달하는 API를 사용해야 한다.    
```
Activity.runOnUiThread(Runnable)
View.post(Runnable)
View.postDelayed(Runnable, long)
```

# Annotation
Thread관련 annotation을 살펴보자.   
```
@MainThread
@UiThread
@WorkerThread
@BinderThread
@AnyThread
```

lifecycle  관련한 method에는 @MainThread를 사용한다.   
view와 관련한 method에는 @UiThread를 사용.    

@AnyThread는 어느 thread에서도 전부 호출 가능하다는 의미 즉 **thread safe**   

# AsyncTask
Deprecated 되었다.   
다음의 자아비판 주석과 함께 deprecated 되었다.   
> AsyncTask는 UI Thread 사용을 적절히 쉽게 하기 위한 것이었는데,    
실제 사용은 UI에 통합하기 위한 작업에 대 부분 사용되었기 때문에,    
Context leak, callback의 누락, configuration 변경으로 인한 crash등의 문제들이 발생하였다.   
또한 platform 마다 일관된 동작을 하지않았고, doInBackground에서 exception을 삼켜버렸다.   
Executor를 직접  사용하는 것 보다 많은 기능을 제공하지도 않는다.    
원래 AsyncTask는 짧은 작업을 사용하는데 이상적이었고, 오랜 시간 작업이 필요한 경우네는,   
java.util.concurrnt package의 Executor, ThreadPoolExecutor, FutureTask를 사용하는 것이 좋다.    

사실 이것은 AsyncTask의 문제라기 보다는 Thread 자체의 문제이다.   
coroutine이나, rxjava, java.util.concurrent의 API들도 잘못 짜면 동일한 문제가 발생하게 된다.   

예를 들어,    
```
companion object {
        fun getAsyncLeak(context: Context): AsyncTask<Void, Void, Void> {
            return object: AsyncTask<Void, Void, Void>() {
                override fun doInBackground(vararg p0: Void?): Void {
                    var counter = 0
                    while(true) {
                        "count: ${counter++} context: $context".logd()
                        Thread.sleep(3000)
                    }
                }
            }.executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR)
        }
    }
```
이런 코드를 실행해 보자. leak canary등을 사용하면 즉시 leak이 발생했음을 알수 있다.     
이것은 coroutine이나, rxjava를 써도 마찬가지이다.   
context가 activity의 lifecycle에대한 고려를 하지 않아서 발생한 문제이기 때문이다.    

Android Studio의 lint의 경우 AsyncTask에 warning을 주고 있다.   

한 마디로 Thread의 원죄를 해결하지 못한채 만들어진 AsyncTask는 그 자체는 죄가 없지만,   
굳이 존재할 필요는 없었다.   




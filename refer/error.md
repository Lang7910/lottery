INFO:     ::ffff:127.0.0.1:0 - "GET /api/analysis/hk6/metaphysical?num_sets=5 HTTP/1.1" 500 Internal Server Error
ERROR:    Exception in ASGI application
Traceback (most recent call last):
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\uvicorn\protocols\http\httptools_impl.py", line 401, in run_asgi
    result = await app(  # type: ignore[func-returns-value]
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 70, in __call__
    return await self.app(scope, receive, send)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    await super().__call__(scope, receive, send)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\applications.py", line 113, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    raise exc
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    await self.app(scope, receive, _send)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    await self.app(scope, receive, send)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\_exception_handler.py", line 62, in wrapped_app
    raise exc
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\_exception_handler.py", line 51, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\routing.py", line 715, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\routing.py", line 735, in app
    await route.handle(scope, receive, send)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\routing.py", line 288, in handle
    await self.app(scope, receive, send)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\routing.py", line 76, in app
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\_exception_handler.py", line 62, in wrapped_app
    raise exc
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\_exception_handler.py", line 51, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\routing.py", line 73, in app
    response = await f(request)
               ^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\fastapi\routing.py", line 301, in app
    raw_response = await run_endpoint_function(
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\fastapi\routing.py", line 214, in run_endpoint_function
    return await run_in_threadpool(dependant.call, **values)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\concurrency.py", line 39, in run_in_threadpool
    return await anyio.to_thread.run_sync(func, *args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    return await get_async_backend().run_sync_in_worker_thread(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\anyio\_backends\_asyncio.py", line 2461, in run_sync_in_worker_thread
    return await future
           ^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\anyio\_backends\_asyncio.py", line 962, in run
    result = context.run(func, *args)
             ^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\Ironman\SideProject\彩票\lottery\backend\routers\analysis.py", line 339, in get_metaphysical_simple
    return service.predict(
           ^^^^^^^^^^^^^^^^
  File "D:\Ironman\SideProject\彩票\lottery\backend\services\metaphysical_service.py", line 566, in predict
    draw_time = self.get_next_draw_time(lottery_type)
                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\Ironman\SideProject\彩票\lottery\backend\services\metaphysical_service.py", line 327, in get_next_draw_time
    config = self.DRAW_TIMES[lottery_type]
             ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^
KeyError: 'hk6'
INFO:     ::ffff:127.0.0.1:0 - "GET /api/analysis/hk6/metaphysical?num_sets=5 HTTP/1.1" 500 Internal Server Error
ERROR:    Exception in ASGI application
Traceback (most recent call last):
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\uvicorn\protocols\http\httptools_impl.py", line 401, in run_asgi
    result = await app(  # type: ignore[func-returns-value]
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\uvicorn\middleware\proxy_headers.py", line 70, in __call__
    return await self.app(scope, receive, send)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\fastapi\applications.py", line 1054, in __call__
    await super().__call__(scope, receive, send)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\applications.py", line 113, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\middleware\errors.py", line 187, in __call__
    raise exc
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\middleware\errors.py", line 165, in __call__
    await self.app(scope, receive, _send)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\middleware\cors.py", line 85, in __call__
    await self.app(scope, receive, send)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\middleware\exceptions.py", line 62, in __call__
    await wrap_app_handling_exceptions(self.app, conn)(scope, receive, send)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\_exception_handler.py", line 62, in wrapped_app
    raise exc
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\_exception_handler.py", line 51, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\routing.py", line 715, in __call__
    await self.middleware_stack(scope, receive, send)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\routing.py", line 735, in app
    await route.handle(scope, receive, send)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\routing.py", line 288, in handle
    await self.app(scope, receive, send)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\routing.py", line 76, in app
    await wrap_app_handling_exceptions(app, request)(scope, receive, send)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\_exception_handler.py", line 62, in wrapped_app
    raise exc
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\_exception_handler.py", line 51, in wrapped_app
    await app(scope, receive, sender)
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\routing.py", line 73, in app
    response = await f(request)
               ^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\fastapi\routing.py", line 301, in app
    raw_response = await run_endpoint_function(
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\fastapi\routing.py", line 214, in run_endpoint_function
    return await run_in_threadpool(dependant.call, **values)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\starlette\concurrency.py", line 39, in run_in_threadpool
    return await anyio.to_thread.run_sync(func, *args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\anyio\to_thread.py", line 56, in run_sync
    return await get_async_backend().run_sync_in_worker_thread(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\anyio\_backends\_asyncio.py", line 2461, in run_sync_in_worker_thread
    return await future
           ^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\anyio\_backends\_asyncio.py", line 962, in run
    result = context.run(func, *args)
             ^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\Ironman\SideProject\彩票\lottery\backend\routers\analysis.py", line 339, in get_metaphysical_simple
    return service.predict(
           ^^^^^^^^^^^^^^^^
  File "D:\Ironman\SideProject\彩票\lottery\backend\services\metaphysical_service.py", line 566, in predict
    draw_time = self.get_next_draw_time(lottery_type)
                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "D:\Ironman\SideProject\彩票\lottery\backend\services\metaphysical_service.py", line 327, in get_next_draw_time
    config = self.DRAW_TIMES[lottery_type]
             ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^
KeyError: 'hk6'
C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\statsmodels\tsa\statespace\sarimax.py:966: UserWarning: Non-stationary starting autoregressive parameters found. Using zeros as starting parameters.
  warn('Non-stationary starting autoregressive parameters'
C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\statsmodels\tsa\statespace\sarimax.py:978: UserWarning: Non-invertible starting MA parameters found. Using zeros as starting parameters.
  warn('Non-invertible starting MA parameters found.'
INFO:     ::ffff:127.0.0.1:0 - "GET /api/analysis/ssq/recommend?lookback=100&num_sets=5&aggregation=all HTTP/1.1" 200 OK
C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\statsmodels\tsa\statespace\sarimax.py:966: UserWarning: Non-stationary starting autoregressive parameters found. Using zeros as starting parameters.
  warn('Non-stationary starting autoregressive parameters'
C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\statsmodels\tsa\statespace\sarimax.py:978: UserWarning: Non-invertible starting MA parameters found. Using zeros as starting parameters.
  warn('Non-invertible starting MA parameters found.'
INFO:     ::ffff:127.0.0.1:0 - "GET /api/analysis/ssq/recommend?lookback=100&num_sets=5&aggregation=all HTTP/1.1" 200 OK

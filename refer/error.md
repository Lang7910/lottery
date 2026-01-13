ERROR:    Exception in ASGI application
Traceback (most recent call last):
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 1967, in _exec_single_context
    self.dialect.do_execute(
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\default.py", line 941, in do_execute
    cursor.execute(statement, parameters)
sqlite3.OperationalError: no such column: hk6_results.year

The above exception was the direct cause of the following exception:

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
  File "D:\Ironman\SideProject\彩票\lottery\backend\routers\hk6.py", line 40, in get_hk6_list
    items = service.get_all(
            ^^^^^^^^^^^^^^^^
  File "D:\Ironman\SideProject\彩票\lottery\backend\services\hk6_service.py", line 186, in get_all
    .all()
     ^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\orm\query.py", line 2673, in all
    return self._iter().all()  # type: ignore
           ^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\orm\query.py", line 2827, in _iter
    result: Union[ScalarResult[_T], Result[_T]] = self.session.execute(
                                                  ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\orm\session.py", line 2362, in execute
    return self._execute_internal(
           ^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\orm\session.py", line 2247, in _execute_internal
    result: Result[Any] = compile_state_cls.orm_execute_statement(
                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\orm\context.py", line 305, in orm_execute_statement
    result = conn.execute(
             ^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 1418, in execute
    return meth(
           ^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\sql\elements.py", line 515, in _execute_on_connection
    return connection._execute_clauseelement(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 1640, in _execute_clauseelement
    ret = self._execute_context(
          ^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 1846, in _execute_context
    return self._exec_single_context(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 1986, in _exec_single_context
    self._handle_dbapi_exception(
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 2355, in _handle_dbapi_exception
    raise sqlalchemy_exception.with_traceback(exc_info[2]) from e
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 1967, in _exec_single_context
    self.dialect.do_execute(
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\default.py", line 941, in do_execute
    cursor.execute(statement, parameters)
sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) no such column: hk6_results.year
[SQL: SELECT hk6_results.id AS hk6_results_id, hk6_results.period AS hk6_results_period, hk6_results.year AS hk6_results_year, hk6_results.no AS hk6_results_no, hk6_results.date AS hk6_results_date, hk6_results.num1 AS hk6_results_num1, hk6_results.num2 AS hk6_results_num2, hk6_results.num3 AS hk6_results_num3, hk6_results.num4 AS hk6_results_num4, hk6_results.num5 AS hk6_results_num5, hk6_results.num6 AS hk6_results_num6, hk6_results.special AS hk6_results_special, hk6_results.snowball_code AS hk6_results_snowball_code, hk6_results.snowball_name AS hk6_results_snowball_name, hk6_results.created_at AS hk6_results_created_at, hk6_results.updated_at AS hk6_results_updated_at
FROM hk6_results ORDER BY hk6_results.no DESC, hk6_results.year DESC
 LIMIT ? OFFSET ?]
[parameters: (50, 0)]
(Background on this error at: https://sqlalche.me/e/20/e3q8)
INFO:     ::ffff:127.0.0.1:0 - "GET /api/hk6?limit=50&offset=0 HTTP/1.1" 500 Internal Server Error
ERROR:    Exception in ASGI application
Traceback (most recent call last):
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 1967, in _exec_single_context
    self.dialect.do_execute(
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\default.py", line 941, in do_execute
    cursor.execute(statement, parameters)
sqlite3.OperationalError: no such column: hk6_results.year

The above exception was the direct cause of the following exception:

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
  File "D:\Ironman\SideProject\彩票\lottery\backend\routers\hk6.py", line 40, in get_hk6_list
    items = service.get_all(
            ^^^^^^^^^^^^^^^^
  File "D:\Ironman\SideProject\彩票\lottery\backend\services\hk6_service.py", line 186, in get_all
    .all()
     ^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\orm\query.py", line 2673, in all
    return self._iter().all()  # type: ignore
           ^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\orm\query.py", line 2827, in _iter
    result: Union[ScalarResult[_T], Result[_T]] = self.session.execute(
                                                  ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\orm\session.py", line 2362, in execute
    return self._execute_internal(
           ^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\orm\session.py", line 2247, in _execute_internal
    result: Result[Any] = compile_state_cls.orm_execute_statement(
                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\orm\context.py", line 305, in orm_execute_statement
    result = conn.execute(
             ^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 1418, in execute
    return meth(
           ^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\sql\elements.py", line 515, in _execute_on_connection
    return connection._execute_clauseelement(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 1640, in _execute_clauseelement
    ret = self._execute_context(
          ^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 1846, in _execute_context
    return self._exec_single_context(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 1986, in _exec_single_context
    self._handle_dbapi_exception(
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 2355, in _handle_dbapi_exception
    raise sqlalchemy_exception.with_traceback(exc_info[2]) from e
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 1967, in _exec_single_context
    self.dialect.do_execute(
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\default.py", line 941, in do_execute
    cursor.execute(statement, parameters)
sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) no such column: hk6_results.year
[SQL: SELECT hk6_results.id AS hk6_results_id, hk6_results.period AS hk6_results_period, hk6_results.year AS hk6_results_year, hk6_results.no AS hk6_results_no, hk6_results.date AS hk6_results_date, hk6_results.num1 AS hk6_results_num1, hk6_results.num2 AS hk6_results_num2, hk6_results.num3 AS hk6_results_num3, hk6_results.num4 AS hk6_results_num4, hk6_results.num5 AS hk6_results_num5, hk6_results.num6 AS hk6_results_num6, hk6_results.special AS hk6_results_special, hk6_results.snowball_code AS hk6_results_snowball_code, hk6_results.snowball_name AS hk6_results_snowball_name, hk6_results.created_at AS hk6_results_created_at, hk6_results.updated_at AS hk6_results_updated_at
FROM hk6_results ORDER BY hk6_results.no DESC, hk6_results.year DESC
 LIMIT ? OFFSET ?]
[parameters: (50, 0)]
(Background on this error at: https://sqlalche.me/e/20/e3q8)
INFO:     ::ffff:127.0.0.1:0 - "GET /api/hk6?limit=50&offset=0 HTTP/1.1" 500 Internal Server Error
ERROR:    Exception in ASGI application
Traceback (most recent call last):
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 1967, in _exec_single_context
    self.dialect.do_execute(
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\default.py", line 941, in do_execute
    cursor.execute(statement, parameters)
sqlite3.OperationalError: no such column: hk6_results.year

The above exception was the direct cause of the following exception:

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
  File "D:\Ironman\SideProject\彩票\lottery\backend\routers\hk6.py", line 40, in get_hk6_list
    items = service.get_all(
            ^^^^^^^^^^^^^^^^
  File "D:\Ironman\SideProject\彩票\lottery\backend\services\hk6_service.py", line 186, in get_all
    .all()
     ^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\orm\query.py", line 2673, in all
    return self._iter().all()  # type: ignore
           ^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\orm\query.py", line 2827, in _iter
    result: Union[ScalarResult[_T], Result[_T]] = self.session.execute(
                                                  ^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\orm\session.py", line 2362, in execute
    return self._execute_internal(
           ^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\orm\session.py", line 2247, in _execute_internal
    result: Result[Any] = compile_state_cls.orm_execute_statement(
                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\orm\context.py", line 305, in orm_execute_statement
    result = conn.execute(
             ^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 1418, in execute
    return meth(
           ^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\sql\elements.py", line 515, in _execute_on_connection
    return connection._execute_clauseelement(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 1640, in _execute_clauseelement
    ret = self._execute_context(
          ^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 1846, in _execute_context
    return self._exec_single_context(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 1986, in _exec_single_context
    self._handle_dbapi_exception(
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 2355, in _handle_dbapi_exception
    raise sqlalchemy_exception.with_traceback(exc_info[2]) from e
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\base.py", line 1967, in _exec_single_context
    self.dialect.do_execute(
  File "C:\Users\33680\AppData\Local\Programs\Python\Python312\Lib\site-packages\sqlalchemy\engine\default.py", line 941, in do_execute
    cursor.execute(statement, parameters)
sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) no such column: hk6_results.year
[SQL: SELECT hk6_results.id AS hk6_results_id, hk6_results.period AS hk6_results_period, hk6_results.year AS hk6_results_year, hk6_results.no AS hk6_results_no, hk6_results.date AS hk6_results_date, hk6_results.num1 AS hk6_results_num1, hk6_results.num2 AS hk6_results_num2, hk6_results.num3 AS hk6_results_num3, hk6_results.num4 AS hk6_results_num4, hk6_results.num5 AS hk6_results_num5, hk6_results.num6 AS hk6_results_num6, hk6_results.special AS hk6_results_special, hk6_results.snowball_code AS hk6_results_snowball_code, hk6_results.snowball_name AS hk6_results_snowball_name, hk6_results.created_at AS hk6_results_created_at, hk6_results.updated_at AS hk6_results_updated_at
FROM hk6_results ORDER BY hk6_results.no DESC, hk6_results.year DESC
 LIMIT ? OFFSET ?]
[parameters: (50, 0)]
(Background on this error at: https://sqlalche.me/e/20/e3q8)
INFO:     ::ffff:127.0.0.1:0 - "POST /api/betting/user/sync HTTP/1.1" 200 OK

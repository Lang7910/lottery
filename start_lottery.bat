@echo off
chcp 65001
echo ==========================================
echo       正在启动彩票分析系统...
echo ==========================================

:: 1. 启动后端 (打开新窗口)
echo [1/3] 正在启动后端服务 (Port: 8000)...
start "Lottery Backend" cmd /k "cd backend && python main.py"

:: 2. 启动前端 (打开新窗口)
echo [2/3] 正在启动前端服务 (Port: 3000)...
start "Lottery Frontend" cmd /k "cd web && npm run dev"

:: 3. 等待服务启动并打开浏览器
echo [3/3] 等待服务初始化 (5秒)...
timeout /t 5 >nul

echo 正在打开浏览器: http://localhost:3000
start http://localhost:3000

echo ==========================================
echo       启动完成！请不要关闭弹出的黑框窗口
echo ==========================================
pause

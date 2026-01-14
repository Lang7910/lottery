#!/bin/bash

# 设置日志文件
LOG_FILE="deploy.log"

# 输出日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "====== 开始部署 ======"

# 1. 强制同步代码
log "1. 正在同步最新代码..."
git fetch --all
if git reset --hard origin/main; then
    log "代码同步成功"
else
    log "错误: 代码同步失败"
    exit 1
fi

# 2. 停止当前服务 (释放内存)
# 对于小内存服务器，先停止服务再构建可以避免内存不足导致卡死
log "2. 正在停止旧容器以释放资源..."
docker-compose down

# 3. 重新构建并启动
log "3. 正在重新构建并启动容器..."
if docker-compose up -d --build --remove-orphans; then
    log "容器启动成功"
else
    log "错误: 容器启动失败"
    exit 1
fi

# 4. 清理未使用的镜像
log "4. 正在清理旧镜像..."
docker image prune -f | tee -a "$LOG_FILE"

log "====== 部署完成 ======"
log ""

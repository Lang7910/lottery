#!/bin/bash

# 设置日志文件
LOG_FILE="deploy.log"

# 输出日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "====== 开始部署 ======"

# 1. 拉取最新代码
log "1. 正在拉取最新代码..."
if git pull; then
    log "代码拉取成功"
else
    log "错误: 代码拉取失败，请检查 git 状态"
    exit 1
fi

# 2. 重新构建并启动容器
# --build: 强制重新构建镜像
# -d: 后台运行
# --remove-orphans: 清理 docker-compose.yml 中不再定义的服务
log "2. 正在重新构建并启动容器..."
if docker-compose up -d --build --remove-orphans; then
    log "容器启动成功"
else
    log "错误: 容器启动失败"
    exit 1
fi

# 3. 清理未使用的镜像
# 为了节省磁盘空间，清理掉构建过程中产生的虚悬镜像 (dangling images)
log "3. 正在清理旧镜像..."
docker image prune -f | tee -a "$LOG_FILE"

log "====== 部署完成 ======"
log ""

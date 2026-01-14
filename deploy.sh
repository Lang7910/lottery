#!/bin/bash

# 设置日志文件
LOG_FILE="deploy.log"

# 输出日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "====== 开始部署 ======"

# 1. 强制同步代码 (使用 reset --hard 确保与远程仓库完全一致)
# 注意：这会丢弃本地未提交的修改，但不会删除未被 git 追踪的文件（如 .env, lottery.db）
log "1. 正在同步最新代码..."
git fetch --all
if git reset --hard origin/main; then
    log "代码同步成功"
else
    log "错误: 代码同步失败"
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

# 🎲 彩票分析系统

一个功能丰富的彩票数据分析与号码预测系统，支持**双色球(SSQ)**和**大乐透(DLT)**。

![Tech](https://img.shields.io/badge/Next.js-14-black) ![Tech](https://img.shields.io/badge/FastAPI-green) ![Tech](https://img.shields.io/badge/TypeScript-blue) ![Tech](https://img.shields.io/badge/Clerk-auth-purple)

---

## ✨ 功能特性

### 📊 数据管理
- 官方数据源自动爬取
- 增量同步 / 全量刷新
- 分页浏览、日期/期号筛选

### 📈 数据分析
- 位置频率统计
- 热力图可视化
- 走势图分析

### 🔮 号码推荐
- **时间序列预测**: MA / ES / RF / SVR / ARIMA
- **杀号策略**: 17种红球 + 6种蓝球规则
- **玄学预测**: 八字五行、梅花易数、六十甲子等
- **综合推荐**: 多源融合、权重可调

### 🌙 玄学预测系统
独创"**天时·地利·人和**"三才模型：

| 三才 | 说明 |
|-----|------|
| 天时 | 开奖时间 → 八字干支 → 五行旺衰 |
| 地利 | 购彩地点 → 方位五行 |
| 人和 | 出生信息 → 财星/命卦 |

**6种预测方法**可独立或组合使用：
- 八字五行法 / 本命财星法 / 刑冲合害校验
- 命卦空间法 / 梅花易数法 / 六十甲子周期法

### 🎰 投注中心 ⭐ NEW
- **号码收藏**: 一键收藏推荐号码
- **批量操作**: 勾选、调整倍数、批量投注/删除
- **投注面板**: 单式 / 复式 / 胆拖
- **注数计算**: 实时计算金额
- **投注记录**: 历史查看、开奖核对
- **中奖判定**: 一二等奖🎉大奖标记

---

## 🚀 快速开始

### 方式一：Docker 部署（推荐）

```bash
# 1. 克隆项目
git clone <repo-url>
cd lottery

# 2. 一键启动
docker-compose up -d

# 3. 访问 http://localhost:3000
```

停止服务：
```bash
docker-compose down
```

### 方式二：本地开发

#### 环境要求
- Python 3.10+
- Node.js 18+

#### 安装与运行

```bash
# 1. 克隆项目
git clone <repo-url>
cd lottery

# 2. 启动后端
cd backend
pip install -r requirements.txt
python main.py

# 3. 启动前端 (新终端)
cd web
npm install
npm run dev

# 4. 访问 http://localhost:3000
```

---

## 📁 项目结构

```
lottery/
├── backend/                 # FastAPI 后端
│   ├── main.py              # 应用入口
│   ├── routers/             # API 路由
│   │   ├── analysis.py      # 分析与预测
│   │   └── betting.py       # 投注与收藏
│   ├── services/            # 业务逻辑
│   │   ├── prediction_service.py   # 时序预测
│   │   ├── kill_service.py         # 杀号策略
│   │   ├── metaphysical_service.py # 玄学预测
│   │   └── betting_service.py      # 投注服务
│   └── models/              # 数据模型
│       ├── bet.py           # 投注/收藏
│       └── user.py          # 用户
├── web/                     # Next.js 前端
│   ├── app/                 # 页面路由
│   │   ├── sign-in/         # 登录页
│   │   └── sign-up/         # 注册页
│   └── components/          # UI组件
│       ├── BettingPanel.tsx      # 投注面板
│       ├── WatchlistManager.tsx  # 收藏管理
│       ├── BetHistory.tsx        # 投注记录
│       └── ComprehensiveRecommendation.tsx
├── method.md                # 玄学方法论 (基础)
└── method2.md               # 玄学方法论 (进阶)
```

---

## 🔌 API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/ssq/` | GET | 双色球历史数据 |
| `/api/dlt/` | GET | 大乐透历史数据 |
| `/api/analysis/{lottery}/recommend` | GET | 时序推荐 |
| `/api/analysis/{lottery}/kill` | GET | 杀号分析 |
| `/api/analysis/{lottery}/metaphysical` | POST | 玄学预测 |
| `/api/betting/watchlist` | GET/POST | 收藏管理 |
| `/api/betting/bets` | GET/POST | 投注记录 |
| `/api/betting/calculate` | POST | 注数计算 |
| `/api/betting/check/{period}` | POST | 开奖核对 |

完整API文档: `http://localhost:8000/docs`

---

## 🎨 界面预览

- 🌓 支持亮/暗主题切换
- 📱 响应式设计
- ⚡ 丰富动效
- 🔐 Clerk 用户认证

---

## 📝 开发说明

详见 [AGENTS.md](./AGENTS.md)

---

## ⚠️ 免责声明

本项目仅供学习和娱乐目的，**不构成任何投注建议**。彩票是随机事件，任何预测方法都无法保证中奖。请理性购彩，量力而行。

---

## 📄 License

MIT


# 彩票分析系统 - 项目指南

## 项目概述
一个完整的彩票数据分析与号码预测系统，支持双色球(SSQ)和大乐透(DLT)两种彩票。

## 技术栈
- **前端**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **后端**: FastAPI + SQLAlchemy + SQLite
- **数据源**: 官方彩票API爬取

---

## 项目结构

```
lottery/
├── backend/                 # FastAPI 后端
│   ├── main.py              # 应用入口
│   ├── config.py            # 配置（数据库、API端点）
│   ├── database.py          # SQLAlchemy 数据库配置
│   ├── models/              # ORM 模型
│   │   ├── ssq.py           # 双色球数据模型
│   │   └── dlt.py           # 大乐透数据模型
│   ├── schemas/             # Pydantic 验证模型
│   ├── routers/             # API 路由
│   │   ├── ssq.py           # 双色球 CRUD API
│   │   ├── dlt.py           # 大乐透 CRUD API
│   │   └── analysis.py      # 统计分析 + 预测 API
│   ├── services/            # 业务服务
│   │   ├── ssq_service.py   # 双色球同步服务
│   │   ├── dlt_service.py   # 大乐透同步服务
│   │   ├── ssq_analysis.py  # 双色球分析服务
│   │   ├── dlt_analysis.py  # 大乐透分析服务
│   │   └── prediction_service.py  # 时间序列预测服务
│   └── sources/             # 数据源（爬虫）
│       └── scraper/
├── web/                     # Next.js 前端
│   ├── app/
│   │   ├── layout.tsx       # 根布局（主题提供者）
│   │   ├── page.tsx         # 主页面（路由控制）
│   │   └── globals.css      # 全局样式
│   ├── components/
│   │   ├── Sidebar.tsx      # 侧边栏导航
│   │   ├── SSQPanel.tsx     # 双色球开奖结果
│   │   ├── DLTPanel.tsx     # 大乐透开奖结果
│   │   ├── SSQBasicAnalysis.tsx   # 双色球基础分析
│   │   ├── DLTBasicAnalysis.tsx   # 大乐透基础分析
│   │   ├── SSQTrendAnalysis.tsx   # 双色球走势分析
│   │   ├── DLTTrendAnalysis.tsx   # 大乐透走势分析
│   │   ├── SSQPrediction.tsx      # 双色球预测
│   │   ├── DLTPrediction.tsx      # 大乐透预测
│   │   ├── ThemeToggle.tsx  # 主题切换
│   │   └── ThemeProvider.tsx
│   └── lib/utils.ts         # 工具函数 + API配置
├── refer/                   # 参考脚本（独立Python）
└── lottery.db               # SQLite 数据库
```

---

## 开发命令

### 后端 (从 `backend/` 目录)
```bash
pip install -r requirements.txt   # 安装依赖
python main.py                    # 启动服务 (默认 8000 端口)
```

### 前端 (从 `web/` 目录)
```bash
npm install                       # 安装依赖
npm run dev                       # 开发服务器 (默认 3000 端口)
npm run build                     # 生产构建
npm run lint                      # ESLint 检查
```

---

## 核心功能

### 1. 开奖结果
- 数据同步与展示
- 分页、筛选（期号范围、日期范围）
- 数据刷新/增量同步

### 2. 数据分析
- **基础分析**: 位置频率统计、热力图、分布图
- **走势分析**: 各位置号码走势折线图（小倍数布局）

### 3. 号码推荐
- **时间序列预测**: MA、ES、RF、SVR、ARIMA
- **参数可调**: 窗口大小、平滑系数、树数量等
- **多组推荐**: 支持3/5/10注
- **聚合方法**: 多数投票、平均法、加权平均

---

## API 端点

### 双色球 `/api/ssq/`
| 端点 | 方法 | 描述 |
|------|------|------|
| `/list` | GET | 获取历史数据 |
| `/sync` | POST | 增量同步 |
| `/refresh` | POST | 全量刷新 |

### 大乐透 `/api/dlt/`
同上结构

### 分析 `/api/analysis/`
| 端点 | 方法 | 描述 |
|------|------|------|
| `/ssq/frequency` | GET | 位置频率统计 |
| `/ssq/trend` | GET | 走势数据 |
| `/ssq/predict` | GET | 单方法预测 |
| `/ssq/recommend` | GET | 多组推荐 |
| `/dlt/*` | GET | 大乐透同上 |

---

## 导航状态管理
使用 URL 查询参数持久化状态：
- `section`: results / analysis / prediction
- `tab`: basic / trend
- `ptab`: timeseries
- `type`: ssq / dlt

---

## 待开发功能
- [ ] 杀号策略（红球/蓝球杀号规则）
- [ ] LSTM 深度学习预测
- [ ] 历史命中率回测
- [ ] 用户自定义号码收藏

---

## 编码规范
- TypeScript + React: 2空格缩进，双引号，分号
- Python: PEP8 风格，类型注解
- Tailwind CSS: 按功能分组类名
- 提交信息: Conventional Commits 格式

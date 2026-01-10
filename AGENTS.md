# 彩票分析系统 - 项目指南

## 项目概述
一个完整的彩票数据分析与号码预测系统，支持双色球(SSQ)和大乐透(DLT)两种彩票。

## 技术栈
- **前端**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Clerk 认证
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
│   │   ├── dlt.py           # 大乐透数据模型
│   │   ├── bet.py           # 投注与收藏模型
│   │   └── user.py          # 用户模型
│   ├── schemas/             # Pydantic 验证模型
│   ├── routers/             # API 路由
│   │   ├── ssq.py           # 双色球 CRUD API
│   │   ├── dlt.py           # 大乐透 CRUD API
│   │   ├── analysis.py      # 统计分析 + 预测 + 玄学 API
│   │   └── betting.py       # 投注与收藏 API
│   ├── services/            # 业务服务
│   │   ├── ssq_service.py   # 双色球同步服务
│   │   ├── dlt_service.py   # 大乐透同步服务
│   │   ├── ssq_analysis.py  # 双色球分析服务
│   │   ├── dlt_analysis.py  # 大乐透分析服务
│   │   ├── prediction_service.py  # 时间序列预测服务
│   │   ├── kill_service.py  # 杀号分析服务
│   │   ├── metaphysical_service.py  # 玄学预测服务
│   │   └── betting_service.py  # 投注与收藏服务
│   └── sources/             # 数据源（爬虫）
├── web/                     # Next.js 前端
│   ├── app/
│   │   ├── layout.tsx       # 根布局（Clerk + 主题）
│   │   ├── page.tsx         # 主页面（路由控制）
│   │   ├── sign-in/         # 登录页
│   │   ├── sign-up/         # 注册页
│   │   └── globals.css      # 全局样式
│   ├── components/
│   │   ├── Sidebar.tsx      # 侧边栏导航
│   │   ├── SSQPanel.tsx     # 双色球开奖结果
│   │   ├── DLTPanel.tsx     # 大乐透开奖结果
│   │   ├── SSQBasicAnalysis.tsx   # 双色球基础分析
│   │   ├── DLTBasicAnalysis.tsx   # 大乐透基础分析
│   │   ├── SSQTrendAnalysis.tsx   # 双色球走势分析
│   │   ├── DLTTrendAnalysis.tsx   # 大乐透走势分析
│   │   ├── SSQPrediction.tsx      # 双色球时序预测
│   │   ├── DLTPrediction.tsx      # 大乐透时序预测
│   │   ├── SSQKillAnalysis.tsx    # 双色球杀号分析
│   │   ├── MetaphysicalPrediction.tsx  # 玄学预测
│   │   ├── ComprehensiveRecommendation.tsx  # 综合推荐
│   │   ├── BettingPanel.tsx       # 投注面板（单式/复式/胆拖）
│   │   ├── WatchlistManager.tsx   # 收藏管理（批量操作）
│   │   ├── BetHistory.tsx         # 投注记录与开奖
│   │   ├── AddToWatchlist.tsx     # 添加收藏按钮
│   │   ├── ThemeToggle.tsx        # 主题切换
│   │   └── ThemeProvider.tsx
│   └── lib/utils.ts         # 工具函数 + API配置
├── method.md                # 玄学预测方法论 (基础)
├── method2.md               # 玄学预测方法论 (进阶)
├── docker-compose.yml       # Docker 部署配置
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
```

---

## 核心功能

### 1. 开奖结果
- 数据同步与展示
- 分页、筛选（期号范围、日期范围）
- 数据刷新/增量同步

### 2. 数据分析
- **基础分析**: 位置频率统计、热力图、分布图
- **走势分析**: 各位置号码走势折线图

### 3. 号码推荐
- **时间序列预测**: MA、ES、RF、SVR、ARIMA
- **参数可调**: 窗口大小、平滑系数、树数量等
- **多组推荐**: 支持3/5/10注
- **聚合方法**: 多数投票、平均法、加权平均

### 4. 杀号策略
- **红球杀号**: 17种杀号规则（极距杀号、AC值杀号等）
- **蓝球杀号**: 6种杀号规则
- **综合杀号**: 多种策略投票
- **自定义回看期数**: 20-2000期

### 5. 玄学预测
基于中国传统术数的多方法预测系统，引入"天时·地利·人和"三才模型。

#### 三才输入
| 三才 | 输入项 | 说明 |
|-----|------|------|
| 天时 | 开奖时间 | 自动计算或自定义 |
| 地利 | 省市选择 | 购彩地点→方位五行 |
| 人和 | 出生日期/时辰/性别 | 计算财星/命卦 |

#### 6种预测方法
| 方法 | 原理 | 必需输入 |
|-----|------|---------| 
| 八字五行法 | 开奖时间干支→五行旺衰→河图数 | 天时 |
| 本命财星法 | 日主五行→我克者为财 | 人和 |
| 刑冲合害校验 | 生肖与日支冲合检测 | 天时+人和 |
| 命卦空间法 | 八宅法方位吉凶 | 人和+地利 |
| 梅花易数法 | 时间戳起卦→体用生克 | — |
| 六十甲子周期法 | 干支周期共振 | 天时 |

### 6. 综合推荐
- 融合时序预测、杀号策略、玄学预测
- 权重可调
- 智能评分排序

### 7. 投注中心 ⭐ NEW
- **收藏管理**: 收藏推荐号码，批量选择/删除/投注
- **投注面板**: 单式/复式/胆拖三种投注方式
- **注数计算**: 实时计算注数与金额
- **投注记录**: 查看历史投注与开奖结果
- **开奖核对**: 自动核对中奖情况，一二等奖显示🎉大奖

---

## API 端点

### 双色球 `/api/ssq/`
| 端点 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 获取历史数据 |
| `/sync` | POST | 增量同步 |
| `/fetch` | POST | 按条件获取并保存 |

### 大乐透 `/api/dlt/`
同上结构

### 分析 `/api/analysis/`
| 端点 | 方法 | 描述 |
|------|------|------|
| `/ssq/frequency` | GET | 位置频率统计 |
| `/ssq/trend` | GET | 走势数据 |
| `/ssq/predict` | GET | 单方法预测 |
| `/ssq/recommend` | GET | 多组推荐 |
| `/ssq/kill` | GET | 杀号分析 |
| `/{lottery}/metaphysical` | POST | 玄学预测 (多方法) |
| `/{lottery}/metaphysical` | GET | 玄学预测 (简单) |

### 投注 `/api/betting/`
| 端点 | 方法 | 描述 |
|------|------|------|
| `/watchlist` | GET/POST | 收藏列表 |
| `/watchlist/{id}` | PUT/DELETE | 更新/删除收藏 |
| `/bets` | GET/POST | 投注记录 |
| `/calculate` | POST | 计算注数金额 |
| `/stats` | GET | 用户统计 |
| `/check/{period}` | POST | 核对开奖 |

---

## 中奖规则

### 双色球
| 等级 | 中奖条件 | 奖金 |
|-----|---------|-----|
| 一等奖 | 6红+1蓝 | 浮动 |
| 二等奖 | 6红 | 浮动 |
| 三等奖 | 5红+1蓝 | ¥3000 |
| 四等奖 | 5红 / 4红+1蓝 | ¥200 |
| 五等奖 | 4红 / 3红+1蓝 | ¥10 |
| 六等奖 | 2红+1蓝 / 1红+1蓝 / 0红+1蓝 | ¥5 |

### 大乐透
| 等级 | 中奖条件 | 奖金 |
|-----|---------|-----|
| 一等奖 | 5前+2后 | 浮动 |
| 二等奖 | 5前+1后 | 浮动 |
| 三等奖 | 5前 | ¥10000 |
| 四等奖 | 4前+2后 | ¥3000 |
| ... | ... | ... |

---

## 导航状态管理
使用 URL 查询参数持久化状态：
- `section`: results / analysis / prediction / betting
- `tab`: basic / trend
- `ptab`: timeseries / kill / metaphysical / comprehensive
- `type`: ssq / dlt

---

## 编码规范
- TypeScript + React: 2空格缩进，双引号，分号
- Python: PEP8 风格，类型注解
- Tailwind CSS: 按功能分组类名
- 提交信息: Conventional Commits 格式


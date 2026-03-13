# 数字政府统一运维管理平台

> 实现"监、管、控、析、安、服"一体化管理的现代化运维平台

## 项目简介

本平台是面向数字政府建设的统一运维管理系统，整合服务门户、工单管理、资产台账、知识库、监控告警等核心功能，支持 AI 智能问答，提供完整的 IT 服务管理解决方案。

## 功能模块

### 1. 服务门户 (Portal)
- **快速提单** - 外部运维人员快速提交工单，无需登录系统
- **工单查询** - 实时查询工单状态和处理进度
- **知识库检索** - 公开知识文章检索，自助解决问题
- **服务目录** - 可视化服务分类展示

### 2. 工单管理 (Tickets)
- **工单列表** - 多维度筛选、搜索、排序
- **工单详情** - 完整的工单信息展示
- **流转历史** - 记录工单处理的每一步操作
- **数据统计** - 图表化展示工单量、状态分布、处理时效
- **自动分配** - 系统自动分配工单给处理人员

### 3. 资产台账 (Assets)
- **资产台账** - 统一管理 IT 资产信息（服务器、网络设备、应用等）
- **客户管理** - 管理委办局等客户信息
- **项目管理** - 管理各委办局项目信息
- **关联引用** - 资产信息在工单中直接引用

### 4. 服务管理 (Services)
- **服务目录管理** - 统一管理 IT 服务场景分类
- **流程配置** - 自定义变更、事件、请求、问题等流程
- **表单设计器** - 可视化表单设计，支持多种字段类型
- **表单模板** - 保存为模板供复用

### 5. 例行工作 (Scheduled Tasks)
- **定时任务** - 支持每日/每周/每月自动执行
- **自动提单** - 按预设任务自动创建工单
- **任务调度** - 后台自动调用流程进行流转

### 6. 知识库 (Knowledge)
- **文章管理** - 支持故障处理、操作指南、FAQ 等多种类型
- **版本管理** - 记录文章修改历史
- **标签分类** - 自定义标签便于检索
- **批量导入** - 支持批量导入知识文章

### 7. 监控告警 (Monitoring)
- **本地告警记录** - 接收监控系统推送的告警，支持增删改查
- **Zabbix 集成** - 对接 Zabbix API，实时展示监控数据
- **工单关联** - 告警自动创建工单并关联
- **闭环管理** - 从告警到恢复的完整闭环

### 8. AI 智能问答
- **知识库应答** - AI 机器人基于知识库回答问题
- **运维助手** - 提供故障排查建议和操作指导
- **流式响应** - 实时输出 AI 回答内容

### 9. 系统设置 (Settings)
- **用户管理** - 管理用户账户和基本信息
- **角色权限** - 支持管理员、内部人员、外部人员三种角色
- **操作日志** - 记录所有操作日志
- **个人设置** - 用户个人偏好配置

## 技术架构

### 前端技术栈
| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 16 | React 全栈框架（App Router） |
| React | 19 | 用户界面库 |
| TypeScript | 5 | 类型安全 |
| shadcn/ui | latest | 基于 Radix UI 的组件库 |
| Tailwind CSS | 4 | 原子化 CSS 框架 |
| Recharts | 2.x | 图表库 |
| Lucide React | latest | 图标库 |

### 后端技术栈
| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | 24 | 运行时环境 |
| Next.js API Routes | 16 | 后端 API |
| PostgreSQL | - | 关系型数据库 |
| Drizzle ORM | 0.45 | 数据库 ORM |
| pg | 8.x | PostgreSQL 客户端 |
| Coze SDK | 0.7.x | AI 大模型集成 |

## 项目结构

```
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API 路由
│   │   │   ├── ai/chat/          # AI 问答 API
│   │   │   ├── alerts/           # 告警管理 API
│   │   │   ├── assets/           # 资产管理 API
│   │   │   ├── auth/             # 认证 API
│   │   │   ├── dashboard/        # 仪表板 API
│   │   │   ├── forms/            # 表单 API
│   │   │   ├── notifications/    # 通知 API
│   │   │   ├── service-catalogs/ # 服务目录 API
│   │   │   ├── tickets/          # 工单 API
│   │   │   ├── users/            # 用户 API
│   │   │   ├── workflows/        # 流程 API
│   │   │   └── zabbix/           # Zabbix 集成 API
│   │   ├── assets/               # 资产管理页面
│   │   ├── help/                 # 帮助中心页面
│   │   ├── knowledge/            # 知识库页面
│   │   ├── login/                # 登录页面
│   │   ├── monitoring/           # 监控告警页面
│   │   ├── notifications/        # 通知中心页面
│   │   ├── portal/               # 服务门户页面
│   │   ├── scheduled-tasks/      # 例行工作页面
│   │   ├── search/               # 全局搜索页面
│   │   ├── services/             # 服务管理页面
│   │   ├── settings/             # 系统设置页面
│   │   └── tickets/              # 工单管理页面
│   ├── components/               # React 组件
│   │   ├── ui/                   # shadcn/ui 基础组件
│   │   ├── app-layout.tsx        # 应用布局
│   │   ├── app-sidebar.tsx       # 侧边导航
│   │   └── zabbix-dashboard.tsx  # Zabbix 仪表板
│   ├── config/                   # 配置文件
│   │   └── zabbix.ts             # Zabbix 配置
│   ├── hooks/                    # 自定义 Hooks
│   ├── lib/                      # 工具库
│   │   └── zabbix.ts             # Zabbix API 客户端
│   └── storage/                  # 存储层
│       └── database/             # 数据库相关
├── drizzle.config.ts             # Drizzle 配置
├── package.json                  # 项目配置
└── .coze                         # Coze 部署配置
```

## 页面路由

| 路由 | 说明 |
|------|------|
| `/` | 仪表板（工作概览） |
| `/login` | 登录页面 |
| `/tickets` | 工单列表 |
| `/tickets/[id]` | 工单详情 |
| `/tickets/statistics` | 工单统计 |
| `/assets` | 资产台账 |
| `/assets/customers` | 客户管理 |
| `/assets/projects` | 项目管理 |
| `/knowledge` | 知识库 |
| `/knowledge/tags` | 标签管理 |
| `/services` | 服务管理 |
| `/services/catalog` | 服务目录 |
| `/services/workflows` | 流程配置 |
| `/services/forms` | 表单模板 |
| `/scheduled-tasks` | 例行工作 |
| `/monitoring` | 监控告警 |
| `/portal` | 服务门户首页 |
| `/portal/quick-submit` | 快速提单 |
| `/portal/tickets` | 工单查询 |
| `/portal/knowledge` | 知识检索 |
| `/settings` | 系统设置 |
| `/settings/users` | 用户管理 |
| `/settings/roles` | 角色管理 |
| `/settings/logs` | 操作日志 |
| `/settings/profile` | 个人设置 |
| `/help` | 帮助中心 |
| `/notifications` | 通知中心 |
| `/search` | 全局搜索 |

## API 接口

### 认证相关
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/auth/permissions` | 获取用户权限 |

### 工单管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tickets` | 获取工单列表 |
| POST | `/api/tickets` | 创建工单 |
| GET | `/api/tickets/[id]` | 获取工单详情 |
| PUT | `/api/tickets/[id]` | 更新工单 |

### 资产管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/assets` | 获取资产列表 |
| POST | `/api/assets` | 创建资产 |
| GET | `/api/assets/[id]` | 获取资产详情 |
| PUT | `/api/assets/[id]` | 更新资产 |
| DELETE | `/api/assets/[id]` | 删除资产 |

### 告警管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/alerts` | 获取告警列表 |
| POST | `/api/alerts` | 创建告警/初始化数据/创建工单 |
| PUT | `/api/alerts` | 更新告警状态 |

### Zabbix 集成
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/zabbix?action=stats` | 获取监控统计 |
| GET | `/api/zabbix?action=problems` | 获取问题列表 |
| GET | `/api/zabbix?action=hosts` | 获取主机列表 |
| POST | `/api/zabbix` | 确认告警 |

### AI 问答
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/chat` | AI 智能问答（流式响应） |

### 其他接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard` | 仪表板数据 |
| GET | `/api/notifications` | 获取通知列表 |
| GET | `/api/users` | 获取用户列表 |
| POST | `/api/users` | 创建用户 |
| GET | `/api/roles` | 获取角色列表 |
| GET | `/api/forms` | 获取表单列表 |
| POST | `/api/forms` | 创建表单 |
| GET | `/api/service-catalogs` | 获取服务目录 |
| GET | `/api/workflows` | 获取流程列表 |
| GET | `/api/user/settings` | 获取用户设置 |
| PUT | `/api/user/password` | 修改密码 |

## 环境配置

### 必需环境变量

```bash
# 数据库配置（必需）
DATABASE_URL=postgresql://user:password@host:5432/database

# AI 配置（可选）
COZE_API_KEY=xxx
COZE_BOT_ID=xxx

# Zabbix 配置（可选）
NEXT_PUBLIC_ZABBIX_URL=http://zabbix-server/zabbix/api_jsonrpc.php
ZABBIX_USER=Admin
ZABBIX_PASSWORD=xxx
```

## 快速开始

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm dev
```

### 构建生产版本
```bash
pnpm build
```

### 启动生产服务器
```bash
pnpm start
```

### 类型检查
```bash
pnpm ts-check
```

## Docker 部署

### 方式一：一键部署（推荐）

使用 Docker Compose 一键启动完整服务栈（应用 + PostgreSQL 数据库）：

```bash
# 1. 复制环境变量配置
cp .env.example .env

# 2. 编辑 .env 文件，填入必要的配置
vim .env

# 3. 一键启动所有服务
docker-compose up -d

# 4. 查看服务状态
docker-compose ps

# 5. 查看日志
docker-compose logs -f app
```

服务启动后访问：http://localhost:5000

默认管理员账户：`admin` / `admin123`（请在生产环境中修改）

### 方式二：仅构建镜像

如果已有数据库，可单独构建应用镜像：

```bash
# 构建镜像
docker build -t ops-platform:latest .

# 运行容器
docker run -d \
  --name ops-platform \
  -p 5000:5000 \
  -e DATABASE_URL=postgresql://user:password@host:5432/ops_platform \
  -e NODE_ENV=production \
  ops-platform:latest
```

### 方式三：使用预构建镜像

```bash
# 拉取镜像（如果已推送到镜像仓库）
docker pull your-registry/ops-platform:latest

# 运行容器
docker run -d \
  --name ops-platform \
  -p 5000:5000 \
  --env-file .env \
  your-registry/ops-platform:latest
```

### Docker Compose 服务说明

| 服务 | 端口 | 说明 |
|------|------|------|
| app | 5000 | 运维管理平台应用 |
| db | 5432 | PostgreSQL 数据库 |

### 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f

# 进入应用容器
docker-compose exec app sh

# 进入数据库容器
docker-compose exec db psql -U postgres -d ops_platform

# 备份数据库
docker-compose exec db pg_dump -U postgres ops_platform > backup.sql

# 恢复数据库
cat backup.sql | docker-compose exec -T db psql -U postgres ops_platform
```

### 生产环境建议

1. **修改默认密码**：修改数据库密码和管理员密码
2. **配置 HTTPS**：使用 Nginx 反向代理并配置 SSL 证书
3. **数据持久化**：确保 `postgres_data` 卷正确挂载
4. **资源限制**：在 docker-compose.yml 中添加资源限制
5. **日志收集**：配置日志驱动收集容器日志

```yaml
# 生产环境 docker-compose.override.yml 示例
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 传统部署

本项目也支持传统部署方式，使用 `.coze` 配置文件管理：

```toml
[project]
requires = ["nodejs-24"]

[dev]
build = ["pnpm", "install"]
run = ["pnpm", "run", "dev"]

[deploy]
build = ["pnpm", "run", "build"]
run = ["pnpm", "run", "start"]
```

## 安全特性

- 双因素认证支持（短信/动态口令）
- 角色权限控制（管理员/内部人员/外部人员）
- 操作日志审计
- 符合《四川省省级政务信息化项目管理办法》安全要求
- 适合等保三级定级要求

## 许可证

内部项目，仅供授权使用。

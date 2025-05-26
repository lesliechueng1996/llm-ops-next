# LLM Ops Next

一个基于 Next.js 15 构建的现代化 LLM 运维平台。

## 技术栈

- **框架**: Next.js 15.3.2
- **语言**: TypeScript
- **UI 组件**: 
  - Shadcn
  - Tailwind CSS
- **数据库**: PostgreSQL + Drizzle ORM
- **认证**: Better Auth
- **表单处理**: React Hook Form + Zod
- **API 文档**: Swagger UI
- **代码规范**: Biome
- **包管理**: pnpm

## 功能特性

- 现代化的用户界面
- 完整的认证系统
- 数据库集成
- API 文档自动生成
- 主题切换支持
- 响应式设计

## 开始使用

### 前置要求

- Node.js (推荐最新 LTS 版本)
- pnpm
- PostgreSQL

### 安装

1. 克隆仓库
```bash
git clone [repository-url]
cd llm-ops-next
```

2. 安装依赖
```bash
pnpm install
```

3. 环境配置
创建 `.env` 文件并配置必要的环境变量。

4. 数据库迁移
```bash
pnpm db:generate
pnpm db:push
```

### 开发

```bash
pnpm dev
```

### 构建

```bash
pnpm build
```

### 生产环境运行

```bash
pnpm start
```

## 项目结构

```
├── actions/         # 服务器端操作
├── app/            # Next.js 应用路由
├── components/     # React 组件
├── lib/           # 工具函数和配置
├── public/        # 静态资源
├── schemas/       # 数据模型和验证
├── services/      # 业务逻辑服务
└── exceptions/    # 异常处理
```

## 开发命令

- `pnpm dev` - 启动开发服务器
- `pnpm build` - 构建生产版本
- `pnpm start` - 运行生产版本
- `pnpm lint` - 运行代码检查
- `pnpm lint:fix` - 自动修复代码问题
- `pnpm db:push` - 更新数据库架构
- `pnpm db:generate` - 生成数据库迁移文件
- `pnpm db:migrate` - 执行数据库迁移


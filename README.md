# LLM Ops Next

一个基于 Next.js 15 构建的现代化 LLM 运维平台。

## 技术栈

- **框架**: 
  - Next.js 15.3.2
  - React 19
- **语言**: TypeScript 5
- **UI 组件**: 
  - Shadcn (基于 Radix UI)
  - Tailwind CSS 4
- **数据库**: 
  - PostgreSQL
  - Drizzle ORM
- **认证**: Better Auth
- **表单处理**: 
  - React Hook Form
  - Zod 验证
- **API 文档**: 
  - Swagger UI
  - next-swagger-doc
- **代码规范**: Biome
- **包管理**: pnpm
- **对象存储**: 腾讯云 COS
- **AI 集成**:
  - LangChain
  - OpenAI

## 功能特性

- 现代化的用户界面
- 完整的认证系统
- 数据库集成
- API 文档自动生成
- 主题切换支持
- 响应式设计
- 用户管理功能
- 增强的 API 文档功能
- 文件上传功能
- API 工具管理
- 知识库管理
- 内置工具集成
  - 天气查询
  - IP 地址查询
  - 维基百科搜索
  - DuckDuckGo 搜索
  - DALL-E 图像生成
  - 时间查询

## API 文档

项目集成了 Swagger UI，提供了完整的 API 文档和交互式测试功能。访问 `/api-doc` 路径可以查看所有可用的 API 端点。

主要 API 端点包括：

- `/api/auth` - 认证相关接口
  - 支持 OAuth 和凭证认证
  - 会话管理
  - 用户注册和登录

- `/api/user` - 用户管理相关接口
  - `/api/user/name` - 更新用户名
  - `/api/user/password` - 修改密码
  - `/api/user/avatar` - 更新头像

- `/api/openapi` - OpenAPI 相关接口
  - `/api/openapi/chat` - 聊天功能接口
  - `/api/openapi/api-keys` - API 密钥管理

- `/api/api-tools` - API 工具管理接口
  - `/api/api-tools` - API 工具列表
  - `/api/api-tools/:providerId` - 特定提供商的 API 工具
  - `/api/api-tools/:providerId/tools/:toolName` - 特定工具详情
  - `/api/api-tools/openapi-schema/validate` - OpenAPI Schema 验证

- `/api/datasets` - 知识库管理相关接口
  - `/api/datasets` - 创建知识库和获取知识库列表
  - `/api/datasets/:datasetId` - 获取、更新和删除特定知识库

- `/api/upload-files` - 文件上传相关接口
  - `/api/upload-files/file` - 文件上传
  - `/api/upload-files/image` - 图片上传

- `/api/builtin-tools` - 内置工具相关接口
  - `/api/builtin-tools` - 获取所有内置插件列表信息
  - `/api/builtin-tools/categories` - 获取内置插件分类列表
  - `/api/builtin-tools/:provider/tools/:tool` - 获取内置工具信息

所有 API 端点都支持以下特性：
- 完整的请求参数验证
- 统一的错误处理
- 详细的 API 文档
- 支持 Swagger UI 交互式测试

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


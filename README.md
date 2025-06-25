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
- **包管理**: Bun
- **对象存储**: 腾讯云 COS
- **队列系统**: Redis + BullMQ
- **AI 集成**:
  - LangChain
  - LangGraph
  - OpenAI
  - Alibaba 通义千问（嵌入模型）
  - Weaviate（向量数据库）

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
  - 文档异步处理
  - 文档队列管理
  - 文档处理状态追踪
  - 关键词自动抽取（基于 nodejieba）
  - 支持 Weaviate 向量存储与检索
  - 文本分割与清洗（可自定义分隔符/分块/重叠）
  - 数据集查询记录追踪
  - 数据集召回测试（支持 full_text/semantic/hybrid 检索）
  - 异步数据集删除任务
- 内置工具集成
  - 天气查询
  - IP 地址查询
  - 维基百科搜索
  - DuckDuckGo 搜索
  - DALL-E 图像生成
  - 时间查询
- AI 应用调试功能
  - 实时流式调试对话
  - 任务中断和资源清理
  - 代理思考过程记录
  - 长期记忆管理
  - 数据集查询记录追踪
  - 应用发布管理
  - 发布历史记录
  - 发布回滚功能
  - 智能问题建议
- 队列管理系统
  - 文档处理队列
  - 数据集处理队列
  - 异步任务管理
  - 任务状态追踪

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

- `/api/apps` - 应用管理相关接口
  - `/api/apps` - 创建应用和获取应用列表
  - `/api/apps/:appId` - 获取、更新和删除特定应用
  - `/api/apps/:appId/copy` - 复制现有应用
  - `/api/apps/:appId/draft-app-config` - 获取和更新应用的草稿配置信息
  - `/api/apps/:appId/summary` - 获取和更新应用的调试长记忆内容
  - `/api/apps/:appId/conversations` - 应用调试对话（流式事件响应）
  - `/api/apps/:appId/conversations/debug` - 应用调试对话接口
  - `/api/apps/:appId/conversations/messages` - 获取对话消息历史
  - `/api/apps/:appId/conversations/tasks/:taskId/stop` - 停止应用调试对话任务
  - `/api/apps/:appId/publish` - 发布应用
  - `/api/apps/:appId/publish/cancel` - 取消发布
  - `/api/apps/:appId/publish/fallback` - 发布回滚
  - `/api/apps/:appId/publish/histories` - 获取发布历史

- `/api/ai` - AI 相关接口
  - `/api/ai/suggested-questions` - 获取智能问题建议
  - `/api/ai/optimize-prompt` - 提示词优化

- `/api/openapi` - OpenAPI 相关接口
  - `/api/openapi/chat` - 聊天功能接口
  - `/api/openapi/api-keys` - API 密钥管理
  - `/api/openapi/api-keys/:id` - 管理特定 API 密钥
  - `/api/openapi/api-keys/:id/is-active` - 更新 API 密钥激活状态

- `/api/api-tools` - API 工具管理接口
  - `/api/api-tools` - API 工具列表
  - `/api/api-tools/:providerId` - 特定提供商的 API 工具
  - `/api/api-tools/:providerId/tools/:toolName` - 特定工具详情
  - `/api/api-tools/openapi-schema/validate` - OpenAPI Schema 验证

- `/api/datasets` - 知识库管理相关接口
  - `/api/datasets` - 创建知识库和获取知识库列表
  - `/api/datasets/:datasetId` - 获取、更新和删除特定知识库
  - `/api/datasets/:datasetId/documents` - 获取知识库下的文档列表，支持文档名称模糊搜索和分页
  - `/api/datasets/:datasetId/documents/:documentId` - 获取特定文档的详细信息
  - `/api/datasets/:datasetId/documents/:documentId/name` - 更新文档名称
  - `/api/datasets/:datasetId/documents/:documentId/enabled` - 更新文档启用状态
  - `/api/datasets/:datasetId/documents/:documentId/segments` - 获取文档片段列表，支持分页和搜索
  - `/api/datasets/:datasetId/documents/:documentId/segments/:segmentId` - 获取、更新和删除特定文档片段
  - `/api/datasets/:datasetId/documents/:documentId/segments/:segmentId/enabled` - 更新文档片段启用状态
  - `/api/datasets/:datasetId/documents/batch/:batchId` - 查询文档批处理进度
  - `/api/datasets/:datasetId/queries` - 获取知识库最近的查询记录列表（最近10条）
  - `/api/datasets/:datasetId/hit` - 知识库召回测试，支持 full_text/semantic/hybrid 检索

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

- Bun
- PostgreSQL
- Redis

### 安装

1. 克隆仓库
```bash
git clone [repository-url]
cd llm-ops-next
```

2. 安装依赖
```bash
bun install
```

3. 环境配置
创建 `.env` 文件并配置必要的环境变量。

**主要环境变量示例：**
- `WEAVIATE_HOST`/`WEAVIATE_PORT`：Weaviate 服务地址与端口
- `REDIS_HOST`/`REDIS_PORT`/`REDIS_DB`/`REDIS_QUEUE_DB`：Redis 配置
- `ALIYUN_TONGYI_API_KEY`：阿里云通义千问 API Key（用于嵌入）
- 其他见 `.env.example`

4. 数据库迁移
```bash
bun run db:generate
bun run db:push
```

5. 启动队列工作进程
```bash
bun run worker
```

### 开发

```bash
bun --bun run dev
```

### 构建

```bash
bun run build
```

### 生产环境运行

```bash
bun run start
```

## 项目结构

```
├── actions/         # 服务器端操作
├── app/            # Next.js 应用路由
├── components/     # React 组件
├── lib/           # 工具函数和配置
│   ├── agent/           # AI 代理相关功能
│   │   ├── entity.ts           # 代理实体定义
│   │   ├── event-processor.ts  # 事件处理器
│   │   ├── function-call-agent.ts # 函数调用代理
│   │   └── helper.ts           # 代理辅助函数
│   ├── embedding/         # 嵌入与缓存模块（阿里云+Redis）
│   ├── vector-store/      # Weaviate 向量存储集成
│   ├── keyword/           # 关键词抽取模块
│   ├── text-splitter/     # 文本分割与清洗
│   ├── memory/            # 记忆管理模块
│   ├── queues/            # 队列管理
│   │   ├── dataset-queue.ts    # 数据集队列
│   │   ├── document-queue.ts   # 文档队列
│   │   └── queue-name.ts       # 队列名称定义
│   ├── retriever/         # 检索器模块
│   │   ├── full-text-retriever.ts # 全文检索
│   │   ├── semantic-retriever.ts  # 语义检索
│   │   └── index.ts              # 检索器入口
│   └── ...
├── public/        # 静态资源
├── schemas/       # 数据模型和验证
├── services/      # 业务逻辑服务
├── workers/       # 队列工作进程
│   ├── dataset-worker.ts  # 数据集处理工作进程
│   └── document-worker.ts # 文档处理工作进程
└── exceptions/    # 异常处理
```

## 开发命令

- `bun --bun run dev` - 启动开发服务器
- `bun run build` - 构建生产版本
- `bun run start` - 运行生产版本
- `bun run lint` - 运行代码检查
- `bun run lint:fix` - 自动修复代码问题
- `bun run db:push` - 更新数据库架构
- `bun run db:generate` - 生成数据库迁移文件
- `bun run db:migrate` - 执行数据库迁移
- `bun run worker` - 启动队列工作进程

## Docker 部署

使用 Docker Compose 快速部署：

```bash
docker compose up -d
```

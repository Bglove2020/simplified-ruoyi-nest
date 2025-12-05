# RuoYi-Nest 项目文档

基于 NestJS 11 + TypeScript 5.7 + TypeORM 0.3 + MySQL 8 + class-validator + class-transformer + JWT + Pino 日志系统 构建的企业级服务端后台管理系统，采用模块化分层架构，支持 RBAC 权限、数据校验、结构化日志与多环境配置，适合中后台场景与前后端分离项目协作开发。

## 目录

- [1. 项目技术选型](#1-项目技术选型)
- [2. 项目主要功能介绍](#2-项目主要功能介绍)
- [3. 各种技术在项目中的主要用途](#3-各种技术在项目中的主要用途)
- [4. 项目目录结构介绍](#4-项目目录结构介绍)
- [5. 项目开发规范介绍](#5-项目开发规范介绍)
- [6. 主要功能实现介绍](#6-主要功能实现介绍)

---

## 1. 项目技术选型

### 核心框架

- **NestJS** (v11.0.1): 基于 TypeScript 的 Node.js 企业级框架，采用模块化架构
- **TypeScript** (v5.7.3): 提供类型安全和更好的开发体验

### 数据库与 ORM

- **TypeORM** (v0.3.27): 强大的 TypeScript ORM 框架
- **MySQL2** (v3.15.2): MySQL 数据库驱动

### 认证与安全

- **@nestjs/jwt** (v11.0.1): JWT 令牌生成与验证
- **bcryptjs** (v3.0.2): 密码加密哈希

### 数据验证与转换

- **class-validator** (v0.14.2): 基于装饰器的 DTO 验证
- **class-transformer** (v0.5.1): 对象转换与序列化

### 日志系统

- **pino** (v9.5.0): 高性能 JSON 日志库
- **pino-pretty** (v13.0.0): 日志美化输出
- **pino-roll** (v4.0.0): 日志文件滚动管理

### 配置管理

- **@nestjs/config** (v4.0.2): 环境变量与配置管理

### 工具库

- **cookie-parser** (v1.4.7): Cookie 解析中间件
- **sql-formatter** (v15.6.10): SQL 语句格式化

### 开发工具

- **ESLint** (v9.18.0): 代码质量检查
- **Prettier** (v3.4.2): 代码格式化
- **Jest** (v30.0.0): 单元测试框架
- **supertest** (v7.0.0): HTTP 断言测试

---

## 2. 项目主要功能介绍

### 2.1 认证模块 (Auth)

- **用户注册**: 支持新用户注册，密码自动加密存储
- **用户登录**: JWT 双令牌机制（Access Token + Refresh Token）
- **令牌刷新**: 基于 Cookie 的 Refresh Token 自动刷新机制
- **用户退出**: 清除 Refresh Token Cookie
- **用户信息获取**: 获取当前登录用户的基本信息
- **路由菜单获取**: 根据用户权限获取前端路由配置
- **侧边栏菜单获取**: 获取用户可访问的侧边栏菜单树

### 2.2 用户管理模块 (User)

- **用户列表查询**: 获取所有用户列表
- **用户创建**: 创建新用户，支持角色和部门关联
- **用户查询**: 根据公开 ID 查询用户详情
- **账号检查**: 检查账号是否已存在
- **用户更新**: 更新用户信息
- **密码重置**: 管理员重置用户密码
- **用户删除**: 删除指定用户

### 2.3 角色管理模块 (Role)

- **角色列表**: 获取所有角色列表
- **角色创建**: 创建新角色，支持菜单权限关联
- **角色更新**: 更新角色信息和权限
- **角色删除**: 删除指定角色

### 2.4 菜单管理模块 (Menu)

- **菜单列表**: 获取树形结构的菜单列表
- **菜单创建**: 创建菜单项，支持父子关系
- **菜单查询**: 根据 ID 查询菜单详情
- **菜单更新**: 更新菜单信息
- **菜单删除**: 删除指定菜单

### 2.5 部门管理模块 (Dept)

- **部门列表**: 获取树形结构的部门列表
- **部门创建**: 创建部门，支持父子层级关系
- **部门更新**: 更新部门信息
- **部门删除**: 删除部门（包含子部门和关联用户统计）

### 2.6 字典管理模块 (Dict)

- **字典类型管理**:
  - 字典类型列表查询
  - 字典类型创建
  - 字典类型更新
  - 字典类型删除
  - 根据类型标识查询字典类型
- **字典数据管理**:
  - 字典数据列表查询（支持按类型或字典 ID 查询）
  - 字典数据创建
  - 字典数据更新
  - 字典数据删除

### 2.7 权限控制

- **JWT 认证守卫**: 全局 JWT 令牌验证，自动加载用户权限信息
- **RBAC 权限守卫**: 基于角色和权限的访问控制
- **权限装饰器**: `@RequirePerms()` 声明接口所需权限
- **角色装饰器**: `@RequireRoles()` 声明接口所需角色
- **公开接口装饰器**: `@Public()` 标记无需认证的接口

### 2.8 日志系统

- **请求日志**: 自动记录所有 HTTP 请求和响应
- **SQL 日志**: TypeORM 查询日志，支持慢查询检测
- **异常日志**: 全局异常捕获和记录
- **日志滚动**: 按日期和大小自动滚动日志文件
- **上下文追踪**: 自动关联请求 ID 和用户 ID

### 2.9 数据库种子

- **自动初始化**: 应用启动时自动执行种子数据初始化
- **初始数据**: 创建默认管理员、角色、菜单等基础数据

---

## 3. 各种技术在项目中的主要用途

### 3.1 NestJS

- **模块化架构**: 采用模块化设计，每个功能模块独立（UserModule、RoleModule、MenuModule 等）
- **依赖注入**: 通过 DI 容器管理服务依赖关系
- **装饰器**: 使用装饰器定义路由、参数验证、权限控制等
- **守卫 (Guards)**: 实现认证和授权逻辑（JwtAuthGuard、RbacGuard）
- **过滤器 (Filters)**: 全局异常处理和错误响应格式化（AllExceptionsFilter）
- **中间件 (Middleware)**: 请求上下文管理（RequestContextMiddleware）

### 3.2 TypeORM

- **实体定义**: 通过装饰器定义数据库实体（Entity）
- **关系映射**: 支持一对一、一对多、多对多关系（用户-角色、角色-菜单等）
- **查询构建器**: 复杂查询使用 QueryBuilder（如权限查询）
- **数据迁移**: 通过 `synchronize: true` 自动同步表结构（开发环境）
- **自定义日志**: 集成项目日志系统，记录 SQL 执行和慢查询

### 3.3 JWT

- **Access Token**: 短期访问令牌，用于 API 认证（存储在请求头）
- **Refresh Token**: 长期刷新令牌，用于获取新的 Access Token（存储在 Cookie）
- **令牌验证**: JwtAuthGuard 自动验证令牌并加载用户权限信息
- **权限注入**: 将用户角色和权限信息注入到请求对象中

### 3.4 Pino 日志

- **高性能日志**: 使用 JSON 格式记录结构化日志
- **多流输出**: 同时输出到控制台（开发环境）和文件（生产环境）
- **日志格式化**: 自定义格式化流，将 JSON 日志转换为可读格式
- **日志滚动**: 使用 pino-roll 实现按日期和大小自动滚动
- **上下文注入**: 自动注入请求 ID 和用户 ID 到每条日志

### 3.5 AsyncLocalStorage (ALS)

- **请求上下文**: 在异步调用链中保持请求上下文信息
- **请求 ID 追踪**: 为每个请求生成唯一 ID，用于日志关联
- **用户信息传递**: 在服务层自动获取当前请求的用户信息
- **中间件集成**: RequestContextMiddleware 初始化请求上下文

### 3.6 class-validator & class-transformer

- **DTO 验证**: 在 Controller 层自动验证请求参数
- **类型转换**: 自动转换请求参数类型（字符串转数字等）
- **错误提示**: 验证失败时返回详细的错误信息

### 3.7 bcryptjs

- **密码加密**: 用户注册和密码重置时加密存储密码
- **密码验证**: 登录时验证密码哈希值

### 3.8 @nestjs/config

- **环境变量管理**: 统一管理数据库、日志等配置
- **配置工厂**: 通过 `registerAs` 创建配置命名空间
- **多环境支持**: 支持 `.env` 和 `.env.{NODE_ENV}` 文件

### 3.9 cookie-parser

- **Refresh Token 存储**: 将 Refresh Token 存储在 HttpOnly Cookie 中
- **安全传输**: 防止 XSS 攻击，Token 仅通过 HTTP 传输

---

## 4. 项目目录结构介绍

```
simplified-ruoyi-nest/
├── src/                          # 源代码目录
│   ├── main.ts                   # 应用入口文件，启动 Nest 应用
│   ├── app.module.ts             # 根模块，注册所有功能模块和全局配置
│   │
│   ├── auth/                     # 认证模块
│   │   ├── auth.module.ts        # 认证模块定义
│   │   ├── auth.controller.ts    # 登录、注册、刷新令牌接口
│   │   ├── auth.service.ts       # 认证业务逻辑
│   │   ├── profile.controller.ts # 用户信息、路由、菜单接口
│   │   ├── profile.service.ts    # 用户信息业务逻辑
│   │   ├── guards/               # 守卫
│   │   │   ├── jwt-auth.guard.ts # JWT 认证守卫
│   │   │   └── rbac.guard.ts     # 基于角色的权限控制守卫
│   │   ├── decorators/           # 装饰器
│   │   │   ├── perms.decorator.ts    # 权限装饰器
│   │   │   ├── roles.decorator.ts   # 角色装饰器
│   │   │   └── public.decorator.ts  # 公开接口装饰器
│   │   └── dto/                  # 数据传输对象
│   │       └── login.dto.ts      # 登录 DTO
│   │
│   ├── system/                   # 系统管理模块
│   │   ├── user/                 # 用户管理
│   │   │   ├── user.module.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── entities/         # 实体定义
│   │   │   │   └── user.entity.ts
│   │   │   ├── dto/              # DTO 定义
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   ├── update-user.dto.ts
│   │   │   │   ├── frontend-user.dto.ts
│   │   │   │   └── reset-user-password.dto.ts
│   │   │   └── mapper/           # 数据映射
│   │   │       └── user.mapper.ts
│   │   ├── role/                 # 角色管理
│   │   │   ├── role.module.ts
│   │   │   ├── role.controller.ts
│   │   │   ├── role.service.ts
│   │   │   ├── entities/
│   │   │   │   └── role.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-role.dto.ts
│   │   │   │   ├── update-role.dto.ts
│   │   │   │   └── frontend-role.dto.ts
│   │   │   └── mapper/
│   │   │       └── to-frontend-user.mapper.ts
│   │   ├── menu/                 # 菜单管理
│   │   │   ├── menu.module.ts
│   │   │   ├── menu.controller.ts
│   │   │   ├── menu.service.ts
│   │   │   ├── entities/
│   │   │   │   └── menu.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-menu.dto.ts
│   │   │   │   ├── update-menu.dto.ts
│   │   │   │   └── frontend-menu.dto.ts
│   │   │   └── mapper/
│   │   │       └── to-fronted_menu.ts
│   │   ├── dept/                 # 部门管理
│   │   │   ├── dept.module.ts
│   │   │   ├── dept.controller.ts
│   │   │   ├── dept.service.ts
│   │   │   ├── entities/
│   │   │   │   └── dept.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-dept.dto.ts
│   │   │   │   ├── update-dept.dto.ts
│   │   │   │   └── frontend-dept.dto.ts
│   │   │   └── mapper/
│   │   │       └── dept.mapper.ts
│   │   └── dict/                 # 字典管理
│   │       ├── dict.module.ts
│   │       ├── dict.controller.ts
│   │       ├── dict.service.ts
│   │       ├── entities/
│   │       │   ├── dict.entity.ts
│   │       │   └── dict-data.entity.ts
│   │       ├── dto/
│   │       │   ├── create-dict-type.dto.ts
│   │       │   ├── update-dict-type.dto.ts
│   │       │   ├── frontend-dict-type.dto.ts
│   │       │   ├── create-dict-data.dto.ts
│   │       │   ├── update-dict-data.dto.ts
│   │       │   └── frontend-dict-data.dto.ts
│   │       └── mapper/
│   │           └── dict.mapper.ts
│   │
│   ├── common/                    # 公共模块
│   │   ├── als/                  # 异步本地存储
│   │   │   ├── als.module.ts
│   │   │   ├── als.service.ts
│   │   │   └── als.constants.ts
│   │   ├── logging/              # 日志服务
│   │   │   ├── logging.module.ts
│   │   │   └── logging.service.ts
│   │   ├── filters/             # 异常过滤器
│   │   │   ├── all-exception.filter.ts
│   │   │   └── sql-exception.filter.ts
│   │   ├── middleware/          # 中间件
│   │   │   └── request-context.middleware.ts
│   │   ├── typeorm/             # TypeORM 相关
│   │   │   └── typeorm-logger.service.ts
│   │   ├── database/            # 数据库相关
│   │   │   └── database.seed.service.ts
│   │   ├── utils/               # 工具函数
│   │   │   ├── build-tree.util.ts      # 树形结构构建工具
│   │   │   └── handle-typeorm-error.util.ts  # TypeORM 错误处理
│   │   └── common/              # 公共装饰器
│   │       └── validatie-dto.decorator.ts
│   │
│   └── config/                   # 配置文件
│       ├── database.config.ts    # 数据库配置
│       └── logging.config.ts     # 日志配置
│
├── dist/                         # 编译输出目录
├── logs/                         # 日志文件目录
├── coverage/                     # 测试覆盖率报告目录
├── package.json                  # 项目依赖和脚本
├── tsconfig.json                 # TypeScript 配置
├── tsconfig.build.json           # 构建配置
├── nest-cli.json                 # Nest CLI 配置
├── eslint.config.mjs             # ESLint 配置
└── README.md                     # 项目文档
```

### 目录说明

- **src/main.ts**: 应用启动入口，配置 CORS、Cookie 解析等
- **src/app.module.ts**: 根模块，注册所有功能模块、全局守卫、过滤器、中间件
- **src/auth/**: 认证相关功能，包括登录、注册、JWT 验证、权限控制
- **src/system/**: 系统管理功能模块，每个模块包含 controller、service、entity、dto、mapper
- **src/common/**: 公共功能模块，包括日志、异常处理、中间件、工具函数等
- **src/config/**: 配置文件，使用 `@nestjs/config` 管理环境变量

---

## 5. 项目开发规范介绍

### 5.1 代码风格规范

- **缩进**: 使用 2 个空格缩进
- **引号**: 使用单引号
- **行尾**: 使用 LF 换行符
- **尾随逗号**: 对象和数组最后一个元素后添加逗号
- **TypeScript**: 严格模式，避免使用 `any`（规则关闭但不推荐使用）

### 5.2 文件命名规范

- **模块文件**: `*.module.ts`（如 `user.module.ts`）
- **控制器文件**: `*.controller.ts`（如 `user.controller.ts`）
- **服务文件**: `*.service.ts`（如 `user.service.ts`）
- **实体文件**: `*.entity.ts`（如 `user.entity.ts`）
- **DTO 文件**: `*.dto.ts`（如 `create-user.dto.ts`）
- **映射文件**: 放在 `mapper/` 目录下（如 `user.mapper.ts`）

### 5.3 Controller 返回规范

所有 Controller 接口返回统一格式：

```typescript
{
  success: boolean,    // 操作是否成功
  msg: string,        // 提示信息
  data?: any          // 返回数据（可选）
}
```

示例：

- 成功返回: `{ code: 200, msg: '操作成功', data: {...} }`
- 失败返回: `{ code: 404, msg: '资源不存在', data: null }`

### 5.4 Service 层规范

Service 层专注于业务逻辑，遵循以下规范：

1. **接收 DTO，返回 Entity/数组/数字/boolean/void**
2. **异常处理**: 使用 `try...catch` 封装所有外部依赖操作（DB、第三方 API、缓存）
3. **错误转换**: 将底层依赖错误（如 TypeORM 约束、API 401 错误）映射为语义化的 `HttpException` 并抛出
4. **业务逻辑失败**: 直接抛出语义化的 `HttpException`
5. **不记录日志**: Service 层不进行异常日志记录，只负责抛出异常
6. **异常统一处理**: 所有异常由全局异常过滤器统一处理和记录

### 5.5 模块组织规范

- 每个功能模块独立目录（如 `user/`、`role/`、`menu/`）
- 模块内按类型组织文件：`entities/`、`dto/`、`mapper/`
- 公共功能放在 `common/` 目录
- 配置相关放在 `config/` 目录

### 5.6 权限控制规范

- 使用 `@RequirePerms('system:user:list')` 声明接口所需权限
- 使用 `@RequireRoles(['admin'])` 声明接口所需角色
- 使用 `@Public()` 标记公开接口（无需认证）
- 权限标识格式: `模块:资源:操作`（如 `system:user:add`）

### 5.7 日志记录规范

- Controller 层记录请求和响应日志
- 使用 `LoggingService` 统一记录日志
- 日志自动包含请求 ID 和用户 ID（如果已登录）
- 异常由全局过滤器统一记录

---

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

创建 `.env` 文件，配置数据库连接等信息：

```env
mysql_host=localhost
mysql_port=3306
mysql_username=root
mysql_password=your_password
mysql_database=ruoyi_nest
NODE_ENV=development
LOG_DIR=./logs
LOG_LEVEL=debug
```

### 启动开发服务器

```bash
pnpm start:dev
```

### 构建生产版本

```bash
pnpm build
pnpm start:prod
```

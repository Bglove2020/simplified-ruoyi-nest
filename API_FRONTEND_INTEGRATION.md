# 前端接口对接说明（前端使用）

## 通用格式
- 请求域名：默认 `http://localhost:3000`（`main.ts` 未设置全局前缀）。
- 鉴权：除标记 Public 的接口外都需要在 Header 携带 `Authorization: Bearer <accessToken>`；AccessToken 由 `/auth/login` 返回，RefreshToken 写入 HttpOnly Cookie `refresh_token`，路径 `api/auth/refresh`，有效期 7 天。
- 成功响应：HTTP 200，业务体 `{ code: 200, msg: string, data: any }`。
- 业务失败但非异常：个别接口会在 HTTP 200 内返回 `{ code: 非200, msg: string, data: null }`（例如用户不存在时 `code:404`）。
- 异常响应：统一由 `AllExceptionsFilter` 输出，格式 `{ statusCode: number, path: string, timestamp: ISOString, message: string, ... }`，若抛出的 HttpException 携带 `msg`/`code` 等字段会一并返回。
- 异常示例：
```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "msg": "用户名或密码错误",
  "code": 400,
  "path": "/auth/login",
  "timestamp": "2024-12-02T02:12:00.000Z"
}
```

## 认证模块 /auth（Public）
### POST /auth/register
- 说明：注册新用户。
- 请求体：`account`(>=6)、`name`、`email`(邮箱格式)、`sex`('0'|'1'|'2')、`password`(>=8，需含字母/数字/特殊字符)、`deptPublicId`(UUID)、`avatar`、`rolePublicIds`(string[])。
- 成功：`{ code:200, msg:"注册成功", data:null }`。
- 异常：校验失败或数据库错误按通用异常格式返回。

### POST /auth/login
- 说明：账号密码登录，返回访问令牌并写入刷新令牌 Cookie。
- 请求体：`account`、`password`(>=6)。
- 成功：`{ code:200, msg:"登录成功", data:{ accessToken } }`，同时 Set-Cookie `refresh_token=Bearer <refreshToken>`（HttpOnly，path `api/auth/refresh`）。
- 异常：凭证错误返回 400，body 参考异常示例。

### POST /auth/refresh
- 说明：使用 Cookie 中的 RefreshToken 刷新 AccessToken。
- 请求：无体，读取 `refresh_token` Cookie（前端需携带 Cookie）。
- 成功：`{ code:200, msg:"刷新令牌成功", data:{ accessToken } }`。
- 异常：RefreshToken 无效返回 401，body 含 `msg:"刷新令牌无效"`。

## 用户模块 /system/user（除 checkUserAccount 外需鉴权）
### GET /system/user/list
- 说明：获取用户列表。
- 参数：无。
- 成功：`data` 为数组，元素字段 `publicId, account, name, email, sex, avatar, status, deptPublicId, deptName, rolePublicIds`。

### POST /system/user/create
- 说明：创建用户。
- 请求体：同注册接口（`account`、`name`、`email`、`sex`、`password`、`deptPublicId`、`avatar`、`rolePublicIds`）。
- 成功：`{ code:200, msg:"用户创建成功", data:null }`。

### GET /system/user/get/:publicId
- 说明：按公开ID获取用户。
- 路径参数：`publicId`。
- 成功：`data` 为单个用户（字段同列表）。用户不存在时 HTTP 200 但返回 `{ code:404, msg:"用户不存在", data:null }`。

### GET /system/user/checkUserAccount（Public）
- 说明：校验账号是否可用。
- Query：`account`。
- 成功：`{ code:200, msg:"账号已存在"|"账号可用", data:{ available: boolean } }`。

### POST /system/user/reset-password
- 说明：重置用户密码。
- 请求体：`publicId`、`password`（同注册密码规则）。
- 成功：`{ code:200, msg:"密码重置成功", data:null }`。

### POST /system/user/update
- 说明：更新用户信息。
- 请求体：`publicId` 必填，其余字段同创建为可选；提供 `deptPublicId` 或 `rolePublicIds` 时将同步更新部门/角色。
- 成功：`{ code:200, msg:"用户更新成功", data:null }`。

### DELETE /system/user/delete/:publicId
- 说明：按公开ID删除用户。
- 路径参数：`publicId`。
- 成功：`{ code:200, msg:"用户删除成功", data:null }`。

## 角色模块 /system/role（需鉴权）
### POST /system/role/create
- 说明：创建角色。
- 请求体：`name`、`roleKey`、`sortOrder`(number)、`dataScope`(string)、`status`(string)、`menuIds`(string[]，可选)。
- 成功：`{ code:200, msg:"角色创建成功", data:null }`。

### GET /system/role/list
- 说明：获取角色列表。
- 参数：无。
- 成功：`data` 为角色数组，字段 `publicId, name, roleKey, sortOrder, status, menuIds`。

### POST /system/role/update
- 说明：更新角色。
- 请求体：`publicId` 必填，其余字段同创建为可选；若传 `menuIds` 会整体覆盖绑定。
- 成功：`{ code:200, msg:"角色更新成功", data:null }`。

### DELETE /system/role/delete/:publicId
- 说明：删除角色（若仍关联用户会抛错）。
- 路径参数：`publicId`。
- 成功：`{ code:200, msg:"角色删除成功", data:null }`。

## 部门模块 /system/dept（需鉴权）
### POST /system/dept/create
- 说明：创建部门。
- 请求体：`name`、`parentPublicId`(UUID)、`sortOrder`(number)、`leaderPublicId`(UUID)、`status`('0'|'1')。
- 成功：`{ code:200, msg:"创建成功", data:null }`。

### GET /system/dept/list
- 说明：获取部门树。
- 参数：无。
- 成功：`data` 为树形数组，节点字段 `publicId, name, sortOrder, leaderPublicId, leaderName, leaderEmail, status, children`。

### POST /system/dept/update
- 说明：更新部门。
- 请求体：`publicId` 必填，其余字段同创建为可选；若传 `parentPublicId` 会被拒绝（不支持更换父级）。
- 成功：`{ code:200, msg:"更新成功", data:null }`。

### DELETE /system/dept/delete?publicId=...
- 说明：删除部门及子部门，并软删关联用户。
- Query：`publicId`。
- 成功：`code:200`，`msg` 会提示删除的子部门/用户数量，`data:null`。

## 菜单模块 /system/menu（需鉴权）
### POST /system/menu/create
- 说明：创建菜单。
- 请求体：`name`、`parentPublicId`(UUID)、`sortOrder`(number)、`status`('0'|'1')。
- 成功：`{ code:200, msg:"菜单创建成功", data:null }`。

### GET /system/menu/list
- 说明：获取菜单树。
- 参数：无。
- 成功：`data` 为树形数组，节点字段 `publicId, name, sortOrder, path, isFrame, menuType, visible, status, perms, createBy, createTime, updateBy, updateTime, remark, children`。

### GET /system/menu/:id
- 说明：按公开ID获取菜单。
- 路径参数：`id`（菜单 publicId）。
- 成功：`{ code:200, msg:"菜单获取成功", data:菜单对象 }`。

### POST /system/menu/update
- 说明：更新菜单。
- 请求体：`publicId` 必填，其余字段同创建为可选；若传 `parentPublicId` 将重新计算层级。
- 成功：`{ code:200, msg:"菜单更新成功", data:null }`。

### DELETE /system/menu/delete?publicId=...
- 说明：删除菜单并软删所有子菜单。
- Query：`publicId`。
- 成功：`{ code:200, msg:"菜单删除成功", data:null }`。


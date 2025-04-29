# API文档

## 认证API

目前系统使用的是模拟认证API，实际项目中需要替换为真实的后端API。

### 登录API

**功能**: 用户登录验证

**实现**: 在`src/lib/store.ts`的`login`函数中:

```typescript
login: async (username: string, password: string) => {
  // 模拟登录请求，实际项目中替换为真实API调用
  try {
    // 示例简单验证
    if (username && password.length >= 6) {
      set({ 
        user: { id: '1', username }, 
        isAuthenticated: true 
      })
      return true
    }
    return false
  } catch (error) {
    console.error('登录失败:', error)
    return false
  }
}
```

**参数**:
- `username`: 用户名
- `password`: 密码

**返回值**:
- `Promise<boolean>`: 登录成功返回`true`，失败返回`false`

### 登出API

**功能**: 用户登出系统

**实现**: 在`src/lib/store.ts`的`logout`函数中:

```typescript
logout: () => {
  set({ user: null, isAuthenticated: false })
}
```

## 未来API计划

在未来的实现中，计划添加以下API:

### 1. 用户管理API
- 用户注册
- 用户信息获取与更新
- 密码重置

### 2. 预约管理API
- 创建预约
- 更新预约
- 删除预约
- 获取预约列表

### 3. 日历API
- 按日/周/月获取预约
- 检查时间段可用性 
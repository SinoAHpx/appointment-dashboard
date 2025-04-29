# 代码结构

## 目录结构

```
appointment-dashboard/
├── public/                 # 静态资源
├── src/
│   ├── app/                # Next.js App Router 
│   │   ├── (auth)/         # 认证相关路由组
│   │   │   ├── login/      # 登录页面
│   │   │   └── layout.tsx  # 认证布局
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # 首页
│   ├── components/         # React组件
│   │   ├── ui/             # Shadcn UI组件
│   │   │   ├── button.tsx  # 按钮组件
│   │   │   ├── form.tsx    # 表单组件
│   │   │   ├── input.tsx   # 输入框组件
│   │   │   ├── toast.tsx   # 提示组件
│   │   │   └── ...         # 其他UI组件
│   │   └── auth-wrapper.tsx # 认证包装器
│   ├── lib/                # 工具库
│   │   ├── store.ts        # Zustand状态库
│   │   └── utils.ts        # 工具函数
│   └── middleware.ts       # Next.js中间件
├── .gitignore              # Git忽略文件
├── bun.lock                # Bun锁文件
├── components.json         # Shadcn UI配置
├── next.config.ts          # Next.js配置
├── package.json            # 包配置
├── postcss.config.mjs      # PostCSS配置
├── README.md               # 项目说明
└── tsconfig.json           # TypeScript配置
```

## 主要代码文件说明

### 认证系统

- `src/lib/store.ts` - 使用Zustand实现的认证状态管理
- `src/components/auth-wrapper.tsx` - 保护路由的组件
- `src/middleware.ts` - 实现路由保护的中间件
- `src/app/(auth)/login/page.tsx` - 登录页面组件

### UI组件

- `src/app/layout.tsx` - 应用程序根布局
- `src/app/(auth)/layout.tsx` - 认证页面布局
- `src/components/ui/toast.tsx` - Toast通知组件
- `src/components/ui/toaster.tsx` - Toast管理组件

### 工具函数

- `src/lib/utils.ts` - 常用工具函数 
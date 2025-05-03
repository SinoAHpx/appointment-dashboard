# 项目概述

项目名称：预约管理系统
技术栈：Next.js 14, TypeScript, Tailwind CSS, Shadcn UI, Zustand, SQLite (Bun:sqlite)

## 项目描述

这是一个基于Next.js和TypeScript开发的预约管理系统，使用Shadcn UI组件库实现现代化的用户界面，以及Zustand进行状态管理。系统提供了用户认证功能，使用SQLite数据库存储所有数据，并使用中文作为界面语言。

## 主要功能

1. 用户登录与认证
   - 基于角色的访问控制（RBAC）
   - 管理员和普通用户权限区分
   - 基于SQLite数据库的用户数据管理
2. 会话管理与保存
3. 仪表盘功能
   - 动态统计卡片显示（连接Zustand状态）
   - 点击统计卡片可跳转到对应管理页面
   - 快速导航到各功能模块（预约、客户、人员、车辆）
   - 根据用户角色显示不同内容
   - 各模块数据概览展示
4. 预约管理（创建、编辑、删除、查看）
   - 管理员可执行所有操作
   - 普通用户仅能创建预约
   - 数据持久化存储在SQLite数据库
5. 用户管理（创建、编辑、删除、查看客户信息）
   - 仅管理员可访问
   - 数据持久化存储在SQLite数据库
6. 人员管理（添加、编辑、删除员工及其状态）
   - 仅管理员可访问
   - 数据持久化存储在SQLite数据库
7. 车辆管理（添加、编辑、删除车辆及其状态）
   - 仅管理员可访问
   - 数据持久化存储在SQLite数据库
8. ~~数据查询与导出（按条件筛选预约数据并导出CSV或Excel）~~
9. 登出功能
10. 响应式设计

## 项目结构

- `/src/app` - Next.js应用路由
  - `/(auth)` - 认证相关页面
  - `/login` - 登录页面
  - `/api` - API路由
    - `/api/auth` - 认证API
    - `/api/staff` - 人员管理API
    - `/api/vehicles` - 车辆管理API
    - `/api/customers` - 客户管理API
    - `/api/appointments` - 预约管理API
  - `/dashboard` - 仪表盘页面
    - `/dashboard/appointments` - 预约管理页面
    - `/dashboard/users` - 客户管理页面
    - `/dashboard/staff` - 人员管理页面
    - `/dashboard/vehicles` - 车辆管理页面
    - ~~/dashboard/reports~~ - ~~数据查询与导出页面~~
- `/src/components` - React组件
  - `/ui` - Shadcn UI组件
  - `auth-wrapper.tsx` - 认证包装器组件
- `/src/lib` - 工具库
  - `db.ts` - SQLite数据库连接和初始化
  - `user.queries.ts` - 用户相关数据库查询
  - `staff.queries.ts` - 人员相关数据库查询
  - `vehicle.queries.ts` - 车辆相关数据库查询
  - `customer.queries.ts` - 客户相关数据库查询
  - `appointment.queries.ts` - 预约相关数据库查询
  - `store.ts` - Zustand状态库（包含所有模块的状态管理）
  - `utils.ts` - 工具函数
  - ~~`users.json`~~ - ~~模拟用户数据~~ (已替换为SQLite数据库)

## 技术亮点

1. 使用Next.js的App Router进行路由管理
2. 基于角色的访问控制（RBAC）系统
3. 使用Zustand进行状态管理，每个功能模块有单独的状态存储，并在仪表盘动态显示
4. 使用Bun的内置SQLite驱动进行数据存储
5. 健壮的SQLite数据库初始化和错误处理机制，确保数据一致性
6. 清晰的客户端/服务端代码分离，遵循Next.js最佳实践
7. RESTful API设计，每个实体有独立的API接口
8. 完整的CRUD操作支持，包括外键关系处理
9. API路由处理用户认证和数据验证
10. 使用Tailwind CSS和Shadcn UI构建现代化UI
11. 采用React Hook Form和Zod进行表单验证
12. 模块化的数据管理和组件设计
13. 响应式布局适配各种设备尺寸
14. 持久化存储用户状态和应用数据
15. 使用Lucide React提供精美图标

## Dependencies

* Next.js (15.3.1): React框架，用于构建服务端渲染和静态Web应用
* React (19.0.0): JavaScript库，用于构建用户界面
* TypeScript (5+): JavaScript的超集，添加静态类型
* Tailwind CSS (4+): 实用优先的CSS框架
* Zustand (5.0.3): 轻量级状态管理库
* Bun:sqlite: Bun内置的SQLite驱动，用于数据库操作
* Shadcn UI: 基于Radix UI的组件集合
* Lucide React: 图标库
* Sonner: Toast通知库


## Development Environment

开发环境需求:
* Node.js 18.17.0或更高版本
* Bun包管理器 (用于安装依赖和运行SQLite)

开发命令:
* `bun install` - 安装项目依赖
* `bun run dev` - 启动开发服务器
* `bun run build` - 构建生产版本
* `bun run start` - 启动生产服务器


## Structure

```
root
- .codelf/            # 项目文档目录
- .gitignore          # Git忽略文件配置
- .next/              # Next.js构建输出目录
- README.md           # 项目说明文档
- bun.lock            # Bun依赖锁定文件
- components.json     # Shadcn UI组件配置
- next.config.ts      # Next.js配置文件
- package.json        # 项目依赖和脚本配置
- postcss.config.mjs  # PostCSS配置文件
- public/             # 静态资源目录
    - file.svg        # 文件图标
    - globe.svg       # 地球图标
    - next.svg        # Next.js图标
    - vercel.svg      # Vercel图标
    - window.svg      # 窗口图标
- src/                # 源代码目录
    - app/            # Next.js应用路由目录
        - (auth)/     # 认证相关路由组
            - layout.tsx            # 认证页面布局
            - login/                # 登录页面目录
                - page.tsx          # 登录页面组件
            - register/             # 注册页面目录
                - page.tsx          # 注册页面组件
        - dashboard/                # 仪表盘页面目录
            - page.tsx              # 仪表盘主页面
            - layout.tsx            # 仪表盘布局（侧边栏和导航）
            - appointments/         # 预约管理页面目录
                - page.tsx          # 预约管理页面组件
            - users/                # 用户管理页面目录
                - page.tsx          # 用户管理页面组件
            - staff/                # 人员管理页面目录
                - page.tsx          # 人员管理页面组件
            - vehicles/             # 车辆管理页面目录
                - page.tsx          # 车辆管理页面组件
            # - reports/              # 数据查询与导出页面目录 (REMOVED)
            #     - page.tsx          # 数据查询与导出页面组件 (REMOVED)
        - api/                      # API路由目录
            - auth/                 # 认证API目录
                - route.ts          # 认证API处理程序
            - staff/                # 人员API目录
                - route.ts          # 人员API处理程序
            - vehicles/             # 车辆API目录
                - route.ts          # 车辆API处理程序
            - customers/            # 客户API目录
                - route.ts          # 客户API处理程序
            - appointments/         # 预约API目录
                - route.ts          # 预约API处理程序
        - favicon.ico               # 网站图标
        - globals.css               # 全局样式
        - layout.tsx                # 根布局组件
        - page.tsx                  # 首页组件
    - components/     # 组件目录
        - auth-wrapper.tsx          # 认证包装器组件，用于保护路由
        - ui/                       # UI组件目录（Shadcn UI）
            - accordion.tsx         # 手风琴组件
            - alert-dialog.tsx      # 警告对话框组件
            - alert.tsx             # 警告组件
            - aspect-ratio.tsx      # 宽高比组件
            - avatar.tsx            # 头像组件
            - badge.tsx             # 徽章组件
            - breadcrumb.tsx        # 面包屑组件
            - button.tsx            # 按钮组件
            - calendar.tsx          # 日历组件
            - card.tsx              # 卡片组件
            - carousel.tsx          # 轮播组件
            - chart.tsx             # 图表组件
            - checkbox.tsx          # 复选框组件
            - collapsible.tsx       # 可折叠组件
            - command.tsx           # 命令组件
            - context-menu.tsx      # 上下文菜单组件
            - dialog.tsx            # 对话框组件
            - drawer.tsx            # 抽屉组件
            - dropdown-menu.tsx     # 下拉菜单组件
            - form.tsx              # 表单组件
            - hover-card.tsx        # 悬停卡片组件
            - input-otp.tsx         # OTP输入组件
            - input.tsx             # 输入框组件
            - label.tsx             # 标签组件
            - menubar.tsx           # 菜单栏组件
            - navigation-menu.tsx   # 导航菜单组件
            - pagination.tsx        # 分页组件
            - popover.tsx           # 弹出框组件
            - progress.tsx          # 进度条组件
            - radio-group.tsx       # 单选按钮组组件
            - resizable.tsx         # 可调整大小组件
            - scroll-area.tsx       # 滚动区域组件
            - select.tsx            # 选择框组件
            - separator.tsx         # 分隔符组件
            - sheet.tsx             # 工作表组件
            - sidebar.tsx           # 侧边栏组件
            - skeleton.tsx          # 骨架屏组件
            - slider.tsx            # 滑块组件
            - sonner.tsx            # Toast通知配置组件
            - switch.tsx            # 开关组件
            - table.tsx             # 表格组件
            - tabs.tsx              # 标签页组件
            - textarea.tsx          # 文本区域组件
            - toast.tsx             # Toast组件
            - toaster.tsx           # Toast管理组件
            - toggle-group.tsx      # 切换按钮组组件
            - toggle.tsx            # 切换按钮组件
            - tooltip.tsx           # 提示框组件
            - use-toast.ts          # Toast钩子
    - hooks/          # 自定义钩子目录
        - use-mobile.ts             # 移动设备检测钩子
    - lib/            # 工具库目录
        - db.ts                     # SQLite数据库连接和初始化
        - user.queries.ts           # 用户相关数据库查询
        - staff.queries.ts          # 人员相关数据库查询
        - vehicle.queries.ts        # 车辆相关数据库查询
        - customer.queries.ts       # 客户相关数据库查询
        - appointment.queries.ts    # 预约相关数据库查询
        - store.ts                  # Zustand状态库，包含所有模块的状态管理
        - utils.ts                  # 通用工具函数
- tsconfig.json       # TypeScript配置文件
```

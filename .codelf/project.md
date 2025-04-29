# 项目概述

项目名称：预约管理系统
技术栈：Next.js 14, TypeScript, Tailwind CSS, Shadcn UI, Zustand

## 项目描述

这是一个基于Next.js和TypeScript开发的预约管理系统，使用Shadcn UI组件库实现现代化的用户界面，以及Zustand进行状态管理。系统提供了用户认证功能，并使用中文作为界面语言。

## 主要功能

1. 用户登录与认证
2. 会话管理与保存
4. 仪表盘功能
5. 登出功能
6. 响应式设计

## 项目结构

- `/src/app` - Next.js应用路由
  - `/(auth)` - 认证相关页面
  - `/login` - 登录页面
  - `/dashboard` - 仪表盘页面
- `/src/components` - React组件
  - `/ui` - Shadcn UI组件
  - `auth-wrapper.tsx` - 认证包装器组件
- `/src/lib` - 工具库
  - `store.ts` - Zustand状态库
  - `utils.ts` - 工具函数

## 技术亮点

1. 使用Next.js的App Router进行路由管理
2. 使用Zustand进行简洁的状态管理
3. 使用Tailwind CSS和Shadcn UI构建现代化UI
5. 采用React Hook Form和Zod进行表单验证

## Dependencies (init from programming language specification like package.json, requirements.txt, etc.)

* package1 (version): simple description
* package2 (version): simple description


## Development Environment

> include all the tools and environments needed to run the project
> makefile introduction (if exists)


## Structrue (init from project tree)

> It is essential to consistently refine the analysis down to the file level — this level of granularity is of utmost importance.

> If the number of files is too large, you should at least list all the directories, and provide comments for the parts you consider particularly important.

> In the code block below, add comments to the directories/files to explain their functionality and usage scenarios.

> if you think the directory/file is not important, you can not skip it, just add a simple comment to it.

> but if you think the directory/file is important, you should read the files and add more detail comments on it (e.g. add comments on the functions, classes, and variables. explain the functionality and usage scenarios. write the importance of the directory/file).
```
root
- .gitignore
- .next
- README.md
- bun.lock
- components.json
- next.config.ts
- package.json
- postcss.config.mjs
- public
    - file.svg
    - globe.svg
    - next.svg
    - vercel.svg
    - window.svg
- src
    - app
        - (auth)
            - layout.tsx
            - login
                - page.tsx
        - favicon.ico
        - globals.css
        - layout.tsx
        - login
        - page.tsx
    - components
        - auth-wrapper.tsx
        - ui
            - accordion.tsx
            - alert-dialog.tsx
            - alert.tsx
            - aspect-ratio.tsx
            - avatar.tsx
            - badge.tsx
            - breadcrumb.tsx
            - button.tsx
            - calendar.tsx
            - card.tsx
            - carousel.tsx
            - chart.tsx
            - checkbox.tsx
            - collapsible.tsx
            - command.tsx
            - context-menu.tsx
            - dialog.tsx
            - drawer.tsx
            - dropdown-menu.tsx
            - form.tsx
            - hover-card.tsx
            - input-otp.tsx
            - input.tsx
            - label.tsx
            - menubar.tsx
            - navigation-menu.tsx
            - pagination.tsx
            - popover.tsx
            - progress.tsx
            - radio-group.tsx
            - resizable.tsx
            - scroll-area.tsx
            - select.tsx
            - separator.tsx
            - sheet.tsx
            - sidebar.tsx
            - skeleton.tsx
            - slider.tsx
            - sonner.tsx
            - switch.tsx
            - table.tsx
            - tabs.tsx
            - textarea.tsx
            - toast.tsx
            - toaster.tsx
            - toggle-group.tsx
            - toggle.tsx
            - tooltip.tsx
            - use-toast.ts
    - hooks
        - use-mobile.ts
    - lib
        - store.ts
        - utils.ts
- tsconfig.json
```

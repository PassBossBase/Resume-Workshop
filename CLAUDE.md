# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 项目概述

「简历工坊」是一款纯本地运行的简历编辑器，中文 UI，数据存储在浏览器 IndexedDB 中（可选对接本地文件系统）。使用 Next.js 16 (App Router) + React 19 + TypeScript，包管理器为 pnpm。

## 常用命令

```bash
pnpm dev            # 启动开发服务器 (Turbopack, 默认端口 3000)
pnpm build          # 生产构建
pnpm start          # 启动生产服务器
pnpm lint           # ESLint
pnpm test           # 运行全部 Vitest 单元测试
pnpm test:watch     # Vitest 交互式监视模式
pnpm typecheck      # TypeScript 类型检查 (tsc --noEmit)
```

## 技术栈

- **框架**: Next.js 16.2 (App Router, Turbopack)
- **UI**: React 19.2, Tailwind CSS v4
- **状态管理**: Zustand v5
- **富文本编辑器**: Tiptap v3
- **数据校验**: Zod v4
- **本地存储**: IndexedDB (via `idb`), File System Access API (桌面 Chrome)
- **PDF 导出**: jsPDF + html-to-image
- **测试**: Vitest v4 + @testing-library/react + jsdom + fake-indexeddb
- **包管理器**: pnpm

## 架构

项目采用 **feature-based** 目录结构，业务逻辑按功能模块划分在 `src/features/` 下：

```
src/
├── app/                          # Next.js App Router 路由
│   ├── layout.tsx                # 根布局 (<html>, <body>)
│   ├── page.tsx                  # 首页 → ResumeDashboard
│   ├── resume/[id]/page.tsx      # 编辑器页 → EditorShell
│   ├── templates/page.tsx        # 模板选择页
│   └── settings/page.tsx         # 设置页
├── components/
│   ├── app-shell.tsx             # 全局 chrome：折叠侧边栏 + 移动端导航
│   └── anime-ui/ui.tsx           # 共享 UI 组件 (InkButton, StickerCard, BrandMark)
├── features/
│   ├── resume-model/             # 数据模型 & Zod schema（唯一数据源）
│   │   └── resume-model.ts       # ResumeDocument, ResumeModule, ResumeEntry 类型与校验
│   ├── editor/                   # 编辑器核心
│   │   ├── resume-store.ts       # Zustand store：加载/编辑/重命名/移动条目
│   │   ├── editor-shell.tsx      # 编辑器顶层容器：三栏布局 + 自动保存(650ms 防抖)
│   │   ├── editor-content.tsx    # 中间编辑面板：基本信息表单 / 条目编辑 / 富文本
│   │   ├── style-panel.tsx       # 左侧样式面板：模块排序、主题色、字号/行高/页边距
│   │   ├── module-meta.tsx       # 模块元数据（标签、颜色、图标）
│   │   ├── date-input.tsx        # 日期输入组件（支持"至今"）
│   │   └── date-value.ts         # 日期格式化工具
│   ├── rich-text/                # 基于 Tiptap 的富文本编辑
│   │   ├── rich-text.ts          # HTML 清洗/规范化（白名单标签、样式、链接）
│   │   ├── rich-text-editor.tsx  # Tiptap React 编辑器封装
│   │   └── first-line-indent.ts  # 首行缩进扩展
│   ├── templates/                # 简历模板渲染
│   │   ├── resume-pages.ts       # 分页引擎：按高度估算将内容分配到 A4 页
│   │   ├── classic-template.tsx  # 「经典单栏」模板渲染（唯一模板）
│   │   ├── resume-preview.tsx    # 实时预览面板（缩放到不同断点）
│   │   └── template-gallery.tsx  # 模板选择页
│   ├── storage/                  # 持久化层
│   │   ├── resume-repository.ts  # IndexedDB CRUD (idb)，Zod 读写校验
│   │   └── directory-sync.ts     # File System Access API 读写 + 冲突检测
│   ├── pdf-export/
│   │   └── export-pdf.ts         # html-to-image 截图 + jsPDF 拼接 A4 PDF
│   ├── dashboard/
│   │   └── resume-dashboard.tsx  # 简历列表页：新建/复制/删除，带骨架屏 & 缩略图预览
│   └── settings/
│       └── directory-settings.tsx # 本地文件夹绑定设置
├── test/
│   └── setup.ts                  # Vitest 全局 setup：jest-dom matchers + fake-indexeddb + auto cleanup
└── types/
    └── file-system.d.ts          # File System Access API 类型声明
```

### 核心数据流

1. **数据模型** (`resume-model.ts`)：`ResumeDocument` 是唯一的顶层数据类型，包含 `modules`（5 个固定模块：basics/skills/work/projects/education）、`styles`、`templateId`。所有数据进出都经过 Zod schema 校验。

2. **编辑器** (`editor-shell.tsx`)：加载时先尝试从绑定的本地文件夹 (`FileSystemDirectoryHandle`) 读取，失败则回退 IndexedDB。编辑时通过 Zustand store (`resume-store.ts`) 修改，650ms 防抖后同时写入 IndexedDB 和本地文件。移动端使用底部 tab 切换「内容/样式/预览」三栏。

3. **持久化**：IndexedDB (`resume-workshop` DB, v1) 作为主存储。桌面 Chrome 支持 File System Access API，将简历以 `resume-{id}.json` 写入用户选择的本地文件夹，带 `lastModified` 冲突检测。

4. **模板渲染**：`buildResumePages()` 根据条目高度估算将模块拆分到 A4 页面；`ClassicTemplatePage` 负责视觉渲染；`ResumePreview` 负责预览面板的缩放。

5. **PDF 导出**：`html-to-image` 将每一页 DOM 节点渲染为 PNG，再由 `jsPDF` 拼成 A4 PDF 下载。

### 关键约定

- 所有编辑操作通过 `touch()` 函数更新 `updatedAt` 时间戳
- 富文本内容经过 `normalizeRichText()` 清洗后存储，渲染时再 `sanitizeRichText()`
- 侧边栏折叠状态通过 `localStorage` + 自定义事件跨标签页同步
- 前端代码均标记 `"use client"` — 这是一个纯客户端应用，不使用 Next.js 服务端渲染
- 仅支持 `classic` 模板；`templateId` 使用 literal union type 预留扩展空间

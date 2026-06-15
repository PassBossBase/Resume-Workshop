<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# 项目说明

## 项目定位

“简历工坊”是一个完全在浏览器本地运行的中文简历编辑器。项目不包含账号、后端服务、云同步或 AI 功能，用户数据默认保存在当前设备。

主要能力：

- 创建、复制、编辑和删除多份简历。
- 编辑基本信息、专业技能、工作经历、项目经历和教育经历。
- 调整模块显隐、排序、主题色、字体、字号、行高、页边距和模块间距。
- 使用 Tiptap 编辑富文本内容，并在写入模型前进行格式规范化和安全清理。
- 实时生成 A4 多页预览，并通过 `html-to-image` 和 `jsPDF` 导出 PDF。
- 使用 IndexedDB 保存浏览器缓存。
- 在桌面 Chrome 中通过 File System Access API 连接本地目录并同步 JSON 文件。
- 在移动端完整编辑，但移动端数据仅保存在浏览器缓存中，不与桌面目录自动互通。

## 技术栈

- Next.js 16.2 App Router
- React 19.2
- TypeScript 5，开启严格模式
- Tailwind CSS 4
- Zustand 5：编辑器客户端状态
- Zod 4：简历模型及持久化数据校验
- Tiptap 3：富文本编辑器
- idb：IndexedDB 封装
- Vitest 4、React Testing Library、jsdom、fake-indexeddb：单元及组件测试
- Playwright：已安装，但当前仓库未配置独立的端到端测试脚本

路径别名 `@/*` 指向 `src/*`。

## 路由与页面

- `/`：简历仪表盘，读取 IndexedDB 中的简历列表，并提供新建、复制、编辑和删除操作。
- `/templates`：模板库。目前数据模型只允许 `classic`，即“经典单栏”模板。
- `/settings`：本地目录连接、重新授权、断开连接及缓存迁移。
- `/resume/[id]`：简历编辑工作台。Next.js 16 的动态路由 `params` 是 Promise，必须先 `await`。

`src/app/layout.tsx` 提供根布局和中文元数据。普通页面由 `AppShell` 提供响应式导航，编辑器页面使用独立的全屏工作台布局。

## 目录职责

- `src/app/`：App Router 路由、根布局和全局样式。
- `src/components/`：跨功能复用的应用壳层和视觉组件。
- `src/components/anime-ui/`：项目自有的漫画风 UI 基础组件。
- `src/features/resume-model/`：Zod Schema、TypeScript 类型、默认简历和模型级操作。
- `src/features/dashboard/`：简历列表及创建、复制、删除流程。
- `src/features/editor/`：工作台、Zustand Store、内容编辑、日期输入和样式面板。
- `src/features/rich-text/`：Tiptap 编辑器、首行缩进扩展、富文本规范化和清理。
- `src/features/templates/`：模板库、经典模板、A4 预览、内容分页算法。
- `src/features/storage/`：IndexedDB 仓库和本地目录 JSON 读写。
- `src/features/settings/`：目录同步设置界面。
- `src/features/pdf-export/`：将预览页转为图片并写入 A4 PDF。
- `src/test/setup.ts`：测试环境初始化、jest-dom、fake-indexeddb 和自动清理。
- `src/types/file-system.d.ts`：File System Access API 的项目内类型声明。

测试文件与被测模块放在同一目录，命名为 `*.test.ts` 或 `*.test.tsx`。

## 核心数据与保存流程

`ResumeDocument` 当前版本固定为 `version: 1`，包含固定的五类模块：

1. `basics`
2. `skills`
3. `work`
4. `projects`
5. `education`

基本信息模块始终存在且不可隐藏。持久化前后都应通过 `resumeDocumentSchema` 校验，不要绕过 Schema 直接信任 IndexedDB、JSON 文件或导入数据。变更文档内容时使用现有模型函数或 Store action，并通过 `touch()` 更新 `updatedAt`。

编辑器加载顺序：

1. 桌面端若保存过目录句柄且已有读写权限，优先读取 `resume-<id>.json`。
2. 目录文件不可用时读取 IndexedDB。
3. 两者都不存在时创建默认简历并写入 IndexedDB。

编辑后延迟约 650ms 自动保存。桌面端已连接目录时先写 JSON 文件，再写 IndexedDB；移动端始终只写 IndexedDB。目录写入会比较 `lastModified`，检测到外部修改时进入 `conflict` 状态，修改此流程时必须保留冲突检测和缓存兜底。

## 开发约定

- 修改 Next.js 路由、组件边界、缓存、请求 API 或配置前，必须先阅读 `node_modules/next/dist/docs/` 中对应的当前版本文档。
- App Router 组件默认是 Server Component。只有使用状态、Effect、事件、浏览器 API、IndexedDB 或 File System Access API 的文件才添加 `"use client"`，并尽量下移客户端边界。
- Next.js 16 中 `params`、`searchParams`、`cookies()` 和 `headers()` 等请求相关 API 是异步的，不要按旧版本写法使用。
- 浏览器专属代码必须位于 Client Component、Effect 或事件处理器中，避免在模块初始化或服务端渲染期间访问 `window`、`document`、`crypto`、IndexedDB 和文件句柄。
- 保持当前按功能划分的 `src/features/*` 结构；业务逻辑优先放在对应 feature 中，不要把复杂逻辑堆到路由文件。
- 复用现有的 `InkButton`、`StickerCard`、`BrandMark` 等视觉组件和 `globals.css` 中的颜色变量，保持编辑器界面的活力漫画风；导出的简历模板应继续保持专业、克制。
- 新增简历字段、模块或模板时，同时更新 Zod Schema、默认数据、Store、编辑界面、模板渲染、分页逻辑、持久化兼容和相关测试。
- 富文本渲染前继续使用现有的规范化与白名单清理逻辑，不要直接信任或无过滤输出用户 HTML。
- A4 模板基准尺寸为 `794 × 1123` CSS 像素，PDF 输出为 `210 × 297 mm`。调整布局时同时检查桌面、平板、手机预览比例和多页导出。
- 目录同步只承诺最新版桌面 Chrome，并要求 HTTPS 或 localhost。不要把 File System Access API 当成所有浏览器可用的能力。
- 仓库同时存在 `package-lock.json` 和 `pnpm-lock.yaml`。README 当前以 npm 命令为准；未修改依赖时不要无意义重写任一锁文件，修改依赖时应明确使用同一种包管理器并避免产生无关锁文件差异。

## 常用命令

```bash
npm run dev
npm test
npm run test:watch
npm run typecheck
npm run lint
npm run build
npm run start
```

本地开发地址为 `http://localhost:3000`。

## 变更验证

提交代码前至少执行与改动相关的测试。涉及共享模型、持久化、编辑器状态、分页或富文本时，应优先运行完整验证：

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Vitest 适合当前同步 Server Component、Client Component 和纯函数的单元测试；Next.js 官方说明异步 Server Component 不应依赖 Vitest 覆盖，相关行为需要通过端到端或浏览器验证。涉及界面或 PDF 的改动，还应手动检查响应式布局、自动保存、目录冲突提示、多页预览和实际下载文件。

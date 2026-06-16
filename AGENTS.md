<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# 简历工坊项目指南

## 1. 项目概述

“简历工坊”是一个面向中文用户的纯本地简历编辑器。应用没有账号系统、后端 API、数据库服务器、云同步或 AI 服务，简历数据默认只保存在用户当前设备。

核心功能：

- 创建、复制、编辑和删除多份简历。
- 编辑基本信息、专业技能、工作经历、项目经历和教育经历。
- 调整模块显隐与顺序、经历条目顺序以及全局排版样式。
- 使用 Tiptap 编辑富文本，支持常用文字格式、链接、对齐和首行缩进。
- 根据内容估算生成 A4 多页预览，并导出 PDF。
- 使用 IndexedDB 作为所有浏览器上的本地缓存。
- 在支持 File System Access API 的桌面 Chrome 中连接本地目录，将简历同步为 JSON 文件。
- 提供桌面三栏编辑工作台和移动端“内容 / 样式 / 预览”切换界面。

产品视觉分为两套语气：应用界面使用明亮、带黑色描边和硬阴影的漫画风；简历模板与 PDF 输出保持专业、清晰和克制。

## 2. 技术栈

- Next.js `16.2.9`，App Router。
- React / React DOM `19.2.4`。
- TypeScript 5，`strict`、`noEmit`、`isolatedModules` 已开启。
- Tailwind CSS 4，通过 `@tailwindcss/postcss` 使用。
- Zustand 5：当前简历、活动模块和保存状态。
- Zod 4：简历文档及外部数据的运行时校验。
- Tiptap 3：富文本编辑器。
- idb 8：IndexedDB Promise 封装。
- html-to-image + jsPDF：客户端 PDF 导出。
- Lucide React：图标。
- Vitest 4 + React Testing Library + jsdom + fake-indexeddb：单元和组件测试。
- ESLint 9 + `eslint-config-next`：代码检查。

TypeScript 路径别名 `@/*` 指向 `src/*`。

## 3. 项目结构

```text
src/
├─ app/                    # App Router 路由、根布局、全局样式
├─ components/             # 跨功能复用组件与应用壳层
│  └─ anime-ui/            # 项目自有的视觉基础组件
├─ features/               # 按业务能力划分的功能模块
│  ├─ dashboard/           # 简历列表、新建、复制、删除
│  ├─ editor/              # 编辑工作台、内容表单、样式面板、日期输入
│  ├─ pdf-export/          # DOM 页面转 PDF
│  ├─ resume-model/        # Zod Schema、类型、默认数据、模型操作
│  ├─ rich-text/           # Tiptap 编辑器与富文本清理
│  ├─ settings/            # 本地目录同步设置
│  ├─ storage/             # IndexedDB 和目录 JSON 读写
│  └─ templates/           # 模板、缩略图、预览和分页
├─ hooks/                  # 跨功能 React Hook
├─ stores/                 # 全局客户端 Store
├─ test/                   # 测试环境初始化
└─ types/                  # 浏览器能力等补充类型声明
```

关键文件：

- `src/features/resume-model/resume-model.ts`：应用唯一的简历文档定义。
- `src/stores/resume-store.ts`：编辑器 Zustand Store。
- `src/features/editor/editor-shell.tsx`：加载、自动保存、工作台布局和 PDF 导出入口。
- `src/features/storage/resume-repository.ts`：IndexedDB 仓库。
- `src/features/storage/directory-sync.ts`：目录文件读写及冲突检测。
- `src/features/templates/resume-pages.ts`：简历内容分页估算。
- `src/features/templates/classic-template.tsx`：当前唯一的简历模板。
- `src/features/rich-text/rich-text.ts`：富文本规范化、白名单清理和纯文本提取。
- `src/hooks/use-overlay.ts`：弹层的 Escape、滚动锁定和初始焦点行为。
- `src/components/anime-ui/ui.tsx`：`InkButton`、`StickerCard`、`Modal`、页面容器等基础 UI。

测试文件与被测代码就近放置，命名为 `*.test.ts` 或 `*.test.tsx`。

## 4. 路由与架构流程

### 路由

- `/`：简历仪表盘，从 IndexedDB 加载列表，提供新建、复制、编辑和删除。
- `/templates`：模板库。目前只有“经典单栏”模板。
- `/settings`：连接、重新授权、迁移缓存和断开本地目录。
- `/resume/[id]`：简历编辑工作台。Next.js 16 的动态 `params` 是 Promise，必须先 `await`。

`src/app/layout.tsx` 是根布局并设置 `lang="zh-CN"`。普通页面通过 `AppShell` 使用统一响应式导航；编辑器路由使用独立全屏布局。

### 数据模型

`ResumeDocument` 当前固定为 `version: 1`，`templateId` 当前固定为 `"classic"`。文档必须包含恰好五个模块：

1. `basics`
2. `skills`
3. `work`
4. `projects`
5. `education`

`basics` 必须始终存在、位于首位且不可隐藏。其他模块可以隐藏和排序。所有持久化数据必须通过 `resumeDocumentSchema` 校验，不能直接信任 IndexedDB、JSON 文件或未来的导入数据。

### 编辑状态

`useResumeStore` 管理当前简历、活动模块和 `idle | saving | saved | error | conflict` 保存状态。普通编辑 action 通过 Store 内的 `applyResume()` 统一调用 `touch()`，更新 `updatedAt`。模型层的模块操作自身已调用 `touch()`，不要重复套用造成无意义时间变更。

新增跨页面客户端状态时放入 `src/stores/`；只服务单个功能的局部状态保留在对应组件或 feature 内。

### 加载与保存

编辑器加载顺序：

1. 桌面端尝试读取 IndexedDB 中保存的目录句柄。
2. 若目录权限已授予，优先读取 `resume-<id>.json`，校验后同步回 IndexedDB。
3. 目录不可用或文件不存在时读取 IndexedDB。
4. 两处都没有数据时创建默认简历并写入 IndexedDB。

编辑后约 650ms 自动保存：

1. 桌面端已连接目录时，先写入目录 JSON。
2. 再写入 IndexedDB 缓存。
3. 移动端始终只写 IndexedDB。
4. 即使目录写入失败，也要保留 IndexedDB 缓存兜底。

目录写入使用 `lastModified` 做乐观冲突检测。文件在当前会话外被修改时抛出 `DirectoryConflictError`，界面进入 `conflict` 状态。不要移除此检测。

连接目录时会把已有简历写为 `resume-<id>.json`，并生成 `resume-workshop.json` 清单。断开连接只清除保存的目录句柄，不删除目录内现有文件。

### 富文本、分页与 PDF

富文本最终通过 `dangerouslySetInnerHTML` 渲染，因此必须先经过 `normalizeRichText()` / `sanitizeRichText()`。允许标签、属性、链接协议和内联样式都由白名单控制，不要绕过该流程。

`buildResumePages()` 使用纯文本行数估算条目高度，并为第一页和后续页使用不同预算。它是启发式分页，不是浏览器排版测量。修改模板字号、间距或内容结构时必须同步检查分页预算和测试。

A4 模板基准尺寸是 `794 × 1123` CSS 像素；PDF 输出尺寸是 `210 × 297 mm`。导出时每个预览页以 `pixelRatio: 2` 转为 PNG，再依次写入 PDF。

## 5. 开发规范

### Next.js 与 React

- 修改路由、布局、Server / Client Component 边界、请求 API、缓存或 Next.js 配置前，先阅读 `node_modules/next/dist/docs/` 中对应的 16.2 文档。
- App Router 文件默认是 Server Component。只有使用 React 状态、Effect、事件处理器或浏览器 API 时才添加 `"use client"`，并尽量缩小客户端边界。
- `params`、`searchParams`、`cookies()`、`headers()` 等 Next.js 16 请求 API 按当前文档使用异步形式。
- `window`、`document`、`localStorage`、IndexedDB、File System Access API 和 DOM 导出只能在客户端边界、Effect 或事件处理器中使用。
- React 19 的 `useRef` 必须提供初始值，例如 `useRef<HTMLDivElement | null>(null)`。

### 模块与状态

- 保持 `src/features/*` 的业务分区，不把复杂业务逻辑放进 `src/app/**/page.tsx`。
- 跨功能 UI 放入 `src/components/`，跨功能 Hook 放入 `src/hooks/`，全局 Store 放入 `src/stores/`。
- 优先复用现有模型函数、Store action 和持久化仓库，不在组件中复制数据变换逻辑。
- 修改 `ResumeDocument` 时必须考虑版本迁移；不能直接改变 Schema 后让旧 IndexedDB 或旧 JSON 文件全部失效。

### UI 与可访问性

- 优先复用 `InkButton`、`StickerCard`、`Modal`、`PageContainer`、`PageHeading` 和 `BrandMark`。
- 颜色优先使用 `src/app/globals.css` 中的 CSS 变量，如 `--paper`、`--yellow`、`--pink`、`--blue`。
- 新弹窗应复用 `Modal` 和 `useOverlay`，保留 Escape 关闭、背景滚动锁定、初始焦点、ARIA 标题关联和明确的关闭按钮。
- 图标按钮必须提供 `aria-label` 或可访问文本。交互元素要保留键盘焦点样式。
- 修改页面时检查桌面、平板和手机布局；编辑工作台在 `1024px` 以下切换为移动端模式。

### 数据与安全

- Zod Schema 是持久化边界，读写简历时必须解析校验。
- 不允许未经白名单清理直接输出用户 HTML。
- 不要引入账号、云端上传、遥测或第三方数据服务，除非需求明确改变“纯本地”产品定位。
- 文件名必须继续经过清理，避免在 PDF 下载名中保留非法字符。

### 代码风格

- 使用 TypeScript 和 `@/` 路径别名，遵循现有双引号与分号风格。
- 注释用于解释边界、约束和非直观算法，不为显而易见的 JSX 或赋值添加旁白。
- 保持改动聚焦，不顺手重排无关文件或重写锁文件。

## 6. 常用命令

项目 README 当前使用 npm：

```bash
npm install
npm run dev
npm test
npm run test:watch
npm run typecheck
npm run lint
npm run build
npm run start
```

开发服务器默认地址：`http://localhost:3000`。

仓库同时存在 `package-lock.json` 和 `pnpm-lock.yaml`，且没有声明 `packageManager`。未修改依赖时不要改动锁文件；修改依赖前先确认本次任务使用 npm 还是 pnpm，并只提交与该选择一致的必要锁文件变更。

## 7. 测试与验证

Vitest 使用 jsdom，`src/test/setup.ts` 加载 jest-dom、fake-indexeddb，并在每个测试后清理 React DOM。

按改动范围选择验证：

- 模型、Store、持久化、富文本或分页：运行对应测试，通常还应运行完整 `npm test`。
- TypeScript 类型或公共接口：运行 `npm run typecheck`。
- 组件、路由和样式：运行 `npm run lint`，并进行浏览器响应式检查。
- Next.js 配置、依赖、路由边界或生产行为：运行 `npm run build`。
- PDF 或模板：手动检查单页、多页、长条目、中文内容和实际下载文件。
- 目录同步：在支持的桌面 Chrome、HTTPS 或 localhost 环境检查授权、迁移、自动保存、外部修改冲突和断开连接。

完整验证命令：

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Vitest 不适合覆盖异步 Server Component。此类行为应通过浏览器或端到端测试验证。当前项目没有配置端到端测试脚本。

## 8. 环境与兼容性

- 项目当前不需要环境变量。
- 项目当前不依赖网络 API 或服务端数据库。
- IndexedDB 是基础存储能力，测试中由 fake-indexeddb 模拟。
- File System Access API 只承诺最新版桌面 Chrome，并要求安全上下文，即 HTTPS 或 localhost。
- 手机和平板不读取或写入桌面目录，数据与桌面目录不会自动互通。
- PDF 导出依赖浏览器 DOM、Canvas / 图片生成和文件下载能力，不能在 Server Component 中执行。

## 9. 变更注意事项

新增或修改简历字段、模块、模板时，至少同步检查：

1. `resumeDocumentSchema`、TypeScript 类型和 `version` 迁移策略。
2. 默认简历数据。
3. Zustand Store action。
4. 编辑表单和样式面板。
5. 模板渲染、缩略图和完整预览。
6. 分页高度估算与 A4 比例。
7. IndexedDB 和目录 JSON 兼容性。
8. PDF 导出。
9. 单元、组件和手动浏览器验证。

修改本地存储或目录同步时，必须保留：

- Zod 校验。
- IndexedDB 兜底。
- 目录权限检查。
- `lastModified` 冲突检测。
- 用户取消目录选择时不显示错误。
- 断开连接不删除用户已有文件。

修改弹窗、抽屉或移动导航时，必须检查：

- Escape 行为。
- 背景滚动锁定及恢复。
- 初始焦点和关闭后的可操作性。
- ARIA 标签。
- 遮罩点击和禁用状态。

除非任务明确要求，不要提交 `.next/`、`tsconfig.tsbuildinfo`、本地编辑器配置或其他生成文件。

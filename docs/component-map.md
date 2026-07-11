# 组件地图

本文件用于快速定位 UI 组件。组件源码入口均在 `src/components/` 或 `src/features/`；路由页只负责组装与导航，不承载复杂业务逻辑。

## 应用壳层与基础 UI

| 组件 | 路径 | 职责 |
| --- | --- | --- |
| `AppRuntime` | `src/components/app-runtime.tsx` | 初始化目录同步等跨页面运行时状态。 |
| `AppShell` | `src/components/app-shell.tsx` | 普通页面的桌面/移动导航和内容壳层。 |
| `MobileNavigation` | `src/components/app-shell.tsx` | 小屏抽屉导航。 |
| `LanguageToggle` | `src/components/language-toggle.tsx` | 中英文界面切换。 |
| `DirectorySyncMessage` | `src/components/directory-sync-message.tsx` | 目录同步状态提示。 |
| `ToastContainer` | `src/components/anime-ui/toast.tsx` | 全局通知容器。 |
| `StickerCard`、`InkButton`、`ColorTag` | `src/components/anime-ui/ui.tsx` | 漫画风卡片、按钮和标签基础组件。 |
| `BrandMark`、`PageContainer`、`PageHeading` | `src/components/anime-ui/ui.tsx` | 品牌标识与页面结构组件。 |
| `Modal`、`InkSelect`、`InkTooltip`、`SectionCard` | `src/components/anime-ui/ui.tsx` | 通用弹窗、选择器、提示和分区卡片。 |

## 仪表盘与导入

| 组件 | 路径 | 职责 |
| --- | --- | --- |
| `ResumeDashboard` | `src/features/dashboard/resume-dashboard.tsx` | 简历列表、创建、复制和删除流程。 |
| `ResumeCardGrid` | `src/features/dashboard/resume-dashboard-cards.tsx` | 简历卡片网格与操作入口。 |
| `ResumeDashboardLoadingGrid` | `src/features/dashboard/resume-dashboard-cards.tsx` | 仪表盘加载骨架。 |
| `EmptyResumeState` | `src/features/dashboard/resume-dashboard-cards.tsx` | 空列表引导。 |
| `NewResumeModal` | `src/features/dashboard/new-resume-modal.tsx` | 新建简历的模板选择弹窗。 |
| `ImportResumeModal` | `src/features/dashboard/import-resume-modal.tsx` | 本地 PDF / JSON 导入与结果预览弹窗。 |

## 编辑工作台

| 组件 | 路径 | 职责 |
| --- | --- | --- |
| `EditorShellLoader`、`EditorShell` | `src/features/editor/editor-shell-loader.tsx`、`editor-shell.tsx` | 编辑器动态入口、加载、自动保存与弹窗状态。 |
| `EditorShellHeader` | `src/features/editor/editor-shell-header.tsx` | 编辑页顶部操作：语言、导入、模板和 PDF。 |
| `EditorWorkbench` | `src/features/editor/editor-workbench.tsx` | 桌面三栏与移动三标签布局。 |
| `EditorContent` | `src/features/editor/editor-content.tsx` | 基础信息、模块条目及富文本编辑区。 |
| `MobileEditorTabs`、`ModuleTabs` | `src/features/editor/editor-mobile-tabs.tsx` | 移动端视图与模块切换。 |
| `StylePanel`、`Panel`、`Control` | `src/features/editor/style-panel.tsx`、`style-panel-shell.tsx` | 排版、模块顺序和样式配置面板。 |
| `StyleModuleCard` | `src/features/editor/style-module-card.tsx` | 样式面板中的模块排序卡。 |
| `ThemeColorPicker` | `src/features/editor/style-color-picker.tsx` | 主题色选择器。 |
| `CustomModuleEditor`、`CustomEntryCard` | `src/features/editor/custom-module-editor.tsx`、`custom-entry-card.tsx` | 自定义模块及其条目编辑。 |
| `DateInput` | `src/features/editor/date-input.tsx` | 经历日期输入。 |
| `DeleteConfirmDialog` | `src/features/editor/delete-confirm-dialog.tsx` | 删除确认弹窗。 |
| `TemplateSwitchModal` | `src/features/editor/template-switch-modal.tsx` | 不改变内容地切换模板。 |
| `ResizeHandle`、`PanelRestoreButton` | `src/features/editor/resize-handle.tsx` | 桌面栏宽拖拽与折叠恢复。 |
| `SaveStatus` | `src/features/editor/save-status.tsx` | 保存和同步状态标识。 |
| `RichTextEditor` | `src/features/rich-text/rich-text-editor.tsx` | Tiptap 富文本编辑器与工具栏。 |

## 简历模板与预览

| 组件 | 路径 | 职责 |
| --- | --- | --- |
| `BlankTemplate` | `src/features/templates/blank-template.tsx` | 基础模板：居中头部与水平分割线。 |
| `ClassicTemplatePage` | `src/features/templates/classic-template.tsx` | 经典单栏模板。 |
| `HeaderFullWidthTemplate` | `src/features/templates/header-full-width-template.tsx` | 全宽蓝色头部单栏模板。 |
| `SidebarLeftTemplate` | `src/features/templates/sidebar-left-template.tsx` | 深色侧边栏双栏模板。 |
| `TimelineBlockTemplate` | `src/features/templates/timeline-block-template.tsx` | 时间轴色块模板。 |
| `LineSeparateTemplate` | `src/features/templates/line-separate-template.tsx` | 复古分割线模板。 |
| `SectionBannerTemplate` | `src/features/templates/section-banner-template.tsx` | 自定义标题背景模板。 |
| `ResumePreview` | `src/features/templates/resume-preview.tsx` | 编辑器右侧连续 A4 预览与分页标记。 |
| `PrintableResume` | `src/features/templates/printable-resume.tsx` | 浏览器打印使用的未缩放文本版文档。 |
| `TemplateGallery` | `src/features/templates/template-gallery.tsx` | 模板库页面主体。 |
| `TemplateThumbnail`、`TemplateSkeletonPreview` | `src/features/templates/template-thumbnail.tsx`、`template-skeleton-preview.tsx` | 模板卡片的缩略与骨架预览。 |
| `ResumeContentThumbnail` | `src/features/templates/resume-content-thumbnail.tsx` | 真实简历内容的封面缩略图。 |
| `BasicInfoLabel`、`BasicInfoValue` | `src/features/templates/basic-info-link.tsx` | 基础字段标签与可点击的邮箱、电话、网址值。 |

## 设置与路由

| 组件 / 路由 | 路径 | 职责 |
| --- | --- | --- |
| `DirectorySettings` | `src/features/settings/directory-settings.tsx` | 本地目录同步设置页主体。 |
| `/` | `src/app/page.tsx` | 首页。 |
| `/dashboard` | `src/app/dashboard/page.tsx` | 简历仪表盘路由。 |
| `/resume/[id]` | `src/app/resume/[id]/page.tsx` | 单份简历编辑路由。 |
| `/templates` | `src/app/templates/page.tsx` | 模板库路由。 |
| `/settings` | `src/app/settings/page.tsx` | 设置路由。 |

## 查找约定

- 先在本文件按功能定位组件，再打开对应文件查看组件 JSDoc。
- 数据模型在 `src/features/resume-model/`，本地存储在 `src/features/storage/`，它们不是 UI 组件。
- 新增可复用组件时，应在组件导出前补一条职责注释，并同步更新本地图。

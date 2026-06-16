# 自定义简历模块功能实施计划

## 1. 需求目标

在现有简历编辑工作台中增加“自定义模块”能力，并保持项目当前的漫画风应用界面、专业简历模板、纯本地存储和实时预览体验不变。

目标能力：

- 在左侧“布局”面板底部增加“添加模块”按钮。
- 每次点击创建一个独立的自定义模块，支持创建多个。
- 自定义模块可被选中、重命名、拖拽排序、显隐和删除。
- 每个自定义模块可创建多个自定义项目。
- 自定义项目支持拖拽排序、显隐、删除和折叠/展开。
- 自定义项目包含标题、副标题、开始时间、结束时间和详细描述。
- 详细描述继续使用项目现有 Tiptap 富文本编辑器及安全清理流程。
- 所有变化实时反映到右侧预览，并参与 A4 分页和 PDF 导出。
- 数据继续保存到 IndexedDB；连接本地目录时同步保存到 JSON 文件。

## 2. 参考图布局拆解

### 左侧布局区

- 固定模块与自定义模块使用同一列表和同一套卡片风格。
- 自定义模块使用独立图标和主题色，与固定模块形成可识别但不突兀的差异。
- 选中状态沿用当前项目的粗黑描边、黄色背景和硬阴影。
- 模块卡片提供拖拽手柄、显隐和删除操作。
- “添加模块”按钮放在模块列表底部，使用虚线边框和项目现有按钮视觉。

### 中间编辑区

- 顶部显示当前自定义模块图标、名称和编辑入口。
- 点击编辑入口后可修改模块名称；建议使用原位输入框，回车或失焦确认，Escape 取消。
- 下方按卡片展示自定义项目。
- 项目标题栏左侧为拖拽手柄，右侧依次为显隐、删除、折叠/展开。
- 展开后显示标题、副标题、时间范围和详细描述。
- 底部提供“添加项目”按钮。

### 右侧预览区

- 自定义模块沿用经典模板现有章节标题、分隔线、条目标题、副标题、时间和富文本描述排版。
- 隐藏的模块或项目不进入预览、分页和 PDF。
- 同一自定义模块的项目保持用户设置的顺序。

## 3. 核心设计决策

### 3.1 模块按 ID 管理

当前 Store 使用固定 `ModuleType` 作为活动模块和更新目标，无法区分多个同类型自定义模块。改造后：

- `activeModule` 改为 `activeModuleId`。
- 模块选择、重命名、显隐、删除、条目增删改和排序全部按 `module.id` 寻址。
- 固定模块仍保留 `type` 便于走专用编辑和模板逻辑。
- 自定义模块统一使用 `type: "custom"`，每个实例通过唯一 `id` 区分。

### 3.2 数据模型升级与旧数据迁移

将简历文档从 `version: 1` 升级为 `version: 2`，解除 `modules.length(5)` 限制。

建议结构：

```ts
type ResumeModule =
  | FixedResumeModule
  | CustomResumeModule;

type CustomResumeModule = {
  id: string;
  type: "custom";
  title: string;
  visible: boolean;
  items: CustomResumeEntry[];
};

type CustomResumeEntry = {
  id: string;
  title: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  description: string;
  visible: boolean;
};
```

迁移要求：

- 保留对 `version: 1` 文档的读取能力。
- 读取 IndexedDB 或目录 JSON 时，先识别版本，再迁移并通过最新版 Schema 校验。
- 旧版 5 个固定模块无损迁移为 `version: 2`。
- 固定模块仍要求唯一；`basics` 必须存在、位于首位且始终可见。
- 自定义模块数量和模块内项目数量不做业务上限，但 Schema 仍校验字段类型。
- 保存时只写最新版结构，使迁移后的数据自然完成升级。

### 3.3 显隐与折叠状态

- 模块 `visible`：持久化到简历文档，影响预览和 PDF。
- 自定义项目 `visible`：持久化到简历文档，影响预览、分页和 PDF。
- 项目折叠：仅属于编辑器显示状态，不写入简历文档；建议在 `EditorContent` 内按项目 ID 保存折叠集合。
- 新增项目默认可见并展开。

### 3.4 删除规则

- 只有自定义模块提供删除功能，固定五个模块继续保持当前产品约束。
- 删除模块前使用项目现有 `Modal` 二次确认，说明该模块及其项目会一并删除。
- 删除当前活动模块后，将活动模块切换到相邻模块；无相邻项时回到 `basics`。
- 删除项目可直接执行或增加轻量确认；实现时以项目现有删除交互的一致性为准。

### 3.5 拖拽策略

- 模块排序继续基于当前原生 HTML Drag and Drop，不新增依赖。
- 自定义项目排序复用同一交互模式：拖拽开始、目标高亮、放置、结束清理。
- 固定 `basics` 始终锁定在第一位，其他固定模块与自定义模块可混合排序。
- 同时保留清晰的 `aria-label`；如原生拖拽无法提供完整键盘操作，应保留上移/下移的可访问备用操作或补充键盘排序。

## 4. 分阶段实施

### 阶段一：升级简历模型

主要文件：

- `src/features/resume-model/resume-model.ts`
- `src/features/resume-model/resume-model.test.ts`

任务：

1. 为模块类型增加 `custom`。
2. 为自定义项目增加持久化的 `visible` 字段。
3. 将模块 Schema 改为固定模块与自定义模块的可辨识联合类型。
4. 将文档版本升级为 2，并允许 5 个固定模块之外追加任意数量自定义模块。
5. 新增统一的文档解析和迁移函数，作为所有外部数据的唯一入口。
6. 增加模型操作：创建、重命名、删除、显隐和排序自定义模块；按模块 ID 操作项目。
7. 保留 `basics` 首位、可见和不可删除约束。
8. 所有富文本字段继续通过 `normalizeRichText()` 规范化。

测试重点：

- 默认简历符合 v2 Schema。
- v1 简历可迁移且内容不丢失。
- 多个自定义模块可同时通过校验。
- 自定义模块增删、改名、显隐和排序正确。
- `basics` 无法隐藏、删除或拖离首位。

### 阶段二：统一 Store 的模块寻址

主要文件：

- `src/stores/resume-store.ts`
- `src/stores/resume-store.test.ts`

任务：

1. 将 `activeModule: ModuleType` 改为 `activeModuleId: string`。
2. 将模块和项目 action 改为接收 `moduleId`，避免多个 `custom` 模块互相误操作。
3. 新增 `addCustomModule`、`renameModule`、`removeCustomModule`。
4. 新增或统一 `toggleEntry`、`reorderEntry`。
5. 新模块使用 `crypto.randomUUID()` 生成 ID，默认名称按现有数量生成，例如“自定义模块 1”。
6. 新模块创建后立即设为活动模块，便于用户继续编辑。
7. 删除活动模块后自动选择有效模块。
8. 避免模型函数已经 `touch()` 后 Store 再次更新时间，统一时间戳更新边界。

测试重点：

- 连续创建多个自定义模块时 ID 唯一、名称递增。
- 修改其中一个模块不会影响另一个模块。
- 项目新增、修改、显隐、排序和删除按正确模块执行。
- 删除活动模块后活动 ID 始终有效。

### 阶段三：改造左侧布局面板

主要文件：

- `src/features/editor/style-panel.tsx`
- `src/features/editor/module-meta.tsx`
- 必要时新增 `src/features/editor/style-panel.test.tsx`

任务：

1. 模块列表改为根据实例 ID 判断选中状态。
2. 为 `custom` 增加与现有视觉匹配的 Lucide 图标、颜色和默认文案。
3. 在列表底部增加“添加模块”按钮。
4. 自定义模块卡片增加删除按钮；所有非基础模块保留显隐与拖拽。
5. 删除自定义模块时使用现有 `Modal` 和 `useOverlay`。
6. 调整操作按钮显隐，兼顾鼠标悬停、触屏设备和键盘焦点，不能只依赖 `group-hover`。
7. 拖拽排序改为按模块 ID 或可靠索引提交，并保持基础信息锁定首位。

验收点：

- 新模块创建后立即出现在列表中并被选中。
- 多个自定义模块能与固定模块混合排序。
- 显隐状态有明确图标反馈。
- 删除不会误删固定模块或其他自定义模块。

### 阶段四：实现自定义模块编辑区

主要文件：

- `src/features/editor/editor-content.tsx`
- 可拆分新增 `src/features/editor/custom-module-editor.tsx`
- 可拆分新增 `src/features/editor/custom-entry-editor.tsx`
- `src/features/editor/editor-content.test.tsx`

任务：

1. 编辑区根据活动模块 ID 查找模块，再根据 `type` 分派固定模块或自定义模块编辑器。
2. 自定义模块顶部提供原位名称编辑。
3. 名称为空时回退到默认名称，避免预览出现无标题章节。
4. 自定义项目卡片实现展开和折叠状态。
5. 项目卡片标题栏提供拖拽、显隐、删除和折叠操作。
6. 展开区域复用现有 `Field`、`DateInput` 和 `RichTextEditor` 的视觉与行为。
7. 字段标签固定为“标题”“副标题”“开始时间”“结束时间”“详细描述”。
8. 增加“添加项目”按钮；新增后自动展开并可立即输入。
9. 空模块显示引导文案，不让中间区域出现无反馈空白。
10. 控制组件拆分，避免继续扩大 `editor-content.tsx`。

测试重点：

- 模块名称可修改并同步到 Store。
- 自定义项目的五类内容可正常编辑。
- 折叠不删除数据，显隐会更新持久化字段。
- 多个项目可以新增、删除和重新排序。
- 富文本编辑继续输出经过白名单清理的 HTML。

### 阶段五：补齐移动端模块切换

主要文件：

- `src/features/editor/editor-shell.tsx`

任务：

1. `ModuleTabs` 不再遍历固定 `moduleMeta`，而是遍历当前简历的模块实例。
2. 标签使用模块 ID 作为 key 和活动值。
3. 自定义模块显示用户设置的名称和自定义图标。
4. 新增或删除模块后，移动端标签立即更新。
5. 标签过多时继续使用横向滚动，并保证当前活动项可见。

验收点：

- 手机和平板可以进入任意一个自定义模块。
- 多个同类型自定义模块不会被视为同一个标签。
- 删除模块后移动端不会停留在失效的活动状态。

### 阶段六：接入预览、分页和 PDF

主要文件：

- `src/features/templates/classic-template.tsx`
- `src/features/templates/resume-pages.ts`
- `src/features/templates/resume-pages.test.ts`
- 必要时新增模板组件测试

任务：

1. 经典模板按自定义模块名称渲染章节标题。
2. 自定义项目显示标题、副标题、时间范围和富文本描述。
3. 模板渲染前过滤 `visible: false` 的自定义项目。
4. 分页计算只统计可见项目，避免隐藏项目占用高度预算。
5. 自定义模块跨页时沿用现有模块拆分行为和标题重复规则。
6. 根据实际自定义项目排版检查 `estimateEntryHeight()`，必要时调整标题、日期和富文本行数估算。
7. PDF 导出继续复用预览页面 DOM，不增加独立渲染分支。

测试重点：

- 隐藏模块和隐藏项目均不进入预览。
- 自定义项目顺序与编辑器一致。
- 长自定义模块可以跨多页且项目不丢失、不重复。
- 中文长文本、空副标题、单边日期和富文本列表均能正常显示。

### 阶段七：统一持久化迁移入口

主要文件：

- `src/features/storage/resume-repository.ts`
- `src/features/storage/directory-sync.ts`
- 对应存储测试

任务：

1. IndexedDB 读取统一调用“解析并迁移”函数，不直接使用最新版 Schema 硬解析旧数据。
2. 目录 JSON 读取走同一迁移入口。
3. IndexedDB、目录 JSON 写入前统一校验 v2 文档。
4. 从 v1 读取成功后，在后续自动保存时升级为 v2。
5. 保留目录权限检查、IndexedDB 兜底和 `lastModified` 冲突检测。
6. 不需要升级 IndexedDB 数据库版本，因为对象仓库结构未变化；文档内部版本由模型迁移负责。

测试重点：

- IndexedDB 中的 v1 数据可加载。
- 本地目录中的 v1 JSON 可加载并再次保存为 v2。
- 非法自定义模块、非法项目字段和未清理数据无法越过 Schema 边界。
- 目录冲突行为不因模型升级而改变。

### 阶段八：完整验证

自动化命令：

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

浏览器手动验证：

1. 创建 3 个自定义模块，确认名称和数据相互独立。
2. 将自定义模块拖到不同固定模块之间并刷新页面，确认顺序保留。
3. 在一个模块内创建多个项目并拖拽排序。
4. 分别隐藏模块和单个项目，确认右侧预览与 PDF 同步变化。
5. 修改模块名、标题、副标题、日期和富文本，确认约 650ms 自动保存。
6. 删除当前活动模块，确认界面自动切换到有效模块。
7. 验证桌面三栏、平板和手机“内容 / 样式 / 预览”模式。
8. 验证单页、多页、超长描述、空字段、中文列表和链接。
9. 在桌面 Chrome 验证目录 JSON 写入、重新打开、外部修改冲突和 IndexedDB 兜底。
10. 导出 PDF，确认模块顺序、显隐、分页和字体样式与预览一致。

## 5. 预计文件改动清单

必改文件：

- `src/features/resume-model/resume-model.ts`
- `src/stores/resume-store.ts`
- `src/features/editor/style-panel.tsx`
- `src/features/editor/module-meta.tsx`
- `src/features/editor/editor-content.tsx`
- `src/features/editor/editor-shell.tsx`
- `src/features/templates/classic-template.tsx`
- `src/features/templates/resume-pages.ts`
- `src/features/storage/resume-repository.ts`
- `src/features/storage/directory-sync.ts`

建议新增文件：

- `src/features/editor/custom-module-editor.tsx`
- `src/features/editor/custom-entry-editor.tsx`

需同步修改或新增的测试：

- `src/features/resume-model/resume-model.test.ts`
- `src/stores/resume-store.test.ts`
- `src/features/editor/editor-content.test.tsx`
- `src/features/editor/style-panel.test.tsx`
- `src/features/templates/resume-pages.test.ts`
- `src/features/storage/resume-repository.test.ts`
- `src/features/storage/directory-sync.test.ts`

## 6. 完成标准

以下条件全部满足才视为功能完成：

- 可以创建、选择、重命名、排序、显隐和删除多个自定义模块。
- 每个自定义模块可以独立管理多个自定义项目。
- 自定义项目支持拖拽排序、显隐、删除和折叠。
- 五类项目内容均可编辑，并使用现有日期输入与富文本能力。
- 桌面端和移动端都能正确选择自定义模块。
- 预览和 PDF 正确反映模块名称、顺序、项目顺序及显隐状态。
- 旧版 IndexedDB 与目录 JSON 数据可以无损迁移。
- 不破坏基础信息首位、目录冲突检测、富文本清理和 IndexedDB 兜底。
- 完整测试、类型检查、Lint 和生产构建通过。

## 7. 实施顺序建议

严格按“模型迁移 → Store → 左侧布局 → 中间编辑 → 移动端 → 预览分页 → 存储验证”的顺序开发。不要先做界面再补模型，否则多个自定义模块会因现有按 `type` 寻址而互相覆盖，旧的本地简历也可能在 Schema 升级后无法打开。

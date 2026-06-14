# 简历工坊

一款使用 Next.js 构建的纯本地简历编辑器。应用界面采用活力彩色动漫风，导出的简历保持专业、克制。

## 功能

- 我的简历、模板库、通用设置和响应式编辑工作台
- 基本信息、专业技能、工作经历、项目经历、教育经历
- 模块显隐与排序、经历条目增删与排序、主题和排版设置
- 桌面 Chrome 本地目录同步，IndexedDB 缓存恢复
- 移动端完整编辑并独立保存在浏览器缓存
- A4 多页实时预览和 PDF 直接下载
- 无账号、无云服务、无 AI

## 开发

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`。

## 验证

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

目录同步依赖 File System Access API，仅承诺支持最新版桌面 Chrome，并要求 HTTPS 或 localhost。

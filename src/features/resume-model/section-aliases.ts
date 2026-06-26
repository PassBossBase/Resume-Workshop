/**
 * 简历别名词库 —— 用于 PDF/文本导入识别时，将自然语言中的章节标题映射到系统模块类型。
 *
 * 使用场景：
 * - PDF 简历导入时根据标题行识别所属模块
 * - 纯文本简历解析时推断段落归属
 * - 未来拓展：外部数据源（招聘平台导出等）的字段映射
 *
 * 所有别名按使用频率排序，靠前的匹配优先级更高。
 */

import type { ModuleType } from "./resume-model";

// ──────────────────────────────────────
// 模块章节别名（标题行 → ModuleType）
// ──────────────────────────────────────

export const SECTION_ALIASES: Record<ModuleType, string[]> = {
  basics: [
    "基本信息",
    "个人信息",
    "个人资料",
    "联系方式",
    "联系信息",
    "基础信息",
    "基本资料",
    "个人档案",
    "用户信息",
    "PROFILE",
    "PERSONAL INFO",
    "CONTACT",
    "CONTACT INFO",
    "PERSONAL INFORMATION",
    "BASIC INFO",
  ],

  skills: [
    "专业技能",
    "技能清单",
    "技能特长",
    "技术栈",
    "技术能力",
    "核心能力",
    "核心技能",
    "专业能力",
    "职业技能",
    "IT 技能",
    "计算机技能",
    "软件技能",
    "编程技能",
    "开发技能",
    "技能优势",
    "能力标签",
    "个人技能",
    "擅长领域",
    "技能",
    "专业技能与工具",
    "SKILLS",
    "TECHNICAL SKILLS",
    "TECH SKILLS",
    "CORE COMPETENCIES",
    "EXPERTISE",
    "TECHNOLOGIES",
    "TOOLS & TECHNOLOGIES",
  ],

  work: [
    "工作经历",
    "工作经验",
    "实习经历",
    "实习经验",
    "任职经历",
    "职业经历",
    "工作履历",
    "职业背景",
    "相关经历",
    "社会经历",
    "从业经历",
    "主要经历",
    "工作/实习经历",
    "工作与实习经历",
    "工作经验与实习",
    "实习与工作经历",
    "WORK EXPERIENCE",
    "EXPERIENCE",
    "EMPLOYMENT",
    "EMPLOYMENT HISTORY",
    "PROFESSIONAL EXPERIENCE",
    "WORK HISTORY",
    "CAREER HISTORY",
    "INTERNSHIP",
    "INTERNSHIPS",
    "PROFESSIONAL BACKGROUND",
  ],

  projects: [
    "项目经历",
    "项目经验",
    "项目实践",
    "项目履历",
    "项目案例",
    "代表项目",
    "个人项目",
    "开发项目",
    "作品项目",
    "重点项目",
    "项目展示",
    "项目作品",
    "主要项目",
    "参与项目",
    "项目",
    "PROJECTS",
    "PROJECT EXPERIENCE",
    "PERSONAL PROJECTS",
    "PORTFOLIO",
    "PROJECT SHOWCASE",
    "KEY PROJECTS",
    "SELECTED PROJECTS",
    "OPEN SOURCE",
    "SIDE PROJECTS",
  ],

  education: [
    "教育经历",
    "教育背景",
    "学习经历",
    "教育培训",
    "培训经历",
    "学历背景",
    "学历信息",
    "教育信息",
    "学业经历",
    "在校经历",
    "求学经历",
    "学历",
    "教育",
    "学术背景",
    "EDUCATION",
    "EDUCATION BACKGROUND",
    "ACADEMIC BACKGROUND",
    "ACADEMIC HISTORY",
    "QUALIFICATIONS",
    "EDUCATIONAL HISTORY",
    "TRAINING",
    "COURSEWORK",
  ],

  custom: [
    "自我评价",
    "个人评价",
    "个人优势",
    "个人总结",
    "自我介绍",
    "自荐信",
    "求职信",
    "自我描述",
    "个人概述",
    "个人简介",
    "荣誉证书",
    "证书奖项",
    "证书",
    "获奖经历",
    "荣誉奖励",
    "获奖情况",
    "奖项荣誉",
    "所获荣誉",
    "荣誉与奖项",
    "语言能力",
    "外语能力",
    "语言水平",
    "语言技能",
    "兴趣爱好",
    "兴趣特长",
    "个人爱好",
    "校园经历",
    "社团经历",
    "学生工作",
    "其他信息",
    "其他经历",
    "补充信息",
    "补充说明",
    "附加信息",
    "求职意向",
    "职业目标",
    "期望职位",
    "期望城市",
    "期望薪资",
  ],
};

// ──────────────────────────────────────
// 基本信息字段别名（字段标签 → basics 子字段）
// ──────────────────────────────────────

export const BASICS_FIELD_ALIASES: Record<string, string[]> = {
  name: [
    "姓名",
    "名字",
    "NAME",
    "FULL NAME",
  ],

  role: [
    "职位",
    "岗位",
    "应聘岗位",
    "求职意向",
    "目标岗位",
    "期望职位",
    "应聘职位",
    "职业方向",
    "求职方向",
    "ROLE",
    "TITLE",
    "POSITION",
    "JOB TITLE",
    "DESIRED POSITION",
  ],

  email: [
    "邮箱",
    "电子邮箱",
    "电子邮件",
    "E-mail",
    "邮件",
    "EMAIL",
    "E-MAIL",
    "MAIL",
  ],

  phone: [
    "电话",
    "手机",
    "手机号",
    "联系电话",
    "联系方式",
    "手机号码",
    "PHONE",
    "MOBILE",
    "TEL",
    "TELEPHONE",
    "CELL",
  ],

  location: [
    "地址",
    "所在地",
    "所在城市",
    "现居",
    "现居地",
    "现居城市",
    "城市",
    "居住地",
    "当前所在地",
    "LOCATION",
    "ADDRESS",
    "CITY",
    "CURRENT LOCATION",
    "BASE",
  ],

  birthday: [
    "出生日期",
    "出生年月",
    "生日",
    "出生",
    "年龄",
    "BIRTHDAY",
    "DATE OF BIRTH",
    "BIRTH DATE",
    "DOB",
    "AGE",
  ],

  status: [
    "当前状态",
    "求职状态",
    "到岗时间",
    "工作状态",
    "在职状态",
    "STATUS",
    "CURRENT STATUS",
    "AVAILABILITY",
  ],

  website: [
    "个人网站",
    "个人主页",
    "个人博客",
    "主页",
    "网站",
    "博客",
    "作品集链接",
    "在线作品集",
    "GitHub",
    "Gitee",
    "码云",
    "掘金",
    "SegmentFault",
    "知乎",
    "LinkedIn",
    "领英",
    "WEBSITE",
    "PORTFOLIO URL",
    "BLOG",
    "HOMEPAGE",
    "PERSONAL SITE",
  ],
};

// ──────────────────────────────────────
// 条目通用字段别名（条目内字段标签）
// ──────────────────────────────────────

export const ENTRY_FIELD_ALIASES: Record<string, string[]> = {
  title: [
    "公司名称",
    "单位名称",
    "学校名称",
    "机构名称",
    "项目名称",
    "公司",
    "单位",
    "学校",
    "机构",
    "项目",
  ],

  subtitle: [
    "职位",
    "岗位",
    "担任职务",
    "专业",
    "学位",
    "学历",
    "部门",
    "所属部门",
  ],

  startDate: [
    "开始时间",
    "开始日期",
    "入职时间",
    "入学时间",
    "起始时间",
    "起始日期",
    "FROM",
    "START DATE",
  ],

  endDate: [
    "结束时间",
    "结束日期",
    "离职时间",
    "毕业时间",
    "终止时间",
    "终止日期",
    "TO",
    "END DATE",
  ],

  description: [
    "工作内容",
    "工作职责",
    "职责描述",
    "项目描述",
    "项目介绍",
    "项目背景",
    "主要工作",
    "工作成果",
    "工作业绩",
    "项目成果",
    "项目亮点",
    "技术栈",
    "使用技术",
    "在校经历",
    "主修课程",
    "所学课程",
    "详细描述",
    "内容描述",
    "描述",
  ],
};

// ──────────────────────────────────────
// 常见自定义模块子类别
// ──────────────────────────────────────

/** 自定义模块的常见子类别名称，用于更精细的识别。 */
export const CUSTOM_SUB_CATEGORIES: Record<string, string[]> = {
  awards: [
    "荣誉奖项",
    "获奖经历",
    "荣誉奖励",
    "奖项荣誉",
    "所获荣誉",
    "证书奖项",
    "获奖情况",
    "CERTIFICATES",
    "AWARDS",
    "HONORS",
    "ACHIEVEMENTS",
    "AWARDS & HONORS",
  ],

  certificates: [
    "证书",
    "资格证书",
    "职业证书",
    "技能证书",
    "专业证书",
    "资质证书",
    "持证情况",
    "CERTIFICATIONS",
    "LICENSES",
    "CREDENTIALS",
  ],

  selfEvaluation: [
    "自我评价",
    "个人评价",
    "个人优势",
    "个人总结",
    "自我介绍",
    "自荐信",
    "求职信",
    "PROFILE SUMMARY",
    "SUMMARY",
    "ABOUT ME",
    "PERSONAL STATEMENT",
    "OBJECTIVE",
    "CAREER OBJECTIVE",
  ],

  languages: [
    "语言能力",
    "外语能力",
    "语言水平",
    "语言技能",
    "外语水平",
    "LANGUAGES",
    "LANGUAGE SKILLS",
    "FOREIGN LANGUAGES",
  ],

  interests: [
    "兴趣爱好",
    "个人爱好",
    "兴趣特长",
    "兴趣",
    "爱好",
    "INTERESTS",
    "HOBBIES",
  ],

  campus: [
    "校园经历",
    "社团经历",
    "学生工作",
    "校内实践",
    "社会实践",
    "志愿者经历",
    "组织经历",
    "CAMPUS ACTIVITIES",
    "EXTRACURRICULAR",
    "VOLUNTEER",
    "VOLUNTEER EXPERIENCE",
    "LEADERSHIP EXPERIENCE",
  ],

  publications: [
    "论文发表",
    "学术论文",
    "科研成果",
    "著作",
    "专利",
    "知识产权",
    "PUBLICATIONS",
    "RESEARCH",
    "PAPERS",
    "PATENTS",
  ],

  intention: [
    "求职意向",
    "职业目标",
    "期望职位",
    "期望城市",
    "期望行业",
    "期望薪资",
    "到岗时间",
    "工作性质",
    "CAREER OBJECTIVE",
    "JOB PREFERENCE",
    "DESIRED POSITION",
    "TARGET ROLE",
  ],
};

// ──────────────────────────────────────
// 工具函数
// ──────────────────────────────────────

/** 根据章节标题文本反向查找 ModuleType */
export function resolveSectionType(title: string): ModuleType | null {
  const normalized = title.replace(/\s+/g, "").toLowerCase();

  for (const [type, aliases] of Object.entries(SECTION_ALIASES)) {
    for (const alias of aliases) {
      if (normalized === alias.replace(/\s+/g, "").toLowerCase()) {
        return type as ModuleType;
      }
    }
  }

  return null;
}

/** 根据字段标签反向查找 basics 字段名 */
export function resolveBasicsField(label: string): string | null {
  const normalized = label.replace(/\s+/g, "").toLowerCase();

  for (const [field, aliases] of Object.entries(BASICS_FIELD_ALIASES)) {
    for (const alias of aliases) {
      if (normalized === alias.replace(/\s+/g, "").toLowerCase()) {
        return field;
      }
    }
  }

  return null;
}

/** 根据子类别名称反向查找 custom 子类别键 */
export function resolveCustomSubCategory(label: string): string | null {
  const normalized = label.replace(/\s+/g, "").toLowerCase();

  for (const [key, aliases] of Object.entries(CUSTOM_SUB_CATEGORIES)) {
    for (const alias of aliases) {
      if (normalized === alias.replace(/\s+/g, "").toLowerCase()) {
        return key;
      }
    }
  }

  return null;
}

/** 获取某个模块类型的所有别名（扁平数组） */
export function getSectionAliases(type: ModuleType): string[] {
  return SECTION_ALIASES[type] ?? [];
}

/** 获取某个 basics 字段的所有别名 */
export function getBasicsFieldAliases(field: string): string[] {
  return BASICS_FIELD_ALIASES[field] ?? [];
}

/** 检查文本是否匹配某个模块类型的任意别名 */
export function matchesSectionAlias(text: string, type: ModuleType): boolean {
  return resolveSectionType(text) === type;
}

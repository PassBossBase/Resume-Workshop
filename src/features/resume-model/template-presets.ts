/**
 * 4 套内置简历模板 —— 从 templete/*.json 转换而来。
 *
 * 约定：所有"全民简历"替换为"个人简历"。
 * 模块标题统一与编辑器保持一致：基本信息、专业技能、工作经历、项目经历、教育经历。
 * 未覆盖的固定模块（如 projects）使用空占位。
 */
import {
  DEFAULT_OPTIONAL_BASIC_FIELD_ORDER,
  createBlankResume,
  createDefaultResume,
  type ResumeDocument,
} from "@/features/resume-model/resume-model";
import { normalizeRichText } from "@/features/rich-text/rich-text";

const now = new Date().toISOString();

function entryFields(
  id: string,
  title: string,
  subtitle: string,
  startDate: string,
  endDate: string,
  description: string,
) {
  return {
    id,
    title,
    subtitle,
    startDate,
    endDate,
    description: normalizeRichText(description),
  };
}

// ── 模板 1：顶部全宽蓝色头部单栏简历 ──

export function createHeaderFullWidthTemplate(): ResumeDocument {
  return {
    version: 3 as const,
    id: crypto.randomUUID(),
    title: "顶部全宽蓝色头部单栏简历",
    createdAt: now,
    updatedAt: now,
    templateId: "single_column_header_full_width",
    layoutConfig: {
      type: "single_column_header_full_width",
      headerBgColor: "#2b6cb0",
      contentBgColor: "#ffffff",
      titleColor: "#1a365d",
      textColor: "#2d3748",
      accentColor: "#3182ce",
    },
    styles: {
      accent: "#3182ce",
      fontFamily: "sans",
      fontSize: 14,
      lineHeight: 1.6,
      pageMargin: 40,
      sectionGap: 28,
    },
    modules: [
      {
        id: "basics",
        type: "basics" as const,
        title: "基本信息",
        visible: true,
        basics: {
          name: "李有才",
          role: "产品经理",
          status: "一个月内到岗",
          birthday: "",
          email: "qmjianli@163.com",
          phone: "15800000008",
          location: "上海",
          website: "",
          avatar: "",
          avatarPosition: { top: 20, right: 20, width: 130, height: 150 },
          hiddenFields: [],
          removedFields: [],
          fieldOrder: DEFAULT_OPTIONAL_BASIC_FIELD_ORDER,
          infoItems: [
            { label: "年龄", value: "30岁" },
            { label: "工作年限", value: "6年经验" },
            { label: "期望薪资", value: "12000" },
          ],
        },
        items: [],
      },
      {
        id: "skills",
        type: "skills" as const,
        title: "专业技能",
        visible: true,
        sectionIcon: "skill",
        items: [
          entryFields(
            "skill-1",
            "综合能力",
            "",
            "",
            "",
            "精通各个产品类型的设计和运营，充分利用现有资源整合资源，让项目顺利开展。\n熟练掌握产品设计体系，能够很好的把控各个环节的进度，督促各个环节高效的完成项目研发。",
          ),
        ],
      },
      {
        id: "work",
        type: "work" as const,
        title: "工作经历",
        visible: true,
        sectionIcon: "work",
        items: [
          entryFields(
            "work-1",
            "阿里巴巴",
            "产品经理",
            "2019/11",
            "至今",
            "负责公司业务系统的设计及改进，参与公司网上商城系统产品设计工作。负责全公司组织系统搭建工作研讨。\n负责客户调研、客户需求分析、方案写作等工作，参与公司多个大型电子商务项目的策划工作。\n担任大商集团网上商城一期建设项目经理。负责全公司组织系统的搭建、修订及工作职责研讨和修订任务。",
          ),
          entryFields(
            "work-2",
            "个人简历科技有限公司",
            "产品经理",
            "2016/01",
            "2019/11",
            "详细描述你的职责范围、工作任务及取得的成绩，工作经验的时间采取倒叙形式，最近经历写在前面，简洁大方即可。\n描述尽量具体简洁，工作经验的描述与目标岗位的招聘要求尽量匹配，工作经验的描述与岗位，用词精准。",
          ),
        ],
      },
      {
        id: "projects",
        type: "projects" as const,
        title: "项目经历",
        visible: false,
        items: [],
      },
      {
        id: "education",
        type: "education" as const,
        title: "教育经历",
        visible: true,
        sectionIcon: "edu",
        items: [
          entryFields(
            "edu-1",
            "上海交通大学",
            "工商管理 (本科)",
            "2021/06",
            "2021/11",
            "学士学位，专业前10名。\n主修课程：管理学、微观经济学、宏观经济学、信息系统、统计学、市场营销、广告营销、金融学、大数据等。\n带领自己的团队，辅助上海斧掌公司完成在各高校的伏龙计划，向全球顶尖的金融公司推送实习生资源。\n依据管理学、经济学、会计学、统计学等基本理论，通过运用现代管理的方法和手段来进行有效的企业决策。",
          ),
        ],
      },
      {
        id: "custom-cert",
        type: "custom" as const,
        title: "荣誉证书",
        visible: true,
        sectionIcon: "cert",
        items: [
          {
            id: "cert-1",
            title: "学校一等奖学金",
            subtitle: "",
            startDate: "",
            endDate: "",
            description: "获得学校一等奖学金。",
            visible: true,
          },
          {
            id: "cert-2",
            title: "大学英语四级",
            subtitle: "",
            startDate: "",
            endDate: "",
            description: "听说读写能力良好，能快速浏览英语专业文件及书籍。",
            visible: true,
          },
          {
            id: "cert-3",
            title: "全国计算机二级",
            subtitle: "",
            startDate: "",
            endDate: "",
            description: "熟练运用office软件。",
            visible: true,
          },
        ],
      },
      {
        id: "custom-eval",
        type: "custom" as const,
        title: "自我评价",
        visible: true,
        sectionIcon: "eval",
        items: [
          {
            id: "eval-1",
            title: "",
            subtitle: "",
            startDate: "",
            endDate: "",
            description: normalizeRichText(
              "自我介绍篇幅不要太长，注意结合简历整体的美观度，如果真的有很多话要说，建议以求职信的形式附上。\n自我评价应做到突出自身符合目标岗位要求的卖点，避免过多使用形容词，而应该通过数据及实例来对自身价值进行深化。",
            ),
            visible: true,
          },
        ],
      },
    ],
  };
}

// ── 模板 2：左侧侧边栏深色双栏简历 ──

export function createSidebarLeftTemplate(): ResumeDocument {
  return {
    version: 3 as const,
    id: crypto.randomUUID(),
    title: "左侧侧边栏深色双栏简历",
    createdAt: now,
    updatedAt: now,
    templateId: "two_column_sidebar_left",
    layoutConfig: {
      type: "two_column_sidebar_left",
      sidebarBgColor: "#23395d",
      sidebarWidth: 260,
      sidebarTextColor: "#ffffff",
      contentBgColor: "#ffffff",
      titleColor: "#23395d",
      textColor: "#333333",
    },
    styles: {
      accent: "#23395d",
      fontFamily: "sans",
      fontSize: 13,
      lineHeight: 1.55,
      pageMargin: 32,
      sectionGap: 24,
    },
    modules: [
      {
        id: "basics",
        type: "basics" as const,
        title: "基本信息",
        visible: true,
        basics: {
          name: "李有才",
          role: "产品经理",
          status: "应届生",
          birthday: "",
          email: "qmjianli@163.com",
          phone: "15800000008",
          location: "上海",
          website: "",
          avatar: "",
          avatarPosition: { top: 30, right: 0, width: 160, height: 180 },
          hiddenFields: [],
          removedFields: [],
          fieldOrder: DEFAULT_OPTIONAL_BASIC_FIELD_ORDER,
          infoItems: [
            { label: "年龄", value: "29岁" },
            { label: "性别", value: "男" },
            { label: "期望薪资", value: "8000" },
            { label: "入职时间", value: "一周内到岗" },
          ],
        },
        items: [],
      },
      {
        id: "skills",
        type: "skills" as const,
        title: "专业技能",
        visible: true,
        items: [
          entryFields(
            "skill-1",
            "综合技能",
            "",
            "",
            "",
            "精通产品设计体系，能够很好的把控各个环节的进度。\n熟练运用办公自动化软件，善于在工作中提出问题、发现问题、解决问题。",
          ),
        ],
      },
      {
        id: "work",
        type: "work" as const,
        title: "工作经历",
        visible: true,
        sectionIcon: "work",
        items: [
          entryFields(
            "work-1",
            "阿里巴巴",
            "产品经理",
            "2019/11",
            "至今",
            "负责公司业务系统的设计及改进，参与公司网上商城系统产品设计工作。\n负责客户调研、客户需求分析、方案写作等工作，参与公司多个大型电子商务项目的策划工作，担任大商集团网上商城一期建设项目经理。",
          ),
          entryFields(
            "work-2",
            "个人简历科技有限公司",
            "产品经理",
            "2016/01",
            "2017/08",
            "详细描述你的职责范围、工作任务及取得的成绩，工作经验的时间采取倒叙形式。\n描述尽量具体简洁，工作经验的描述与目标岗位的招聘要求尽量匹配。",
          ),
        ],
      },
      {
        id: "projects",
        type: "projects" as const,
        title: "项目经历",
        visible: true,
        sectionIcon: "project",
        items: [
          entryFields(
            "proj-1",
            "阿里巴巴供应商系统改版",
            "产品设计",
            "2019/07",
            "至今",
            "设计供应商系统的网站和交互原型。汇总整理和收集各个渠道的需求。\n改版后的调研结果显示，客户满意度提升了30%。",
          ),
        ],
      },
      {
        id: "education",
        type: "education" as const,
        title: "教育经历",
        visible: true,
        sectionIcon: "edu",
        items: [
          entryFields(
            "edu-1",
            "上海交通大学",
            "工商管理 (本科)",
            "2019/07",
            "2020/01",
            "学士学位，专业前10名。\n主修课程：管理学、微观经济学、宏观经济学、信息系统、统计学、市场营销等。\n带领自己的团队，辅助上海斧掌公司完成在各高校的伏龙计划，向全球顶尖的金融公司推送实习生资源。",
          ),
        ],
      },
      {
        id: "custom-cert",
        type: "custom" as const,
        title: "荣誉证书",
        visible: true,
        sectionIcon: "cert",
        items: [
          {
            id: "cert-1",
            title: "学校一等奖学金",
            subtitle: "",
            startDate: "",
            endDate: "",
            description: "获得学校一等奖学金。",
            visible: true,
          },
          {
            id: "cert-2",
            title: "大学英语四级",
            subtitle: "",
            startDate: "",
            endDate: "",
            description: "听说读写能力良好，能快速浏览英语专业文件及书籍。",
            visible: true,
          },
          {
            id: "cert-3",
            title: "全国计算机二级",
            subtitle: "",
            startDate: "",
            endDate: "",
            description: "熟练运用office软件。",
            visible: true,
          },
        ],
      },
      {
        id: "custom-eval",
        type: "custom" as const,
        title: "自我评价",
        visible: true,
        sectionIcon: "eval",
        items: [
          {
            id: "eval-1",
            title: "",
            subtitle: "",
            startDate: "",
            endDate: "",
            description: normalizeRichText(
              "自我介绍篇幅不要太长，注意结合简历整体的美观度。\n自我评价应做到突出自身符合目标岗位要求的卖点，通过数据及实例来对自身价值进行深化。",
            ),
            visible: true,
          },
        ],
      },
    ],
  };
}

// ── 模板 3：时间轴色块行政单栏简历 ──

export function createTimelineBlockTemplate(): ResumeDocument {
  return {
    version: 3 as const,
    id: crypto.randomUUID(),
    title: "时间轴色块行政单栏简历",
    createdAt: now,
    updatedAt: now,
    templateId: "single_column_timeline_block",
    layoutConfig: {
      type: "single_column_timeline_block",
      titleColor: "#2b6cb0",
      timelineLineColor: "#94b8e0",
      blockColorList: ["#4a90e2", "#60b8a8", "#d87890", "#90c978"],
      textColor: "#222222",
    },
    styles: {
      accent: "#4a90e2",
      fontFamily: "sans",
      fontSize: 13,
      lineHeight: 1.5,
      pageMargin: 36,
      sectionGap: 24,
    },
    modules: [
      {
        id: "basics",
        type: "basics" as const,
        title: "基本信息",
        visible: true,
        basics: {
          name: "李有才",
          role: "行政专员",
          status: "求职中",
          birthday: "",
          email: "qmjianli@qq.com",
          phone: "15888888888",
          location: "",
          website: "",
          avatar: "",
          avatarPosition: { top: 10, right: 20, width: 120, height: 140 },
          hiddenFields: [],
          removedFields: [],
          fieldOrder: DEFAULT_OPTIONAL_BASIC_FIELD_ORDER,
          infoItems: [
            { label: "年龄", value: "30岁" },
            { label: "性别", value: "男" },
            { label: "工作年限", value: "6年经验" },
          ],
        },
        items: [],
      },
      {
        id: "skills",
        type: "skills" as const,
        title: "专业技能",
        visible: true,
        sectionIcon: "skill",
        items: [
          entryFields(
            "skill-1",
            "综合能力",
            "",
            "",
            "",
            "语言能力：大学英语6级证书，荣获全国大学生英语竞赛一等奖，能够熟练的进行交流、读写。\n计算机：计算机二级证书，熟练操作windows平台上的各类应用软件，如Word、Excel。\n团队能力：具有丰富的团队组建与扩充经验和项目管理与协调经验，能够独挡一面。",
          ),
        ],
      },
      {
        id: "work",
        type: "work" as const,
        title: "工作经历",
        visible: true,
        sectionIcon: "work",
        items: [
          {
            ...entryFields(
              "work-1",
              "个人简历科技有限公司",
              "行政专员",
              "2018/09",
              "至今",
              "担负本部的行政人事管理和日常事务，协助总监搞好各部门之间的综合协调，落实公司规章制度，沟通内外联系，保证上情下达和下情上报，负责对会议文件决定的事项进行催办、查办和落实，负责全公司组织系统及工作职责研讨和修订。",
            ),
            entryStyle: { bgColor: "#4a90e2" },
          },
          {
            ...entryFields(
              "work-2",
              "上海斧掌网络科技有限公司",
              "行政助理",
              "2016/09",
              "2018/08",
              "编制公司人事管理制度，规避各项人事风险。\n负责招聘工作，制定公司的人力资源发展计划，确保人才梯队发展和人才储备及培养。\n督导公司各项行政、人事制度的执行，以及各项行政人事工作的进展情况，并采取必要的措施。",
            ),
            entryStyle: { bgColor: "#60b8a8" },
          },
          {
            ...entryFields(
              "work-3",
              "阿里巴巴集团有限公司",
              "行政助理",
              "2010/02",
              "2016/07",
              "负责中心的接待工作；\n负责中心的行政事务及前台管理；\n负责中心简单财务管理，资产管控；\n负责招聘工作，确保人才梯队发展和人才储备及培养。\n负责全公司组织系统及工作职责研讨。",
            ),
            entryStyle: { bgColor: "#d87890" },
          },
          {
            ...entryFields(
              "work-4",
              "腾讯股份有限公司",
              "行政助理",
              "2009/10",
              "2009/12",
              "负责中心的接待工作；\n负责中心的行政事务及前台管理；\n负责中心简单财务管理，资产管控；\n负责招聘工作，确保人才梯队发展和人才储备及培养。\n负责全公司组织系统及工作职责研讨。",
            ),
            entryStyle: { bgColor: "#90c978" },
          },
        ],
      },
      {
        id: "projects",
        type: "projects" as const,
        title: "项目经历",
        visible: false,
        items: [],
      },
      {
        id: "education",
        type: "education" as const,
        title: "教育经历",
        visible: true,
        sectionIcon: "edu",
        items: [
          entryFields(
            "edu-1",
            "个人简历师范大学",
            "工商管理 (本科)",
            "2012",
            "2016",
            "专业成绩：GPA 3.66/4（专业前5%）\n主修课程：基础会计学、货币银行学、统计学、经济法概论、财务会计学、管理学原理、组织行为学、市场营销学、人力资源开发与管理等等。",
          ),
        ],
      },
      {
        id: "custom-cert",
        type: "custom" as const,
        title: "荣誉证书",
        visible: true,
        sectionIcon: "cert",
        items: [
          {
            id: "cert-1",
            title: "英语四级",
            subtitle: "",
            startDate: "",
            endDate: "",
            description: "听说读写能力良好，能快速浏览英语专业文件及书籍。",
            visible: true,
          },
          {
            id: "cert-2",
            title: "全国计算机二级",
            subtitle: "",
            startDate: "",
            endDate: "",
            description: "熟练运用office软件。",
            visible: true,
          },
        ],
      },
    ],
  };
}

// ── 模板 4：复古分割线顶部标题单栏简历 ──

export function createLineSeparateTemplate(): ResumeDocument {
  return {
    version: 3 as const,
    id: crypto.randomUUID(),
    title: "复古分割线顶部标题单栏简历",
    createdAt: now,
    updatedAt: now,
    templateId: "single_column_line_separate",
    layoutConfig: {
      type: "single_column_line_separate",
      headerLineColor: "#6b8ba4",
      sectionSeparateLineColor: "#334155",
      titleColor: "#223344",
      textColor: "#333333",
    },
    styles: {
      accent: "#223344",
      fontFamily: "serif",
      fontSize: 14,
      lineHeight: 1.65,
      pageMargin: 40,
      sectionGap: 30,
    },
    modules: [
      {
        id: "basics",
        type: "basics" as const,
        title: "基本信息",
        visible: true,
        basics: {
          name: "李有才",
          role: "产品经理",
          status: "一个月内到岗",
          birthday: "",
          email: "qmjianli@163.com",
          phone: "158000000008",
          location: "上海",
          website: "",
          avatar: "",
          avatarPosition: { top: 10, right: 20, width: 130, height: 150 },
          hiddenFields: [],
          removedFields: [],
          fieldOrder: DEFAULT_OPTIONAL_BASIC_FIELD_ORDER,
          infoItems: [
            { label: "年龄", value: "30岁" },
            { label: "工作年限", value: "6年经验" },
            { label: "期望薪资", value: "12000" },
            { label: "最高学历", value: "本科" },
          ],
        },
        items: [],
      },
      {
        id: "skills",
        type: "skills" as const,
        title: "专业技能",
        visible: true,
        sectionIcon: "skill",
        items: [
          entryFields(
            "skill-1",
            "综合能力",
            "",
            "",
            "",
            "精通各个产品类型的设计和运营，充分利用现有资源整合资源，让项目顺利开展。\n熟练掌握产品设计体系，能够很好的把控各个环节的进度，督促各个环节高效的完成项目研发。",
          ),
        ],
      },
      {
        id: "work",
        type: "work" as const,
        title: "工作经历",
        visible: true,
        sectionIcon: "work",
        items: [
          entryFields(
            "work-1",
            "阿里巴巴",
            "产品经理",
            "2019/11",
            "至今",
            "负责公司业务系统的设计及改进，参与公司网上商城系统产品设计工作。负责全公司组织系统搭建工作研讨。\n负责客户调研、客户需求分析、方案写作等工作，参与公司多个大型电子商务项目的策划工作。\n担任大商集团网上商城一期建设项目经理。负责全公司组织系统的搭建、修订及工作职责研讨和修订任务。",
          ),
          entryFields(
            "work-2",
            "个人简历科技有限公司",
            "产品经理",
            "2016/01",
            "2019/11",
            "详细描述你的职责范围、工作任务及取得的成绩，工作经验的时间采取倒叙形式，最近经历写在前面。\n描述尽量具体简洁，工作经验的描述与目标岗位的招聘要求尽量匹配。",
          ),
        ],
      },
      {
        id: "projects",
        type: "projects" as const,
        title: "项目经历",
        visible: false,
        items: [],
      },
      {
        id: "education",
        type: "education" as const,
        title: "教育经历",
        visible: true,
        sectionIcon: "edu",
        items: [
          entryFields(
            "edu-1",
            "上海交通大学",
            "工商管理 (本科)",
            "2021/06",
            "2021/11",
            "学士学位，专业前10名。\n主修课程：管理学、微观经济学、宏观经济学、信息系统、统计学、市场营销、广告营销、金融学、大数据等。\n带领自己的团队，辅助上海斧掌公司完成在各高校的伏龙计划，向全球顶尖的金融公司推送实习生资源。\n依据管理学、经济学、会计学、统计学等基本理论，通过运用现代管理的方法和手段来进行有效的企业决策。",
          ),
        ],
      },
      {
        id: "custom-cert",
        type: "custom" as const,
        title: "荣誉证书",
        visible: true,
        sectionIcon: "cert",
        items: [
          {
            id: "cert-1",
            title: "学校一等奖学金",
            subtitle: "",
            startDate: "",
            endDate: "",
            description: "获得学校一等奖学金。",
            visible: true,
          },
          {
            id: "cert-2",
            title: "大学英语四级",
            subtitle: "",
            startDate: "",
            endDate: "",
            description: "听说读写能力良好，能快速浏览英语专业文件及书籍。",
            visible: true,
          },
          {
            id: "cert-3",
            title: "全国计算机二级",
            subtitle: "",
            startDate: "",
            endDate: "",
            description: "熟练运用office软件。",
            visible: true,
          },
        ],
      },
      {
        id: "custom-eval",
        type: "custom" as const,
        title: "自我评价",
        visible: true,
        sectionIcon: "eval",
        items: [
          {
            id: "eval-1",
            title: "",
            subtitle: "",
            startDate: "",
            endDate: "",
            description: normalizeRichText(
              "自我介绍篇幅不要太长，注意结合简历整体的美观度，如果真的有很多话要说，建议以求职信的形式附上。\n自我评价应做到突出自身符合目标岗位要求的卖点，避免过多使用形容词，而应该通过数据及实例来对自身价值进行深化。",
            ),
            visible: true,
          },
        ],
      },
    ],
  };
}

export const builtinTemplateFactories: Record<string, () => ResumeDocument> = {
  blank: () => createBlankResume(crypto.randomUUID(), "空白简历"),
  classic: () => createDefaultResume(crypto.randomUUID(), "经典单栏简历"),
  single_column_header_full_width: createHeaderFullWidthTemplate,
  two_column_sidebar_left: createSidebarLeftTemplate,
  single_column_timeline_block: createTimelineBlockTemplate,
  single_column_line_separate: createLineSeparateTemplate,
};

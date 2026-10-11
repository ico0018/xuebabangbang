export type ToolCategory = "chinese" | "math" | "english" | "general";
export type ToolStatus = "online" | "coming-soon";

export type Tool = {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  categoryLabel: string;
  icon: string;
  tags: string[];
  status: ToolStatus;
  href?: string;
  external?: boolean;
  featured?: boolean;
  illustration: "scroll" | "character" | "checklist" | "writing";
  color: "green" | "yellow" | "blue";
  steps: [string, string, string];
  action: string;
  secondaryAction?: { label: string; href: string };
};

export const tools: Tool[] = [
  {
    id: "guwen-park",
    name: "古文乐园",
    description: "按年级读古诗古文，从逐句理解、选字排序一路练到全文默写",
    category: "chinese",
    categoryLabel: "语文",
    icon: "诗",
    tags: ["古诗", "古文", "默写", "小学"],
    status: "online",
    href:
      process.env.NEXT_PUBLIC_GUWEN_URL || "https://guwen.xuebabangbang.cn/",
    illustration: "scroll",
    color: "green",
    steps: ["选年级和课文", "听读、理解句子", "练习默写"],
    action: "开始学古文",
    external: true,
    featured: true,
  },
  {
    id: "hanzi-garden",
    name: "汉字乐园",
    description: "按课本学习生字，看笔顺，把真正不会的字留下来反复练",
    category: "chinese",
    categoryLabel: "语文",
    icon: "字",
    tags: ["生字", "笔顺", "课本", "小学"],
    status: "online",
    href:
      process.env.NEXT_PUBLIC_HANZI_URL || "https://hanzi.xuebabangbang.cn/",
    illustration: "character",
    color: "yellow",
    steps: ["选教材和课次", "看笔顺、练写字", "听写检查"],
    action: "开始学生字",
    external: true,
    featured: true,
  },
  {
    id: "composition-helper",
    name: "作文帮帮",
    description: "按年级和课题整理素材、理清思路，在纸上完成作文并自己检查",
    category: "chinese",
    categoryLabel: "语文",
    icon: "文",
    tags: ["作文", "三年级", "四年级", "写作"],
    status: "online",
    href: "/zuowen/",
    illustration: "writing",
    color: "yellow",
    steps: ["选年级和课题", "整理素材和思路", "纸上写作、自己检查"],
    action: "开始写作文",
    featured: true,
  },
  {
    id: "study-planner",
    name: "任务小帮手",
    description: "把任务拆清楚，先预测时间，再执行、检查和复盘",
    category: "general",
    categoryLabel: "学习管理",
    icon: "✓",
    tags: ["计划", "计时", "检查", "复盘"],
    status: "online",
    href:
      process.env.NEXT_PUBLIC_TASKHELPER_URL ||
      "https://taskhelper.xuebabangbang.cn/",
    illustration: "checklist",
    color: "blue",
    steps: ["家长添加任务", "孩子选时间开始", "做完自己检查"],
    action: "开始任务",
    secondaryAction: {
      label: "家长设置任务",
      href:
        (
          process.env.NEXT_PUBLIC_TASKHELPER_URL ||
          "https://taskhelper.xuebabangbang.cn"
        ).replace(/\/$/, "") + "/parent/",
    },
    external: true,
    featured: true,
  },
];

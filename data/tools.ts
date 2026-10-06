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
    href: "https://guwen.xuebabangbang.cn",
    external: true,
    featured: true,
  },
  {
    id: "hanzi-garden",
    name: "汉字花园",
    description: "按课本学习生字，看笔顺，把真正不会的字留下来反复练",
    category: "chinese",
    categoryLabel: "语文",
    icon: "字",
    tags: ["生字", "笔顺", "课本", "小学"],
    status: "online",
    href: "https://hanzi.xuebabangbang.cn",
    external: true,
    featured: true,
  },
  {
    id: "study-planner",
    name: "学习计划器",
    description: "把任务拆清楚，先预测时间，再执行、检查和复盘",
    category: "general",
    categoryLabel: "学习管理",
    icon: "✓",
    tags: ["计划", "计时", "检查", "复盘"],
    status: "online",
    href: "https://taskhelper.xuebabangbang.cn",
    external: true,
    featured: true,
  },
];

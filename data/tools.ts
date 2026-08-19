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
    id: "hanzi-garden",
    name: "汉字花园",
    description: "按课本学习、认识和练习生字",
    category: "chinese",
    categoryLabel: "语文",
    icon: "🌱",
    tags: ["语文", "生字", "小学"],
    status: "online",
    href: "https://hanzi.xuebabangbang.cn",
    external: true,
    featured: true,
  },
  {
    id: "mental-math",
    name: "口算练习",
    description: "每天几分钟，轻松练习数学口算",
    category: "math",
    categoryLabel: "数学",
    icon: "🔢",
    tags: ["数学", "口算"],
    status: "coming-soon",
    featured: true,
  },
  {
    id: "word-memory",
    name: "趣味单词记忆",
    description: "用有趣的方法帮助孩子记英语单词",
    category: "english",
    categoryLabel: "英语",
    icon: "🔤",
    tags: ["英语", "单词"],
    status: "coming-soon",
    featured: true,
  },
];

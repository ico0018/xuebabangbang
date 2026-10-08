import nodemailer from "nodemailer";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
export function mailReady() { return process.env.MAIL_PROVIDER === "development" ? process.env.ENABLE_DEV_MAIL === "true" : process.env.MAIL_PROVIDER === "smtp" && !!process.env.SMTP_HOST && !!process.env.MAIL_FROM; }
export async function sendMail(to: string, subject: string, url: string) {
  if (!mailReady()) throw new Error("邮件服务尚未配置，请设置 MAIL_PROVIDER、SMTP_HOST 和 MAIL_FROM。");
  const text = [subject, "", "请打开以下链接：", url, "", "如果不是您本人操作，请忽略此邮件。"].join("\n");
  if (process.env.MAIL_PROVIDER === "development") {
    const directory = process.env.DEV_MAIL_DIR || path.join(process.cwd(), ".dev-mail");
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await writeFile(path.join(directory, Date.now() + "-" + crypto.randomUUID() + ".json"), JSON.stringify({ to, subject, text, url }, null, 2), { mode: 0o600 });
    return;
  }
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === "true", auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined });
  await transporter.sendMail({ from: process.env.MAIL_FROM, to, subject, text });
}


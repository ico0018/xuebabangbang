"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
export function AuthForm({ mode }: { mode: "register" | "login" | "forgot-password" | "reset-password" }) {
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const titles = { register: "一起陪孩子慢慢成长", login: "欢迎回到学霸帮帮", "forgot-password": "找回账号密码", "reset-password": "设置新密码" };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || ""), password = String(data.get("password") || "");
    if ((mode === "register" || mode === "reset-password") && password !== data.get("confirm")) { setMessage("两次密码不一致。"); setBusy(false); return; }
    const endpoint = { register: "sign-up/email", login: "sign-in/email", "forgot-password": "request-password-reset", "reset-password": "reset-password" }[mode];
    const body = mode === "register" ? { email, password, name: "家长", callbackURL: location.origin + "/account" } : mode === "login" ? { email, password } : mode === "forgot-password" ? { email, redirectTo: location.origin + "/reset-password" } : { newPassword: password, token: new URLSearchParams(location.search).get("token") };
    try { const response = await fetch("/api/auth/" + endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) }); const value = await response.json(); if (!response.ok) throw new Error(value.code === "MAIL_NOT_CONFIGURED" ? value.message : "暂时未能完成，请检查输入、邮箱验证状态后重试。"); if (mode === "login") location.href = "/account"; else setMessage(mode === "register" ? "请查看验证邮件，验证后即可添加孩子档案。开发邮箱仅由测试管理员在服务器查看。" : mode === "forgot-password" ? "如果这个邮箱已注册，您将收到重置邮件。请查看邮箱。" : "密码已更新，请重新登录。"); } catch (error) { setMessage(error instanceof Error ? error.message : "网络连接失败，请重试。"); } finally { setBusy(false); }
  }
  return <div className="page-shell account-shell"><section className="account-card auth-card"><h1>{titles[mode]}</h1><p>一个家长账号，照顾每个孩子的学习记录。</p><form onSubmit={submit} className="account-form">{mode !== "reset-password" && <label>邮箱<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>}{mode !== "forgot-password" && <label>密码<input name="password" type="password" minLength={10} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} required/><small>至少 10 位，请使用不易猜到的密码。</small></label>}{(mode === "register" || mode === "reset-password") && <label>确认密码<input name="confirm" type="password" autoComplete="new-password" required/></label>}<button className="primary-button" disabled={busy}>{busy ? "请稍候…" : mode === "register" ? "注册账号" : mode === "login" ? "登录" : mode === "forgot-password" ? "发送重置邮件" : "更新密码"}</button></form><p role="status">{message}</p><div className="account-actions"><Link href="/login">登录</Link><Link href="/register">注册</Link><Link href="/forgot-password">忘记密码</Link></div><p className="muted">游客也可以直接使用首页的免费学习工具。</p></section></div>;
}


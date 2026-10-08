"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { safeReturnTo } from "../lib/auth-navigation";
export function AuthForm({
  mode,
}: {
  mode: "register" | "login" | "forgot-password" | "reset-password";
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const titles = {
    register: "一起陪孩子慢慢成长",
    login: "欢迎回到学霸帮帮",
    "forgot-password": "找回账号密码",
    "reset-password": "设置新密码",
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "")
        .trim()
        .toLowerCase(),
      password = String(data.get("password") || "");
    if (
      (mode === "register" || mode === "reset-password") &&
      password !== data.get("confirm")
    ) {
      setMessage("两次密码不一致。");
      return;
    }
    submitting.current = true;
    setBusy(true);
    setMessage("");
    const tools = [
      process.env.NEXT_PUBLIC_HANZI_URL || "https://hanzi.xuebabangbang.cn/",
      process.env.NEXT_PUBLIC_GUWEN_URL || "https://guwen.xuebabangbang.cn/",
      process.env.NEXT_PUBLIC_TASKHELPER_URL ||
        "https://task.xuebabangbang.cn/",
    ];
    const params = new URLSearchParams(location.search);
    const target = safeReturnTo(
      params.get("returnTo") || params.get("next"),
      location.origin,
      tools,
    );
    const endpoint = {
      register: "sign-up/email",
      login: "sign-in/email",
      "forgot-password": "request-password-reset",
      "reset-password": "reset-password",
    }[mode];
    const body =
      mode === "register"
        ? { email, password, name: "家长", callbackURL: target }
        : mode === "login"
          ? { email, password, callbackURL: target }
          : mode === "forgot-password"
            ? { email, redirectTo: location.origin + "/reset-password" }
            : { newPassword: password, token: params.get("token") };
    try {
      const response = await fetch("/api/auth/" + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const value = await response.json();
      if (!response.ok) {
        const friendly: Record<string, string> = {
          INVALID_EMAIL: "请输入有效的邮箱地址。",
          INVALID_EMAIL_OR_PASSWORD: "邮箱或密码不正确，请检查后重试。",
          EMAIL_NOT_VERIFIED:
            "请先打开验证邮件；若未收到，可以稍后再次登录以重新发送。",
          PASSWORD_TOO_SHORT: "密码至少需要 10 位。",
          PASSWORD_TOO_LONG: "密码不能超过 128 位。",
          INVALID_TOKEN: "重置链接无效或已过期，请重新申请重置邮件。",
          USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "这个邮箱已注册，请直接登录。",
          FAILED_TO_CREATE_USER:
            "注册未完成，邮箱可能已注册，请尝试登录或稍后重试。",
        };
        throw new Error(
          [
            "MAIL_NOT_CONFIGURED",
            "RATE_LIMITED",
            "USER_ALREADY_EXISTS",
            "EMAIL_OWNERSHIP_RESET_REQUIRED",
          ].includes(value.code)
            ? value.message
            : friendly[value.code] ||
                (response.status === 429
                  ? "操作太频繁，请稍后重试。"
                  : "暂时未能完成，请检查输入后重试。"),
        );
      }
      if (mode === "login" || (mode === "register" && value.token)) {
        location.assign(target);
        return;
      }
      setMessage(
        mode === "register"
          ? "账号已创建，请打开验证邮件，完成验证后即可使用。"
          : mode === "forgot-password"
            ? "如果这个邮箱已注册，您将收到重置邮件。请查看邮箱。"
            : "密码已更新，请重新登录。",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "网络连接失败，请重试。",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="page-shell account-shell">
      <section className="account-card auth-card">
        <h1>{titles[mode]}</h1>
        <p>一个家长账号，照顾每个孩子的学习记录。</p>
        <form onSubmit={submit} className="account-form">
          {mode !== "reset-password" && (
            <label>
              邮箱
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                aria-invalid={!!emailError}
                aria-describedby="email-feedback"
                onChange={(event) => {
                  const input = event.currentTarget;
                  setEmailError(
                    input.value && input.validity.typeMismatch
                      ? "请输入完整的邮箱地址，例如 name@example.com。"
                      : "",
                  );
                }}
              />
              <small id="email-feedback" role="status">
                {emailError}
              </small>
            </label>
          )}
          {mode !== "forgot-password" && (
            <label>
              密码
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                minLength={mode === "login" ? undefined : 10}
                maxLength={128}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
              />
              {mode !== "login" && (
                <small>10–128 位，建议使用较长密码或密码管理器。</small>
              )}
            </label>
          )}
          {(mode === "register" || mode === "reset-password") && (
            <label>
              确认密码
              <input
                name="confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                maxLength={128}
              />
            </label>
          )}
          {mode !== "forgot-password" && (
            <button
              type="button"
              className="soft-button"
              aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "隐藏密码" : "显示密码"}
            </button>
          )}
          <button type="submit" className="primary-button" disabled={busy}>
            {busy
              ? "请稍候…"
              : mode === "register"
                ? "注册账号"
                : mode === "login"
                  ? "登录"
                  : mode === "forgot-password"
                    ? "发送重置邮件"
                    : "更新密码"}
          </button>
        </form>
        <p role="status">{message}</p>
        <div className="account-actions">
          {mode === "register" ? (
            <Link href="/login">已有账号？立即登录</Link>
          ) : (
            <>
              <Link href="/login">登录</Link>
              <Link href="/register">注册</Link>
              <Link href="/forgot-password">忘记密码</Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLoginAt: string | null;
  disabled: boolean;
  profiles?: number;
  tools?: string[];
};
type Log = {
  id: string;
  action: string;
  actorId: string;
  targetId: string;
  createdAt: string;
};
async function api(path: string, body?: unknown) {
  const response = await fetch("/api/v1/admin/" + path, {
    method: body ? "POST" : "GET",
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.message);
  return value;
}
export function AdminCenter() {
  const [users, setUsers] = useState<User[]>([]),
    [logs, setLogs] = useState<Log[]>([]),
    [stats, setStats] = useState<{
      users: number;
      today: number;
      week: number;
      profiles: number;
      tools: { tool_key: string; users: number }[];
      sync: {
        id: string;
        toolKey: string;
        success: boolean;
        code: string;
        createdAt: string;
      }[];
    } | null>(null),
    [query, setQuery] = useState(""),
    [message, setMessage] = useState("");
  async function refresh() {
    try {
      const [u, s, l] = await Promise.all([
        api("users?q=" + encodeURIComponent(query)),
        api("stats"),
        api("audit"),
      ]);
      setUsers(u.users);
      setStats(s);
      setLogs(l.logs);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "读取失败");
    }
  }
  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function action(target: User, action: string) {
    if (!confirm("确认对 " + target.email + " 执行 " + action + "？")) return;
    try {
      await api("users/" + target.id, { action });
      await refresh();
      setMessage("操作已完成并记录日志。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败");
    }
  }
  return (
    <div className="page-shell account-shell">
      <h1>平台管理</h1>
      <p>管理账号与运行状况。管理员不读取或修改孩子的学习内容。</p>
      <Link href="/account">← 返回我的账号（写操作前请先家长验证）</Link>
      <p role="status">{message}</p>
      {stats && (
        <section className="account-card">
          <h2>平台概况</h2>
          <div className="account-actions">
            <span>注册用户 {stats.users}</span>
            <span>今日新增 {stats.today}</span>
            <span>7 天新增 {stats.week}</span>
            <span>孩子档案 {stats.profiles}</span>
          </div>
          <p>
            工具有学习数据的用户：
            {stats.tools.map((t) => t.tool_key + " " + t.users).join(" · ") ||
              "暂无"}
          </p>
          <details>
            <summary>最近同步结果</summary>
            {stats.sync.map((s) => (
              <p key={s.id}>
                {s.toolKey} · {s.success ? "成功" : "失败"} · {s.code} ·{" "}
                {new Date(s.createdAt).toLocaleString("zh-CN")}
              </p>
            ))}
          </details>
        </section>
      )}
      <section className="account-card">
        <h2>用户管理</h2>
        <form
          className="account-actions"
          onSubmit={(event) => {
            event.preventDefault();
            refresh();
          }}
        >
          <label>
            邮箱或昵称
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={100}
            />
          </label>
          <button className="soft-button">搜索</button>
        </form>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>账号</th>
                <th>注册 / 最近登录</th>
                <th>档案 / 工具</th>
                <th>状态与操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.email}
                    <small>
                      {u.name}
                      <br />
                      {u.id}
                    </small>
                  </td>
                  <td>
                    {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                    <br />
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleString("zh-CN")
                      : "尚未登录"}
                  </td>
                  <td>
                    {u.profiles || 0} 个孩子
                    <br />
                    {u.tools?.join("、") || "暂无学习数据"}
                    <button
                      onClick={async () => {
                        try {
                          const detail = await api("users/" + u.id);
                          alert(JSON.stringify(detail, null, 2));
                        } catch (e) {
                          setMessage(e instanceof Error ? e.message : "失败");
                        }
                      }}
                    >
                      查看详情
                    </button>
                  </td>
                  <td>
                    {u.disabled ? "已禁用" : "正常"}
                    <div className="account-actions">
                      <button
                        onClick={() =>
                          action(u, u.disabled ? "restore" : "disable")
                        }
                      >
                        {u.disabled ? "恢复" : "禁用"}
                      </button>
                      <button onClick={() => action(u, "revoke-sessions")}>
                        撤销登录
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="account-card">
        <h2>操作日志</h2>
        {logs.map((l) => (
          <p key={l.id}>
            {new Date(l.createdAt).toLocaleString("zh-CN")} · {l.action}
            <small>
              操作人 {l.actorId || "服务器初始化"} · 对象 {l.targetId}
            </small>
          </p>
        ))}
      </section>
    </div>
  );
}

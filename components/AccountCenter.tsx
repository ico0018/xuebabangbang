"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
type Profile = { id: string; nickname: string; grade: string | null };
type Session = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
  };
  activeProfileId: string | null;
  parentUnlockedUntil: string | null;
  parentReady: boolean;
};
async function api(path: string, method = "GET", body?: unknown) {
  const response = await fetch("/api/v1/" + path, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.message || "暂时未能完成");
  return value;
}
export function AccountCenter() {
  const [current, setCurrent] = useState<Session | null>(null),
    [profiles, setProfiles] = useState<Profile[]>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [challenge, setChallenge] = useState<{
      challenge: string;
      question: string;
      choices: number[];
    } | null>(null);
  async function refresh() {
    const [s, p] = await Promise.all([api("session"), api("profiles")]);
    setCurrent(s);
    setProfiles(p.profiles);
  }
  useEffect(() => {
    refresh().catch(() => {
      location.href = "/login";
    });
  }, []);
  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      await refresh();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "网络错误，请重试。");
    } finally {
      setBusy(false);
    }
  }
  const unlocked = current?.parentReady === true;
  async function loadChallenge() {
    setBusy(true);
    setMessage("");
    try {
      setChallenge(await api("parent-challenge"));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "题目暂时无法读取，请重试。",
      );
    } finally {
      setBusy(false);
    }
  }
  async function unlock(answer: number) {
    if (!challenge) return;
    await run(
      () =>
        api("parent-unlock", "POST", {
          challenge: challenge.challenge,
          answer,
        }),
      "家长入口已开启，本次登录期间无需重复答题。",
    );
  }
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      data = new FormData(form);
    await run(
      () =>
        api("profiles", "POST", {
          nickname: String(data.get("nickname")),
          grade: String(data.get("grade")) || null,
        }),
      "孩子档案已添加。",
    );
    form.reset();
  }
  async function edit(profile: Profile) {
    const nickname = prompt("孩子昵称", profile.nickname);
    if (!nickname) return;
    const grade = prompt("年级（可留空）", profile.grade || "");
    if (grade === null) return;
    await run(
      () =>
        api("profiles/" + profile.id, "PATCH", {
          nickname,
          grade: grade || null,
        }),
      "档案已更新。",
    );
  }
  async function remove(profile: Profile) {
    if (!confirm("删除档案后，其三个工具的云端学习记录也会删除。建议先导出。"))
      return;
    const confirmNickname = prompt(
      "请输入孩子昵称确认删除：" + profile.nickname,
    );
    if (confirmNickname === null) return;
    await run(
      () => api("profiles/" + profile.id, "DELETE", { confirmNickname }),
      "档案已删除。",
    );
  }
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      data = new FormData(form);
    if (data.get("newPassword") !== data.get("confirm")) {
      setMessage("两次新密码不一致。");
      return;
    }
    await run(async () => {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: data.get("currentPassword"),
          newPassword: data.get("newPassword"),
          revokeOtherSessions: true,
        }),
      });
      if (!response.ok)
        throw new Error("修改失败，请检查原密码，新密码至少 10 位。");
    }, "密码已更新，其他设备已退出。");
    form.reset();
  }
  if (!current)
    return <div className="page-shell account-shell">正在读取账号…</div>;
  return (
    <div className="page-shell account-shell">
      <div className="account-title">
        <div>
          <h1>我的账号</h1>
          <p>{current.user.email} · 一点点积累，每个孩子都有自己的步调。</p>
        </div>
        {current.user.role === "admin" && (
          <Link href="/admin" className="soft-button">
            管理后台
          </Link>
        )}
      </div>
      {!current.user.emailVerified && (
        <p className="muted">
          邮箱尚未验证，学习功能可正常使用。确认邮箱归属需通过邮箱重置密码。
          <Link href="/forgot-password">通过邮箱确认</Link>
        </p>
      )}
      <p className="feedback" role="status">
        {message}
      </p>
      <div className="account-grid">
        <section className="account-card">
          <h2>我的孩子</h2>
          <p>
            当前孩子：
            {profiles.find((p) => p.id === current.activeProfileId)?.nickname ||
              "还未选择"}
          </p>
          {profiles.map((profile) => (
            <div className="profile-row" key={profile.id}>
              <div>
                <strong>{profile.nickname}</strong>
                <small>{profile.grade || "未填写年级"}</small>
              </div>
              <div className="account-actions">
                <button
                  disabled={busy}
                  onClick={() =>
                    run(
                      () =>
                        api("active-profile", "POST", {
                          profileId: profile.id,
                        }),
                      "已切换孩子。学习工具会读取对应档案。",
                    )
                  }
                >
                  {profile.id === current.activeProfileId ? "当前孩子" : "切换"}
                </button>
                <button
                  disabled={!unlocked || busy}
                  onClick={() => edit(profile)}
                >
                  编辑
                </button>
                <button
                  disabled={!unlocked || busy}
                  onClick={() => remove(profile)}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
          {!profiles.length && <p>账号已就绪，可以给孩子取一个昵称。</p>}
          <form onSubmit={add} className="account-form">
            <label>
              孩子昵称
              <input
                name="nickname"
                maxLength={40}
                required
                placeholder="例如：小芽"
              />
            </label>
            <label>
              年级（可选）
              <input name="grade" maxLength={30} placeholder="例如：三年级" />
            </label>
            <button className="primary-button" disabled={!unlocked || busy}>
              ＋ 添加孩子
            </button>
          </form>
          <p className="muted">
            只需要昵称和可选的年级，请勿填写真实姓名、学校、出生日期或住址。
          </p>
        </section>
        <section className="account-card">
          <h2>家长入口</h2>
          <p>
            {unlocked
              ? "家长入口已开启，本次登录期间无需重复答题。"
              : "请家长做一道小题目，帮助孩子避免误点管理功能。"}
          </p>
          {!unlocked &&
            (challenge ? (
              <div className="account-form">
                <p aria-live="polite">{challenge.question}</p>
                <div className="account-actions" aria-label="选择计算结果">
                  {challenge.choices.map((answer) => (
                    <button
                      key={answer}
                      type="button"
                      className="soft-button"
                      disabled={busy}
                      onClick={() => unlock(answer)}
                    >
                      {answer}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="soft-button"
                  disabled={busy}
                  onClick={loadChallenge}
                >
                  换一道题
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="primary-button"
                disabled={busy}
                onClick={loadChallenge}
              >
                进入家长管理
              </button>
            ))}
          <h2>学习记录</h2>
          <p>选择孩子后，在对应工具中保存、恢复或迁移本机学习记录。</p>
          <div className="account-links">
            <a
              href={
                (
                  process.env.NEXT_PUBLIC_GUWEN_URL ||
                  "https://guwen.xuebabangbang.cn"
                ).replace(/\/$/, "") + "/parent.html"
              }
            >
              古文乐园 →
            </a>
            <a
              href={
                (
                  process.env.NEXT_PUBLIC_HANZI_URL ||
                  "https://hanzi.xuebabangbang.cn"
                ).replace(/\/$/, "") + "/parent.html"
              }
            >
              汉字乐园 →
            </a>
            <a
              href={
                (
                  process.env.NEXT_PUBLIC_TASKHELPER_URL ||
                  "https://taskhelper.xuebabangbang.cn"
                ).replace(/\/$/, "") + "/parent/"
              }
            >
              任务小帮手 →
            </a>
          </div>
        </section>
        <section className="account-card">
          <h2>账号安全</h2>
          <form
            className="account-form"
            onSubmit={(event) => {
              event.preventDefault();
              const name = String(
                new FormData(event.currentTarget).get("name"),
              );
              run(() => api("account", "PATCH", { name }), "家长昵称已更新。");
            }}
          >
            <label>
              家长昵称（可选）
              <input
                name="name"
                defaultValue={current.user.name}
                maxLength={40}
              />
            </label>
            <button className="soft-button" disabled={!unlocked || busy}>
              保存昵称
            </button>
          </form>
          <details>
            <summary>修改密码</summary>
            <form onSubmit={changePassword} className="account-form">
              <label>
                原密码
                <input
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>
              <label>
                新密码
                <input
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={10}
                  maxLength={128}
                />
              </label>
              <label>
                确认新密码
                <input
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </label>
              <button className="primary-button" disabled={busy}>
                更新密码并退出其他设备
              </button>
            </form>
          </details>
          <button
            className="soft-button"
            disabled={!unlocked || busy}
            onClick={() => {
              if (confirm("所有设备都将退出登录，确认继续？"))
                run(async () => {
                  await api("logout-all", "POST", {});
                  location.href = "/login";
                }, "");
            }}
          >
            退出所有设备
          </button>
          <button
            className="soft-button"
            onClick={async () => {
              const r = await fetch("/api/auth/sign-out", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: "{}",
              });
              if (r.ok) location.href = "/login";
              else setMessage("退出失败，请重试。");
            }}
          >
            退出登录
          </button>
        </section>
        <section className="account-card">
          <h2>数据导出与恢复</h2>
          <p>
            可下载自己的全部孩子档案和三个工具的云端记录，保存在您信任的设备中。
          </p>
          {unlocked ? (
            <a className="primary-button" href="/api/v1/export" download>
              下载我的学习记录
            </a>
          ) : (
            <p className="muted">先开启家长入口，再导出或恢复学习记录。</p>
          )}
          <details>
            <summary>从导出文件恢复到当前孩子</summary>
            <p>
              原记录不会被直接覆盖。系统将核对每个工具的最新版本，请先备份。
            </p>
            <input
              type="file"
              accept=".json,application/json"
              disabled={!unlocked || !current.activeProfileId || busy}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const profile = profiles.find(
                  (p) => p.id === current.activeProfileId,
                );
                if (!profile) return;
                await run(async () => {
                  if (file.size > 1048576) throw new Error("文件超过 1 MB。");
                  const exported = JSON.parse(await file.text());
                  if (
                    exported.format !== "xuebabangbang-export-v1" ||
                    !Array.isArray(exported.states)
                  )
                    throw new Error("请使用学霸帮帮导出文件。");
                  const sourceProfiles = exported.profiles as Profile[];
                  let sourceId: string | undefined = sourceProfiles[0]?.id;
                  if (sourceProfiles.length > 1) {
                    const nickname = prompt(
                      "输入要恢复的原孩子昵称：" +
                        sourceProfiles.map((p) => p.nickname).join("、"),
                    );
                    sourceId = sourceProfiles.find(
                      (p) => p.nickname === nickname,
                    )?.id;
                  }
                  if (!sourceId) throw new Error("未选择原孩子。");
                  if (
                    !confirm(
                      "将所选孩子的记录恢复到：" +
                        profile.nickname +
                        "。确认已备份现有记录？",
                    )
                  )
                    throw new Error("已取消恢复。");
                  const states = await Promise.all(
                    (
                      exported.states as {
                        profileId: string;
                        toolKey: string;
                        schemaVersion: number;
                        payload: unknown;
                      }[]
                    )
                      .filter((s) => s.profileId === sourceId)
                      .map(async (s) => ({
                        ...s,
                        revision: (
                          await api(
                            "profiles/" + profile.id + "/state/" + s.toolKey,
                          )
                        ).revision,
                      })),
                  );
                  await api("profiles/" + profile.id + "/import", "POST", {
                    confirmNickname: profile.nickname,
                    states: states.map((s) => ({
                      toolKey: s.toolKey,
                      revision: s.revision,
                      schemaVersion: s.schemaVersion,
                      payload: s.payload,
                    })),
                  });
                }, "记录已恢复。请重新进入学习工具读取。");
                event.target.value = "";
              }}
            />
          </details>
        </section>
      </div>
    </div>
  );
}

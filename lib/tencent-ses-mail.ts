import { ses } from "tencentcloud-sdk-nodejs-ses";
import type { SendEmailRequest } from "tencentcloud-sdk-nodejs-ses/tencentcloud/services/ses/v20201002/ses_models";
import { z } from "zod";

export type SesMailConfig = {
  secretId: string;
  secretKey: string;
  token?: string;
  region: "ap-guangzhou" | "ap-hongkong";
  from: string;
  origin: string;
  allowedOrigins: string[];
  verifyTemplate: number;
  resetTemplate: number;
};
function httpsOrigin(value: string | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    )
      return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}
function templateId(value: string | undefined) {
  if (!value || !/^[1-9][0-9]*$/.test(value)) return undefined;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : undefined;
}
export function readSesMailConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): SesMailConfig | undefined {
  const origin = httpsOrigin(env.BETTER_AUTH_URL);
  const verifyTemplate = templateId(env.SES_VERIFY_TEMPLATE_ID);
  const resetTemplate = templateId(env.SES_RESET_TEMPLATE_ID);
  const region = env.SES_REGION;
  const from = env.MAIL_FROM?.trim();
  if (
    !env.SES_SECRET_ID?.trim() ||
    !env.SES_SECRET_KEY?.trim() ||
    !origin ||
    !from ||
    !z.email().safeParse(from).success ||
    !verifyTemplate ||
    !resetTemplate ||
    !["ap-guangzhou", "ap-hongkong"].includes(region || "")
  )
    return undefined;
  return {
    secretId: env.SES_SECRET_ID.trim(),
    secretKey: env.SES_SECRET_KEY.trim(),
    ...(env.SES_SESSION_TOKEN ? { token: env.SES_SESSION_TOKEN } : {}),
    region: region as SesMailConfig["region"],
    from,
    origin,
    verifyTemplate,
    resetTemplate,
    allowedOrigins: Array.from(
      new Set([
        origin,
        ...(env.TRUSTED_ORIGINS || "")
          .split(",")
          .map((v) => httpsOrigin(v.trim()))
          .filter((v): v is string => !!v),
      ]),
    ),
  };
}
export function buildSesMail(
  config: SesMailConfig,
  to: string,
  subject: string,
  link: string,
): SendEmailRequest {
  if (!z.email().max(254).safeParse(to).success)
    throw new Error("收件地址无效。");
  const verify = subject === "验证学霸帮帮邮箱";
  if (!verify && subject !== "重置学霸帮帮密码")
    throw new Error("邮件类型无效。");
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    throw new Error("邮件链接无效。");
  }
  if (
    url.origin !== config.origin ||
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.hash
  )
    throw new Error("邮件链接无效。");
  if (
    verify
      ? url.pathname !== "/api/auth/verify-email" ||
        !url.searchParams.get("token")
      : !/^\/api\/auth\/reset-password\/[A-Za-z0-9_-]+$/.test(url.pathname)
  )
    throw new Error("邮件链接无效。");
  const callback = url.searchParams.get("callbackURL");
  if (callback) {
    let target: URL;
    try {
      target = new URL(callback);
    } catch {
      throw new Error("邮件返回地址无效。");
    }
    if (
      target.username ||
      target.password ||
      target.protocol !== "https:" ||
      !config.allowedOrigins.includes(target.origin)
    )
      throw new Error("邮件返回地址无效。");
  }
  return {
    FromEmailAddress: "学霸帮帮 <" + config.from + ">",
    Subject: subject,
    Destination: [to],
    TriggerType: 1,
    Unsubscribe: "0",
    Template: {
      TemplateID: verify ? config.verifyTemplate : config.resetTemplate,
      TemplateData: JSON.stringify({ path: url.pathname + url.search }),
    },
  };
}
type Sender = Pick<InstanceType<typeof ses.v20201002.Client>, "SendEmail">;
export async function sendSesMail(
  config: SesMailConfig,
  request: SendEmailRequest,
  sender?: Sender,
) {
  const client =
    sender ||
    new ses.v20201002.Client({
      credential: {
        secretId: config.secretId,
        secretKey: config.secretKey,
        ...(config.token ? { token: config.token } : {}),
      },
      region: config.region,
      profile: {
        signMethod: "TC3-HMAC-SHA256",
        httpProfile: {
          reqMethod: "POST",
          protocol: "https://",
          reqTimeout: 15,
        },
      },
    });
  try {
    const response = await client.SendEmail(request);
    if (!response.MessageId) throw new Error("SES did not accept message");
  } catch {
    // Do not propagate SDK request/credential details or one-time links into logs or UI.
    throw new Error("邮件发送暂时失败，请稍后重试。");
  }
}

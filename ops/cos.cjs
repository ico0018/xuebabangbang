/* Server-only COS operations. Never expose credentials or call this from a browser. */
const COS = require("cos-nodejs-sdk-v5");
const fs = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");
function required(name) {
  if (!process.env[name]) throw new Error(`${name} is not configured`);
  return process.env[name];
}
async function metadataCredentials() {
  const role = required("COS_CAM_ROLE");
  if (!/^[A-Za-z0-9_+=,.@-]+$/.test(role)) throw new Error("Invalid CAM role");
  const res = await fetch(
    `http://metadata.tencentyun.com/latest/meta-data/cam/security-credentials/${encodeURIComponent(role)}`,
    { signal: AbortSignal.timeout(3000), redirect: "error" },
  );
  if (!res.ok) throw new Error("CAM metadata unavailable");
  const data = await res.json();
  if (
    data.Code !== "Success" ||
    !data.TmpSecretId ||
    !data.TmpSecretKey ||
    !data.Token
  )
    throw new Error("CAM temporary credentials unavailable");
  return {
    TmpSecretId: data.TmpSecretId,
    TmpSecretKey: data.TmpSecretKey,
    SecurityToken: data.Token,
    StartTime: Math.floor(Date.now() / 1000) - 30,
    ExpiredTime: Number(data.ExpiredTime),
  };
}
async function createClient() {
  const bucket = required("COS_BUCKET"),
    region = required("COS_REGION");
  if (
    !/^[a-z0-9-]+-\d+$/.test(bucket) ||
    !/^ap-[a-z]+(?:-[a-z]+)*$/.test(region)
  )
    throw new Error("Invalid COS bucket or region");
  if (
    process.env.COS_INTERNAL === "true" &&
    process.env.TENCENT_SERVER_REGION !== region
  )
    throw new Error(
      "Internal COS requires verified matching server and bucket regions",
    );
  let credentials;
  if (process.env.COS_CAM_ROLE) credentials = await metadataCredentials();
  else {
    required("COS_SESSION_TOKEN");
    const expiry = Number(required("COS_TOKEN_EXPIRY"));
    if (expiry < Date.now() / 1000 + 60)
      throw new Error("STS credentials expired or close to expiry");
    credentials = {
      TmpSecretId: required("COS_SECRET_ID"),
      TmpSecretKey: required("COS_SECRET_KEY"),
      SecurityToken: process.env.COS_SESSION_TOKEN,
      StartTime: Math.floor(Date.now() / 1000) - 30,
      ExpiredTime: expiry,
    };
  }
  const options = { getAuthorization: (_, callback) => callback(credentials) };
  if (process.env.COS_INTERNAL === "true")
    options.Domain = `${bucket}.cos-internal.${region}.tencentcos.cn`;
  const client = new COS(options);
  const call = (method, args = {}) =>
    new Promise((resolve, reject) =>
      client[method](
        { Bucket: bucket, Region: region, ...args },
        (error, data) => (error ? reject(error) : resolve(data)),
      ),
    );
  const acl = await call("getBucketAcl");
  if (acl.ACL && acl.ACL !== "private")
    throw new Error("Bucket must remain private");
  if (
    (acl.Grants || []).some((g) =>
      /AllUsers|AuthenticatedUsers/.test(JSON.stringify(g)),
    )
  )
    throw new Error("Public bucket grants are forbidden");
  return call;
}
async function main() {
  const call = await createClient();
  const [operation, file, destination] = process.argv.slice(2);
  const prefix = process.env.COS_BACKUP_PREFIX || "unified-preview/backups/";
  if (
    !prefix.startsWith("unified-preview/") ||
    !prefix.endsWith("/") ||
    prefix.includes("..")
  )
    throw new Error("Backup prefix must stay under unified-preview/");
  if (operation === "test") {
    const key = `unified-preview/diagnostics/${crypto.randomUUID()}.txt`;
    const body = Buffer.from(`COS round trip ${crypto.randomUUID()}`);
    await call("putObject", { Key: key, Body: body, ACL: "private" });
    const result = await call("getObject", { Key: key });
    if (!Buffer.from(result.Body).equals(body))
      throw new Error("COS round-trip mismatch; test object retained");
    await call("deleteObject", { Key: key });
    console.log(
      JSON.stringify({
        test: "PASS",
        key,
        uploaded: true,
        read: true,
        deleted: true,
      }),
    );
  } else if (operation === "upload-backup") {
    if (!file || !/\.dump$/.test(file))
      throw new Error("A PostgreSQL .dump file is required");
    const key = `${prefix}${new Date().toISOString().replace(/[:.]/g, "-")}-${crypto.randomUUID()}.dump`;
    await call("putObject", {
      Key: key,
      Body: fs.createReadStream(file),
      ACL: "private",
    });
    console.log(
      JSON.stringify({
        uploaded: true,
        key,
        sha256: crypto
          .createHash("sha256")
          .update(fs.readFileSync(file))
          .digest("hex"),
      }),
    );
  } else if (operation === "download-backup") {
    if (
      !file?.startsWith(prefix) ||
      file.includes("..") ||
      !destination ||
      path.extname(destination) !== ".dump"
    )
      throw new Error(
        "Explicit preview backup key and new local .dump path required",
      );
    const result = await call("getObject", { Key: file });
    fs.writeFileSync(destination, result.Body, { flag: "wx", mode: 0o600 });
    console.log(JSON.stringify({ downloaded: true, key: file }));
  } else
    throw new Error(
      "Use test | upload-backup FILE.dump | download-backup KEY NEW_FILE.dump",
    );
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.code || error.message);
    process.exitCode = 1;
  });
module.exports = { createClient };

export function validateAuthUrl(value: string, domain?: string) {
  const url = new URL(value);
  const loopback = ["localhost","127.0.0.1","[::1]"].includes(url.hostname);
  if(url.protocol!=="https:" && !(url.protocol==="http:" && loopback)) throw new Error("Remote authentication requires HTTPS; preview must use a localhost SSH tunnel.");
  if(url.username || url.password || url.pathname!=="/" || url.search || url.hash) throw new Error("BETTER_AUTH_URL must be a clean origin.");
  if(domain && (!/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/i.test(domain) || /^[0-9.]+$/.test(domain) || !(url.hostname===domain || url.hostname.endsWith("."+domain)))) throw new Error("COOKIE_DOMAIN must be an explicit parent domain of BETTER_AUTH_URL.");
  return value;
}


/**
 * Stripe Webhook 签名校验（WebCrypto 实现，零依赖）。
 *
 * Stripe 的签名头格式：`t=<unix 秒>,v1=<hex hmac>,v1=<hex hmac>`
 * 待签名字符串：`${t}.${rawBody}`
 * 算法：HMAC-SHA256(secret=WH_SECRET, message)
 *
 * 两点容易踩坑：
 *   1. 必须用原始请求体（request.text()），不能用解析后再 stringify 的 JSON；
 *   2. 必须校验时间戳容差，否则重放旧请求永远有效。
 */

const DEFAULT_TOLERANCE_SECONDS = 300;

function toHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** 定长比较，避免按字符提前 return 泄漏签名前缀 */
function safeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

export function parseSignatureHeader(header) {
  const result = { timestamp: null, signatures: [] };
  if (typeof header !== "string") return result;
  for (const part of header.split(",")) {
    const separator = part.indexOf("=");
    if (separator <= 0) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key === "t") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) result.timestamp = parsed;
    } else if (key === "v1" && value) {
      result.signatures.push(value.toLowerCase());
    }
  }
  return result;
}

/**
 * @returns {Promise<{valid: boolean, reason?: string}>}
 */
export async function verifyStripeSignature({
  payload,
  header,
  secret,
  toleranceSeconds = DEFAULT_TOLERANCE_SECONDS,
  nowSeconds = Math.floor(Date.now() / 1000),
  cryptoImpl = globalThis.crypto,
}) {
  if (!secret) return { valid: false, reason: "missing webhook secret" };
  if (!header) return { valid: false, reason: "missing Stripe-Signature header" };
  if (typeof payload !== "string") return { valid: false, reason: "payload must be the raw string" };

  const { timestamp, signatures } = parseSignatureHeader(header);
  if (timestamp === null) return { valid: false, reason: "signature header has no timestamp" };
  if (signatures.length === 0) return { valid: false, reason: "signature header has no v1 hash" };

  const age = Math.abs(nowSeconds - timestamp);
  if (age > toleranceSeconds) {
    return { valid: false, reason: `timestamp outside tolerance (${age}s > ${toleranceSeconds}s)` };
  }

  const encoder = new TextEncoder();
  const key = await cryptoImpl.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await cryptoImpl.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${payload}`),
  );
  const expected = toHex(new Uint8Array(signature));

  const matched = signatures.some((candidate) => safeEqualHex(candidate, expected));
  return matched ? { valid: true } : { valid: false, reason: "signature mismatch" };
}

/**
 * 生成本地调试用的签名头（等价于 Stripe CLI 的行为），
 * 便于在没装 Stripe CLI 的机器上用 curl 复现 webhook。
 */
export async function signPayload({ payload, secret, timestamp, cryptoImpl = globalThis.crypto }) {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();
  const key = await cryptoImpl.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await cryptoImpl.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${ts}.${payload}`),
  );
  return `t=${ts},v1=${toHex(new Uint8Array(signature))}`;
}

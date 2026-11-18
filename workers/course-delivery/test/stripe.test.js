import assert from "node:assert/strict";
import test from "node:test";

import { parseSignatureHeader, signPayload, verifyStripeSignature } from "../src/stripe.js";

const SECRET = "whsec_test_secret";

test("合法签名通过校验", async () => {
  const payload = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
  const header = await signPayload({ payload, secret: SECRET });
  const verdict = await verifyStripeSignature({ payload, header, secret: SECRET });
  assert.equal(verdict.valid, true);
});

test("body 被篡改后校验失败", async () => {
  const payload = JSON.stringify({ id: "evt_1", amount: 100 });
  const header = await signPayload({ payload, secret: SECRET });
  const tampered = JSON.stringify({ id: "evt_1", amount: 1000000 });
  const verdict = await verifyStripeSignature({ payload: tampered, header, secret: SECRET });
  assert.equal(verdict.valid, false);
  assert.match(verdict.reason, /signature mismatch/);
});

test("密钥不对时校验失败", async () => {
  const payload = "{}";
  const header = await signPayload({ payload, secret: "whsec_wrong" });
  const verdict = await verifyStripeSignature({ payload, header, secret: SECRET });
  assert.equal(verdict.valid, false);
});

test("超过容差的时间戳被拒绝（防重放）", async () => {
  const payload = "{}";
  const timestamp = Math.floor(Date.now() / 1000) - 3600;
  const header = await signPayload({ payload, secret: SECRET, timestamp });
  const verdict = await verifyStripeSignature({ payload, header, secret: SECRET });
  assert.equal(verdict.valid, false);
  assert.match(verdict.reason, /outside tolerance/);
});

test("同一秒的多个 v1 签名中命中任意一个即可", async () => {
  const payload = "{}";
  const timestamp = Math.floor(Date.now() / 1000);
  const header = await signPayload({ payload, secret: SECRET, timestamp });
  const withExtra = `${header},v1=${"0".repeat(64)}`;
  const verdict = await verifyStripeSignature({ payload, header: withExtra, secret: SECRET });
  assert.equal(verdict.valid, true);
});

test("畸形请求头被拒绝且不抛异常", async () => {
  for (const header of [null, "", "garbage", "t=abc", "t=1,v1=", "v1=deadbeef"]) {
    const verdict = await verifyStripeSignature({ payload: "{}", header, secret: SECRET });
    assert.equal(verdict.valid, false);
  }
});

test("缺少 secret 时直接拒绝", async () => {
  const verdict = await verifyStripeSignature({ payload: "{}", header: "t=1,v1=x", secret: "" });
  assert.equal(verdict.valid, false);
});

test("签名头解析出时间戳与全部 v1", () => {
  const parsed = parseSignatureHeader("t=1700000000,v1=aa,v1=bb");
  assert.equal(parsed.timestamp, 1700000000);
  assert.deepEqual(parsed.signatures, ["aa", "bb"]);
});

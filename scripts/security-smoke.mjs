#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const WEBHOOK_SECRET = process.env.NEQUI_WEBHOOK_SECRET || "tu-webhook-secret";

function randomSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, options);
  let body = {};
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  return { res, body };
}

async function createTestReserva() {
  const suffix = randomSuffix();
  const email = `test-security-${suffix}@example.com`;
  const phone = `3${Math.floor(10_000_000 + Math.random() * 89_999_999)}`;

  const { res: insRes, body: insBody } = await jsonFetch(`${BASE_URL}/api/inscribir`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `Security Test ${suffix}`,
      email,
      phone,
      planId: "diario",
    }),
  });

  assert.equal(
    insRes.status,
    200,
    `Expected 200 on /api/inscribir, got ${insRes.status} ${JSON.stringify(insBody)}`
  );
  assert.ok(insBody.inscripcionId, "Missing inscripcionId from /api/inscribir");

  const { res: payRes, body: payBody } = await jsonFetch(`${BASE_URL}/api/payment/nequi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inscripcionId: insBody.inscripcionId }),
  });

  assert.equal(
    payRes.status,
    200,
    `Expected 200 on /api/payment/nequi, got ${payRes.status} ${JSON.stringify(payBody)}`
  );
  assert.ok(payBody.reservaId, "Missing reservaId from /api/payment/nequi");
  assert.ok(payBody.sessionToken, "Missing sessionToken from /api/payment/nequi");

  return {
    reservaId: payBody.reservaId,
    sessionToken: payBody.sessionToken,
  };
}

async function testCallbackDisabled() {
  const { res, body } = await jsonFetch(`${BASE_URL}/api/payment/callback`);
  assert.equal(res.status, 410, `Expected 410 on callback, got ${res.status}`);
  assert.ok(body.error, "Expected error message on callback disabled");
  console.log("OK: callback deshabilitado (410)");
}

async function testInvalidToken403(reservaId) {
  const { res } = await jsonFetch(
    `${BASE_URL}/api/payment/status?reservaId=${encodeURIComponent(reservaId)}&token=invalid-token`
  );
  assert.equal(res.status, 403, `Expected 403 with invalid token, got ${res.status}`);
  console.log("OK: token inválido devuelve 403");
}

async function testReplayWebhook(reservaId) {
  const now = Date.now().toString();
  const eventId = `evt-${randomSuffix()}`;
  const payload = JSON.stringify({
    reservaId,
    status: "33",
  });
  const signature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(`${now}.${payload}`)
    .digest("hex");

  const headers = {
    "Content-Type": "application/json",
    "x-nequi-signature": `sha256=${signature}`,
    "x-nequi-timestamp": now,
    "x-nequi-event-id": eventId,
  };

  const first = await jsonFetch(`${BASE_URL}/api/payment/status`, {
    method: "POST",
    headers,
    body: payload,
  });

  assert.ok(
    [200, 409].includes(first.res.status),
    `Expected 200/409 on first webhook, got ${first.res.status} ${JSON.stringify(first.body)}`
  );

  const second = await jsonFetch(`${BASE_URL}/api/payment/status`, {
    method: "POST",
    headers,
    body: payload,
  });

  assert.equal(
    second.res.status,
    409,
    `Expected 409 on replay webhook, got ${second.res.status} ${JSON.stringify(second.body)}`
  );
  console.log("OK: webhook duplicado detectado (409)");
}

async function testRateLimit429(reservaId) {
  let saw429 = false;
  for (let i = 0; i < 120; i++) {
    const { res } = await jsonFetch(
      `${BASE_URL}/api/payment/status?reservaId=${encodeURIComponent(reservaId)}&token=invalid-token`
    );
    if (res.status === 429) {
      saw429 = true;
      break;
    }
  }
  assert.ok(saw429, "Expected at least one 429 after burst requests");
  console.log("OK: rate limit activo (429)");
}

async function main() {
  console.log(`Running security smoke tests against ${BASE_URL}`);

  await testCallbackDisabled();
  const { reservaId } = await createTestReserva();
  await testInvalidToken403(reservaId);
  await testReplayWebhook(reservaId);
  await testRateLimit429(reservaId);

  console.log("All security smoke tests passed.");
}

main().catch((err) => {
  console.error("Security smoke tests failed:", err);
  process.exit(1);
});

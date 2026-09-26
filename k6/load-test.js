// Load test for the Universe API - drives real HTTP traffic through the
// actual Express routes (auth, feed, posts, comments, likes, messaging)
// using the accounts created by `npm run db:seed`.
//
// SAFETY: only ever point BASE_URL at your dev Neon branch / a locally
// running server. This creates real posts/comments/messages and hits the
// login and messaging rate limiters as a side effect - never run it against
// the prod Render service or the prod Neon branch.
//
// Install k6: https://grafana.com/docs/k6/latest/set-up/install-k6/
//
// Usage:
//   k6 run k6/load-test.js
//   k6 run --env BASE_URL=http://localhost:5000/api --env SEED_USERS=500 k6/load-test.js
//   k6 run --env VUS=200 --env DURATION=3m k6/load-test.js   # quick override, see options below
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000/api";
const TOTAL_SEED_USERS = Number(__ENV.SEED_USERS || 500);
const SEED_PASSWORD = __ENV.SEED_PASSWORD || "LoadTest123!";

export const options = {
  // k6 clears each VU's cookie jar at the start of every iteration by
  // default (simulating a fresh browser tab each time). This script logs in
  // once per VU and reuses that session across iterations, so without this
  // flag every request after the VU's first iteration loses its auth cookie
  // and gets a silent 401 - the login itself still looks fine.
  noCookiesReset: true,
  scenarios: {
    ramping_traffic: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 20 }, // warm up
        { duration: "1m", target: 100 }, // ramp to a first plateau
        { duration: "2m", target: 100 }, // hold - steady-state numbers
        { duration: "1m", target: 300 }, // push past comfortable load
        { duration: "1m", target: 300 }, // hold at peak - look for cracks here
        { duration: "30s", target: 0 }, // ramp down
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<800"],
    "http_req_duration{endpoint:login}": ["p(95)<600"],
    "http_req_duration{endpoint:feed}": ["p(95)<500"],
  },
};

const jsonHeaders = { headers: { "Content-Type": "application/json" } };
const FEEDS = ["Global", "Following", "University"];
const COMMENT_TEXTS = [
  "This is so helpful, thanks for sharing!",
  "Anyone else going to this?",
  "Following up - any updates on this?",
  "Great post, learned a lot.",
  "Can you share more details?",
  "Congrats, well deserved!",
];

// Module-level state is re-created per VU but persists across that VU's own
// iterations, which is what makes "log in once, reuse the session" work here.
let session = null; // { userId, knownPostIds: [], contacts: [] | null }

function login() {
  const userIndex = (__VU - 1) % TOTAL_SEED_USERS;
  const email = `seed-user-${userIndex}@loadtest.dev`;
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password: SEED_PASSWORD }),
    { ...jsonHeaders, tags: { endpoint: "login" } },
  );
  const ok = check(res, { "login succeeded": (r) => r.status === 200 });
  if (!ok) return null;
  const body = res.json();
  return { userId: body.id, knownPostIds: [], contacts: null };
}

function browseFeed() {
  const feed = FEEDS[Math.floor(Math.random() * FEEDS.length)];
  const res = http.get(`${BASE_URL}/posts/${feed}?limit=10`, {
    tags: { endpoint: "feed" },
  });
  check(res, { "feed ok": (r) => r.status === 200 });
  if (res.status === 200) {
    const ids = (res.json("posts") || []).map((p) => p.id);
    if (ids.length > 0) session.knownPostIds = ids;
  }
}

function createPost() {
  const res = http.post(
    `${BASE_URL}/posts`,
    JSON.stringify({
      title: `Load test post ${Date.now()}-${__VU}`,
      body: "Posted by the k6 load test to exercise the create-post path under concurrent load.",
      tags: "load-test",
      type: "standard",
    }),
    { ...jsonHeaders, tags: { endpoint: "create_post" } },
  );
  check(res, { "create post ok": (r) => r.status === 200 || r.status === 201 });
}

function likeRandomPost() {
  if (session.knownPostIds.length === 0) return;
  const postId = session.knownPostIds[Math.floor(Math.random() * session.knownPostIds.length)];
  const res = http.post(`${BASE_URL}/like-post`, JSON.stringify({ postId }), {
    ...jsonHeaders,
    tags: { endpoint: "like_post" },
  });
  check(res, { "like ok": (r) => r.status === 200 || r.status === 400 }); // 400 = already liked, not a real failure
}

function commentOnRandomPost() {
  if (session.knownPostIds.length === 0) return;
  const postId = session.knownPostIds[Math.floor(Math.random() * session.knownPostIds.length)];
  const comment = COMMENT_TEXTS[Math.floor(Math.random() * COMMENT_TEXTS.length)];
  const res = http.post(
    `${BASE_URL}/posts/${postId}/send-comment`,
    JSON.stringify({ comment }),
    { ...jsonHeaders, tags: { endpoint: "send_comment" } },
  );
  check(res, { "comment ok": (r) => r.status === 200 || r.status === 201 });
}

function messageRandomContact() {
  if (session.contacts === null) {
    const res = http.get(`${BASE_URL}/conversations/users`, {
      tags: { endpoint: "convo_users" },
    });
    session.contacts = res.status === 200 ? (res.json("users") || []).map((u) => u.id) : [];
  }
  if (session.contacts.length === 0) return;

  const contactId = session.contacts[Math.floor(Math.random() * session.contacts.length)];
  const convoRes = http.get(`${BASE_URL}/conversations/user/${contactId}`, {
    tags: { endpoint: "get_conversation" },
  });
  const conversation = convoRes.status === 200 ? convoRes.json("conversation") : null;
  if (!conversation?.id) return;

  const res = http.post(
    `${BASE_URL}/conversations/${conversation.id}/send-message`,
    JSON.stringify({ messageText: "Hey, saw your post - looks great!" }),
    { ...jsonHeaders, tags: { endpoint: "send_message" } },
  );
  check(res, { "message ok": (r) => r.status === 200 || r.status === 201 });
}

export default function () {
  if (!session) {
    session = login();
    if (!session) {
      sleep(1);
      return;
    }
  }

  const roll = Math.random();
  if (roll < 0.5) browseFeed();
  else if (roll < 0.65) commentOnRandomPost();
  else if (roll < 0.78) likeRandomPost();
  else if (roll < 0.88) createPost();
  else messageRandomContact();

  sleep(Math.random() * 2 + 1);
}

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Universe primarily serves university students using a campus-style social platform to connect with classmates, follow people, share posts, join groups, discover events, vote in polls, and keep up with campus/community activity.

Secondary users represented in the product include group admins, event hosts, verified business accounts, and platform admins, but future product decisions should optimize first for the student experience unless a feature explicitly targets another role.

## Product Purpose

Universe is a student-first campus social hub. It brings together posts, profiles, follows, chat, groups, events, polls, notifications, and discovery in one product so students can participate in campus life without jumping between disconnected tools.

Success means students can quickly understand what is happening around them, find relevant people/groups/events, participate in conversations, and manage their own campus presence with low friction.

## Positioning

Universe is not a generic social network. Its durable position is campus-native social infrastructure: community feed, university-aware discovery, course/group structures, event participation, and moderation tools shaped around student life.

The strongest next-product direction in the repo is to deepen that campus-native value through course groups/shared resources, jobs/internship discovery for verified business accounts, mobile parity, and broader safety controls.

## Operating Context

Core web workflows include:
- Sign up, verify an academic email, log in, reset password, and manage account/session state.
- Browse and create posts with likes, comments, saves, shares, tags, locations, images, and optional polls.
- View profiles, follow users, and browse followers/following.
- Search and explore people, posts, groups, and events.
- Use direct messages and group chats, including files, voice notes, reactions, shared posts, and group poll messages.
- Create, discover, join, and administer groups, including public/private visibility and course tags.
- Create, discover, RSVP to, and manage events, including calendar export, waitlists, event chat, and host moderation.
- Receive notifications for social, message, event, group, and moderation activity.
- Use admin surfaces for platform-level approvals such as business-account registration.

The repository also contains a React Native mobile companion, but recent product work has moved faster on web; mobile parity is an explicit future concern rather than the current primary design surface.

## Capabilities and Constraints

Confirmed capabilities include authenticated accounts, academic-email verification, profiles, social feed, posts, comments, likes, follows, saved posts, notifications, direct chat, group chat, groups, events, polls, event/group bans, upload validation, and admin approval flows.

Moderation currently exists at event/group scope through participant/member removal and ban lists. Platform-level user blocking and reporting are roadmap items, not confirmed implemented behavior.

Verified business accounts exist, but the durable product payoff for them is still emerging. The roadmap points toward jobs and internships as the likely next meaningful use.

Redis/BullMQ-style background jobs are not an active assumption for product work unless deliberately re-enabled. Event reminders are currently calendar-export oriented rather than scheduled push jobs.

This is currently a demo project. Future work must not invent real institutions, customers, testimonials, press, production usage, or external proof that is not present in the repository.

## Brand Commitments

The product name is Universe.

The confirmed voice is practical, student-centered, and campus-oriented. It should feel like a useful social tool for everyday university life rather than a corporate enterprise product or a generic consumer network.

The README includes an existing logo reference at `README.md`. Treat existing product copy and assets as evidence, not permission to fabricate additional brand claims.

## Evidence on Hand

Repository evidence includes:
- `README.md`: product name, demo status, high-level feature summary, and logo reference.
- `frontend/src/App.tsx`: web routes for auth, feed, profiles, explore, posts, settings, notifications, chat, groups, events, and admin.
- `backend/prisma/schema.prisma`: durable domain models for users, preferences, posts, comments, likes, follows, saved posts, notifications, conversations, messages, groups, events, bans, attachments, and polls.
- `.claude/context/features/product-feature-roadmap.md`: confirmed roadmap direction for course resources, jobs/internships, mobile parity, event polish, and platform-level blocking/reporting.
- `.claude/context/features/ui-ux-polish.md`: current scoped web-polish goals for moderation, notifications, loading/error states, and accessibility consistency.

No real customer proof, university partnership, usage metrics, press, testimonials, pricing, or production deployment claims are present. Future design and copy must not fabricate them.

## Product Principles

1. Campus relevance beats generic social breadth: prioritize workflows that make sense because the users share a university context.
2. Everyday utility should stay close to the feed: posts, groups, events, chat, polls, and notifications should reinforce each other instead of feeling like separate apps.
3. Safety and trust are product features: moderation, verification, privacy, upload safety, and clear rejection states should be visible enough to make the product feel reliable.
4. Web is the leading surface right now: design decisions should be web-first while avoiding patterns that make later mobile parity harder.
5. Demo honesty matters: communicate only what the product and repository can truthfully support.

## Accessibility & Inclusion

No formal accessibility standard has been confirmed. Future UI work should preserve and improve baseline accessibility already being addressed in the repo, including readable contrast in light/dark modes, avatar/image alt text, stable touch targets, clear loading/error states, and keyboard-friendly controls.

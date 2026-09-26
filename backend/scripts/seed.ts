// Bulk-populates the database with realistic fake data for local/dev testing -
// thousands of users, posts, comments, likes, follows, conversations,
// messages, groups and events - without creating anything by hand.
//
// Every seeded user gets the same password (SEED_PASSWORD below) and an email
// of the form seed-user-0@loadtest.dev, seed-user-1@loadtest.dev, ... so a
// load-testing tool (e.g. k6) can log in as any of them deterministically.
//
// Usage (run from repo root):
//   npx tsx --env-file=backend/.env backend/scripts/seed.ts
//   npx tsx --env-file=backend/.env backend/scripts/seed.ts --users=2000 --posts=10000
//
// Safe to re-run: user emails/usernames are deterministic and skipped on
// conflict, so re-running just tops up posts/comments/messages/etc.
import { randomUUID } from "crypto";
import bcryptjs from "bcryptjs";
import { faker } from "@faker-js/faker";
import { prisma } from "../database/prisma.js";

const arg = (name: string, fallback: number) => {
  const flag = process.argv.find((a) => a.startsWith(`--${name}=`));
  return flag ? Number(flag.split("=")[1]) : fallback;
};

const COUNTS = {
  users: arg("users", 500),
  posts: arg("posts", 3000),
  comments: arg("comments", 8000),
  follows: arg("follows", 5000),
  likes: arg("likes", 15000),
  conversations: arg("conversations", 1000),
  messagesPerConversation: arg("messagesPerConversation", 12),
  groups: arg("groups", 60),
  events: arg("events", 150),
};

const SEED_PASSWORD = "LoadTest123!";
const UNIVERSITIES = [
  "State University",
  "Tech Institute",
  "Riverside College",
  "Metro University",
  "Coastal State",
];
const MAJORS = [
  "Computer Science",
  "Business Administration",
  "Mechanical Engineering",
  "Psychology",
  "Biology",
  "Economics",
  "Graphic Design",
];
const TAG_NAMES = [
  "career",
  "internships",
  "study-group",
  "campus-life",
  "hackathon",
  "research",
  "networking",
  "sports",
  "housing",
  "events",
  "clubs",
  "finance",
  "tech",
  "wellness",
  "volunteering",
];
const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉"];

// picsum.photos actually serves an image for any seed string, unlike some
// other placeholder services - so seeded posts/covers render real-looking
// photos in the UI instead of broken image icons.
const randomPhotoUrl = (width: number, height: number) =>
  `https://picsum.photos/seed/${faker.string.alphanumeric(10)}/${width}/${height}`;

const chunk = <T,>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const pickMany = <T,>(items: T[], count: number): T[] => {
  const copy = [...items];
  const out: T[] = [];
  for (let i = 0; i < count && copy.length > 0; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
};

const createManyChunked = async <T,>(
  label: string,
  rows: T[],
  insert: (batch: T[]) => Promise<unknown>,
  size = 1000,
) => {
  const batches = chunk(rows, size);
  for (let i = 0; i < batches.length; i++) {
    await insert(batches[i]);
    process.stdout.write(`\r  ${label}: ${Math.min((i + 1) * size, rows.length)}/${rows.length}`);
  }
  process.stdout.write("\n");
};

async function seedUsers() {
  const hashedPassword = await bcryptjs.hash(SEED_PASSWORD, 10);
  const existing = await prisma.user.count({ where: { email: { endsWith: "@loadtest.dev" } } });
  const toCreate = Math.max(0, COUNTS.users - existing);
  if (toCreate === 0) {
    console.log(`Users: already have ${existing}, skipping creation`);
  } else {
    const rows = Array.from({ length: toCreate }, (_, i) => {
      const index = existing + i;
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      return {
        id: randomUUID(),
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        username: `seed_user_${index}`,
        email: `seed-user-${index}@loadtest.dev`,
        password: hashedPassword,
        isVerified: true,
        identityVerified: "true",
        hasCompletedOnboarding: true,
        hasSeenAppTour: true,
        university: pick(UNIVERSITIES),
        major: pick(MAJORS),
        bio: faker.lorem.sentence(),
        profilePicture: faker.image.avatarGitHub(),
        accountType: Math.random() < 0.05 ? ("business" as const) : ("normal" as const),
      };
    });
    await createManyChunked("Users", rows, (batch) =>
      prisma.user.createMany({ data: batch, skipDuplicates: true }),
    );
  }

  const users = await prisma.user.findMany({
    where: { email: { endsWith: "@loadtest.dev" } },
    select: { id: true },
  });
  console.log(`Users ready: ${users.length}`);
  return users.map((u) => u.id);
}

async function seedFollows(userIds: string[]) {
  const rows = Array.from({ length: COUNTS.follows }, () => {
    const [followerId, followingId] = pickMany(userIds, 2);
    return { id: randomUUID(), followerId, followingId };
  }).filter((r) => r.followerId !== r.followingId);

  await createManyChunked("Follows", rows, (batch) =>
    prisma.follow.createMany({ data: batch, skipDuplicates: true }),
  );
}

async function seedTags() {
  await prisma.tag.createMany({
    data: TAG_NAMES.map((name) => ({ id: randomUUID(), name })),
    skipDuplicates: true,
  });
  return prisma.tag.findMany({ select: { id: true } });
}

async function seedPosts(userIds: string[], tagIds: { id: string }[]) {
  const postIds: string[] = [];
  const rows = Array.from({ length: COUNTS.posts }, () => {
    const id = randomUUID();
    postIds.push(id);
    const isOpportunity = Math.random() < 0.15;
    const hasImages = !isOpportunity && Math.random() < 0.4;
    const imageCount = hasImages ? faker.number.int({ min: 1, max: 4 }) : 0;
    return {
      id,
      userId: pick(userIds),
      title: isOpportunity ? faker.person.jobTitle() : faker.lorem.sentence({ min: 4, max: 10 }),
      body: faker.lorem.paragraphs({ min: 1, max: 3 }, "\n\n"),
      location: Math.random() < 0.3 ? faker.location.city() : null,
      imagesUrls: Array.from({ length: imageCount }, () => randomPhotoUrl(1080, 1080)),
      type: isOpportunity ? ("opportunity" as const) : ("standard" as const),
      opportunityType: isOpportunity
        ? pick(["internship", "part_time", "full_time", "graduate_program", "volunteering", "campus_ambassador"] as const)
        : null,
      workplaceType: isOpportunity ? pick(["onsite", "hybrid", "remote"] as const) : null,
      companyName: isOpportunity ? faker.company.name() : null,
      applyUrl: isOpportunity ? faker.internet.url() : null,
      deadlineAt: isOpportunity ? faker.date.future() : null,
      createdAt: faker.date.past({ years: 1 }),
    };
  });

  await createManyChunked("Posts", rows, (batch) => prisma.post.createMany({ data: batch }));

  // Implicit many-to-many (Post <-> Tag) can't go through createMany, so this
  // part is done with a bounded number of concurrent updates instead of one
  // per post sequentially.
  const taggable = postIds.filter(() => Math.random() < 0.6);
  const tagBatches = chunk(taggable, 200);
  for (let i = 0; i < tagBatches.length; i++) {
    await Promise.all(
      tagBatches[i].map((postId) =>
        prisma.post.update({
          where: { id: postId },
          data: { tags: { connect: pickMany(tagIds, faker.number.int({ min: 1, max: 3 })) } },
        }),
      ),
    );
    process.stdout.write(`\r  Post tags: ${Math.min((i + 1) * 200, taggable.length)}/${taggable.length}`);
  }
  process.stdout.write("\n");

  return postIds;
}

// A couple of sentences reads far more like a real comment than the single
// generic faker sentence every seeded row would otherwise share.
const commentText = () =>
  Math.random() < 0.3
    ? faker.lorem.sentence()
    : faker.lorem.sentences({ min: 2, max: 3 });

async function seedComments(userIds: string[], postIds: string[]) {
  const topLevelCount = Math.floor(COUNTS.comments * 0.7);
  const replyCount = COUNTS.comments - topLevelCount;
  const allCommentIds: string[] = [];

  const topLevelIds: string[] = [];
  const topLevelRows = Array.from({ length: topLevelCount }, () => {
    const id = randomUUID();
    topLevelIds.push(id);
    allCommentIds.push(id);
    return {
      id,
      userId: pick(userIds),
      postId: pick(postIds),
      text: commentText(),
      createdAt: faker.date.past({ years: 1 }),
    };
  });
  await createManyChunked("Comments (top-level)", topLevelRows, (batch) =>
    prisma.comment.createMany({ data: batch }),
  );

  if (topLevelIds.length > 0) {
    const replyRows = Array.from({ length: replyCount }, () => {
      const id = randomUUID();
      allCommentIds.push(id);
      const parentId = pick(topLevelIds);
      return {
        id,
        userId: pick(userIds),
        postId: pick(postIds),
        parentId,
        text: commentText(),
        createdAt: faker.date.past({ years: 1 }),
      };
    });
    await createManyChunked("Comments (replies)", replyRows, (batch) =>
      prisma.comment.createMany({ data: batch }),
    );
  }

  return allCommentIds;
}

async function seedLikes(userIds: string[], postIds: string[]) {
  const rows = Array.from({ length: COUNTS.likes }, () => ({
    id: randomUUID(),
    userId: pick(userIds),
    postId: pick(postIds),
  }));
  await createManyChunked("Likes", rows, (batch) =>
    prisma.like.createMany({ data: batch, skipDuplicates: true }),
  );
}

async function seedCommentLikes(userIds: string[], commentIds: string[]) {
  if (commentIds.length === 0) return;
  const rows = Array.from({ length: commentIds.length }, () => ({
    id: randomUUID(),
    likedById: pick(userIds),
    commentId: pick(commentIds),
  }));
  await createManyChunked("Comment likes", rows, (batch) =>
    prisma.commentLike.createMany({ data: batch, skipDuplicates: true }),
  );
}

async function seedConversationsAndMessages(userIds: string[], postIds: string[]) {
  const seenPairs = new Set<string>();
  const conversations: { id: string; participantOneId: string; participantTwoId: string }[] = [];

  while (conversations.length < COUNTS.conversations) {
    const [a, b] = pickMany(userIds, 2);
    if (!a || !b || a === b) continue;
    const [participantOneId, participantTwoId] = [a, b].sort();
    const key = `${participantOneId}:${participantTwoId}`;
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);
    conversations.push({ id: randomUUID(), participantOneId, participantTwoId });
  }

  await createManyChunked("Conversations", conversations, (batch) =>
    prisma.conversation.createMany({ data: batch, skipDuplicates: true }),
  );

  const messageRows: {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
    createdAt: Date;
    sharedPostId?: string;
  }[] = [];
  const reactionRows: { id: string; messageId: string; userId: string; emoji: string }[] = [];
  const lastMessageByConversation = new Map<string, string>();

  for (const conv of conversations) {
    const count = faker.number.int({ min: 1, max: COUNTS.messagesPerConversation });
    let lastId = "";
    for (let i = 0; i < count; i++) {
      const id = randomUUID();
      const senderId = Math.random() < 0.5 ? conv.participantOneId : conv.participantTwoId;
      const receiverId = senderId === conv.participantOneId ? conv.participantTwoId : conv.participantOneId;
      messageRows.push({
        id,
        conversationId: conv.id,
        senderId,
        receiverId,
        content: faker.lorem.sentences({ min: 1, max: 2 }),
        createdAt: faker.date.past({ years: 1 }),
        ...(Math.random() < 0.05 ? { sharedPostId: pick(postIds) } : {}),
      });
      if (Math.random() < 0.15) {
        // React with whichever participant *didn't* send it, like a real chat.
        reactionRows.push({
          id: randomUUID(),
          messageId: id,
          userId: receiverId,
          emoji: pick(REACTION_EMOJIS),
        });
      }
      lastId = id;
    }
    lastMessageByConversation.set(conv.id, lastId);
  }

  await createManyChunked("Messages", messageRows, (batch) =>
    prisma.message.createMany({ data: batch }),
  );
  await createManyChunked("Message reactions", reactionRows, (batch) =>
    prisma.messageReaction.createMany({ data: batch, skipDuplicates: true }),
  );

  const conversationUpdates = chunk([...lastMessageByConversation.entries()], 200);
  for (let i = 0; i < conversationUpdates.length; i++) {
    await Promise.all(
      conversationUpdates[i].map(([conversationId, lastMessageId]) =>
        prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageId } }),
      ),
    );
    process.stdout.write(
      `\r  Conversation last-message: ${Math.min((i + 1) * 200, conversations.length)}/${conversations.length}`,
    );
  }
  process.stdout.write("\n");
}

async function seedGroupsAndMessages(userIds: string[]) {
  for (let g = 0; g < COUNTS.groups; g++) {
    const memberIds = pickMany(userIds, faker.number.int({ min: 5, max: 40 }));
    if (memberIds.length === 0) continue;
    const [creatorId, ...rest] = memberIds;

    const group = await prisma.group.create({
      data: {
        name: `${faker.word.adjective()} ${faker.word.noun()} Group`,
        description: faker.lorem.sentence(),
        coverImageUrl: Math.random() < 0.6 ? randomPhotoUrl(1200, 400) : null,
        visibility: Math.random() < 0.7 ? "public" : "private",
        university: pick(UNIVERSITIES),
        courseTag: Math.random() < 0.5 ? faker.helpers.slugify(pick(MAJORS)) : null,
        members: {
          create: [
            { memberId: creatorId, role: "admin" },
            ...rest.map((memberId) => ({ memberId, role: "member" as const })),
          ],
        },
      },
    });

    const messageCount = faker.number.int({ min: 5, max: 60 });
    const rows = Array.from({ length: messageCount }, () => ({
      id: randomUUID(),
      groupId: group.id,
      senderId: pick(memberIds),
      content: faker.lorem.sentences({ min: 1, max: 2 }),
      createdAt: faker.date.past({ years: 1 }),
    }));
    await prisma.groupMessage.createMany({ data: rows });
    if (rows.length > 0) {
      await prisma.group.update({
        where: { id: group.id },
        data: { lastMessageId: rows[rows.length - 1].id },
      });

      const reactionRows = rows
        .filter(() => Math.random() < 0.15)
        .map((msg) => ({
          id: randomUUID(),
          groupMessageId: msg.id,
          userId: pick(memberIds),
          emoji: pick(REACTION_EMOJIS),
        }));
      if (reactionRows.length > 0) {
        await prisma.groupMessageReaction.createMany({ data: reactionRows, skipDuplicates: true });
      }
    }
    process.stdout.write(`\r  Groups: ${g + 1}/${COUNTS.groups}`);
  }
  process.stdout.write("\n");
}

async function seedEvents(userIds: string[]) {
  const rows = Array.from({ length: COUNTS.events }, () => {
    const startAt = faker.date.soon({ days: 90 });
    return {
      id: randomUUID(),
      creatorId: pick(userIds),
      title: faker.lorem.words({ min: 3, max: 6 }),
      description: faker.lorem.paragraph(),
      location: Math.random() < 0.7 ? faker.location.streetAddress() : null,
      coverImageUrl: Math.random() < 0.7 ? randomPhotoUrl(1200, 600) : null,
      startAt,
      endAt: new Date(startAt.getTime() + faker.number.int({ min: 1, max: 4 }) * 60 * 60 * 1000),
      visibility: Math.random() < 0.8 ? ("public" as const) : ("private" as const),
      capacity: Math.random() < 0.5 ? faker.number.int({ min: 10, max: 200 }) : null,
    };
  });
  await createManyChunked("Events", rows, (batch) => prisma.event.createMany({ data: batch }));

  const eventIds = rows.map((r) => r.id);
  const participantRows = eventIds.flatMap((eventId) =>
    pickMany(userIds, faker.number.int({ min: 0, max: 30 })).map((userId) => ({
      id: randomUUID(),
      eventId,
      userId,
      status: pick(["going", "interested", "waitlisted", "invited"] as const),
    })),
  );
  await createManyChunked("Event participants", participantRows, (batch) =>
    prisma.eventParticipant.createMany({ data: batch, skipDuplicates: true }),
  );
}

async function main() {
  console.log("Seeding with counts:", COUNTS);
  console.log(`All seeded users share the password: ${SEED_PASSWORD}`);

  const userIds = await seedUsers();
  await seedFollows(userIds);
  const tagIds = await seedTags();
  const postIds = await seedPosts(userIds, tagIds);
  const commentIds = await seedComments(userIds, postIds);
  await seedLikes(userIds, postIds);
  await seedCommentLikes(userIds, commentIds);
  await seedConversationsAndMessages(userIds, postIds);
  await seedGroupsAndMessages(userIds);
  await seedEvents(userIds);

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

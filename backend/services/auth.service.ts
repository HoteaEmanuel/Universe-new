import bcryptjs from "bcryptjs";
import crypto from "crypto";
import {
  createNormalAccount,
  createUniversityAccount,
  findUserByEmail,
  findUserByPasswordResetToken,
  recordFailedVerificationAttempt,
  updateUser,
  verifyUser,
} from "../repository/user.repository.js";
import { universityEmailDomains } from "../utils/universityDomain.js";
import { universityDomains } from "../utils/universityDomains.js";
import { parseNameFromEmail } from "../utils/parseNameFromEmail.js";
import { generateVerificationToken } from "../utils/generateVerificationCode.js";
import {
  resetPasswordEmailQueue,
  verifyEmailQueue,
  welcomeEmailQueue,
} from "../queues/emailQueue.js";
import { findUserAccountStatus } from "../repository/userAccountStatus.repository.js";
import { AccountBlockedError } from "../lib/accountBlockedError.js";
import type { AccountType } from "../generated/prisma/client.js";

interface LoginBody {
  email: string;
  password: string;
}

export const login = async (body: LoginBody) => {
  const { email, password } = body;
  const userExists = await findUserByEmail(email);

  if (
    !userExists ||
    !userExists.isVerified ||
    (userExists.accountType === "business" &&
      userExists.identityVerified === "rejected") ||
    (userExists.accountType === "business" &&
      userExists.identityVerified == "false")
  ) {
    throw new Error("Authentication failed");
  }

  const hashedPassword = userExists.password;
  const passwordsMatch =
    !!hashedPassword && (await bcryptjs.compare(password, hashedPassword));
  if (!passwordsMatch) {
    throw new Error("Authentication failed");
  }

  const accountStatus = await findUserAccountStatus(userExists.id);
  if (accountStatus?.status === "blocked") {
    throw new AccountBlockedError(accountStatus.reason ?? null);
  }

  const updatedUser = await updateUser(userExists.id, {
    lastLogin: new Date(),
    resetPasswordToken: null,
    resetPasswordExpiresAt: null,
  });

  const { password: _password, ...safeUser } = updatedUser;
  return safeUser;
};

interface SignUpBody {
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  password: string;
  accountType: AccountType;
  major?: string;
}

export const signUp = async (body: SignUpBody) => {
  let { firstName, lastName, name, email, password, accountType, major } = body;
  email = email.toLowerCase();

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new Error("Registration failed");
  }

  const domain = email.split("@")[1];
  const domainValid = universityEmailDomains.find(
    (Unidomain) => Unidomain == domain,
  );
  if (domainValid === undefined) {
    throw new Error("Not a university email");
  }
  const universityName = universityDomains[domain];

  const verificationCode = generateVerificationToken();

  const salt = await bcryptjs.genSalt();
  const hashedPassword = await bcryptjs.hash(password, salt);
  let user;

  if (accountType === "normal") {
    if (domain !== "gmail.com") {
      const parsed = parseNameFromEmail(email.split("@")[0]);
      if (parsed) {
        firstName = parsed.firstName;
        lastName = parsed.lastName;
      }
    }
    if (!firstName || !lastName) {
      throw new Error("Enter your first and last name");
    }

    user = await createNormalAccount({
      firstName,
      lastName,
      email,
      universityName,
      hashedPassword,
      accountType,
      verificationCode,
      major,
    });
  } else {
    user = await createUniversityAccount({
      name,
      email,
      hashedPassword,
      universityName,
      verificationCode,
      accountType,
    });
  }

  await verifyEmailQueue.add("sendVerificationEmail", {
    to: user.email,
    subject: "Verify your email",
    body: verificationCode,
  });

  return user;
};

const MAX_VERIFICATION_ATTEMPTS = 5;
const VERIFICATION_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export const verifyEmail = async (email: string, code: string) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("Verification code is wrong");
  }

  if (
    user.verificationCooldownUntil &&
    user.verificationCooldownUntil > new Date()
  ) {
    throw new Error(
      "Too many failed attempts. Please wait a few minutes and try again.",
    );
  }

  if (!user.verificationCode || user.verificationCode !== code) {
    const attempts = user.verificationAttempts + 1;
    const cooldownUntil =
      attempts >= MAX_VERIFICATION_ATTEMPTS
        ? new Date(Date.now() + VERIFICATION_COOLDOWN_MS)
        : null;
    await recordFailedVerificationAttempt(user.id, cooldownUntil);
    throw new Error("Verification code is wrong");
  }

  if (
    user.verificationCodeExpiresAt &&
    user.verificationCodeExpiresAt < new Date()
  ) {
    throw new Error("Verification code is expired, try again!");
  }

  await verifyUser(user.id);
  const data = {
    email: user.email,
    name: user?.firstName || user?.name,
  };
  await welcomeEmailQueue.add("sendWelcomeEmail", data);
};

export const sendVerificationEmail = async (email: string) => {
  const user = await findUserByEmail(email);
  if (!user) throw new Error("User not found");
  if (user.isVerified) {
    throw new Error("User with provided email is already verified");
  }
  const verificationCode = generateVerificationToken();
  await updateUser(user.id, {
    verificationCode,
    verificationCodeExpiresAt: new Date(Date.now() + 1000 * 60 * 15),
    verificationAttempts: 0,
    verificationCooldownUntil: null,
  });
  await verifyEmailQueue.add("sendVerificationEmail", {
    to: user.email,
    subject: "Verify your email",
    body: verificationCode,
  });
};

export const forgotPassword = async (email: string) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("User not found with provided email");
  }

  const resetPassToken = crypto.randomBytes(20).toString("hex");
  // The raw token is a full-entropy random value (unlike a user password), so
  // a fast SHA-256 hash is appropriate here — bcrypt's slow hashing adds
  // nothing and, unlike SHA-256, can't be looked up by a plain equality
  // query. Only the hash is ever stored; the raw token is what gets emailed
  // and is never persisted anywhere.
  const hashedToken = crypto.createHash("sha256").update(resetPassToken).digest("hex");

  await updateUser(user.id, {
    resetPasswordToken: hashedToken,
    resetPasswordExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  const encodedToken = encodeURIComponent(resetPassToken);
  await resetPasswordEmailQueue.add("resetPasswordEmail", {
    email,
    token: encodedToken,
  });
};

export const resetPassword = async (password: string, token: string) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await findUserByPasswordResetToken(hashedToken);
  if (!user) {
    throw new Error("Something went wrong");
  }
  if (
    user.resetPasswordExpiresAt &&
    user.resetPasswordExpiresAt < new Date()
  ) {
    throw new Error("Reset link has expired, please request a new one");
  }

  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(password, salt);
  await updateUser(user.id, {
    password: hashedPassword,
    resetPasswordToken: null,
    resetPasswordExpiresAt: null,
    // A password reset means any existing session's refresh token should
    // stop working too — otherwise a stolen refresh token survives the
    // exact event meant to lock the attacker out.
    refreshToken: null,
  });
};

export const loginWeb = async (body: LoginBody) => {
  const user = await login(body);
  if (!user) throw new Error("Login failed");
};

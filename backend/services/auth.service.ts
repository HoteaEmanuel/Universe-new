import bcryptjs from "bcryptjs";
import crypto from "crypto";
import {
  createNormalAccount,
  createUniversityAccount,
  findUserByEmail,
  findUserByPasswordResetToken,
  findUserByVerificationCode,
  updateUser,
  verifyUser,
} from "../repository/user.repository.js";
import { universityEmailDomains } from "../utils/universityDomain.js";
import { universityDomains } from "../utils/universityDomains.js";
import { generateVerificationToken } from "../utils/generateVerificationCode.js";
import {
  resetPasswordEmailQueue,
  verifyEmailQueue,
  welcomeEmailQueue,
} from "../queues/emailQueue.js";
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

export const verifyEmail = async (code: string) => {
  const user = await findUserByVerificationCode(code);
  if (!user) {
    throw new Error("Verification code is wrong");
  }
  if (
    user.verificationCodeExpiresAt &&
    user.verificationCodeExpiresAt < new Date()
  ) {
    throw new Error("Verification code is expired, try again!");
  }
  await verifyUser(code);
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
  const hashedToken = await bcryptjs.hash(resetPassToken, 10);

  await updateUser(user.id, {
    resetPasswordToken: hashedToken,
    resetPasswordExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  const encodedToken = encodeURIComponent(hashedToken);
  await resetPasswordEmailQueue.add("resetPasswordEmail", {
    email,
    token: encodedToken,
  });
};

export const resetPassword = async (password: string, token: string) => {
  const user = await findUserByPasswordResetToken(token);
  if (!user) {
    throw new Error("Something went wrong");
  }

  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(password, salt);
  await updateUser(user.id, {
    password: hashedPassword,
    resetPasswordToken: null,
    resetPasswordExpiresAt: null,
  });
};

export const loginWeb = async (body: LoginBody) => {
  const user = await login(body);
  if (!user) throw new Error("Login failed");
};

import {
  BLOCKED_ACCOUNT_EMAIL,
  PASSWORD_CHANGED_EMAIL,
  RESET_PASSWORD_EMAIL,
  UNBLOCKED_ACCOUNT_EMAIL,
  VERIFICATION_EMAIL,
  WELCOME_EMAIL,
} from "./emailTemplate.js";
import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "emanuelhotea1@gmail.com",
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});
export const sendEmail = async (email, verificationCode) => {
  console.log("EMAIL SIGN UP: " + email);
  try {
    transporter.sendMail({
      to: email,
      subject: "Verify your email",
      html: VERIFICATION_EMAIL.replace(
        "{{VERIFICATION_CODE}}",
        verificationCode,
      ),
    });
  } catch (error) {
    console.log("Email was not sent:( ");
  }
};
export const sendWelcomeEmail = async (user) => {
  try {
    transporter.sendMail({
      to: user.email,
      subject: "Welcome to Universe",
      html: WELCOME_EMAIL.replace("{{USER_NAME}}", user.name)
        .replaceAll("{{APP_NAME}}", "Universe")
        .replace("{{APP_URL}}", `${process.env.CLIENT_URL}/login`),
    });
  } catch (error) {
    console.log("Email was not sent:( ");
  }
};
export const sendPasswordResetEmail = async (data) => {
  const encodedToken = encodeURIComponent(data.token);
  const url = `${process.env.CLIENT_URL}/reset-password/${encodedToken}`;
  try {
    transporter.sendMail({
      to: data.email,
      subject: "Reset password",
      html: RESET_PASSWORD_EMAIL.replace("{{URL}}", url),
    });
  } catch (error) {
    console.log("Could not sent reset email");
  }
};
// Called directly from the change-password controller rather than through
// emailQueue.js — that queue is currently a no-op stub (BullMQ/Redis
// disabled), so routing this through it like the other senders would send
// nothing. Keep this direct call even if the queue is re-enabled later,
// unless this comment is updated too.
export const sendPasswordChangedEmail = async (user) => {
  try {
    transporter.sendMail({
      to: user.email,
      subject: "Your Universe password was changed",
      html: PASSWORD_CHANGED_EMAIL.replace(
        "{{USER_NAME}}",
        user.firstName || user.name || "there",
      ),
    });
  } catch (error) {
    console.log("Could not send password-changed email");
  }
};
// Called directly from the admin block controller rather than through
// emailQueue.js — that queue is currently a no-op stub (BullMQ/Redis
// disabled), so routing this through it like the other senders would send
// nothing. Keep this direct call even if the queue is re-enabled later,
// unless this comment is updated too.
export const sendBlockedAccountEmail = async (user, reason) => {
  try {
    transporter.sendMail({
      to: user.email,
      subject: "Your Universe account has been blocked",
      html: BLOCKED_ACCOUNT_EMAIL.replace(
        "{{USER_NAME}}",
        user.firstName || user.name || "there",
      ).replace("{{REASON}}", reason || "No reason was provided"),
    });
  } catch (error) {
    console.log("Could not send blocked-account email");
  }
};
// Called directly from the admin unblock controller rather than through
// emailQueue.js — that queue is currently a no-op stub (BullMQ/Redis
// disabled), so routing this through it like the other senders would send
// nothing. Keep this direct call even if the queue is re-enabled later,
// unless this comment is updated too.
export const sendUnblockedAccountEmail = async (user) => {
  try {
    transporter.sendMail({
      to: user.email,
      subject: "Your Universe account has been unblocked",
      html: UNBLOCKED_ACCOUNT_EMAIL.replace(
        "{{USER_NAME}}",
        user.firstName || user.name || "there",
      ).replace("{{APP_URL}}", `${process.env.CLIENT_URL}/login`),
    });
  } catch (error) {
    console.log("Could not send unblocked-account email");
  }
};

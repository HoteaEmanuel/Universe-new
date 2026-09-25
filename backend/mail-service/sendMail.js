import {
  BLOCKED_ACCOUNT_EMAIL,
  PASSWORD_CHANGED_EMAIL,
  PASSWORD_SET_EMAIL,
  RESET_PASSWORD_EMAIL,
  UNBLOCKED_ACCOUNT_EMAIL,
  VERIFICATION_EMAIL,
  WELCOME_EMAIL,
} from "./emailTemplate.js";
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

// HTTP API instead of SMTP: free hosting tiers (Render included) commonly
// block outbound SMTP ports, which would silently break every email below
// if we kept using nodemailer/Gmail SMTP. Brevo's free tier sends to any
// recipient once the sender address is verified, unlike Resend's free tier,
// which (without a verified domain) only delivers to the email address the
// Resend account itself was signed up with.
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const sendViaBrevo = async ({ to, subject, html }) => {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    console.warn(
      `BREVO_API_KEY/BREVO_SENDER_EMAIL not set - email to ${to} was not sent.`,
    );
    return;
  }
  await axios.post(
    BREVO_API_URL,
    {
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: process.env.BREVO_SENDER_NAME || "Universe",
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
    },
  );
};

export const sendEmail = async (email, verificationCode) => {
  try {
    await sendViaBrevo({
      to: email,
      subject: "Verify your email",
      html: VERIFICATION_EMAIL.replace(
        "{{VERIFICATION_CODE}}",
        verificationCode,
      ),
    });
  } catch (error) {
    console.log("Email was not sent:( ", error?.response?.data || error);
  }
};
export const sendWelcomeEmail = async (user) => {
  try {
    await sendViaBrevo({
      to: user.email,
      subject: "Welcome to Universe",
      html: WELCOME_EMAIL.replace("{{USER_NAME}}", user.name)
        .replaceAll("{{APP_NAME}}", "Universe")
        .replace("{{APP_URL}}", `${process.env.CLIENT_URL}/login`),
    });
  } catch (error) {
    console.log("Email was not sent:( ", error?.response?.data || error);
  }
};
export const sendPasswordResetEmail = async (data) => {
  const encodedToken = encodeURIComponent(data.token);
  const url = `${process.env.CLIENT_URL}/reset-password/${encodedToken}`;
  try {
    await sendViaBrevo({
      to: data.email,
      subject: "Reset password",
      html: RESET_PASSWORD_EMAIL.replace("{{URL}}", url),
    });
  } catch (error) {
    console.log("Could not sent reset email", error?.response?.data || error);
  }
};
// Called directly from the change-password controller rather than through
// emailQueue.js — that queue is currently a no-op stub (BullMQ/Redis
// disabled), so routing this through it like the other senders would send
// nothing. Keep this direct call even if the queue is re-enabled later,
// unless this comment is updated too.
export const sendPasswordChangedEmail = async (user) => {
  try {
    await sendViaBrevo({
      to: user.email,
      subject: "Your Universe password was changed",
      html: PASSWORD_CHANGED_EMAIL.replace(
        "{{USER_NAME}}",
        user.firstName || user.name || "there",
      ),
    });
  } catch (error) {
    console.log("Could not send password-changed email", error?.response?.data || error);
  }
};
export const sendPasswordSetEmail = async (user) => {
  try {
    await sendViaBrevo({
      to: user.email,
      subject: "A password was set for your Universe account",
      html: PASSWORD_SET_EMAIL.replace(
        "{{USER_NAME}}",
        user.firstName || user.name || "there",
      ),
    });
  } catch (error) {
    console.log("Could not send password-set email", error?.response?.data || error);
  }
};
// Called directly from the admin block controller rather than through
// emailQueue.js — that queue is currently a no-op stub (BullMQ/Redis
// disabled), so routing this through it like the other senders would send
// nothing. Keep this direct call even if the queue is re-enabled later,
// unless this comment is updated too.
export const sendBlockedAccountEmail = async (user, reason) => {
  try {
    await sendViaBrevo({
      to: user.email,
      subject: "Your Universe account has been blocked",
      html: BLOCKED_ACCOUNT_EMAIL.replace(
        "{{USER_NAME}}",
        user.firstName || user.name || "there",
      ).replace("{{REASON}}", reason || "No reason was provided"),
    });
  } catch (error) {
    console.log("Could not send blocked-account email", error?.response?.data || error);
  }
};
// Called directly from the admin unblock controller rather than through
// emailQueue.js — that queue is currently a no-op stub (BullMQ/Redis
// disabled), so routing this through it like the other senders would send
// nothing. Keep this direct call even if the queue is re-enabled later,
// unless this comment is updated too.
export const sendUnblockedAccountEmail = async (user) => {
  try {
    await sendViaBrevo({
      to: user.email,
      subject: "Your Universe account has been unblocked",
      html: UNBLOCKED_ACCOUNT_EMAIL.replace(
        "{{USER_NAME}}",
        user.firstName || user.name || "there",
      ).replace("{{APP_URL}}", `${process.env.CLIENT_URL}/login`),
    });
  } catch (error) {
    console.log("Could not send unblocked-account email", error?.response?.data || error);
  }
};

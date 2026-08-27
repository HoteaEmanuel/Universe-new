import type { Request, Response } from "express";
import axios from "axios";
import { prisma } from "../database/prisma.js";
import {
  PUBLIC_USER_SELECT,
  createUserWithGeneratedUsername,
  findUserById,
} from "../repository/user.repository.js";
import { generateToken } from "../utils/generateTokenJwt.js";
import { generateJwtMobile } from "../utils/generateJwtMobile.js";
import {
  createMobileAuthExchangeCode,
  consumeMobileAuthExchangeCode,
} from "../lib/oauthExchange.js";
import { verifyAuthToken } from "../lib/authTokens.js";
import { AccountBlockedError } from "../lib/accountBlockedError.js";
import {
  RefreshTokenReuseError,
  rotateRefreshToken,
} from "../services/refreshToken.service.js";
import { updateUser } from "../repository/user.repository.js";
import { universityEmailDomains } from "../utils/universityDomain.js";
import { universityDomains } from "../utils/universityDomains.js";

import {
  login,
  verifyEmail,
  signUp,
  sendVerificationEmail,
  forgotPassword,
  resetPassword,
} from "../services/auth.service.js";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

/**
 * Check if there is a user with a specific id, as parameter
 */
export const checkAuth = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      omit: {
        password: true,
        resetPasswordExpiresAt: true,
        resetPasswordToken: true,
      },
    });
    if (!user) return res.status(401).json({ message: "User not found" });
    return res
      .status(200)
      .json({ succes: "true", message: "User is authenticated", user });
  } catch (error) {
    return res.status(401).json({ message: "Unauth" });
  }
};

/** Gets the business registrations. Route requires verifyToken + requireAdmin. */
export const businessRegistrations = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { accountType: "business", identityVerified: "false" },
      select: PUBLIC_USER_SELECT,
    });
    return res.status(200).json({ succes: true, businessRegistrations: users });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Could not fetch business registrations" });
  }
};

/** The admin accepts a registration. Route requires verifyToken + requireAdmin. */
export const acceptBusinessRegistration = async (req: Request, res: Response) => {
  const id = req.params.id as string; // single named :id param, never an array
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await prisma.user.update({
      where: { id },
      data: { identityVerified: "true" },
    });
    return res
      .status(200)
      .json({ message: "Business account verified successfully" });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Could not verify business account" });
  }
};

/** Route requires verifyToken + requireAdmin. */
export const rejectBusinessRegistration = async (req: Request, res: Response) => {
  const id = req.params.id as string; // single named :id param, never an array
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await prisma.user.update({
      where: { id },
      data: { identityVerified: "rejected" },
    });

    return res
      .status(200)
      .json({ message: "Business account rejected and deleted successfully" });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Could not reject business account" });
  }
};

export const signUpController = async (req: Request, res: Response) => {
  try {
    const user = await signUp(req.body);
    return res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const sendVerificationEmailController = async (
  req: Request,
  res: Response,
) => {
  const { email } = req.body;
  try {
    await sendVerificationEmail(email);
    return res
      .status(200)
      .json({ message: "Verification email was sent successfully" });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const verifyEmailController = async (req: Request, res: Response) => {
  const { email, verificationCode } = req.body;

  try {
    await verifyEmail(email, verificationCode);
    return res.status(200).json({ message: "Email verified :)" });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const loginWeb = async (req: Request, res: Response) => {
  try {
    const userExists = await login(req.body);
    generateToken(res, userExists.id);
    return res
      .status(200)
      .json({ message: "Logged in successfully", user: userExists });
  } catch (error) {
    if (error instanceof AccountBlockedError) {
      return res.status(403).json({
        message: error.message,
        code: "ACCOUNT_BLOCKED",
        reason: error.reason,
      });
    }
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const loginMobile = async (req: Request, res: Response) => {
  try {
    const userExists = await login(req.body);

    const tokens = await generateJwtMobile(userExists.id);
    if (!tokens) throw new Error("Could not generate tokens");
    const { accessToken, refreshToken } = tokens;

    return res.status(200).json({
      message: "Logged in successfully",
      user: userExists,
      accessToken: JSON.stringify(accessToken),
      refreshToken: JSON.stringify(refreshToken),
    });
  } catch (error) {
    return res.status(400).json({ message: "Could not log in" });
  }
};

export const forgotPasswordController = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    await forgotPassword(email);
    return res
      .status(200)
      .json({ message: "Reset password email was sent with succes!" });
  } catch (error) {
    return res.status(400).json({ message: "Couldnt reset password" });
  }
};

export const resetPasswordController = async (req: Request, res: Response) => {
  const { password } = req.body;
  const token = req.params.token as string; // single named :token param, never an array
  try {
    await resetPassword(password, token);
    return res.status(200).json({ message: "Password changed succesfully" });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error) });
  }
};

export const logout = async (req: Request, res: Response) => {
  // Best-effort: revoke the stored refresh-token hash so a copy of it
  // (cookie theft, SecureStore extraction) stops working the moment the
  // user logs out, not just when its 30-day lifetime happens to expire.
  // Web sends it as a cookie; mobile (bearer-token based, no cookies) sends
  // it in the body instead.
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (refreshToken) {
    const decoded = verifyAuthToken(refreshToken, "refresh");
    if (decoded) {
      await updateUser(decoded.userId, { refreshToken: null }).catch(() => {});
    }
  }

  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const refreshMobileController = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const rotated = await rotateRefreshToken(refreshToken);
    return res.status(200).json({
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
    });
  } catch (error) {
    if (error instanceof AccountBlockedError) {
      return res
        .status(403)
        .json({ message: error.message, code: "ACCOUNT_BLOCKED" });
    }
    if (error instanceof RefreshTokenReuseError) {
      return res.status(401).json({ message: errorMessage(error) });
    }
    return res.status(400).json({ message: "Could not refresh session" });
  }
};

export const authWithGoogle = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(400).json({ message: "Google authentication failed" });
  }
  generateToken(res, req.user.id);
  res.redirect(`${process.env.FRONTEND_URL}/`);
};

export const authWithGoogleMobile = async (req: Request, res: Response) => {
  const { code } = req.query;

  try {
    const redirect_uri =
      process.env.BACKEND_URL_1 + "/auth/google/mobile-callback";
    const { data } = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri,
      grant_type: "authorization_code",
    });

    const { access_token } = data;

    const userInfo = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } },
    );

    const { email, name, picture, id: googleId } = userInfo.data;

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const domain = email?.split("@")[1];
      const domainValid = universityEmailDomains.find(
        (Unidomain) => Unidomain == domain,
      );
      if (!email || domainValid === undefined) {
        res.redirect("mobileapp://auth-callback?error=invalid_domain");
        return;
      }
      const universityName = universityDomains[domain];

      user = await createUserWithGeneratedUsername(
        {
          email,
          name,
          profilePicture: picture,
          googleId,
          university: universityName,
          isVerified: true,
        },
        name,
      );
    }

    if (!user.isVerified) {
      res.redirect("mobileapp://auth-callback?error=email_not_verified");
      return;
    }

    const tokens = await generateJwtMobile(user.id);
    if (!tokens) throw new Error("Could not generate tokens");

    // Real tokens never touch the deep-link URL (OS logs, crash reporters,
    // and deep-link history can all see it) - only a single-use, 60s-lived
    // exchange code does. The app redeems it over HTTPS in exchangeGoogleMobileCode.
    const exchangeCode = createMobileAuthExchangeCode({
      userId: user.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    const deepLink = `exp://192.168.1.129:8081/--/auth-callback?code=${encodeURIComponent(exchangeCode)}`;
    res.redirect(deepLink);
  } catch (error) {
    console.error("Google auth error:", error);
    res.redirect("mobileapp://auth-callback?error=auth_failed");
  }
};

export const exchangeGoogleMobileCodeController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { code } = req.body;
    const exchange = consumeMobileAuthExchangeCode(code);
    if (!exchange) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const user = await findUserById(exchange.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Logged in successfully",
      user,
      accessToken: JSON.stringify(exchange.accessToken),
      refreshToken: JSON.stringify(exchange.refreshToken),
    });
  } catch (error) {
    return res.status(400).json({ message: "Could not log in" });
  }
};

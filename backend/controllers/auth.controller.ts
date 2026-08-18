import type { Request, Response } from "express";
import axios from "axios";
import { prisma } from "../database/prisma.js";
import { generateToken } from "../utils/generateTokenJwt.js";
import { generateJwtMobile } from "../utils/generateJwtMobile.js";
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

/** Gets the business registrations */
export const businessRegistrations = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { accountType: "business", identityVerified: "false" },
    });
    return res.status(200).json({ succes: true, businessRegistrations: users });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Could not fetch business registrations" });
  }
};

/** The admin accepts a registration */
export const acceptBusinessRegistration = async (req: Request, res: Response) => {
  const id = req.params.id as string; // single named :id param, never an array
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    const authUser = await prisma.user.findUnique({ where: { id: req.userId } });
    if (authUser?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
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

export const rejectBusinessRegistration = async (req: Request, res: Response) => {
  const id = req.params.id as string; // single named :id param, never an array
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const authUser = await prisma.user.findUnique({ where: { id: req.userId } });
    if (authUser?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
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
  const { verificationCode } = req.body;

  try {
    await verifyEmail(verificationCode);
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

export const logout = (req: Request, res: Response) => {
  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");
  res.status(200).json({ success: true, message: "Logged out successfully" });
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

      user = await prisma.user.create({
        data: {
          email,
          name,
          profilePicture: picture,
          googleId,
          university: universityName,
          isVerified: true,
        },
      });
    }

    if (!user.isVerified) {
      res.redirect("mobileapp://auth-callback?error=email_not_verified");
      return;
    }

    const token = await generateJwtMobile(user.id);

    const userData = encodeURIComponent(
      JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        university: user.university,
        major: user.major,
        bio: user.bio,
        accountType: user.accountType,
      }),
    );

    const deepLink = `exp://192.168.1.129:8081/--/auth-callback?token=${encodeURIComponent(JSON.stringify(token))}&user=${userData}`;
    res.redirect(deepLink);
  } catch (error) {
    console.error("Google auth error:", error);
    res.redirect("mobileapp://auth-callback?error=auth_failed");
  }
};

import express from "express";
import passport from "passport";
import {
  signUpController,
  verifyEmailController,
  logout,
  forgotPasswordController,
  resetPasswordController,
  checkAuth,
  sendVerificationEmailController,
  businessRegistrations,
  acceptBusinessRegistration,
  rejectBusinessRegistration,
  authWithGoogle,
  loginWeb,
  loginMobile,
  authWithGoogleMobile,
  exchangeGoogleMobileCodeController,
  refreshMobileController,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireAdmin } from "../middleware/authorization.js";
import { validate } from "../middleware/validate.js";
import {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleMobileSchema,
  googleMobileExchangeSchema,
  refreshMobileSchema,
} from "../schemas/auth.schema.js";
const router = express.Router();
router.post("/check-auth", verifyToken, checkAuth);
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

router.post(
  "/google/mobile",
  validate({ body: googleMobileSchema }),
  authWithGoogle,
);

// A plain failureRedirect can only send one fixed URL for every failure
// reason, so a blocked account would land on the same generic
// "google_auth_failed" message as an unsupported email domain. Using the
// callback form of passport.authenticate instead exposes the verify
// callback's `info` (set in config/passport.ts), so the specific reason can
// be forwarded to the frontend as a distinct ?error= code.
const GOOGLE_ERROR_CODE_TO_PARAM: Record<string, string> = {
  INVALID_DOMAIN: "invalid_domain",
  EMAIL_NOT_VERIFIED: "email_not_verified",
  ACCOUNT_BLOCKED: "account_blocked",
};

router.get("/google/callback", (req, res, next) => {
  passport.authenticate(
    "google",
    { session: false },
    (err: unknown, user: Express.User | false, info?: { code?: string }) => {
      if (err || !user) {
        const errorParam = info?.code
          ? (GOOGLE_ERROR_CODE_TO_PARAM[info.code] ?? "google_auth_failed")
          : "google_auth_failed";
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=${errorParam}`);
      }
      req.user = user;
      return authWithGoogle(req, res);
    },
  )(req, res, next);
});

router.post(
  "/reject-business-registrations/:id",
  verifyToken,
  requireAdmin,
  rejectBusinessRegistration,
);
router.post("/signup", validate({ body: signupSchema }), signUpController);
router.post(
  "/verify-email",
  validate({ body: verifyEmailSchema }),
  verifyEmailController,
);
router.post(
  "/resend-verify-email",
  validate({ body: resendVerifyEmailSchema }),
  sendVerificationEmailController,
);
router.post("/login", validate({ body: loginSchema }), loginWeb);
router.post("/login/mobile", validate({ body: loginSchema }), loginMobile);
router.post(
  "/refresh-mobile",
  validate({ body: refreshMobileSchema }),
  refreshMobileController,
);

router.get("/google/mobile-init", (req, res) => {
  const redirect_uri =
    process.env.BACKEND_URL_1 + "/auth/google/mobile-callback";
  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirect_uri)}&` +
    `response_type=code&` +
    `scope=openid%20profile%20email&` +
    `access_type=offline&` +
    `prompt=select_account`;

  res.redirect(googleAuthUrl);
});

router.get("/google/mobile-callback", authWithGoogleMobile);
router.post(
  "/google/mobile-exchange",
  validate({ body: googleMobileExchangeSchema }),
  exchangeGoogleMobileCodeController,
);
router.post(
  "/reset-password/:token",
  validate({ body: resetPasswordSchema }),
  resetPasswordController,
);
router.post("/logout", logout);
router.post(
  "/forgot-password",
  validate({ body: forgotPasswordSchema }),
  forgotPasswordController,
);

router.get(
  "/business-account-registrations",
  verifyToken,
  requireAdmin,
  businessRegistrations,
);
router.post(
  "/accept-business-registrations/:id",
  verifyToken,
  requireAdmin,
  acceptBusinessRegistration,
);
export default router;

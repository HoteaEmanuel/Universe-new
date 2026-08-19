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

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
  }),
  authWithGoogle,
);

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

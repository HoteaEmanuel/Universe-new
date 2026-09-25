import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type OAuth2Strategy from "passport-oauth2";
import { prisma } from "../database/prisma.js";
import { universityDomains, isAutoVerifiedDomain } from "../utils/universityDomains.js";
import { createUserWithGeneratedUsername } from "../repository/user.repository.js";
import { findUserAccountStatus } from "../repository/userAccountStatus.repository.js";
import { googleOAuthStateStore } from "../lib/oauthState.js";

// passport-google-oauth20's Strategy constructor throws synchronously if
// clientID/clientSecret are missing, which would otherwise crash the whole
// server on boot even for routes that have nothing to do with Google auth.
// Skip registering the strategy when it isn't configured, so the rest of the
// app still works everywhere else.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
        // Verifies the redirect back from Google was started by this same
        // browser (CSRF protection) - a custom in-memory store instead of
        // passport's default session-backed one, since this app has no
        // express-session (auth is stateless JWT cookies).
      
        store: googleOAuthStateStore as OAuth2Strategy.StateStore,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          let user = await prisma.user.findUnique({
            where: { googleId: profile.id },
          });

          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(null, false, {
              code: "GOOGLE_AUTH_FAILED",
              message: "Google did not return an email address",
            });
          }
          const domain = email.split("@")[1];
          const universityName = domain ? universityDomains[domain] : undefined;

          if (!user) {
            user = await prisma.user.findUnique({ where: { email } });

            if (user) {
              if (!user.isVerified) {
                return done(null, false, {
                  code: "EMAIL_NOT_VERIFIED",
                  message: "Please verify your email before continuing",
                });
              }
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id },
              });
            } else {
              user = await createUserWithGeneratedUsername(
                {
                  googleId: profile.id,
                  email,
                  firstName: profile.name?.givenName,
                  lastName: profile.name?.familyName,
                  university: universityName || "Unknown University",
                  profilePicture: profile.photos?.[0]?.value,
                  isVerified: true,
                  identityVerified: isAutoVerifiedDomain(domain) ? "true" : "false",
                },
                [profile.name?.givenName, profile.name?.familyName]
                  .filter(Boolean)
                  .join(" "),
              );
            }
          }

          if (!user.isVerified) {
            return done(null, false, {
              code: "EMAIL_NOT_VERIFIED",
              message: "Please verify your email before continuing",
            });
          }

          // Same pending-review state a domain we don't auto-verify puts a
          // normal-signup account into (see auth.service.ts) - block
          // sign-in until an admin approves it here too.
          if (user.identityVerified === "false" || user.identityVerified === "rejected") {
            return done(null, false, {
              code: "PENDING_REVIEW",
              message: "Your account is awaiting manual verification",
            });
          }

          /* Check if the user was block and block its access if so */
          const accountStatus = await findUserAccountStatus(user.id);
          if (accountStatus?.status === "blocked") {
            return done(null, false, {
              code: "ACCOUNT_BLOCKED",
              message: accountStatus.reason
                ? `Your account has been blocked: ${accountStatus.reason}`
                : "Your account has been blocked",
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      },
    ),
  );
} else {
  console.warn(
    "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET not set - Google auth routes are disabled.",
  );
}

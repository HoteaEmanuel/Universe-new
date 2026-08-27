import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../database/prisma.js";
import { universityEmailDomains } from "../utils/universityDomain.js";
import { universityDomains } from "../utils/universityDomains.js";
import { createUserWithGeneratedUsername } from "../repository/user.repository.js";
import { findUserAccountStatus } from "../repository/userAccountStatus.repository.js";

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
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          let user = await prisma.user.findUnique({
            where: { googleId: profile.id },
          });

          const email = profile.emails?.[0]?.value;
          const domain = email?.split("@")[1];
          const universityName = domain ? universityDomains[domain] : undefined;
          const domainValid = universityEmailDomains.find(
            (Unidomain) => Unidomain == domain,
          );
          if (!email || domainValid === undefined) {
            return done(null, false, {
              code: "INVALID_DOMAIN",
              message: "Invalid email domain",
            });
          }

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

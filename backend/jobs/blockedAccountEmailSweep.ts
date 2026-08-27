import {
  findPendingBlockedAccountEmails,
  markBlockedAccountEmailSent,
} from "../repository/admin.repository.js";
import { sendBlockedAccountEmail } from "../mail-service/sendMail.js";

// The block-notification email is deliberately delayed: a blocked user still
// has residual access for up to ~15 min (their current access token keeps
// working until it needs a refresh, see rotateRefreshToken). Emailing them
// immediately would tip them off that they're about to lose access while
// they can still act — so we only email once the delay has passed, by which
// point enforcement has had time to actually kick in.
const BLOCK_EMAIL_DELAY_MS = 1000 * 60 * 15;
const SWEEP_INTERVAL_MS = 1000 * 60;

export const sweepBlockedAccountEmails = async () => {
  const pending = await findPendingBlockedAccountEmails(BLOCK_EMAIL_DELAY_MS);
  for (const status of pending) {
    // Atomic claim: only proceed if this row is still blocked and unsent at
    // the moment of the update, so two overlapping sweep ticks (or a sweep
    // racing an admin re-block) can't send the email twice.
    const claimed = await markBlockedAccountEmailSent(status.userId);
    if (claimed.count === 0) continue;
    await sendBlockedAccountEmail(status.user, status.reason);
  }
};

export const startBlockedAccountEmailSweep = () => {
  const interval = setInterval(() => {
    sweepBlockedAccountEmails().catch((error) => {
      console.log("Blocked-account email sweep failed", error);
    });
  }, SWEEP_INTERVAL_MS);
  interval.unref();
  return interval;
};

export class AccountBlockedError extends Error {
  reason: string | null;
  constructor(reason: string | null = null) {
    super("Your account has been blocked");
    this.reason = reason;
  }
}

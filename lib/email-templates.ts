export function welcomeEmailHtml({
  name,
  setPasswordUrl,
}: {
  name: string;
  setPasswordUrl?: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="font-size: 20px;">Welcome, ${name}!</h1>
      <p>Your digital business card account is ready. Let's finish setting up your card.</p>
      ${
        setPasswordUrl
          ? `<p>An admin created this account for you. Set your password to get started:</p>
      <p>
        <a href="${setPasswordUrl}" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">
          Set your password
        </a>
      </p>`
          : `<p>
        <a href="${process.env.NEXTAUTH_URL}/dashboard/setup" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">
          Set up your card
        </a>
      </p>`
      }
    </div>
  `;
}

export function purchaseConfirmationEmailHtml({
  name,
  planName,
  expiresAt,
}: {
  name: string | null;
  planName: string;
  expiresAt: Date;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="font-size: 20px;">Purchase confirmed, ${name ?? "there"}!</h1>
      <p>Your <strong>${planName}</strong> plan is active and your card is now live.</p>
      <p>Your plan is valid until <strong>${expiresAt.toDateString()}</strong>.</p>
      <p>
        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">
          Go to dashboard
        </a>
      </p>
    </div>
  `;
}

export function referralRewardEmailHtml({
  name,
  points,
  walletBalance,
}: {
  name: string | null;
  points: number;
  walletBalance: number;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="font-size: 20px;">You earned ${points} referral points!</h1>
      <p>Hi ${name ?? "there"}, someone you referred just made their first purchase.</p>
      <p>We've credited <strong>${points} points</strong> to your wallet.</p>
      <p>Your wallet balance is now <strong>${walletBalance} points</strong>.</p>
      <p>Redeem your points towards your next plan purchase or renewal from your dashboard.</p>
      <p>
        <a href="${process.env.NEXTAUTH_URL}/dashboard/referrals" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">
          View your referrals
        </a>
      </p>
    </div>
  `;
}

export function renewalConfirmationEmailHtml({
  name,
  planName,
  expiresAt,
}: {
  name: string | null;
  planName: string;
  expiresAt: Date;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="font-size: 20px;">Renewal confirmed, ${name ?? "there"}!</h1>
      <p>Your <strong>${planName}</strong> plan has been renewed and your card remains live.</p>
      <p>Your plan is now valid until <strong>${expiresAt.toDateString()}</strong>.</p>
      <p>
        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">
          Go to dashboard
        </a>
      </p>
    </div>
  `;
}

export function expiryReminderEmailHtml({
  name,
  daysRemaining,
  planExpiresAt,
}: {
  name: string | null;
  daysRemaining: number;
  planExpiresAt: Date;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="font-size: 20px;">Your card expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}</h1>
      <p>Hi ${name ?? "there"}, your plan expires on <strong>${planExpiresAt.toDateString()}</strong>.</p>
      <p>Renew now to keep your digital business card live and accessible.</p>
      <p>
        <a href="${process.env.NEXTAUTH_URL}/dashboard/plans" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">
          Renew your plan
        </a>
      </p>
    </div>
  `;
}

export function passwordResetEmailHtml({ resetUrl }: { resetUrl: string }) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="font-size: 20px;">Reset your password</h1>
      <p>We received a request to reset your password. This link expires in 1 hour.</p>
      <p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">
          Reset password
        </a>
      </p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}

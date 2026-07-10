import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Users } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { CopyReferralLinkButton } from "@/components/dashboard/copy-referral-link-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { getReferralSettings, getWalletSettings } from "@/lib/settings";

export default async function ReferralsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [user, totalReferrals, redemptions, { pointsPerReferral }, { conversionRate }] =
    await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { referralCode: true, walletPoints: true } }),
      db.referral.count({ where: { referrerId: userId } }),
      db.walletTransaction.findMany({
        where: { userId, type: "REDEEMED" },
        orderBy: { createdAt: "desc" },
      }),
      getReferralSettings(),
      getWalletSettings(),
    ]);

  if (!user) {
    redirect("/login");
  }

  const referralLink = `${process.env.NEXTAUTH_URL}/signup?ref=${user.referralCode}`;
  const walletInr = Math.round(user.walletPoints / conversionRate);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8 lg:p-10">
      <PageHeader
        icon={Users}
        title="Referrals"
        description="Share your link and earn wallet points when your referrals purchase a plan."
      />

      <Card>
        <CardHeader>
          <CardTitle>Your referral link</CardTitle>
          <CardDescription>{referralLink}</CardDescription>
        </CardHeader>
        <CardContent>
          <CopyReferralLinkButton link={referralLink} />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total referrals</CardDescription>
            <CardTitle className="text-2xl">{totalReferrals}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Points per referral</CardDescription>
            <CardTitle className="text-2xl">{pointsPerReferral}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Wallet balance</CardDescription>
            <CardTitle className="text-2xl">
              {user.walletPoints} pts <span className="text-base text-muted-foreground">(₹{walletInr})</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Redemption history</CardTitle>
        </CardHeader>
        <CardContent>
          {redemptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No redemptions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>INR value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>{txn.createdAt.toDateString()}</TableCell>
                    <TableCell>{txn.description}</TableCell>
                    <TableCell>{txn.points}</TableCell>
                    <TableCell>₹{txn.inrValue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

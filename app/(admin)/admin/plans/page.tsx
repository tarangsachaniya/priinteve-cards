import { CreditCard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { PlanDisableButton } from "@/components/admin/plan-disable-button";
import { PlanForm } from "@/components/admin/plan-form";
import { PageHeader } from "@/components/shared/page-header";

const CARD_TYPE_LABEL: Record<string, string> = {
  NFC: "NFC",
  QR: "QR",
  BOTH: "NFC + QR",
};

export default async function AdminPlansPage() {
  const plans = await db.plan.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8">
      <PageHeader
        icon={CreditCard}
        title="Plans"
        description="Create, edit, and disable plans available to users."
        action={<PlanForm mode="create" trigger={<Button type="button">Create Plan</Button>} />}
      />

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Card type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Validity</TableHead>
              <TableHead>Max gallery images</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => {
              const features = Array.isArray(plan.featuresJson)
                ? (plan.featuresJson as unknown[]).filter((f): f is string => typeof f === "string")
                : [];

              return (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{CARD_TYPE_LABEL[plan.cardType] ?? plan.cardType}</TableCell>
                  <TableCell>₹{plan.price}</TableCell>
                  <TableCell>{plan.validityDays} days</TableCell>
                  <TableCell>{plan.maxGalleryImages}</TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? "default" : "outline"}>
                      {plan.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <PlanForm
                      mode="edit"
                      planId={plan.id}
                      initialValues={{
                        name: plan.name,
                        cardType: plan.cardType,
                        price: plan.price,
                        validityDays: plan.validityDays,
                        featuresJson: features,
                        maxGalleryImages: plan.maxGalleryImages,
                        isActive: plan.isActive,
                      }}
                      trigger={
                        <Button type="button" variant="outline" size="sm">
                          Edit
                        </Button>
                      }
                    />
                    <PlanDisableButton planId={plan.id} disabled={!plan.isActive} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}

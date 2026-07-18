"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserForm } from "@/components/admin/user-form";
import { UsersTable } from "@/components/admin/users-table";

type Plan = { id: string; name: string };

export function UsersPanel({ plans }: { plans: Plan[] }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <UserForm
          plans={plans}
          trigger={
            <Button type="button">
              <Plus /> Add user
            </Button>
          }
          onCreated={() => setRefreshKey((k) => k + 1)}
        />
      </div>
      <UsersTable refreshKey={refreshKey} />
    </div>
  );
}

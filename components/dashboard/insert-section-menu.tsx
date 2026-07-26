"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { INSERTABLE_SECTION_TYPES, getFieldTypeMeta } from "@/lib/field-types";

export function InsertSectionMenu({
  onInsert,
  excludeTypes,
}: {
  onInsert: (fieldType: string) => void;
  excludeTypes?: readonly string[];
}) {
  const [open, setOpen] = useState(false);
  const types = excludeTypes
    ? INSERTABLE_SECTION_TYPES.filter((type) => !excludeTypes.includes(type))
    : INSERTABLE_SECTION_TYPES;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" size="sm" />
        }
      >
        <Plus className="size-4" /> Add section
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search section types…" />
          <CommandList>
            <CommandEmpty>No matching section type.</CommandEmpty>
            <CommandGroup>
              {types.map((type) => {
                const meta = getFieldTypeMeta(type);
                const Icon = meta.icon;
                return (
                  <CommandItem
                    key={type}
                    value={meta.label}
                    onSelect={() => {
                      onInsert(type);
                      setOpen(false);
                    }}
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    {meta.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

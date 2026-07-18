"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="brand-color">Brand color</Label>
      <div className="flex items-center gap-2">
        <input
          id="brand-color-swatch"
          type="color"
          value={HEX_REGEX.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-full border border-input bg-transparent p-0"
          aria-label="Brand color swatch"
        />
        <Input
          id="brand-color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="max-w-32"
        />
      </div>
    </div>
  );
}

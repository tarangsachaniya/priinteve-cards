"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorInput } from "@/components/wizard/color-input";
import { FONT_OPTIONS } from "@/lib/theme-presets";

export function ThemeEditModal({
  brandColor,
  headingFont,
  bodyFont,
  onSave,
}: {
  brandColor: string;
  headingFont: string;
  bodyFont: string;
  onSave: (next: { brandColor: string; headingFont: string; bodyFont: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(brandColor);
  const [heading, setHeading] = useState(headingFont);
  const [body, setBody] = useState(bodyFont);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setColor(brandColor);
          setHeading(headingFont);
          setBody(bodyFont);
        }
      }}
    >
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <Settings2 /> Theme edit
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit theme</DialogTitle>
          <DialogDescription>
            These changes apply globally, across every theme — not just the one you have selected.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <ColorInput value={color} onChange={setColor} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="heading-font">Heading font</Label>
            <Select value={heading} onValueChange={(v) => v && setHeading(v)}>
              <SelectTrigger id="heading-font">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((font) => (
                  <SelectItem key={font.id} value={font.id}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="body-font">Body font</Label>
            <Select value={body} onValueChange={(v) => v && setBody(v)}>
              <SelectTrigger id="body-font">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((font) => (
                  <SelectItem key={font.id} value={font.id}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={() => {
              onSave({ brandColor: color, headingFont: heading, bodyFont: body });
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

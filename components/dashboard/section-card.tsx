"use client";

import { useState } from "react";
import { type DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { ChevronDown, Copy, Eye, EyeOff, GripVertical, Trash2, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SectionCard({
  icon: Icon,
  title,
  dragHandleProps,
  isVisible,
  onToggleVisibility,
  onDuplicate,
  onDelete,
  deleteConfirmText,
  defaultExpanded = true,
  children,
}: {
  icon: LucideIcon;
  title: string;
  dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  onDuplicate?: () => void;
  onDelete: () => void;
  deleteConfirmText: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(24,24,20,0.04),0_8px_20px_-12px_rgba(24,24,20,0.10)] transition-all duration-200 hover:border-primary/25",
        isVisible === false && "opacity-60"
      )}
    >
      <div className="flex items-center gap-2 px-3 py-3">
        <span
          {...dragHandleProps}
          className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-ink">
          <Icon className="size-4" />
        </span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center gap-1.5 truncate text-left text-sm font-semibold"
        >
          <span className="truncate">{title}</span>
        </button>

        <div className="flex items-center gap-0.5">
          {onToggleVisibility && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onToggleVisibility}
              aria-label={isVisible ? "Hide section" : "Show section"}
            >
              {isVisible ? <Eye /> : <EyeOff />}
            </Button>
          )}
          {onDuplicate && (
            <Button type="button" variant="ghost" size="icon-sm" onClick={onDuplicate} aria-label="Duplicate section">
              <Copy />
            </Button>
          )}
          <Dialog>
            <DialogTrigger
              render={<Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" aria-label="Delete section" />}
            >
              <Trash2 />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete this section?</DialogTitle>
                <DialogDescription>{deleteConfirmText}</DialogDescription>
              </DialogHeader>
              <DialogFooter showCloseButton>
                <DialogClose render={<Button type="button" variant="destructive" onClick={onDelete} />}>
                  Delete
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
          </button>
        </div>
      </div>
      {expanded && <div className="border-t border-border/70 bg-muted/20">{children}</div>}
    </div>
  );
}

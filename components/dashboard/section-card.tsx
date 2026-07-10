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
        "overflow-hidden rounded-xl border bg-card shadow-sm transition-opacity",
        isVisible === false && "opacity-60"
      )}
    >
      <div className="flex items-center gap-1.5 px-2 py-2">
        <span {...dragHandleProps} className="cursor-grab p-1 text-muted-foreground" aria-label="Drag to reorder">
          <GripVertical className="size-4" />
        </span>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md text-primary">
          <Icon className="size-4" />
        </span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center gap-1.5 truncate text-left text-sm font-medium"
        >
          <span className="truncate">{title}</span>
        </button>

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
          className="p-1 text-muted-foreground"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
        </button>
      </div>
      {expanded && <div className="border-t">{children}</div>}
    </div>
  );
}

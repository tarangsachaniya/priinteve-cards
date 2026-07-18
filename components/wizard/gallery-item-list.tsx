"use client";

import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { GripVertical, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getYoutubeThumbnail } from "@/lib/youtube";

export type WizardGalleryItem = {
  id: string;
  type: "IMAGE" | "YOUTUBE";
  url: string;
  order: number;
};

export function GalleryItemList({
  items,
  onReorder,
  onRemove,
}: {
  items: WizardGalleryItem[];
  onReorder: (nextOrder: WizardGalleryItem[]) => void;
  onRemove: (id: string) => void;
}) {
  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const next = Array.from(items);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    onReorder(next);
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No gallery items yet.</p>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="gallery-items">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-2">
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(dragProvided) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    className="flex items-center gap-2 rounded-2xl border border-border p-2"
                  >
                    <span {...dragProvided.dragHandleProps} className="cursor-grab text-muted-foreground">
                      <GripVertical className="size-4" />
                    </span>
                    <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.type === "YOUTUBE" ? getYoutubeThumbnail(item.url) ?? item.url : item.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="flex-1 truncate text-sm text-muted-foreground">
                      {item.type === "YOUTUBE" ? "YouTube video" : "Image"}
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => onRemove(item.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

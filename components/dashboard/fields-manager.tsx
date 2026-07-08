"use client";

import { useState } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";

import { AddFieldModal } from "@/components/dashboard/add-field-modal";
import { FieldRow, type ManagedField } from "@/components/dashboard/field-row";

export function FieldsManager({ initialFields }: { initialFields: ManagedField[] }) {
  const [fields, setFields] = useState<ManagedField[]>(initialFields);

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const previous = fields;
    const next = Array.from(fields);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    const reordered = next.map((field, index) => ({ ...field, order: index }));
    setFields(reordered);

    const res = await fetch("/api/card-field/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: reordered.map((f) => ({ id: f.id, order: f.order })) }),
    });
    if (!res.ok) {
      setFields(previous);
      toast.error("Could not save the new order");
    }
  }

  async function toggleVisibility(id: string) {
    const previous = fields;
    const target = fields.find((f) => f.id === id);
    if (!target) return;
    const nextVisible = !target.isVisible;
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, isVisible: nextVisible } : f)));

    const res = await fetch(`/api/card-field/${id}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: nextVisible }),
    });
    if (!res.ok) {
      setFields(previous);
      toast.error("Could not update visibility");
    }
  }

  async function updateField(id: string, next: { label: string; value: string }) {
    const previous = fields;
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...next } : f)));

    const res = await fetch(`/api/card-field/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!res.ok) {
      setFields(previous);
      toast.error("Could not save changes");
    }
  }

  async function deleteField(id: string) {
    const previous = fields;
    setFields((prev) => prev.filter((f) => f.id !== id));

    const res = await fetch(`/api/card-field/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setFields(previous);
      toast.error("Could not delete field");
    }
  }

  function addField(field: ManagedField) {
    setFields((prev) => [...prev, field]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Card fields</h1>
          <p className="text-sm text-muted-foreground">
            Changes appear on your public card within 2 hours.
          </p>
        </div>
        <AddFieldModal onAdded={addField} />
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You don&apos;t have any fields yet. Add one to get started.
        </p>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="card-fields">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-2">
                {fields.map((field, index) => (
                  <Draggable key={field.id} draggableId={field.id} index={index}>
                    {(dragProvided) => (
                      <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                        <FieldRow
                          field={field}
                          dragHandleProps={dragProvided.dragHandleProps}
                          onToggleVisibility={() => toggleVisibility(field.id)}
                          onUpdate={(next) => updateField(field.id, next)}
                          onDelete={() => deleteField(field.id)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, Link2, List, ListOrdered, Underline } from "lucide-react";

import { sanitizeRichTextClient } from "@/lib/sanitize-html";
import { cn } from "@/lib/utils";

const TOOLBAR_ACTIONS = [
  { command: "bold", icon: Bold, label: "Bold" },
  { command: "italic", icon: Italic, label: "Italic" },
  { command: "underline", icon: Underline, label: "Underline" },
  { command: "insertUnorderedList", icon: List, label: "Bulleted list" },
  { command: "insertOrderedList", icon: ListOrdered, label: "Numbered list" },
] as const;

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (el && el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  function emitChange() {
    const el = editorRef.current;
    if (!el) return;
    onChange(sanitizeRichTextClient(el.innerHTML));
  }

  function exec(command: string) {
    editorRef.current?.focus();
    document.execCommand(command);
    emitChange();
  }

  function addLink() {
    const url = window.prompt("Link URL (https://…)");
    if (!url) return;
    editorRef.current?.focus();
    document.execCommand("createLink", false, url);
    emitChange();
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        className
      )}
    >
      <div className="flex items-center gap-0.5 border-b border-border/80 p-1">
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            key={action.command}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(action.command)}
            aria-label={action.label}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <action.icon className="size-3.5" />
          </button>
        ))}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={addLink}
          aria-label="Insert link"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Link2 className="size-3.5" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          emitChange();
        }}
        data-placeholder={placeholder}
        className="min-h-28 px-3.5 py-2.5 text-sm leading-relaxed outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  );
}

"use client";

import { Color } from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent as TiptapContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  IndentIncrease,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { useEffect } from "react";
import { FirstLineIndent } from "./first-line-indent";
import { normalizeRichText, sanitizeRichText } from "./rich-text";

export function RichTextEditor({
  label,
/**
 * 基于 Tiptap 的富文本编辑器封装，对外输入/输出 HTML 字符串。
 */
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const normalizedValue = normalizeRichText(value);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: false,
        underline: false,
      }),
      Underline,
      TextStyle,
      Color,
      Link.configure({
        autolink: true,
        openOnClick: false,
        defaultProtocol: "https",
      }),
      TextAlign.configure({
        types: ["paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      FirstLineIndent,
    ],
    content: normalizedValue,
    editorProps: {
      attributes: {
        "aria-label": label,
        class:
          "rich-text-content min-h-44 rounded-b-2xl bg-white px-4 py-3 outline-none",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(sanitizeRichText(currentEditor.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = sanitizeRichText(editor.getHTML());
    if (current !== normalizedValue) {
      editor.commands.setContent(normalizedValue, { emitUpdate: false });
    }
  }, [editor, normalizedValue]);

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("请输入链接地址", previousUrl ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  };

  const applyIndent = () => {
    if (!editor) return;
    const currentIndent = editor.getAttributes("paragraph").textIndent;
    const chain = editor.chain().focus();
    if (currentIndent === "2em") {
      chain.unsetFirstLineIndent().run();
    } else {
      chain.setFirstLineIndent().run();
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-black/15 bg-[#f5f1e8] focus-within:border-black">
      <div
        aria-label={`${label}工具栏`}
        className="flex flex-wrap items-center gap-1.5 border-b-2 border-black/10 p-2"
        role="toolbar"
      >
        <ToolButton
          active={editor?.isActive("bold")}
          disabled={!editor?.can().chain().focus().toggleBold().run()}
          icon={Bold}
          label="加粗"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        />
        <ToolButton
          active={editor?.isActive("underline")}
          icon={UnderlineIcon}
          label="下划线"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        />
        <label
          className="relative grid h-9 w-9 cursor-pointer place-items-center rounded-xl border-2 border-black bg-white"
          title="字体颜色"
        >
          <span
            className="h-4 w-4 rounded-full border border-black"
            style={{
              background:
                (editor?.getAttributes("textStyle").color as string) || "#171717",
            }}
          />
          <input
            aria-label="字体颜色"
            className="absolute inset-0 cursor-pointer opacity-0"
            type="color"
            value={
              (editor?.getAttributes("textStyle").color as string) || "#171717"
            }
            onChange={(event) =>
              editor?.chain().focus().setColor(event.target.value).run()
            }
          />
        </label>
        <Divider />
        <ToolButton
          active={editor?.isActive("bulletList")}
          icon={List}
          label="无序列表"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        />
        <ToolButton
          active={editor?.isActive("orderedList")}
          icon={ListOrdered}
          label="有序列表"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        />
        <ToolButton
          active={editor?.getAttributes("paragraph").textIndent === "2em"}
          icon={IndentIncrease}
          label="首行缩进 2 字符"
          onClick={applyIndent}
        />
        <ToolButton
          active={editor?.isActive("link")}
          icon={Link2}
          label="插入超链接"
          onClick={setLink}
        />
        <Divider />
        <ToolButton
          active={editor?.isActive({ textAlign: "left" })}
          icon={AlignLeft}
          label="左对齐"
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
        />
        <ToolButton
          active={editor?.isActive({ textAlign: "center" })}
          icon={AlignCenter}
          label="居中对齐"
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
        />
        <ToolButton
          active={editor?.isActive({ textAlign: "right" })}
          icon={AlignRight}
          label="右对齐"
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
        />
        <ToolButton
          active={editor?.isActive({ textAlign: "justify" })}
          icon={AlignJustify}
          label="两端对齐"
          onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
        />
        <Divider />
        <ToolButton
          disabled={!editor?.can().chain().focus().undo().run()}
          icon={Undo2}
          label="撤销"
          onClick={() => editor?.chain().focus().undo().run()}
        />
        <ToolButton
          disabled={!editor?.can().chain().focus().redo().run()}
          icon={Redo2}
          label="恢复"
          onClick={() => editor?.chain().focus().redo().run()}
        />
      </div>
      <TiptapContent editor={editor} />
    </div>
  );
}

function ToolButton({
  label,
  icon: Icon,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  icon: typeof Bold;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={`grid h-9 w-9 place-items-center rounded-xl border-2 border-black transition ${
        active
          ? "bg-[var(--yellow)] shadow-[2px_2px_0_black]"
          : "bg-white hover:bg-[#fff8d4]"
      } disabled:cursor-not-allowed disabled:opacity-35`}
      disabled={disabled}
      title={label}
      type="button"
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
    >
      <Icon size={16} strokeWidth={2.5} />
    </button>
  );
}

function Divider() {
  return <i className="mx-0.5 h-7 w-px bg-black/20" />;
}

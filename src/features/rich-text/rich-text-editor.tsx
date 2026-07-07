"use client";

import { Color } from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { getMarkRange, type Editor } from "@tiptap/core";
import {
  EditorContent as TiptapContent,
  useEditor,
  useEditorState,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Copy,
  ExternalLink,
  IndentIncrease,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Pencil,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { FirstLineIndent } from "./first-line-indent";
import { normalizeRichText, sanitizeRichText } from "./rich-text";

const DEFAULT_TEXT_COLOR = "#171717";
const LINK_TEXT_COLOR = "#3157d5";

interface ToolbarState {
  bold: boolean;
  underline: boolean;
  bulletList: boolean;
  orderedList: boolean;
  indent: boolean;
  link: boolean;
  alignLeft: boolean;
  alignCenter: boolean;
  alignRight: boolean;
  alignJustify: boolean;
  color: string;
  canUndo: boolean;
  canRedo: boolean;
  selectedText: string;
  linkHref: string;
}

interface TextRange {
  from: number;
  to: number;
}

interface FloatingPosition {
  left: number;
  top: number;
}

interface HoveredLink extends FloatingPosition {
  href: string;
  text: string;
  range: TextRange | null;
}

const emptyToolbarState: ToolbarState = {
  bold: false,
  underline: false,
  bulletList: false,
  orderedList: false,
  indent: false,
  link: false,
  alignLeft: true,
  alignCenter: false,
  alignRight: false,
  alignJustify: false,
  color: DEFAULT_TEXT_COLOR,
  canUndo: false,
  canRedo: false,
  selectedText: "",
  linkHref: "",
};

export function RichTextEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const normalizedValue = normalizeRichText(value);
  const editorFrameRef = useRef<HTMLDivElement | null>(null);
  const hoverToolbarRef = useRef<HTMLDivElement | null>(null);
  const hoverCloseTimerRef = useRef<number | null>(null);
  const linkInputRef = useRef<HTMLInputElement | null>(null);
  const [linkPanelOpen, setLinkPanelOpen] = useState(false);
  const [linkPanelPosition, setLinkPanelPosition] =
    useState<FloatingPosition | null>(null);
  const [linkPanelRange, setLinkPanelRange] = useState<TextRange | null>(null);
  const [linkTextValue, setLinkTextValue] = useState("");
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkHint, setLinkHint] = useState("");
  const [hoveredLink, setHoveredLink] = useState<HoveredLink | null>(null);
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
        HTMLAttributes: {
          class: "resume-editor-link",
          style: `color: ${LINK_TEXT_COLOR}; text-decoration: underline; text-underline-offset: 2px;`,
        },
        isAllowedUri: (url) => isSafeLinkHref(url),
        openOnClick: true,
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
  const toolbarState =
    useEditorState({
      editor,
      selector: ({ editor: currentEditor }) => {
        if (!currentEditor) return emptyToolbarState;
        const { from, to } = currentEditor.state.selection;
        const selectedText =
          from === to ? "" : currentEditor.state.doc.textBetween(from, to, " ");
        const color =
          (currentEditor.getAttributes("textStyle").color as string | undefined) ||
          DEFAULT_TEXT_COLOR;
        const linkHref =
          (currentEditor.getAttributes("link").href as string | undefined) || "";

        return {
          bold: currentEditor.isActive("bold"),
          underline: currentEditor.isActive("underline"),
          bulletList: currentEditor.isActive("bulletList"),
          orderedList: currentEditor.isActive("orderedList"),
          indent: currentEditor.getAttributes("paragraph").textIndent === "2em",
          link: currentEditor.isActive("link"),
          alignLeft: currentEditor.isActive({ textAlign: "left" }),
          alignCenter: currentEditor.isActive({ textAlign: "center" }),
          alignRight: currentEditor.isActive({ textAlign: "right" }),
          alignJustify: currentEditor.isActive({ textAlign: "justify" }),
          color,
          canUndo: currentEditor.can().undo(),
          canRedo: currentEditor.can().redo(),
          selectedText,
          linkHref,
        };
      },
    }) ?? emptyToolbarState;
  const selectedTextLinkHref = guessLinkHref(toolbarState.selectedText);
  const linkPanelTitle = useMemo(() => {
    if (toolbarState.link) return "编辑超链接";
    if (selectedTextLinkHref) return "确认文本转链接";
    if (toolbarState.selectedText) return "为选中文字添加超链接";
    return "开启超链接输入";
  }, [selectedTextLinkHref, toolbarState.link, toolbarState.selectedText]);
  const toolbarColor = normalizeColorInputValue(toolbarState.color);

  useEffect(() => {
    if (!editor) return;
    const current = sanitizeRichText(editor.getHTML());
    if (current !== normalizedValue) {
      editor.commands.setContent(normalizedValue, { emitUpdate: false });
    }
  }, [editor, normalizedValue]);

  useEffect(() => {
    if (!linkPanelOpen) return;
    linkInputRef.current?.focus();
    linkInputRef.current?.select();
  }, [linkPanelOpen]);

  useEffect(() => {
    return () => clearHoverCloseTimer();
  }, []);

  function clearHoverCloseTimer() {
    if (hoverCloseTimerRef.current === null) return;
    window.clearTimeout(hoverCloseTimerRef.current);
    hoverCloseTimerRef.current = null;
  }

  function scheduleHoverToolbarClose() {
    clearHoverCloseTimer();
    hoverCloseTimerRef.current = window.setTimeout(() => {
      setHoveredLink(null);
      hoverCloseTimerRef.current = null;
    }, 360);
  }

  const openLinkPanel = () => {
    if (!editor) return;

    setLinkError("");
    setLinkHint("");
    const selectionRange = getCurrentLinkOrSelectionRange(editor);
    const position = getFloatingPositionForRange(editor, editorFrameRef.current);

    setLinkPanelRange(selectionRange);
    setLinkPanelPosition(position);
    setLinkTextValue(
      selectionRange
        ? editor.state.doc.textBetween(selectionRange.from, selectionRange.to, " ")
        : "",
    );
    setLinkValue(toolbarState.linkHref || selectedTextLinkHref || "");
    setHoveredLink(null);
    setLinkPanelOpen(true);
  };

  const applyLink = (href?: string) => {
    if (!editor) return;
    const normalizedHref = normalizeLinkHref(href ?? linkValue);
    if (!normalizedHref) {
      setLinkError("请输入链接地址，不能使用 javascript/data/vbscript 协议。");
      return;
    }

    const text = linkTextValue.trim();
    if (linkPanelRange && !text) {
      setLinkError("请输入链接文本。");
      return;
    }

    if (linkPanelRange) {
      const currentText = editor.state.doc.textBetween(
        linkPanelRange.from,
        linkPanelRange.to,
        " ",
      );
      const chain = editor.chain().focus().setTextSelection(linkPanelRange);

      if (text && text !== currentText) {
        chain
          .insertContent({
            type: "text",
            text,
            marks: [
              { type: "link", attrs: { href: normalizedHref } },
              { type: "textStyle", attrs: { color: LINK_TEXT_COLOR } },
              { type: "underline" },
            ],
          })
          .run();
      } else {
        chain
          .setLink({ href: normalizedHref })
          .setColor(LINK_TEXT_COLOR)
          .setUnderline()
          .run();
      }
    } else if (text) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text,
          marks: [
            { type: "link", attrs: { href: normalizedHref } },
            { type: "textStyle", attrs: { color: LINK_TEXT_COLOR } },
            { type: "underline" },
          ],
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .setLink({ href: normalizedHref })
        .setColor(LINK_TEXT_COLOR)
        .setUnderline()
        .run();
    }

    if (!linkPanelRange && !toolbarState.link) {
      setLinkHint("已开启超链接状态，后续输入会使用该链接。");
    } else {
      setLinkHint("");
      setLinkPanelOpen(false);
    }
    setLinkError("");
  };

  const removeLink = (range = linkPanelRange) => {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (range) {
      chain.setTextSelection(range);
    } else {
      chain.extendMarkRange("link");
    }
    chain.unsetLink().unsetColor().unsetUnderline().run();
    setLinkPanelOpen(false);
    setHoveredLink(null);
    setLinkError("");
    setLinkHint("");
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

  const openHoveredLinkEditor = (link: HoveredLink) => {
    if (!editor) return;
    setLinkPanelRange(link.range);
    setLinkPanelPosition({ left: link.left, top: link.top + 44 });
    setLinkTextValue(link.text);
    setLinkValue(link.href);
    setLinkError("");
    setLinkHint("");
    clearHoverCloseTimer();
    setHoveredLink(null);
    setLinkPanelOpen(true);
  };

  const handleEditorMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!editor) return;
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (hoverToolbarRef.current?.contains(target)) {
      clearHoverCloseTimer();
      return;
    }

    const anchor = target.closest<HTMLAnchorElement>("a[href]");
    if (!anchor || !editor.view.dom.contains(anchor)) {
      scheduleHoverToolbarClose();
      return;
    }

    const href = anchor.getAttribute("href") ?? "";
    if (!normalizeLinkHref(href)) {
      scheduleHoverToolbarClose();
      return;
    }

    clearHoverCloseTimer();
    const rect = anchor.getBoundingClientRect();
    const position = getFloatingPositionForRect(
      rect,
      editorFrameRef.current,
      248,
      2,
    );
    setHoveredLink({
      ...position,
      href,
      text: anchor.textContent ?? "",
      range: getLinkRangeFromAnchor(editor, anchor),
    });
  };

  const visitLink = (href: string) => {
    const normalizedHref = normalizeLinkHref(href);
    if (!normalizedHref) return;
    window.open(normalizedHref, "_blank", "noopener,noreferrer");
  };

  const copyLink = async (href: string) => {
    try {
      await navigator.clipboard.writeText(href);
      setLinkHint("链接已复制。");
    } catch {
      setLinkHint("当前浏览器不允许自动复制，请手动复制链接。");
    }
  };

  return (
    <div
      ref={editorFrameRef}
      className="relative rounded-2xl border-2 border-black/15 bg-[#f5f1e8] focus-within:border-black"
      onMouseLeave={scheduleHoverToolbarClose}
      onMouseMove={handleEditorMouseMove}
    >
      <div
        aria-label={`${label}工具栏`}
        className="flex flex-wrap items-center gap-1.5 border-b-2 border-black/10 p-2"
        role="toolbar"
      >
        <ToolButton
          active={toolbarState.bold}
          disabled={!editor}
          icon={Bold}
          label="加粗"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        />
        <ToolButton
          active={toolbarState.underline}
          disabled={!editor}
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
              background: toolbarColor,
            }}
          />
          <input
            aria-label="字体颜色"
            className="absolute inset-0 cursor-pointer opacity-0"
            type="color"
            value={toolbarColor}
            onChange={(event) =>
              editor?.chain().focus().setColor(event.target.value).run()
            }
          />
        </label>
        <Divider />
        <ToolButton
          active={toolbarState.bulletList}
          disabled={!editor}
          icon={List}
          label="无序列表"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        />
        <ToolButton
          active={toolbarState.orderedList}
          disabled={!editor}
          icon={ListOrdered}
          label="有序列表"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        />
        <ToolButton
          active={toolbarState.indent}
          disabled={!editor}
          icon={IndentIncrease}
          label="首行缩进 2 字符"
          onClick={applyIndent}
        />
        <ToolButton
          active={toolbarState.link || linkPanelOpen}
          disabled={!editor}
          icon={Link2}
          label="插入超链接"
          onClick={openLinkPanel}
        />
        <Divider />
        <ToolButton
          active={toolbarState.alignLeft}
          disabled={!editor}
          icon={AlignLeft}
          label="左对齐"
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
        />
        <ToolButton
          active={toolbarState.alignCenter}
          disabled={!editor}
          icon={AlignCenter}
          label="居中对齐"
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
        />
        <ToolButton
          active={toolbarState.alignRight}
          disabled={!editor}
          icon={AlignRight}
          label="右对齐"
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
        />
        <ToolButton
          active={toolbarState.alignJustify}
          disabled={!editor}
          icon={AlignJustify}
          label="两端对齐"
          onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
        />
        <Divider />
        <ToolButton
          disabled={!toolbarState.canUndo}
          icon={Undo2}
          label="撤销"
          onClick={() => editor?.chain().focus().undo().run()}
        />
        <ToolButton
          disabled={!toolbarState.canRedo}
          icon={Redo2}
          label="恢复"
          onClick={() => editor?.chain().focus().redo().run()}
        />
      </div>
      {linkPanelOpen && linkPanelPosition && (
        <div
          className="absolute z-50 w-[min(560px,calc(100%-24px))] rounded-xl border border-black/10 bg-white p-4 shadow-[0_10px_28px_rgb(0_0_0/14%)]"
          style={{
            left: linkPanelPosition.left,
            top: linkPanelPosition.top,
          }}
        >
          <div className="mb-3 text-sm font-black text-black/65">
            {linkPanelTitle}
          </div>
          <div className="grid gap-3">
            <label>
              <span className="mb-1.5 block text-xs font-black text-black/55">
                文本
              </span>
              <input
                className="h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm outline-none focus:border-black"
                placeholder="链接文本"
                value={linkTextValue}
                onChange={(event) => {
                  setLinkTextValue(event.target.value);
                  setLinkError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyLink();
                  if (event.key === "Escape") setLinkPanelOpen(false);
                }}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-black text-black/55">
                链接
              </span>
              <input
                ref={linkInputRef}
                className="h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm outline-none focus:border-black"
                placeholder="链接地址"
                value={linkValue}
                onChange={(event) => {
                  setLinkValue(event.target.value);
                  setLinkError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyLink();
                  if (event.key === "Escape") setLinkPanelOpen(false);
                }}
              />
            </label>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <ToolButton
              icon={Check}
              label="应用链接"
              tone="primary"
              onClick={() => applyLink()}
            />
            <ToolButton
              disabled={!linkPanelRange && !toolbarState.link}
              icon={Link2Off}
              label="取消超链接"
              onClick={() => removeLink()}
            />
            <ToolButton
              icon={X}
              label="关闭链接面板"
              onClick={() => {
                setLinkPanelOpen(false);
                setLinkError("");
              }}
            />
          </div>
          {linkError && (
            <p className="mt-2 text-xs font-bold text-red-600">{linkError}</p>
          )}
        </div>
      )}
      {hoveredLink && !linkPanelOpen && (
        <div
          ref={hoverToolbarRef}
          className="absolute z-50 flex items-center gap-3 rounded-lg border border-black/10 bg-white px-4 py-3 shadow-[0_10px_24px_rgb(0_0_0/16%)]"
          style={{
            left: hoveredLink.left,
            top: hoveredLink.top,
          }}
          onMouseEnter={clearHoverCloseTimer}
          onMouseLeave={scheduleHoverToolbarClose}
        >
          <ToolButton
            icon={ExternalLink}
            label="访问链接"
            onClick={() => visitLink(hoveredLink.href)}
          />
          <ToolButton
            icon={Pencil}
            label="编辑链接"
            onClick={() => openHoveredLinkEditor(hoveredLink)}
          />
          <ToolButton
            icon={Copy}
            label="复制链接"
            onClick={() => void copyLink(hoveredLink.href)}
          />
          <ToolButton
            icon={Link2Off}
            label="取消超链接"
            onClick={() => removeLink(hoveredLink.range)}
          />
        </div>
      )}
      {linkHint && (
        <p className="border-b-2 border-black/10 bg-white px-3 py-2 text-xs font-bold text-[#3157d5]">
          {linkHint}
        </p>
      )}
      <TiptapContent editor={editor} />
    </div>
  );
}

function guessLinkHref(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return normalizeLinkHref(trimmed);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return `mailto:${trimmed}`;
  if (/^www\.[^\s]+\.[^\s]+$/i.test(trimmed)) return `https://${trimmed}`;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/[^\s]*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return null;
}

function normalizeLinkHref(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || !isSafeLinkHref(trimmed)) return null;
  return trimmed;
}

function isSafeLinkHref(value: string | undefined): boolean {
  const compactHref = (value?.trim() ?? "").replace(/[\u0000-\u0020]+/g, "");
  return Boolean(compactHref) && !/^(javascript|data|vbscript):/i.test(compactHref);
}

function getCurrentLinkOrSelectionRange(editor: Editor): TextRange | null {
  const linkRange = getActiveLinkRange(editor);
  if (linkRange) return linkRange;

  const { from, to } = editor.state.selection;
  if (from === to) return null;
  return { from, to };
}

function getActiveLinkRange(editor: Editor): TextRange | null {
  const markType = editor.schema.marks.link;
  if (!markType) return null;

  const { from } = editor.state.selection;
  const range = getMarkRange(editor.state.doc.resolve(from), markType);
  return range ? { from: range.from, to: range.to } : null;
}

function getLinkRangeFromAnchor(
  editor: Editor,
  anchor: HTMLAnchorElement,
): TextRange | null {
  const markType = editor.schema.marks.link;
  if (!markType) return null;

  try {
    const position = editor.view.posAtDOM(anchor, 0);
    const docSize = editor.state.doc.content.size;
    const candidates = [position, position + 1, position - 1].filter(
      (item) => item > 0 && item <= docSize,
    );

    for (const candidate of candidates) {
      const range = getMarkRange(editor.state.doc.resolve(candidate), markType);
      if (range) return { from: range.from, to: range.to };
    }
  } catch {
    return null;
  }

  return null;
}

function getFloatingPositionForRange(
  editor: Editor,
  container: HTMLElement | null,
): FloatingPosition {
  const { from, to } = editor.state.selection;
  const start = editor.view.coordsAtPos(from);
  const end = editor.view.coordsAtPos(to);
  const rect = {
    left: Math.min(start.left, end.left),
    right: Math.max(start.right, end.right),
    top: Math.min(start.top, end.top),
    bottom: Math.max(start.bottom, end.bottom),
  };
  return getFloatingPositionForRect(rect, container, 560);
}

function getFloatingPositionForRect(
  rect: Pick<DOMRect, "bottom" | "left" | "right" | "top">,
  container: HTMLElement | null,
  preferredWidth: number,
  offset = 8,
): FloatingPosition {
  const containerRect = container?.getBoundingClientRect();
  if (!containerRect) {
    return { left: 12, top: 12 };
  }

  const panelWidth = Math.min(preferredWidth, Math.max(220, containerRect.width - 24));
  const minLeft = 12;
  const maxLeft = Math.max(minLeft, containerRect.width - panelWidth - 12);
  const targetLeft = rect.left - containerRect.left;

  return {
    left: clamp(targetLeft, minLeft, maxLeft),
    top: Math.max(12, rect.bottom - containerRect.top + offset),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeColorInputValue(value: string): string {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : DEFAULT_TEXT_COLOR;
}

function ToolButton({
  label,
  icon: Icon,
  active = false,
  disabled = false,
  tone = "default",
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  tone?: "default" | "primary";
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active || undefined}
      className={`grid h-9 w-9 place-items-center rounded-xl border-2 border-black transition ${
        active || tone === "primary"
          ? "bg-(--yellow) shadow-[2px_2px_0_black]"
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

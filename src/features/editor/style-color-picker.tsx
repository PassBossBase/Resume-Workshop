import * as Popover from "@radix-ui/react-popover";
import { Pipette } from "lucide-react";
import { InkButton } from "@/components/anime-ui/ui";
import {
  type ChangeEvent,
  type PointerEvent,
  useCallback,
  useMemo,
  useState,
} from "react";

type HsvColor = {
  h: number;
  s: number;
  v: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function stripHash(hex: string): string {
  return hex.startsWith("#") ? hex.slice(1) : hex;
}

function normalizeHex(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9a-fA-F]/g, "");
  if (cleaned.length === 3) {
    const [r, g, b] = cleaned.split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (cleaned.length === 6) {
    return `#${cleaned}`.toLowerCase();
  }
  return null;
}

function hexToHsv(hex: string): HsvColor {
  let h = hex;
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    else if (max === g) hue = ((b - r) / delta + 2) / 6;
    else hue = ((r - g) / delta + 4) / 6;
  }
  return {
    h: Math.round(hue * 360),
    s: max === 0 ? 0 : Math.round((delta / max) * 100) / 100,
    v: Math.round(max * 100) / 100,
  };
}

function hsvToHex(hsv: HsvColor): string {
  const { h, s, v } = hsv;
  const hue = h / 360;
  const i = Math.floor(hue * 6);
  const f = hue * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r: number, g: number, b: number;
  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    default:
      r = v;
      g = p;
      b = q;
      break;
  }
  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function ThemeColorPicker({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(normalizeHex(value) ?? "#3f57e8");
  const [inputValue, setInputValue] = useState(stripHash(draft));
  const hsv = useMemo(() => hexToHsv(draft), [draft]);

  const syncDraft = useCallback((color: string) => {
    const next = normalizeHex(color) ?? "#3f57e8";
    setDraft(next);
    setInputValue(stripHash(next));
  }, []);

  const openPicker = useCallback(() => {
    syncDraft(value);
    setOpen(true);
  }, [syncDraft, value]);

  const commitAndClose = useCallback(() => {
    const validInput = normalizeHex(inputValue);
    onCommit(validInput ?? draft);
    setOpen(false);
  }, [draft, inputValue, onCommit]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        openPicker();
        return;
      }
      if (open) commitAndClose();
    },
    [commitAndClose, open, openPicker],
  );

  const setFromHsv = (next: HsvColor) => {
    const nextHex = hsvToHex(next);
    setDraft(nextHex);
    setInputValue(stripHash(nextHex));
  };

  const updateSaturationValue = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    setFromHsv({ ...hsv, s: x, v: 1 - y });
  };

  const updateHue = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    setFromHsv({ ...hsv, h: x * 360 });
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    setInputValue(raw);

    const next = normalizeHex(raw);
    if (next) setDraft(next);
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <InkButton
          title="自定义主题色"
          aria-label="自定义主题色"
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border-2 border-black bg-white transition hover:bg-(--yellow) focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--blue)"
          style={{ color: value }}
          type="button"
          unstyled
        >
          <Pipette size={17} />
        </InkButton>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          className="z-100 w-64 rounded-xl border border-black/10 bg-white p-2 shadow-[0_12px_32px_rgb(0_0_0/18%)]"
          collisionPadding={8}
          sideOffset={10}
        >
          <div
            aria-label="选择颜色深浅"
            className="relative h-48 cursor-crosshair overflow-hidden rounded-t-xl"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              updateSaturationValue(event);
            }}
            onPointerMove={(event) => {
              if (event.buttons !== 1) return;
              updateSaturationValue(event);
            }}
            style={{
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))`,
            }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute h-8 w-8 rounded-full border-3 border-white shadow-[0_1px_4px_rgb(0_0_0/45%)]"
              style={{
                left: `${hsv.s * 100}%`,
                top: `${(1 - hsv.v) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>

          <div
            aria-label="选择颜色"
            className="relative h-7 cursor-pointer rounded-b-xl"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              updateHue(event);
            }}
            onPointerMove={(event) => {
              if (event.buttons !== 1) return;
              updateHue(event);
            }}
            style={{
              background:
                "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
            }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 h-7 w-7 rounded-full border-3 border-white shadow-[0_1px_5px_rgb(0_0_0/45%)]"
              style={{
                background: `hsl(${hsv.h} 100% 50%)`,
                left: `${(hsv.h / 360) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>

          <label className="mt-4 flex items-center gap-3 px-2 pb-2">
            <span className="text-lg font-bold text-black/45">#</span>
            <input
              aria-label="主题色十六进制值"
              className="h-12 min-w-0 flex-1 rounded-2xl border border-black/10 bg-white px-5 text-lg outline-none transition focus:border-black"
              maxLength={6}
              onBlur={() => {
                const next = normalizeHex(inputValue);
                if (next) syncDraft(next);
              }}
              onChange={handleInputChange}
              value={inputValue}
            />
          </label>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

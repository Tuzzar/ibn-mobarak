import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, RotateCcw, X, Crop as CropIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/external";
import { DEFAULT_LOGO_URL } from "@/lib/brand";

type Rect = { x: number; y: number; w: number; h: number };
type Mode = "move" | "nw" | "ne" | "sw" | "se";

const HARD_MAX_BYTES = 5 * 1024 * 1024;
const MAX_OUTPUT_PX = 640;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

async function cropToFile(
  img: HTMLImageElement,
  rect: Rect,
  transparent: boolean,
): Promise<File> {
  const sx = Math.round(rect.x * img.naturalWidth);
  const sy = Math.round(rect.y * img.naturalHeight);
  const sw = Math.max(1, Math.round(rect.w * img.naturalWidth));
  const sh = Math.max(1, Math.round(rect.h * img.naturalHeight));
  const scale = Math.min(1, MAX_OUTPUT_PX / Math.max(sw, sh));
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  if (!transparent) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, dw, dh);
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

  const type = transparent ? "image/png" : "image/webp";
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), type, 0.92),
  );
  if (!blob) throw new Error("Could not process image");
  return new File([blob], `logo.${transparent ? "png" : "webp"}`, { type });
}

export function LogoUploader({
  value,
  onChange,
  onScaleChange,
}: {
  value: string;
  scale: string;
  onChange: (url: string) => void;
  onScaleChange: (scale: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [transparent, setTransparent] = useState(true);
  const [rect, setRect] = useState<Rect>({ x: 0, y: 0, w: 1, h: 1 });
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ mode: Mode; startX: number; startY: number; rect: Rect } | null>(null);

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  const pick = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > HARD_MAX_BYTES) {
      toast.error("Image too large (max 5MB)");
      return;
    }
    setRect({ x: 0, y: 0, w: 1, h: 1 });
    setTransparent(file.type === "image/png" || file.type === "image/webp");
    setSrc(URL.createObjectURL(file));
    if (fileRef.current) fileRef.current.value = "";
  };

  const onPointerDown = (mode: Mode) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { mode, startX: e.clientX, startY: e.clientY, rect };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const box = boxRef.current;
    if (!d || !box) return;
    const b = box.getBoundingClientRect();
    const dx = (e.clientX - d.startX) / b.width;
    const dy = (e.clientY - d.startY) / b.height;
    const r = { ...d.rect };
    const MIN = 0.06;
    if (d.mode === "move") {
      r.x = clamp(d.rect.x + dx, 0, 1 - d.rect.w);
      r.y = clamp(d.rect.y + dy, 0, 1 - d.rect.h);
    } else {
      const left = d.mode === "nw" || d.mode === "sw";
      const top = d.mode === "nw" || d.mode === "ne";
      if (left) {
        const nx = clamp(d.rect.x + dx, 0, d.rect.x + d.rect.w - MIN);
        r.w = d.rect.x + d.rect.w - nx;
        r.x = nx;
      } else {
        r.w = clamp(d.rect.w + dx, MIN, 1 - d.rect.x);
      }
      if (top) {
        const ny = clamp(d.rect.y + dy, 0, d.rect.y + d.rect.h - MIN);
        r.h = d.rect.y + d.rect.h - ny;
        r.y = ny;
      } else {
        r.h = clamp(d.rect.h + dy, MIN, 1 - d.rect.y);
      }
    }
    setRect(r);
  };

  const endDrag = () => {
    drag.current = null;
  };

  const applyCrop = async () => {
    const img = imgRef.current;
    if (!img) return;
    setBusy(true);
    try {
      const file = await cropToFile(img, rect, transparent);
      if (file) {
        const preview = await createImageBitmap(file);
        const ratio = preview.width / Math.max(1, preview.height);
        preview.close();
        if (ratio < 1.6) {
          toast.error("Please crop a horizontal logo so the full wordmark fits in the header");
          return;
        }
      }
      const ext = transparent ? "png" : "webp";
      const path = `site-content/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) {
        toast.error(error.message);
        return;
      }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      onChange(data.publicUrl);
      onScaleChange("1");
      setSrc(null);

      // Persist immediately so the logo goes live even if "Save" is never pressed.
      const { error: saveError } = await supabase
        .from("site_content")
        .upsert({ key: "brand_logo_url", value: data.publicUrl }, { onConflict: "key" });
      if (saveError) {
        toast.error(`Uploaded, but not saved: ${saveError.message}. Press Save.`);
        return;
      }
      toast.success("Logo uploaded and published");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Logo</div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-16 w-full max-w-sm grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-lg border border-border bg-background px-4">
            <img
              src={value || DEFAULT_LOGO_URL}
              alt="Logo preview"
              className="block h-12 w-auto max-w-[12.5rem] object-contain object-left"
            />
            <div className="flex shrink-0 items-center gap-2" aria-hidden>
              <span className="size-10 rounded-full border border-border bg-muted" />
              <span className="size-10 rounded-full border border-border bg-muted" />
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-full text-sm hover:bg-muted"
          >
            <Upload className="w-4 h-4" />
            {value ? "Replace logo" : "Upload logo"}
          </button>
          {value && (
            <button
              type="button"
              onClick={async () => {
                onChange("");
                await supabase
                  .from("site_content")
                  .upsert({ key: "brand_logo_url", value: "" }, { onConflict: "key" });
                toast.success("Reverted to default logo");
              }}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4" /> Use default
            </button>
          )}
        </div>
      </div>

      {src && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-primary/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-card border border-border p-5 md:p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl">Crop your logo</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag from any corner to select the exact logo area. This removes empty padding
                  so the logo isn't shrunk in the header.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSrc(null)}
                aria-label="Close"
                className="p-1.5 rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              ref={boxRef}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className="relative mx-auto w-fit max-w-full select-none overflow-hidden rounded-xl bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#f7f7f7_0%_50%)] bg-[length:20px_20px]"
              style={{ touchAction: "none" }}
            >
              <img
                ref={imgRef}
                src={src}
                alt="Logo to crop"
                className="block max-h-[46vh] max-w-full pointer-events-none"
                draggable={false}
              />
              <div className="absolute inset-0 bg-black/35 pointer-events-none" />
              <div
                onPointerDown={onPointerDown("move")}
                className="absolute border-2 border-dashed border-white cursor-move"
                style={{
                  left: `${rect.x * 100}%`,
                  top: `${rect.y * 100}%`,
                  width: `${rect.w * 100}%`,
                  height: `${rect.h * 100}%`,
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0)",
                  backdropFilter: "brightness(1.6)",
                }}
              >
                {(["nw", "ne", "sw", "se"] as const).map((m) => (
                  <span
                    key={m}
                    onPointerDown={onPointerDown(m)}
                    className="absolute w-4 h-4 bg-background border border-foreground/60"
                    style={{
                      left: m.includes("w") ? -8 : undefined,
                      right: m.includes("e") ? -8 : undefined,
                      top: m.startsWith("n") ? -8 : undefined,
                      bottom: m.startsWith("s") ? -8 : undefined,
                      cursor: m === "nw" || m === "se" ? "nwse-resize" : "nesw-resize",
                    }}
                  />
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              Keep transparent background (recommended for PNG logos)
            </label>

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setSrc(null)}
                className="px-4 py-2 rounded-full text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyCrop}
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
              >
                <CropIcon className="w-4 h-4" />
                {busy ? "Uploading…" : "Apply crop & upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

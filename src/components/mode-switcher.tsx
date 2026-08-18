"use client";

export type AppMode = "lumen" | "sports";

type ModeSwitcherProps = {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
};

export default function ModeSwitcher({ mode, onChange }: ModeSwitcherProps) {
  return (
    <div role="group" aria-label="Application mode">
      <button type="button" aria-pressed={mode === "lumen"} onClick={() => onChange("lumen")}>
        Lumen
      </button>
      <button type="button" aria-pressed={mode === "sports"} onClick={() => onChange("sports")}>
        Lumen Sports
      </button>
      <small>Zero-ad popup shield active.</small>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import LumenBrowse from "@/components/lumen-browse";
import SportsLab from "@/components/sports-lab";
import ModeSwitcher, { type AppMode } from "@/components/mode-switcher";

const STORAGE_KEY = "lumen.active-mode";

export default function DualModeShell() {
  const [mode, setMode] = useState<AppMode>("lumen");

  useEffect(() => {
    try {
      const storedMode = window.localStorage.getItem(STORAGE_KEY);
      if (storedMode === "lumen" || storedMode === "sports") {
        setMode(storedMode);
      }
    } catch {
      // Local storage is optional in the app shell.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore storage failures in constrained environments.
    }
  }, [mode]);

  const modeSwitcher = <ModeSwitcher mode={mode} onChange={setMode} />;

  return mode === "lumen" ? <LumenBrowse modeSwitcher={modeSwitcher} /> : <SportsLab modeSwitcher={modeSwitcher} />;
}

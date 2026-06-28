"use client";

import { useEffect } from "react";
import { DirectorySyncMessage } from "@/components/directory-sync-message";
import { useDirectorySyncStore } from "@/stores/directory-sync-store";

export function AppRuntime() {
  const initialize = useDirectorySyncStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <DirectorySyncMessage />;
}

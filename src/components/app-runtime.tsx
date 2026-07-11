"use client";

import { useEffect } from "react";
import { DirectorySyncMessage } from "@/components/directory-sync-message";
import { useDirectorySyncStore } from "@/stores/directory-sync-store";

/** 在应用启动时初始化跨页面运行时能力，如本地目录同步状态。 */
export function AppRuntime() {
  const initialize = useDirectorySyncStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <DirectorySyncMessage />;
}

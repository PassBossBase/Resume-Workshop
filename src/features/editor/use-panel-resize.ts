"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_LEFT_WIDTH = 320;
const DEFAULT_MIDDLE_WIDTH = 500;
/** 拖拽松手时宽度低于此值自动折叠 */
const COLLAPSE_THRESHOLD_LEFT = 150;
const COLLAPSE_THRESHOLD_MIDDLE = 200;
const STORAGE_KEY = "resume-workshop:editor-panel-config";

interface PanelConfig {
  leftWidth: number;
  leftCollapsed: boolean;
  middleWidth: number;
  middleCollapsed: boolean;
}

interface DragState {
  handle: "left" | "middle";
  startX: number;
  startLeft: number;
  startMiddle: number;
  /** 左侧拖拽时左右面板总宽度（用于约束分配） */
  total: number;
}

function loadConfig(): PanelConfig {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        leftWidth: parsed.leftWidth ?? DEFAULT_LEFT_WIDTH,
        leftCollapsed: parsed.leftCollapsed ?? false,
        middleWidth: parsed.middleWidth ?? DEFAULT_MIDDLE_WIDTH,
        middleCollapsed: parsed.middleCollapsed ?? false,
      };
    }
  } catch {
    /* localStorage 不可用或数据损坏时降级为默认值 */
  }
  return {
    leftWidth: DEFAULT_LEFT_WIDTH,
    leftCollapsed: false,
    middleWidth: DEFAULT_MIDDLE_WIDTH,
    middleCollapsed: false,
  };
}

function saveConfig(config: PanelConfig) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* 写入失败时静默降级 */
  }
}

/**
 * 管理编辑器左右两个可调整面板的宽度、折叠状态和拖拽逻辑。
 * 宽度偏好持久化到 localStorage。
 */
export function usePanelResize() {
  const [config, setConfig] = useState<PanelConfig>(loadConfig);
  const [isDragging, setIsDragging] = useState(false);

  // 在 ref 中镜像 config，让文档级鼠标事件能读取最新值而不触发依赖刷新
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  });
  const dragRef = useRef<DragState | null>(null);

  // 配置变更时持久化
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const onLeftDragStart = useCallback((clientX: number) => {
    const { leftWidth, leftCollapsed, middleWidth, middleCollapsed } =
      configRef.current;
    const startLeft = leftCollapsed ? 0 : leftWidth;
    const startMiddle = middleCollapsed ? 0 : middleWidth;

    dragRef.current = {
      handle: "left",
      startX: clientX,
      startLeft,
      startMiddle,
      total: startLeft + startMiddle,
    };
    setIsDragging(true);

    const onMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const delta = e.clientX - drag.startX;
      const rawLeft = Math.max(0, drag.startLeft + delta);
      const newLeft = Math.min(rawLeft, drag.total);
      const newMiddle = drag.total - newLeft;

      setConfig((prev) => ({
        ...prev,
        leftWidth: newLeft,
        middleWidth: newMiddle,
        leftCollapsed: false,
        middleCollapsed: false,
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      setConfig((prev) => {
        const next = { ...prev };
        if (next.leftWidth < COLLAPSE_THRESHOLD_LEFT) {
          next.leftCollapsed = true;
          next.leftWidth = 0;
        }
        if (next.middleWidth < COLLAPSE_THRESHOLD_MIDDLE) {
          next.middleCollapsed = true;
          next.middleWidth = 0;
        }
        return next;
      });

      dragRef.current = null;
      setIsDragging(false);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const onMiddleDragStart = useCallback((clientX: number) => {
    const { middleWidth, middleCollapsed } = configRef.current;
    const startMiddle = middleCollapsed ? 0 : middleWidth;

    dragRef.current = {
      handle: "middle",
      startX: clientX,
      startLeft: 0,
      startMiddle,
      total: 0,
    };
    setIsDragging(true);

    const onMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const newMiddle = Math.max(0, drag.startMiddle + (e.clientX - drag.startX));

      setConfig((prev) => ({
        ...prev,
        middleWidth: newMiddle,
        middleCollapsed: false,
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      setConfig((prev) => {
        const next = { ...prev };
        if (next.middleWidth < COLLAPSE_THRESHOLD_MIDDLE) {
          next.middleCollapsed = true;
          next.middleWidth = 0;
        }
        return next;
      });

      dragRef.current = null;
      setIsDragging(false);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const expandLeft = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      leftCollapsed: false,
      leftWidth: DEFAULT_LEFT_WIDTH,
    }));
  }, []);

  const expandMiddle = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      middleCollapsed: false,
      middleWidth: DEFAULT_MIDDLE_WIDTH,
    }));
  }, []);

  const resetLeft = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      leftCollapsed: false,
      leftWidth: DEFAULT_LEFT_WIDTH,
    }));
  }, []);

  const resetMiddle = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      middleCollapsed: false,
      middleWidth: DEFAULT_MIDDLE_WIDTH,
    }));
  }, []);

  return {
    leftWidth: config.leftWidth,
    leftCollapsed: config.leftCollapsed,
    middleWidth: config.middleWidth,
    middleCollapsed: config.middleCollapsed,
    isDragging,
    onLeftDragStart,
    onMiddleDragStart,
    expandLeft,
    expandMiddle,
    resetLeft,
    resetMiddle,
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { loadSetting, saveSetting } from "@/features/storage/resume-repository";

export type DirectoryPermission = "granted" | "prompt" | "denied" | "unset";

export interface UseDirectoryAuthResult {
  /** 已存储的目录句柄，未绑定或移动端时为 undefined */
  handle: FileSystemDirectoryHandle | undefined;
  /** 当前权限状态 */
  permission: DirectoryPermission;
  /**
   * 触发重新授权。
   * 优先通过 showDirectoryPicker({ id }) 让 Chrome 静默恢复，
   * 失败时回退到 handle.requestPermission()。
   * 返回 true 表示授权成功。
   */
  reauthorize: () => Promise<boolean>;
  /** 当前是否为移动端（<1024px） */
  isMobile: boolean;
}

/**
 * 目录授权 Hook —— 加载已绑定的目录句柄、检测权限状态，
 * 并提供一键恢复授权的能力。
 *
 * 桌面端加载 IndexedDB 中存储的 FileSystemDirectoryHandle，
 * 通过 queryPermission 判断当前权限。移动端始终返回 unset。
 */
export function useDirectoryAuth(): UseDirectoryAuthResult {
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | undefined>();
  const [permission, setPermission] = useState<DirectoryPermission>("unset");
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (typeof window === "undefined") return;
      const mobile =
        window.matchMedia?.("(max-width: 1023px)").matches ?? true;
      setIsMobile(mobile);
      if (mobile) return;

      const stored =
        await loadSetting<FileSystemDirectoryHandle>("directory-handle");
      if (!stored || cancelled) return;

      setHandle(stored);
      try {
        const perm = await stored.queryPermission({ mode: "readwrite" });
        if (!cancelled) setPermission(perm);
      } catch {
        if (!cancelled) setPermission("denied");
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const reauthorize = useCallback(async (): Promise<boolean> => {
    try {
      // 优先使用 showDirectoryPicker({ id }) —— Chrome 会利用 id
      // 自动返回之前关联的目录，不弹出文件选择器，同时恢复权限
      let directory: FileSystemDirectoryHandle;
      try {
        directory = await window.showDirectoryPicker({
          id: "resume-workshop",
          mode: "readwrite",
        });
      } catch (pickerError) {
        // 用户取消或 showDirectoryPicker 不可用，回退到 requestPermission
        if (pickerError instanceof DOMException && pickerError.name === "AbortError") {
          if (handle) {
            const perm = await handle.requestPermission({ mode: "readwrite" });
            if (perm === "granted") {
              setPermission("granted");
              return true;
            }
          }
          return false;
        }
        throw pickerError;
      }

      // showDirectoryPicker 成功 —— 保存新句柄（或相同句柄的新引用）
      await saveSetting("directory-handle", directory);
      setHandle(directory);
      setPermission("granted");
      return true;
    } catch {
      return false;
    }
  }, [handle]);

  return { handle, permission, reauthorize, isMobile };
}

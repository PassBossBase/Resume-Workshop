import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createDefaultResume,
  type ResumeDocument,
  type ResumeEntry,
} from "@/features/resume-model/resume-model";
import { builtinTemplateFactories } from "@/features/resume-model/template-presets";
import { useResumeStore } from "@/stores/resume-store";
import { ResumePreview } from "./resume-preview";

function withLongWorkSection(resume: ResumeDocument): ResumeDocument {
  const workModule = resume.modules.find((module) => module.type === "work");
  if (!workModule || workModule.type !== "work") {
    throw new Error("missing work module");
  }

  const template = workModule.items[0];
  workModule.items = Array.from({ length: 14 }, (_, index) => ({
    ...template,
    id: `work-${index}`,
    title: `公司 ${index + 1}`,
    description: "负责业务流程梳理\n推动跨团队协作\n完成数据分析复盘",
  } as ResumeEntry));

  return resume;
}

function renderPreviewForExport(resume: ResumeDocument) {
  useResumeStore.getState().load(resume);

  const registeredPages: Array<HTMLDivElement | null> = [];
  render(
    <ResumePreview
      registerPage={(index, node) => {
        registeredPages[index] = node;
        registeredPages.length = 1;
      }}
    />,
  );

  return registeredPages;
}

describe("ResumePreview", () => {
  it("registers the continuous preview page for PDF export without page markers", async () => {
    const registeredPages = renderPreviewForExport(
      withLongWorkSection(createDefaultResume("preview-export-continuous")),
    );

    expect(screen.getByTestId("continuous-preview")).toBeInTheDocument();

    await waitFor(() => {
      expect(registeredPages.filter(Boolean)).toHaveLength(1);
    });
    expect(registeredPages[0]).toHaveClass("resume-page");
    expect(registeredPages[0]?.querySelector("[data-pdf-exclude='true']")).toBeNull();
  });

  it.each(Object.entries(builtinTemplateFactories))(
    "registers a continuous export node for template %s",
    async (_templateId, createResume) => {
      const registeredPages = renderPreviewForExport(withLongWorkSection(createResume()));

      await waitFor(() => {
        expect(registeredPages.filter(Boolean)).toHaveLength(1);
      });
      expect(registeredPages[0]).toHaveClass("resume-page");
      expect(registeredPages[0]?.textContent).toContain("公司 1");
      expect(registeredPages[0]?.querySelector("[data-pdf-exclude='true']")).toBeNull();
    },
  );
});

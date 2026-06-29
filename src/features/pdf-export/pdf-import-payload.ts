import type { jsPDF } from "jspdf";
import {
  DEFAULT_OPTIONAL_BASIC_FIELD_ORDER,
  resumeDocumentSchema,
  type BasicsData,
  type FixedResumeModule,
  type ResumeDocument,
  type ResumeModule,
} from "@/features/resume-model/resume-model";

const PAYLOAD_START = "RESUME_WORKSHOP_IMPORT_V1_START";
const PAYLOAD_END = "RESUME_WORKSHOP_IMPORT_V1_END";
const PAYLOAD_CHUNK_SIZE = 900;

export type ResumePdfImportPayloadV1 = {
  source: "resume-workshop";
  version: 1;
  exportedAt: string;
  resume: ResumeDocument;
};

export function buildPdfImportPayload(
  resume: ResumeDocument,
): ResumePdfImportPayloadV1 {
  return {
    source: "resume-workshop",
    version: 1,
    exportedAt: new Date().toISOString(),
    resume: pruneResumeForPdfImport(resume),
  };
}

export function embedPdfImportPayload(
  pdf: jsPDF,
  payload: ResumePdfImportPayloadV1,
): void {
  const chunks = chunkString(encodePayload(payload), PAYLOAD_CHUNK_SIZE);
  pdf.setPage(1);
  pdf.setFont("courier", "normal");
  pdf.setFontSize(1);
  pdf.text([PAYLOAD_START, ...chunks, PAYLOAD_END], 1, 1, {
    lineHeightFactor: 0.8,
    renderingMode: "invisible",
  });
}

export function extractEmbeddedResumeFromPdfText(
  text: string,
): ResumeDocument | null {
  const compactText = text.replace(/\s+/g, "");
  const start = compactText.indexOf(PAYLOAD_START);
  const end = compactText.indexOf(PAYLOAD_END);
  if (start < 0 || end < 0 || end <= start) return null;

  const encoded = compactText.slice(start + PAYLOAD_START.length, end);
  try {
    const raw = JSON.parse(decodePayload(encoded)) as ResumePdfImportPayloadV1;
    if (raw.source !== "resume-workshop" || raw.version !== 1) return null;
    return resumeDocumentSchema.parse(raw.resume);
  } catch {
    return null;
  }
}

function pruneResumeForPdfImport(resume: ResumeDocument): ResumeDocument {
  const modules = resume.modules.flatMap((module): ResumeModule[] => {
    if (module.type === "custom") {
      if (!module.visible) return [];
      const items = module.items
        .filter((item) => item.visible)
        .map((item) => ({ ...item, visible: true }));
      if (items.length === 0) return [];
      return [
        {
          ...module,
          visible: true,
          items,
        },
      ];
    }

    if (module.type === "basics") {
      return [
        {
          ...module,
          visible: true,
          basics: module.basics
            ? pruneVisibleBasics(module.basics)
            : module.basics,
          items: [],
        },
      ];
    }

    return [pruneFixedModule(module)];
  });

  return resumeDocumentSchema.parse({
    ...resume,
    modules,
  });
}

function pruneFixedModule(module: FixedResumeModule): FixedResumeModule {
  if (!module.visible) {
    return {
      ...module,
      visible: false,
      items: [],
    };
  }

  return {
    ...module,
    visible: module.items.some((item) => item.visible !== false),
    items: module.items
      .filter((item) => item.visible !== false)
      .map((item) => ({ ...item, visible: true })),
  };
}

function pruneVisibleBasics(basics: BasicsData): BasicsData {
  const hiddenFields = new Set(basics.hiddenFields);
  const removedFields = new Set(basics.removedFields);
  const isVisible = (field: keyof Pick<
    BasicsData,
    "status" | "birthday" | "email" | "phone" | "location"
  >) => !hiddenFields.has(field) && !removedFields.has(field);

  return {
    ...basics,
    status: isVisible("status") ? basics.status : "",
    birthday: isVisible("birthday") ? basics.birthday : "",
    email: isVisible("email") ? basics.email : "",
    phone: isVisible("phone") ? basics.phone : "",
    location: isVisible("location") ? basics.location : "",
    infoItems: basics.infoItems
      .filter((item) => item.visible !== false && item.label.trim() && item.value.trim())
      .map((item) => ({ ...item, visible: true })),
    hiddenFields: [],
    removedFields: [],
    fieldOrder: basics.fieldOrder.length
      ? basics.fieldOrder
      : DEFAULT_OPTIONAL_BASIC_FIELD_ORDER,
  };
}

function encodePayload(payload: ResumePdfImportPayloadV1): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodePayload(encoded: string): string {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function chunkString(value: string, size: number): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += size) {
    chunks.push(value.slice(index, index + size));
  }
  return chunks;
}

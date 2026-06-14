import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    firstLineIndent: {
      setFirstLineIndent: () => ReturnType;
      unsetFirstLineIndent: () => ReturnType;
    };
  }
}

export const FirstLineIndent = Extension.create({
  name: "firstLineIndent",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph"],
        attributes: {
          textIndent: {
            default: null,
            parseHTML: (element) => element.style.textIndent || null,
            renderHTML: (attributes) =>
              attributes.textIndent
                ? { style: `text-indent: ${attributes.textIndent}` }
                : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFirstLineIndent:
        () =>
        ({ commands }) =>
          commands.updateAttributes("paragraph", { textIndent: "2em" }),
      unsetFirstLineIndent:
        () =>
        ({ commands }) =>
          commands.resetAttributes("paragraph", "textIndent"),
    };
  },
});

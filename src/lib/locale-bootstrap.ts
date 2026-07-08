export const localeStorageKey = "resume-workshop:locale";
export const localeChangeEvent = "resume-workshop:locale-change";

export const localeBootstrapScript = `
(function () {
  try {
    var value = window.localStorage && window.localStorage.getItem("${localeStorageKey}");
    if (value === "zh-CN" || value === "en-US") {
      document.documentElement.lang = value;
      document.documentElement.dataset.initialLocale = value;
      if (value !== "zh-CN") {
        document.documentElement.dataset.localePending = "true";
        document.documentElement.style.visibility = "hidden";
      }
    }
  } catch (_) {}
})();
`;

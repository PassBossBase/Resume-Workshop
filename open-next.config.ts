import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const cloudflareConfig = defineCloudflareConfig();

const openNextConfig = {
  ...cloudflareConfig,
  buildCommand: "next build --webpack",
};

export default openNextConfig;

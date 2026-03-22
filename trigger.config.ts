import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "proj_tyopuycqksbzbhvitgqh",
  runtime: "node",
  logLevel: "log",
  // The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
  // You can override this on an individual task.
  // See https://trigger.dev/docs/runs/max-duration
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["trigger"],
  build: {
    // Packages that use native Node.js APIs (fetch, crypto, tls) don't
    // bundle cleanly with esbuild. Mark them external so they're resolved
    // from node_modules at runtime instead of inlined at build time.
    external: ["@supabase/supabase-js", "@supabase/ssr", "resend"],
  },
});

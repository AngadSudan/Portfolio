import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://bdac7dca9e09a82f68ff51aeb0a312b0@o4511825123999744.ingest.us.sentry.io/4511825125769216",
  tracesSampleRate: 1,
  enableLogs: true,

  dataCollection: {},
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

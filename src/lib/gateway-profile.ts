export type CapabilityState = "ready" | "configured" | "edge-required" | "external-required" | "not-configured";

export type GatewayCapability = {
  title: string;
  state: CapabilityState;
  summary: string;
  owner: "Next.js app" | "Reverse proxy / CDN" | "External tunnel sidecar";
};

export type GatewayProfile = {
  generatedAt: string;
  routes: {
    app: string;
    scramjetPrefix: string;
    scramjetAssets: string;
    fallback: string;
  };
  publicClient: {
    wispEndpoint: string | null;
  };
  capabilities: GatewayCapability[];
  deploymentNotes: string[];
  database: {
    required: boolean;
  };
};

const SCRAMJET_PREFIX = "/scramjet/";
const SCRAMJET_ASSETS = "/scramjet/scramjet.all.js";
const FALLBACK_ROUTE = "/fallback";

function sanitizeEndpoint(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return null;
  }
}

export function getGatewayProfile(): GatewayProfile {
  const publicOrigin = sanitizeEndpoint(process.env.NEXT_PUBLIC_SITE_URL) ?? "";
  const publicWispEndpoint = sanitizeEndpoint(process.env.NEXT_PUBLIC_WISP_ENDPOINT);
  const serverWispConfigured = Boolean(sanitizeEndpoint(process.env.WISP_ENDPOINT));
  const echConfigured = process.env.ECH_ENABLED === "true" || Boolean(process.env.ECH_CONFIG_ID);
  const h3Configured = process.env.HTTP3_ENABLED === "true" || process.env.EDGE_HTTP_VERSION === "h3";
  const h2Configured = h3Configured || process.env.EDGE_HTTP_VERSION === "h2";
  const tlsProfileConfigured = Boolean(process.env.TLS_PROFILE || process.env.UTLS_PROFILE);
  const realityConfigured = Boolean(process.env.REALITY_PUBLIC_NAME || process.env.REALITY_ENDPOINT);

  return {
    generatedAt: new Date().toISOString(),
    routes: {
      app: publicOrigin || "/",
      scramjetPrefix: SCRAMJET_PREFIX,
      scramjetAssets: SCRAMJET_ASSETS,
      fallback: FALLBACK_ROUTE,
    },
    publicClient: {
      wispEndpoint: publicWispEndpoint,
    },
    capabilities: [
      {
        title: "Mercury Workshop Scramjet assets",
        state: "ready",
        summary: "The installed Scramjet distribution is served from a same-origin Next.js route for browser service-worker registration.",
        owner: "Next.js app",
      },
      {
        title: "Fallback website",
        state: "ready",
        summary: "A neutral fallback site is available at /fallback for edge routing, health checks, or unsupported protocol paths.",
        owner: "Next.js app",
      },
      {
        title: "Tunnel over WebSockets",
        state: publicWispEndpoint || serverWispConfigured ? "configured" : "not-configured",
        summary: publicWispEndpoint
          ? "A public Wisp-compatible WebSocket endpoint is configured for browser-side transport wiring."
          : serverWispConfigured
            ? "A server-side Wisp endpoint exists, but expose it as NEXT_PUBLIC_WISP_ENDPOINT if the browser must connect directly."
            : "Configure a Wisp-compatible WebSocket endpoint outside Next.js, then expose it as NEXT_PUBLIC_WISP_ENDPOINT for Scramjet transport clients.",
        owner: "External tunnel sidecar",
      },
      {
        title: "HTTP/2 or HTTP/3 multiplexing",
        state: h3Configured || h2Configured ? "configured" : "edge-required",
        summary: h3Configured
          ? "HTTP/3 is marked as enabled at the edge."
          : h2Configured
            ? "HTTP/2 is marked as enabled at the edge."
            : "Next.js route handlers do not negotiate H2/H3 directly; enable this on the CDN, load balancer, or reverse proxy in front of the app.",
        owner: "Reverse proxy / CDN",
      },
      {
        title: "Encrypted ClientHello (ECH)",
        state: echConfigured ? "configured" : "edge-required",
        summary: echConfigured
          ? "ECH is marked as configured in the deployment environment."
          : "ECH requires provider support plus HTTPS/SVCB DNS records and cannot be switched on from application code alone.",
        owner: "Reverse proxy / CDN",
      },
      {
        title: "TLS fingerprint camouflage",
        state: tlsProfileConfigured ? "configured" : "edge-required",
        summary: tlsProfileConfigured
          ? "A TLS/uTLS profile name is recorded for the edge layer."
          : "TLS ClientHello behavior is controlled by the terminating proxy or tunnel client, not by React or Next.js pages.",
        owner: "Reverse proxy / CDN",
      },
      {
        title: "Reality protocol",
        state: realityConfigured ? "configured" : "external-required",
        summary: realityConfigured
          ? "A Reality sidecar endpoint is recorded; keep private keys out of the browser bundle."
          : "Reality is an external Xray/VLESS-style sidecar protocol and should be deployed separately from the Next.js app.",
        owner: "External tunnel sidecar",
      },
    ],
    deploymentNotes: [
      "Keep private keys, tunnel credentials, and Reality settings on server-side infrastructure only.",
      "Terminate TLS, ECH, HTTP/2, and HTTP/3 at an edge proxy/CDN that you operate or are authorized to administer.",
      "Point unsupported protocol paths or generic health checks at /fallback to provide a normal website response.",
      "Use this console only on networks and systems where you have permission to run a proxy gateway.",
    ],
    database: {
      required: true,
    },
  };
}

export { FALLBACK_ROUTE, SCRAMJET_ASSETS, SCRAMJET_PREFIX };

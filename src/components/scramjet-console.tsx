"use client";

import { useCallback, useMemo, useRef, useState } from "react";

type BootState = "idle" | "loading" | "ready" | "error";

type ScramjetControllerOptions = {
  prefix: string;
  files: {
    all: string;
    sync: string;
    wasm: string;
  };
  flags?: Record<string, boolean>;
};

type ScramjetFrame = {
  frame: HTMLIFrameElement;
  go: (url: string) => void;
};

type ScramjetController = {
  init: () => Promise<void>;
  createFrame: () => ScramjetFrame;
};

type ScramjetControllerConstructor = new (options: ScramjetControllerOptions) => ScramjetController;

type ScramjetLoader = () => {
  ScramjetController: ScramjetControllerConstructor;
};

declare global {
  interface Window {
    $scramjetLoadController?: ScramjetLoader;
  }
}

const prefix = "/scramjet/";
const files = {
  all: "/scramjet/scramjet.all.js",
  sync: "/scramjet/scramjet.sync.js",
  wasm: "/scramjet/scramjet.wasm.wasm",
};

function normalizeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Enter a URL first.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);

  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported by this browser console.");
  }

  return parsed.toString();
}

function loadScramjetScript() {
  if (window.$scramjetLoadController) {
    return Promise.resolve();
  }

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${files.all}"]`);

  if (existing?.dataset.loaded === "true") {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const script = existing ?? document.createElement("script");

    script.src = files.all;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Scramjet browser bundle."));

    if (!existing) {
      document.head.appendChild(script);
    }
  });
}

export function ScramjetConsole({ wispEndpoint }: { wispEndpoint: string | null }) {
  const [bootState, setBootState] = useState<BootState>("idle");
  const [message, setMessage] = useState("Ready to initialize the Scramjet browser runtime.");
  const [targetUrl, setTargetUrl] = useState("https://example.com");
  const frameHostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<ScramjetFrame | null>(null);
  const controllerRef = useRef<ScramjetController | null>(null);

  const statusLabel = useMemo(() => {
    if (bootState === "ready") {
      return "Runtime ready";
    }

    if (bootState === "loading") {
      return "Initializing";
    }

    if (bootState === "error") {
      return "Needs attention";
    }

    return "Not started";
  }, [bootState]);

  const initialize = useCallback(async () => {
    if (controllerRef.current && frameRef.current) {
      return frameRef.current;
    }

    if (!("serviceWorker" in navigator)) {
      throw new Error("This browser does not support service workers.");
    }

    setBootState("loading");
    setMessage("Loading Scramjet assets and registering the service worker…");

    await loadScramjetScript();

    const loader = window.$scramjetLoadController;

    if (!loader) {
      throw new Error("Scramjet controller global was not created by the bundle.");
    }

    await navigator.serviceWorker.register(files.all, {
      scope: prefix,
    });
    await navigator.serviceWorker.ready;

    const { ScramjetController } = loader();
    const controller = new ScramjetController({
      prefix,
      files,
      flags: {
        captureErrors: true,
        strictRewrites: false,
        sourcemaps: false,
      },
    });

    await controller.init();

    const frame = controller.createFrame();
    frame.frame.title = "Scramjet isolated browsing frame";
    frame.frame.className = "h-[520px] w-full rounded-3xl border border-cyan-300/20 bg-slate-950 shadow-2xl";
    frame.frame.setAttribute(
      "sandbox",
      "allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts",
    );

    frameHostRef.current?.replaceChildren(frame.frame);
    controllerRef.current = controller;
    frameRef.current = frame;
    setBootState("ready");
    setMessage("Scramjet service worker is active. Enter an authorized test URL to load it in the isolated frame.");

    return frame;
  }, []);

  const handleInitialize = useCallback(async () => {
    try {
      await initialize();
    } catch (error) {
      setBootState("error");
      setMessage(error instanceof Error ? error.message : "Unable to initialize Scramjet.");
    }
  }, [initialize]);

  const handleNavigate = useCallback(async () => {
    try {
      const frame = await initialize();
      const nextUrl = normalizeUrl(targetUrl);
      frame.go(nextUrl);
      setMessage(`Frame navigation requested for ${nextUrl}`);
    } catch (error) {
      setBootState("error");
      setMessage(error instanceof Error ? error.message : "Unable to navigate the Scramjet frame.");
    }
  }, [initialize, targetUrl]);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-2xl shadow-cyan-950/30 backdrop-blur">
      <div className="border-b border-white/10 bg-slate-950/70 p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Mercury Scramjet console</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Service-worker proxy test bed</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              This initializes the official Mercury Workshop Scramjet browser bundle from this app’s same-origin route. Use it only for systems and networks you are authorized to test.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
            <span className="block text-xs uppercase tracking-[0.18em] text-cyan-300">Status</span>
            <span className="font-semibold">{statusLabel}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 rounded-3xl border border-white/10 bg-slate-900/80 p-3 md:grid-cols-[1fr_auto_auto]">
          <label className="sr-only" htmlFor="scramjet-target">
            Target URL
          </label>
          <input
            id="scramjet-target"
            className="min-h-12 rounded-2xl border border-white/10 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-300/10"
            value={targetUrl}
            onChange={(event) => setTargetUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleNavigate();
              }
            }}
            placeholder="https://example.com"
          />
          <button
            className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={bootState === "loading"}
            onClick={() => void handleInitialize()}
            type="button"
          >
            Initialize
          </button>
          <button
            className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={bootState === "loading"}
            onClick={() => void handleNavigate()}
            type="button"
          >
            Open in frame
          </button>
        </div>

        <div className="mt-4 grid gap-3 text-xs leading-5 text-slate-400 md:grid-cols-2">
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span className="font-semibold text-slate-200">WebSocket tunnel:</span>{" "}
            {wispEndpoint ? `Configured as ${wispEndpoint}` : "Set NEXT_PUBLIC_WISP_ENDPOINT to connect a Wisp-compatible tunnel transport."}
          </p>
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span className="font-semibold text-slate-200">Edge protocols:</span> TLS fingerprinting, ECH, H2/H3, and Reality are deployed at the edge or sidecar layer, not inside this React component.
          </p>
        </div>

        <p className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-50">{message}</p>
      </div>

      <div className="bg-slate-950/80 p-4 md:p-6">
        <div ref={frameHostRef} className="grid min-h-[520px] place-items-center rounded-3xl border border-dashed border-white/15 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_55%)] p-8 text-center">
          <div className="max-w-lg">
            <p className="text-5xl">🛡️</p>
            <h3 className="mt-4 text-xl font-semibold text-white">No frame loaded yet</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Initialize the service worker, then open a permitted HTTP or HTTPS target. Some production transport features require a separately deployed Wisp/edge gateway.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

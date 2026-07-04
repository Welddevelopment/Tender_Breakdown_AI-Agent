"use client";

import { useEffect, useRef } from "react";
import { GOOGLE_CLIENT_ID } from "@/lib/api";

// The official "Sign in with Google" button, via Google Identity Services. It renders
// itself into a div once the GIS script has loaded and hands the resulting ID token back
// to the caller (which posts it to /auth/google). Rendered only when Google sign-in is
// configured, so it's inert in the mock/showcase build.
//
// Setup note: the deployment's origin must be listed as an Authorized JavaScript origin
// on the OAuth client in Google Cloud Console, or Google refuses to render the button.

interface GoogleCredentialResponse {
  credential?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>
          ) => void;
        };
      };
    };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";

function loadGsi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return;
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Google script failed to load"))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google script failed to load"));
    document.head.appendChild(script);
  });
}

export function GoogleSignInButton({
  onCredential,
  onError,
}: {
  onCredential: (idToken: string) => void;
  onError?: (message: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // The login page passes stable callbacks (useCallback + a setState dispatcher), so
  // this effect initialises Google Identity Services exactly once.
  useEffect(() => {
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) onCredential(response.credential);
            else onError?.("Google sign-in was cancelled.");
          },
        });
        window.google.accounts.id.renderButton(ref.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          width: 320,
        });
      })
      .catch(() => onError?.("Couldn't load Google sign-in."));
    return () => {
      cancelled = true;
    };
  }, [onCredential, onError]);

  return <div ref={ref} className="flex min-h-[44px] justify-center" />;
}

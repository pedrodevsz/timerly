"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { beginGoogleAuthentication } from "@/components/auth/begin-google-authentication";
import { Button } from "@/components/ui/button";
import type { GoogleAuthSource } from "@/lib/auth/session-config";

type GoogleAuthButtonProps = {
  source: GoogleAuthSource;
  onError: (message: string) => void;
  disabled?: boolean;
};

const oauthErrorMessages: Record<string, string> = {
  cancelled: "A entrada com Google foi cancelada.",
  unavailable: "A entrada com Google ainda não está disponível.",
  invalid_state: "A tentativa de entrada expirou. Tente novamente.",
  invalid_response: "O Google retornou uma resposta inválida. Tente novamente.",
  failed: "Não foi possível entrar com Google. Tente novamente.",
};

export function GoogleAuthButton({
  source,
  onError,
  disabled = false,
}: GoogleAuthButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const error = currentUrl.searchParams.get("oauth_error");
    if (!error) return;

    onError(
      oauthErrorMessages[error] ??
        "Não foi possível concluir a entrada com Google.",
    );
    currentUrl.searchParams.delete("oauth_error");
    window.history.replaceState(null, "", currentUrl);
  }, [onError]);

  function handleGoogleAuth() {
    if (disabled || isRedirecting) return;
    setIsRedirecting(true);
    try {
      beginGoogleAuthentication(source);
    } catch {
      setIsRedirecting(false);
      onError("Não foi possível iniciar a entrada com Google.");
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="h-11 w-full"
      disabled={disabled || isRedirecting}
      onClick={handleGoogleAuth}
    >
      {isRedirecting ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <GoogleIcon />
      )}
      {isRedirecting ? "Redirecionando…" : "Continuar com Google"}
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.93A6 6 0 0 1 6.07 12c0-.67.11-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.64.4 3.19 1.04 4.55l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.94c1.47 0 2.79.5 3.82 1.5l2.88-2.88A9.66 9.66 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"
      />
    </svg>
  );
}

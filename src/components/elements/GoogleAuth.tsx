"use client";

import { useEffect, useRef, useState } from "react";
import axios from 'axios';
import { useRouter } from "next/navigation";
import { toast } from "sonner";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: object) => void;
          renderButton: (parent: HTMLElement, options: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleLoginButtonProps {
  onSuccess?: (response: {
    userObject(userObject: never): unknown; access: string; refresh: string 
}) => void;
  onError?: (error: unknown) => void;
  variant?: "default" | "custom";
  buttonText?: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  theme?: "light" | "dark";
  showIcon?: boolean;
  redirectAfterLogin?: string;
}

const GoogleLoginButton = ({
  onSuccess,
  onError,
  variant = "default",
  buttonText = "Continue with Google",
  className = "",
  style = {},
  loading = false,
  disabled = false,
  size = "medium",
  theme = "light",
  showIcon = true,
  redirectAfterLogin = "/",
}: GoogleLoginButtonProps) => {
  const defaultButtonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const router = useRouter();

  const handleGoogleResponse = async (response: { credential: string }) => {
    setIsLoading(true);
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/google/login/`,
        { token: response.credential },
        { headers: { 'Content-Type': 'application/json' } }
      );

      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;

      if (onSuccess) onSuccess(data);
      if (redirectAfterLogin) router.push(redirectAfterLogin);
      toast.success("Logged in successfully!");
    } catch (error) {
      console.error("Google login error", error);
      toast.error("Login failed. Please try again.");
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeGoogle = () => {
    if (!window.google) {
      console.warn("Google object not available yet");
      return;
    }

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: handleGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    if (variant === "default" && defaultButtonRef.current) {
      window.google.accounts.id.renderButton(defaultButtonRef.current, {
        theme: theme === "dark" ? "filled_black" : "outline",
        size: size === "large" ? "large" : size === "small" ? "small" : "medium",
        width: "100%",
        text: "continue_with",
        shape: "rectangular",
      });
    }

    setIsGoogleReady(true);
  };

  const handleCustomButtonClick = () => {
    if (disabled || loading || isLoading || !isGoogleReady) return;
    if (window.google) window.google.accounts.id.prompt();
  };

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      console.error("Google Client ID is not configured");
      return;
    }

    let isMounted = true;
    const scriptSrc = "https://accounts.google.com/gsi/client";
    const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);

    const checkGoogleAndInitialize = () => {
      if (isMounted) {
        if (window.google) {
          initializeGoogle();
        } else {
          setTimeout(checkGoogleAndInitialize, 100);
        }
      }
    };

    if (existingScript) {
      checkGoogleAndInitialize();
    } else {
      const script = document.createElement("script");
      script.src = scriptSrc;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (isMounted) checkGoogleAndInitialize();
      };
      script.onerror = () => {
        console.error("Failed to load Google Sign-In script");
        if (onError) onError(new Error("Failed to load Google Sign-In script"));
      };
      document.head.appendChild(script);
    }

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onError]);

  // Size classes
  const sizeClasses = {
    small: "px-3 py-2 text-sm",
    medium: "px-4 py-2.5 text-base",
    large: "px-6 py-3 text-lg",
  };

  // Theme classes
  const themeClasses = {
    light: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    dark: "bg-gray-900 text-white border border-gray-600 hover:bg-gray-800",
  };

  // Google icon SVG
  const GoogleIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      className="mr-2"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  // Loading spinner
  const LoadingSpinner = () => (
    <svg
      className="animate-spin -ml-1 mr-2 h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  if (variant === "custom") {
    return (
      <button
        onClick={handleCustomButtonClick}
        disabled={disabled || loading || isLoading || !isGoogleReady}
        className={`
          flex items-center justify-center rounded-lg font-medium transition-colors duration-200
          ${sizeClasses[size]}
          ${themeClasses[theme]}
          ${disabled || loading || isLoading || !isGoogleReady
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer"
          }
          ${className}
        `}
        style={style}
      >
        {(loading || isLoading) ? (
          <LoadingSpinner />
        ) : (
          showIcon && <GoogleIcon />
        )}
        {buttonText}
      </button>
    );
  }

  // Default Google button
  return (
    <div className={`w-full flex justify-center ${className}`} style={style}>
      <div
        ref={defaultButtonRef}
        style={{ minHeight: "44px", width: "100%" }}
      />
    </div>
  );
};

export default GoogleLoginButton;
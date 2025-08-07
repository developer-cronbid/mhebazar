/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import axios from "axios";
import { useState } from "react";
import GoogleLoginButton from "@/components/elements/GoogleAuth";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { setUser } = useUser();
  const router = useRouter();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const API_KEY = process.env.X_API_KEY;

  const setTokens = (accessToken: string, refreshToken: string, userData: any) => {
    // Determine expiry based on remember me
    const tokenExpiry = rememberMe ? 7 : undefined; // 7 days or session (undefined = session)

    const cookieOptions = {
      expires: tokenExpiry,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax" as const,
      path: "/",
    };

    // Set tokens
    Cookies.set("access_token", accessToken, cookieOptions);
    Cookies.set("refresh_token", refreshToken, cookieOptions);

    // Set remember me preference
    Cookies.set("remember_me", rememberMe.toString(), cookieOptions);

    // Set user role
    if (userData?.role?.id) {
      Cookies.set("user_role", userData.role.id.toString(), cookieOptions);
    }

    console.log(`Tokens set with ${rememberMe ? '7-day' : 'session'} expiry`);
  };

  const fetchUserData = async (accessToken: string) => {
    try {
      const userResponse = await axios.get(`${API_BASE_URL}/users/me/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-API-KEY": API_KEY,
        },
      });
      return userResponse.data;
    } catch (err) {
      console.error("User fetch error:", err);
      throw new Error("Failed to fetch user profile");
    }
  };

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/token/`,
        { email, password },
        {
          headers: {
            "X-API-KEY": API_KEY,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      // const { access: accessToken, refresh: refreshToken } = response.data;
      const accessToken = response?.data?.access;
      const refreshToken = response?.data?.refresh;

      if (!accessToken || !refreshToken) {
        throw new Error("Invalid response: missing tokens");
      }

      // Fetch user data
      const userData = await fetchUserData(accessToken);

      // Set user in context
      setUser(userData);

      // Set tokens with appropriate expiry
      setTokens(accessToken, refreshToken, userData);

      toast.success("Login successful!");

      // Redirect based on user role
      const roleId = userData?.role?.id;
      if (roleId === 1) {
        router.push("/admin");
      } else if (roleId === 2) {
        router.push("/vendor/dashboard");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      console.error("Login error:", err);

      if (axios.isAxiosError(err)) {
        const data = err.response?.data;

        const getFriendlyError = (message: string) => {
          if (message.includes("No active account found")) {
            return "Invalid email or password. Please try again.";
          }
          if (message.toLowerCase().includes("email") && message.toLowerCase().includes("required")) {
            return "Please enter your email.";
          }
          if (message.toLowerCase().includes("password") && message.toLowerCase().includes("required")) {
            return "Please enter your password.";
          }
          return message || "Login failed. Please try again.";
        };

        const rawMessage = typeof data === "string"
          ? data
          : data?.detail || data?.message || "Login failed";

        const friendlyMessage = getFriendlyError(rawMessage);
        setError(friendlyMessage);
        toast.error(friendlyMessage);
      } else {
        const errorMessage = "Something went wrong during login. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (data: any) => {
    try {
      setIsLoading(true);
      const accessToken = data.access;

      if (!accessToken) {
        throw new Error("No access token received from Google login");
      }

      // Fetch user data
      const userData = await fetchUserData(accessToken);
      setUser(userData);

      // For Google login, we'll treat it as "remember me" by default
      // You can modify this behavior as needed
      const refreshToken = data.refresh || ""; // Adjust based on your Google login response

      // Set tokens (Google login defaults to remembered session)
      const cookieOptions = {
        expires: 7, // 7 days for Google login
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax" as const,
        path: "/",
      };

      Cookies.set("access_token", accessToken, cookieOptions);
      if (refreshToken) {
        Cookies.set("refresh_token", refreshToken, cookieOptions);
      }
      Cookies.set("remember_me", "true", cookieOptions);

      if (userData?.role?.id) {
        Cookies.set("user_role", userData.role.id.toString(), cookieOptions);
      }

      toast.success("Google login successful!");

      // Redirect based on role
      const roleId = userData?.role?.id;
      if (roleId === 1) {
        router.push("/admin");
      } else if (roleId === 2) {
        router.push("/vendor/dashboard");
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Google login error:", err);
      toast.error("Google login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = (error: any) => {
    console.error("Google login error:", error);
    toast.error("Google login failed. Please try again.");
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-lg mx-auto">
        <h1 className="text-center text-3xl sm:text-4xl font-bold text-green-600 mb-8">
          Welcome to MHE Bazar!
        </h1>
        <form className="flex flex-col gap-5" onSubmit={handleLogin}>
          <div>
            <label className="block font-medium mb-1">Email</label>
            <input
              type="email"
              required
              placeholder="Enter your email Id!"
              className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="************"
              className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-gray-500 text-base">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              Remember me for 7 days
            </label>
            <Link
              href="/forgot-password"
              className="text-gray-500 text-base hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#5CA131] hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded py-3 text-lg transition-colors"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="mx-4 text-gray-400 font-semibold">OR</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>
        <GoogleLoginButton
          variant="custom"
          buttonText="Continue with Google Account"
          className="bg-white w-full"
          size="large"
          showIcon={true}
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          disabled={isLoading}
        />
        <div className="mt-8 text-center text-base">
          Do not have an account{" "}
          <Link href="/register" className="text-green-600 hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

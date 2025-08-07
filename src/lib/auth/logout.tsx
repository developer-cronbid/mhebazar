import { toast } from "sonner";
import Cookies from "js-cookie";
import axios from "axios";

/**
 * Enhanced logout: properly removes all tokens and redirects
 * @param clearUser - function to clear user context (setUser(null))
 * @param router - Next.js router instance (useRouter)
 */
export const handleLogout = async (
  clearUser?: () => void,
  router?: { push: (path: string) => void }
): Promise<void> => {
  try {
    // Remove all auth-related cookies
    const cookieOptions = { path: "/" };
    Cookies.remove("access_token", cookieOptions);
    Cookies.remove("refresh_token", cookieOptions);
    Cookies.remove("user_role", cookieOptions);
    Cookies.remove("remember_me", cookieOptions);

    // Remove from localStorage as fallback
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_role");
    }

    // Clear user context
    if (clearUser) clearUser();

    // Clear axios default headers
    delete axios.defaults.headers.common['Authorization'];

    toast.success("You have been logged out successfully.");

    // Redirect after a short delay
    setTimeout(() => {
      if (router) {
        router.push("/login");
      } else {
        window.location.href = "/login";
      }
    }, 700);
  } catch (error) {
    console.error("Logout error:", error);
    toast.error("Logout failed. Please try again.");
  }
};
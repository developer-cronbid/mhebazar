"use client";
import Link from "next/link";
import { useState } from "react";

const ResetPasswordPage = () => {
  const [error, setError] = useState("");
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const otp = (form.elements.namedItem("otp") as HTMLInputElement).value;
    const pass = (form.elements.namedItem("password") as HTMLInputElement).value;
    const repass = (form.elements.namedItem("repassword") as HTMLInputElement).value;
    if (pass !== repass) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    // handle reset password here
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-2">
      <div className="w-full max-w-md mx-auto">
        <h1 className="text-center text-2xl sm:text-3xl font-bold text-green-700 mt-8 mb-2">
          Reset password?
        </h1>
        <p className="text-center text-gray-700 mb-8">
          Please enter your password reset OTP and set a new password
        </p>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div>
            <label className="block font-medium mb-1">
              OTP <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="otp"
              required
              placeholder="Enter OTP"
              className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 text-base"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">New Password</label>
            <input
              type="password"
              name="password"
              required
              placeholder="************"
              className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 text-base"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Re-Type New Password</label>
            <input
              type="password"
              name="repassword"
              required
              placeholder="************"
              className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 text-base"
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            className="w-full bg-[#5CA131] hover:bg-green-700 text-white font-semibold rounded py-3 text-lg transition-colors"
          >
            Reset Password
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-green-700 hover:underline text-base">
            Back
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
"use client";
import Link from "next/link";

const ForgotPasswordPage = () => (
  <div className="h-fit flex flex-col items-center justify-center bg-white px-2 my-12">
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-center text-2xl sm:text-3xl font-bold text-green-700 mt-8 mb-2">
        Forgot your password?
      </h1>
      <p className="text-center text-gray-700 mb-8">
        An OTP will be sent to your registered email to help reset password
      </p>
      <form
        className="flex flex-col gap-5"
        onSubmit={e => {
          e.preventDefault();
          // handle send OTP here
        }}
      >
        <div>
          <label className="block font-medium mb-1">Email <span className="text-red-500">*</span></label>
          <input
            type="email"
            required
            placeholder="Enter email"
            className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 text-base"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-[#5CA131] hover:bg-green-700 text-white font-semibold rounded py-3 text-lg transition-colors"
        >
          Send OTP
        </button>
      </form>
      <div className="mt-4 text-center mb-8">
        <Link href="/login" className="text-green-700 hover:underline text-base">
          Back to Sign In
        </Link>
      </div>
    </div>
  </div>
);

export default ForgotPasswordPage;
"use client";
import { useState } from "react";
import axios from "axios";
// import GoogleLoginButton from "@/components/elements/GoogleAuth";
import Link from "next/link";
import { RegisterForm } from "@/types/index";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_X_API_KEY;

const RegisterPage = () => {
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpFailed, setOtpFailed] = useState(false);

  const sendOtp = async () => {
    if (!form.email) {
      toast.error("Please enter email");
      return;
    }

    setSendingOtp(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/sendotp/`, { email: form.email }, { headers: { "Content-Type": "application/json" } });
      if (res.data.success) {
        toast.success(res.data.message);
        setOtpSent(true);
        setShowOtp(true);
        setOtpFailed(false);
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API_BASE_URL}/register/`,
        {
          username: form.name,
          email: form.email,
          password: form.password,
          password2: form.confirmPassword,
          role_id: 3,
        },
        {
          headers: {
            "Content-Type": "application/json",
            // "X-API-KEY": API_KEY,
          },
        }
      );

      toast.success("Registration successful! Redirecting...");
      window.location.href = "/login";
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;

        if (data && typeof data === "object") {
          const formatMessage = (key: string, msg: string) => {
            if (key === "username" && msg.includes("Enter a valid username")) {
              return "Invalid username: Only letters, numbers and @ . + - _ are allowed.";
            }
            if (key === "email" && msg.includes("Enter a valid email address")) {
              return "Invalid email address. Please enter a valid email like example@domain.com.";
            }
            if (key === "password" && msg.toLowerCase().includes("too short")) {
              return "Password too short. Please use at least 8 characters.";
            }
            if (key === "password2" && msg.toLowerCase().includes("do not match")) {
              return "Password confirmation does not match.";
            }

            // Default fallback
            return `${capitalize(key)}: ${msg}`;
          };

          const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

          Object.entries(data).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach((msg) => toast.error(formatMessage(key, msg)));
            } else {
              toast.error(formatMessage(key, String(value)));
            }
          });
        } else {
          toast.error("Registration failed. Please try again.");
        }
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Enter valid 6-digit OTP");
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}/verifyotp/`,
        { email: form.email, otp },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data.success) {
        toast.success("OTP verified");
        setOtpVerified(true);
        setShowOtp(false);
        setOtpFailed(false);
      } else {
        toast.error(res.data.message || "Invalid OTP");
        setOtpFailed(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "OTP verification failed");
      setOtpFailed(true);
    }
  };


  // function setOtpFailed(arg0: boolean) {
  //   throw new Error("Function not implemented.");
  // }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white px-2 m-5">
      <div className="w-full max-w-lg mx-auto">
        <h1 className="text-center text-3xl sm:text-4xl font-bold text-green-600 mb-8">
          Welcome to MHE Bazar!
        </h1>
        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="block font-medium mb-1">
              Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Enter name"
              value={form.name}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 text-base"
            />
          </div>
          <div>


            {/* EMAIL SECTION */}
            {(!showOtp || otpVerified) && (

              <div>
                <label className="block font-medium mb-1">
                  Email <span className="text-red-500">*</span>
                </label>

                <div className="flex gap-2">
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="Enter email"
                    value={form.email}
                    disabled={otpVerified}
                    onChange={handleChange}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded px-4 py-3"
                  />

                  {!otpVerified && (
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={sendingOtp}
                      className="px-4 py-3 bg-green-600 text-white rounded"
                    >
                      {sendingOtp ? "Sending..." : "Verify"}
                    </button>
                  )}
                </div>
              </div>
            )}


            {showOtp && !otpVerified && (
              <div className="flex flex-col items-start">
                <label className="block font-medium mb-2">
                  Enter OTP <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {[...Array(6)].map((_, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      value={otp[index] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        const newOtp = otp.split("");
                        newOtp[index] = val;
                        setOtp(newOtp.join(""));
                        if (val) {
                          const next = document.getElementById(`otp-${index + 1}`);
                          if (next) (next as HTMLInputElement).focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace") {
                          e.preventDefault();
                          const newOtp = otp.split("");
                          if (newOtp[index]) {
                            newOtp[index] = "";
                            setOtp(newOtp.join(""));
                          } else {
                            const prev = document.getElementById(`otp-${index - 1}`);
                            if (prev) (prev as HTMLInputElement).focus();
                          }
                        }
                      }}
                      onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                        e.preventDefault();
                        const paste = e.clipboardData.getData("Text").replace(/\D/g, "");
                        const newOtp = otp.split("");
                        for (let i = 0; i < 6 && i < paste.length; i++) {
                          newOtp[i] = paste[i];
                        }
                        setOtp(newOtp.join(""));
                        const nextIndex = paste.length < 6 ? paste.length : 5;
                        const nextInput = document.getElementById(`otp-${nextIndex}`);
                        if (nextInput) (nextInput as HTMLInputElement).focus();
                      }}
                      id={`otp-${index}`}
                      className="w-12 h-12 text-center border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  ))}
                  {/* Verify button */}
                  <div className="relative mt-1 ml-8 -top-1.5">
                    <button
                      type="button"
                      onClick={verifyOtp}
                      className="px-6 py-3 bg-green-600 text-white rounded font-medium"
                    >
                      Verify OTP
                    </button>

                  </div>
                </div>

                {/* Resend / Change Email */}
                {setOtpFailed && (
                  <div className="flex gap-4 mt-3 text-green-600 text-sm font-medium">
                    <button
                      type="button"
                      onClick={sendOtp}

                      className="hover:underline"
                    >
                      Resend OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOtp(false);
                        setOtp("");
                        setOtpVerified(false);
                        setOtpFailed(false);
                        setForm({ ...form, email: "" });
                      }}
                      className="hover:underline"
                    >
                      Change Email
                    </button>
                  </div>
                )}
              </div>
            )}




          </div>

          <div>
            <label className="block font-medium mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder={otpVerified ? "************" : "Verify OTP first"}
              value={form.password}
              onChange={handleChange}
              disabled={!otpVerified} // 👈 disabled until OTP is verified
              className={`w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 outline-none focus:ring-2 ${otpVerified ? "focus:ring-green-500" : "focus:ring-gray-300"
                } text-base ${!otpVerified ? "cursor-not-allowed opacity-60" : ""}`}
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              placeholder={otpVerified ? "************" : "Verify OTP first"}
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={!otpVerified} // 👈 disabled until OTP is verified
              className={`w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 outline-none focus:ring-2 ${otpVerified ? "focus:ring-green-500" : "focus:ring-gray-300"
                } text-base ${!otpVerified ? "cursor-not-allowed opacity-60" : ""}`}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-[#5CA131] hover:bg-green-700 text-white font-semibold rounded py-3 text-lg transition-colors"
          >
            {loading ? "Registering..." : "Sign Up"}
          </button>
          {/* <div className="flex items-center my-6">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="mx-4 text-gray-400 font-semibold">OR</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div> */}
        </form>
        {/* <GoogleLoginButton
                variant="custom"
                buttonText="Continue with Google Account"
                className="bg-white w-full "
                size="large"
                showIcon={true}
                onSuccess={(data) => {
                  console.log('Success:', data)
                  const accessToken = (data as { access: string }).access;
                  localStorage.setItem("access_token", accessToken);
                }}
                onError={(error) => console.log('Error:', error)}
              /> */}
        <div className="mt-4 text-center text-base">
          Already have an account?{" "}
          <Link href="/login" className="text-green-600 hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

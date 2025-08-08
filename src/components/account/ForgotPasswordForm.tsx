"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api from "@/lib/api";

// Schema for the first step
const RequestOtpFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

// Schema for the second step
const ResetPasswordFormSchema = z.object({
  otp: z.string().min(6, {
    message: "Your one-time password must be 6 characters.",
  }),
  newPassword: z.string().min(8, {
    message: "Password must be at least 8 characters long.",
  }),
});

export function ForgotPasswordForm() {
  const [step, setStep] = useState<"request_email" | "verify_and_reset">("request_email");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const router = useRouter();

  const requestOtpForm = useForm<z.infer<typeof RequestOtpFormSchema>>({
    resolver: zodResolver(RequestOtpFormSchema),
    defaultValues: { email: "" },
  });

  const resetPasswordForm = useForm<z.infer<typeof ResetPasswordFormSchema>>({
    resolver: zodResolver(ResetPasswordFormSchema),
    defaultValues: { otp: "", newPassword: "" },
  });

  // Step 1: Request the OTP
  const onSubmitRequestOtp = async (data: z.infer<typeof RequestOtpFormSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post("/forgot-password/", { email: data.email });
      // Don't store OTP from response anymore.
      setResetEmail(data.email); // Store email for the next step
      setStep("verify_and_reset"); // Move to the next step
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to send OTP.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and Reset Password in one go
  const onSubmitResetPassword = async (data: z.infer<typeof ResetPasswordFormSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post("/reset-password/", {
        email: resetEmail,          // Use the stored email
        otp: data.otp,              // Use OTP from the form
        new_password: data.newPassword, // Use new password from the form
      });
      alert("Password has been reset successfully!");
      router.push("/login");
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to reset password.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        {step === "request_email" ? (
          <div key="request_email_step">
            <CardHeader>
              <CardTitle className="text-2xl text-green-700">Forgot Password?</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you an OTP to reset it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...requestOtpForm}>
                <form onSubmit={requestOtpForm.handleSubmit(onSubmitRequestOtp)} className="space-y-6">
                  <FormField
                    control={requestOtpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send OTP"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </div>
        ) : (
          <div key="verify_otp_step">
            <CardHeader>
              <CardTitle className="text-2xl text-green-700">Check your email</CardTitle>
              <CardDescription>
                We've sent a 6-digit OTP to <strong>{resetEmail}</strong>. Please enter it below along with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...resetPasswordForm}>
                <form onSubmit={resetPasswordForm.handleSubmit(onSubmitResetPassword)} className="space-y-6">
                  <FormField
                    control={resetPasswordForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-center">
                        <FormLabel>One-Time Password</FormLabel>
                        <FormControl>
                          <InputOTP maxLength={6} {...field} autoComplete="one-time-code">
                            <InputOTPGroup>
                              {[...Array(6)].map((_, index) => (<InputOTPSlot key={index} index={index} />))}
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={resetPasswordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reset Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </div>
        )}
      </Card>
    </div>
  );
}
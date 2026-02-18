import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth-provider";
import { Zap } from "lucide-react";
import { insertUserSchema } from "@shared/schema";

const registerSchema = insertUserSchema
  .extend({
    name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(80, "Full name is too long"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address")
      .max(254, "Email is too long"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long")
      .refine((v) => !/\s/.test(v), "Password must not contain spaces")
      .refine(
        (v) => /[a-z]/.test(v),
        "Password must include a lowercase letter",
      )
      .refine(
        (v) => /[A-Z]/.test(v),
        "Password must include an uppercase letter",
      )
      .refine((v) => /\d/.test(v), "Password must include a number")
      .refine((v) => /[^A-Za-z0-9]/.test(v), "Password must include a symbol"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const { register: registerUser, isLoading } = useAuth();
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterForm) => {
    registerUser(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-600 text-white mb-4 shadow-lg shadow-emerald-600/20">
            <Zap className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Create an account
          </h1>
          <p className="text-slate-500 mt-2">
            Start optimizing your portfolio today
          </p>
        </div>

        <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Enter your details to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...form.register("name")}
                  className="rounded-lg"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...form.register("email")}
                  className="rounded-lg"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  className="rounded-lg"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...form.register("confirmPassword")}
                  className="rounded-lg"
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-slate-500">Already have an account? </span>
              <Link href="/login">
                <span className="font-medium text-emerald-600 hover:text-emerald-500 cursor-pointer">
                  Sign in
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

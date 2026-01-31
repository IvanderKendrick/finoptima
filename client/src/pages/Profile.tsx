import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth-provider";
import { useUpdatePassword } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

const passwordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordForm = z.infer<typeof passwordSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { mutate: updatePassword, isPending } = useUpdatePassword();

  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = (data: PasswordForm) => {
    updatePassword(data, {
      onSuccess: () => form.reset()
    });
  };

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Profile Settings</h2>
        <p className="text-slate-500">Manage your account information.</p>
      </div>

      <div className="grid gap-8 max-w-2xl">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <Avatar className="h-16 w-16 border-2 border-slate-100">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-bold">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{user?.name}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Ensure your account is secure with a strong password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Current Password</Label>
                <Input 
                  id="oldPassword" 
                  type="password" 
                  {...form.register("oldPassword")} 
                />
                {form.formState.errors.oldPassword && (
                  <p className="text-xs text-red-500">{form.formState.errors.oldPassword.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  {...form.register("newPassword")} 
                />
                {form.formState.errors.newPassword && (
                  <p className="text-xs text-red-500">{form.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  {...form.register("confirmPassword")} 
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-500">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700 mt-2" 
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

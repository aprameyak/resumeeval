"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  github_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { updateProfile, logout } = useAuth();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name ?? "",
      github_url: user?.github_url ?? "",
    },
  });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Update your name and GitHub URL</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((v) => updateProfile({ full_name: v.full_name, github_url: v.github_url || undefined }))}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled className="opacity-60" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="github_url">GitHub Profile URL</Label>
              <Input id="github_url" placeholder="https://github.com/yourusername" {...register("github_url")} />
              {errors.github_url && <p className="text-xs text-destructive">{errors.github_url.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-xs text-muted-foreground">Sign out of your account on this device</p>
            </div>
            <Button variant="outline" onClick={() => logout()}>Sign out</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

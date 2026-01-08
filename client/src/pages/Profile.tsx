import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Settings, Shield, CreditCard, Bell } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
  return (
    <Layout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Profile & Settings</h1>
          <p className="text-slate-500 mt-1">Manage your account preferences and subscription.</p>
        </div>

        <div className="grid gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Full Name</label>
                  <div className="p-3 bg-slate-50 rounded-lg border text-slate-900 font-medium">John Investor</div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Email Address</label>
                  <div className="p-3 bg-slate-50 rounded-lg border text-slate-900 font-medium">john.investor@example.com</div>
                </div>
              </div>
              <Button variant="outline" className="mt-2">Edit Profile</Button>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="w-4 h-4 text-slate-500" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">Two-Factor Authentication</div>
                  <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Enabled</div>
                </div>
                <Separator />
                <Button variant="link" className="px-0 h-auto text-primary">Change Password</Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="w-4 h-4 text-slate-500" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">Plan</div>
                  <div className="text-sm font-bold text-slate-900">Pro Investor</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">Next Billing</div>
                  <div className="text-sm text-slate-500">Oct 24, 2024</div>
                </div>
                <Separator />
                <Button variant="link" className="px-0 h-auto text-primary">Manage Subscription</Button>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="w-4 h-4 text-slate-500" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["Portfolio Rebalancing Alerts", "Market News Digest", "Weekly Performance Report"].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{item}</span>
                    <div className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${i === 0 ? 'bg-primary' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${i === 0 ? 'translate-x-4' : ''}`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

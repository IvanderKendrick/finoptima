import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 text-center max-w-md mx-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-lg font-medium text-slate-700 mb-2">Page not found</p>
        <p className="text-slate-500 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

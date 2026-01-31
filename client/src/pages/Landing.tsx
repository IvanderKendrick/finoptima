import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, ShieldCheck, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-emerald-600" />
            <span className="text-xl font-bold text-slate-900 tracking-tight">FinOptima</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-medium text-slate-600 hover:text-emerald-600">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-sm font-medium mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-600 mr-2 animate-pulse"></span>
            Advanced Portfolio Optimization
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-6">
            Build your perfect <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              financial future
            </span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Optimize your asset allocation with institutional-grade algorithms. 
            Analyze risk, maximize returns, and visualize your efficient frontier.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-lg shadow-lg shadow-emerald-600/20">
                Start Optimizing Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-12 px-8 rounded-full text-lg border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                desc: "Visualize your portfolio performance with beautiful interactive charts."
              },
              {
                icon: ShieldCheck,
                title: "Risk Management",
                desc: "Calculate value-at-risk and volatility to protect your capital."
              },
              {
                icon: Zap,
                title: "Instant Optimization",
                desc: "Run mean-variance optimization on your assets in seconds."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 text-emerald-600">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

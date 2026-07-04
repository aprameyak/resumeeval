import { Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden w-1/2 flex-col bg-gradient-to-br from-brand-600 to-brand-800 p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">ResumeScore</span>
        </div>
        <div className="mt-auto space-y-4">
          <h2 className="text-4xl font-bold leading-tight">
            Evaluate your resume<br />with AI precision
          </h2>
          <p className="text-lg text-white/80">
            Powered by the open-source interviewstreet hiring-agent engine.
            Get scored on Open Source, Projects, Production Experience, and Technical Skills.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: "Open Source", max: "35pts" },
              { label: "Self Projects", max: "30pts" },
              { label: "Production", max: "25pts" },
              { label: "Tech Skills", max: "10pts" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-white/10 p-3">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-white/70">{item.max}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

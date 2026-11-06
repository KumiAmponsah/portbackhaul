import type { ReactNode } from "react";

/** Split-screen auth layout: form on the left, freight identity panel on the right. */
export function AuthPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[52%] lg:px-20">
        <div className="mx-auto w-full max-w-md animate-rise">{children}</div>
      </div>

      <aside className="relative hidden flex-1 overflow-hidden bg-sidebar lg:block" aria-hidden>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0v40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="600" height="900" fill="url(#grid)" />
          <path
            d="M120 780 C 200 600, 180 460, 300 380 S 420 200, 470 110"
            fill="none"
            stroke="hsl(var(--sidebar-primary))"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-draw"
          />
          <circle cx="120" cy="780" r="9" fill="hsl(var(--sidebar-primary))" />
          <circle cx="470" cy="110" r="9" fill="hsl(var(--sidebar-primary))" />
          <circle cx="300" cy="380" r="16" fill="rgba(255,255,255,0.12)" className="animate-pulse-dot" />
        </svg>

        <div className="relative flex h-full flex-col justify-end p-14">
          <p className="max-w-sm text-[26px] font-extrabold leading-tight text-white">
            From the quayside at Tema to the last mile in Ouagadougou.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            One verified record of every shipment, truck, driver and delivery — shared by everyone who moves the
            cargo.
          </p>
        </div>
      </aside>
    </div>
  );
}

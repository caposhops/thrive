import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWord = true,
}: {
  className?: string;
  showWord?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 rounded-2xl bg-gradient-brand shadow-glow" />
        <div className="absolute inset-[3px] rounded-[14px] bg-bg" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="absolute inset-0 m-auto h-5 w-5"
          aria-hidden
        >
          <defs>
            <linearGradient id="lotus" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#a78bfa" />
              <stop offset="0.5" stopColor="#f472b6" />
              <stop offset="1" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
          <path
            d="M12 3c2.2 3 3 5.8 3 8.2 0 .9-.1 1.7-.3 2.4 1.8-.6 3.6-2 5.3-4.2-.3 4.1-2.5 7.3-5.3 8.8 1.4.6 3 .8 4.9.6-2 2.6-5 4-8.6 4-3.6 0-6.6-1.4-8.6-4 1.9.2 3.5 0 4.9-.6C4.5 16.7 2.3 13.5 2 9.4c1.7 2.2 3.5 3.6 5.3 4.2-.2-.7-.3-1.5-.3-2.4C7 8.8 7.8 6 10 3l1 1.5L12 3z"
            fill="url(#lotus)"
          />
        </svg>
      </div>
      {showWord && (
        <span className="font-display text-[19px] font-semibold tracking-tight text-fg">
          Thrive
        </span>
      )}
    </div>
  );
}

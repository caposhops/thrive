import { Aurora } from "@/components/brand/aurora";
import { AppNav } from "@/components/nav/app-nav";
import { MobileTopBar } from "@/components/nav/mobile-top-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Aurora />
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <AppNav />
        <main className="relative min-h-screen w-full flex-1 px-5 pb-36 pt-4 sm:px-8 sm:pb-12 sm:pt-10">
          <MobileTopBar />
          {children}
          {/* Gentle fade above the bottom nav so scrolled content doesn't bleed through */}
          <div
            className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-32 bg-gradient-to-t from-bg via-bg/80 to-transparent sm:hidden"
            aria-hidden
          />
        </main>
      </div>
    </>
  );
}

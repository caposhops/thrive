import { Aurora } from "@/components/brand/aurora";
import { AppNav } from "@/components/nav/app-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Aurora />
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <AppNav />
        <main className="min-h-screen w-full flex-1 px-5 pb-28 pt-6 sm:px-8 sm:pb-12 sm:pt-10">
          {children}
        </main>
      </div>
    </>
  );
}

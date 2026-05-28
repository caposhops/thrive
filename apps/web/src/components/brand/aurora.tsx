"use client";

export function Aurora() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-40 -left-40 h-[40rem] w-[40rem] rounded-full opacity-50 blur-3xl animate-drift"
        style={{ background: "radial-gradient(circle, #a78bfa 0%, transparent 60%)" }}
      />
      <div
        className="absolute top-1/3 -right-40 h-[34rem] w-[34rem] rounded-full opacity-40 blur-3xl animate-drift"
        style={{
          animationDelay: "5s",
          background: "radial-gradient(circle, #f472b6 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute -bottom-40 left-1/3 h-[30rem] w-[30rem] rounded-full opacity-30 blur-3xl animate-drift"
        style={{
          animationDelay: "10s",
          background: "radial-gradient(circle, #5eead4 0%, transparent 60%)",
        }}
      />
    </div>
  );
}

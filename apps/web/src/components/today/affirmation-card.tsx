import { Card, CardEyebrow } from "@/components/ui/card";
import { pickDailyAffirmation } from "@/lib/affirmations";

export function AffirmationCard() {
  const line = pickDailyAffirmation();
  return (
    <Card className="bg-gradient-glow">
      <CardEyebrow>Today&apos;s affirmation</CardEyebrow>
      <p className="mt-4 font-display text-2xl font-medium leading-tight tracking-tight text-fg">
        &ldquo;{line}&rdquo;
      </p>
    </Card>
  );
}

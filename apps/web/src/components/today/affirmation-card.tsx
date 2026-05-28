import { Card, CardEyebrow } from "@/components/ui/card";

const affirmations = [
  "I am allowed to take up space in my own life.",
  "My nervous system is safe in this moment.",
  "I do not have to earn rest. It is mine.",
  "Discipline is the highest form of self-love.",
  "Small, repeated. Small, repeated. That is the whole secret.",
  "The version of me I am becoming is already proud.",
  "I trust the slow build.",
];

export function AffirmationCard() {
  const idx = new Date().getDate() % affirmations.length;
  const line = affirmations[idx];
  return (
    <Card className="bg-gradient-glow">
      <CardEyebrow>Today&apos;s affirmation</CardEyebrow>
      <p className="mt-4 font-display text-2xl font-medium leading-tight tracking-tight text-fg">
        &ldquo;{line}&rdquo;
      </p>
    </Card>
  );
}

const NOTES = ["♪", "♫", "♩", "♬", "♭", "♮"] as const;

export type Particle = {
  id: number;
  note: string;
  x: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
};

export const generateParticles = (count: number): readonly Particle[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    note: NOTES[i % NOTES.length] ?? "♪",
    x: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 10 + Math.random() * 12,
    size: 14 + Math.random() * 18,
    opacity: 0.06 + Math.random() * 0.1,
  }));

"use client";

import type React from "react";
import { useState, useEffect } from "react";

const NOTES = ["♪", "♫", "♩", "♬", "♭", "♮"] as const;

type Particle = Readonly<{
  id: number;
  note: string;
  x: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}>;

const generateParticles = (count: number): ReadonlyArray<Particle> =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    note: NOTES[i % NOTES.length] ?? "♪",
    x: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 10 + Math.random() * 12,
    size: 14 + Math.random() * 18,
    opacity: 0.06 + Math.random() * 0.1,
  }));

// particles は Math.random を使うため SSR と CSR で値が異なる。
// マウント後に生成して hydration mismatch を回避する。
export const LoginParticles: React.FC = () => {
  const [particles, setParticles] = useState<ReadonlyArray<Particle>>([]);

  useEffect(() => {
    setParticles(generateParticles(14));
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-[float-up_linear_infinite] text-spotify-green"
          style={{
            left: `${p.x}%`,
            bottom: "-5%",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
          }}
        >
          {p.note}
        </span>
      ))}
    </div>
  );
};

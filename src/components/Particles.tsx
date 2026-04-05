import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  baseOpacity: number;
  phaseOffset: number;
}

const PART_COLORS = ["#00d4ff", "#7c3aed", "#f59e0b", "#79c0ff", "#ec4899"];

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const Particles: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => {
  const frame = useCurrentFrame();

  const particles = useMemo<Particle[]>(() => {
    const rand = seededRand(42);
    return Array.from({ length: 18 }, (_, i) => {
      const sz = rand() * 2.5 + 0.8;
      return {
        x: rand() * width,
        y: rand() * height,
        vx: (rand() - 0.5) * 0.22,
        vy: (rand() - 0.5) * 0.22,
        size: sz,
        color: PART_COLORS[i % PART_COLORS.length],
        baseOpacity: rand() * 0.25 + 0.08,
        phaseOffset: rand() * Math.PI * 2,
      };
    });
  }, [width, height]);

  const tMs = (frame / 30) * 1000;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {particles.map((p, i) => {
        // Simulate position at current frame (accumulate velocity)
        const elapsed = frame;
        let px = ((p.x + p.vx * elapsed) % width + width) % width;
        let py = ((p.y + p.vy * elapsed) % height + height) % height;

        const pulse = 0.5 + 0.5 * Math.sin(tMs * 0.0012 + px * 0.01 + p.phaseOffset);
        const fadeIn = Math.min(1, tMs / 500);
        const opacity = p.baseOpacity * pulse * fadeIn;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px,
              top: py,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: p.color,
              opacity,
              filter: "blur(0.5px)",
            }}
          />
        );
      })}
    </div>
  );
};

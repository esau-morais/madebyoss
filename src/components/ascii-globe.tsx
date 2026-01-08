"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "~/hooks/use-reduced-motion";

const CHARS = " .,:;=+*#%@";
const WIDTH = 48;
const HEIGHT = 24;

function renderSphere(A: number, B: number): string {
  const output: string[] = new Array(WIDTH * HEIGHT).fill(" ");
  const zbuffer: number[] = new Array(WIDTH * HEIGHT).fill(0);

  const cosA = Math.cos(A);
  const sinA = Math.sin(A);
  const cosB = Math.cos(B);
  const sinB = Math.sin(B);

  for (let theta = 0; theta < 6.28; theta += 0.05) {
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    for (let phi = 0; phi < 6.28; phi += 0.015) {
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);

      const x = sinTheta * cosPhi;
      const y = sinTheta * sinPhi;
      const z = cosTheta;

      const y1 = y * cosA - z * sinA;
      const z1 = y * sinA + z * cosA;
      const x2 = x * cosB - y1 * sinB;
      const y2 = x * sinB + y1 * cosB;

      const ooz = 1 / (z1 + 3);
      const xp = Math.floor(WIDTH / 2 + 40 * ooz * x2);
      const yp = Math.floor(HEIGHT / 2 + 20 * ooz * y2);

      if (xp >= 0 && xp < WIDTH && yp >= 0 && yp < HEIGHT) {
        const idx = xp + WIDTH * yp;

        if (ooz > zbuffer[idx]) {
          zbuffer[idx] = ooz;

          const ny = sinTheta * sinPhi;
          const nz = cosTheta;
          const ny1 = ny * cosA - nz * sinA;
          const nz1 = ny * sinA + nz * cosA;

          const L = 0.7 * ny1 - 0.7 * nz1;

          if (L > 0) {
            const charIdx = Math.floor(L * (CHARS.length - 1));
            output[idx] = CHARS[Math.min(charIdx, CHARS.length - 1)];
          } else if (L > -0.2) {
            output[idx] = CHARS[1];
          }
        }
      }
    }
  }

  let result = "";
  for (let row = 0; row < HEIGHT; row++) {
    for (let col = 0; col < WIDTH; col++) {
      result += output[row * WIDTH + col];
    }
    if (row < HEIGHT - 1) result += "\n";
  }
  return result;
}

export function AsciiGlobe() {
  const prefersReducedMotion = useReducedMotion();
  const [frame, setFrame] = useState(() => renderSphere(0.4, 0.8));
  const angleRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setFrame(renderSphere(0.4, 0.8));
      return;
    }

    const animate = () => {
      angleRef.current += 0.012;
      setFrame(renderSphere(angleRef.current, angleRef.current * 0.6));
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [prefersReducedMotion]);

  return (
    <div role="img" aria-label="Rotating ASCII globe" className="select-none">
      <pre
        className="font-mono text-[6px] leading-[1.1] text-accent/70 sm:text-[8px] md:text-[10px] md:text-accent"
        aria-hidden="true"
      >
        {frame}
      </pre>
    </div>
  );
}

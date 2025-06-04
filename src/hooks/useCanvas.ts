import { useRef, useEffect } from 'react';

export function useCanvas<T = unknown>(
  draw: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, data: T) => void,
  dependencies: ReadonlyArray<unknown>
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    draw(ctx, canvas, dependencies[0]);
  }, dependencies);

  return canvasRef;
}
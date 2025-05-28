import { useCanvas } from '../hooks/useCanvas';
import { renderArc, type ArcRenderData } from '../utils/arcRenderer';

interface ArcCanvasProps {
  progress: number;
  arcChutes: boolean;
}

export function ArcCanvas({ progress, arcChutes }: ArcCanvasProps) {
  const canvasRef = useCanvas<ArcRenderData>(
    renderArc,
    [{ progress, arcChutes, canvasWidth: 600, canvasHeight: 320 }]
  );

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={320}
      className="border border-gray-400 rounded-lg bg-blue-50 mt-2 shadow-lg"
    />
  );
}
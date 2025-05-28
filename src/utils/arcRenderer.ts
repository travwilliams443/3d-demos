export interface ArcRenderData {
  progress: number;
  arcChutes: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

export function renderArc(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, data: ArcRenderData) {
  const { progress: t, arcChutes, canvasWidth: w, canvasHeight: h } = data;

  // Clear canvas
  ctx.clearRect(0, 0, w, h);

  // Calculate positions
  const contactGapStart = 32;
  const contactGapEnd = 160;
  const y = h / 2;
  const leftX = w / 2 - (contactGapStart + (contactGapEnd - contactGapStart) * t) / 2;
  const rightX = w / 2 + (contactGapStart + (contactGapEnd - contactGapStart) * t) / 2;
  const contactLength = 60;

  // Draw contacts
  drawContacts(ctx, leftX, rightX, y, contactLength);

  // Draw arc
  const arcEndTime = arcChutes ? 0.5 : 0.95;
  if (t > 0.08 && t < arcEndTime) {
    drawElectricalArc(ctx, leftX, rightX, y, t, arcChutes);
  }

  // Draw arc chutes if enabled
  if (data.arcChutes) {
    drawArcChutes(ctx, 300, 50, 8, 8, 50, 10, "#c5a880");
  }
  // Draw labels
  //drawLabels(ctx, leftX, rightX, y, contactLength);
}

export function drawArcChutes(
  ctx: CanvasRenderingContext2D,
  baseX: number, // center X of chutes group
  baseY: number, // top Y of chutes
  count: number = 7,
  width: number = 6,
  height: number = 64,
  spacing: number = 14,
  color: string = "#c5a880"
) {
  ctx.save();
  ctx.fillStyle = color;
  const totalWidth = count * width + (count - 1) * spacing;
  const startX = baseX - totalWidth / 2;
  for (let i = 0; i < count; i++) {
    ctx.fillRect(
      startX + i * (width + spacing),
      baseY,
      width,
      height
    );
  }
  ctx.restore();
}

export function drawContacts(ctx: CanvasRenderingContext2D, leftX: number, rightX: number, y: number, contactLength: number) {
  ctx.lineWidth = 12;
  ctx.strokeStyle = "#666";
  ctx.lineCap = "round";

  // Left contact
  ctx.beginPath();
  ctx.moveTo(leftX, y - contactLength / 2);
  ctx.lineTo(leftX, y + contactLength / 2);
  ctx.stroke();

  // Right contact
  ctx.beginPath();
  ctx.moveTo(rightX, y - contactLength / 2);
  ctx.lineTo(rightX, y + contactLength / 2);
  ctx.stroke();
}

export function generateArcPath(leftX: number, rightX: number, y: number, t: number, magnetic: boolean) {
  const points = [];
  const segments = 12;
  const gapWidth = rightX - leftX;

  for (let i = 0; i <= segments; i++) {
    const progress = i / segments;
    let x = leftX + gapWidth * progress;
    let baseY = y;

    if (magnetic) {
      const blowoutIntensity = Math.min(t * 2.5, 2);
      const curveHeight = -80 - 120 * blowoutIntensity;
      baseY = y + curveHeight * Math.sin(progress * Math.PI) * 0.8;
      x += Math.sin(progress * Math.PI) * 40 * blowoutIntensity;
    } else {
      baseY = y - (20 + 40 * t) * Math.sin(progress * Math.PI);
    }

    // Add random zigzag motion
    const zigzag = (Math.random() - 0.5) * 20 * (1 - Math.abs(progress - 0.5) * 2);
    const flutter = Math.sin(Date.now() * 0.01 + i) * 8;

    points.push({
      x: x + zigzag,
      y: baseY + flutter
    });
  }
  return points;
}

export function drawElectricalArc(ctx: CanvasRenderingContext2D, leftX: number, rightX: number, y: number, t: number, magnetic: boolean) {
  ctx.save();

  const arcPoints = generateArcPath(leftX, rightX, y, t, magnetic);
  const arcIntensity = magnetic ? Math.max(0.3, 1 - t * 1.5) : 1;

  // Draw arc layers
  drawArcLayer(ctx, arcPoints, 16, `rgba(46, 231, 255, ${0.3 * arcIntensity})`, 30);
  drawArcLayer(ctx, arcPoints, 8, `rgba(77, 210, 255, ${0.8 * arcIntensity})`, 20);
  drawArcLayer(ctx, arcPoints, 3, `rgba(255, 255, 255, ${arcIntensity})`, 8);

  // Draw sparks
  drawSparks(ctx, leftX, y);
  drawSparks(ctx, rightX, y);

  ctx.restore();
}

export function drawArcLayer(ctx: CanvasRenderingContext2D, points: { x: number, y: number }[], lineWidth: number, color: string, blur: number) {
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.shadowColor = '#2ee7ff';
  ctx.shadowBlur = blur;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

export function drawSparks(ctx: CanvasRenderingContext2D, x: number, y: number) {
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const length = Math.random() * 15 + 5;
    const sparkX = x + Math.cos(angle) * length;
    const sparkY = y + Math.sin(angle) * length;

    ctx.strokeStyle = `rgba(255, ${200 + Math.random() * 55}, ${100 + Math.random() * 100}, ${0.6 + Math.random() * 0.4})`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(sparkX, sparkY);
    ctx.stroke();
  }
}

export function drawLabels(ctx: CanvasRenderingContext2D, leftX: number, rightX: number, y: number, contactLength: number) {
  ctx.save();
  ctx.font = "16px sans-serif";
  ctx.fillStyle = "#222";
  ctx.fillText("Left Contact", leftX - 70, y - contactLength / 2 - 10);
  ctx.fillText("Right Contact", rightX + 10, y - contactLength / 2 - 10);
  ctx.restore();
}
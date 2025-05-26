import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
    onClose: () => void;
}

export default function ArcSimulator({ onClose }: ModalProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Animation state
    const [running, setRunning] = useState(true);
    const [t, setT] = useState(0); // progress (0 to 1)
    const [magnetic, setMagnetic] = useState(false);

    // Animation loop
    useEffect(() => {
        if (!running) return;

        let frame: number;
        const animate = () => {
            setT((prev) => {
                let next = Math.min(prev + 0.008, 1);
            if (next >= 1) next = 0; // Loop back to start!
                return next;
            });
            frame = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(frame);
    }, [running]);

    // Draw contacts and arc
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Geometry
        const w = canvas.width;
        const h = canvas.height;
        const contactGapStart = 32;
        const contactGapEnd = 160;
        const y = h / 2;

        // Contacts: Left and Right
        const leftX = w / 2 - (contactGapStart + (contactGapEnd - contactGapStart) * t) / 2;
        const rightX = w / 2 + (contactGapStart + (contactGapEnd - contactGapStart) * t) / 2;
        const contactLength = 60;

        // Draw contacts
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

        // Draw arc if gap is open (magnetic blowout extinguishes faster)
        const arcEndTime = magnetic ? 0.7 : 0.95;
        if (t > 0.08 && t < arcEndTime) {
            ctx.save();
            
            // Generate jagged arc path points
            const generateArcPath = () => {
                const points = [];
                const segments = 12;
                const gapWidth = rightX - leftX;
                
                for (let i = 0; i <= segments; i++) {
                    const progress = i / segments;
                    let x = leftX + gapWidth * progress;
                    let baseY = y;
                    
                    if (magnetic) {
                        // Magnetic blowout curve - more dramatic bending stretches arc
                        const blowoutIntensity = Math.min(t * 2.5, 2); // Increases faster
                        const curveHeight = -80 - 120 * blowoutIntensity;
                        baseY = y + curveHeight * Math.sin(progress * Math.PI) * 0.8;
                        // Add horizontal stretching effect
                        x += Math.sin(progress * Math.PI) * 40 * blowoutIntensity;
                    } else {
                        // Natural slight curve - much less bending
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
            };
            
            const arcPoints = generateArcPath();
            
            // Draw multiple arc layers for realistic effect
            // Arc becomes dimmer and more stretched with magnetic blowout
            const arcIntensity = magnetic ? Math.max(0.3, 1 - t * 1.5) : 1;
            
            // 1. Outer glow (large, dim)
            ctx.globalCompositeOperation = 'screen';
            ctx.strokeStyle = `rgba(46, 231, 255, ${0.3 * arcIntensity})`;
            ctx.lineWidth = 16;
            ctx.shadowColor = '#2ee7ff';
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.moveTo(arcPoints[0].x, arcPoints[0].y);
            for (let i = 1; i < arcPoints.length; i++) {
                ctx.lineTo(arcPoints[i].x, arcPoints[i].y);
            }
            ctx.stroke();
            
            // 2. Main arc body 
            ctx.strokeStyle = `rgba(77, 210, 255, ${0.8 * arcIntensity})`;
            ctx.lineWidth = 8;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.moveTo(arcPoints[0].x, arcPoints[0].y);
            for (let i = 1; i < arcPoints.length; i++) {
                ctx.lineTo(arcPoints[i].x, arcPoints[i].y);
            }
            ctx.stroke();
            
            // 3. Hot core (gets dimmer with magnetic blowout)
            ctx.strokeStyle = `rgba(255, 255, 255, ${arcIntensity})`;
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(arcPoints[0].x, arcPoints[0].y);
            for (let i = 1; i < arcPoints.length; i++) {
                ctx.lineTo(arcPoints[i].x, arcPoints[i].y);
            }
            ctx.stroke();
            
            // 4. Sparks at contact points
            const drawSparks = (x: number, y: number) => {
                for (let i = 0; i < 8; i++) {
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
            };
            
            drawSparks(leftX, y);
            drawSparks(rightX, y);
            
            ctx.restore();
        }

        // Draw labels
        ctx.save();
        ctx.font = "16px sans-serif";
        ctx.fillStyle = "#222";
        ctx.fillText("Left Contact", leftX - 70, y - contactLength / 2 - 10);
        ctx.fillText("Right Contact", rightX + 10, y - contactLength / 2 - 10);
        ctx.restore();
    }, [t, magnetic]);

    // Reset
    const handleReset = () => {
        setT(0);
        setRunning(false);
    };

    return createPortal(
        <div
            style={{
                position: "fixed",
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: 640,
                    height: 440,
                    background: "white",
                    padding: 24,
                    borderRadius: 12,
                    position: "relative",
                }}
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    style={{
                        position: "absolute", top: 10, right: 10,
                        zIndex: 10, pointerEvents: "auto",
                    }}
                >Close</button>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <button onClick={() => setRunning((r) => !r)}>
                        {running ? "Pause" : "Start"}
                    </button>
                    <button onClick={handleReset}>Reset</button>
                    <label style={{ marginLeft: 16, 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 4,
                        color: "#222" }}>
                        <input
                            type="checkbox"
                            checked={magnetic}
                            onChange={e => setMagnetic(e.target.checked)}
                            style={{ marginRight: 4 }}
                        />
                        Magnetic Blowout
                    </label>
                </div>
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={320}
                    style={{
                        border: "1px solid #aaa",
                        borderRadius: 8,
                        background: "#eef4f9",
                        marginTop: 8,
                        boxShadow: "0 2px 8px #0002",
                    }}
                />
            </div>
        </div>,
        document.body
    );
}

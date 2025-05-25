import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
    onClose: () => void;
}

export default function ArcSimulator({ onClose }: ModalProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Animation state
    const [running, setRunning] = useState(false);
    const [t, setT] = useState(0); // progress (0 to 1)
    const [magnetic, setMagnetic] = useState(false);

    // Animation loop
    useEffect(() => {
        if (!running) return;

        let frame: number;
        const animate = () => {
            setT((prev) => {
                const next = Math.min(prev + 0.008, 1);
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

        // Draw arc if gap is open
        if (t > 0.08 && t < 0.95) {
            ctx.save();
            // Arc path (curve: straight, or bent with "magnetic blowout")
            ctx.lineWidth = 6;
            ctx.strokeStyle = magnetic ? "#2ee7ff" : "#ffbe33";
            ctx.shadowColor = magnetic ? "#2ee7ff" : "#ffbe33";
            ctx.shadowBlur = 18;

            ctx.beginPath();
            ctx.moveTo(leftX, y);
            if (magnetic) {
                // Bend arc: control point up and to the right
                ctx.bezierCurveTo(
                    leftX + (rightX - leftX) * 0.15,
                    y - 60 - 90 * t, // more bend as contacts open
                    rightX + 60 * t,
                    y - 60 - 90 * t,
                    rightX,
                    y
                );
            } else {
                // Straight arc (slight curve for effect)
                ctx.quadraticCurveTo(
                    (leftX + rightX) / 2,
                    y - 30 - 70 * t,
                    rightX,
                    y
                );
            }
            ctx.stroke();
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

import React, { useRef, useEffect } from "react";
import { TooltipWithArrow } from "./ToolTipWithArrow";

const IMAGE_URL = "electrical-panel.jpg"; // Use your image path

export default function FlashlightPanel() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [mouse, setMouse] = React.useState({ x: 0, y: 0 });

    const width = 800;
    const height = 534;
    const cx = width / 2;
    const cy = height / 2;
    const targetRadius = 80;
    const distance = Math.hypot(mouse.x - cx, mouse.y - cy);
    const showTooltip = distance < targetRadius;

    // Adjust size and redraw on mouse move
    useEffect(() => {

        const canvas = canvasRef.current;
        if (!canvas) return;  // <-- TypeScript-safe guard

        const ctx = canvas.getContext("2d");
        if (!ctx) return; // ctx can also be null!

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(0, 0, 0, 0.86)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Flashlight parameters
            const radius = 180;
            const grad = ctx.createRadialGradient(
                mouse.x, mouse.y, radius * 0.4,
                mouse.x, mouse.y, radius
            );
            grad.addColorStop(0.15, "rgb(0, 0, 0)");
            grad.addColorStop(1, "rgba(0, 0, 0, 0)");

            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.globalCompositeOperation = "source-over";
        };

        draw();
    }, [mouse]);

    // Mouse tracking
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        setMouse({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "800px", // set to image width
                height: "534px", // set to image height
                background: `url(${IMAGE_URL}) center/cover no-repeat`,
                overflow: "hidden"
            }}
            onMouseMove={handleMouseMove}
        >
            <canvas
                ref={canvasRef}
                width={800} height={534}
                style={{
                    position: "absolute",
                    left: 0, top: 0, width: "100%", height: "100%",
                    pointerEvents: "none"
                }}
            />
            <TooltipWithArrow
                show={showTooltip}
                x={300}
                y={100}
                text="About Me"
            />
        </div>
    );
}
import React, { useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import type { RootState } from "@react-three/fiber";

interface ModalProps {
    onClose: () => void;
}

const segments = 200;
const gridExtent = 5; // Grid goes from -5cm to +5cm
const gridSpacingCm = 0.5; // Field arrows every 1cm

function CoilMesh({ coilRadiusM, coilLengthM, turns }: { coilRadiusM: number; coilLengthM: number; turns: number; }) {
    const points = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        const theta = (2 * Math.PI * turns);

        for (let i = 0; i < segments; i++) {
            const t = (i / (segments - 1)) * theta;
            const x = (coilLengthM / theta) * t - coilLengthM / 2;
            const y = coilRadiusM * Math.cos(t);
            const z = coilRadiusM * Math.sin(t);
            pts.push(new THREE.Vector3(x, y, z));
        }

        return pts;
    }, [coilRadiusM, coilLengthM, turns]);

    const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
    const geometry = useMemo(() => new THREE.TubeGeometry(curve, 200, 0.0005, 8, false), [curve]); // radius = 0.2cm

    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial color="orange" />
        </mesh>
    );
}

// Helper for biotSavart: expects all distances in meters
function biotSavart(
    r: THREE.Vector3,
    coilPts: THREE.Vector3[],
    dl: THREE.Vector3[],
    current: number
): THREE.Vector3 {
    const MU_0 = 4 * Math.PI * 1e-7;
    let B = new THREE.Vector3(0, 0, 0);
    for (let i = 0; i < coilPts.length; i++) {
        const R = new THREE.Vector3().subVectors(r, coilPts[i]);
        const rMag = R.length();
        if (rMag > 1e-6) {
            const cross = new THREE.Vector3().crossVectors(dl[i], R);
            cross.multiplyScalar(1 / Math.pow(rMag, 3));
            B.add(cross);
        }
    }
    B.multiplyScalar(MU_0 * current / (4 * Math.PI));
    return B;
}

function FieldArrows({
    coilRadiusM,
    coilLengthM,
    turns,
    current,
    onHoverField,
}: {
    coilRadiusM: number;
    coilLengthM: number;
    turns: number;
    current: number;
    onHoverField?: (pos: THREE.Vector3 | null, B?: number) => void;
}) {
    // Precompute coil geometry for the field calculation (all in meters)
    const { coilPts, dl } = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        const isStraightWire = turns === 0;
        if (isStraightWire) {
            for (let i = 0; i < segments; i++) {
                const x = (i / (segments - 1)) * coilLengthM - coilLengthM / 2;
                pts.push(new THREE.Vector3(x, 0, 0));
            }
        } else {
            const theta = 2 * Math.PI * turns;
            for (let i = 0; i < segments; i++) {
                const t = (i / (segments - 1)) * theta;
                const x = (coilLengthM / theta) * t - coilLengthM / 2;
                const y = coilRadiusM * Math.cos(t);
                const z = coilRadiusM * Math.sin(t);
                pts.push(new THREE.Vector3(x, y, z));
            }
        }
        const segDl: THREE.Vector3[] = [];
        for (let i = 0; i < pts.length - 1; i++) {
            segDl.push(pts[i + 1].clone().sub(pts[i]));
        }
        segDl.push(segDl[segDl.length - 1].clone());
        return { coilPts: pts, dl: segDl };
    }, [coilRadiusM, coilLengthM, turns]);

    // For hover/tap detection and field arrow display
    const arrows = useMemo(() => {
        const elements: React.JSX.Element[] = [];

        for (let xCm = -gridExtent; xCm <= gridExtent; xCm += gridSpacingCm) {
            for (let zCm = -gridExtent; zCm <= gridExtent; zCm += gridSpacingCm) {
                const x = xCm / 100; // cm -> meters
                const y = 0;
                const z = zCm / 100;
                const r = new THREE.Vector3(x, y, z);
                const B = biotSavart(r, coilPts, dl, current);
                const dir = B.clone().normalize();
                const length = 0.6 * gridSpacingCm / 100; // arrow length in meters (~30% of spacing)
                const Bmag = B.length();
                const color = new THREE.Color().setHSL((1 - Math.min(1, Bmag * 1e5)) * 0.7, 1, 0.5);

                // Extra invisible mesh for hover/tap
                elements.push(
                    <group key={`arrowgroup-${xCm}-${zCm}`}>
                        <arrowHelper
                            args={[dir, r, length, color.getHex(), 0.3 * length, 0.3 * length]}
                        />
                        <mesh
                            position={[x, y, z]}
                            onPointerOver={e => {
                                e.stopPropagation();
                                if (onHoverField) onHoverField(r, Bmag);
                            }}
                            onPointerOut={e => {
                                e.stopPropagation();
                                if (onHoverField) onHoverField(null, undefined);
                            }}
                            onPointerDown={e => {
                                e.stopPropagation();
                                if (onHoverField) onHoverField(r, Bmag);
                            }}
                        >
                            <sphereGeometry args={[gridSpacingCm / 100, 8, 8]} />
                            <meshBasicMaterial transparent opacity={0} />
                        </mesh>
                    </group>
                );
            }
        }
        return elements;
    }, [coilPts, dl, current, onHoverField]);

    return <>{arrows}</>;
}

// Project 3D field position to screen position (for the tooltip)
function projectToScreen(
    vector: THREE.Vector3,
    camera: THREE.Camera,
    size: { width: number; height: number }
): { left: number; top: number } {
    const v = vector.clone().project(camera);
    // v.x and v.y are NDC [-1, 1], map to pixel coordinates
    return {
        left: ((v.x + 1) / 2) * size.width,
        top: (1 - (v.y + 1) / 2) * size.height,
    };
}

export default function VectorFieldModal({ onClose }: ModalProps) {
    // Slider values in cm
    const [coilLengthCm, setCoilLengthCm] = useState(5);
    const [coilRadiusCm, setCoilRadiusCm] = useState(1);
    const [turns, setTurns] = useState(10);
    const [current, setCurrent] = useState(1);

    // Hover state
    const [hoveredField, setHoveredField] = useState<THREE.Vector3 | null>(null);
    const [hoveredB, setHoveredB] = useState<number | undefined>(undefined);

    // For positioning the tooltip
    const canvasRef = useRef<HTMLDivElement>(null);
    const [screenPos, setScreenPos] = useState<{ left: number; top: number } | null>(null);

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
                padding: 10,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 900,
                    height: "100%",
                    maxHeight: "90vh",
                    background: "white",
                    padding: 10,
                    borderRadius: 8,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            onClose();
                        }}
                        style={{
                            width: 32,
                            height: 32,
                            fontSize: 18,
                            fontWeight: "bold",
                            background: "transparent",
                            color: "black",
                            border: "1px solid #ccc",
                            borderRadius: "50%",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <div
                        style={{
                            marginBottom: 10,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 20,
                            justifyContent: "space-around",
                            color: "black",
                            padding: "0 10px",
                        }}
                    >
                        <div>
                            <label>Coil Length: {coilLengthCm} cm</label><br />
                            <input type="range" min="1" max="50" step="0.1" value={coilLengthCm} onChange={e => setCoilLengthCm(Number(e.target.value))} />
                        </div>
                        <div>
                            <label>Coil Radius: {coilRadiusCm} cm</label><br />
                            <input type="range" min="0.2" max="10" step="0.1" value={coilRadiusCm} onChange={e => setCoilRadiusCm(Number(e.target.value))} />
                        </div>
                        <div>
                            <label>Turns: {turns}</label><br />
                            <input type="range" min="1" max="30" step="1" value={turns} onChange={e => setTurns(Number(e.target.value))} />
                        </div>
                        <div>
                            <label>Current: {current} A</label><br />
                            <input type="range" min="0.1" max="5" step="0.1" value={current} onChange={e => setCurrent(Number(e.target.value))} />
                        </div>
                    </div>

                    <div
                        ref={canvasRef}
                        style={{ flexGrow: 1, pointerEvents: "none", position: "relative" }}
                    >
                        <Canvas
                            style={{ pointerEvents: "auto", width: "100%", height: "100%" }}
                            camera={{ position: [0, 0.18, 0], up: [0, 0, 1], fov: 45 }}
                            onPointerMissed={() => {
                                setHoveredField(null);
                                setHoveredB(undefined);
                                setScreenPos(null);
                            }}
                            onPointerMove={e => {
                                // Only update tooltip if hovering an arrow (FieldArrows will handle this)
                            }}
                        >
                            <ambientLight intensity={0.5} />
                            <pointLight position={[0.1, 0.2, 0.2]} />
                            <CoilMesh coilLengthM={coilLengthCm / 100} coilRadiusM={coilRadiusCm / 100} turns={turns} />
                            <FieldArrows
                                coilLengthM={coilLengthCm / 100}
                                coilRadiusM={coilRadiusCm / 100}
                                turns={turns}
                                current={current}
                                onHoverField={(pos, B) => {
                                    setHoveredField(pos);
                                    setHoveredB(B);

                                    // Project to screen for tooltip
                                    if (pos && canvasRef.current) {
                                        const { camera, size } = (window as any).threeFiberState || {};
                                        // Fallback: center modal if no camera
                                        if (camera && size) {
                                            setScreenPos(projectToScreen(pos, camera, size));
                                        } else {
                                            setScreenPos({ left: 300, top: 200 });
                                        }
                                    } else {
                                        setScreenPos(null);
                                    }
                                }}
                            />
                            {/*<OrbitControls />*/}
                        </Canvas>
                        {/* Tooltip for |B| */}
                        {hoveredField && hoveredB !== undefined && screenPos && (
                            <div
                                style={{
                                    position: "absolute",
                                    left: screenPos.left,
                                    top: screenPos.top,
                                    transform: "translate(-50%, -120%)",
                                    background: "rgba(255,255,255,0.95)",
                                    color: "#222",
                                    borderRadius: 8,
                                    padding: "6px 10px",
                                    fontSize: 15,
                                    pointerEvents: "none",
                                    border: "1px solid #bbb",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.10)",
                                    fontFamily: "monospace",
                                    zIndex: 100,
                                }}
                            >
                                |B| = {hoveredB.toExponential(3)} T
                            </div>
                        )}
                    </div>
                </div>
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "79%",
                        transform: "translate(-50%, 0)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        pointerEvents: "none",
                        width: 220,
                    }}
                >
                    <svg width="220" height="36" style={{ display: "block" }}>
                        <line
                            x1="200" y1="18"
                            x2="40" y2="18"
                            stroke="#888"
                            strokeWidth="6"
                            strokeLinecap="round"
                        />
                        <polygon
                            points="40,8 10,18 40,28"
                            fill="#888"
                        />
                    </svg>
                    <span
                        style={{
                            color: "#888",
                            fontWeight: 400,
                            fontSize: 28,
                            letterSpacing: 3,
                            fontFamily: "sans-serif",
                            marginTop: 2
                        }}
                    >
                        CURRENT
                    </span>
                </div>
            </div>
        </div>,
        document.body
    );
}

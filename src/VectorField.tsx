import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface ModalProps {
    onClose: () => void;
}

const segments = 200;

function CoilMesh({ coilRadius, coilLength, turns }: { coilRadius: number; coilLength: number; turns: number; }) {
    const points = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        const theta = (2 * Math.PI * turns);

        for (let i = 0; i < segments; i++) {
            const t = (i / (segments - 1)) * theta;
            const x = (coilLength / theta) * t - coilLength / 2;
            const y = coilRadius * Math.cos(t);
            const z = coilRadius * Math.sin(t);
            pts.push(new THREE.Vector3(x, y, z));
        }
        return pts;
    }, [coilRadius, coilLength, turns]);

    const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
    const geometry = useMemo(() => new THREE.TubeGeometry(curve, 200, 0.05, 8, false), [curve]);

    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial color="orange" />
        </mesh>
    );
}

function FieldArrows({ coilRadius, coilLength, turns, current }: { coilRadius: number; coilLength: number; turns: number; current: number;}) {
    const fieldPoints = useMemo(() => {
        const elements: React.JSX.Element[] = [];
        const gridSize = 50;
        const spacing = 0.5;
        const MU_0 = 4 * Math.PI * 1e-7;
        const I = current;

        // Create coil segment vectors
        const theta = (2 * Math.PI * turns);
        const coilPts: THREE.Vector3[] = [];
        for (let i = 0; i < segments; i++) {
            const t = (i / (segments - 1)) * theta;
            const x = (coilLength / theta) * t - coilLength / 2;
            const y = coilRadius * Math.cos(t);
            const z = coilRadius * Math.sin(t);
            coilPts.push(new THREE.Vector3(x, y, z));
        }
        const dl: THREE.Vector3[] = [];
        for (let i = 0; i < coilPts.length - 1; i++) {
            dl.push(coilPts[i + 1].clone().sub(coilPts[i]));
        }
        dl.push(dl[dl.length - 1].clone());

        function biotSavart(r: THREE.Vector3): THREE.Vector3 {
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
            B.multiplyScalar(MU_0 * I / (4 * Math.PI));
            return B;
        }

        for (let x = -5; x <= 5; x += spacing) {
            for (let z = -5; z <= 5; z += spacing) {
                const r = new THREE.Vector3(x, 0, z);
                const B = biotSavart(r);
                const dir = B.clone().normalize();
                const length = 0.2;
                const color = new THREE.Color().setHSL((1 - Math.min(1, B.length() * 1e6)) * 0.7, 1, 0.5);
                const headLength = 0.1; // More prominent arrow head
                const headWidth = 0.1;   // Wider head

                elements.push(
                    <arrowHelper
                        key={`arrow-${x}-${z}`}
                        args={[dir, r, length, color.getHex(), headLength, headWidth]}
                    />
                );
            }
        }
        return elements;
    }, [coilRadius, coilLength, turns, current]);

    return <>{fieldPoints}</>;
}

export default function VectorFieldModal({ onClose }: ModalProps) {
    const [coilLength, setCoilLength] = useState(5);
    const [coilRadius, setCoilRadius] = useState(1);
    const [turns, setTurns] = useState(10);
    const [current, setCurrent] = useState(1);

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
                    width: "100%",
                    maxWidth: 900,
                    height: "100%",
                    maxHeight: "90dvh",
                    background: "white",
                    padding: 10,
                    borderRadius: 8,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                    <button
                        onClick={(e) => {
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
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
                 <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <div style={{ marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "space-around", color: "black" }}>
                        <div>
                            <label>Coil Length: {coilLength} m</label><br />
                            <input type="range" min="1" max="10" step="0.1" value={coilLength} onChange={e => setCoilLength(Number(e.target.value))} />
                        </div>
                        <div>
                            <label>Coil Radius: {coilRadius} m</label><br />
                            <input type="range" min="0.2" max="3" step="0.1" value={coilRadius} onChange={e => setCoilRadius(Number(e.target.value))} />
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

                    <div style={{ flexGrow: 1, pointerEvents: "none" }}>
                        <Canvas
                            style={{ pointerEvents: "auto", width: "100%", height: "100%" }}
                            camera={{ position: [0, 10, 0], up: [0, 0, 1], fov: 45 }}
                        >
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} />
                            <CoilMesh coilLength={coilLength} coilRadius={coilRadius} turns={turns} />
                            <FieldArrows coilLength={coilLength} coilRadius={coilRadius} turns={turns} current={current} />
                        </Canvas>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

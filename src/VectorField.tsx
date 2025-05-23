import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface ModalProps {
    onClose: () => void;
}

// Parameters for the coil
const coilRadius = 1;
const coilLength = 5;
const turns = 10;
const segments = 200;

function CoilMesh() {
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
    }, []);

    const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
    const geometry = useMemo(() => new THREE.TubeGeometry(curve, 200, 0.05, 8, false), [curve]);

    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial color="orange" />
        </mesh>
    );
}

function FieldHeatmap() {
    const fieldPoints = useMemo(() => {
        const elements: React.JSX.Element[] = [];
        const gridSize = 50;
        const spacing = 0.5;
        const MU_0 = 4 * Math.PI * 1e-7;
        const I = 1.0;

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
    }, []);

    return <>{fieldPoints}</>;
}

export default function VectorFieldModal({ onClose }: ModalProps) {
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
                    width: 600,
                    height: 400,
                    background: "white",
                    padding: 20,
                    borderRadius: 8,
                    position: "relative",
                }}
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        zIndex: 10,
                        pointerEvents: "auto",
                    }}
                >
                    Close
                </button>
                <div style={{ pointerEvents: "none", width: "100%", height: "100%" }}>
                    <Canvas style={{ pointerEvents: "auto", width: "100%", height: "100%" }}
                        camera={{ position: [0, 10, 0], fov: 45 }}>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} />
                        <CoilMesh />
                        <FieldHeatmap />
                        <OrbitControls />
                    </Canvas>
                </div>
            </div>
        </div>,
        document.body
    );
}

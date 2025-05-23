import React from "react";
import { createPortal } from "react-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

interface ModalProps {
    onClose: () => void;
}

export default function Modal1({ onClose }: ModalProps) {
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
                        zIndex: 10,         // make sure it’s on top
                        pointerEvents: "auto", // ensure it accepts clicks
                    }}
                >
                    Close
                </button>
                <div style={{ pointerEvents: "none", width: "100%", height: "100%" }}>
                    <Canvas style={{ pointerEvents: "auto", width: "100%", height: "100%" }}>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} />
                        <mesh>
                            <boxGeometry args={[1, 1, 1]} />
                            <meshStandardMaterial color="royalblue" />
                        </mesh>
                        <OrbitControls />
                    </Canvas>
                </div>
            </div>
        </div>,
        document.body
    );
}

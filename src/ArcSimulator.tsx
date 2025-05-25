import { createPortal } from "react-dom";

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
                    
                </div>
            </div>
        </div>,
        document.body
    );
}

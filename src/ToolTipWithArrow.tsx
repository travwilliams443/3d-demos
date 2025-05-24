import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipWithArrowProps {
  show: boolean;        // Whether to show the tooltip
  x: number;            // X position (in px)
  y: number;            // Y position (in px)
  text: string;         // Tag text
  arrowOffset?: number; // Pixels to offset arrow below the tag (default 28)
}

export const TooltipWithArrow: React.FC<TooltipWithArrowProps> = ({
  show,
  x,
  y,
  text,
}) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.7, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: "translate(-50%, -100%)", // center above (x, y)
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        <div style={{
          background: "#222",
          color: "#ff4545",
          fontWeight: 700,
          padding: "10px 22px",
          borderRadius: "8px",
          fontSize: "1.3rem",
          boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
          position: "relative",
          textShadow: "0 1px 8px #000a",
          letterSpacing: "0.02em"
        }}>
          {text}
          {/* Arrow */}
          <div style={{
            position: "absolute",
            left: "50%",
            top: "100%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "16px solid transparent",
            borderRight: "16px solid transparent",
            borderTop: `18px solid #ff4545`,
            filter: "drop-shadow(0 2px 6px #000a)",
            marginTop: "-1px"
          }} />
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
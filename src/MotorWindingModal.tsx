import React from "react";
import { createPortal } from "react-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface ModalProps {
  onClose: () => void;
}

/**
 * PhaseCoils renders three 3-phase racetrack coils wound onto spools,
 * spaced at 120° around the stator.
 */
function PhaseCoils() {
  const coilTurns = 12;
  const turnSpacing = 0.08;
  const spoolRadius = 0.4;
  const spoolLength = coilTurns * turnSpacing + 0.2;

  // racetrack path around a spool cylinder
  const coilCurve = React.useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const length = spoolLength;
    const R = spoolRadius;
    const arcSegments = 20;

    // straight top
    pts.push(new THREE.Vector3(-length/2, R, 0));
    pts.push(new THREE.Vector3(length/2, R, 0));
    // semicircle end
    for (let i=0; i<=arcSegments; i++) {
      const theta = Math.PI * (i/arcSegments) - Math.PI/2;
      pts.push(new THREE.Vector3(
        length/2 + R * Math.cos(theta),
        R * Math.sin(theta),
        0
      ));
    }
    // bottom straight
    pts.push(new THREE.Vector3(length/2, -R, 0));
    pts.push(new THREE.Vector3(-length/2, -R, 0));
    // other semicircle end
    for (let i=0; i<=arcSegments; i++) {
      const theta = Math.PI * (i/arcSegments) + Math.PI/2;
      pts.push(new THREE.Vector3(
        -length/2 + R * Math.cos(theta),
        R * Math.sin(theta),
        0
      ));
    }
    return new THREE.CatmullRomCurve3(pts, true);
  }, []);

  return (
    <>
      {[0,1,2].map((phase) => {
        const angle = phase * (2*Math.PI/3);
        const color = phase===0?"#e74c3c":phase===1?"#27ae60":"#2980b9";
        const rotation = new THREE.Euler(0, 0, angle);

        return (
          <group key={phase} rotation={rotation}>
            {/* spool as a cylinder */}
            <mesh rotation={[Math.PI/2,0,0]}>  
              <cylinderGeometry args={[spoolRadius, spoolRadius, spoolLength, 32]} />
              <meshStandardMaterial color="#888888" metalness={0.5} roughness={0.6} />
            </mesh>
            {/* wire turns around spool */}
            {Array.from({ length: coilTurns }).map((_, idx) => {
              const offset = (idx - (coilTurns-1)/2)*turnSpacing;
              return (
                <mesh key={idx} position={[0,0,offset]}>
                  <tubeGeometry args={[coilCurve, 128, 0.03, 12, true]} />
                  <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </>
  );
}

/**
 * MotorWindingModal displays a 3-phase coil-on-spool sketch
 */
export default function MotorWindingModal({ onClose }: ModalProps) {
  return createPortal(
    <div style={{
      position: 'fixed', top:0,left:0,right:0,bottom:0,
      backgroundColor:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000
    }} onClick={onClose}>
      <div style={{ width:800, height:600, background:'white', borderRadius:8, position:'relative' }} onClick={e=>e.stopPropagation()}>
        <button
          onClick={e => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            padding: '4px 8px',
            cursor: 'pointer',
            zIndex: 1,
          }}
        >
          Close
        </button>
        <Canvas camera={{ position:[0,0,8], fov:50 }} style={{width:'100%',height:'100%'}}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5,5,5]} intensity={0.8} />
          <PhaseCoils />
          <OrbitControls enablePan={false} />
        </Canvas>
      </div>
    </div>,
    document.body
  );
}

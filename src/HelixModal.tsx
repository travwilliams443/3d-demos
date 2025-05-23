import React, { useMemo, useRef } from "react";
import type { JSX } from "react";
import { createPortal } from "react-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface ModalProps {
  onClose: () => void;
}

class HelixCurve extends THREE.Curve<THREE.Vector3> {
  scale: number;

  constructor(scale = 1) {
    super();
    this.scale = scale;
  }

  getPoint(t: number): THREE.Vector3 {
    const coils = 5; // number of loops
    const radius = 1;
    const length = 5;

    const angle = coils * 2 * Math.PI * t;
    const x = length * (t - 0.5);
    const y = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);

    return new THREE.Vector3(x, y, z).multiplyScalar(this.scale);
  }
}

function Coil() {
  const curve = new HelixCurve(1);
  const geometry = new THREE.TubeGeometry(curve, 200, 0.05, 8, false);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#aaa" metalness={0.6} roughness={0.4} />
    </mesh>
  );
}

interface ElectronProps {
  offset: number;
}

function Electron({ offset }: ElectronProps) {
  const ref = useRef<THREE.Mesh>(null);
  const curve = new HelixCurve(1);

  useFrame(({ clock }) => {
    const t = (clock.getElapsedTime() * 0.4 + offset) % 1;
    const point = curve.getPoint(t);
    if (ref.current) {
      ref.current.position.set(point.x, point.y, point.z);
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={1} />
    </mesh>
  );
}

// Parametric torus curve for magnetic field line
class ToroidalFieldLine extends THREE.Curve<THREE.Vector3> {
  R: number; // major radius
  r: number; // minor radius

  constructor(R = 2.5, r = 0.3) {
    super();
    this.R = R;
    this.r = r;
  }

  getPoint(t: number): THREE.Vector3 {
    // t goes from 0 to 1, angle from 0 to 2pi
    const u = t * 2 * Math.PI;

    // Parametric torus: 
    // x = (R + r*cos(v)) * cos(u)
    // y = (R + r*cos(v)) * sin(u)
    // z = r * sin(v)
    // Here we fix v at 0 for a simple loop
    const x = this.R * Math.cos(u);
    const y = this.R * Math.sin(u);
    const z = 0;

    return new THREE.Vector3(x, y, z);
  }
}

function MagneticFieldLoops() {
  const loopCount = 8;
  const baseRadius = 2.5;
  const tubeRadius = 0.05;

  return (
    <>
      {[...Array(loopCount)].map((_, i) => {
        const scale = 1 - i * 0.1; // slightly smaller for inner loops
        const radius = baseRadius * scale;
        const opacity = 0.6 - i * 0.05;

        const curve = useMemo(() => new ToroidalFieldLine(radius, tubeRadius), [radius]);

        const geometry = useMemo(() => new THREE.TubeGeometry(curve, 100, tubeRadius, 8, true), [curve]);

        return (
          <mesh key={i} geometry={geometry}>
            <meshBasicMaterial color="deepskyblue" transparent opacity={opacity} toneMapped={false} />
          </mesh>
        );
      })}
    </>
  );
}

interface InsideFieldLinesProps {
  length: number;        // length of the coil (x-axis)
  count: number;         // number of field lines
  radius: number;        // radius of coil to spread lines inside
}

export function InsideFieldLines({ length, count, radius }: InsideFieldLinesProps) {
  const positions = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const spacing = (2 * radius) / (count - 1);
    for (let i = 0; i < count; i++) {
      const y = -radius + i * spacing;
      pts.push(new THREE.Vector3(-length / 2, y, 0)); // start
      pts.push(new THREE.Vector3(length / 2, y, 0));  // end
    }
    return pts;
  }, [length, count, radius]);

  // Create all line geometries in a memo to avoid re-creating every render
  const lines = useMemo(() => {
    const result = [];
    for (let i = 0; i < positions.length; i += 2) {
      const start = positions[i];
      const end = positions[i + 1];

      // Create geometry for this line
      const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);

      // Direction vector from start to end
      const dir = new THREE.Vector3().subVectors(end, start).normalize();

      // Position for arrow near the end
      const arrowPos = new THREE.Vector3().lerpVectors(start, end, 0.95);

      // Calculate quaternion for arrow orientation
      const arrowQuat = new THREE.Quaternion();
      arrowQuat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

      result.push({
        key: i,
        geometry,
        arrowPos,
        arrowQuat,
      });
    }
    return result;
  }, [positions]);

  return (
    <>
      {lines.map(({ key, geometry, arrowPos, arrowQuat }) => (
        <React.Fragment key={key}>
          <line>
            <bufferGeometry attach="geometry" {...geometry} />
            <lineBasicMaterial color="red" linewidth={2} />
          </line>
          {/*<mesh position={arrowPos} quaternion={arrowQuat}>
            <coneGeometry args={[0.1, 0.3, 8]} />
            <meshBasicMaterial color="green" />
          </mesh>*/}
        </React.Fragment>
      ))}
    </>
  );
}

interface MagneticFieldLineProps {
  coilLength: number;
  coilRadius: number;
  loopHeight: number; // how high the field line arches over coil ends
  offsetAngle: number; // phase around coil for multiple lines
}

export function MagneticFieldLine({ coilLength, coilRadius, loopHeight, offsetAngle }: MagneticFieldLineProps) {
  // Create a smooth curve looping from start of coil around outside and back

  const points = useMemo(() => {
    const pts = [];

    // Start point: bottom front side of coil
    pts.push(new THREE.Vector3(-coilLength / 2, coilRadius * Math.cos(offsetAngle), coilRadius * Math.sin(offsetAngle)));

    // Control points arching over the coil end (top)
    pts.push(new THREE.Vector3(-coilLength / 2, loopHeight, 0));
    pts.push(new THREE.Vector3(coilLength / 2, loopHeight, 0));

    // End point: bottom back side of coil
    pts.push(new THREE.Vector3(coilLength / 2, coilRadius * Math.cos(offsetAngle + Math.PI), coilRadius * Math.sin(offsetAngle + Math.PI)));

    // Control points under coil to close loop smoothly
    pts.push(new THREE.Vector3(coilLength / 2, -loopHeight, 0));
    pts.push(new THREE.Vector3(-coilLength / 2, -loopHeight, 0));

    // Back to start point to close loop
    pts.push(pts[0].clone());

    return pts;
  }, [coilLength, coilRadius, loopHeight, offsetAngle]);

  const curve = useMemo(() => new THREE.CatmullRomCurve3(points, true), [points]);

  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 100, 0.02, 8, true), [curve]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color="deepskyblue" transparent opacity={0.6} toneMapped={false} />
    </mesh>
  );
}

interface MagneticFieldSplineProps {
  coilLength: number;
  coilRadius: number;
  loopHeight: number;
}

export function MagneticFieldSpline({ }: MagneticFieldSplineProps) {
  const points = useMemo(() => {
    return [
      new THREE.Vector3(0.0000, 0.0000, 0.5000),
  new THREE.Vector3(2.5817, -0.2892, 1.0206),
  new THREE.Vector3(4.2039, -2.3834, 1.2373),
  new THREE.Vector3(5.4226, -4.0538, -0.5073),
  new THREE.Vector3(6.1720, -4.4134, -3.1009),
  new THREE.Vector3(6.4730, -3.4795, -5.6515),
  new THREE.Vector3(6.3926, -1.5826, -7.6259),
  new THREE.Vector3(6.0108, 0.8817, -8.7689),
  new THREE.Vector3(5.4067, 3.5494, -9.0107),
  new THREE.Vector3(4.6524, 6.1195, -8.3985),
  new THREE.Vector3(3.8090, 8.3621, -7.0505),
  new THREE.Vector3(2.9249, 10.1134, -5.1232),
  new THREE.Vector3(2.0349, 11.2686, -2.7905),
  new THREE.Vector3(1.1617, 11.7722, -0.2303),
  new THREE.Vector3(0.3175, 11.6098, 2.3839),
  new THREE.Vector3(-0.4922, 10.8005, 4.8866),
  new THREE.Vector3(-1.2665, 9.3945, 7.1221),
  new THREE.Vector3(-2.0055, 7.4714, 8.9463),
  new THREE.Vector3(-2.7087, 5.1413, 10.2293),
  new THREE.Vector3(-3.3730, 2.5477, 10.8605),
  new THREE.Vector3(-3.9911, -0.1295, 10.7566),
  new THREE.Vector3(-4.5499, -2.6714, 9.8738),
  new THREE.Vector3(-5.0267, -4.8169, 8.2274),
  new THREE.Vector3(-5.3823, -6.2636, 5.9248),
  new THREE.Vector3(-5.5468, -6.6872, 3.2269),
  new THREE.Vector3(-5.3940, -5.8255, 0.6467),
  new THREE.Vector3(-4.7232, -3.7677, -0.9813),
  new THREE.Vector3(-3.3864, -1.4201, -0.9245),
  new THREE.Vector3(-1.1062, -0.4518, -0.1622),
  new THREE.Vector3(0.0000, 0.0000, 0.5000),
    ];
  }, []);

  const curve = useMemo(() => new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5), [points]);

  const geometry = useMemo(() => new THREE.TubeGeometry(curve, points.length * 2, 0.05, 8, false), [curve]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color="deepskyblue" transparent opacity={0.6} toneMapped={false} />
    </mesh>
  );
}

export default function HelixModal({ onClose }: ModalProps) {
  const electronCount = 10;

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
          width: 800,
          height: 600,
          background: "white",
          padding: 20,
          borderRadius: 8,
          position: "relative",
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={e => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 10,
            cursor: "pointer",
          }}
          aria-label="Close modal"
        >
          Close
        </button>

        <div style={{ width: "100%", height: "100%" }}>
          <Canvas style={{ width: "100%", height: "100%" }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />

            <Coil />

            {[...Array(electronCount)].map((_, i) => (
              <React.Fragment key={i}>
                <Electron offset={i / electronCount} />
                {/*<MagneticFieldLine
                  coilLength={5}
                  coilRadius={1}
                  loopHeight={2}
                  offsetAngle={(i / electronCount) * Math.PI * 2}
                />*/}
              </React.Fragment>
            ))}

            {/*<MagneticFieldLoops />
            <InsideFieldLines length={5} count={8} radius={0.6} />*/}
            <MagneticFieldSpline coilLength={5} coilRadius={1} loopHeight={2} />
            <OrbitControls />
          </Canvas>
        </div>

      </div>
    </div>,
    document.body
  );
}

import { useState } from "react";
import Modal1 from "./Modal1";
import ArcSimulator from "./components/ArcSimulator";
import VectorFieldModal from "./VectorField";
import HelixModal from "./HelixModal";
import MotorWindingModal from "./MotorWindingModal";
import FlashlightPanel from "./FlashlightPanel";
import IframeModal from "./IframeModal";
import { Modal } from "./components/Modal";
import FlowersDatasetModal from "./FlowersDatasetModal";

export default function App() {
  const [modal1Open, setModal1Open] = useState(false);
  const [modal2Open, setModal2Open] = useState(false);
  const [modal3Open, setModal3Open] = useState(false);
  const [helixOpen, setHelixOpen] = useState(false);
  const [motorOpen, setMotorOpen] = useState(false);
  const [flashlightOpen, setFlashlightOpen] = useState(false);
  const [octopusOpen, setOctopusOpen] = useState(false);
  const [sparkleOpen, setSparkleOpen] = useState(false);
  const [flowersOpen, setFlowersOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 bg-gray-800 p-8"
      style={{ paddingLeft: "1rem", minWidth: "200px" }}>
      <button
        className=""
        onClick={() => {
          setModal1Open(true);
        }}
      >
        Test Modal 1
      </button>
      <button
        onClick={() => {
          setModal2Open(true);
        }}
      >
        Arc Suppression
      </button>
      <button
        onClick={() => {
          setModal3Open(true);
        }}
      >
        Magnetic Field
      </button>
      <button onClick={() => setHelixOpen(true)}>Helix Demo</button>
      <button onClick={() => setMotorOpen(true)}>Motor Winding Demo</button>
      <button onClick={() => setFlashlightOpen(true)}>Flashlight Demo</button>
      <button onClick={() => setOctopusOpen(true)}>Octopus p5.js</button>
      <button onClick={() => setSparkleOpen(true)}>Sparkle Grid</button>
      <button onClick={() => setFlowersOpen(true)}>Flowers Dataset</button>

      {modal1Open && (
        <Modal1
          onClose={() => {
            setModal1Open(false);
          }}
        />
      )}
      {modal2Open && (
        <ArcSimulator
          onClose={() => {
            setModal2Open(false);
          }}
        />
      )}
      {modal3Open && (
        <VectorFieldModal
          onClose={() => {
            setModal3Open(false);
          }}
        />
      )}
      {helixOpen && (
        <HelixModal onClose={() => setHelixOpen(false)} />
      )}
      {motorOpen && (
        <MotorWindingModal onClose={() => setMotorOpen(false)} />
      )}
      {flashlightOpen && (
        <Modal onClose={() => setFlashlightOpen(false)} width={820} height={560}>
          <FlashlightPanel />
        </Modal>
      )}
      {octopusOpen && (
        <IframeModal
          onClose={() => setOctopusOpen(false)}
          src="/octopus_p5js.html"
          width={420}
          height={420}
        />
      )}
      {sparkleOpen && (
        <IframeModal
          onClose={() => setSparkleOpen(false)}
          src="/sparkle_grid.html"
          width={700}
          height={500}
        />
      )}
      {flowersOpen && (
        <FlowersDatasetModal onClose={() => setFlowersOpen(false)} />
      )}
    </div>
  );
}

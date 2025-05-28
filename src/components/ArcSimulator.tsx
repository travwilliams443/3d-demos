import { useState } from "react";
import { useAnimation } from '../hooks/useAnimation';
import { Modal } from './Modal';
import { AnimationControls } from './AnimationControls';
import { ArcCanvas } from './ArcCanvas';

interface ArcSimulatorProps {
  onClose: () => void;
}

export default function ArcSimulator({ onClose }: ArcSimulatorProps) {
  const [arcChutes, setArcChutes] = useState(false);
  const { running, progress, reset, toggle } = useAnimation();

  return (
    <Modal onClose={onClose}>
      <AnimationControls
        running={running}
        onToggle={toggle}
        onReset={reset}
        arcChutes={arcChutes}
        onArcChutesChange={setArcChutes}
      />
      <ArcCanvas 
        progress={progress} 
        arcChutes={arcChutes} 
      />
    </Modal>
  );
}
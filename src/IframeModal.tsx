import { Modal } from "./components/Modal";

interface IframeModalProps {
  src: string;
  onClose: () => void;
  width?: number;
  height?: number;
}

export default function IframeModal({ src, onClose, width = 640, height = 480 }: IframeModalProps) {
  return (
    <Modal onClose={onClose} width={width} height={height}>
      <iframe src={src} style={{ width: "100%", height: "100%", border: 0 }} />
    </Modal>
  );
}

interface AnimationControlsProps {
  running: boolean;
  onToggle: () => void;
  onReset: () => void;
  magnetic: boolean;
  onMagneticChange: (magnetic: boolean) => void;
}

export function AnimationControls({ 
  running, 
  onToggle, 
  onReset, 
  magnetic, 
  onMagneticChange 
}: AnimationControlsProps) {
  return (
    <div className="flex gap-2 mb-2">
      <button 
        onClick={onToggle}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {running ? "Pause" : "Start"}
      </button>
      <button 
        onClick={onReset}
        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Reset
      </button>
      <label className="flex items-center gap-2 ml-4 text-gray-700">
        <input
          type="checkbox"
          checked={magnetic}
          onChange={e => onMagneticChange(e.target.checked)}
        />
        Magnetic Blowout
      </label>
    </div>
  );
}
import React, { useState } from "react";
import Modal1 from "./Modal1";
import ArcSimulator from "./components/ArcSimulator";
import VectorFieldModal from "./VectorField";

export default function App() {
  const [modal1Open, setModal1Open] = useState(false);
  const [modal2Open, setModal2Open] = useState(false);
  const [modal3Open, setModal3Open] = useState(false);

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
        Test Modal 2
      </button>
      <button
        onClick={() => {
          setModal3Open(true);
        }}
      >
        Test Modal 3
      </button>

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
    </div>
  );
}

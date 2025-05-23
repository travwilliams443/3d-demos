import React, { useState } from "react";
import Modal1 from "./Modal1";
import Modal2 from "./HelixCurve";

export default function App() {
  const [modal1Open, setModal1Open] = useState(false);
  const [modal2Open, setModal2Open] = useState(false);

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
      <br />
      <button
        onClick={() => {
          setModal2Open(true);
        }}
      >
        Test Modal 2
      </button>
        
      {modal1Open && (
        <Modal1
          onClose={() => {
            setModal1Open(false);
          }}
        />
      )}
      {modal2Open && (
        <Modal2
          onClose={() => {
            setModal2Open(false);
          }}
        />
      )}
    </div>
  );
}

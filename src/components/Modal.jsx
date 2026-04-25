import React from "react";
export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="modalWrap" onMouseDown={onClose}>
      <div className="modalCard" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalTop">
          <div className="modalTitle">{title}</div>
          <button className="btnGhost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}

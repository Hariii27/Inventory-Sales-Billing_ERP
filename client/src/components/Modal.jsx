export default function Modal({ title, onClose, children }) {
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="btn btn-ghost" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
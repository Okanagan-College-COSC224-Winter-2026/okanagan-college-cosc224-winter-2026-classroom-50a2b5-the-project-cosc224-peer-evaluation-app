import { ReactNode } from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="ModalBackdrop" onClick={handleBackdropClick}>
      <div className="ModalContent">
        <div className="ModalHeader">
          <h2>{title}</h2>
          <button
            className="ModalCloseButton"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="ModalBody">{children}</div>
      </div>
    </div>
  );
}

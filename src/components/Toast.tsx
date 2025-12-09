
import React from 'react';
import './Toast.css';

interface ToastProps {
  show: boolean;
  message: string;
}

const Toast: React.FC<ToastProps> = ({ show, message }) => {
  if (!show) return null;

  return (
    <div className="toast">
      <i className="fas fa-info-circle"></i>
      <span>{message}</span>
    </div>
  );
};

export default Toast;

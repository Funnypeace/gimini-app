
import React from 'react';

interface ChoiceButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ text, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full px-4 py-3 bg-sky-600 text-white font-medium rounded-lg shadow-md
                 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75
                 transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95
                 disabled:bg-slate-500 disabled:cursor-not-allowed disabled:transform-none"
    >
      {text}
    </button>
  );
};

export default ChoiceButton;

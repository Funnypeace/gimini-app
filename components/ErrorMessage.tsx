import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="bg-red-700 bg-opacity-80 border border-red-500 text-red-100 px-4 py-3 rounded-md relative" role="alert">
      <strong className="font-bold">Hoppla! </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  );
};

export default ErrorMessage;
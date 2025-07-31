import React from 'react';

const StoryDisplay: React.FC<{ sceneDescription: string }> = ({ sceneDescription }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-6">
      <p className="text-slate-300 whitespace-pre-wrap">{sceneDescription}</p>
    </div>
  );
};

export default StoryDisplay;

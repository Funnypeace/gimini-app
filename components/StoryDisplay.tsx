import React from 'react';

interface StoryDisplayProps {
  sceneDescription: string;
  imageUrl?: string;
  isLoadingImage?: boolean;
}

const StoryDisplay: React.FC<StoryDisplayProps> = ({ sceneDescription, imageUrl, isLoadingImage }) => {
  return (
    <div className="mb-6 p-1 rounded-lg ">
      <div className="aspect-video w-full bg-slate-700 rounded-lg overflow-hidden shadow-lg mb-6 border border-slate-600">
        {isLoadingImage && (
          <div className="w-full h-full flex items-center justify-center bg-slate-700">
            <svg className="animate-spin h-10 w-10 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="ml-3 text-slate-300">Bilder werden heraufbeschworen...</p>
          </div>
        )}
        {!isLoadingImage && imageUrl && (
          <img src={imageUrl} alt="Szenenbild" className="w-full h-full object-cover" />
        )}
        {!isLoadingImage && !imageUrl && (
           <div className="w-full h-full flex flex-col items-center justify-center bg-slate-700 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.158 0a.225.225 0 0 1 .225.225V8.7a.225.225 0 0 1-.225.225h-.008a.225.225 0 0 1-.225-.225V8.475a.225.225 0 0 1 .225-.225h.008Z" />
            </svg>
            <p>Bilder laden oder sind nicht verfügbar.</p>
          </div>
        )}
      </div>
      <div className="prose prose-invert prose-lg max-w-none text-slate-200 leading-relaxed">
        {sceneDescription.split('\n').map((paragraph, index) => (
          <p key={index} className="mb-3 last:mb-0">{paragraph}</p>
        ))}
      </div>
    </div>
  );
};

export default StoryDisplay;
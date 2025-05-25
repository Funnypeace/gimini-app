import React, { useState, useEffect, useCallback } from 'react';
import { StorySegment } from './types';
import { INITIAL_GAME_THEME } from './constants';
import { adventureService } from './services/adventureService';
import StoryDisplay from './components/StoryDisplay';
import ChoiceButton from './components/ChoiceButton';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';

const App: React.FC = () => {
  const [currentStory, setCurrentStory] = useState<StorySegment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [gameHistory, setGameHistory] = useState<string[]>([]); // Stores previous scene descriptions for context

  const startGame = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setGameHistory([]);
    setCurrentStory(null); 
    try {
      const initialSegment = await adventureService.getInitialScene(INITIAL_GAME_THEME);
      setCurrentStory(initialSegment);
      if (initialSegment) {
        setGameHistory([initialSegment.sceneDescription]);
      }
    } catch (err) {
      console.error("Fehler beim Starten des Spiels:", err);
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist beim Starten des Spiels aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    startGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // startGame is memoized and doesn't change.

  const handlePlayerChoice = async (choice: string) => {
    if (!currentStory || currentStory.isGameOver) return;

    setIsLoading(true);
    setError(null);
    const previousSceneDescription = currentStory.sceneDescription;

    try {
      const nextSegment = await adventureService.getNextScene(previousSceneDescription, choice, gameHistory);
      setCurrentStory(nextSegment);
      if (nextSegment) {
        setGameHistory(prev => [...prev, nextSegment.sceneDescription].slice(-5)); // Keep last 5 for context
      }
    } catch (err) {
      console.error("Fehler bei der Verarbeitung der Auswahl:", err);
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist beim Fortsetzen der Geschichte aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading && !currentStory) { // Initial load
      return <div className="flex flex-col items-center justify-center h-64"><LoadingSpinner /><p className="mt-4 text-lg">Dein Abenteuer wird gewoben...</p></div>;
    }
    if (error && !currentStory) { // Fatal error on start
        return (
            <div className="text-center p-4">
                <ErrorMessage message={`Abenteuer konnte nicht gestartet werden: ${error}`} />
                <button
                    onClick={startGame}
                    className="mt-4 px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-md transition duration-150 ease-in-out"
                >
                    Erneut versuchen
                </button>
            </div>
        );
    }
    if (!currentStory) { // Should not happen if loading/error states are correct
        return <p className="text-center text-xl">Etwas ist schiefgelaufen. Bitte versuche, die Seite neu zu laden.</p>;
    }

    return (
      <>
        <StoryDisplay
          sceneDescription={currentStory.sceneDescription}
          imageUrl={currentStory.imageUrl}
          isLoadingImage={isLoading && !!currentStory.imagePrompt && !currentStory.imageUrl} 
        />
        {error && <div className="my-4"><ErrorMessage message={error} /></div>}
        {isLoading && currentStory && <div className="flex items-center justify-center my-4"><LoadingSpinner /><p className="ml-2">Die Geschichte entfaltet sich...</p></div>}
        
        {!currentStory.isGameOver && !isLoading && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentStory.choices.map((choice, index) => (
              <ChoiceButton
                key={index}
                text={choice}
                onClick={() => handlePlayerChoice(choice)}
                disabled={isLoading}
              />
            ))}
          </div>
        )}
        {currentStory.isGameOver && !isLoading && (
          <div className="mt-8 text-center">
            <p className="text-2xl font-semibold text-sky-400 mb-4">Das Ende</p>
            <p className="text-slate-300 mb-6">{currentStory.sceneDescription.includes("Das Ende.") ? "" : "Deine Reise hat ihren Abschluss erreicht."}</p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-xl transition duration-150 ease-in-out transform hover:scale-105"
            >
              Neues Abenteuer starten
            </button>
          </div>
        )}
      </>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center p-4 sm:p-6 md:p-8 selection:bg-sky-500 selection:text-white">
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-500">
          Gemini Abenteuerweber
        </h1>
      </header>
      <main className="w-full max-w-3xl bg-slate-800 bg-opacity-70 shadow-2xl rounded-xl p-6 md:p-8 backdrop-blur-md border border-slate-700">
        {renderContent()}
      </main>
      <footer className="mt-12 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} KI-Geschichtenerzähler. Unterstützt von Gemini & Imagen.</p>
      </footer>
    </div>
  );
};

export default App;
import React, { useState, useEffect, useCallback } from 'react';
import { StorySegment } from './types';
import { adventureService } from './services/adventureService';
import StoryDisplay from './components/StoryDisplay';
import ChoiceButton from './components/ChoiceButton';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { saveGame, loadGame } from './services/savegameService';
import { supabase } from './services/supabaseClient';

const genres = [
  "Drama", "Komödie", "Action", "Thriller", "Science-Fiction",
  "Fantasy", "Horror", "Krimi", "Romantik/Romance", "Abenteuer/Adventure"
];

type Mode = 'guest' | 'login' | null;

const App: React.FC = () => {
  // Login/Gast
  const [mode, setMode] = useState<Mode>(null);
  const [user, setUser] = useState<any>(null);

  // Username: im Gastmodus vom User, sonst von Supabase-User
  const [username, setUsername] = useState<string>('');
  const [nameConfirmed, setNameConfirmed] = useState(false);

  // Spiel-Logik
  const [genre, setGenre] = useState<string | null>(null);
  const [genreConfirmed, setGenreConfirmed] = useState(false);
  const [spielstandExistiert, setSpielstandExistiert] = useState<boolean | null>(null);
  const [ladeFrageGezeigt, setLadeFrageGezeigt] = useState(false);
  const [currentStory, setCurrentStory] = useState<StorySegment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [step, setStep] = useState<number>(1);

  // Toast-Benachrichtigung
  const [notification, setNotification] = useState<string | null>(null);

  // Optimiert: Caching und Token-Tracking
  const [requestCache, setRequestCache] = useState<Map<string, StorySegment>>(new Map());
  const [requestCount, setRequestCount] = useState(0);
  const [dailyTokenUsage, setDailyTokenUsage] = useState(0);

  // Supabase User holen (nur im Login-Modus!)
  useEffect(() => {
    if (mode === 'login') {
      supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      return () => {
        listener?.subscription.unsubscribe();
      };
    }
  }, [mode]);

  // Automatisches Setzen von username, wenn eingeloggt
  useEffect(() => {
    if (mode === 'login' && user && user.email) {
      setUsername(user.email);
      setNameConfirmed(true);
    }
  }, [user, mode]);

  // 1. Nach Genre-Auswahl prüfen, ob ein Spielstand existiert
  useEffect(() => {
    const checkForSavegame = async () => {
      if (username && genre) {
        setIsLoading(true);
        const result = await loadGame(username, genre);
        setSpielstandExistiert(!!result.data && !!result.data.story);
        setIsLoading(false);
        setLadeFrageGezeigt(false);
      }
    };
    if (nameConfirmed && genre && !genreConfirmed) {
      checkForSavegame();
    }
  }, [username, genre, nameConfirmed, genreConfirmed]);

  // 2. Spielstart-Logik
  const startGame = useCallback(async () => {
    if (!genre) return;
    setIsLoading(true);
    setError(null);
    setGameHistory([]);
    setCurrentStory(null);
    setStep(1);
    setRequestCount(prev => prev + 1);
    try {
      const initialSegment = await adventureService.getInitialScene(genre);
      setCurrentStory(initialSegment);
      if (initialSegment) {
        setGameHistory([initialSegment.sceneDescription]);
        const estimatedTokens = initialSegment.sceneDescription.length / 4;
        setDailyTokenUsage(prev => prev + estimatedTokens);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist beim Starten des Spiels aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  }, [genre]);

  const loadSavegame = useCallback(async () => {
    if (!username || !genre) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await loadGame(username, genre);
      if (result.data && result.data.story) {
        setCurrentStory(result.data.story);
        setGameHistory(result.data.history || []);
        setStep(result.data.history ? result.data.history.length + 1 : 1);
      } else {
        setError("Kein gespeicherter Spielstand gefunden!");
      }
    } catch (err) {
      setError("Fehler beim Laden des Spielstands.");
    } finally {
      setIsLoading(false);
    }
  }, [username, genre]);

  const handlePlayerChoice = async (choice: string) => {
    if (!currentStory || currentStory.isGameOver) return;

    const cacheKey = `${currentStory.sceneDescription.substring(0, 50)}-${choice}`;
    if (requestCache.has(cacheKey)) {
      const cachedStory = requestCache.get(cacheKey)!;
      setCurrentStory(cachedStory);
      setGameHistory(prev => [...prev, cachedStory.sceneDescription].slice(-3));
      setStep(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep(prev => prev + 1);
    setRequestCount(prev => prev + 1);
    const previousSceneDescription = currentStory.sceneDescription;
    try {
      const nextSegment = await adventureService.getNextScene(
        previousSceneDescription,
        choice,
        gameHistory.slice(-2)
      );
      setCurrentStory(nextSegment);
      if (nextSegment) {
        setRequestCache(prev => new Map(prev.set(cacheKey, nextSegment)));
        setGameHistory(prev => [...prev, nextSegment.sceneDescription].slice(-3));
        const estimatedTokens = (nextSegment.sceneDescription.length + choice.length) / 4;
        setDailyTokenUsage(prev => prev + estimatedTokens);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist beim Fortsetzen der Geschichte aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  // Rate-Limit-Warnung
  const renderRateLimitWarning = () => {
    if (requestCount > 50) {
      return (
        <div style={{backgroundColor: '#fff3cd', padding: '10px', borderRadius: '5px', margin: '10px 0'}}>
          ⚠️ Du hast heute schon {requestCount} Anfragen gemacht. Tägliches Limit: ~500k Tokens ({Math.round(dailyTokenUsage)} geschätzt verwendet)
        </div>
      );
    }
    return null;
  };

  // === UI Schritt 1: Auswahl Login/Gast ===
  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-500">
            Claudios Geschichtenerzähler
          </h1>
        </header>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            className="py-3 bg-sky-600 hover:bg-sky-500 rounded text-white text-lg font-bold"
            onClick={() => setMode('login')}
          >
            Mit Account einloggen/registrieren
          </button>
          <button
            className="py-3 bg-emerald-700 hover:bg-emerald-500 rounded text-white text-lg font-bold"
            onClick={() => setMode('guest')}
          >
            Als Gast spielen
          </button>
        </div>
      </div>
    );
  }

  // === UI Schritt 2a: Login/Registrierung ===
  if (mode === 'login' && !user) {
    return <AuthForm />;
  }

  // === UI Schritt 2b: Name im Gastmodus ===
  if (mode === 'guest' && !nameConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center p-4 sm:p-6 md:p-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-500">
            Claudios Geschichtenerzähler
          </h1>
        </header>
        <main className="w-full max-w-3xl bg-slate-800 bg-opacity-70 shadow-2xl rounded-xl p-6 md:p-8">
          <h2 className="text-xl mb-4 text-center">Wie heißt du?</h2>
          <div className="flex flex-col items-center gap-4">
            <input
              className="px-4 py-2 rounded-lg border border-slate-500 text-lg bg-slate-900 text-white focus:outline-none focus:border-sky-500"
              placeholder="Dein Name"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            <button
              className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-md transition duration-150"
              disabled={!username}
              onClick={() => setNameConfirmed(true)}
            >
              Bestätigen
            </button>
          </div>
        </main>
      </div>
    );
  }

  // === UI Schritt 3: Genre-Auswahl ===
  if (!genreConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center p-4 sm:p-6 md:p-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-500">
            Claudios Geschichtenerzähler
          </h1>
          {mode === 'login' && user && (
            <button
              onClick={async () => { await supabase.auth.signOut(); setUser(null); setMode(null); setGenre(null); setGenreConfirmed(false); setNameConfirmed(false); }}
              className="absolute right-8 top-8 px-3 py-1 bg-sky-800 text-white rounded rounded hover:bg-sky-700"
            >
              Logout
            </button>
          )}
        </header>
        <main className="w-full max-w-3xl bg-slate-800 bg-opacity-70 shadow-2xl rounded-xl p-6 md:p-8">
          <h2 className="text-xl mb-4 text-center">Welches Genre möchtest du spielen?</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {genres.map(g => (
              <button
                key={g}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow transition duration-100"
                onClick={() => {
                  setGenre(g);
                  setSpielstandExistiert(null);
                  setLadeFrageGezeigt(false);
                }}
              >
                {g}
              </button>
            ))}
          </div>
          {isLoading && <div className="mt-4"><LoadingSpinner /></div>}
          {!isLoading && spielstandExistiert !== null && !ladeFrageGezeigt && (
            <div className="mt-6 flex flex-col items-center">
              {spielstandExistiert ? (
                <>
                  <p className="text-sky-300 text-lg mb-4">
                    Für {username} im Genre {genre} wurde ein Spielstand gefunden.<br />
                    Möchtest du diesen laden?
                  </p>
                  <div className="flex gap-4">
                    <button
                      className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-md"
                      onClick={async () => {
                        setGenreConfirmed(true);
                        setLadeFrageGezeigt(true);
                        await loadSavegame();
                      }}
                    >
                      Spielstand laden
                    </button>
                    <button
                      className="px-6 py-2 bg-emerald-700 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-md"
                      onClick={async () => {
                        setGenreConfirmed(true);
                        setLadeFrageGezeigt(true);
                        setCurrentStory(null);
                        setGameHistory([]);
                        setStep(1);
                        setError(null);
                        await startGame();
                      }}
                    >
                      Neues Abenteuer starten
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sky-300 text-lg mb-4">
                    Kein Spielstand für {username} im Genre {genre} gefunden.<br />
                    Starte ein neues Abenteuer!
                  </p>
                  <button
                    className="px-6 py-2 bg-emerald-700 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-md"
                    onClick={async () => {
                      setGenreConfirmed(true);
                      setLadeFrageGezeigt(true);
                      setCurrentStory(null);
                      setGameHistory([]);
                      setStep(1);
                      setError(null);
                      await startGame();
                    }}
                  >
                    Abenteuer starten
                  </button>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Kein automatischer Spielstart mehr hier – nur noch per Button!
  const renderContent = () => {
    if (isLoading && !currentStory) {
      return <div className="flex flex-col items-center justify-center h-64"><LoadingSpinner /><p className="mt-4 text-lg">Dein Abenteuer wird gewoben...</p></div>;
    }

    if (error && !currentStory) {
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

    if (!currentStory) {
        return <p className="text-center text-xl">Etwas ist schiefgelaufen. Bitte versuche, die Seite neu zu laden.</p>;
    }

    return (
      <>
        {/* Name & Zug/Fragen-Zähler anzeigen */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-base text-sky-400 font-bold">
            Spieler: {username}
          </div>
          <div className="text-base text-sky-400 font-bold">
            Genre: {genre}
          </div>
          <div className="text-base text-sky-400 font-bold">
            Zug: {step}
          </div>
        </div>

        {renderRateLimitWarning()}

        <StoryDisplay
          sceneDescription={currentStory.sceneDescription}
        />

        {error && <div className="my-4"><ErrorMessage message={error} /></div>}

        {isLoading && currentStory && <div className="flex items-center justify-center my-4"><LoadingSpinner /><p className="ml-2">Die Geschichte entfaltet sich...</p></div>}

        {!currentStory.isGameOver && !isLoading && (
          <>
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

            <div className="flex gap-3 justify-center mt-4">
              <button
                className="px-4 py-2 bg-sky-800 hover:bg-sky-600 text-white rounded shadow"
                onClick={async () => {
                  if (currentStory && genre) {
                    const err = await saveGame(username, genre, currentStory, gameHistory);
                    setNotification(err ? "Fehler beim Speichern!" : "Spielstand gespeichert!");
                    setTimeout(() => setNotification(null), 2500);
                  }
                }}
                disabled={!currentStory}
              >
                Spielstand speichern
              </button>
              <button
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-600 text-white rounded shadow"
                onClick={async () => {
                  await loadSavegame();
                }}
              >
                Spielstand laden
              </button>
            </div>
          </>
        )}

        {currentStory.isGameOver && !isLoading && (
          <div className="mt-8 text-center">
            <p className="text-2xl font-semibold text-sky-400 mb-4">Das Ende</p>
            <p className="text-slate-300 mb-6">{currentStory.sceneDescription.includes("Das Ende.") ? "" : "Deine Reise hat ihren Abschluss erreicht."}</p>
            <button
              onClick={() => {
                setGenreConfirmed(false);
                setCurrentStory(null);
                setGameHistory([]);
                setStep(1);
                setError(null);
              }}
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
          Claudios Geschichtenerzähler
        </h1>
      </header>

      <main className="w-full max-w-3xl bg-slate-800 bg-opacity-70 shadow-2xl rounded-xl p-6 md:p-8 backdrop-blur-md border border-slate-700">
        {renderContent()}
      </main>

      {notification && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg text-lg z-50 animate-fade-in">
          {notification}
        </div>
      )}

      <footer className="mt-12 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} KI-Geschichtenerzähler. Unterstützt von Groq.</p>
      </footer>
    </div>
  );
};

// --- Einfaches Login/Registrierungsformular für Supabase ---
const AuthForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async () => {
    setMessage(null);
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage('Bestätigungslink gesendet! Bitte E-Mail prüfen.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-sm bg-slate-800 p-8 rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center text-sky-400">{mode === 'login' ? 'Login' : 'Registrieren'}</h2>
        <input
          className="w-full px-4 py-2 mb-4 rounded border border-slate-500 bg-slate-900 text-white"
          type="email"
          placeholder="E-Mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="w-full px-4 py-2 mb-4 rounded border border-slate-500 bg-slate-900 text-white"
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {message && <div className="mb-4 text-red-400">{message}</div>}
        <button
          className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded mb-4"
          onClick={handleAuth}
        >
          {mode === 'login' ? 'Login' : 'Registrieren'}
        </button>
        <button
          className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        >
          {mode === 'login' ? 'Noch kein Konto? Jetzt registrieren' : 'Bereits ein Konto? Login'}
        </button>
      </div>
    </div>
  );
};

export default App;

// Sixle - 6-letter Wordle-style Game

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

// Import JSON word lists
import allWords from './data/allWords.json';
import targetWords from './data/targetWords.json';

const MAX_GUESSES = 7;

const getFeedback = (guess: string, target: string): ('correct' | 'present' | 'absent')[] => {
  const feedback: ('correct' | 'present' | 'absent')[] = Array(guess.length).fill('absent');
  const targetArr = target.split('');
  const guessArr = guess.split('');
  const letterCount: Record<string, number> = {};

  targetArr.forEach(char => {
    letterCount[char] = (letterCount[char] || 0) + 1;
  });

  for (let i = 0; i < guessArr.length; i++) {
    if (guessArr[i] === targetArr[i]) {
      feedback[i] = 'correct';
      letterCount[guessArr[i]] -= 1;
    }
  }

  for (let i = 0; i < guessArr.length; i++) {
    if (feedback[i] !== 'correct' && letterCount[guessArr[i]] > 0) {
      feedback[i] = 'present';
      letterCount[guessArr[i]] -= 1;
    }
  }

  return feedback;
};

const QWERTY_ROWS: string[][] = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['guess','z','x','c','v','b','n','m','back'],
];

const App: React.FC = () => {
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [targetWord, setTargetWord] = useState('');

  const [guesses, setGuesses] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<("correct" | "present" | "absent")[][]>([]);
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [revealingIndex, setRevealingIndex] = useState<number | null>(null);
  const [letterStates, setLetterStates] = useState<Record<string, 'correct' | 'present' | 'absent' | undefined>>({});

  // --- Pick a random target word on mount ---
  useEffect(() => {
    setTargetWord(targetWords[Math.floor(Math.random() * targetWords.length)]);
  }, []);

  // --- Reset game ---
  const resetGame = () => {
    setTargetWord(targetWords[Math.floor(Math.random() * targetWords.length)]);
    setGuesses([]);
    setFeedbacks([]);
    setInput('');
    setMessage('');
    setGameOver(false);
    setRevealingIndex(null);
    setLetterStates({});
  };

  // --- Word validation helper (local first, API fallback) ---
  const validateWord = async (word: string): Promise<boolean> => {
    if (allWords.includes(word)) return true;

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (res.ok) return true;
    } catch (err) {
      console.error("Dictionary API error", err);
      // Optional: could choose to allow word on API failure
    }

    return false;
  };

  // --- Keyboard input handling ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || revealingIndex !== null) return;
      const rawKey = e.key.toLowerCase();
      const mappedKey = rawKey === 'enter' ? 'guess' : rawKey === 'backspace' ? 'back' : rawKey;
      setPressedKey(mappedKey);
      setTimeout(() => setPressedKey(null), 150);
      if (mappedKey === 'guess') handleLetterClick('guess');
      else if (mappedKey === 'back') handleLetterClick('back');
      else if (/^[a-z]$/.test(mappedKey)) handleLetterClick(mappedKey);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, revealingIndex, input, targetWord]);

  // --- Updated async handler ---
  const handleLetterClick = async (key: string) => {
    if (gameOver || revealingIndex !== null) return;
    if (key === 'guess') {
      if (input.length !== 6) {
        setMessage('Guess must be 6 letters.');
        return;
      }

      const isValid = await validateWord(input);
      if (!isValid) {
        setMessage('Not a valid word.');
        return;
      }

      const feedback = getFeedback(input, targetWord);
      if (!gameOver) setGuesses(prev => [...prev, input]);
      setFeedbacks(prev => [...prev, feedback]);

      const newLetterStates = { ...letterStates };
      input.split('').forEach((char, idx) => {
        const fb = feedback[idx];
        if (fb === 'correct') newLetterStates[char] = 'correct';
        else if (fb === 'present' && newLetterStates[char] !== 'correct') newLetterStates[char] = 'present';
        else if (!newLetterStates[char]) newLetterStates[char] = 'absent';
      });
      setTimeout(() => {
        setLetterStates(newLetterStates);
      }, 6 * 300 + 200);

      input.split('').forEach((_, idx) => {
        setTimeout(() => setRevealingIndex(idx), idx * 300);
      });

      setTimeout(() => {
        setRevealingIndex(null);
        setInput('');
        if (input === targetWord) {
          confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
          setMessage("You got it!");
          setGameOver(true);
        } else if (guesses.length + 1 >= MAX_GUESSES) {
          document.body.classList.add('shake');
          setTimeout(() => document.body.classList.remove('shake'), 1000);
          setMessage(`Out of guesses! The word was ${targetWord.toUpperCase()}.`);
          setGameOver(true);
        }
      }, 6 * 300 + 200);

      setMessage('');
      return;
    }
    if (key === 'back') {
      setInput(prev => prev.slice(0, -1));
      return;
    }
    if (/^[a-z]$/.test(key) && input.length < 6) {
      setInput(prev => prev + key);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: 20, backgroundColor: '#121212', minHeight: '100vh' }}>
      <style>{`
        .flip { animation: flip 0.6s cubic-bezier(0.4, 0.2, 0.2, 1); transform-style: preserve-3d; backface-visibility: hidden; }
        @keyframes flip { 0% { transform: perspective(600px) rotateX(0); } 50% { transform: perspective(600px) rotateX(90deg); } 100% { transform: perspective(600px) rotateX(0); } }
        .shake { animation: shake 0.5s ease-in-out; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 50% { transform: translateX(10px); } 75% { transform: translateX(-10px); } }
      `}</style>

      <h1 style={{ color: '#eee', fontSize: 'min(8vw, 32px)' }}>Sixle</h1>

      {/* Grid */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {[...Array(MAX_GUESSES)].map((_, rowIdx) => (
          <div key={rowIdx} style={{ display: 'flex', justifyContent: 'center', margin: '0.5vw' }}>
            {[...Array(6)].map((_, colIdx) => {
              const isCurrentRow = rowIdx === guesses.length;
              const letter =
                guesses[rowIdx]?.[colIdx] ??
                (isCurrentRow && guesses.length === feedbacks.length && revealingIndex === null ? input[colIdx] : '');
              const feedback = feedbacks[rowIdx]?.[colIdx] || 'absent';
              const bg =
                rowIdx < guesses.length
                  ? (rowIdx === guesses.length - 1 && revealingIndex !== null && colIdx > revealingIndex
                      ? '#111'
                      : feedback === 'correct'
                      ? '#6aaa64'
                      : feedback === 'present'
                      ? '#c9b458'
                      : '#787c7e')
                  : '#111';
              const isFlipping = rowIdx === guesses.length - 1 && colIdx === revealingIndex;
              return (
                <div
                  key={colIdx}
                  className={isFlipping ? 'flip' : ''}
                  style={{
                    width: 'min(12vw, 40px)',
                    height: 'min(12vw, 40px)',
                    margin: '0.5vw',
                    backgroundColor: bg,
                    color: '#eee',
                    border: '1px solid #444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: 'min(6vw, 24px)',
                    borderRadius: 6,
                    transition: 'background-color 0.3s ease',
                  }}
                >
                  {letter ? letter.toUpperCase() : ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Keyboard */}
      <div style={{ marginTop: 20, maxWidth: 600, marginInline: 'auto' }}>
        {QWERTY_ROWS.map((row, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1vw',
              flexWrap: 'nowrap',
            }}
          >
            {row.map(key => {
              const bgState = letterStates[key];
              const isPressed = pressedKey === key;
              const baseColor =
                key === 'guess'
                  ? '#6aaa64'
                  : key === 'back'
                  ? '#c9b458'
                  : bgState === 'correct'
                  ? '#6aaa64'
                  : bgState === 'present'
                  ? '#c9b458'
                  : bgState === 'absent'
                  ? '#000'
                  : '#555';

              return (
                <button
                  key={key}
                  onMouseDown={() => setPressedKey(key)}
                  onMouseUp={() => setPressedKey(null)}
                  onMouseLeave={() => setPressedKey(null)}
                  onClick={() => handleLetterClick(key)}
                  style={{
                    width: key === 'guess' || key === 'back'
                      ? 'min(20vw, 70px)'   // Enter/Back special keys
                      : 'min(12vw, 44px)', // all regular keys
                    height: 'min(12vw, 44px)',
                    margin: '0.5vw',
                    backgroundColor: baseColor,
                    transform: isPressed ? 'translate(1px, 1px)' : 'none',
                    color: '#eee',
                    border: '1px solid #333',
                    borderRadius: 4,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontSize: 'min(5vw, 16px)',
                  }}
                >
                  {key === 'guess' ? 'Enter' : key === 'back' ? 'Back' : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {gameOver && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={resetGame}
            style={{
              padding: '10px 20px',
              backgroundColor: '#444',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 'min(5vw, 18px)',
            }}
          >
            New Game
          </button>
        </div>
      )}

      <div style={{ marginTop: 16, color: '#f5793a', minHeight: 24, fontSize: 'min(5vw, 16px)' }}>{message}</div>
    </div>
  );
};

function lightenColor(color: string, percent: number) {
  const num = parseInt(color.replace('#',''),16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt,
        B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R<255?R<1?0:R:255)*0x10000 +
    (G<255?G<1?0:G:255)*0x100 +
    (B<255?B<1?0:B:255)
  ).toString(16).slice(1);
}

export default App;

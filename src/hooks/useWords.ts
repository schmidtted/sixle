import { useEffect, useState } from 'react';
import { fetchWords } from '../utils/fetchWords';

const useWords = () => {
    const [words, setWords] = useState<string[]>([]);
    const [usedWords, setUsedWords] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadWords = async () => {
            const fetchedWords = await fetchWords();
            setWords(fetchedWords);
        };

        loadWords();
    }, []);

    const getNextWord = () => {
        const availableWords = words.filter(word => !usedWords.has(word));
        if (availableWords.length === 0) {
            return null;
        }
        const nextWord = availableWords[Math.floor(Math.random() * availableWords.length)];
        setUsedWords(prev => new Set(prev).add(nextWord));
        return nextWord;
    };

    return { getNextWord, usedWords: Array.from(usedWords) };
};

export default useWords;
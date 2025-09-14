    import React from 'react';
import { Word } from '../types';

interface WordListProps {
  words: Word[];
}

const WordList: React.FC<WordListProps> = ({ words }) => (
  <ul>
    {words.map(w => (
      <li key={w.id}>{w.word}</li>
    ))}
  </ul>
);

export default WordList;
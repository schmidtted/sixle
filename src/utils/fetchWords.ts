import axios from 'axios';

const API_URL = 'https://api.datamuse.com/words?sp=??????&max=1000';

export const fetchWords = async (): Promise<string[]> => {
    try {
        const response = await axios.get<{ word: string }[]>(API_URL);
        // Datamuse returns objects with a 'word' property
        return response.data.map(obj => obj.word);
    } catch (error) {
        console.error('Error fetching words:', error);
        return [];
    }
};
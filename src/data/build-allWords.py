import json
from wordfreq import top_n_list

# get top 50k English words by frequency
words = top_n_list("en", 50000)

# keep only alphabetic, lowercase, 6-letter words
six_letter_words = sorted({w.lower() for w in words if w.isalpha() and len(w) == 6})

# save to allWords.json
with open("allWords.json", "w") as f:
    json.dump(six_letter_words, f, indent=2)

print(f"✅ Created allWords.json with {len(six_letter_words)} words")

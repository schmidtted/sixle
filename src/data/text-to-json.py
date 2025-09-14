import json
import os

def convert_txt_to_json(txt_file, json_file):
    if not os.path.exists(txt_file):
        print(f"❌ {txt_file} not found")
        return
    with open(txt_file, "r") as f:
        words = [w.strip().lower() for w in f if w.strip()]
    with open(json_file, "w") as f:
        json.dump(words, f, indent=2)
    print(f"✅ Converted {len(words)} words from {txt_file} → {json_file}")

if __name__ == "__main__":
    convert_txt_to_json("allWords.txt", "allWords.json")
    convert_txt_to_json("targetWords.txt", "targetWords.json")

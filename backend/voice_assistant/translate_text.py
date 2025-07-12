from googletrans import Translator
from langdetect import detect

translator = Translator()

def detect_language(text):
    return detect(text)

def translate_to_english(text):
    detected_lang = detect_language(text)
    translated = translator.translate(text, src=detected_lang, dest='en')
    return translated.text, detected_lang

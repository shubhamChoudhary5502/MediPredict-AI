from gtts import gTTS
import uuid
import os

def text_to_speech(text, lang_code='hi'):
    filename = f"{uuid.uuid4()}.mp3"
    tts = gTTS(text=text, lang=lang_code)
    tts.save(filename)
    return filename

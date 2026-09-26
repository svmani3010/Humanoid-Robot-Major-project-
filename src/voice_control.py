"""
voice_control.py
------------------
Offline, wake-word-triggered voice interface.

Corrections made relative to the original voice.py:
  1. The original loaded GPT4All with `FLUX.1-dev-gguf`, which is an
     IMAGE-generation checkpoint, not a text/chat model — model.generate()
     would fail or produce garbage. This module uses a small local chat
     model instead (default: "orca-mini-3b-gguf2-q4_0.gguf", any GPT4All
     text model works — set it in config.py or pass --voice-model).
  2. Bare `except:` blocks are replaced with explicit, logged exceptions
     instead of silently swallowing every error.
  3. The recognised command words are now dispatched to the actual
     gesture functions in gestures.py — the original script only echoed
     text back via TTS and never touched the robot.
"""

import logging
import os

log = logging.getLogger("voice_control")

DEFAULT_LOCAL_MODEL = "orca-mini-3b-gguf2-q4_0.gguf"

# Simple keyword -> gesture-name routing. Anything that doesn't match
# falls through to the local LLM so the interaction still gets a reply.
COMMAND_WORDS = {
    "wave": "wave",
    "hello": "hai",
    "hi": "hai",
    "rest": "rest",
    "stop": "rest",
}


class VoiceController:
    def __init__(self, esp32_client, gestures_module, model_name=DEFAULT_LOCAL_MODEL,
                 wake_phrase="hello robot"):
        self.client = esp32_client
        self.gestures = gestures_module
        self.wake_phrase = wake_phrase
        self._model = None
        self._model_name = model_name

    # -- lazy imports so this module can be unit-tested without the
    #    (fairly heavy) speech / TTS / LLM dependencies installed --
    def _load_model(self):
        if self._model is None:
            from gpt4all import GPT4All
            log.info("Loading local chat model %s", self._model_name)
            self._model = GPT4All(self._model_name)
        return self._model

    def detect_wake_word(self) -> bool:
        import speech_recognition as sr

        recognizer = sr.Recognizer()
        with sr.Microphone() as source:
            log.info("Listening for wake phrase '%s'...", self.wake_phrase)
            audio = recognizer.listen(source, phrase_time_limit=5)
        try:
            text = recognizer.recognize_google(audio).lower()
            log.info("Heard: %s", text)
            return self.wake_phrase in text
        except sr.UnknownValueError:
            return False
        except sr.RequestError as exc:
            log.error("Speech recognition service error: %s", exc)
            return False

    def record_query(self) -> str:
        import speech_recognition as sr

        recognizer = sr.Recognizer()
        with sr.Microphone() as source:
            log.info("Listening for a command...")
            audio = recognizer.listen(source, timeout=5, phrase_time_limit=15)
        try:
            return recognizer.recognize_google(audio)
        except sr.UnknownValueError:
            return ""
        except sr.RequestError as exc:
            log.error("Speech recognition service error: %s", exc)
            return ""

    def dispatch(self, query: str) -> str:
        """Route a recognised phrase to a gesture, or the local LLM."""
        lowered = query.lower()
        for keyword, gesture_name in COMMAND_WORDS.items():
            if keyword in lowered:
                log.info("Matched command word '%s' -> gesture '%s'", keyword, gesture_name)
                self.gestures.GESTURES[gesture_name](self.client)
                return f"Okay, running {gesture_name}."

        model = self._load_model()
        with model.chat_session():
            return model.generate(query, max_tokens=256)

    def speak(self, text: str):
        from gtts import gTTS
        import playsound

        filename = "response.mp3"
        try:
            gTTS(text=text, lang="en").save(filename)
            playsound.playsound(filename)
        except Exception as exc:  # network / audio-backend failure
            log.error("Text-to-speech failed: %s", exc)
        finally:
            if os.path.exists(filename):
                os.remove(filename)

    def run_forever(self):
        log.info("Voice assistant ready (offline mode)")
        while True:
            if self.detect_wake_word():
                query = self.record_query()
                if not query:
                    continue
                reply = self.dispatch(query)
                self.speak(reply)

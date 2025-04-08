from .banned_words import BANNED_WORDS

def filter_banned_words(text):
    for word in BANNED_WORDS:
        if word in text.lower():
            return True
    return False

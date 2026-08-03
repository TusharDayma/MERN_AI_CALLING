import sys
import pyttsx3

def main():
    if len(sys.argv) < 3:
        return
    text = sys.argv[1]
    filepath = sys.argv[2]
    
    engine = pyttsx3.init()
    rate = engine.getProperty('rate')
    engine.setProperty('rate', max(rate - 20, 150))
    engine.save_to_file(text, filepath)
    engine.runAndWait()

if __name__ == "__main__":
    main()

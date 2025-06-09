// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import './App.css'; // App bileşeni için stiller

function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Click "Speak Word" to start.');

  const recognitionRef = useRef(null);

  useEffect(() => {
    console.log("useEffect: Initializing SpeechRecognition (should run once).");
    if (!('webkitSpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser.');
      setStatus('Speech recognition not supported.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log("Recognition: onstart");
      setIsListening(true);
      setStatus('Listening...');
      setTranscribedText('');
      setResults(null);
      setError('');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log("Recognition: onresult - Transcript:", transcript);
      setTranscribedText(transcript); // Önce transkripti set et, sonra API'yi çağır
      fetchWordInfo(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Recognition: onerror - Error object:", event);
      let errorMessage = `Speech recognition error: ${event.error}`;
      if (event.error === 'no-speech') {
        errorMessage = 'No speech was detected. Please try again.';
      } else if (event.error === 'audio-capture') {
        errorMessage = 'Microphone problem. Ensure it is enabled and not in use.';
      } else if (event.error === 'not-allowed') {
        errorMessage = 'Microphone access denied. Please allow microphone access for this extension.';
      }
      setError(errorMessage);
      setStatus(errorMessage); // onerror olduğunda status'u da güncelle
      // setIsListening(false) onend'de olacak, ama onerror da bir bitiş sayılır.
      // Eğer onend her zaman tetikleniyorsa, orada bırakmak daha iyi.
    };

    recognition.onend = () => {
      console.log("Recognition: onend.");
      setIsListening(false);
      // `onend` tetiklendiğinde, eğer bir hata yoksa ve sonuçlar varsa,
      // fetchWordInfo içindeki setStatus("Results below...") zaten çalışmış olmalı.
      // Eğer bir hata varsa, onerror içindeki setStatus çalışmış olmalı.
      // Bu yüzden burada status'u tekrar "Click 'Speak Word' to start." yapmak
      // yerine, mevcut duruma göre karar verebiliriz.
      // En basit haliyle, sadece dinleme bittiğinde, eğer bir hata yoksa ve
      // sonuçlar bekleniyorsa (veya geldi ise), durumu ona göre bırakırız.
      // Eğer bir önceki işlemde hata olduysa, status zaten hata mesajını gösteriyor olmalı.
      // Eğer başarılı olduysa, fetchWordInfo status'u güncellemiş olmalı.
      // Eğer konuşma olmadıysa (no-speech), onerror status'u güncellemiş olmalı.
      // Bu yüzden burada status'a dokunmayabiliriz veya daha basit bir şeye çevirebiliriz.
      // Şimdilik, eğer `error` boş değilse ve `results` da yoksa,
      // bir önceki `status` kalsın. Yoksa "Click..." diyelim.
      // Bu kısım iyileştirilebilir. Temel amaç setIsListening(false).
      if (!error && !results && !transcribedText) { // Eğer işlem yarıda kesildiyse veya hiç başlamadıysa
        setStatus('Click "Speak Word" to start.');
      } else if (error) {
        // Zaten setError ve setStatus onerror içinde yapıldı.
      } else if (results) {
        // Zaten fetchWordInfo içinde setStatus("Results below...") yapılacak.
      }
    };

    recognitionRef.current = recognition;

    return () => {
      console.log("useEffect cleanup: Stopping recognition and removing listeners.");
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, []); // <-- BAĞIMLILIK DİZİSİ BOŞ! Sadece bir kez çalışacak.

  const handleSpeakClick = () => {
    console.log("handleSpeakClick called. isListening:", isListening);
    if (!recognitionRef.current) {
      setError('Speech recognition is not initialized.');
      console.error("Recognition ref is null in handleSpeakClick!");
      return;
    }

    if (isListening) {
      console.log("handleSpeakClick: Stopping current recognition.");
      recognitionRef.current.stop();
    } else {
      console.log("handleSpeakClick: Starting new recognition.");
      setError('');       // Önceki hataları temizle
      setResults(null);   // Önceki sonuçları temizle
      setTranscribedText(''); // Önceki transkripti temizle
      setStatus('Initializing...');

      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error in handleSpeakClick while trying to start recognition:", e);
        setError("Could not start recognition. Error: " + e.message);
        setIsListening(false);
        setStatus('Error starting. Try again.');
      }
    }
  };

  const fetchWordInfo = async (word) => {
    if (!word) return;
    console.log(`fetchWordInfo called for word: "${word}"`);
    setStatus(`Fetching definition for "${word}"...`);
    setResults(null); // API isteği başlarken sonuçları temizle

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Word "${word}" not found in the dictionary.`);
        }
        const errorData = await response.json().catch(() => ({ title: "Unknown API error" }));
        throw new Error(`API Error: ${response.status} - ${errorData.title || response.statusText}`);
      }
      const data = await response.json();
      console.log("fetchWordInfo: Data received from API", data);
      setResults(data);
      setError(''); // API başarılı ise önceki hataları temizle
      setStatus('Results below. Click "Speak Word" for another.'); // API başarılı olunca status'u güncelle
    } catch (err) {
      console.error('Error fetching word info:', err);
      setError(err.message);
      setResults(null);
      setStatus('Failed to fetch definition. Try again.'); // API hatasında status'u güncelle
    }
  };

  // Kullanıcı Arayüzü (JSX)
  return (
    <div className="App">
      <header className="App-header">
        <h1>Synona</h1>
        <button onClick={handleSpeakClick} disabled={isListening}>
          {isListening ? 'Listening...' : (error && error.includes('denied') ? 'Allow Mic & Retry' : 'Speak Word')}
        </button>
        <p className="status-text">{status}</p>
        {error && <p className="error-message">{error}</p>}
        {/* "You said:" mesajını sadece dinleme bittikten ve hata yokken gösterelim */}
        {transcribedText && !error && !isListening && <p className="transcribed-text">You said: <strong>{transcribedText}</strong></p>}
      </header>

      <main className="results-container">
        {/* Yükleniyor durumu: API'den cevap beklenirken */}
        {status.startsWith("Fetching definition for") && (
            <p className="loading-text">{status}</p>
        )}

        {results && results.length > 0 && (
          results.map((entry, index) => (
            <div key={index} className="result-entry">
              <h2>{entry.word}</h2>
              {entry.phonetics && entry.phonetics.length > 0 && entry.phonetics.find(p => p.text) && (
                <p className="phonetic-text"><em>Phonetic: {entry.phonetics.find(p => p.text).text}</em></p>
              )}
              {entry.meanings.map((meaning, mIndex) => (
                <div key={mIndex} className="meaning-block">
                  <p><strong>({meaning.partOfSpeech})</strong></p>
                  <ul>
                    {meaning.definitions.map((def, dIndex) => (
                      <li key={dIndex}>
                        {def.definition}
                        {def.example && <><br /><em>e.g., "{def.example}"</em></>}
                      </li>
                    ))}
                  </ul>
                  {meaning.synonyms && meaning.synonyms.length > 0 && (
                    <p><strong>Synonyms:</strong> {meaning.synonyms.join(', ')}</p>
                  )}
                  {meaning.antonyms && meaning.antonyms.length > 0 && (
                    <p><strong>Antonyms:</strong> {meaning.antonyms.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
        {results && results.length === 0 && !error && ( // Kelime bulundu ama API boş sonuç döndürdü (veya 404 değilse)
            <p>No definition found for "<strong>{transcribedText}</strong>". It might be a very specific term or misspelled.</p>
        )}
      </main>
    </div>
  );
}

export default App;
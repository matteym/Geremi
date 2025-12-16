import React, { useState, useEffect, useRef } from "react";

function formatText(text) {
  // Découpe par blocs (paragraphes ou listes)
  const lines = text.split("\n");
  
  return lines.map((line, idx) => {
    // Titres ###
    if (line.startsWith("### ")) {
      return (
        <h3
          key={idx}
          style={{ margin: "14px 0 8px", fontSize: "19px", fontWeight: "700" }}
        >
          {parseInline(line.replace("### ", ""))}
        </h3>
      );
    }
    // Listes à puces * ou -
    if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
      return (
        <li key={idx} style={{ marginLeft: "20px", marginBottom: "4px" }}>
          {parseInline(line.replace(/^[\*\-]\s/, ""))}
        </li>
      );
    }
    // Paragraphe vide
    if (!line.trim()) {
      return <div key={idx} style={{ height: "8px" }} />;
    }
    // Paragraphe normal
    return (
      <p key={idx} style={{ margin: "0 0 6px", lineHeight: "1.6" }}>
        {parseInline(line)}
      </p>
    );
  });
}

// Fonction simple pour gérer le **gras**
function parseInline(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function MessageBubble({ role, text }) {
  const isUser = role === "user";
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef(null);

  // Arrêter la lecture si le composant est démonté
  useEffect(() => {
    return () => {
      // On n'arrête pas forcément tout le synthétiseur global car l'utilisateur peut vouloir continuer à écouter en scrollant
      // Mais pour éviter les fuites mémoire ou états incohérents, on peut reset l'état local
    };
  }, []);

  const handleSpeak = () => {
    const synth = window.speechSynthesis;

    // Si c'est ce message qui est en cours de lecture
    if (isPlaying) {
      if (isPaused) {
        synth.resume();
        setIsPaused(false);
      } else {
        synth.pause();
        setIsPaused(true);
      }
      return;
    }

    // Nouvelle lecture
    synth.cancel(); // On coupe ce qui parlait avant

    // Nettoyage sommaire du markdown pour la lecture
    const cleanText = String(text)
      .replace(/\*\*/g, "") // Enlever les gras
      .replace(/###/g, "") // Enlever les titres
      .replace(/[\-\*]\s/g, ""); // Enlever les puces

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "fr-FR";
    utterance.rate = 1.1; // Plus rapide et dynamique
    utterance.pitch = 1.0; // Ton normal

    // Essayer de trouver une voix masculine française de qualité supérieure
    const voices = synth.getVoices();
    // On cherche d'abord spécifiquement "Google français" ou "Google French"
    const googleVoice = voices.find(v => v.name.includes("Google") && (v.name.includes("français") || v.name.includes("Français") || v.name.includes("French")));
    // Sinon une voix Premium/Enhanced
    const premiumVoice = voices.find(v => v.lang.includes("fr") && (v.name.includes("Premium") || v.name.includes("Enhanced")));
    // Sinon une voix masculine standard
    const maleVoice = voices.find(v => v.lang.includes("fr") && (v.name.includes("Thomas") || v.name.includes("Male")));
    
    if (googleVoice) {
      utterance.voice = googleVoice;
    } else if (premiumVoice) {
      utterance.voice = premiumVoice;
    } else if (maleVoice) {
      utterance.voice = maleVoice;
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          maxWidth: "85%",
          background: isUser
            ? "linear-gradient(135deg, #e6c97f, #cfa945)"
            : "#ffffff",
          color: "#2b2115",
          padding: "14px 18px",
          borderRadius: "16px",
          border: isUser ? "1px solid #cfa945" : "1px solid #e6ddc4",
          boxShadow: isUser
            ? "0 8px 18px rgba(207,169,69,0.25)"
            : "0 4px 12px rgba(0,0,0,0.05)",
          fontSize: "18px",
          position: "relative", // Pour positionner le bouton play
        }}
      >
        {/* Si c'est du JSX (React Element) ou si ce n'est pas une string, on l'affiche direct */}
        {React.isValidElement(text) ? (
          <div>{text}</div>
        ) : isUser ? (
          <p style={{ margin: 0 }}>{text}</p>
        ) : (
          <>
            <div>{formatText(String(text))}</div>
            
            {/* Bouton de lecture pour l'IA */}
            <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={handleSpeak}
                style={{
                  background: "transparent",
                  border: "1px solid #e6ddc4",
                  borderRadius: "20px",
                  padding: "6px 12px",
                  fontSize: "14px",
                  cursor: "pointer",
                  color: "#8a6a1c",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "600"
                }}
              >
                {isPlaying && !isPaused ? (
                  <>⏸️ Pause</>
                ) : isPlaying && isPaused ? (
                  <>▶️ Reprendre</>
                ) : (
                  <>🔊 Écouter</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;

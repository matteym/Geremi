import React from "react";

function formatText(text) {
  // Découpe par blocs (paragraphes ou listes)
  const lines = text.split("\n");
  
  return lines.map((line, idx) => {
    // Titres ###
    if (line.startsWith("### ")) {
      return (
        <h3
          key={idx}
          style={{ margin: "12px 0 6px", fontSize: "16px", fontWeight: "700" }}
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
      <p key={idx} style={{ margin: "0 0 4px", lineHeight: "1.5" }}>
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
          fontSize: "15px",
        }}
      >
        {isUser ? (
          <p style={{ margin: 0 }}>{text}</p>
        ) : (
          <div>{formatText(text)}</div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;


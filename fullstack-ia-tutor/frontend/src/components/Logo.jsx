import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

function Logo({ size = 140, imageSrc = "/geremi.jpg" }) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [viewed, setViewed] = useState(false);

  useEffect(() => {
    const hasViewed = localStorage.getItem("story_viewed");
    if (hasViewed) setViewed(true);
  }, []);

  const handleClick = () => {
    setIsVideoOpen(true);
    setViewed(true);
    localStorage.setItem("story_viewed", "true");
  };

  const handleClose = () => {
    setIsVideoOpen(false);
  };

  const ringColor = viewed ? "#e5e7eb" : "#cfa945"; // Gris si vu, Or si nouveau

  return (
    <>
      <div
        onClick={handleClick}
        className={`logo-container ${!viewed ? "story-glow" : ""}`}
        style={{
          "--logo-size": `${size}px`,
          "--ring-color": ringColor,
        }}
      >
        <div
          className="logo-image"
          style={{ backgroundImage: `url('${imageSrc}')` }}
          aria-label="Geremi 0.3"
          role="img"
        />
      </div>

      {/* PORTAL VIDÉO */}
      {isVideoOpen &&
        ReactDOM.createPortal(
          <div style={modalStyles.overlay} onClick={handleClose}>
            <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
              <video
                src="/presentation.mov"
                autoPlay
                style={modalStyles.video}
                onEnded={handleClose}
                controls={false}
                playsInline
              />
              <button onClick={handleClose} style={modalStyles.closeButton}>
                ✕
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    backdropFilter: "blur(5px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  content: {
    position: "relative",
    width: "90%",
    maxWidth: "500px", // Format vertical type story
    aspectRatio: "9/16",
    backgroundColor: "#000",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 0 40px rgba(207,169,69,0.5)",
    border: "2px solid #cfa945",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  closeButton: {
    position: "absolute",
    top: "15px",
    right: "15px",
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default Logo;

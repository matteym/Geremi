import React from "react";

function Logo({ size = 140 }) {
  const borderSize = Math.max(4, Math.round(size * 0.06));

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        position: "relative",
        border: `${borderSize}px solid #cfa945`,
        boxShadow: "0 12px 28px rgba(207,169,69,0.35)",
        backgroundImage: "url('/geremi.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "saturate(1) contrast(1.05)",
      }}
      aria-label="Geremi 0.3"
      role="img"
    />
  );
}

export default Logo;


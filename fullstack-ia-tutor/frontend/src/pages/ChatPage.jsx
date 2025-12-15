import React from "react";
import ChatWindow from "../components/ChatWindow.jsx";

function ChatPage() {
  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <ChatWindow />
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8f5ec, #f3ebd8)",
    padding: "32px 16px",
    color: "#2b2115",
  },
  shell: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
};

export default ChatPage;


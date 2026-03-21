import React from "react";

// Placeholder — actual MarkdownRenderer is in App.jsx
// Will be properly extracted as a shared component
export default function MarkdownRenderer({ text }) {
  if (!text) return null;
  return <div style={{whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{text}</div>;
}

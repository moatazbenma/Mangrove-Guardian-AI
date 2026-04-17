import React from "react";

export function TestPage() {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Test Page - If you see this, the app is working!</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

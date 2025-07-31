import { useState } from "react";

const Test = () => {
  const [counter, setCounter] = useState(0);
  return (
    <button onClick={() => setCounter(counter + 1)}>Test {counter}</button>
  );
};

export { Test };

import { useState } from "react";
import FileUpload from "./components/FileUpload";
import FileList from "./components/FileList";
import { vtk_backend } from "declarations/vtk_backend";
import { Button } from "@/components/ui/button";

function App() {
  const [greeting, setGreeting] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const name = event.target.elements.name.value;
    vtk_backend.greet(name).then((greeting) => {
      setGreeting(greeting);
    });
    return false;
  }

  return (
    <main>
      <img src="/logo2.svg" alt="DFINITY logo" />
      <br />
      <br />
      <form action="#" onSubmit={handleSubmit}>
        <label htmlFor="name">Enter your name: &nbsp;</label>
        <input id="name" alt="Name" type="text" />
        <button type="submit">Click Me!</button>
      </form>
      <section id="greeting">{greeting}</section>
      <FileUpload />
      <FileList />
      <div class="bg-blue-500 text-white text-xl p-4 rounded">✅ Tailwind is working!</div>
      <Button>Click me</Button>
    </main>
  );
}

export default App;

import { useState } from 'react';

function App() {
  const [items, setItems] = useState(['Erstes Element', 'Zweites Element']);
  const [value, setValue] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setItems((current) => [...current, trimmed]);
    setValue('');
  };

  const handleRemove = (index) => {
    setItems((current) => current.filter((_, i) => i !== index));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>React MVP</h1>
        <p>Ein einfacher Start für dein WebEng2-MVP.</p>
      </header>

      <form className="note-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Neues Element hinzufügen"
        />
        <button type="submit">Hinzufügen</button>
      </form>

      <section className="note-list">
        <h2>Elemente</h2>
        <ul>
          {items.map((item, index) => (
            <li key={index} className="note-item">
              <span>{item}</span>
              <button onClick={() => handleRemove(index)}>Entfernen</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default App;

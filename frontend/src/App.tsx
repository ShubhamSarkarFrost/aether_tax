function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1 text-sm text-emerald-300">
          React + Vite + Tailwind CSS
        </p>
        <h1 className="text-4xl font-bold sm:text-5xl">Frontend Boilerplate Ready</h1>
        <p className="max-w-2xl text-slate-300">
          Start building your UI in <code>src/App.tsx</code>. This project is configured
          with Tailwind and ready to connect with your Express backend.
        </p>
        <a
          href="http://localhost:5000/api/health"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-400"
        >
          Check Backend Health Endpoint
        </a>
      </section>
    </main>
  );
}

export default App;

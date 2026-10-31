"use client";
import { useState } from "react";

const PLATFORMS = [["etsy", "Etsy"], ["shopify", "Shopify"], ["ebay", "eBay"], ["temu", "Temu"]];

export default function Home() {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [picked, setPicked] = useState(["etsy", "shopify", "ebay", "temu"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const toBase64 = (f) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1]);
    r.onerror = () => rej(new Error("Could not read the photo."));
    r.readAsDataURL(f);
  });

  async function generate() {
    setError(""); setResult(null);
    if (!file) return setError("Add a product photo first.");
    if (file.size > 4 * 1024 * 1024) return setError("Photo is over 4 MB. Use a smaller one.");
    if (!picked.length) return setError("Pick at least one platform.");
    setBusy(true);
    try {
      const image = await toBase64(file);
      const r = await fetch("/api/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, mediaType: file.type, notes, platforms: picked }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Something went wrong. Try again.");
      setResult(data);
    } catch (e) { setError(e.message); }
    setBusy(false);
  }

  const copy = (p) => navigator.clipboard.writeText(`${p.title}\n\n${p.description}\n\n${(p.keywords || []).join(", ")}`);

  return (
    <main>
      <h1>SellerDesk</h1>
      <p className="sub">One photo in. Listings for Etsy, Shopify, eBay and Temu out.</p>
      <section className="panel">
        <label htmlFor="photo">Product photo</label>
        <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files[0] || null)} />
        <div style={{ height: 14 }} />
        <label htmlFor="notes">Details (optional)</label>
        <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Material, size, scent, who it's for" />
        <div className="checks">
          {PLATFORMS.map(([id, name]) => (
            <label key={id}><input type="checkbox" checked={picked.includes(id)} onChange={() => toggle(id)} /> {name}</label>
          ))}
        </div>
        <button onClick={generate} disabled={busy}>{busy ? "Writing listings…" : "Write my listings"}</button>
        {error && <p className="err" role="alert">{error}</p>}
      </section>
      {result && PLATFORMS.filter(([id]) => result[id]).map(([id, name]) => (
        <section className="panel" key={id}>
          <div className="row"><strong>{name}</strong><button className="ghost" onClick={() => copy(result[id])}>Copy</button></div>
          <p className="out"><b>{result[id].title}</b></p>
          <p className="out">{result[id].description}</p>
          <p className="kw">{(result[id].keywords || []).join(", ")}</p>
        </section>
      ))}
    </main>
  );
}

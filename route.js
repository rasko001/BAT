const RULES = {
  etsy: "Etsy: title up to 140 characters, 13 tags of max 20 characters each, warm story-led description.",
  shopify: "Shopify: SEO title under 70 characters, meta description under 160 characters first line, clear benefit-led description.",
  ebay: "eBay: title up to 80 characters packed with search keywords, plain factual description with item specifics.",
  temu: "Temu: short keyword-dense title, 5 feature bullet lines, attributes such as material, size and color, no links or contact details.",
};

// Simple daily limit per visitor. In-memory, so it resets when the server restarts.
// Replace with a database counter once you add accounts and Stripe.
const FREE_PER_DAY = 5;
const hits = new Map();

export async function POST(req) {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0];
  const key = ip + new Date().toISOString().slice(0, 10);
  const used = (hits.get(key) || 0) + 1;
  hits.set(key, used);
  if (used > FREE_PER_DAY) {
    return Response.json({ error: `Free limit reached (${FREE_PER_DAY} per day).` }, { status: 429 });
  }

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Bad request." }, { status: 400 }); }
  const { image, mediaType, notes = "", platforms = [] } = body;
  const chosen = platforms.filter((p) => RULES[p]);
  if (!image || !["image/jpeg", "image/png", "image/webp"].includes(mediaType) || !chosen.length || image.length > 6_000_000) {
    return Response.json({ error: "Send a JPG, PNG or WebP photo under 4 MB and pick a platform." }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Server is missing ANTHROPIC_API_KEY." }, { status: 500 });
  }

  const prompt = `Write product listings from this photo.\nSeller notes: ${String(notes).slice(0, 500) || "none"}\n\nPlatform rules:\n${chosen.map((p) => RULES[p]).join("\n")}\n\nReturn ONLY JSON, no markdown. An object keyed by platform id (${chosen.join(", ")}), each value having: "title" (string), "description" (string), "keywords" (array of strings). Do not invent facts you cannot see or were not told.`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-sonnet-5-5",
        max_tokens: 2000,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
          { type: "text", text: prompt },
        ] }],
      }),
    });
    const data = await r.json();
    if (!r.ok) return Response.json({ error: "The AI service had a problem. Try again." }, { status: 502 });
    const text = data.content.filter((c) => c.type === "text").map((c) => c.text).join("");
    return Response.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
  } catch {
    return Response.json({ error: "Could not read the AI reply. Try again." }, { status: 502 });
  }
}

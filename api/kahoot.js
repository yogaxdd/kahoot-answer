// File: api/kahoot.js (Vercel serverless function)

export default async function handler(req, res) {
  const { id, pin } = req.query;

  if (!id && !pin) {
    return res.status(400).json({ error: "Missing 'id' or 'pin' query parameter" });
  }

  try {
    let url = "";

    if (id) {
      // Direct quiz ID
      url = `https://play.kahoot.it/rest/kahoots/${id}`;
    } else if (pin) {
      // PIN challenge
      url = `https://kahoot.it/rest/challenges/pin/${pin}`;
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Kahoot API returned ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: "Internal server error", detail: err.message });
  }
}

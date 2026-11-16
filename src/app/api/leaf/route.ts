/** Leaf photo API — Gemini when GEMINI_API_KEY is set; else checklist hint. */
import { NextResponse } from "next/server";

type Body = {
  mimeType?: string;
  imageBase64?: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const key = process.env.GEMINI_API_KEY?.trim();

  if (!key) {
    return NextResponse.json({
      ok: true,
      mode: "checklist",
      text:
        "No GEMINI_API_KEY configured. Use the on-screen symptom checklist. Advice still ties back to the salinity model on Today / Why.",
    });
  }

  if (!body.imageBase64) {
    return NextResponse.json(
      { ok: false, mode: "error", text: "Missing image" },
      { status: 400 },
    );
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    const prompt = `You help UAE desert farmers. Classify the leaf photo as one of: salt burn, heat stress, water stress, pest/disease, or unclear. Give 2 short sentences of advice. If salt burn, mention leaching / water EC. Plain language.`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: body.mimeType || "image/jpeg",
                  data: body.imageBase64,
                },
              },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({
        ok: false,
        mode: "checklist",
        text: `Gemini error — use checklist. (${res.status}) ${err.slice(0, 200)}`,
      });
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("\n") ||
      "No response";
    return NextResponse.json({ ok: true, mode: "gemini", text });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      mode: "checklist",
      text: `Network error — use checklist. ${e instanceof Error ? e.message : ""}`,
    });
  }
}

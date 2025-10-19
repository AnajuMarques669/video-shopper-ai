// src/services/reviewAIService.ts

export async function getWebReviews(query: string) {
  const url = "https://google.serper.dev/search";
  const apiKey = import.meta.env.VITE_SERPER_API_KEY;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: 5 }),
  });

  const data = await response.json();
  return data.organic || [];
}

export async function summarizeReviewsWithAI(reviews: any[]) {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente que analisa opiniões da web e resume sentimentos em positivo, neutro e negativo.",
        },
        {
          role: "user",
          content: JSON.stringify(reviews.map(r => r.snippet || r.title)),
        },
      ],
      temperature: 0.7,
    }),
  });

  const json = await response.json();
  return json.choices?.[0]?.message?.content || "Não foi possível gerar resumo.";
}


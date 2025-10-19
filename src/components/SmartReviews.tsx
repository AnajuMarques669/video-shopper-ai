import { useEffect, useState } from "react";
import { getWebReviews, summarizeReviewsWithAI } from "../services/reviewAIService";

interface Review {
  title: string;
  link: string;
  snippet: string;
}

export default function SmartReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const query = "video shopper ai avaliações opiniões comentários";
      const found = await getWebReviews(query);
      setReviews(found);

      const summaryText = await summarizeReviewsWithAI(found);
      setSummary(summaryText);
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) return <p className="text-gray-500">Buscando opiniões na web...</p>;

  return (
    <div className="p-6 bg-gray-50 rounded-2xl shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-3">O que estão dizendo na web 🌐</h2>

      <div className="mb-4 bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Resumo da IA 🤖</h3>
        <p className="text-gray-700 whitespace-pre-line">{summary}</p>
      </div>

      <div className="space-y-4">
        {reviews.map((r, i) => (
          <div key={i} className="border p-4 rounded-lg bg-white">
            <a
              href={r.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-semibold hover:underline"
            >
              {r.title}
            </a>
            <p className="text-gray-600 mt-1">{r.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

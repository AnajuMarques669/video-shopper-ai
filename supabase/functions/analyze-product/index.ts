import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl, productDescription } = await req.json();

    if (!videoUrl || !productDescription) {
      return new Response(
        JSON.stringify({ error: 'videoUrl and productDescription are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Analyzing product:', { videoUrl, productDescription });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('AI service not configured');
    }

    // Build comprehensive search query for web search
    const searchQuery = `${productDescription} reviews avaliações opiniões comprar vale a pena`;
    console.log('Search query:', searchQuery);

    // Perform web search to get product reviews and information
    const searchResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: 'tvly-demo-key', // Using demo key for web search
        query: searchQuery,
        search_depth: 'advanced',
        max_results: 5,
      }),
    });

    let searchResults = '';
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('Search results obtained:', searchData.results?.length || 0);
      
      if (searchData.results && searchData.results.length > 0) {
        searchResults = searchData.results
          .map((result: any, index: number) => 
            `Fonte ${index + 1}: ${result.title}\n${result.content}\nURL: ${result.url}\n`
          )
          .join('\n---\n');
      }
    } else {
      console.warn('Search API failed, proceeding without search results');
    }

    // Build the AI prompt with search results
    const systemPrompt = `Você é um assistente especializado em análise de produtos.
Sua tarefa é analisar informações sobre um produto mencionado em um vídeo e fornecer uma recomendação clara sobre a compra.

Instruções:
1. Analise as informações de reviews e avaliações fornecidas
2. Avalie a qualidade geral do produto baseado nas opiniões encontradas
3. Considere aspectos como: qualidade, preço, satisfação dos clientes, problemas relatados
4. Forneça uma recomendação clara: "Recomendo" ou "Não recomendo"
5. Justifique sua recomendação com base nos dados
6. Se houver informações insuficientes, seja honesto sobre isso
7. Use uma linguagem amigável e em português do Brasil

Seja objetivo e útil. Forneça insights valiosos que ajudem na decisão de compra.`;

    const userPrompt = `Vídeo: ${videoUrl}
Produto a ser avaliado: ${productDescription}

${searchResults ? `Informações e reviews encontrados na web:\n${searchResults}` : 'Não foram encontrados reviews específicos. Forneça uma análise geral baseada no produto mencionado.'}

Por favor, analise essas informações e forneça:
1. Um resumo das avaliações encontradas
2. Principais pontos positivos
3. Principais pontos negativos (se houver)
4. Sua recomendação final (Recomendo/Não recomendo/Atenção)
5. Justificativa da recomendação`;

    console.log('Calling Lovable AI...');

    // Call Lovable AI for analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Limite de requisições atingido. Tente novamente em alguns instantes.');
      }
      if (aiResponse.status === 402) {
        throw new Error('Créditos insuficientes. Por favor, adicione créditos ao workspace.');
      }
      
      throw new Error('Erro ao processar análise com IA');
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices?.[0]?.message?.content || 'Não foi possível gerar análise.';

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        analysis,
        videoUrl,
        productDescription,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in analyze-product function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao analisar produto' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

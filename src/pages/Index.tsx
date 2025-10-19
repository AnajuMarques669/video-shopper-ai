import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Video, Loader2, ThumbsUp, ThumbsDown, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  videoUrl?: string;
  productDescription?: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAnalyze = async () => {
    if (!videoUrl.trim() || !productDescription.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o link do vídeo e a descrição do produto.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `Analisar produto do vídeo: ${productDescription}`,
      videoUrl,
      productDescription,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setVideoUrl("");
    setProductDescription("");

    try {
      const { data, error } = await supabase.functions.invoke("analyze-product", {
        body: { videoUrl, productDescription },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.analysis || "Desculpe, não consegui analisar o produto.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error analyzing product:", error);
      toast({
        title: "Erro na análise",
        description: "Ocorreu um erro ao analisar o produto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border backdrop-blur-sm bg-card/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center glow-primary">
              <Video className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">Análise de Produtos</h1>
              <p className="text-sm text-muted-foreground">IA que pesquisa e recomenda produtos de vídeos</p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-4 mb-24">
          {messages.length === 0 && (
            <Card className="p-8 text-center border-2 border-dashed border-border bg-card/50 backdrop-blur-sm animate-fade-in">
              <Video className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse-slow" />
              <h2 className="text-xl font-semibold mb-2">Bem-vindo ao Analisador de Produtos!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Cole o link de um vídeo curto, descreva o produto que deseja avaliar, e nossa IA irá pesquisar
                reviews e opiniões na web para te dar uma recomendação inteligente.
              </p>
            </Card>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              <Card
                className={`max-w-[85%] p-4 ${
                  message.role === "user"
                    ? "bg-primary/10 border-primary/20"
                    : "bg-card border-border shadow-card"
                }`}
              >
                {message.role === "user" ? (
                  <div>
                    <p className="font-medium mb-2">{message.content}</p>
                    {message.videoUrl && (
                      <div className="text-sm text-muted-foreground space-y-1 mt-2 pt-2 border-t border-border">
                        <p className="flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          <span className="truncate">{message.videoUrl}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="prose prose-invert max-w-none">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.content.toLowerCase().includes("recomendo") && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <ThumbsUp className="w-4 h-4 text-accent" />
                        <span className="text-sm font-medium text-accent">Recomendado</span>
                      </div>
                    )}
                    {message.content.toLowerCase().includes("não recomendo") && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <ThumbsDown className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">Não Recomendado</span>
                      </div>
                    )}
                    {(message.content.toLowerCase().includes("cuidado") ||
                      message.content.toLowerCase().includes("atenção")) && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <AlertCircle className="w-4 h-4 text-warning" />
                        <span className="text-sm font-medium text-warning">Atenção</span>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <Card className="max-w-[85%] p-4 bg-card border-border">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-muted-foreground">Analisando produto e buscando reviews...</span>
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border backdrop-blur-md bg-background/80">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <Card className="p-4 bg-card/90 backdrop-blur-sm border-border shadow-card">
            <div className="space-y-3">
              <Input
                placeholder="Cole o link do vídeo aqui (YouTube, TikTok, Instagram...)"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={isLoading}
                className="bg-input border-border focus-visible:ring-primary transition-smooth"
                onKeyPress={handleKeyPress}
              />
              <div className="flex gap-2">
                <Textarea
                  placeholder="Descreva o produto que você quer avaliar (ex: tênis Nike Air Max preto)"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  disabled={isLoading}
                  className="bg-input border-border focus-visible:ring-primary transition-smooth resize-none"
                  rows={2}
                  onKeyPress={handleKeyPress}
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={isLoading || !videoUrl.trim() || !productDescription.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary transition-smooth"
                  size="lg"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;

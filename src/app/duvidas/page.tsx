"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, MessageCircle, HelpCircle, Send, Copy, Mail } from "lucide-react";

export default function DuvidasPage() {
  const router = useRouter();
  const [tipo, setTipo] = useState<"duvida" | "sugestao">("duvida");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");

  const voxWhatsappUrl = process.env.NEXT_PUBLIC_VOX_WHATSAPP_URL || "https://api.whatsapp.com/send/";
  const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5573982458991").replace(/[^0-9]/g, "");
  const suporteEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "joeltere8@gmail.com";

  const texto = useMemo(() => {
    const partes = [
      tipo === "duvida" ? "Dúvida" : "Sugestão",
      assunto ? `Assunto: ${assunto}` : undefined,
      nome ? `Nome: ${nome}` : undefined,
      email ? `Email: ${email}` : undefined,
      mensagem ? `Mensagem: ${mensagem}` : undefined,
    ].filter(Boolean);
    return partes.join("\n");
  }, [tipo, assunto, nome, email, mensagem]);

  const buildWhatsAppUrl = () => {
    const text = encodeURIComponent(texto || "Olá, tenho uma dúvida/sugestão.");
    try {
      const url = new URL(voxWhatsappUrl);
      if (url.host.includes("wa.me") || url.host.includes("whatsapp")) {
        return `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${decodeURIComponent(text)}&type=phone_number&app_absent=0`;
      }
      url.searchParams.set("phone", whatsappNumber);
      url.searchParams.set("text", decodeURIComponent(text));
      url.searchParams.set("type", "phone_number");
      url.searchParams.set("app_absent", "0");
      return url.toString();
    } catch {
      return `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${text}&type=phone_number&app_absent=0`;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {}
  };

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(`[VoxCash] ${tipo === "duvida" ? "Dúvida" : "Sugestão"}${assunto ? ` - ${assunto}` : ""}`);
    const body = encodeURIComponent(texto);
    return `mailto:${suporteEmail}?subject=${subject}&body=${body}`;
  }, [suporteEmail, tipo, assunto, texto]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push("/")}> 
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Dúvidas e Sugestões</h1>
                <p className="text-muted-foreground">Envie uma dúvida ou sugestão sobre o VoxCash</p>
              </div>
            </div>
            <Badge variant="secondary" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              Suporte
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Formulário</CardTitle>
                <CardDescription>Preencha os campos e escolha como enviar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={tipo} onValueChange={(v) => setTipo(v as any)} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="duvida">Dúvida</TabsTrigger>
                    <TabsTrigger value="sugestao">Sugestão</TabsTrigger>
                  </TabsList>
                  <TabsContent value="duvida" />
                  <TabsContent value="sugestao" />
                </Tabs>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Input placeholder="Seu email (opcional)" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Input placeholder="Assunto" value={assunto} onChange={(e) => setAssunto(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Textarea placeholder="Escreva sua mensagem" value={mensagem} onChange={(e) => setMensagem(e.target.value)} className="min-h-[140px]" />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild className="gap-2">
                    <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" />
                      Enviar no WhatsApp
                    </a>
                  </Button>
                  <Button variant="outline" asChild className="gap-2">
                    <a href={mailtoHref}>
                      <Mail className="h-4 w-4" />
                      Enviar por Email
                    </a>
                  </Button>
                  <Button variant="secondary" onClick={handleCopy} className="gap-2">
                    <Copy className="h-4 w-4" />
                    Copiar texto
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Atalhos</CardTitle>
                <CardDescription>Fale diretamente com o suporte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-center gap-2">
                  <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    Abrir WhatsApp
                  </a>
                </Button>
                <Button variant="outline" asChild className="w-full justify-center gap-2">
                  <a href={mailtoHref}>
                    <Mail className="h-4 w-4" />
                    Enviar Email
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

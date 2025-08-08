"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Package } from "lucide-react";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";

const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});

export default function LoginPage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: "Login bem-sucedido!",
        description: "Bem-vindo de volta!",
      });
      // A redirection will be handled by the useAuth hook
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Erro no Login",
        description: "E-mail ou senha incorretos. Por favor, tente novamente.",
      });
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <Package className="h-10 w-10 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold">Bem-vindo de Volta!</h1>
        <p className="text-muted-foreground">Faça login para acessar seu dashboard.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl><Input type="email" {...field} placeholder="seu@email.com" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl><Input type="password" {...field} placeholder="••••••••" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Entrar"}
          </Button>
        </form>
      </Form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Não tem uma conta?{' '}
        <Link href="/cadastro" className="text-primary hover:underline">
          Cadastre-se
        </Link>
      </p>
    </>
  );
}
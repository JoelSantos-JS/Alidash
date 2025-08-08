"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Package } from "lucide-react";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";

const signupSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});

export default function SignupPage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const isSuperAdmin = user.email === 'joeltere9@gmail.com';

      // Create a document for the user in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: new Date(),
        isPro: isSuperAdmin, // isPro is true only for the super admin
        isSuperAdmin: isSuperAdmin,
      });
      
      // If it's the supreme user, migrate data from local storage.
      if(isSuperAdmin) {
         const products = localStorage.getItem('product-dash-products');
         const dreams = localStorage.getItem('product-dash-dreams');
         const dreamPlans = localStorage.getItem('product-dash-dream-plans');
         const bets = localStorage.getItem('product-dash-bets');

         const userData = {
            products: products ? JSON.parse(products) : [],
            dreams: dreams ? JSON.parse(dreams) : [],
            dreamPlans: dreamPlans ? JSON.parse(dreamPlans) : {},
            bets: bets ? JSON.parse(bets) : [],
         };
         
         await setDoc(doc(db, "user-data", user.uid), userData, { merge: true });

         toast({
            title: "Conta de Super Usuário Criada!",
            description: "Seus dados locais foram migrados para sua conta.",
        });
      } else {
        toast({
            title: "Conta criada com sucesso!",
            description: "Você já pode fazer o login.",
        });
      }


    } catch (error: any) {
      console.error("Signup error:", error);
       if (error.code === 'auth/email-already-in-use') {
        toast({
            variant: "destructive",
            title: "Erro no Cadastro",
            description: "Este e-mail já está em uso.",
        });
       } else {
         toast({
            variant: "destructive",
            title: "Erro no Cadastro",
            description: "Ocorreu um erro. Por favor, tente novamente.",
        });
       }
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <Package className="h-10 w-10 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold">Crie sua Conta</h1>
        <p className="text-muted-foreground">Comece a gerenciar seus produtos e sonhos.</p>
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
              <FormControl><Input type="password" {...field} placeholder="Pelo menos 6 caracteres" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Criar Conta"}
          </Button>
        </form>
      </Form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Já tem uma conta?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Faça login
        </Link>
      </p>
    </>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Package } from "lucide-react";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";

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
       const userDocData: any = {
        email: user.email,
        createdAt: serverTimestamp(),
        isSuperAdmin: isSuperAdmin,
      };

      if (isSuperAdmin) {
        // Super admin gets a lifetime subscription
        const farFutureDate = new Date();
        farFutureDate.setFullYear(farFutureDate.getFullYear() + 100);
        userDocData.proSubscription = {
            plan: 'lifetime',
            startedAt: Timestamp.fromDate(new Date()),
            expiresAt: Timestamp.fromDate(farFutureDate),
        };
      }

      await setDoc(doc(db, "users", user.uid), userDocData);
      
      // If it's the super admin, migrate data from local storage.
      if(isSuperAdmin) {
         const products = localStorage.getItem('product-dash-products');
         const dreams = localStorage.getItem('product-dash-dreams');
         const bets = localStorage.getItem('product-dash-bets');

         const userData: Record<string, any> = {};
        if (products) userData.products = JSON.parse(products);
        if (dreams) userData.dreams = JSON.parse(dreams);
        if (bets) userData.bets = JSON.parse(bets);
         
        if (Object.keys(userData).length > 0) {
            await setDoc(doc(db, "user-data", user.uid), userData, { merge: true });
        }

         toast({
            title: "Conta de Super Usuário Criada!",
            description: "Seus dados locais foram migrados para sua conta na nuvem.",
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
        <Package className="h-12 w-12 text-white mx-auto mb-4 drop-shadow-lg" />
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Crie sua Conta</h1>
        <p className="text-white/80">Comece a gerenciar seus produtos e sonhos.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">E-mail</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  {...field} 
                  placeholder="seu@email.com" 
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Senha</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  {...field} 
                  placeholder="Pelo menos 6 caracteres" 
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg" 
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Criar Conta"}
          </Button>
        </form>
      </Form>
      <p className="text-center text-sm text-white/70 mt-6">
        Já tem uma conta?{' '}
        <Link href="/login" className="text-white hover:text-blue-300 underline">
          Faça login
        </Link>
      </p>
    </>
  );
}

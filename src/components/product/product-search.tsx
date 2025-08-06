"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Search } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  query: z.string(),
});

type ProductSearchProps = {
  onSearch: (query: string) => void;
};

export function ProductSearch({ onSearch }: ProductSearchProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
    },
  });

  const query = form.watch("query");

  useEffect(() => {
    const subscription = form.watch((value) => {
        onSearch(value.query || "");
    })
    return () => subscription.unsubscribe();
  }, [form, onSearch])


  function onSubmit(values: z.infer<typeof formSchema>) {
    onSearch(values.query);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Busque por nome do produto..."
                    className="pl-10 h-11"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg">
            <Search className="mr-2 h-5 w-5" />
            Buscar
        </Button>
      </form>
    </Form>
  );
}

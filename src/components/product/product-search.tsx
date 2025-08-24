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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-2">
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  <Input
                    placeholder="Busque por nome do produto..."
                    className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" className="text-sm sm:text-base">
            <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Buscar</span>
            <span className="sm:hidden">Buscar</span>
        </Button>
      </form>
    </Form>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ExternalLink, Lightbulb, FileText, AlertCircle } from "lucide-react";

import type { Product } from "@/types";
import {
  SummarizeProductDetailsOutput,
  summarizeProductDetails,
} from "@/ai/flows/summarize-product-details";
import { useToast } from "@/hooks/use-toast";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ProductDetailViewProps = {
  product: Product;
};

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const [insights, setInsights] =
    useState<SummarizeProductDetailsOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!product) return;

    const generateInsights = async () => {
      setIsGenerating(true);
      setError(null);
      setInsights(null);
      try {
        const result = await summarizeProductDetails({
          productTitle: product.title,
          productDescription: product.description,
          productImageUrl: product.imageUrl,
          productUrl: product.productUrl,
          averageRating: product.rating,
        });
        setInsights(result);
      } catch (e) {
        console.error("Failed to generate insights:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error Generating Insights",
          description: "Could not generate AI insights. Please try again later.",
        });
      } finally {
        setIsGenerating(false);
      }
    };

    generateInsights();
  }, [product, toast]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 max-h-[80vh] overflow-y-auto">
      <div className="relative aspect-square md:aspect-auto">
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          className="object-cover md:rounded-l-lg"
          data-ai-hint="product lifestyle"
        />
      </div>
      <div className="p-6 flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{product.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-lg text-foreground">{product.rating}</span>
              <span className="text-muted-foreground">({product.reviews.toLocaleString()} reviews)</span>
            </div>
            <Badge variant="default" className="text-lg bg-primary">${product.price}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 py-6 border-y">
            <h3 className="font-semibold text-lg mb-3">AI-Powered Insights</h3>
            {isGenerating ? (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Generation Failed</AlertTitle>
                <AlertDescription>
                  We couldn't generate insights for this product.
                </AlertDescription>
              </Alert>
            ) : insights && (
                <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-base font-medium">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary"/>
                                Product Summary
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                            {insights.summary}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger className="text-base font-medium">
                           <div className="flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-yellow-500"/>
                                Investment Idea
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                            {insights.investmentIdea}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}
        </div>
        
        <div className="mt-auto pt-6">
            <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-base py-6">
                <Link href={product.productUrl} target="_blank">
                    View on AliExpress
                    <ExternalLink className="ml-2 h-5 w-5" />
                </Link>
            </Button>
        </div>
      </div>
    </div>
  );
}

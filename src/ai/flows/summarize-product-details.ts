'use server';
/**
 * @fileOverview An AI agent that summarizes product details from AliExpress.
 *
 * - summarizeProductDetails - A function that summarizes the details of a product.
 * - SummarizeProductDetailsInput - The input type for the summarizeProductDetails function.
 * - SummarizeProductDetailsOutput - The return type for the summarizeProductDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeProductDetailsInputSchema = z.object({
  productTitle: z.string().describe('The title of the product.'),
  productDescription: z.string().describe('The description of the product.'),
  productImageUrl: z.string().describe('The URL of the product image.'),
  productUrl: z.string().describe('The URL of the product on AliExpress.'),
  averageRating: z.number().describe('The average rating of the product.'),
});
export type SummarizeProductDetailsInput = z.infer<typeof SummarizeProductDetailsInputSchema>;

const SummarizeProductDetailsOutputSchema = z.object({
  summary: z.string().describe('A summary of the product details.'),
  investmentIdea: z.string().describe('A potential investment idea based on the product details.'),
});
export type SummarizeProductDetailsOutput = z.infer<typeof SummarizeProductDetailsOutputSchema>;

export async function summarizeProductDetails(input: SummarizeProductDetailsInput): Promise<SummarizeProductDetailsOutput> {
  return summarizeProductDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeProductDetailsPrompt',
  input: {schema: SummarizeProductDetailsInputSchema},
  output: {schema: SummarizeProductDetailsOutputSchema},
  prompt: `You are an expert in summarizing product details and generating investment ideas.

  Summarize the following product details, highlighting the key features and benefits:

  Product Title: {{{productTitle}}}
  Description: {{{productDescription}}}
  Image URL: {{{productImageUrl}}}
  Product URL: {{{productUrl}}}
  Average Rating: {{{averageRating}}}

  Based on the product details, generate a potential investment idea related to this product.
  `,
});

const summarizeProductDetailsFlow = ai.defineFlow(
  {
    name: 'summarizeProductDetailsFlow',
    inputSchema: SummarizeProductDetailsInputSchema,
    outputSchema: SummarizeProductDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

'use server';

/**
 * @fileOverview A flow for generating investment ideas based on product details and market trends.
 *
 * - generateInvestmentIdeas - A function that generates investment ideas.
 * - GenerateInvestmentIdeasInput - The input type for the generateInvestmentIdeas function.
 * - GenerateInvestmentIdeasOutput - The return type for the generateInvestmentIdeas function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInvestmentIdeasInputSchema = z.object({
  productDetails: z
    .string()
    .describe('Detailed information about the AliExpress product.'),
  marketTrends: z.string().describe('Current market trends and conditions.'),
});
export type GenerateInvestmentIdeasInput = z.infer<
  typeof GenerateInvestmentIdeasInputSchema
>;

const GenerateInvestmentIdeasOutputSchema = z.object({
  investmentIdeas: z
    .array(z.string())
    .describe('A list of potential investment ideas.'),
  summary: z
    .string()
    .describe('A summary of the product details and market trends.'),
});
export type GenerateInvestmentIdeasOutput = z.infer<
  typeof GenerateInvestmentIdeasOutputSchema
>;

export async function generateInvestmentIdeas(
  input: GenerateInvestmentIdeasInput
): Promise<GenerateInvestmentIdeasOutput> {
  return generateInvestmentIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInvestmentIdeasPrompt',
  input: {schema: GenerateInvestmentIdeasInputSchema},
  output: {schema: GenerateInvestmentIdeasOutputSchema},
  prompt: `You are an expert investment advisor specializing in AliExpress products.

You will use the following information to generate potential investment ideas for the product, and a summary of the product details and market trends.

Product Details: {{{productDetails}}}
Market Trends: {{{marketTrends}}}

Generate a list of potential investment ideas and a summary of the product details and market trends. Focus on the most promising aspects and potential risks.

Investment Ideas:
{{#each investmentIdeas}}- {{this}}\n{{/each}}
Summary: {{{summary}}}`,
});

const generateInvestmentIdeasFlow = ai.defineFlow(
  {
    name: 'generateInvestmentIdeasFlow',
    inputSchema: GenerateInvestmentIdeasInputSchema,
    outputSchema: GenerateInvestmentIdeasOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

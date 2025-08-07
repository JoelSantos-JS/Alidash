'use server';
/**
 * @fileOverview Um planejador de sonhos com IA.
 *
 * - planDream - Gera um plano detalhado para um sonho.
 * - DreamPlannerInput - O tipo de entrada para planDream.
 * - DreamPlannerOutput - O tipo de retorno para planDream.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { DreamPlan } from '@/types';


const DreamPlannerInputSchema = z.object({
  dreamName: z.string().describe('O nome ou uma breve descrição do sonho. Ex: "Viagem para o Chile"'),
  dreamType: z.enum(['travel', 'business', 'personal']).describe('O tipo do sonho.'),
  existingPlan: z.string().optional().describe('O plano existente em formato JSON, se houver, para ser aprimorado.'),
  refinementInstruction: z.string().optional().describe('Instrução do usuário para aprimorar o plano existente.'),
});
export type DreamPlannerInput = z.infer<typeof DreamPlannerInputSchema>;

const DreamPlannerOutputSchema = z.object({
  description: z.string().describe("Uma descrição inspiradora e detalhada do sonho, com cerca de 2-3 frases."),
  estimatedCost: z.array(z.object({
    item: z.string().describe("O item de custo. Ex: 'Passagens Aéreas', 'Hospedagem'."),
    cost: z.number().describe("O custo estimado para este item em BRL."),
  })).describe("Uma lista de custos estimados para realizar o sonho."),
  totalEstimatedCost: z.number().describe("A soma de todos os custos estimados em BRL."),
  actionPlan: z.array(z.object({
    step: z.number().describe("O número do passo no plano."),
    action: z.string().describe("Um título curto para a ação. Ex: 'Pesquisar Passagens'."),
    details: z.string().describe("Uma descrição detalhada do que fazer neste passo."),
  })).describe("Um plano de ação passo a passo para alcançar o sonho."),
  importantNotes: z.array(z.string()).describe("Uma lista de dicas ou notas importantes sobre o sonho."),
  imageUrl: z.string().describe("A URL de uma imagem gerada pela IA que representa o sonho. Deve ser um data URI em base64."),
});
export type DreamPlannerOutput = DreamPlan;

const plannerPromptText = `Você é um planejador de sonhos e especialista financeiro. Sua tarefa é ajudar um usuário a estruturar e planejar seu sonho.
O usuário fornecerá o nome e o tipo do sonho. Com base nisso, crie um plano detalhado.

Tipo de Sonho: {{{dreamType}}}
Sonho: {{{dreamName}}}

{{#if refinementInstruction}}
O usuário já tem um plano e gostaria de aprimorá-lo.
Plano atual:
{{{existingPlan}}}

Instrução de Aprimoramento: "{{{refinementInstruction}}}"

Por favor, gere uma nova versão do plano, incorporando a instrução do usuário. Mantenha a mesma estrutura de dados.
{{else}}
Instruções:
1.  **Descrição**: Escreva uma descrição inspiradora para o sonho.
2.  **Custos Estimados**: Forneça uma lista realista de custos em Reais (BRL). Se for uma viagem, inclua passagens, hospedagem, alimentação, passeios, etc. Se for um negócio, inclua custos iniciais, marketing, etc. Calcule o custo total.
3.  **Plano de Ação**: Crie um plano de ação claro e prático com 3 a 5 passos.
4.  **Notas Importantes**: Dê 2 a 3 dicas ou conselhos valiosos. Para viagens, podem ser dicas sobre a melhor época para ir, vistos ou moeda. Para negócios, dicas sobre mercado ou divulgação.
{{/if}}

Seja realista, encorajador e prático. Forneça a saída no formato JSON especificado.
`;

const plannerPrompt = ai.definePrompt({
    name: 'dreamPlannerPrompt',
    input: { schema: DreamPlannerInputSchema },
    output: { schema: z.object({
        description: DreamPlannerOutputSchema.shape.description,
        estimatedCost: DreamPlannerOutputSchema.shape.estimatedCost,
        totalEstimatedCost: DreamPlannerOutputSchema.shape.totalEstimatedCost,
        actionPlan: DreamPlannerOutputSchema.shape.actionPlan,
        importantNotes: DreamPlannerOutputSchema.shape.importantNotes
    }) },
    prompt: plannerPromptText,
});

const imageGenerationPromptTemplate = 'Uma imagem fotorrealista e inspiradora de alta qualidade para o seguinte sonho: "{{{dreamName}}}". A imagem deve capturar a essência da conquista desse objetivo. Estilo cinematográfico, cores vibrantes.'

const planDreamFlow = ai.defineFlow(
  {
    name: 'planDreamFlow',
    inputSchema: DreamPlannerInputSchema,
    outputSchema: DreamPlannerOutputSchema,
  },
  async (input) => {
    // Gerar o plano de texto e a imagem em paralelo
    const [planResponse, imageResponse] = await Promise.all([
      plannerPrompt(input),
      // Only generate a new image if there's no existing plan
      input.existingPlan ? Promise.resolve(null) : ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: imageGenerationPromptTemplate.replace('{{{dreamName}}}', input.dreamName),
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      })
    ]);
    
    const plan = planResponse.output;
    if (!plan) {
        throw new Error("A IA não conseguiu gerar um plano de texto.");
    }
    
    // If we are refining, we don't generate a new image, so we return an empty imageUrl.
    // The client should keep the old one.
    if (input.existingPlan) {
        return {
            ...plan,
            imageUrl: '',
        }
    }
    
    const { media } = imageResponse!;
    if (!media || !media.url) {
        throw new Error("A IA não conseguiu gerar uma imagem.");
    }
    
    return {
        ...plan,
        imageUrl: media.url,
    }
  }
);


export async function planDream(input: DreamPlannerInput): Promise<DreamPlannerOutput> {
  return planDreamFlow(input);
}

// Flow for suggesting a selling price
const SuggestPriceInputSchema = z.object({
    productName: z.string().describe("O nome do produto."),
    totalCost: z.number().describe("O custo total do produto em BRL."),
    category: z.string().describe("A categoria do produto."),
});
export type SuggestPriceInput = z.infer<typeof SuggestPriceInputSchema>;

const SuggestPriceOutputSchema = z.object({
    suggestedPrice: z.number().describe("O preço de venda sugerido em BRL."),
    justification: z.string().describe("Uma breve justificativa (1-2 frases) para a sugestão de preço, considerando o mercado, categoria e margem de lucro."),
});
export type SuggestPriceOutput = z.infer<typeof SuggestPriceOutputSchema>;

const suggestPricePrompt = ai.definePrompt({
    name: 'suggestPricePrompt',
    input: { schema: SuggestPriceInputSchema },
    output: { schema: SuggestPriceOutputSchema },
    prompt: `Você é um especialista em e-commerce e precificação de produtos.
    Analise os detalhes do produto a seguir e sugira um preço de venda ideal em Reais (BRL).

    - Nome do Produto: {{{productName}}}
    - Categoria: {{{category}}}
    - Custo Total por Unidade: R$ {{{totalCost}}}

    Considere uma margem de lucro saudável (geralmente entre 40% e 100% sobre o custo para produtos dessa natureza), a competitividade da categoria e o valor percebido pelo cliente.

    Forneça o preço sugerido e uma breve justificativa para sua recomendação.
    `
});

const suggestPriceFlow = ai.defineFlow(
    {
        name: 'suggestPriceFlow',
        inputSchema: SuggestPriceInputSchema,
        outputSchema: SuggestPriceOutputSchema,
    },
    async (input) => {
        const { output } = await suggestPricePrompt(input);
        if (!output) {
            throw new Error("A IA não conseguiu sugerir um preço.");
        }
        return output;
    }
);

export async function suggestPrice(input: SuggestPriceInput): Promise<SuggestPriceOutput> {
    return suggestPriceFlow(input);
}

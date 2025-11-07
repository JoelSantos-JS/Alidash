import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { Product } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ReportData {
  products: Product[];
  totalInvestment: number;
  totalRevenue: number;
  totalProfit: number;
  roi: number;
  period: string;
  generatedAt: Date;
}

export interface ExportOptions {
  includeCharts?: boolean;
  includeDetails?: boolean;
  format?: 'pdf' | 'excel';
}

/**
 * Exporta relatório para PDF
 */
export function exportReportToPDF(data: ReportData, options: ExportOptions = {}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  
  // Configurar fonte para suporte a caracteres especiais
  doc.setFont('helvetica');
  
  // Título do relatório
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Relatório Empresarial', margin, 30);
  
  // Subtítulo com período
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Período: ${data.period}`, margin, 40);
  doc.text(`Gerado em: ${format(data.generatedAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, margin, 50);
  
  // Linha separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 55, pageWidth - margin, 55);
  
  // Resumo executivo
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text('Resumo Executivo', margin, 70);
  
  const summaryData = [
    ['Investimento Total', `R$ ${data.totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ['Receita Total', `R$ ${data.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ['Lucro Total', `R$ ${data.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ['ROI Médio', `${data.roi.toFixed(2)}%`],
    ['Total de Produtos', data.products.length.toString()]
  ];
  
  autoTable(doc, {
    startY: 80,
    head: [['Métrica', 'Valor']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 },
    margin: { left: margin, right: margin }
  });
  
  // Detalhes dos produtos (se solicitado)
  if (options.includeDetails && data.products.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    doc.setFontSize(16);
    doc.text('Detalhes dos Produtos', margin, finalY + 20);
    
    const productData = data.products.map(product => [
      product.name,
      product.category,
      product.status === 'purchased' ? 'Comprado' : 
      product.status === 'selling' ? 'Vendendo' : 
      product.status === 'sold' ? 'Vendido' : product.status,
      `R$ ${product.purchasePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${product.sellingPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `${product.profitMargin.toFixed(1)}%`,
      `${product.roi.toFixed(1)}%`
    ]);
    
    autoTable(doc, {
      startY: finalY + 30,
      head: [['Produto', 'Categoria', 'Status', 'Compra', 'Venda', 'Margem', 'ROI']],
      body: productData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 }
      }
    });
  }
  
  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} - Relatório gerado pelo AliDash`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Salvar o arquivo
  const fileName = `relatorio-empresarial-${format(data.generatedAt, 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(fileName);
}

/**
 * Exporta relatório para Excel
 */
export function exportReportToExcel(data: ReportData, _options: ExportOptions = {}) {
  const workbook = XLSX.utils.book_new();
  
  // Aba 1: Resumo
  const summaryData = [
    ['Relatório Empresarial'],
    [''],
    ['Período:', data.period],
    ['Gerado em:', format(data.generatedAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })],
    [''],
    ['RESUMO EXECUTIVO'],
    ['Métrica', 'Valor'],
    ['Investimento Total', data.totalInvestment],
    ['Receita Total', data.totalRevenue],
    ['Lucro Total', data.totalProfit],
    ['ROI Médio (%)', data.roi],
    ['Total de Produtos', data.products.length]
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Formatação da aba resumo
  summarySheet['!cols'] = [
    { width: 20 },
    { width: 15 }
  ];
  
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');
  
  // Aba 2: Produtos detalhados
  if (data.products.length > 0) {
    const productHeaders = [
      'Nome',
      'Categoria',
      'Fornecedor',
      'Status',
      'Quantidade',
      'Vendidos',
      'Preço Compra',
      'Preço Venda',
      'Custo Total',
      'Lucro Esperado',
      'Lucro Real',
      'Margem (%)',
      'ROI (%)',
      'Data Compra',
      'Link AliExpress',
      'Descrição'
    ];
    
    const productData = data.products.map(product => [
      product.name,
      product.category,
      product.supplier || '',
      product.status === 'purchased' ? 'Comprado' : 
      product.status === 'selling' ? 'Vendendo' : 
      product.status === 'sold' ? 'Vendido' : product.status,
      product.quantity,
      product.quantitySold,
      product.purchasePrice,
      product.sellingPrice,
      product.totalCost,
      product.expectedProfit,
      product.actualProfit,
      product.profitMargin,
      product.roi,
      format(product.purchaseDate, 'dd/MM/yyyy'),
      product.aliexpressLink || '',
      product.description || ''
    ]);
    
    const productSheet = XLSX.utils.aoa_to_sheet([productHeaders, ...productData]);
    
    // Formatação da aba produtos
    productSheet['!cols'] = [
      { width: 25 }, // Nome
      { width: 15 }, // Categoria
      { width: 15 }, // Fornecedor
      { width: 12 }, // Status
      { width: 10 }, // Quantidade
      { width: 10 }, // Vendidos
      { width: 12 }, // Preço Compra
      { width: 12 }, // Preço Venda
      { width: 12 }, // Custo Total
      { width: 12 }, // Lucro Esperado
      { width: 12 }, // Lucro Real
      { width: 10 }, // Margem
      { width: 10 }, // ROI
      { width: 12 }, // Data Compra
      { width: 30 }, // Link
      { width: 30 }  // Descrição
    ];
    
    XLSX.utils.book_append_sheet(workbook, productSheet, 'Produtos');
  }
  
  // Aba 3: Análise por categoria
  if (data.products.length > 0) {
    const categoryAnalysis = new Map<string, {
      count: number;
      investment: number;
      revenue: number;
      profit: number;
    }>();
    
    data.products.forEach(product => {
      const category = product.category || 'Sem Categoria';
      if (!categoryAnalysis.has(category)) {
        categoryAnalysis.set(category, {
          count: 0,
          investment: 0,
          revenue: 0,
          profit: 0
        });
      }
      
      const analysis = categoryAnalysis.get(category)!;
      analysis.count++;
      analysis.investment += product.totalCost;
      analysis.revenue += product.sellingPrice * product.quantitySold;
      analysis.profit += product.actualProfit;
    });
    
    const categoryHeaders = [
      'Categoria',
      'Produtos',
      'Investimento',
      'Receita',
      'Lucro',
      'ROI (%)'
    ];
    
    const categoryData = Array.from(categoryAnalysis.entries()).map(([category, analysis]) => [
      category,
      analysis.count,
      analysis.investment,
      analysis.revenue,
      analysis.profit,
      analysis.investment > 0 ? ((analysis.profit / analysis.investment) * 100) : 0
    ]);
    
    const categorySheet = XLSX.utils.aoa_to_sheet([categoryHeaders, ...categoryData]);
    
    categorySheet['!cols'] = [
      { width: 20 },
      { width: 10 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 10 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Análise por Categoria');
  }
  
  // Salvar o arquivo
  const fileName = `relatorio-empresarial-${format(data.generatedAt, 'yyyy-MM-dd-HHmm')}.xlsx`;
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
}

/**
 * Calcula estatísticas do relatório
 */
export function calculateReportStats(products: Product[]): Omit<ReportData, 'period' | 'generatedAt'> {
  const totalInvestment = products.reduce((sum, product) => sum + product.totalCost, 0);
  const totalRevenue = products.reduce((sum, product) => sum + (product.sellingPrice * product.quantitySold), 0);
  const totalProfit = products.reduce((sum, product) => sum + product.actualProfit, 0);
  const roi = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
  
  return {
    products,
    totalInvestment,
    totalRevenue,
    totalProfit,
    roi
  };
}
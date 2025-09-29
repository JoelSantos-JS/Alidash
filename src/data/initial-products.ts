import type { Product } from "@/types";

export const initialProducts: Product[] = [
  {
    id: "1",
    name: "Smartphone Xiaomi",
    category: "Eletrônicos",
    supplier: "AliExpress",
    aliexpressLink: "https://example.com",
    imageUrl: "/placeholder-product.svg",
    description: "Smartphone de última geração",
    purchasePrice: 800,
    shippingCost: 50,
    importTaxes: 120,
    packagingCost: 10,
    marketingCost: 30,
    otherCosts: 20,
    totalCost: 1030,
    sellingPrice: 1500,
    expectedProfit: 470,
    profitMargin: 31.3,
    sales: [],
    quantity: 3,
    quantitySold: 0,
    status: 'received',
    purchaseDate: new Date(2024, 11, 1),
    roi: 0,
    actualProfit: 0
  }
];
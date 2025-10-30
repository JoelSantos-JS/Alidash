'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Search, Filter, ShoppingBag, ExternalLink, Star, Package, Calendar, DollarSign } from 'lucide-react'

interface PublicProduct {
  id: string
  name: string
  category: string
  description?: string
  sellingPrice: number
  imageUrl?: string
  images?: string[]
  status: string
  quantity: number
  quantitySold?: number
  purchaseDate?: string
  aliexpressLink?: string
}

interface CatalogData {
  products: PublicProduct[]
  catalogInfo: {
    totalProducts: number
    categories: string[]
    lastUpdated: string
  }
}

export default function PublicCatalogPage() {
  const params = useParams()
  const token = params.token as string
  
  const [catalogData, setCatalogData] = useState<CatalogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  useEffect(() => {
    if (token) {
      fetchCatalogData()
    }
  }, [token])

  const fetchCatalogData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/catalog/${token}`)
      
      if (!response.ok) {
        throw new Error('Catálogo não encontrado ou inativo')
      }

      const data = await response.json()
      setCatalogData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar catálogo')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = catalogData?.products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.sellingPrice - b.sellingPrice
      case 'price-high':
        return b.sellingPrice - a.sellingPrice
      case 'name':
      default:
        return a.name.localeCompare(b.name)
    }
  }) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando catálogo...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Package className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Catálogo não encontrado</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">Verifique se o link está correto ou entre em contato com o vendedor.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-3">
                <ShoppingBag className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Catálogo de Produtos</h1>
                <p className="text-gray-600 mt-1">
                  {catalogData?.catalogInfo.totalProducts} produtos disponíveis
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Atualizado em {new Date(catalogData?.catalogInfo.lastUpdated || '').toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Todas as categorias</option>
                {catalogData?.catalogInfo.categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="name">Ordenar por nome</option>
                <option value="price-low">Menor preço</option>
                <option value="price-high">Maior preço</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-500">Tente ajustar os filtros de busca</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              // Calcular estoque disponível
              const availableStock = product.quantity - (product.quantitySold || 0);
              
              // Determinar status real baseado no estoque
              let displayStatus = product.status;
              let statusLabel = 'Disponível';
              let statusColor = 'bg-blue-100 text-blue-800';
              
              if (availableStock <= 0) {
                displayStatus = 'sold';
                statusLabel = 'Esgotado';
                statusColor = 'bg-gray-100 text-gray-800';
              } else if (product.status === 'selling' || (availableStock > 0 && product.status === 'sold')) {
                displayStatus = 'selling';
                statusLabel = 'À venda';
                statusColor = 'bg-green-100 text-green-800';
              }
              
              return (
                <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
                  {/* Product Image */}
                  <div className="relative h-64 bg-gray-100">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Quantity Badge */}
                    {availableStock > 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-white bg-opacity-90 text-gray-800 px-2 py-1 rounded-full text-xs font-semibold">
                          {availableStock} unid.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <div className="mb-3">
                      <span className="text-sm text-blue-600 font-medium">{product.category}</span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    {product.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="text-2xl font-bold text-green-600">
                          R$ {product.sellingPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    {product.aliexpressLink && (
                      <a
                        href={product.aliexpressLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors duration-200 flex items-center justify-center space-x-2 group"
                      >
                        <span>Ver no AliExpress</span>
                        <ExternalLink className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p className="text-sm">
              Catálogo gerado automaticamente • {filteredProducts.length} de {catalogData?.catalogInfo.totalProducts} produtos exibidos
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
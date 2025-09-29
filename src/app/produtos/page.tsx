"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductsSidebar } from "@/components/product/products-sidebar"
import { ProductCard } from "@/components/product/product-card"
import { ProductForm } from "@/components/product/product-form"
import { ProductDetailView } from "@/components/product/product-detail-view"
import { ProductSearch } from "@/components/product/product-search"
import { SaleForm } from "@/components/product/sale-form"
import { TrackingView } from "@/components/product/tracking-view"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Product } from "@/types"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Download,
  Upload,
  RefreshCw,
  MoreHorizontal,
  ArrowLeft,
  Menu
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function ProdutosPage() {
  const { user, loading: authLoading } = useAuth()
  const isMobile = useIsMobile()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [supplierFilter, setSupplierFilter] = useState("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)
  const [isProductFormOpen, setIsProductFormOpen] = useState(false)
  const [isSaleFormOpen, setIsSaleFormOpen] = useState(false)
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false)
  const [isTrackingViewOpen, setIsTrackingViewOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { toast } = useToast()

  // Fetch products on component mount
  useEffect(() => {
    if (authLoading || !user) return
    fetchProducts()
  }, [authLoading, user])

  // Filter products based on search and filters
  useEffect(() => {
    let filtered = [...products]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.supplier.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(product => product.category === categoryFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(product => product.status === statusFilter)
    }

    // Supplier filter
    if (supplierFilter !== "all") {
      filtered = filtered.filter(product => product.supplier === supplierFilter)
    }

    setFilteredProducts(filtered)
  }, [products, searchQuery, categoryFilter, statusFilter, supplierFilter])

  const fetchProducts = async () => {
    if (!user?.uid) return
    
    try {
      setIsLoading(true)
      console.log('🔄 Carregando produtos do usuário:', user.uid)
      
      // Carregar do Firebase (backup/fallback)
      const docRef = doc(db, "user-data", user.uid)
      const docSnap = await getDoc(docRef)

      let firebaseProducts: Product[] = []

      if (docSnap.exists()) {
        const userData = docSnap.data()
        console.log('📦 Produtos encontrados no Firebase (backup):', userData.products?.length || 0)
        
        // Carregar produtos do Firebase
        if (userData.products && userData.products.length > 0) {
          const data = userData.products
          firebaseProducts = data.map((p: any) => ({
            ...p,
            purchaseDate: p.purchaseDate?.toDate ? p.purchaseDate.toDate() : new Date(p.purchaseDate),
            sales: p.sales ? p.sales.map((s: any) => ({
              ...s, 
              date: s.date?.toDate ? s.date.toDate() : 
                    typeof s.date === 'string' ? new Date(s.date) : 
                    new Date(s.date)
            })) : [],
          }))
        }
      }

      // 2. Tentar carregar produtos do Supabase (fonte primária)
      let supabaseProducts: Product[] = []
      try {
        console.log('🔍 Tentando buscar produtos do Supabase (fonte primária)...')
        
        // Primeiro, buscar o usuário no Supabase usando API route
        const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user.uid}&email=${user.email}`)
        
        if (userResponse.ok) {
          const userResult = await userResponse.json()
          const supabaseUser = userResult.user
          
          console.log('✅ Usuário encontrado no Supabase:', supabaseUser.id)
          
          // Agora buscar os produtos usando API route
          const productsResponse = await fetch(`/api/products/get?user_id=${supabaseUser.id}`)
          
          if (productsResponse.ok) {
            const productsResult = await productsResponse.json()
            supabaseProducts = productsResult.products?.map((product: any) => ({
              ...product,
              purchaseDate: new Date(product.purchase_date || product.purchaseDate),
              sales: product.sales || []
            })) || []
            console.log('📊 Produtos do Supabase:', supabaseProducts.length)
          } else {
            console.error('❌ Erro ao buscar produtos do Supabase:', await productsResponse.text())
          }
        } else {
          console.log('⚠️ Usuário não encontrado no Supabase, usando apenas Firebase')
        }
      } catch (error) {
        console.error('❌ Erro ao buscar produtos do Supabase:', error)
        console.log('📥 Continuando apenas com dados do Firebase')
      }

      // 3. Usar apenas produtos do Supabase (fonte primária) para evitar duplicação
      let finalProducts = supabaseProducts
      
      // Se não houver produtos no Supabase, usar Firebase como fallback
      if (finalProducts.length === 0 && firebaseProducts.length > 0) {
        console.log('📥 Usando produtos do Firebase como fallback')
        finalProducts = firebaseProducts
      }

      console.log('📊 Produtos finais:', {
        firebase: firebaseProducts.length,
        supabase: supabaseProducts.length,
        final: finalProducts.length
      })
      
      if (finalProducts.length === 0) {
        console.log('📥 Nenhum produto encontrado nos bancos de dados')
        // Não usar dados de exemplo - deixar vazio para mostrar estado real
        finalProducts = []
      } else {
        console.log('✅ Usando produtos reais do banco de dados (priorizando Supabase)')
      }

      setProducts(finalProducts)
      
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setIsDetailViewOpen(true)
  }

  const handleAddProduct = () => {
    setIsProductFormOpen(true)
  }

  const handleProductCreated = async (newProduct: Product) => {
    try {
      // Primeiro, buscar o usuário no Supabase
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user?.uid}&email=${user?.email}`)
      
      if (userResponse.ok) {
        const userResult = await userResponse.json()
        const supabaseUser = userResult.user
        
        // Fazer a chamada para a API de criação
        const createResponse = await fetch(`/api/products/create?user_id=${supabaseUser.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newProduct)
        })
        
        if (createResponse.ok) {
          const createResult = await createResponse.json()
          console.log('✅ Produto criado:', createResult)
          
          // Atualizar o estado local apenas se a API foi bem-sucedida
          setProducts(prev => [...prev, newProduct])
          setIsProductFormOpen(false)
          
          toast({
            title: "Sucesso",
            description: "Produto criado com sucesso!",
          })
        } else {
          const errorText = await createResponse.text()
          console.error('❌ Erro ao criar produto:', errorText)
          toast({
            title: "Erro",
            description: "Não foi possível criar o produto. Tente novamente.",
            variant: "destructive",
          })
        }
      } else {
        console.error('❌ Usuário não encontrado no Supabase')
        toast({
          title: "Erro",
          description: "Usuário não encontrado. Faça login novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('❌ Erro ao criar produto:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar produto.",
        variant: "destructive",
      })
    }
  }

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product)
    setIsDetailViewOpen(false)
    setIsProductFormOpen(true)
  }

  const handleProductUpdated = async (updatedProduct: Product) => {
    try {
      // Primeiro, buscar o usuário no Supabase
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user?.uid}&email=${user?.email}`)
      
      if (userResponse.ok) {
        const userResult = await userResponse.json()
        const supabaseUser = userResult.user
        
        // Fazer a chamada para a API de atualização
        const updateResponse = await fetch(`/api/products/update?user_id=${supabaseUser.id}&product_id=${updatedProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedProduct)
        })
        
        if (updateResponse.ok) {
          const updateResult = await updateResponse.json()
          console.log('✅ Produto atualizado:', updateResult)
          
          // Atualizar o estado local apenas se a API foi bem-sucedida
          setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p))
          setProductToEdit(null)
          setIsProductFormOpen(false)
          
          toast({
            title: "Sucesso",
            description: "Produto atualizado com sucesso!",
          })
        } else {
          const errorText = await updateResponse.text()
          console.error('❌ Erro ao atualizar produto:', errorText)
          toast({
            title: "Erro",
            description: "Não foi possível atualizar o produto. Tente novamente.",
            variant: "destructive",
          })
        }
      } else {
        console.error('❌ Usuário não encontrado no Supabase')
        toast({
          title: "Erro",
          description: "Usuário não encontrado. Faça login novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar produto:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar produto.",
        variant: "destructive",
      })
    }
  }

  const handleProductDeleted = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId))
    setIsDetailViewOpen(false)
    toast({
      title: "Sucesso",
      description: "Produto excluído com sucesso!",
    })
  }

  const handleSaleCreated = (sale: any) => {
    // Update the product with new sale data
    setProducts(prev => prev.map(p => {
      if (p.id === sale.productId) {
        return {
          ...p,
          quantitySold: p.quantitySold + sale.quantity,
          status: p.quantitySold + sale.quantity >= p.quantity ? 'sold' : p.status
        }
      }
      return p
    }))
    setIsSaleFormOpen(false)
    toast({
      title: "Sucesso",
      description: "Venda registrada com sucesso!",
    })
  }

  const handleRefresh = () => {
    fetchProducts()
  }

  const handleExport = () => {
    // Exportação agora é feita diretamente no sidebar
    toast({
      title: "Exportar",
      description: "Use as opções de exportação no sidebar.",
    })
  }

  const handleImport = () => {
    // Importação será implementada em breve
    toast({
      title: "Importar",
      description: "Funcionalidade de importação será implementada em breve.",
    })
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <ProductsSidebar
        products={products}
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        supplierFilter={supplierFilter}
        onSearchChange={setSearchQuery}
        onCategoryFilterChange={setCategoryFilter}
        onStatusFilterChange={setStatusFilter}
        onSupplierFilterChange={setSupplierFilter}
        onAddProduct={handleAddProduct}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onImport={handleImport}
        isLoading={isLoading}
        isMobile={isMobile}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                {/* Mobile Sidebar Toggle */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-2 border-2 hover:border-primary"
                >
                  <Menu className="h-4 w-4" />
                  <span className="text-xs">Menu</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = '/'}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h1 className="text-xl sm:text-2xl font-bold">Produtos</h1>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={isLoading}
                className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                <span className="hidden sm:inline ml-1">Atualizar</span>
              </Button>
              <Button 
                onClick={handleAddProduct}
                className="h-8 sm:h-9 text-sm"
              >
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Adicionar Produto</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Filters Indicator */}
        {(searchQuery || categoryFilter !== "all" || statusFilter !== "all" || supplierFilter !== "all") && (
          <div className="lg:hidden border-b bg-muted/30 p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">Filtros ativos:</span>
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Busca: "{searchQuery}"
                </Badge>
              )}
              {categoryFilter !== "all" && (
                <Badge variant="outline" className="text-xs">
                  Categoria: {categoryFilter}
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="outline" className="text-xs">
                  Status: {statusFilter}
                </Badge>
              )}
              {supplierFilter !== "all" && (
                <Badge variant="outline" className="text-xs">
                  Fornecedor: {supplierFilter}
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearchQuery("")
                  setCategoryFilter("all")
                  setStatusFilter("all")
                  setSupplierFilter("all")
                }}
                className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                Limpar
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="text-sm sm:text-base">Carregando produtos...</span>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 max-w-md">
                {searchQuery || categoryFilter !== "all" || statusFilter !== "all" || supplierFilter !== "all"
                  ? "Tente ajustar os filtros de busca ou limpar todos os filtros."
                  : "Comece adicionando seu primeiro produto."}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                {!searchQuery && categoryFilter === "all" && statusFilter === "all" && supplierFilter === "all" ? (
                  <Button onClick={handleAddProduct} className="text-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Produto
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setCategoryFilter("all")
                      setStatusFilter("all")
                      setSupplierFilter("all")
                    }}
                    className="text-sm"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                )}
                <Button 
                  variant="ghost"
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-sm lg:hidden"
                >
                  <Menu className="h-4 w-4 mr-2" />
                  Abrir Filtros
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {/* Results Info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExport}
                    className="h-8 text-xs sm:h-9 sm:text-sm"
                  >
                    <Download className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Exportar</span>
                    <span className="sm:hidden">Exp</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleImport}
                    className="h-8 text-xs sm:h-9 sm:text-sm"
                  >
                    <Upload className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Importar</span>
                    <span className="sm:hidden">Imp</span>
                  </Button>
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => handleProductSelect(product)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] sm:max-h-[90vh] w-[95vw] sm:w-auto">
          <ProductForm
            onSave={productToEdit ? handleProductUpdated : handleProductCreated}
            productToEdit={productToEdit}
            onCancel={() => {
              setProductToEdit(null)
              setIsProductFormOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] w-[95vw] sm:w-auto p-0 overflow-hidden">
          {selectedProduct && (
            <ProductDetailView
              product={selectedProduct}
              onEdit={() => {
                if (selectedProduct) {
                  handleEditProduct(selectedProduct)
                }
              }}
              onDelete={() => {
                if (selectedProduct) {
                  handleProductDeleted(selectedProduct.id)
                }
              }}
              onRegisterSale={() => setIsSaleFormOpen(true)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isSaleFormOpen} onOpenChange={setIsSaleFormOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Registrar Venda</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <SaleForm
              product={selectedProduct}
              onSave={(saleData) => {
                handleSaleCreated({
                  ...saleData,
                  productId: selectedProduct.id,
                  date: new Date()
                })
              }}
              onCancel={() => setIsSaleFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isTrackingViewOpen} onOpenChange={setIsTrackingViewOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Acompanhamento de Envio</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <TrackingView
              trackingCode={selectedProduct.trackingCode}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
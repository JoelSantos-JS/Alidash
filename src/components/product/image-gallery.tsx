"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X, Upload, Image as ImageIcon, ArrowUp, ArrowDown } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProductImage } from "@/types";

interface ImageGalleryProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  maxImages?: number;
  userId?: string;
  productId?: string;
}

export function ImageGallery({ images, onChange, maxImages = 5, userId, productId }: ImageGalleryProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageType, setNewImageType] = useState<"main" | "gallery" | "thumbnail">("gallery");
  const [newImageAlt, setNewImageAlt] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !productId) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/images/list?user_id=${userId}&product_id=${productId}&page=${page}&page_size=${pageSize}`)
        if (res.ok) {
          const data = await res.json()
          onChange(data.images || [])
          setTotal(data.total || 0)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId, productId, page, pageSize])

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) return;
    if (userId && productId) {
      try {
        const res = await fetch(`/api/products/images/create?user_id=${userId}&product_id=${productId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: newImageUrl.trim(), type: newImageType, alt: newImageAlt.trim() || 'Imagem do produto' })
        })
        if (res.ok) {
          const data = await res.json()
          const created: ProductImage = data.image
          onChange([...images, created])
        } else {
          const created: ProductImage = {
            id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
            url: newImageUrl.trim(),
            type: newImageType,
            alt: newImageAlt.trim() || 'Imagem do produto',
            created_at: new Date().toISOString(),
            order: images.length + 1
          }
          onChange([...images, created])
        }
      } catch {
        const created: ProductImage = {
          id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
          url: newImageUrl.trim(),
          type: newImageType,
          alt: newImageAlt.trim() || 'Imagem do produto',
          created_at: new Date().toISOString(),
          order: images.length + 1
        }
        onChange([...images, created])
      }
    } else {
      const created: ProductImage = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        url: newImageUrl.trim(),
        type: newImageType,
        alt: newImageAlt.trim() || 'Imagem do produto',
        created_at: new Date().toISOString(),
        order: images.length + 1
      }
      onChange([...images, created])
    }
    setNewImageUrl("");
    setNewImageAlt("");
    setIsAddDialogOpen(false);
  };

  const handleRemoveImage = async (imageId: string) => {
    if (userId && productId) {
      try {
        await fetch(`/api/products/images/delete?user_id=${userId}&product_id=${productId}&image_id=${imageId}`, { method: 'DELETE' })
      } catch {}
    }
    const updatedImages = images.filter(img => img.id !== imageId);
    const reorderedImages = updatedImages.map((img, index) => ({ ...img, order: baseOrder + index + 1 }));
    onChange(reorderedImages);
    if (userId && productId) {
      try {
        const items = reorderedImages.map(img => ({ id: img.id, order: img.order || baseOrder + 1 }))
        await fetch(`/api/products/images/reorder?user_id=${userId}&product_id=${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items })
        })
      } catch {}
    }
  };

  const handleSetAsMain = async (imageId: string) => {
    if (userId && productId) {
      try {
        await fetch(`/api/products/images/set-main?user_id=${userId}&product_id=${productId}&image_id=${imageId}`, { method: 'PUT' })
      } catch {}
    }
    const updatedImages = images.map(img => ({ ...img, type: img.id === imageId ? 'main' as const : (img.type === 'main' ? 'gallery' as const : img.type) }));
    onChange(updatedImages);
  };

  const baseOrder = useMemo(() => (page - 1) * pageSize, [page, pageSize])

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return
    const swapped = [...images]
    const tmp = swapped[index - 1]
    swapped[index - 1] = swapped[index]
    swapped[index] = tmp
    const withOrders = swapped.map((img, i) => ({ ...img, order: baseOrder + i + 1 }))
    onChange(withOrders)
    if (userId && productId) {
      try {
        const items = withOrders.map(img => ({ id: img.id, order: img.order || baseOrder + 1 }))
        await fetch(`/api/products/images/reorder?user_id=${userId}&product_id=${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items })
        })
      } catch {}
    }
  }

  const handleMoveDown = async (index: number) => {
    if (index >= images.length - 1) return
    const swapped = [...images]
    const tmp = swapped[index + 1]
    swapped[index + 1] = swapped[index]
    swapped[index] = tmp
    const withOrders = swapped.map((img, i) => ({ ...img, order: baseOrder + i + 1 }))
    onChange(withOrders)
    if (userId && productId) {
      try {
        const items = withOrders.map(img => ({ id: img.id, order: img.order || baseOrder + 1 }))
        await fetch(`/api/products/images/reorder?user_id=${userId}&product_id=${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items })
        })
      } catch {}
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "main": return "bg-blue-500";
      case "gallery": return "bg-green-500";
      case "thumbnail": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "main": return "Principal";
      case "gallery": return "Galeria";
      case "thumbnail": return "Miniatura";
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Galeria de Imagens</Label>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              disabled={images.length >= maxImages}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Imagem
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Imagem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="imageUrl">URL da Imagem *</Label>
                <Input
                  id="imageUrl"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="imageType">Tipo da Imagem</Label>
                <Select value={newImageType} onValueChange={(value: any) => setNewImageType(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Principal</SelectItem>
                    <SelectItem value="gallery">Galeria</SelectItem>
                    <SelectItem value="thumbnail">Miniatura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="imageAlt">Texto Alternativo</Label>
                <Input
                  id="imageAlt"
                  value={newImageAlt}
                  onChange={(e) => setNewImageAlt(e.target.value)}
                  placeholder="Descrição da imagem"
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  onClick={handleAddImage}
                  disabled={!newImageUrl.trim()}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {images.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Nenhuma imagem adicionada ainda
            </p>
            <p className="text-xs text-muted-foreground">
              Adicione até {maxImages} imagens para o produto
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((image, idx) => (
            <Card key={image.id} className="relative group">
              <CardContent className="p-2">
                <div className="relative aspect-square">
                  <SafeImage
                    src={image.url}
                    alt={image.alt}
                    fill
                    className="object-cover rounded-md"
                  />
                  
                  {/* Badge do tipo */}
                  <Badge 
                    className={`absolute top-1 left-1 text-xs ${getTypeColor(image.type)} text-white border-0`}
                  >
                    {getTypeLabel(image.type)}
                  </Badge>
                  
                  {/* Botões de ação */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {image.type !== "main" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-6 w-6 p-0"
                        onClick={() => handleSetAsMain(image.id)}
                        title="Definir como principal"
                      >
                        <ImageIcon className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMoveUp(idx)}
                      title="Mover para cima"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMoveDown(idx)}
                      title="Mover para baixo"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="h-6 w-6 p-0"
                      onClick={() => handleRemoveImage(image.id)}
                      title="Remover imagem"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Texto alternativo */}
                <p className="text-xs text-muted-foreground mt-2 truncate" title={image.alt}>
                  {image.alt}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-muted-foreground">
          Página {page} de {Math.max(1, Math.ceil(total / pageSize))}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={loading || page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
          <Button type="button" variant="outline" size="sm" disabled={loading || page >= Math.ceil(total / pageSize)} onClick={() => setPage(p => p + 1)}>Próxima</Button>
        </div>
      </div>
    </div>
  );
}
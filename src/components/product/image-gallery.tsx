"use client";

import { useState } from "react";
import { Plus, X, Upload, Image as ImageIcon } from "lucide-react";
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
}

export function ImageGallery({ images, onChange, maxImages = 5 }: ImageGalleryProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageType, setNewImageType] = useState<"main" | "gallery" | "thumbnail">("gallery");
  const [newImageAlt, setNewImageAlt] = useState("");

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;

    const newImage: ProductImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: newImageUrl.trim(),
      type: newImageType,
      alt: newImageAlt.trim() || "Imagem do produto",
      created_at: new Date().toISOString(),
      order: images.length + 1
    };

    onChange([...images, newImage]);
    setNewImageUrl("");
    setNewImageAlt("");
    setIsAddDialogOpen(false);
  };

  const handleRemoveImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    // Reordenar as imagens
    const reorderedImages = updatedImages.map((img, index) => ({
      ...img,
      order: index + 1
    }));
    onChange(reorderedImages);
  };

  const handleSetAsMain = (imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      type: img.id === imageId ? "main" as const : (img.type === "main" ? "gallery" as const : img.type)
    }));
    onChange(updatedImages);
  };

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
          {images.map((image) => (
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
      
      {images.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {images.length} de {maxImages} imagens adicionadas
        </p>
      )}
    </div>
  );
}
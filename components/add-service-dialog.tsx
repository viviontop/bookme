"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { X, Plus } from "lucide-react"

const categories = ["Beauty", "Photography", "Fitness", "Wellness", "Education", "Consulting", "Other"]

interface AddServiceDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function AddServiceDialog({ open, onOpenChange }: AddServiceDialogProps) {
  const { user } = useAuth()
  const { addService } = useData()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    duration: "",
    category: "",
  })
  const [serviceImages, setServiceImages] = useState<string[]>([])

  const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = document.createElement("img")
        img.onload = () => {
          const canvas = document.createElement("canvas")
          let width = img.width
          let height = img.height

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Could not get canvas context"))
            return
          }
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Canvas is empty"))
                return
              }
              const reader2 = new FileReader()
              reader2.onloadend = () => resolve(reader2.result as string)
              reader2.readAsDataURL(blob)
            },
            "image/jpeg",
            quality
          )
        }
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const file = files[0]
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5MB")
      return
    }

    try {
      const compressed = await compressImage(file)
      if (serviceImages.length < 5) {
        setServiceImages([...serviceImages, compressed])
      }
    } catch (error) {
      console.error("Error compressing image:", error)
      alert("Failed to process image")
    }

    // Reset input
    e.target.value = ""
  }

  const handleRemoveImage = (index: number) => {
    setServiceImages(serviceImages.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (serviceImages.length === 0) {
      alert("Please add at least one service image")
      return
    }

    const result = await addService({
      sellerId: user.id,
      title: formData.title,
      description: formData.description,
      price: Number.parseFloat(formData.price),
      duration: Number.parseInt(formData.duration),
      category: formData.category,
      images: serviceImages,
      isActive: true,
    })

    if (result.success) {
      setFormData({ title: "", description: "", price: "", duration: "", category: "" })
      setServiceImages([])
      onOpenChange(false)
    } else {
      alert(result.error || "Failed to create service")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Service</DialogTitle>
          <DialogDescription>Create a new service listing for your profile</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Service Images */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Service Images *</Label>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {serviceImages.map((img, index) => (
                <div
                  key={index}
                  className="group relative aspect-square overflow-hidden rounded-lg border-2 border-border bg-muted"
                >
                  <Image src={img} alt={`Service ${index + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {serviceImages.length < 5 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-all hover:border-primary hover:bg-muted">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                  <span className="mt-2 text-sm text-muted-foreground">Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Upload up to 5 images (max 5MB each)
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">Service Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Professional Portrait Photography"
              required
              className="h-11 text-base"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your service, what's included, and what makes it special..."
              rows={5}
              className="resize-none text-base"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price" className="text-base font-semibold">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="99"
                required
                min="0"
                step="0.01"
                className="h-11 text-base"
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-base font-semibold">Duration (min) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="60"
                required
                min="15"
                step="15"
                className="h-11 text-base"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-base font-semibold">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="h-11 text-base">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-base">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} size="lg">
              Cancel
            </Button>
            <Button type="submit" size="lg" className="min-w-32">
              Create Service
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

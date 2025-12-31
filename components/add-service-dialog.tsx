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
          } else if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
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
                reject(new Error("Failed to compress image"))
                return
              }
              const fileReader = new FileReader()
              fileReader.onloadend = () => resolve(fileReader.result as string)
              fileReader.onerror = reject
              fileReader.readAsDataURL(blob)
            },
            "image/jpeg",
            quality
          )
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // Limit to 5 images to prevent quota issues
    const filesToProcess = Array.from(files).slice(0, 5 - serviceImages.length)

    if (filesToProcess.length < Array.from(files).length) {
      alert("Maximum 5 images allowed. Only the first 5 will be uploaded.")
    }

    for (const file of filesToProcess) {
      if (!file.type.startsWith("image/")) {
        alert("Please select image files only")
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB")
        continue
      }

      try {
        const compressedImage = await compressImage(file, 800, 600, 0.7)
        setServiceImages((prev) => [...prev, compressedImage])
      } catch (error) {
        console.error("Error compressing image:", error)
        alert("Failed to process image. Please try again.")
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    setServiceImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const images = serviceImages.length > 0
      ? serviceImages
      : ["/placeholder.svg?height=300&width=400&query=" + encodeURIComponent(formData.title)]

    try {
      const result = await addService({
        sellerId: user.id,
        title: formData.title,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        duration: Number.parseInt(formData.duration),
        category: formData.category,
        images,
        isActive: true,
      })

      if (result.success) {
        setFormData({ title: "", description: "", price: "", duration: "", category: "" })
        setServiceImages([])
        onOpenChange(false)
      } else {
        alert(result.error || "Failed to create service")
      }
    } catch (error) {
      alert("An unexpected error occurred")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
          <DialogDescription>Create a new service for clients to book</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Service Title</Label>
            <Input
              id="title"
              placeholder="e.g., Haircut & Styling"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your service..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="50.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                step="15"
                placeholder="60"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Service Photos</Label>
            <div className="space-y-2">
              <input
                type="file"
                id="images"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("images")?.click()}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Upload Photos
              </Button>
              {serviceImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {serviceImages.map((img, index) => (
                    <div key={`service-img-${img.substring(0, 20)}-${index}`} className="relative aspect-video rounded-lg overflow-hidden border border-border">
                      <Image
                        src={img}
                        alt={`Service image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Upload up to 5 photos. Images will be automatically compressed. JPG, PNG or GIF. Max 5MB each.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Service
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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

const categories = ["Beauty", "Photography", "Fitness", "Wellness", "Education", "Consulting", "Other"]

interface AddServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    addService({
      sellerId: user.id,
      title: formData.title,
      description: formData.description,
      price: Number.parseFloat(formData.price),
      duration: Number.parseInt(formData.duration),
      category: formData.category,
      images: ["/placeholder.svg?height=300&width=400&query=" + encodeURIComponent(formData.title)],
      isActive: true,
    })

    setFormData({ title: "", description: "", price: "", duration: "", category: "" })
    onOpenChange(false)
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

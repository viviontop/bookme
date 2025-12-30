"use client"

import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import type { Area } from "react-easy-crop"

interface ImageCropperProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  onCropComplete: (croppedImage: string, aspectRatio?: number) => void
  aspectRatio?: number
  cropShape?: "rect" | "round"
}

export function ImageCropper({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspectRatio = undefined,
  cropShape = "rect",
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop)
  }, [])

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom)
  }, [])

  const onCropAreaChange = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener("load", () => resolve(image))
      image.addEventListener("error", () => reject(new Error("Failed to load image")))
      image.src = url
    })

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
  ): Promise<string> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("No 2d context")
    }

    // The pixelCrop coordinates from react-easy-crop are already relative to the natural image size
    // Set canvas size to the cropped area
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // Draw the cropped portion of the image directly
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    )

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"))
            return
          }
          const reader = new FileReader()
          reader.addEventListener("load", () => resolve(reader.result as string))
          reader.addEventListener("error", reject)
          reader.readAsDataURL(blob)
        },
        "image/jpeg",
        0.9,
      )
    })
  }

  const handleCropComplete = async () => {
    if (!croppedAreaPixels) return

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
      // Calculate aspect ratio from cropped area
      const calculatedAspectRatio = croppedAreaPixels.width / croppedAreaPixels.height
      onCropComplete(croppedImage, calculatedAspectRatio)
      onOpenChange(false)
      // Reset state
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    } catch (error) {
      console.error("Error cropping image:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
          <DialogDescription>Adjust the crop area and zoom to your liking</DialogDescription>
        </DialogHeader>
        <div className="relative h-[400px] w-full bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaChange}
            cropShape={cropShape}
            restrictPosition={true}
            style={{
              containerStyle: {
                width: "100%",
                height: "100%",
                position: "relative",
              },
            }}
          />
        </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="zoom-slider" className="text-sm font-medium">Zoom</label>
              <Slider
                id="zoom-slider"
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(value) => setZoom(value[0])}
              />
            </div>
          </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCropComplete}>Apply Crop</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


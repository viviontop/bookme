"use client"

import { useState, useRef, useCallback } from "react"
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, type PixelCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
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

interface BannerCropperProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly imageSrc: string
  readonly onCropComplete: (croppedImage: string, aspectRatio?: number) => void
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function BannerCropper({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
}: BannerCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const imgRef = useRef<HTMLImageElement>(null)

  const onImageLoad = useCallback(() => {
    const initialCrop = {
      unit: "%" as const,
      width: 80,
      height: 30,
      x: 10,
      y: 35,
    }
    setCrop(initialCrop)
  }, [])

  const getCroppedImg = async (
    image: HTMLImageElement,
    pixelCrop: PixelCrop,
  ): Promise<string> => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("No 2d context")
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
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
    if (!completedCrop || !imgRef.current) return

    try {
      const croppedImage = await getCroppedImg(imgRef.current, completedCrop)
      const aspectRatio = completedCrop.width / completedCrop.height
      onCropComplete(croppedImage, aspectRatio)
      onOpenChange(false)
      // Reset state
      setCrop(undefined)
      setCompletedCrop(undefined)
      setScale(1)
    } catch (error) {
      console.error("Error cropping image:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Crop Banner</DialogTitle>
          <DialogDescription>
            Drag the corners to resize and adjust the crop area. You can change the aspect ratio freely.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ maxHeight: "500px" }}>
            {imageSrc && (
              <div className="flex items-center justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={undefined}
                  minWidth={100}
                  minHeight={50}
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imageSrc}
                    style={{
                      transform: `scale(${scale})`,
                      maxWidth: "100%",
                      maxHeight: "500px",
                      objectFit: "contain",
                    }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="scale-slider" className="text-sm font-medium">Zoom</label>
            <Slider
              id="scale-slider"
              value={[scale]}
              min={0.5}
              max={2}
              step={0.1}
              onValueChange={(value) => setScale(value[0])}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCropComplete} disabled={!completedCrop}>
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


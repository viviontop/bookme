"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { seedDemoData } from "@/lib/seed-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Upload, Check, Shield, AlertCircle, FileText, Camera, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

const steps = [
  { id: 1, title: "Personal Info", icon: FileText },
  { id: 2, title: "ID Document", icon: CreditCard },
  { id: 3, title: "Selfie", icon: Camera },
]

export default function KYCPage() {
  const { user, isLoading: authLoading, updateUser } = useAuth()
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    legalName: "",
    dateOfBirth: "",
    address: "",
    idFront: null as File | null,
    idBack: null as File | null,
    selfie: null as File | null,
  })

  useEffect(() => {
    seedDemoData()
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
    if (user && user.kycStatus === "verified") {
      router.push("/settings")
    }
  }, [authLoading, user, router])

  const handleFileChange = (field: "idFront" | "idBack" | "selfie") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, [field]: file })
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    updateUser({
      kycStatus: "submitted",
      kycDocuments: {
        idFront: formData.idFront?.name,
        idBack: formData.idBack?.name,
        selfie: formData.selfie?.name,
      },
    })

    setIsSubmitting(false)
    router.push("/settings")
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Identity Verification</h1>
          <p className="mt-1 text-muted-foreground">Complete verification to unlock all platform features</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                      currentStep > step.id
                        ? "bg-primary text-primary-foreground"
                        : currentStep === step.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {currentStep > step.id ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      currentStep >= step.id ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="mx-2 h-0.5 flex-1 bg-border">
                    <div className={cn("h-full bg-primary transition-all", currentStep > step.id ? "w-full" : "w-0")} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Personal Information"}
              {currentStep === 2 && "Upload ID Document"}
              {currentStep === 3 && "Take a Selfie"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Confirm your legal name and date of birth"}
              {currentStep === 2 && "Upload clear photos of your government-issued ID"}
              {currentStep === 3 && "Take a photo holding your ID for verification"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Your name and date of birth must match your ID document exactly</AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Full Name</Label>
                  <Input
                    id="legalName"
                    placeholder="As shown on your ID"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Residential Address</Label>
                  <Input
                    id="address"
                    placeholder="Street address, City, State, ZIP"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={() => setCurrentStep(2)}
                  disabled={!formData.legalName || !formData.dateOfBirth || !formData.address}
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Step 2: ID Upload */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Accepted documents: Passport, Driver&apos;s License, or National ID
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Front of ID</Label>
                  <label
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:bg-muted",
                      formData.idFront ? "border-primary bg-primary/5" : "border-border",
                    )}
                  >
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange("idFront")} />
                    {formData.idFront ? (
                      <>
                        <Check className="h-8 w-8 text-primary" />
                        <span className="mt-2 text-sm font-medium text-primary">{formData.idFront.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="mt-2 text-sm text-muted-foreground">Click to upload front of ID</span>
                      </>
                    )}
                  </label>
                </div>

                <div className="space-y-2">
                  <Label>Back of ID</Label>
                  <label
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:bg-muted",
                      formData.idBack ? "border-primary bg-primary/5" : "border-border",
                    )}
                  >
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange("idBack")} />
                    {formData.idBack ? (
                      <>
                        <Check className="h-8 w-8 text-primary" />
                        <span className="mt-2 text-sm font-medium text-primary">{formData.idBack.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="mt-2 text-sm text-muted-foreground">Click to upload back of ID</span>
                      </>
                    )}
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setCurrentStep(3)}
                    disabled={!formData.idFront || !formData.idBack}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Selfie */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Take a clear selfie while holding your ID next to your face. Make sure both your face and ID are
                    clearly visible.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Selfie with ID</Label>
                  <label
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:bg-muted",
                      formData.selfie ? "border-primary bg-primary/5" : "border-border",
                    )}
                  >
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange("selfie")} />
                    {formData.selfie ? (
                      <>
                        <Check className="h-10 w-10 text-primary" />
                        <span className="mt-2 text-sm font-medium text-primary">{formData.selfie.name}</span>
                      </>
                    ) : (
                      <>
                        <Camera className="h-10 w-10 text-muted-foreground" />
                        <span className="mt-2 text-sm text-muted-foreground">Click to upload selfie</span>
                      </>
                    )}
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setCurrentStep(2)}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={handleSubmit} disabled={!formData.selfie || isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Submit for Review
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your documents are encrypted and securely stored. We comply with all data protection regulations.
        </p>
      </div>
    </div>
  )
}

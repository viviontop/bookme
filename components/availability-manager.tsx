"use client"

import { useState, useEffect } from "react"
import { useData } from "@/lib/data-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Clock, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function AvailabilityManager() {
    const { availability, setAvailability } = useData()
    const [localAvail, setLocalAvail] = useState<any[]>([])
    const [isSaving, setIsSaving] = useState(false)

    // Initialize local state from context availability
    useEffect(() => {
        const initial = days.map((day, i) => {
            const existing = availability.find(a => a.dayOfWeek === i)
            return {
                dayOfWeek: i,
                dayName: day,
                isActive: existing ? existing.isActive : false,
                startTime: existing ? existing.startTime : "09:00",
                endTime: existing ? existing.endTime : "17:00"
            }
        })
        setLocalAvail(initial)
    }, [availability])

    const handleToggle = (index: number) => {
        setLocalAvail(prev => prev.map((d, i) => i === index ? { ...d, isActive: !d.isActive } : d))
    }

    const handleTimeChange = (index: number, field: "startTime" | "endTime", value: string) => {
        setLocalAvail(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d))
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await setAvailability(localAvail)
            toast.success("Availability saved successfully")
        } catch (error) {
            toast.error("Failed to save availability")
        } finally {
            setIsSaving(false)
        }
    }

    if (localAvail.length === 0) return null

    return (
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Weekly Schedule</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1.5 font-medium">Define your working hours for each day of the week</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2 h-10 px-5 shadow-lg shadow-primary/20">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
                {localAvail.map((day, i) => (
                    <div key={day.dayOfWeek} className="group flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:bg-muted/40 bg-muted/20 border border-border/40">
                        <div className="flex items-center gap-5 min-w-[140px]">
                            <Switch
                                checked={day.isActive}
                                onCheckedChange={() => handleToggle(i)}
                                className="data-[state=checked]:bg-primary"
                            />
                            <Label className={cn("font-bold text-sm transition-colors", day.isActive ? "text-foreground" : "text-muted-foreground opacity-60")}>
                                {day.dayName}
                            </Label>
                        </div>

                        {day.isActive ? (
                            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
                                <div className="relative flex items-center">
                                    <Clock className="absolute left-3 h-3.5 w-3.5 text-muted-foreground z-10" />
                                    <Input
                                        type="time"
                                        value={day.startTime}
                                        onChange={(e) => handleTimeChange(i, "startTime", e.target.value)}
                                        className="h-10 w-28 bg-background pl-9 pr-3 rounded-lg border-border/60 focus:ring-primary/20"
                                    />
                                </div>
                                <span className="text-muted-foreground font-black opacity-30">—</span>
                                <div className="relative flex items-center">
                                    <Clock className="absolute left-3 h-3.5 w-3.5 text-muted-foreground z-10" />
                                    <Input
                                        type="time"
                                        value={day.endTime}
                                        onChange={(e) => handleTimeChange(i, "endTime", e.target.value)}
                                        className="h-10 w-28 bg-background pl-9 pr-3 rounded-lg border-border/60 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="px-4 py-1.5 rounded-full bg-muted/50 border border-border/30 text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">
                                Unavailable
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ")
}

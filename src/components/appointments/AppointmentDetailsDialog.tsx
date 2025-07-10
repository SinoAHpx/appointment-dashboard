"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { type Appointment } from "@/lib/stores/appointments";
import { Eye } from "lucide-react";
import { AppointmentDetailCard } from "./AppointmentDetailCard";

interface AppointmentDetailsDialogProps {
    appointment: Appointment;
    trigger?: React.ReactNode;
}

export function AppointmentDetailsDialog({
    appointment,
    trigger,
}: AppointmentDetailsDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="icon">
                        <Eye size={16} />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[80%] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle></DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <AppointmentDetailCard appointment={appointment} />
                </div>
            </DialogContent>
        </Dialog>
    );
} 
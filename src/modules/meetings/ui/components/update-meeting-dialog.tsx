import {ResponsiveDialog} from "@/components/responsive-dialog";
import {MeetingForm} from "@/modules/meetings/ui/components/meeting-form";
import {MeetingGetOne} from "@/modules/meetings/types";

interface UpdateMeetingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues: MeetingGetOne;
};

export const UpdateMeetingDialog = ({open, onOpenChange, initialValues}:UpdateMeetingDialogProps) => {
    return (
        <ResponsiveDialog
            title={"Update Meeting"}
            description={"Update the details of your meeting."}
            open={open}
            onOpenChange={onOpenChange}
        >
            <MeetingForm
                onSuccess={() => {
                    onOpenChange(false);
                }}
                onCancel={() => onOpenChange(false)}
                initialValues={initialValues}
            />
        </ResponsiveDialog>
    )
}

import {ResponsiveDialog} from "@/components/responsive-dialog";
import {AgentForm} from "@/modules/agents/ui/components/agent-form";

interface NewAgentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const NewAgentDialog = ({open, onOpenChange}:NewAgentDialogProps) => {
    return (
        <ResponsiveDialog
            title={"New Agent"}
            description={"Create a new agent to automate tasks and workflows."}
            open={open}
            onOpenChange={onOpenChange}
        >
            <AgentForm
                onSuccess={() => onOpenChange(false)}
                onCancel={() => onOpenChange(false)}
            />
        </ResponsiveDialog>
    )
}

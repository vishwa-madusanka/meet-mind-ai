"use client";
import {useTRPC} from "@/trpc/client";
import {useMutation, useQueryClient, useSuspenseQuery} from "@tanstack/react-query";
import {LoadingState} from "@/components/loading-state";
import {ErrorState} from "@/components/error-state";
import {AgentIdViewHeader} from "@/modules/agents/ui/views/agent-id-view-header";
import {GeneratedAvatar} from "@/components/generated-avatar";
import {Badge} from "@/components/ui/badge";
import {VideoIcon} from "lucide-react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {UseConfirm} from "@/hooks/use-confirm";
import {useState} from "react";
import {UpdateAgentDialog} from "@/modules/agents/ui/components/update-agent-dialog";

interface Props {
    agentId: string;
}

export const AgentIdView = ({agentId}:Props) => {
    const trpc = useTRPC();
    const router = useRouter();
    const[updateAgentDialogOpen, setUpdateAgentDialogOpen] = useState(false);
    const {data} = useSuspenseQuery(trpc.agents.getOne.queryOptions({id: agentId}));
    const queryClient = useQueryClient();
    const removeAgent = useMutation(
        trpc.agents.remove.mutationOptions({
            onSuccess: async () => {
               await queryClient.invalidateQueries(trpc.agents.getMany.queryOptions({}));
                //invalidate free tier usage
                router.push("/agents");
            },
            onError: (error) => {
                toast.error(error.message);
            },
        })
    );

    const [RemoveConfirmation, confirmRemove] = UseConfirm(
        "Are you sure you want to delete this agent?",
        `The following agent will be deleted: ${data.meetingCount} associated meetings`
    );
    const handleRemoveAgent = async () => {
        const ok = await confirmRemove();
        if (!ok) return;

        await removeAgent.mutateAsync({id: agentId});
    }
    return (
        <>
            <RemoveConfirmation />
            <UpdateAgentDialog
                open={updateAgentDialogOpen}
                onOpenChange={setUpdateAgentDialogOpen}
                initialValues={data}
            />
            <div className={'flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4'}>
                <AgentIdViewHeader
                agentId={agentId}
                agentName={data.name}
                onEdit={() => setUpdateAgentDialogOpen(true)}
                onRemove={handleRemoveAgent}
                />
                <div className={'bg-white rounded-lg border'}>
                    <div className={'px-4 py-5 gap-y-5 flex flex-col col-span-5'}>
                        <div className={'flex items-center gap-x-3'}>
                            <GeneratedAvatar
                                seed={data.name}
                                variant={'botttsNeutral'}
                                className={'size-10'}
                            />
                            <h2 className={'text-2xl font-medium'}>{data.name}</h2>
                        </div>
                        <Badge variant={'outline'} className={'flex items-center gap-x-2 [&>svg]:size-4'}>
                            <VideoIcon className={'text-blue-700'}/>
                            {data.meetingCount}{data.meetingCount === 1 ? ' Meeting' : ' Meetings'}
                        </Badge>
                        <div className={'flex flex-col gap-y-4'}>
                            <p className={'text-lg font-medium'}>Instructions</p>
                            <p className={'text-neutral-800'}>{data.instructions}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export const AgentIdViewLoading = () => {
    return (
        <LoadingState
            title="Loading Agent..."
            description="Please wait while we load the agents."
        />
    )}

export const AgentIdViewError = () => {
    return (
        <ErrorState
            title="Error Loading Agent"
            description="An error occurred while loading the agents."
        />)
}

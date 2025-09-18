import { MeetingGetOne } from "@/modules/meetings/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
    BookOpenTextIcon,
    ClockFadingIcon,
    FileTextIcon,
    FileVideoIcon,
    SparkleIcon,
    SparklesIcon,
    EditIcon,
    TrashIcon,
    SaveIcon,
    XIcon,
} from "lucide-react";
import Link from "next/link";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import Markdown from "react-markdown";
import { Transcript } from "@/components/ui/transcipt";
import { ChatProvider } from "@/modules/agents/ui/components/chat-provider";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Props {
    data: MeetingGetOne;
}

export const CompletedState = ({ data }: Props) => {
    const [isEditing, setIsEditing] = useState(false);
    const [summaryContent, setSummaryContent] = useState(data.summary || "");

    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const updateSummaryMutation = useMutation(trpc.meetings.updateSummary.mutationOptions());
    const deleteSummaryMutation = useMutation(trpc.meetings.deleteSummary.mutationOptions());

    const handleSave = () => {
        updateSummaryMutation.mutate({ id: data.id, summary: summaryContent }, {
            onSuccess: () => {
                toast.success("Summary saved successfully!");
                // 👇 ADD THIS LINE BACK
                queryClient.invalidateQueries({
                    queryKey: trpc.meetings.getOne.queryKey({ id: data.id }),
                });
                setIsEditing(false);
            },
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            onError: (error, _variables, _context) => {
                toast.error("Failed to save summary", { description: error.message });
            },
        });
    };

    const handleDelete = () => {
        deleteSummaryMutation.mutate({ id: data.id }, {
            onSuccess: () => {
                toast.success("Summary deleted successfully!");
                // 👇 ADD THIS LINE BACK
                queryClient.invalidateQueries({
                    queryKey: trpc.meetings.getOne.queryKey({ id: data.id }),
                });
                setSummaryContent("");
            },
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            onError: (error, _variables, _context) => {
                toast.error("Failed to delete summary", { description: error.message });
            },
        });
    };

    const handleCancel = () => {
        setSummaryContent(data.summary || "");
        setIsEditing(false);
    };

    const isUpdating = updateSummaryMutation.isPending;
    const isDeleting = deleteSummaryMutation.isPending;

    return (
        <div className={'flex flex-col gap-y-4'}>
            <Tabs defaultValue={'summary'}>
                <div className={'bg-white rounded-lg border px-3'}>
                    <ScrollArea>
                        <TabsList
                            className={'p-0 bg-background justify-start rounded-none h-13'}>
                            <TabsTrigger
                                value={'summary'}
                                className={'text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground'}
                            >
                                <BookOpenTextIcon/>
                                Summary
                            </TabsTrigger>
                            <TabsTrigger
                                value={'transcript'}
                                className={'text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground'}
                            >
                                <FileTextIcon/>

                                Transcript
                            </TabsTrigger>
                            <TabsTrigger

                                value={'recording'}
                                className={'text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground'}
                            >

                                <FileVideoIcon/>
                                Recording
                            </TabsTrigger>
                            <TabsTrigger

                                value={'chat'}
                                className={'text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground'}
                            >

                                <SparkleIcon/>
                                Ask AI
                            </TabsTrigger>

                        </TabsList>
                        <ScrollBar orientation={'horizontal'}/>
                    </ScrollArea>
                </div>
                <TabsContent value= "chat">
                    <ChatProvider meetingId ={data.id} meetingName={data.name}/>
                </TabsContent>
                <TabsContent value= "transcript">
                    <Transcript meetingId ={data.id} />
                </TabsContent>
                <TabsContent value={"recording"}>
                    <div className={'bg-white rounded-lg border px-4 py-5'}>
                        <video
                            src={data.recordingUrl!}
                            className={'w-full rounded-lg'}
                            controls
                        />
                    </div>
                </TabsContent>
                <TabsContent value={"summary"}>
                    <div className={'bg-white rounded-lg border'}>
                        <div className={'px-4 py-5 gap-y-5 flex flex-col'}>
                            <h2 className={'text-2xl font-medium capitalize'}>{data.name}</h2>
                            <div className={'flex gap-x-2 items-center'}>
                                <Link
                                    href={`/agents/${data.agent.id}`}
                                    className={'flex items-center gap-x-2 underline underline-offset-4 capitalize'}
                                >
                                    <GeneratedAvatar
                                        seed={data.agent.name}
                                        variant={'botttsNeutral'}
                                        className={'size-5'}
                                    />
                                    {data.agent.name}
                                </Link>{" "}
                                <p>{data.startedAt ? format(data.startedAt, "PPP") : ""}</p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className={'flex gap-x-2 items-center'}>
                                        <SparklesIcon className={'size-4'}/>
                                        <p className="font-medium">Summary</p>
                                    </div>
                                    {isEditing ? (
                                        <div className="flex items-center gap-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCancel}
                                                disabled={isUpdating}
                                            >
                                                <XIcon className="size-4 mr-2"/>
                                                Cancel
                                            </Button>
                                            <Button size="sm" onClick={handleSave} disabled={isUpdating}>
                                                <SaveIcon className="size-4 mr-2"/>
                                                {isUpdating ? "Saving..." : "Save"}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsEditing(true)}
                                            >
                                                <EditIcon className="size-4 mr-2"/>
                                                {data.summary ? "Edit" : "Add Summary"}
                                            </Button>
                                            {data.summary && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="sm" disabled={isDeleting}>
                                                            <TrashIcon className="size-4 mr-2"/>
                                                            Delete
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the meeting summary.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={handleDelete}
                                                                disabled={isDeleting}
                                                            >
                                                                {isDeleting ? "Deleting..." : "Continue"}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <Badge
                                    variant={'outline'}
                                    className={'flex items-center gap-x-2 [&>svg]:size-4 w-fit'}
                                >
                                    <ClockFadingIcon className={'text-blue-700'}/>
                                    {data.duration ? formatDuration(data.duration) : "No duration"}
                                </Badge>
                                <div>
                                    {isEditing ? (
                                        <Textarea
                                            value={summaryContent}
                                            onChange={(e) => setSummaryContent(e.target.value)}
                                            placeholder="Write your meeting summary here..."
                                            className="min-h-[300px]"
                                            disabled={isUpdating}
                                        />
                                    ) : (
                                        <Markdown
                                            components={{
                                                h2: (props) => <h2 className={'text-xl font-medium mb-6'} {...props}/>,
                                                h3: (props) => <h3 className={'text-lg font-medium mb-6'} {...props}/>,
                                                h4: (props) => <h4 className={'text-base font-medium mb-6'} {...props}/>,
                                                p: (props) => <p className={'leading-relaxed mb-6'} {...props}/>,
                                                ul: (props) => <ul className={'list-disc list-inside mb-6'} {...props}/>,
                                                ol: (props) => <ol className={'list-decimal list-inside mb-6'} {...props}/>,
                                                li: (props) => <li className={'mb-1'} {...props}/>,
                                                strong: (props) => <strong className={'font-semibold'} {...props}/>,
                                                code: (props) => <code className={'bg-gray-100 px-1 py-0.5'} {...props}/>,
                                                blockquote: (props) => <blockquote className={'border-l-4 pl-4 italic my-4'} {...props}/>,
                                            }}
                                        >
                                            {data.summary || "No summary available. Click 'Add Summary' to create one."}
                                        </Markdown>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};
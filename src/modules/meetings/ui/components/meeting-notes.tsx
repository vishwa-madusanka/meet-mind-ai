"use client";

import { useEffect, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { noteInsertSchema, noteUpdateSchema } from "@/modules/meetings/schemas";
import { format } from "date-fns";
import { toast } from "sonner";
import type { inferProcedureOutput } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    MoreHorizontal,
    TrashIcon,
    EditIcon,
    PlusIcon,
    MessageSquareIcon,
    CalendarIcon,
    UserIcon,
    MailIcon
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoadingState } from "@/components/loading-state";

type BaseNote = inferProcedureOutput<AppRouter['meetings']['getNotes']>[number];
type Note = Omit<BaseNote, 'createdAt'> & {
    createdAt: string | null;
};

type NoteFormValues = z.infer<typeof noteInsertSchema>;
type NoteUpdateFormValues = z.infer<typeof noteUpdateSchema>;
interface MeetingNotesProps {
    meetingId: string;
}

export const MeetingNotes = ({ meetingId }: MeetingNotesProps) => {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const { data: session } = authClient.useSession();

    const { data: notes, isLoading } = useQuery(trpc.meetings.getNotes.queryOptions({ meetingId }));

    const createNoteMutation = useMutation(trpc.meetings.createNote.mutationOptions());
    const updateNoteMutation = useMutation(trpc.meetings.updateNote.mutationOptions());
    const deleteNoteMutation = useMutation(trpc.meetings.deleteNote.mutationOptions());

    const createForm = useForm<NoteFormValues>({
        resolver: zodResolver(noteInsertSchema),
        defaultValues: {
            meetingId,
            note: "",
            email: session?.user?.email ?? "",
        },
    });

    // Keep the logged in email as default once session loads
    useEffect(() => {
        const sessionEmail = session?.user?.email ?? "";
        if (sessionEmail) {
            const currentEmail = createForm.getValues("email");
            if (!currentEmail) {
                createForm.setValue("email", sessionEmail, { shouldDirty: false });
            }
        }
    }, [session?.user?.email, createForm]);

    const handleCreateSubmit = (values: NoteFormValues) => {
        createNoteMutation.mutate(values, {
            onSuccess: () => {
                toast.success("Note added successfully!");
                void queryClient.invalidateQueries({ queryKey: trpc.meetings.getNotes.queryKey({ meetingId }) });
                createForm.reset({ meetingId, note: "", email: session?.user?.email ?? "" });
            },
            onError: (error) => {
                toast.error("Failed to add note", { description: error.message });
            },
        });
    };

    const updateForm = useForm<NoteUpdateFormValues>({
        resolver: zodResolver(noteUpdateSchema),
    });

    const handleUpdateSubmit = (values: NoteUpdateFormValues) => {
        updateNoteMutation.mutate(values, {
            onSuccess: () => {
                toast.success("Note updated successfully!");
                void queryClient.invalidateQueries({ queryKey: trpc.meetings.getNotes.queryKey({ meetingId }) });
                setIsEditDialogOpen(false);
            },
            onError: (error) => {
                toast.error("Failed to update note", { description: error.message });
            },
        });
    };

    const handleEditClick = (note: Note) => {
        updateForm.reset({ id: note.id, note: note.note });
        setIsEditDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!noteToDelete) return;
        deleteNoteMutation.mutate({ id: noteToDelete.id }, {
            onSuccess: () => {
                toast.success("Note deleted successfully!");
                void queryClient.invalidateQueries({ queryKey: trpc.meetings.getNotes.queryKey({ meetingId }) });
                setNoteToDelete(null);
            },
            onError: (error) => {
                toast.error("Failed to delete note", { description: error.message });
            },
        });
    };

    if (isLoading) {
        return <LoadingState title="Loading notes..." description="Please wait a moment." />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
            <div className="container mx-auto p-6 space-y-8">
                {/* Header Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-green-500/10 rounded-xl">
                                <MessageSquareIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meeting Notes</h1>
                                <p className="text-gray-600 dark:text-gray-300 mt-1">
                                    Collaborate and share insights from your meeting
                                </p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                            {notes?.length || 0} {notes?.length === 1 ? 'Note' : 'Notes'}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Notes List */}
                    <div className="lg:col-span-2 space-y-6">
                        {notes && notes.length > 0 ? (
                            <div className="space-y-4">
                                {notes.map((note, index) => (
                                    <Card key={note.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
                                        <CardHeader className="pb-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-gray-700 shadow-sm">
                                                        <AvatarImage src={note.author.image ?? undefined} />
                                                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold">
                                                            {note.author.name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2">
                                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                                {note.author.name}
                                                            </h4>
                                                            <Badge variant="outline" className="text-xs">
                                                                #{index + 1}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                            <div className="flex items-center space-x-1">
                                                                <CalendarIcon className="h-4 w-4" />
                                                                <span>
                                                                    {note.createdAt ? format(new Date(note.createdAt), "MMM dd, yyyy 'at' hh:mm a") : ""}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {session?.user?.id === note.author.id && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem
                                                                onClick={() => handleEditClick(note as Note)}
                                                                className="cursor-pointer"
                                                            >
                                                                <EditIcon className="mr-2 h-4 w-4" />
                                                                Edit Note
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600 cursor-pointer focus:text-red-600"
                                                                onClick={() => setNoteToDelete(note as Note)}
                                                            >
                                                                <TrashIcon className="mr-2 h-4 w-4" />
                                                                Delete Note
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
                                                <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                                                    {note.note}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                                <MailIcon className="h-4 w-4" />
                                                <span className="text-green-600 dark:text-green-400">{note.email}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800">
                                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                                        <MessageSquareIcon className="h-12 w-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                        No notes yet
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-md">
                                        Be the first to add a note to this meeting. Share your thoughts and insights with the team.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Add Note Form */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6">
                            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-r from-green-500 to-green-600 text-white">
                                <CardHeader className="pb-6 bg-transparent">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-green-400/20 rounded-lg">
                                            <PlusIcon className="h-5 w-5" />
                                        </div>
                                        <CardTitle className="text-xl font-semibold">Add New Note</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 bg-white dark:bg-gray-800 text-foreground">
                                    <Form {...createForm}>
                                        <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-6">
                                            <FormField
                                                control={createForm.control}
                                                name="note"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            Your Note
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                maxLength={500}
                                                                placeholder="Share your thoughts, insights, or action items..."
                                                                className="min-h-32 resize-none border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent rounded-xl"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <div className="flex justify-between items-center">
                                                            <FormDescription className="text-xs text-gray-500">
                                                                3–500 characters. Be descriptive and helpful.
                                                            </FormDescription>
                                                            <div className="text-xs text-gray-400" aria-live="polite">
                                                                <span className={`${(field.value?.length ?? 0) > 450 ? 'text-orange-500' : ''}`}>
                                                                    {(field.value?.length ?? 0)}
                                                                </span>
                                                                <span className="text-gray-300">/500</span>
                                                            </div>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={createForm.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                                                            <UserIcon className="h-4 w-4" />
                                                            <span>Email Address</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="name@company.com"
                                                                className="border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent rounded-xl"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="submit"
                                                disabled={createNoteMutation.isPending}
                                                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                                            >
                                                {createNoteMutation.isPending ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                        Adding Note...
                                                    </>
                                                ) : (
                                                    <>
                                                        <PlusIcon className="mr-2 h-4 w-4" />
                                                        Add Note
                                                    </>
                                                )}
                                            </Button>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-lg rounded-2xl border-0 shadow-2xl">
                    <DialogHeader className="pb-4">
                        <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center space-x-3">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <EditIcon className="h-5 w-5 text-green-600" />
                            </div>
                            <span>Edit Note</span>
                        </DialogTitle>
                    </DialogHeader>
                    <Form {...updateForm}>
                        <form onSubmit={updateForm.handleSubmit(handleUpdateSubmit)} className="space-y-6">
                            <FormField
                                control={updateForm.control}
                                name="note"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Update Your Note
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                maxLength={500}
                                                placeholder="Edit your note..."
                                                className="min-h-32 resize-none border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent rounded-xl"
                                                {...field}
                                            />
                                        </FormControl>
                                        <div className="flex justify-between items-center">
                                            <FormDescription className="text-xs text-gray-500">
                                                3–500 characters. Note cannot be empty or only whitespace.
                                            </FormDescription>
                                            <div className="text-xs text-gray-400" aria-live="polite">
                                                <span className={`${(field.value?.length ?? 0) > 450 ? 'text-orange-500' : ''}`}>
                                                    {(field.value?.length ?? 0)}
                                                </span>
                                                <span className="text-gray-300">/500</span>
                                            </div>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className="gap-3">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" className="rounded-xl">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={updateNoteMutation.isPending}
                                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl"
                                >
                                    {updateNoteMutation.isPending ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
                <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-3">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <TrashIcon className="h-5 w-5 text-red-600" />
                            </div>
                            <span>Delete Note</span>
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                            Are you sure you want to delete this note? This action cannot be undone and the note will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={deleteNoteMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                        >
                            {deleteNoteMutation.isPending ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <TrashIcon className="mr-2 h-4 w-4" />
                                    Delete Note
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

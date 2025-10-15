import {useState} from "react";
import {format} from "date-fns";
import {SearchIcon, Clock}  from "lucide-react";
import Highlighter from "react-highlight-words";
import {useQuery}   from "@tanstack/react-query";
import {useTRPC} from "@/trpc/client";
import {Input} from "@/components/ui/input";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Avatar,AvatarImage} from "@/components/ui/avatar";
import {generateAvatarUri} from "@/lib/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
    meetingId: string;
}
export const Transcript = ({meetingId}: Props) => {
    const trpc = useTRPC();
    const {data} = useQuery(trpc.meetings.getTranscript.queryOptions({id: meetingId}))

    const [searchQuery, setSearchQuery] = useState("");
    const filteredData = (data ?? []).filter((item) =>
        item.text.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );

    const total = data?.length ?? 0;

    return(
        <Card className="w-full border-0 shadow-sm rounded-2xl overflow-hidden bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="bg-transparent py-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Transcript</CardTitle>
                    <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                        {total} {total === 1 ? "entry" : "entries"}
                    </span>
                </div>
                <div className="relative mt-3">
                    <Input
                        placeholder="Search transcript"
                        className="pl-9 h-10 w-full border-white/30 bg-white/95 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-green-700"/>
                </div>
            </CardHeader>

            <CardContent className="p-0 bg-white dark:bg-gray-800 text-foreground">
                <ScrollArea className="h-[420px]">
                    <div className="flex flex-col gap-y-3 p-4">
                        {/* Empty state */}
                        {filteredData.length === 0 && (
                            <div className="flex flex-col items-center justify-center text-center py-10 border rounded-xl bg-gray-50 mx-1">
                                <SearchIcon className="h-6 w-6 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">{searchQuery ? "No matches found." : "No transcript available yet."}</p>
                            </div>
                        )}

                        {/* Items */}
                        {filteredData.map((item) => (
                            <div
                                key={item.start_ts}
                                className="flex flex-col gap-y-2 rounded-xl border bg-white hover:shadow-md hover:border-green-200 transition p-4"
                            >
                                <div className="flex gap-x-2 items-center">
                                    <Avatar className='size-6'>
                                        <AvatarImage
                                            src={item.user.image ?? generateAvatarUri({seed: item.user.name, variant: "initials"})}
                                            alt="User Avatar"
                                        />
                                    </Avatar>
                                    <p className="text-sm font-medium text-gray-900">{item.user.name}</p>
                                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                                        <Clock className="h-3.5 w-3.5" />
                                        {format(new Date(0,0,0,0,0,0,item.start_ts), "mm:ss")}
                                    </span>
                                </div>
                                <Highlighter
                                    className="text-sm leading-relaxed text-neutral-800"
                                    highlightClassName="bg-green-200/70 text-green-900 rounded px-0.5"
                                    searchWords={searchQuery ? [searchQuery] : []}
                                    autoEscape={true}
                                    textToHighlight={item.text}
                                />
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )

};

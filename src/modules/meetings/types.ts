import {inferRouterOutputs} from "@trpc/server";
import {AppRouter} from "@/trpc/routers/_app";

export type MeetingGetOne = inferRouterOutputs<AppRouter>["meetings"]["getOne"];
export type MeetingGetMany = inferRouterOutputs<AppRouter>["meetings"]["getMany"]["items"];
export enum MeetingStatus {
    Upcoming= "upcoming",
    Active= "active",
    Completed= "completed",
    Processing= "processing",
    Cancelled= "cancelled",
}

export type StreamTranscriptItem = {
    speaker_Id: string;
    type: string;
    text: string;
    start_ts: number;
    stop_ts: number;
};

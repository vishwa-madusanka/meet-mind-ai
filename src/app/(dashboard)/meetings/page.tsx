import {MeetingsView, MeetingViewError, MeetingViewLoading} from "@/modules/meetings/ui/views/meetings-view";
import {getQueryClient, trpc} from "@/trpc/server";
import {HydrationBoundary, dehydrate} from "@tanstack/react-query";
import {Suspense} from "react";
import {ErrorBoundary} from "react-error-boundary";
import {MeetingsListHeader} from "@/modules/meetings/ui/components/meetings-list-header";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {SearchParams} from "nuqs";
import {loadSearchParams} from "@/modules/meetings/params";

interface Props {
    searchParams: Promise<SearchParams>;
}

const Page = async ({searchParams}:Props) => {
    const filters = await loadSearchParams(searchParams);
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if(!session) {
        redirect('/sign-in')
    }
    const queryClient = getQueryClient();
    void queryClient.prefetchQuery(
        trpc.meetings.getMany.queryOptions({
            ...filters,
        })
    );
    return (
        <>
            <MeetingsListHeader/>
            <HydrationBoundary state={dehydrate(queryClient)}>
                <Suspense fallback={<MeetingViewLoading />}>
                    <ErrorBoundary fallback={<MeetingViewError />}>
                        <MeetingsView />
                    </ErrorBoundary>
                </Suspense>
            </HydrationBoundary>
        </>
    )
}

export default Page

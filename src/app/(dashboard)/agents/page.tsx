import React, {Suspense} from 'react'
import {AgentsView, AgentViewError, AgentViewLoading} from "@/modules/agents/ui/views/agents-view";
import {getQueryClient, trpc} from "@/trpc/server";
import {HydrationBoundary} from "@tanstack/react-query";
import {dehydrate} from "@tanstack/query-core";
import {ErrorBoundary} from "react-error-boundary";
import {AgentsListHeader} from "@/modules/agents/ui/components/agents-list-header";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import type {SearchParams} from "nuqs";
import {loadSearchParams} from "@/modules/agents/params";

interface Props {
    searchParams: Promise<SearchParams>
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
    void queryClient.prefetchQuery(trpc.agents.getMany.queryOptions({
        ...filters,
    }))
    return (
        <>
            <AgentsListHeader/>
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<AgentViewLoading/>}>
                <ErrorBoundary fallback={<AgentViewError/>}>
                    <AgentsView/>
                </ErrorBoundary>
            </Suspense>
        </HydrationBoundary>
        </>
    );
};
export default Page

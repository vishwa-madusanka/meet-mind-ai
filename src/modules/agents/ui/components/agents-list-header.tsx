"use client";
import React, {useState} from 'react'
import {Button} from "@/components/ui/button";
import {PlusIcon, XCircleIcon} from "lucide-react";
import {NewAgentDialog} from "@/modules/agents/ui/components/new-agent-dialog";
import {UseAgentsFilter} from "@/modules/agents/hooks/use-agents-filter";
import {AgentsSearchFilter} from "@/modules/agents/ui/components/agents-search-filter";
import {DEFAULT_PAGE} from "@/constants";
import {ScrollArea, ScrollBar} from "@/components/ui/scroll-area";


export const AgentsListHeader = () => {
    const [filters, setFilters] = UseAgentsFilter();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const isAnyFilterModified = !!filters.search;

    const onClearFilters = () => {
        setFilters({
            search: "",
            page: DEFAULT_PAGE,
        });
    }
    return (
        <>
            <NewAgentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        <div className={'py-4 px-4 md:px-8 flex flex-col gap-y-4'}>
            <div className={'flex items-center justify-between'}>
                <h5 className={'font-medium text-xl'}>My Agents</h5>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <PlusIcon />
                    New Agent
                </Button>
            </div>
            <ScrollArea>
                <div className={'flex items-center gap-x-2 p-1'}>
                    <AgentsSearchFilter/>
                    {isAnyFilterModified && (
                        <Button variant={'outline'} size={'sm'} onClick={onClearFilters}>
                            <XCircleIcon />
                            Clear
                        </Button>
                    )}
                </div>
                <ScrollBar orientation={'horizontal'}/>
            </ScrollArea>
        </div>
        </>
    )
}

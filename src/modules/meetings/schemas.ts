import {z} from "zod";

export const meetingsInsertSchema = z.object({
    name: z.string().min(1, "Name is required"),
    agentId: z.string().min(1, "AgentId is required"),
});

export const meetingsUpdateSchema = meetingsInsertSchema.extend({
    id: z.string().min(1, {message: "ID is required"}),
});

// ++ ADD a schema for updating the summary
export const meetingsUpdateSummarySchema = z.object({
    id: z.string().min(1, { message: "ID is required" }),
    summary: z.string(), // Allow empty string for creating a blank summary
});

// ++ ADD a schema for deleting the summary
export const meetingsDeleteSummarySchema = z.object({
    id: z.string().min(1, { message: "ID is required" }),
});
import {createTRPCRouter, premiumProcedure, protectedProcedure} from "@/trpc/init";
import {db} from "@/db";
import {agent} from "@/db/schema";
import {agentsInsertSchema, agentsUpdateSchema} from "@/modules/agents/schemas";
import {z} from "zod";
import {and, count, desc, eq, getTableColumns, ilike, sql} from "drizzle-orm";
import {DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE} from "@/constants";
import {TRPCError} from "@trpc/server";

export const agentsRouter = createTRPCRouter({
    update: protectedProcedure
        .input(agentsUpdateSchema)
        .mutation(async ({input, ctx}) => {
            const [updatedAgent] = await db
                .update(agent)
                .set(input)
                .where(
                    and(
                        eq(agent.id, input.id),
                        eq(agent.userId, ctx.auth.user.id),
                    ),
                )
                .returning();
            if(!updatedAgent) {
                throw new TRPCError({code: 'NOT_FOUND', message: 'Agent not found'});
            }
            return updatedAgent;
        })
    ,

    remove: protectedProcedure
        .input(z.object({id: z.string()}))
        .mutation(async ({input, ctx}) => {
            const [removedAgent] = await db
                .delete(agent)
                .where(
                    and(
                        eq(agent.id, input.id),
                        eq(agent.userId, ctx.auth.user.id),
                    ),
                )
                .returning();
            if(!removedAgent) {
                throw new TRPCError({code: 'NOT_FOUND', message: 'Agent not found'});
            }
            return removedAgent;
        }),
    getOne: protectedProcedure.input(z.object({id:z.string()})).query(async ({input, ctx}) => {
        const [existingAgent] = await db
            .select({
                ...getTableColumns(agent),
                meetingCount: sql<number>`1`,
            })
            .from(agent)
            .where(
                and(
                    eq(agent.id, input.id),
                    eq(agent.userId, ctx.auth.user.id),
                )
            );
        if(!existingAgent) {
            throw new TRPCError({code: 'NOT_FOUND', message: 'Agent not found'});
        }

        return existingAgent;

    }),
    getMany: protectedProcedure
        .input(z.object({
            page: z.number().default(DEFAULT_PAGE),
            pageSize: z
                .number()
                .min(MIN_PAGE_SIZE)
                .max(MAX_PAGE_SIZE)
                .default(DEFAULT_PAGE_SIZE),
            search: z.string().nullish()
        }))
        .query(async ({ctx,input}) => {

            const {page, pageSize, search} = input;
            const data = await db
                .select({
                    ...getTableColumns(agent),
                    meetingCount: sql<number>`1`,
                })
                .from(agent)
                .where(
                    and(
                        eq(agent.userId, ctx.auth.user.id),
                        search ? ilike(agent.name,`%${search}%`) : undefined,
                    )
                )
                .orderBy(desc(agent.createdAt),desc(agent.id))
                .limit(pageSize)
                .offset((page - 1) * pageSize);
            const [total] = await db
                .select({count: count()})
                .from(agent)
                .where(
                    and(
                        eq(agent.userId, ctx.auth.user.id),
                        search ? ilike(agent.name,`%${search}%`) : undefined,
                    )
                )
            const totalPages = Math.ceil(total.count / pageSize);
            return {
                items: data,
                total: total.count,
                totalPages,
            };

    }),
    create: premiumProcedure("agents")
        .input(agentsInsertSchema)
        .mutation(async ({input, ctx}) => {
            const [createdAgent] = await db
                .insert(agent)
                .values(({
                    ...input,
                    userId: ctx.auth.user.id,
                }))
                .returning();

            return createdAgent;
        }),
})
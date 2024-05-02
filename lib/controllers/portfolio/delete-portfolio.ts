import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { z } from "zod";
import { prisma } from "../../app/prisma";

const deletePortfolio = new Hono();

const ALLOWED_ROLES = ["administrator", "branch manager"];

deletePortfolio.post(
    "/:portfolioID",
    jwt({
        secret: process.env.JWT_SECRET!,
    }),
    async (c) => {

        try {

            const payload = c.get('jwtPayload')
    
            const portfolioID = c.req.param('portfolioID')

            const role = payload["role"] as string[];

            const isAllowed = role.some((r) => ALLOWED_ROLES.includes(r));

            if (!isAllowed) {
                return c.json(
                    {
                        message: "You are not allowed to access this resource",
                        success: false,
                        data: {},
                    },
                    401
                );
            }

            const portfolio = await prisma.portfolio.findFirst({
                where: {
                    PortfolioID: portfolioID
                }
            })

            if (!portfolio) {
                return c.json({
                    message: "Portfolio not found",
                    success: false,
                    data: {}
                });
            }

            await prisma.portfolio.delete({
                where: {
                    PortfolioID: portfolioID
                }
            })

            return c.json({
                message: "Portfolio deleted successfully",
                success: true,
                data: {}
            });

        } catch (error) {

            return c.json({
                message: "An error occurred",
                success: false,
                data: {}
            });

        }
    }
);

export default deletePortfolio
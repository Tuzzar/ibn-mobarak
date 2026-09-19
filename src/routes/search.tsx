import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const searchParamsSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: (search) => searchParamsSchema.parse(search),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/products",
      search: {
        category: null,
        q: search.q || "",
      },
    });
  },
});

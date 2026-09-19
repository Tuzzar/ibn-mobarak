import { createFileRoute, redirect } from "@tanstack/react-router";

// Incomplete orders now live inside the unified Order Management console.
export const Route = createFileRoute("/admin/incomplete-orders")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/orders" });
  },
});

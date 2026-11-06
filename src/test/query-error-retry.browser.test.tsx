import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render } from "vitest-browser-react";

import { QueryErrorState } from "@/components/QueryErrorState";

let attempts = 0;

function Probe() {
  const { data, isError, error, refetch } = useQuery({
    queryKey: ["retry-probe"],
    retry: false,
    queryFn: async () => {
      attempts += 1;
      if (attempts < 2) throw new Error("Failed to load shipments");
      return "loaded";
    },
  });

  if (isError) return <QueryErrorState error={error} onRetry={() => void refetch()} subject="shipments" />;
  if (!data) return <p>Loading…</p>;
  return <p>DATA_LOADED: {data}</p>;
}

test("failed query shows an error state and Retry recovers without a page reload", async () => {
  attempts = 0;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const screen = await render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );

  // The failed request surfaces a real error state with a Retry control.
  await expect.element(screen.getByRole("alert")).toBeInTheDocument();
  await expect.element(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();

  // Retry actually refetches — the same mounted component recovers.
  await screen.getByRole("button", { name: /retry/i }).click();

  await expect.element(screen.getByText(/DATA_LOADED: loaded/)).toBeInTheDocument();
  expect(attempts).toBe(2);
});

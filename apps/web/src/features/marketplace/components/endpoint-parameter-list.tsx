import type { Endpoint } from "@/features/catalog/types";

interface EndpointParameterListProps {
  endpoint: Endpoint;
}

interface Parameter {
  name: string;
  values: string;
  description: string;
}

/** Query parameters this endpoint accepts. `ask` is listed only when probabilities are offered. */
export function EndpointParameterList({ endpoint }: EndpointParameterListProps) {
  const parameters: Parameter[] = [
    {
      name: "shape",
      values: endpoint.shapes.join(" | "),
      description: "Output shape. Defaults to json.",
    },
    ...(endpoint.shapes.includes("probability")
      ? [
          {
            name: "ask",
            values: "text",
            description: "A question about this endpoint's data, answered with shape=probability.",
          },
        ]
      : []),
    {
      name: "max_age",
      values: "seconds",
      description: "Accept values at most this old. Older values trigger a refresh first.",
    },
    {
      name: "max_price",
      values: "credits",
      description: "Cost cap per call. Returns an error instead of a more expensive answer.",
    },
  ];

  return (
    <section aria-labelledby="endpoint-parameters-title" className="flex flex-col gap-3">
      <h3 id="endpoint-parameters-title" className="font-semibold text-ink-950 text-sm">
        Parameters
      </h3>
      <dl className="divide-y rounded-2xl border">
        {parameters.map((parameter) => (
          <div key={parameter.name} className="flex flex-col gap-1.5 px-4 py-3">
            <dt className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <code className="font-mono text-sm text-violet-700">{parameter.name}</code>
              <span className="rounded-md bg-ink-50 px-1.5 py-0.5 font-mono text-[0.6875rem] text-ink-700">
                {parameter.values}
              </span>
            </dt>
            <dd className="text-pretty text-muted-foreground text-sm">{parameter.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

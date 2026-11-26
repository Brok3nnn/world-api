import { cn } from "cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ERROR_CODES } from "../constants";

/** Status codes a caller can receive, each with the action the caller should take. */
export function ErrorCodeTable() {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <caption className="sr-only">Status codes and what to do</caption>
        <TableHeader className="bg-ink-50">
          <TableRow>
            <TableHead className="w-48 pl-4">Status</TableHead>
            <TableHead>What to do</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ERROR_CODES.map((error) => (
            <TableRow key={error.status}>
              <TableCell className="pl-4 align-top">
                <span className="inline-flex items-center gap-2">
                  <code
                    className={cn(
                      "rounded-md px-1.5 py-0.5 font-mono text-xs",
                      error.status < 300
                        ? "bg-cobalt-50 text-cobalt-800"
                        : "bg-coral-100 text-coral-500",
                    )}
                  >
                    {error.status}
                  </code>
                  <span className="font-medium">{error.name}</span>
                </span>
              </TableCell>
              <TableCell className="whitespace-normal text-muted-foreground">
                {error.action}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ReferenceTableProps {
  caption: string;
  nameHeading: string;
  rows: readonly { name: string; description: string }[];
  /** Renders names as code (parameters, fields) rather than plain text (prices). */
  monospaceNames?: boolean;
}

/** Two-column name/description table used throughout the reference. */
export function ReferenceTable({
  caption,
  nameHeading,
  rows,
  monospaceNames = true,
}: ReferenceTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <caption className="sr-only">{caption}</caption>
        <TableHeader className="bg-ink-50">
          <TableRow>
            <TableHead className="w-48 pl-4">{nameHeading}</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell className="pl-4 align-top">
                {monospaceNames ? (
                  <code className="font-mono text-violet-700 text-xs">{row.name}</code>
                ) : (
                  <span className="font-medium">{row.name}</span>
                )}
              </TableCell>
              <TableCell className="whitespace-normal text-muted-foreground">
                {row.description}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

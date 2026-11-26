import { FlaskConicalIcon } from "lucide-react";

/**
 * Says on every page that this app is a design prototype. Everything it shows is typed sample
 * data: no call reaches the data API, nothing is charged, and sign-in and keys stay in the
 * browser.
 */
export function PrototypeNotice() {
  return (
    <aside aria-label="Prototype notice" className="border-amber-400 border-b bg-amber-100">
      <p className="mx-auto flex w-full max-w-7xl items-start gap-2 px-4 py-2 text-ink-800 text-sm md:items-center md:px-6">
        <FlaskConicalIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-600 md:mt-0" />
        <span>
          <strong className="font-semibold text-ink-950">UI prototype — sample data.</strong>{" "}
          Endpoints, numbers, publishers, accounts and keys here are fictional. Nothing is fetched,
          charged or stored beyond this browser.
        </span>
      </p>
    </aside>
  );
}

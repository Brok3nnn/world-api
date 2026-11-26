"use client";

import { KeyRoundIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type DemoApiKey, formatMaskedKey, generateDemoApiKey } from "../lib/demo-api-key";
import { SettingsCreateKeyDialog } from "./settings-create-key-dialog";
import { SettingsNewKeyStrip } from "./settings-new-key-strip";
import { SettingsRevokeKeyDialog } from "./settings-revoke-key-dialog";
import { SettingsRow } from "./settings-row";
import { SettingsSection } from "./settings-section";

const DEFAULT_KEY: DemoApiKey = {
  id: "default",
  name: "Default key",
  lastFour: "3f9a",
  createdLabel: "Created with your account",
};

/** The full value of the key that was just created. Kept only until the visitor hides it. */
interface NewKey {
  id: string;
  value: string;
}

/** Demo key management for the prototype: keys live in this component and reset on reload. */
export function SettingsApiKeys() {
  const [keys, setKeys] = useState<readonly DemoApiKey[]>([DEFAULT_KEY]);
  const [newKey, setNewKey] = useState<NewKey | null>(null);

  const createKey = (name: string) => {
    const id = crypto.randomUUID();
    const value = generateDemoApiKey();
    setKeys((current) => [
      ...current,
      { id, name, lastFour: value.slice(-4), createdLabel: "Created today" },
    ]);
    setNewKey({ id, value });
  };

  const revokeKey = (id: string) => {
    setKeys((current) => current.filter((key) => key.id !== id));
    setNewKey((current) => (current?.id === id ? null : current));
    toast.success("Key revoked");
  };

  return (
    <SettingsSection
      id="api-keys"
      description="Prototype keys: random strings that open nothing and reset on reload."
      action={<SettingsCreateKeyDialog onCreate={createKey} />}
    >
      {newKey ? <SettingsNewKeyStrip value={newKey.value} onHide={() => setNewKey(null)} /> : null}

      <ul className="divide-y">
        {keys.length === 0 ? (
          <SettingsRow
            icon={KeyRoundIcon}
            title="No keys yet"
            description="Create one to call APIs from your code."
          />
        ) : null}
        {keys.map((key) => (
          <SettingsRow
            key={key.id}
            icon={KeyRoundIcon}
            title={key.name}
            description={
              <span className="flex flex-wrap gap-x-2 gap-y-0.5">
                <span aria-hidden className="font-mono">
                  {formatMaskedKey(key.lastFour)}
                </span>
                <span className="sr-only">Key ending in {key.lastFour}.</span>
                <span>{key.createdLabel}</span>
              </span>
            }
          >
            <SettingsRevokeKeyDialog keyName={key.name} onConfirm={() => revokeKey(key.id)} />
          </SettingsRow>
        ))}
      </ul>
    </SettingsSection>
  );
}

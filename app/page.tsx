import { AppGate } from "@/components/screens/app-gate";
import { readSetupDefaultsFromEnv } from "@/lib/core/config/setup-defaults";

export default function Home() {
  return <AppGate devDefaults={readSetupDefaultsFromEnv()} />;
}

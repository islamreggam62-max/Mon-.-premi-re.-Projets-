import type { Metadata } from "next";
import { AiView } from "@/components/views/AiView";

export const metadata: Metadata = { title: "AI Intelligence" };

export default function Page() {
  return <AiView />;
}

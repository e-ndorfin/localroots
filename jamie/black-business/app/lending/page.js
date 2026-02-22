import CircleList from "@/components/lending/CircleList";
import { circles } from "@/lib/mockData";

export default function LendingPage() {
  return <div className="space-y-4"><div className="flex items-center justify-between"><h1 className="text-3xl font-bold">Lending Circles</h1><button className="button-primary">Create Circle</button></div><CircleList circles={circles} /></div>;
}

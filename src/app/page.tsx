import { BoardClient } from "@/components/board-client";
import { getBoardData } from "@/lib/board-data";

export default async function Page() {
  const initialData = await getBoardData();

  return <BoardClient initialData={initialData} />;
}

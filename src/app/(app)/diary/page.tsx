import { DiaryView } from "@/components/meals/diary-view";

export default async function Page({ searchParams }: { searchParams: Promise<{ meal?: string }> }) {
  const { meal } = await searchParams;
  return <DiaryView initialMeal={meal} />;
}

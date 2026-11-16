import fetchMembersAction from "../_actions";
import ErrorHandler from "@/components/error-handler";
import CompareContent from "./content";
import { getCurrentYear } from "@/lib/data/current-year";

async function ComparePage() {
  const [results, currentYear] = await Promise.all([
    fetchMembersAction(),
    getCurrentYear(),
  ]);

  if (results.error) {
    <ErrorHandler
      title="Failed to Load Members"
      errorMessage={results.error.message}
      pageTitle="Compare Members"
    />;
  }

  return (
    <div className="px-2">
      <CompareContent members={results.members} currentYear={currentYear} />
    </div>
  );
}

export default ComparePage;

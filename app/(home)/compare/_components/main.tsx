import fetchMembersAction from "../_actions";
import ErrorHandler from "@/components/error-handler";
import CompareContent from "./content";

async function ComparePage() {
  const results = await fetchMembersAction();

  if (results.error) {
    <ErrorHandler
      title="Failed to Load Members"
      errorMessage={results.error.message}
      pageTitle="Compare Members"
    />;
  }

  return (
    <div className="px-2">
      <CompareContent members={results.members} />
    </div>
  );
}

export default ComparePage;

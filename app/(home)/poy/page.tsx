import { redirect } from "next/navigation";

export default function POYRedirect() {
  const currentYear = new Date().getFullYear();
  redirect(`/poy/${currentYear}`);
}

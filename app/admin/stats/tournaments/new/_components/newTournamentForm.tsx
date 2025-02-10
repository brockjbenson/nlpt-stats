"use client";

import { Member, Season } from "@/utils/types";
import React from "react";

interface Props {
  seasons: Season[];
  members: Member[];
}

function NewTournamentForm({ seasons, members }: Props) {
  return <div>NewTournamentForm</div>;
}

export default NewTournamentForm;

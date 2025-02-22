"use client";

import { Member, Tournament, TournamentSession } from "@/utils/types";
import React, { useEffect } from "react";
import TournamentSessionsList from "./tournament-sessions-list";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "../ui/select";
import { Input } from "../ui/input";
import { SubmitButton } from "../submit-button";
import {
  assignTournamentNLPIPointsToSessions,
  assignTournamentSessionPoints,
  fillInMissingTournamentSessions,
} from "@/utils/tournament/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { AlertCircleIcon, Loader2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { addTournamentSessionAction } from "../admin/stats/actions/add-session";

interface Props {
  tournament: Tournament;
  members: Member[];
}

interface SessionNoPointsOrId {
  buy_in: number;
  cash_out: number;
  net_profit: number;
  rebuys: number;
  tournament_id: string;
  member_id: string;
  place: number;
}

interface SessionNoId {
  buy_in: number;
  cash_out: number;
  net_profit: number;
  rebuys: number;
  tournament_id: string;
  member_id: string;
  place: number;
  nlpi_points: number;
  poy_points: number;
}

function TournamentSessionsForm({ tournament, members }: Props) {
  const [sessions, setSessions] = React.useState<SessionNoPointsOrId[]>([]);
  const [fullSessions, setFullSessions] = React.useState<SessionNoId[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [confirmAdd, setConfirmAdd] = React.useState<boolean>(false);
  const [formState, setFormState] = React.useState({
    member_id: "",
    buy_in: 40,
    cash_out: 0,
    net_profit: 0,
    rebuys: 0,
    place: 0,
  });

  const handleAddSession = () => {
    const session = {
      member_id: formState.member_id,
      tournament_id: tournament.id,
      buy_in: formState.buy_in,
      cash_out: formState.cash_out,
      net_profit: formState.net_profit,
      rebuys: formState.rebuys,
      place: formState.place,
    };
    const duplicateSessionFound = sessions.find(
      (s) => s.member_id === session.member_id
    );

    if (!duplicateSessionFound) {
      setSessions([...sessions, session]);
      setFormState({
        member_id: "",
        buy_in: 40,
        cash_out: 0,
        net_profit: 0,
        rebuys: 0,
        place: 0,
      });
    }
  };

  const handleAddAllSessions = async () => {
    const sessionsWithPoints = assignTournamentSessionPoints(sessions);
    const filledSessions = fillInMissingTournamentSessions(
      sessionsWithPoints,
      members
    );

    try {
      setLoading(true);
      const result = await addTournamentSessionAction(filledSessions);

      if (!result.success) {
        setError(result.message);
      } else {
        toast({
          title: "Sessions Added Successfully",
        });
        setSessions([]);
      }
    } catch (error) {
      setError("Failed to add sessions");
    } finally {
      setLoading(false);
    }
  };

  const calculateNetProfit = () => {
    setFormState({
      ...formState,
      net_profit: formState.cash_out - formState.buy_in,
    });
  };

  useEffect(() => {
    calculateNetProfit();
  }, [formState.buy_in, formState.cash_out]);
  return (
    <>
      {sessions.length > 0 && (
        <SubmitButton onClick={() => setConfirmAdd(true)}>
          Add All Sessions
        </SubmitButton>
      )}

      <TournamentSessionsList
        setSessions={setSessions}
        members={members}
        sessions={sessions}
      />
      <form className="grid mt-8 px-2 w-full max-w-screen-xl mx-auto grid-cols-2 gap-4">
        <fieldset className="flex flex-col gap-2 w-full">
          <Label className="text-muted" htmlFor="member_id">
            Member
          </Label>
          <Select
            onValueChange={(value) =>
              setFormState({ ...formState, member_id: value })
            }
          >
            <SelectTrigger id="member_id">
              {formState.member_id ? (
                <p>
                  {
                    members.filter((m) => m.id === formState.member_id)[0]
                      .first_name
                  }
                </p>
              ) : (
                <p>Select Member</p>
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {members?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.first_name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </fieldset>
        <fieldset className="flex flex-col gap-2 w-full">
          <Label className="text-muted" htmlFor="rebuys">
            Rebuys
          </Label>
          <Input
            value={formState.rebuys}
            onChange={(e) => {
              setFormState({
                ...formState,
                rebuys: Number(e.target.value),
                buy_in:
                  Number(e.target.value) === 0
                    ? 40
                    : formState.buy_in * (Number(e.target.value) + 1),
              });
            }}
            type="number"
            id="rebuys"
          />
        </fieldset>
        <fieldset className="flex flex-col gap-2 w-full">
          <Label className="text-muted" htmlFor="buy_in">
            BuyIn
          </Label>
          <Input
            value={formState.buy_in}
            onChange={(e) =>
              setFormState({
                ...formState,
                buy_in: Number(e.target.value),
              })
            }
            type="number"
            id="buy_in"
          />
        </fieldset>
        <fieldset className="flex flex-col gap-2 w-full">
          <Label className="text-muted" htmlFor="cash_out">
            Cash Out
          </Label>
          <Input
            value={formState.cash_out}
            onChange={(e) =>
              setFormState({
                ...formState,
                cash_out: Number(e.target.value),
              })
            }
            type="number"
            id="cash_out"
          />
        </fieldset>
        <fieldset className="flex flex-col gap-2 w-full">
          <Label className="text-muted" htmlFor="net_profit">
            Net Profit
          </Label>
          <Input
            value={formState.net_profit}
            readOnly
            onChange={(e) => {
              setFormState({
                ...formState,
                net_profit: Number(e.target.value),
              });
            }}
            type="number"
            id="net_profit"
          />
        </fieldset>
        <fieldset className="flex flex-col gap-2 w-full">
          <Label className="text-muted" htmlFor="place">
            Place
          </Label>
          <Select
            onValueChange={(value) =>
              setFormState({ ...formState, place: Number(value) })
            }
          >
            <SelectTrigger id="place">
              {formState.place ? <p>{formState.place}</p> : <p>Select Place</p>}
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {[...Array(tournament.player_count)].map((_, i) => (
                  <SelectItem key={i} value={(i + 1).toString()}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </fieldset>
        <SubmitButton
          className="col-span-2"
          onClick={(e) => {
            e.preventDefault();
            handleAddSession();
          }}
        >
          Add Session
        </SubmitButton>
      </form>
      <AlertDialog
        open={confirmAdd}
        onOpenChange={() => setConfirmAdd(!confirmAdd)}
      >
        <AlertDialogContent>
          <AlertCircleIcon className="w-16 h-16  mx-auto text-primary" />
          <AlertDialogTitle>Have you added every session?</AlertDialogTitle>
          <AlertDialogDescription>
            Make sure you have added every session before clicking yes.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>No Go Back</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary px-12 mx-auto text-white"
              onClick={() => {
                setConfirmAdd(false);
                handleAddAllSessions();
              }}
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={error !== undefined}>
        <AlertDialogContent className="border-red-500">
          <XCircle className="w-16 h-16  mx-auto text-theme-red" />
          <AlertDialogTitle>Error Adding Sessions</AlertDialogTitle>
          <AlertDialogDescription>{error}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-muted px-12 mx-auto text-white"
              onClick={() => setError(undefined)}
            >
              Okay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {loading && (
        <div className="fixed w-screen h-screen top-0 left-0 flex items-center justify-center inset-0 bg-black bg-opacity-50">
          <Loader2 className="animate-spin w-16 h-16 text-primary" />
        </div>
      )}
    </>
  );
}

export default TournamentSessionsForm;

import { CashSession, Member, Season, Week } from "@/utils/types";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { keepRemovedSession } from "../[seasonId]/sessions/[weekId]/edit/utils/utils";

interface ExtendedCashSession extends CashSession {
  member: Member;
  season: Season;
  week: Week;
}

interface Props {
  session: ExtendedCashSession;
  setSessionsToRemove: React.Dispatch<
    React.SetStateAction<ExtendedCashSession[]>
  >;
  setEditingSessions: React.Dispatch<
    React.SetStateAction<ExtendedCashSession[]>
  >;
  editingSessions: ExtendedCashSession[];
  setBuyInInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setCashOutInputs: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  buyInInputRefs: React.MutableRefObject<
    Record<string, HTMLInputElement | null>
  >;
  cashOutInputRefs: React.MutableRefObject<
    Record<string, HTMLInputElement | null>
  >;
  originalSession?: ExtendedCashSession;
  rawBuyIn: string;
  rawCashOut: string;
}

function RemovedSession({
  session,
  setSessionsToRemove,
  setBuyInInputs,
  setEditingSessions,
  originalSession,
  setCashOutInputs,
  rawBuyIn,
  rawCashOut,
  buyInInputRefs,
  cashOutInputRefs,
}: Props) {
  return (
    <li className="grid grid-cols-[min-content_1fr] pb-4 gap-6">
      <Card className="col-span-2 relative flex flex-col items-center gap-2 bg-red-600/15 border-red-600">
        <button
          onClick={() => {
            keepRemovedSession({
              session,
              originalSession,
              setSessionsToRemove,
              setEditingSessions,
              setBuyInInputs,
              setCashOutInputs,
            });
          }}
          className="p-1 whitespace-nowrap absolute top-2 underline right-3">
          Keep
        </button>
        <h2 className="mb-2">
          {session.member.first_name} {session.member.last_name.slice(0, 1)}.
        </h2>
        <div className="grid grid-cols-4 w-full gap-2">
          <span className="flex flex-col gap-1 justify-center w-full items-center">
            <fieldset className="flex flex-col gap-2 w-full">
              <Label
                className="text-sm text-center text-neutral-400"
                htmlFor={`buyIn-${session.member_id}`}>
                Buy In
              </Label>
              <input
                id={`buyIn-${session.member_id}`}
                value={`$${rawBuyIn}`}
                ref={(el) => {
                  buyInInputRefs.current[session.member_id] = el;
                }}
                disabled={true}
                type="text"
                inputMode="decimal"
                onFocus={(e) => {}}
                onChange={(e) => {}}
                onBlur={() => {}}
                className="h-fit p-0 disabled:line-through text-center w-full outline-none ring-none bg-transparent border-b rounded-none text-base border-transparent focus:border-primary font-semibold text-neutral-400"
              />
            </fieldset>
          </span>
          <span className="flex flex-col gap-1 items-center">
            <fieldset className="flex flex-col gap-2 w-full">
              <Label
                className="text-sm text-center text-neutral-400"
                htmlFor={`cashOut-${session.member_id}`}>
                Cash Out
              </Label>
              <input
                id={`cashOut-${session.member_id}`}
                value={`$${rawCashOut}`}
                type="text"
                disabled={true}
                ref={(el) => {
                  cashOutInputRefs.current[session.member_id] = el;
                }}
                inputMode="decimal"
                onFocus={(e) => {}}
                onChange={(e) => {}}
                onBlur={() => {}}
                className="h-fit disabled:line-through p-0 text-center w-full outline-none ring-none bg-transparent border-b rounded-none text-base border-transparent focus:border-primary font-semibold text-neutral-400"
              />
            </fieldset>
          </span>

          <span className="flex flex-col gap-1 justify-center w-full items-center">
            <fieldset className="flex flex-col gap-2 w-full">
              <Label
                className="text-sm text-center text-neutral-400"
                htmlFor={`rebuys-${session.member_id}`}>
                Rebuys
              </Label>
              <Select
                disabled={true}
                value={session.rebuys.toString()}
                onValueChange={(value) => {
                  setEditingSessions((prevSessions) =>
                    prevSessions.map((s) =>
                      s.member_id === session.member_id
                        ? { ...s, rebuys: parseFloat(value) }
                        : s
                    )
                  );
                }}>
                <SelectTrigger
                  id={`rebuys-${session.member_id}`}
                  disabled={true}
                  className="text-base gap-1 bg-transparent relative -top-[2px] text-white font-semibold py-0 h-fit border-none flex items-center justify-center">
                  <span className="absolute w-3/5 h-[1.5px] bg-neutral-400" />
                  <SelectValue className="text-base font-semibold text-white" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {Array.from({ length: 11 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </fieldset>
          </span>
          <span className="flex flex-col gap-2 items-center">
            <div className="flex flex-col gap-2 w-full">
              <p className="text-sm text-neutral-400">Net Profit</p>
              <p
                className={cn(
                  "text-base font-semibold line-through opacity-70",
                  getProfitTextColor(session.net_profit)
                )}>
                ${formatMoney(session.net_profit)}
              </p>
            </div>
          </span>
        </div>
      </Card>
    </li>
  );
}

export default RemovedSession;

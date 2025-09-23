import { cn } from "@/lib/utils";
import { CashSession, Member, Season, Week } from "@/utils/types";
import React from "react";
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
import { ChevronDown, X } from "lucide-react";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import {
  editBuyInInput,
  editCashOutInput,
} from "../[seasonId]/sessions/[weekId]/edit/utils/utils";

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
  buyInInputs: Record<string, string>;
  setBuyInInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  cashOutInputs: Record<string, string>;
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

function OriginalSession({
  session,
  setSessionsToRemove,
  setBuyInInputs,
  setEditingSessions,
  originalSession,
  setCashOutInputs,
  rawBuyIn,
  rawCashOut,
  cashOutInputs,
  buyInInputRefs,
  buyInInputs,
  cashOutInputRefs,
}: Props) {
  return (
    <li className="grid grid-cols-[min-content_1fr] pb-4 gap-6">
      <Card className="col-span-2 relative flex flex-col items-center gap-2">
        <button
          onClick={() => {
            setSessionsToRemove((prev) => [...prev, session]);
          }}
          className="h-4 w-4 absolute top-3 right-4">
          <X />
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
                type="text"
                inputMode="decimal"
                onFocus={(e) => {
                  if (rawBuyIn === "0" || rawBuyIn === "0.00") {
                    setBuyInInputs((prev) => ({
                      ...prev,
                      [session.member_id]: "",
                    }));
                  }
                  requestAnimationFrame(() => {
                    const input = buyInInputRefs.current[session.member_id];
                    if (input) {
                      const valueLength = input.value.length;
                      input.setSelectionRange(valueLength, valueLength);
                    }
                  });
                }}
                onChange={(e) => {
                  editBuyInInput({
                    e,
                    session,
                    setBuyInInputs,
                    cashOutInputs,
                    setEditingSessions,
                  });
                }}
                onBlur={() => {
                  setBuyInInputs((prev) => ({
                    ...prev,
                    [session.member_id]: session.buy_in.toFixed(2),
                  }));
                }}
                className="h-fit p-0 disabled:line-through text-center w-full outline-none ring-none bg-transparent border-b rounded-none text-base border-transparent focus:border-primary font-semibold text-white"
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
                ref={(el) => {
                  cashOutInputRefs.current[session.member_id] = el;
                }}
                inputMode="decimal"
                onFocus={(e) => {
                  if (rawCashOut === "0" || rawCashOut === "0.00") {
                    setCashOutInputs((prev) => ({
                      ...prev,
                      [session.member_id]: "",
                    }));
                  }
                  requestAnimationFrame(() => {
                    const input = cashOutInputRefs.current[session.member_id];
                    if (input) {
                      const valueLength = input.value.length;
                      input.setSelectionRange(valueLength, valueLength);
                    }
                  });
                }}
                onChange={(e) => {
                  editCashOutInput({
                    e,
                    session,
                    buyInInputs,
                    setCashOutInputs,
                    setEditingSessions,
                  });
                }}
                onBlur={() => {
                  setCashOutInputs((prev) => ({
                    ...prev,
                    [session.member_id]: session.cash_out.toFixed(2),
                  }));
                }}
                className="h-fit disabled:line-through p-0 text-center w-full outline-none ring-none bg-transparent border-b rounded-none text-base border-transparent focus:border-primary font-semibold text-white"
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
                  className="text-base gap-1 bg-transparent relative -top-[2px] text-white font-semibold py-0 h-fit border-none flex items-center justify-center">
                  <SelectValue className="text-base font-semibold text-white" />
                  <ChevronDown className="text-white pointer-events-none w-auto aspect-auto h-3/4 hover:text-primary-hover" />
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
                  "text-base font-semibold",
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

export default OriginalSession;

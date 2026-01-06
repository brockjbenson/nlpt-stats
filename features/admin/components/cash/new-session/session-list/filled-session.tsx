import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CashSession, Member } from "@/utils/types";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { ChevronDown, X } from "lucide-react";
import React, { useRef } from "react";

interface FilledSessionProps {
  member: Member;
  setSessionsToAdd: React.Dispatch<
    React.SetStateAction<Omit<CashSession, "id">[]>
  >;
  removeSession: (memberId: string) => void;
  correspondingSession: Omit<CashSession, "id">;
}

function FilledSession({
  member,
  setSessionsToAdd,
  removeSession,
  correspondingSession,
}: FilledSessionProps) {
  const cashOutInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const buyInInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [cashOutInputs, setCashOutInputs] = React.useState<
    Record<string, string>
  >({});
  const [buyInInputs, setBuyInInputs] = React.useState<Record<string, string>>(
    {}
  );

  const rawCashOut =
    cashOutInputs[member.id] ??
    correspondingSession?.cash_out.toFixed(2).toString();

  const rawBuyIn =
    buyInInputs[member.id] ??
    correspondingSession?.buy_in.toFixed(2).toString();
  return (
    <div className="col-span-2 relative flex flex-col items-center gap-2">
      <CardHeader className="mb-3">
        <CardTitle>
          {member.first_name} {member.last_name.slice(0, 1)}.
          <button
            onClick={() => removeSession(member.id)}
            className="h-4 w-4 absolute top-0 right-3">
            <X className="size-4" />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-4 w-full gap-2">
        <fieldset className="flex flex-col gap-2 w-full">
          <Label
            className="text-sm text-center font-normal text-muted"
            htmlFor={`buyIn-${member.id}`}>
            Buy In
          </Label>
          <Input
            className="p-0 h-fit w-full border-0 bg-transparent text-center"
            id={`buyIn-${member.id}`}
            value={`$${rawBuyIn}`}
            ref={(el) => {
              buyInInputRefs.current[member.id] = el;
            }}
            type="text"
            inputMode="decimal"
            onFocus={(e) => {
              if (rawBuyIn === "0" || rawBuyIn === "0.00") {
                setBuyInInputs((prev) => ({
                  ...prev,
                  [member.id]: "",
                }));
              }

              e.target.select();
            }}
            onChange={(e) => {
              const raw = e.target.value.replace(/^\$/, ""); // remove leading $
              setBuyInInputs((prev) => ({
                ...prev,
                [member.id]: raw,
              }));

              if (/^\d*\.?\d*$/.test(raw)) {
                const parsedBuyIn = parseFloat(raw);
                if (!isNaN(parsedBuyIn)) {
                  const parsedCashOut = parseFloat(
                    cashOutInputs[member.id] ??
                      correspondingSession?.cash_out.toFixed(2).toString()
                  );

                  const newNetProfit =
                    !isNaN(parsedCashOut) && !isNaN(parsedBuyIn)
                      ? parsedCashOut - parsedBuyIn
                      : 0;

                  setSessionsToAdd((prevSessions) =>
                    prevSessions.map((session) =>
                      session.member_id === member.id
                        ? {
                            ...session,
                            buy_in: parsedBuyIn,
                            net_profit: newNetProfit,
                          }
                        : session
                    )
                  );
                }
              }
            }}
            onBlur={() => {
              setBuyInInputs((prev) => ({
                ...prev,
                [member.id]: correspondingSession.buy_in.toFixed(2),
              }));
            }}
          />
        </fieldset>
        <fieldset className="flex flex-col items-center gap-2 w-fit">
          <Label
            className="text-sm text-center font-normal text-muted"
            htmlFor={`cashOut-${member.id}`}>
            Cash Out
          </Label>
          <Input
            className="p-0 h-fit w-full border-0 bg-transparent text-center"
            id={`cashOut-${member.id}`}
            value={`$${rawCashOut}`}
            type="text"
            ref={(el) => {
              cashOutInputRefs.current[member.id] = el;
            }}
            inputMode="decimal"
            onFocus={() => {
              if (rawCashOut === "0" || rawCashOut === "0.00") {
                setCashOutInputs((prev) => ({
                  ...prev,
                  [member.id]: "",
                }));
              } else {
                requestAnimationFrame(() => {
                  const input = cashOutInputRefs.current[member.id];
                  if (input) {
                    input.select(); // ✅ Highlights all text
                  }
                });
              }
            }}
            onChange={(e) => {
              const raw = e.target.value.replace(/^\$/, ""); // remove leading $
              setCashOutInputs((prev) => ({
                ...prev,
                [member.id]: raw,
              }));

              if (/^\d*\.?\d*$/.test(raw)) {
                const parsedCashOut = parseFloat(raw);
                if (!isNaN(parsedCashOut)) {
                  const parsedBuyIn = parseFloat(
                    buyInInputs[member.id] ??
                      correspondingSession?.buy_in.toFixed(2).toString()
                  );

                  const newNetProfit =
                    !isNaN(parsedCashOut) && !isNaN(parsedBuyIn)
                      ? parsedCashOut - parsedBuyIn
                      : 0;

                  setSessionsToAdd((prevSessions) =>
                    prevSessions.map((session) =>
                      session.member_id === member.id
                        ? {
                            ...session,
                            cash_out: parsedCashOut,
                            net_profit: newNetProfit,
                          }
                        : session
                    )
                  );
                }
              }
            }}
            onBlur={() => {
              setCashOutInputs((prev) => ({
                ...prev,
                [member.id]: correspondingSession.cash_out.toFixed(2),
              }));
            }}
          />
        </fieldset>
        <fieldset className="flex flex-col gap-2 w-full">
          <Label
            className="text-sm text-center font-normal text-muted"
            htmlFor={`rebuys-${member.id}`}>
            Rebuys
          </Label>
          <Select
            value={correspondingSession.rebuys.toString()}
            onValueChange={(value) => {
              setSessionsToAdd((prevSessions) =>
                prevSessions.map((session) =>
                  session.member_id === member.id
                    ? { ...session, rebuys: parseFloat(value) }
                    : session
                )
              );
            }}>
            <SelectTrigger
              id={`rebuys-${member.id}`}
              className="text-base gap-1 relative -top-0.5 text-white font-semibold py-0 h-fit border-none flex items-center justify-center">
              <SelectValue className="text-base font-semibold text-white" />
              <ChevronDown className="text-white pointer-events-none w-auto aspect-auto h-3/4 hover:text-primary-hover" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Array.from(
                  { length: 11 },
                  (_, i) =>
                    i !== 0 && (
                      <SelectItem key={i} value={i.toString()}>
                        {i}
                      </SelectItem>
                    )
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
        </fieldset>
        <div className="flex flex-col gap-2 w-full items-center">
          <p className="text-sm text-center font-normal text-muted">
            Net Profit
          </p>
          <p
            className={cn(
              "text-base font-semibold",
              getProfitTextColor(correspondingSession.net_profit)
            )}>
            ${formatMoney(correspondingSession.net_profit)}
          </p>
        </div>
      </CardContent>
    </div>
  );
}

export default FilledSession;

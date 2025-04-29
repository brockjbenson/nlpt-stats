"use client";

import {
  SelectItem,
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CashSessionNoId, Member } from "@/utils/types";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { Label } from "@radix-ui/react-label";
import { ChevronDown, PlusCircle, X } from "lucide-react";
import React, { useEffect, useRef } from "react";

interface Props {
  members: Member[];
  sessionsToAdd: CashSessionNoId[];
  addNewSession: (member: Member) => void;
  removeSession: (memberId: string) => void;
  setSessionsToAdd: React.Dispatch<React.SetStateAction<CashSessionNoId[]>>;
}

function Sessions({
  members,
  sessionsToAdd,
  setSessionsToAdd,
  addNewSession,
  removeSession,
}: Props) {
  const cashOutInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const buyInInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [cashOutInputs, setCashOutInputs] = React.useState<
    Record<string, string>
  >({});
  const [buyInInputs, setBuyInInputs] = React.useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    if (sessionsToAdd.length === 0) {
      setCashOutInputs({});
      setBuyInInputs({});
    }
  }, [sessionsToAdd]);

  return (
    <>
      <ul className="flex flex-col mb-8">
        {members.map((member) => {
          const correspondingSession = sessionsToAdd.find(
            (session) => session.member_id === member.id
          );
          const rawCashOut =
            cashOutInputs[member.id] ??
            correspondingSession?.cash_out.toFixed(2).toString();

          const rawBuyIn =
            buyInInputs[member.id] ??
            correspondingSession?.buy_in.toFixed(2).toString();

          return (
            <li
              className="grid py-4 border-b border-neutral-600 first:border-t grid-cols-[min-content_1fr] gap-6"
              key={member.id}>
              {correspondingSession ? (
                <div className="col-span-2 relative flex flex-col items-center gap-2">
                  <button
                    onClick={() => removeSession(member.id)}
                    className="h-4 w-4 absolute top-0 right-3">
                    <X />
                  </button>
                  <h2 className="mb-2">
                    {member.first_name} {member.last_name.slice(0, 1)}.
                  </h2>
                  <div className="grid grid-cols-4 w-full gap-2">
                    <span className="flex flex-col gap-1 justify-center w-full items-center">
                      <fieldset className="flex flex-col gap-2 w-full">
                        <Label
                          className="text-sm text-center text-neutral-400"
                          htmlFor={`buyIn-${member.id}`}>
                          Buy In
                        </Label>
                        <input
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
                            requestAnimationFrame(() => {
                              const input = buyInInputRefs.current[member.id];
                              if (input) {
                                const valueLength = input.value.length;
                                input.setSelectionRange(
                                  valueLength,
                                  valueLength
                                );
                              }
                            });
                          }}
                          onChange={(e) => {
                            let raw = e.target.value.replace(/^\$/, ""); // remove leading $
                            setBuyInInputs((prev) => ({
                              ...prev,
                              [member.id]: raw,
                            }));

                            if (/^\d*\.?\d*$/.test(raw)) {
                              const parsedBuyIn = parseFloat(raw);
                              if (!isNaN(parsedBuyIn)) {
                                const parsedCashOut = parseFloat(
                                  cashOutInputs[member.id] ??
                                    correspondingSession?.cash_out
                                      .toFixed(2)
                                      .toString()
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
                              [member.id]:
                                correspondingSession.buy_in.toFixed(2),
                            }));
                          }}
                          className="h-fit p-0 text-center w-full outline-none ring-none bg-transparent border-b rounded-none text-base border-transparent focus:border-primary font-semibold text-white"
                        />
                      </fieldset>
                    </span>
                    <span className="flex flex-col gap-1 items-center">
                      <fieldset className="flex flex-col gap-2 w-full">
                        <Label
                          className="text-sm text-center text-neutral-400"
                          htmlFor={`cashOut-${member.id}`}>
                          Cash Out
                        </Label>
                        <input
                          id={`cashOut-${member.id}`}
                          value={`$${rawCashOut}`}
                          type="text"
                          ref={(el) => {
                            cashOutInputRefs.current[member.id] = el;
                          }}
                          inputMode="decimal"
                          onFocus={(e) => {
                            if (rawCashOut === "0" || rawCashOut === "0.00") {
                              setCashOutInputs((prev) => ({
                                ...prev,
                                [member.id]: "",
                              }));
                            }
                            requestAnimationFrame(() => {
                              const input = cashOutInputRefs.current[member.id];
                              if (input) {
                                const valueLength = input.value.length;
                                input.setSelectionRange(
                                  valueLength,
                                  valueLength
                                );
                              }
                            });
                          }}
                          onChange={(e) => {
                            let raw = e.target.value.replace(/^\$/, ""); // remove leading $
                            setCashOutInputs((prev) => ({
                              ...prev,
                              [member.id]: raw,
                            }));

                            if (/^\d*\.?\d*$/.test(raw)) {
                              const parsedCashOut = parseFloat(raw);
                              if (!isNaN(parsedCashOut)) {
                                const parsedBuyIn = parseFloat(
                                  buyInInputs[member.id] ??
                                    correspondingSession?.buy_in
                                      .toFixed(2)
                                      .toString()
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
                              [member.id]:
                                correspondingSession.cash_out.toFixed(2),
                            }));
                          }}
                          className="h-fit p-0 text-center w-full outline-none ring-none bg-transparent border-b rounded-none text-base border-transparent focus:border-primary font-semibold text-white"
                        />
                      </fieldset>
                    </span>
                    <span className="flex flex-col gap-1 justify-center w-full items-center">
                      <fieldset className="flex flex-col gap-2 w-full">
                        <Label
                          className="text-sm text-center text-neutral-400"
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
                            className="text-base gap-1 relative -top-[2px] text-white font-semibold py-0 h-fit border-none flex items-center justify-center">
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
                    </span>
                    <span className="flex flex-col gap-2 items-center">
                      <div className="flex flex-col gap-2 w-full">
                        <p className="text-sm text-neutral-400">Net Profit</p>
                        <p
                          className={cn(
                            "text-base font-semibold",
                            getProfitTextColor(correspondingSession.net_profit)
                          )}>
                          ${formatMoney(correspondingSession.net_profit)}
                        </p>
                      </div>
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      addNewSession(member);
                    }}
                    className="w-full h-10 col-span-2 aspect-square flex items-center justify-between">
                    <h2 className="text-sm md:text-base whitespace-nowrap">
                      {member.first_name} {member.last_name.slice(0, 1)}.
                    </h2>

                    <PlusCircle className="text-primary pointer-events-none w-6 h-6 hover:text-primary-hover" />
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default Sessions;

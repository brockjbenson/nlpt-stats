import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface Member {
  first_name: string;
  last_name: string;
  portrait_url: string;
  value: number;
  year?: number;
  week_number?: number;
  net_profit?: number;
}

interface Props {
  title: string;
  valueKey: string;
  data: Member[] | Member;
  getTextColor: (value: number) => string;
  formatValue: (value: number) => string;
}

const RecordAccordion: React.FC<Props> = ({
  title,
  valueKey,
  data,
  getTextColor,
  formatValue,
}) => {
  const isArray = Array.isArray(data);
  const top = isArray ? data[0] : data;

  if (!top) return null;

  const renderTopContent = (noAccordion: boolean) => (
    <div
      className={cn(
        "grid w-full px-0 grid-cols-[60px_1fr_min-content] gap-4",
        noAccordion && "border-b border-neutral-400 py-4"
      )}>
      <figure className="w-full h-auto aspect-square overflow-hidden rounded-full">
        <img src={top.portrait_url} alt={`${valueKey}-${top.first_name}`} />
      </figure>
      <span className="flex flex-col items-start gap-1">
        <h3 className="text-lg font-bold">{title}</h3>
        <span className="flex items-center gap-2">
          <p className="text-neutral-400 font-medium">
            {top.first_name} {top.last_name.slice(0, 1)}.
          </p>
          <p
            className={cn(
              "font-semibold",
              !top.net_profit && getTextColor(top.value)
            )}>
            {formatValue(top.value)}
            {top.net_profit && (
              <span className={cn(getTextColor(top.value), "ml-2")}>
                ({formatValue(top.net_profit)})
              </span>
            )}
          </p>
          {top.year && <p className="text-neutral-400 text-sm">({top.year})</p>}
        </span>
      </span>
    </div>
  );

  if (!isArray || data.length <= 1) {
    // ✅ Render static (non-accordion) view
    return renderTopContent(true);
  }

  // ✅ Render accordion with expanded lower ranks
  const records = data.slice(1);
  const useTwoColumn = records.length > 4;
  const half = Math.ceil(records.length / 2);
  const col1 = records.slice(0, half);
  const col2 = records.slice(half);

  return (
    <Accordion collapsible type="single">
      <AccordionItem
        className="border-b border-neutral-400 py-2"
        value={valueKey}>
        <AccordionTrigger className="px-0">
          {renderTopContent(false)}
        </AccordionTrigger>
        <AccordionContent
          className={cn(
            useTwoColumn ? "grid grid-cols-2 gap-1" : "flex flex-col gap-1",
            "data-[state=open]:pb-4"
          )}>
          {useTwoColumn
            ? Array.from({ length: half }).map((_, i) => (
                <React.Fragment key={`row-${i}`}>
                  {col1[i] && (
                    <div className="flex items-center">
                      <p className="text-sm mr-2">{i + 2}.</p>
                      <p className="text-neutral-400 text-sm font-medium mr-3">
                        {col1[i].first_name} {col1[i].last_name.slice(0, 1)}.
                      </p>
                      <p
                        className={cn(
                          "font-semibold text-sm",
                          !col1[i].net_profit && getTextColor(col1[i].value)
                        )}>
                        {formatValue(col1[i].value)}
                        {col1[i].net_profit && (
                          <span
                            className={cn(getTextColor(col1[i].value), "ml-2")}>
                            ({formatValue(col1[i].net_profit)})
                          </span>
                        )}
                      </p>
                      {col1[i].year && (
                        <p className="text-neutral-400 ml-2 text-sm">
                          (
                          {col1[i].week_number
                            ? `Week ${col1[i].week_number}, ${col1[i].year}`
                            : col1[i].year}
                          )
                        </p>
                      )}
                    </div>
                  )}
                  {col2[i] && (
                    <div className="flex items-center">
                      <p className="text-sm mr-2">{i + 2 + half}.</p>
                      <p className="text-neutral-400 text-sm font-medium mr-3">
                        {col2[i].first_name} {col2[i].last_name.slice(0, 1)}.
                      </p>
                      <p
                        className={cn(
                          "font-semibold text-sm",
                          !col2[i].net_profit && getTextColor(col2[i].value)
                        )}>
                        {formatValue(col2[i].value)}
                        {col2[i].net_profit && (
                          <span
                            className={cn(getTextColor(col2[i].value), "ml-2")}>
                            ({formatValue(col2[i].net_profit)})
                          </span>
                        )}
                      </p>
                      {col2[i].year && (
                        <p className="text-neutral-400 ml-2 text-sm">
                          (
                          {col2[i].week_number
                            ? `Week ${col2[i].week_number}, ${col2[i].year}`
                            : col2[i].year}
                          )
                        </p>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ))
            : records.map((record, i) => (
                <div className="flex items-center" key={`record-${i}`}>
                  <p className="text-sm mr-2">{i + 2}.</p>
                  <p className="text-neutral-400 text-sm font-medium mr-3">
                    {record.first_name} {record.last_name.slice(0, 1)}.
                  </p>
                  <p
                    className={cn(
                      "font-semibold text-sm",
                      !record.net_profit && getTextColor(record.value)
                    )}>
                    {formatValue(record.value)}
                    {record.net_profit && (
                      <span className={cn(getTextColor(record.value), "ml-2")}>
                        ({formatValue(record.net_profit)})
                      </span>
                    )}
                  </p>
                  {record.year && (
                    <p className="text-neutral-400 ml-2 text-sm">
                      (
                      {record.week_number
                        ? `Week ${record.week_number}, ${record.year}`
                        : record.year}
                      )
                    </p>
                  )}
                </div>
              ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default RecordAccordion;

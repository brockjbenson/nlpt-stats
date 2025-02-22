import React from "react";
import {
  Sheet,
  SheetContent,
  SheetOverlay,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { FaCircleInfo } from "react-icons/fa6";

function POYInfo() {
  return (
    <Sheet>
      <SheetTrigger className="flex items-center justify-center gap-2 text-white font-bold text-lg">
        POY Standings <FaCircleInfo />
      </SheetTrigger>
      <SheetContent className="h-4/5 rounded-t-[20px]" side="bottom">
        <SheetTitle className="w-full sticky top-0 bg-neutral-900 text-center text-2xl mb-2 font-bold">
          POY Calculation Guidelines
        </SheetTitle>
        <div className="text-sm">
          <p className="font-semibold text-base mt-4">POY Calculation:</p>
          <p className="mt-4 w-full font-bold flex gap-2 items-center justify-center">
            <span>Cash Points</span> + <span>Tournament Points</span> =
            <span>Points Won</span>
          </p>
          <p className="font-semibold text-base mt-4">
            Cash Session Calculation:
          </p>
          <p className="mt-4 w-full font-bold flex gap-2 items-center justify-center">
            <span>Session Net Profit</span> {">"} <span>0</span> =
            <span>Points Won</span>
          </p>
          <p className="mt-4 w-full font-bold flex gap-2 items-center justify-center">
            <span>Session Net Profit</span> {"<"} <span>0</span> =<span>0</span>
          </p>
          <div className="pl-4 mt-4">
            <p className="mt-4">
              Additionally, you are awarded bonus points based on your{" "}
              <strong>Season Net Profit</strong> but only if you have a{" "}
              <strong>Positive Net Profit</strong>. So if you are positive
              $50.00 your total points will get 25 more points added to it.
              <br />
              <br />
              <strong>NOTE</strong>
              <br />
              <br />
              (This only applies to your <strong>Cash Net Profit</strong> not
              your <strong>Tournament Net Profit</strong>)
            </p>
          </div>
          <p className="font-semibold text-base mt-4">
            Tournament Session Calculation:
          </p>
          <p className="mt-4 w-full font-bold flex gap-2 items-center justify-center">
            <span>Rank Bonus</span> =<span>Points Won</span>
          </p>
          <div className="pl-4 mt-4">
            <p className="mt-4 font-medium">
              Session Ranking Points (rank bonus)
            </p>
            <ul className="mt-2 pl-4">
              <li>1: 200</li>
              <li>2: 150</li>
              <li>3: 110</li>
              <li>4: 80</li>
              <li>5: 60</li>
              <li>6: 50</li>
              <li>7: 45</li>
              <li>8: 42.5</li>
              <li>9: 40</li>
              <li>10: 38</li>
              <li>11: 34</li>
              <li>12: 30</li>
              <li>13: 26</li>
              <li>14+: 20</li>
            </ul>
          </div>
        </div>
      </SheetContent>
      <SheetOverlay />
    </Sheet>
  );
}

export default POYInfo;

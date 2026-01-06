import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { FaCircleInfo } from "react-icons/fa6";

function NLPIInfo() {
  return (
    <Drawer>
      <DrawerTrigger className="flex items-center justify-center gap-2 text-white font-bold text-lg">
        NLPI Rankings <FaCircleInfo />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerTitle>NLPI Calculation Guidelines</DrawerTitle>
        <p className="mt-4 text-sm">
          NLPI is calculated on your last 20 cash session and your last 4
          tournament sessions. It is a rolling period changing week by week and
          tournament by tournament.
        </p>
        <div className="text-sm">
          <p className="font-semibold text-base mt-4">Total Calculation:</p>
          <p className="mt-4 w-full font-bold flex-wrap flex gap-2 items-center justify-center">
            <span>Cash Points</span>+ <span>Tournament Points</span> =
            <span>Points Won</span>
          </p>
          <p className="font-semibold text-base mt-4">
            Cash Session Calculation:
          </p>
          <p className="mt-4 w-full font-bold flex flex-wrap gap-2 items-center justify-center">
            <span>{"("} Net Profit</span> / <span>5 {")"}</span>x{" "}
            <span>0.6</span> + <span>Rank Points</span> =<span>Points Won</span>
          </p>
          <div className="pl-4 mt-4">
            <p className="mt-4 font-medium">
              Session Ranking Points (rank bonus)
            </p>
            <ul className="mt-2 pl-4">
              <li>1: 10.5</li>
              <li>2: 9</li>
              <li>3: 7.75</li>
              <li>4: 6.5</li>
              <li>5: 5.5</li>
              <li>6: 4.5</li>
              <li>7: 3.75</li>
              <li>8: 3</li>
              <li>9: 2.5</li>
              <li>10: 2</li>
              <li>11: 1.5</li>
              <li>12+: 1</li>
              <li>DNP: 0</li>
            </ul>
          </div>
          <p className="font-semibold text-base mt-4">
            Tournament Session Calculation:
          </p>
          <p className="mt-4 w-full font-bold flex gap-2 items-center justify-center">
            <span>Rank Points</span> =<span>Points Won</span>
          </p>
          <div className="pl-4 mt-4">
            <p className="mt-4 font-medium">
              Session Ranking Points (rank bonus)
            </p>
            <ul className="mt-2 pl-4">
              <li>1: 50</li>
              <li>2: 40</li>
              <li>3: 32</li>
              <li>4: 26</li>
              <li>5: 20</li>
              <li>6: 16</li>
              <li>7: 12</li>
              <li>8: 10</li>
              <li>9: 8</li>
              <li>10: 6</li>
              <li>11: 4</li>
              <li>12: 2</li>
              <li>13+: 1</li>
              <li>DNP: 0</li>
            </ul>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default NLPIInfo;

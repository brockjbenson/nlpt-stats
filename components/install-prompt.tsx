"use client";

import React, { useEffect, useState } from "react";
import { MdOutlineIosShare } from "react-icons/md";

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [browser, setBrowser] = useState("");

  useEffect(() => {
    const browserType = getBrowserInfo();
    setBrowser(browserType);

    // Detect if already installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    if (!isStandalone) {
      setShowPrompt(false);
    }
  }, []);

  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(userAgent)) return "iOS";
    if (/android/.test(userAgent)) return "Android";
    if (/chrome/.test(userAgent) && !/edge|edg|opr/.test(userAgent))
      return "Chrome";
    if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) return "Safari";
    if (/firefox/.test(userAgent)) return "Firefox";
    if (/edg/.test(userAgent)) return "Edge";
    return "Other";
  };

  const renderInstructions = () => {
    switch (browser) {
      case "iOS":
        return (
          <span className="flex flex-wrap items-center gap-1">
            <p className="whitespace-nowrap">📱 To install this app, tap the</p>
            {<MdOutlineIosShare size={24} />}
            <p className="whitespace-nowrap">
              button in your browser and select
            </p>
            <p>
              <strong>"Add to Home Screen"</strong>.
            </p>
          </span>
        );
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 w-screen h-screen flex items-end justify-center z-[20394582304958] bg-black/50">
      <div className="fixed bottom-0 left-0 w-screen bg-background shadow-lg rounded-lg p-4 flex justify-between items-center z-[20394582304958]">
        {renderInstructions()}
        <button
          onClick={() => setShowPrompt(false)}
          className="ml-4 bg-gray-600 text-white px-3 py-1 rounded">
          Close
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;

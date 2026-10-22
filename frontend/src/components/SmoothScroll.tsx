"use client";

import React from "react";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  // Allow native browser scrolling to prevent wheel-event interception/locking
  return <>{children}</>;
}

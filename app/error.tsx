"use client";

import { useEffect } from "react";
import { Button } from "@/components/Button";
import { ErrorState } from "@/components/states";

// Server error messages are stripped in production, so this stays generic on purpose.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      message="We couldn't load this page. The store may be temporarily unavailable."
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}

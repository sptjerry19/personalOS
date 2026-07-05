"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="glass-panel max-w-md rounded-[2rem] p-8 text-center">
        <h1 className="text-xl font-medium">Đã xảy ra lỗi</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "Server Components render failed."}
        </p>
        {error.digest ? (
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            digest: {error.digest}
          </p>
        ) : null}
        <Button className="mt-4" onClick={() => reset()}>
          Thử lại
        </Button>
      </div>
    </div>
  );
}

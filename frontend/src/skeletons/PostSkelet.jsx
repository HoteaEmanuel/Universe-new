import React from "react";

const PostSkelet = () => {
  return (
    <div className="flex w-full animate-pulse flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="size-9 rounded-full bg-muted"></div>
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-24 rounded bg-muted"></div>
          <div className="h-2.5 w-16 rounded bg-muted"></div>
        </div>
      </div>
      <div className="aspect-square w-full bg-muted"></div>
      <div className="flex flex-col gap-2 px-4 py-4">
        <div className="h-3 w-3/4 rounded bg-muted"></div>
        <div className="h-3 w-1/2 rounded bg-muted"></div>
      </div>
    </div>
  );
};

export default PostSkelet;

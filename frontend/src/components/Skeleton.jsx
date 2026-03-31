export function ChatRowSkeleton() {
  return (
    <div className="flex animate-pulse gap-3 px-3 py-3">
      <div className="h-12 w-12 shrink-0 rounded-full bg-tg-hover" />
      <div className="flex flex-1 flex-col justify-center gap-2">
        <div className="h-3 w-1/3 rounded bg-tg-hover" />
        <div className="h-2 w-2/3 rounded bg-tg-hover" />
      </div>
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-4 py-2">
      <div className="ml-auto h-10 w-48 animate-pulse rounded-2xl rounded-br-md bg-tg-bubbleOut/40" />
      <div className="mr-auto h-10 w-56 animate-pulse rounded-2xl rounded-bl-md bg-tg-bubbleIn" />
      <div className="ml-auto h-10 w-40 animate-pulse rounded-2xl rounded-br-md bg-tg-bubbleOut/40" />
    </div>
  );
}

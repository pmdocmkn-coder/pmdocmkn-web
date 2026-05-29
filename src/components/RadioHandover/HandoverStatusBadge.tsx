export default function HandoverStatusBadge({ status }: { status: string }) {
  const done = status === "Completed";
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${done ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
        }`}
    >
      {done ? "Done" : "Menunggu TTD Penerima"}
    </span>
  );
}

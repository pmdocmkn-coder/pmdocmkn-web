export default function HandoverStatusBadge({ status }: { status: string }) {
  if (status === "Completed") {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-emerald-100 text-emerald-800 border border-emerald-200">
        Selesai
      </span>
    );
  }

  if (status === "Cancelled") {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-gray-100 text-gray-700 border border-gray-300">
        Dibatalkan / Arsip
      </span>
    );
  }

  if (status === "Draft") {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-gray-100 text-gray-600 border border-gray-200">
        Draft
      </span>
    );
  }

  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-amber-100 text-amber-800 border border-amber-200">
      Menunggu TTD Penerima
    </span>
  );
}


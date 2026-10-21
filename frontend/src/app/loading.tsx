export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#F6F3ED] text-[#292B26] px-4">
      <div className="relative flex items-center justify-center mb-4">
        <div className="h-12 w-12 rounded-full border-3 border-[#DCD6CB] border-t-[#292B26] animate-spin" />
      </div>
      <span className="text-sm tracking-widest uppercase font-medium text-[#292B26]">
        Loading
      </span>
    </div>
  );
}

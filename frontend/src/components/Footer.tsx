import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative w-full overflow-hidden border-t border-[#DCD6CB]/30 bg-[#1D1F1C]">
      {/* Footer background using assets/New folder/footer.webp as SVG image to fill the rectangle */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <image
            href="/footer.webp"
            x="0"
            y="0"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid slice"
          />
        </svg>
        {/* Subtle contrast overlay to keep image visible while ensuring text is legible */}
        <div className="absolute inset-0 bg-[#1D1F1C]/60 backdrop-blur-[1px]" />
      </div>

      {/* Content spanning to corners */}
      <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 py-9 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Corner: Official PIXABUILD SVG Logo and Bodoni Moda Brand Title */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-7 w-7 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 295 300"
              className="h-6 w-6 text-[#F6F3ED] fill-current group-hover:text-white transition-colors"
              aria-label="PixaBuild Logo"
            >
              <path
                d="M 2,64 L 1,65 L 1,187 L 0,188 L 0,299 L 145,299 L 145,273 L 146,272 L 146,236 L 64,236 L 63,235 L 63,174 L 64,173 L 64,64 Z M 279,0 L 280,1 L 279,3 L 280,4 L 280,13 L 281,13 L 281,5 L 282,4 L 284,7 L 284,9 L 286,13 L 288,13 L 289,11 L 289,9 L 292,4 L 293,5 L 293,13 L 294,13 L 294,0 L 291,0 L 290,5 L 287,10 L 285,7 L 285,5 L 284,4 L 284,2 L 283,0 Z M 266,0 L 266,1 L 269,1 L 271,3 L 270,4 L 270,13 L 272,13 L 272,2 L 273,1 L 276,1 L 276,0 Z M 67,0 L 66,2 L 66,63 L 230,63 L 231,64 L 231,158 L 230,159 L 230,170 L 229,171 L 148,171 L 147,172 L 147,234 L 221,234 L 223,233 L 294,162 L 294,64 L 232,64 L 230,62 L 231,61 L 231,0 Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span className="font-brand font-medium tracking-[0.22em] text-xl sm:text-2xl text-[#FFFFFF]">
            PIXABUILD
          </span>
        </Link>

        {/* Developers */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 text-sm text-[#F6F3ED]">
          <span className="text-[#C5B49F] uppercase tracking-wider text-[11px] font-semibold sm:pt-0.5">
            Developers :
          </span>
          <ul className="list-none p-0 m-0 space-y-0.5 text-center sm:text-left">
            <li className="font-medium tracking-wide text-white">Hariharasudhan A</li>
            <li className="font-medium tracking-wide text-white">Hariprasad V</li>
          </ul>
        </div>

        {/* Right Corner: Contact */}
        <div className="flex items-center gap-2 text-sm text-[#F6F3ED]">
          <span className="text-[#C5B49F] uppercase tracking-wider text-[11px] font-semibold">
            Contact :
          </span>
          <a
            href="mailto:sudanayyappan_bcs28@mepcoeng.ac.in"
            className="font-medium text-[#F6F3ED] hover:text-white underline underline-offset-4 decoration-[#C5B49F] transition-colors"
          >
            sudanayyappan_bcs28@mepcoeng.ac.in
          </a>
        </div>
      </div>
    </footer>
  );
}

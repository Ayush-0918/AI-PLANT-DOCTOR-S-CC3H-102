type AppLogoProps = {
  className?: string;
  size?: number;
};

export default function AppLogo({
  className = '',
  size = 88,
}: AppLogoProps) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-[30%] bg-white/90 shadow-[0_20px_40px_rgba(3,46,23,0.18)] ring-1 ring-white/70 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.72}
        height={size * 0.72}
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="21" y="42" width="30" height="16" rx="5" fill="#6CA96D" />
        <rect x="24" y="48" width="24" height="7" rx="3.5" fill="#9BC86B" />
        <path
          d="M36 42V29"
          stroke="#2D5B3C"
          strokeWidth="3.6"
          strokeLinecap="round"
        />
        <path
          d="M35.5 30C28 30 24 23.8 24 17.5C31.6 17.5 35.5 23.8 35.5 30Z"
          fill="#74C86B"
          stroke="#2D5B3C"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        <path
          d="M36.5 30C44 30 48 23.8 48 17.5C40.4 17.5 36.5 23.8 36.5 30Z"
          fill="#74C86B"
          stroke="#2D5B3C"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        <circle cx="36" cy="35" r="8.5" fill="#FFF9E8" stroke="#2D5B3C" strokeWidth="2.8" />
        <circle cx="33.5" cy="34" r="1.2" fill="#2D5B3C" />
        <circle cx="38.5" cy="34" r="1.2" fill="#2D5B3C" />
        <path
          d="M33 38C34.1 39 35.2 39.5 36.5 39.5C37.8 39.5 38.9 39 40 38"
          stroke="#2D5B3C"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <rect x="49" y="19" width="12" height="12" rx="3" fill="#F7F3E8" stroke="#2D5B3C" strokeWidth="2.6" />
        <path d="M55 22.5V27.5" stroke="#2D5B3C" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M52.5 25H57.5" stroke="#2D5B3C" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M17 19L19 21" stroke="#86D2C9" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M19 14L20.2 16.8" stroke="#86D2C9" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M13.5 17.5L16.2 18.6" stroke="#86D2C9" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

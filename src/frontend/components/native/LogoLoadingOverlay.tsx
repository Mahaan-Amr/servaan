'use client';

interface LogoLoadingOverlayProps {
  active: boolean;
  message?: string;
  delayedMessage?: string;
}

export function LogoLoadingOverlay({ active, message, delayedMessage }: LogoLoadingOverlayProps) {
  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-white/45 backdrop-blur-xl dark:bg-black/35">
      <div className="flex flex-col items-center gap-4 rounded-[28px] border border-white/40 bg-white/70 px-8 py-7 shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-slate-950/70">
        <div className="native-logo-loader">
          <img src="/brand/servaan-logo.png" alt="Servaan" className="h-20 w-20 object-contain" />
        </div>
        {message && <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{message}</p>}
        {delayedMessage && <p className="native-delayed-message text-xs text-slate-500 dark:text-slate-400">{delayedMessage}</p>}
      </div>

      <style jsx>{`
        .native-logo-loader {
          position: relative;
          display: grid;
          place-items: center;
          border-radius: 24px;
          animation: native-logo-breathe 1.35s ease-in-out infinite;
        }

        .native-logo-loader::after {
          content: '';
          position: absolute;
          inset: 8px;
          border-radius: 22px;
          border: 1px solid rgba(34, 211, 238, 0.36);
          opacity: 0;
          animation: native-logo-ring 1.35s ease-out infinite;
        }

        .native-delayed-message {
          opacity: 0;
          animation: native-message-delay 0.2s ease-out 2s forwards;
        }

        @keyframes native-logo-breathe {
          0%,
          100% {
            transform: scale(0.98);
            filter: saturate(0.95);
          }
          50% {
            transform: scale(1.03);
            filter: saturate(1.1);
          }
        }

        @keyframes native-logo-ring {
          0% {
            opacity: 0.5;
            transform: scale(0.8);
          }
          100% {
            opacity: 0;
            transform: scale(1.55);
          }
        }

        @keyframes native-message-delay {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// src/components/ClaimTicketButton.tsx

type Props = {
  /** true if user can see/claim the ticket */
  isEligible: boolean;
  /** true if the user already claimed a ticket for this event */
  hasClaimed: boolean;
  /** true if no remaining capacity */
  soldOut: boolean;
  /** optional loading flag while claim request is in-flight */
  loading?: boolean;
  /** parent-provided click handler (handles eventId + API) */
  onClick: () => void;
};

export default function ClaimTicketButton({
  isEligible,
  hasClaimed,
  soldOut,
  loading = false,
  onClick,
}: Props) {
  if (!isEligible) return null;

  const disabled = soldOut || hasClaimed || loading;

  const label = loading
    ? "Claiming…"
    : soldOut
    ? "Sold out"
    : hasClaimed
    ? "Already claimed"
    : "Claim Ticket";

  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      aria-busy={loading}
      aria-label={label}
      onClick={disabled ? undefined : onClick}
      style={{
        padding: "0.6rem 1rem",
        borderRadius: 12,
        background: disabled ? "#aaa" : "#671a55",
        color: "#fff",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "filter 120ms ease",
      }}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {label}
    </button>
  );
}

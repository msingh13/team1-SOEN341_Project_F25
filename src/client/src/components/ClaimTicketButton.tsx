type Props = {
    isEligible: boolean;    // true if user can claim the ticket
    hasClaimed: boolean;    // true if user has already claimed the ticket
    soldOut: boolean;       // true if tickets are sold out
    loading?: boolean;
    onClick: () => void;    // action when clicked
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
        ? "Claiming…"                                       // ✅ show while busy
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
      onClick={disabled ? undefined : onClick}
      style={{
        padding: "0.6rem 1rem",
        borderRadius: 12,
        background: disabled ? "#aaa" : "#671a55ff",
        color: "white",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
    </button>
  );
}

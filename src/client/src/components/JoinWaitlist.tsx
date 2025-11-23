import { useState, useEffect } from "react";
import { http } from "../lib/api";

interface JoinWaitlistProps {
    eventId: number;
    isSoldOut: boolean;
}

interface WaitlistStatus {
    state: "not_joined" | "waiting";
    position: number | null;
}

export default function JoinWaitlist({ eventId, isSoldOut }: JoinWaitlistProps) {
    const [status, setStatus] = useState<WaitlistStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (!isSoldOut) return;

        let cancelled = false;
        setLoading(true);
        http("GET", `/events/${eventId}/waitlist/status`)
            .then((data) => {
                if (!cancelled) setStatus(data);
            })
            .catch((err) => {
                console.error("Failed to load waitlist status", err);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [eventId, isSoldOut]);

    async function handleJoin() {
        setActionLoading(true);
        try {
            const res = await http("POST", `/events/${eventId}/waitlist/join`);
            setStatus(res); // { state: 'waiting', position: N }
        } catch (err) {
            alert("Failed to join waitlist");
        } finally {
            setActionLoading(false);
        }
    }

    async function handleLeave() {
        if (!confirm("Are you sure you want to leave the waitlist?")) return;
        setActionLoading(true);
        try {
            await http("DELETE", `/events/${eventId}/waitlist/leave`);
            setStatus({ state: "not_joined", position: null });
        } catch (err) {
            alert("Failed to leave waitlist");
        } finally {
            setActionLoading(false);
        }
    }

    if (!isSoldOut) return null;
    if (loading) return <div style={{ color: "#666" }}>Checking waitlist...</div>;
    if (!status) return null;

    if (status.state === "waiting") {
        return (
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#2a2a2a",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #3a3a3a"
            }}>
                <span style={{ color: "#4ade80", fontWeight: 500 }}>
                    You are #{status.position} in line
                </span>
                <button
                    onClick={handleLeave}
                    disabled={actionLoading}
                    style={{
                        background: "transparent",
                        border: "1px solid #ef4444",
                        color: "#ef4444",
                        padding: "4px 8px",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: "0.85rem"
                    }}
                >
                    {actionLoading ? "..." : "Leave"}
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleJoin}
            disabled={actionLoading}
            style={{
                background: "#2563eb",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600
            }}
        >
            {actionLoading ? "Joining..." : "Join Waitlist"}
        </button>
    );
}

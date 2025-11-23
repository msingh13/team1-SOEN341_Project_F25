import React from "react";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log the full stack trace for developers
    console.error("⚠️ ErrorBoundary caught an error:", error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            borderRadius: 12,
            background: "#3d1010",
            border: "1px solid #a43b3b",
            color: "#ffb5b5",
            maxWidth: 600,
            margin: "40px auto",
            textAlign: "center",
          }}
        >
          <h2>Something went wrong 😢</h2>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              textAlign: "left",
              background: "#2a1c1c",
              color: "#ffc0c0",
              padding: "10px 14px",
              borderRadius: 8,
              overflowX: "auto",
              marginTop: 12,
            }}
          >
            {this.state.error.message || String(this.state.error)}
          </pre>
          <button
            onClick={this.handleReload}
            style={{
              marginTop: 16,
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

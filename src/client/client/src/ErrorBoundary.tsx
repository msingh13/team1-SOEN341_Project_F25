import React from "react";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {

    console.error("ErrorBoundary caught an error", error, info);

  }

  render() {
    if (this.state.error) {
      return (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            color: "red",
            padding: 16,
            background: "#fee",
            borderRadius: 8,
          }}
        >
          {this.state.error.message || String(this.state.error)}
        </pre>
      );
    }
    return this.props.children;
  }
}

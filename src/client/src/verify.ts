// src/verify.ts
//------------------------------------------------------------
// Purpose:
//   Mock authentication & verification utility for demo mode.
//   Stores user info in localStorage and provides helper functions.
//
// Usage in console (for testing):
//   LoginStudent()
//   LoginUnverified()
//   Logout()
//------------------------------------------------------------

export type User = {
    id: string;
    role: "student" | "organizer" | "admin" | "user";
    verified: boolean;
  };
  
  const key = "campus_auth_token";
  
  // ------------------------------------------------------------
  // Retrieve current user from localStorage
  // ------------------------------------------------------------
  export function getUser(): User | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
  
  // ------------------------------------------------------------
  // Check if user is verified
  // ------------------------------------------------------------
  export function isVerified(): boolean {
    const user = getUser();
    return !!user?.verified;
  }
  
  // ------------------------------------------------------------
  // Save user and refresh app
  // ------------------------------------------------------------
  export function setUser(u: User) {
    localStorage.setItem(key, JSON.stringify(u));
    location.reload(); // ✅ added parentheses so it actually reloads
  }
  
  // ------------------------------------------------------------
  // Clear user (logout)
  // ------------------------------------------------------------
  export function clearUser() {
    localStorage.removeItem(key);
    location.reload(); // optional: force UI refresh
  }
  
  // ------------------------------------------------------------
  // Global helpers (for demo / dev)
  // ------------------------------------------------------------
  // Type in browser console:
  //   LoginStudent()
  //   LoginUnverified()
  //   Logout()
  
  (window as any).LoginStudent = () =>
    setUser({ id: "stu_1", role: "student", verified: true });
  
  (window as any).LoginUnverified = () =>
    setUser({ id: "stu_2", role: "student", verified: false });
  
  (window as any).Logout = () => clearUser();
  
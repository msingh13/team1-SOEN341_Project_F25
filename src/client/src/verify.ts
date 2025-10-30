export type User = {
    id: string;
    role: "student";
    verified: boolean;
  };
  
  const key = "campus_auth_token";
  
  export function getUser(): User | null {
    try {
      const token = localStorage.getItem(key);
      return token ? (JSON.parse(token) as User) : null;
    } catch {
      return null;
    }
  }
  
  export function setUser(u: User) {
    localStorage.setItem(key, JSON.stringify(u));
    location.reload();
  }
  
  export function clearUser() {
    localStorage.removeItem(key);
    location.reload();
  }
  
  (window as any).LoginStudent = () =>
    setUser({ id: "stu_1", role: "student", verified: true });
  
  (window as any).Logout = () => clearUser();
  
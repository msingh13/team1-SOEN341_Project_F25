export type User ={
    id: string;
    role: "user" | "admin";
    verified: boolean;
}

const key = 'auth_token';

export function getUser(): User | null {
    try{
        const token = localStorage.getItem(key);
        if (token) {
            return JSON.parse(token) as User;
        }else{
            return null;}
        
     }catch{
        return null;
     }
}
export function isVverified(): boolean {
    const user = getUser();
    if (!user?.verified) {
        return false
     }else {
        return true;
    }
}
export function setUser(u: User) {           
  localStorage.setItem(key, JSON.stringify(u));
  location.reload
}

export function clearUser() {                 
  localStorage.removeItem(key);                
}

(window as any).LoginStudent    = () => setUser({ id: "stu_1", role: "user", verified: true  }); // Allow page;
(window as any).LoginUnverified = () => setUser({ id: "stu_2", role: "user", verified: false }); // Block page
(window as any).Logout= () => clearUser();         
export async function validateTicket(qrData: string, token:string ) {
const response = await fetch("http://localhost:3000/api/admin/validate-ticket", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ qrData }),
    }); 
    return response.json();
}
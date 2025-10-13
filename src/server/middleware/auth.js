import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {

const authHeader = req.headers.authorization;
if(!authHeader) 
    return res.status(401).json({ message: 'No token provided' });

const [type, token] = authHeader.split(' ');
if(type !== 'Bearer' || !token) 
    return res.status(401).json({ message: 'Invalid token format' });

try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log("Token authenticated for user ID:", decoded.id);
    next();
    

}catch(err){
    return res.status(403).json({ message: 'Invalid or expired token' });
}


}


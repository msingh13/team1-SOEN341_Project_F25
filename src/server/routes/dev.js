import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", (req, res) => {

    const id = req.body?.id;
    const password = req.body?.password;

    if(!id) 
        return res.status(400).json({ message: 'ID is required' });
    
    const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log(`User ${id} logged in, token generated.`);
    console.log(token);
   
    

    res.json({ token });
})

export default router;

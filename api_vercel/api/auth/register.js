import { db, adminTimestamp } from "../../firebase";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({message:"Método no permitido"});

  const {username,email,password}=req.body;
  const exists=await db.collection("users").where("email","==",email).get();
  if(!exists.empty)return res.status(400).json({message:"Email ya registrado"});

  const passwordHash=await bcrypt.hash(password,10);
  const newUser={username,email,passwordHash,createdAt:adminTimestamp(),isAdmin:false};
  const ref=await db.collection("users").add(newUser);

  const token=jwt.sign({uid:ref.id,email},process.env.JWT_SECRET,{expiresIn:"7d"});
  res.json({uid:ref.id,token});
}

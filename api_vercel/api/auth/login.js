import { db } from "../../firebase";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({message:"Método no permitido"});

  const {email,password}=req.body;
  const snap=await db.collection("users").where("email","==",email).get();
  if(snap.empty)return res.status(400).json({message:"Usuario no encontrado"});

  const doc=snap.docs[0];
  const user={id:doc.id,...doc.data()};
  const match=await bcrypt.compare(password,user.passwordHash||"");
  if(!match)return res.status(401).json({message:"Credenciales inválidas"});

  const token=jwt.sign({uid:user.id,email},process.env.JWT_SECRET,{expiresIn:"7d"});
  res.json({uid:user.id,token});
}

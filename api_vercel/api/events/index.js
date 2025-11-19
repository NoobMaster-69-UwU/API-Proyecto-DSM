import { db, adminTimestamp } from "../../firebase";
import jwt from "jsonwebtoken";

export default async function handler(req,res){
  if(req.method==="GET"){
    const snap=await db.collection("events").orderBy("date","asc").get();
    return res.json(snap.docs.map(d=>({id:d.id,...d.data()})));
  }

  if(req.method==="POST"){
    try{
      const token=req.headers.authorization?.split(" ")[1];
      const decoded=jwt.verify(token,process.env.JWT_SECRET);

      const {title,date,location,description}=req.body;
      const ref=await db.collection("events").add({
        title,date,location,description,
        createdBy:decoded.uid,createdAt:adminTimestamp()
      });
      return res.json({id:ref.id});
    }catch(e){
      return res.status(401).json({message:"Token inválido"});
    }
  }

  res.status(405).json({message:"Método no permitido"});
}

import { db, adminTimestamp } from "../../../firebase";
import jwt from "jsonwebtoken";

export default async function handler(req,res){
  const {id}=req.query;

  if(req.method==="GET"){
    const snap=await db.collection("events").doc(id).collection("comments").orderBy("createdAt","asc").get();
    return res.json(snap.docs.map(d=>({id:d.id,...d.data()})));
  }

  if(req.method==="POST"){
    try{
      const token=req.headers.authorization?.split(" ")[1];
      const decoded=jwt.verify(token,process.env.JWT_SECRET);

      const {text,rating}=req.body;
      const comment={userId:decoded.uid,text,rating:rating||null,createdAt:adminTimestamp()};
      const ref=await db.collection("events").doc(id).collection("comments").add(comment);
      return res.json({id:ref.id,...comment});
    }catch(e){
      return res.status(401).json({message:"Token inválido"});
    }
  }

  res.status(405).json({message:"Método no permitido"});
}

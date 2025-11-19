import { db } from "../../firebase";
import jwt from "jsonwebtoken";

export default async function handler(req,res){
  const {id}=req.query;

  if(req.method==="GET"){
    const doc=await db.collection("events").doc(id).get();
    return res.json({id,...doc.data()});
  }

  if(req.method==="PUT"){
    try{
      const token=req.headers.authorization?.split(" ")[1];
      jwt.verify(token,process.env.JWT_SECRET);

      await db.collection("events").doc(id).update(req.body);
      return res.json({message:"Actualizado"});
    }catch(e){
      return res.status(401).json({message:"Token inválido"});
    }
  }

  res.status(405).json({message:"Método no permitido"});
}

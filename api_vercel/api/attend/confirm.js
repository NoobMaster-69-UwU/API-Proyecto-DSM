import { db, adminTimestamp } from "../../firebase";
import jwt from "jsonwebtoken";

export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({message:"Método no permitido"});

  try{
    const token=req.headers.authorization?.split(" ")[1];
    const decoded=jwt.verify(token,process.env.JWT_SECRET);

    const {eventId}=req.body;
    await db.collection("events").doc(eventId).collection("attendees").doc(decoded.uid)
      .set({userId:decoded.uid,confirmedAt:adminTimestamp()});

    res.json({message:"Asistencia confirmada"});
  }catch(e){
    return res.status(401).json({message:"Token inválido"});
  }
}

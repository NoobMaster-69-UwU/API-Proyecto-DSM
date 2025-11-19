import { db } from "../../firebase";

export default async function handler(req,res){
  if(req.method!=="GET")return res.status(405).json({message:"Método no permitido"});

  const {eventId}=req.query;
  const snap=await db.collection("events").doc(eventId).collection("attendees").get();
  return res.json(snap.docs.map(d=>({id:d.id,...d.data()})));
}

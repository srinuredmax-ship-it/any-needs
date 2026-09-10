import type { NextFunction,Request,Response } from "express";
import { verifyToken, type TokenUser } from "../auth.js";
declare global { namespace Express { interface Request { user?:TokenUser } } }
export function requireAuth(req:Request,res:Response,next:NextFunction){try{const h=req.headers.authorization;if(!h?.startsWith("Bearer ")) return res.status(401).json({error:"Login required"});req.user=verifyToken(h.slice(7));next();}catch{return res.status(401).json({error:"Invalid or expired login"});}}
export function requireAdmin(req:Request,res:Response,next:NextFunction){requireAuth(req,res,()=>req.user?.role==="ADMIN"?next():res.status(403).json({error:"Admin access required"}));}

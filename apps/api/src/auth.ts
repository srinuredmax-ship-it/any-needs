import jwt from "jsonwebtoken";
import { config } from "./config.js";
export type TokenUser={sub:string;role:"CUSTOMER"|"ADMIN";phone?:string;email?:string};
export const signToken=(u:TokenUser)=>jwt.sign(u,config.JWT_SECRET,{expiresIn:"7d"});
export const verifyToken=(token:string)=>jwt.verify(token,config.JWT_SECRET) as TokenUser;

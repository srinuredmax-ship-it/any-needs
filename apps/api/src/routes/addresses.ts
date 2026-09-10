import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
export const addressesRouter=Router();addressesRouter.use(requireAuth);
const input=z.object({label:z.string().default("Home"),line1:z.string().min(5),line2:z.string().optional(),city:z.string().min(2),state:z.string().min(2),pincode:z.string().regex(/^\d{6}$/),landmark:z.string().optional(),isDefault:z.boolean().default(false)});
addressesRouter.get("/",async(req,res)=>res.json(await prisma.address.findMany({where:{userId:req.user!.sub},orderBy:[{isDefault:"desc"},{createdAt:"desc"}]})));
addressesRouter.post("/",async(req,res)=>{const data=input.parse(req.body);const row=await prisma.$transaction(async tx=>{if(data.isDefault)await tx.address.updateMany({where:{userId:req.user!.sub},data:{isDefault:false}});return tx.address.create({data:{...data,userId:req.user!.sub}})});res.status(201).json(row);});
addressesRouter.delete("/:id",async(req,res)=>{await prisma.address.deleteMany({where:{id:req.params.id,userId:req.user!.sub}});res.status(204).end();});

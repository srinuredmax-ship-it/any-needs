import { Router } from "express";
import { createHmac } from "node:crypto";
import Razorpay from "razorpay";
import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
export const paymentsRouter=Router();
paymentsRouter.post("/razorpay/order",requireAuth,async(req,res)=>{if(!config.RAZORPAY_KEY_ID||!config.RAZORPAY_KEY_SECRET)return res.status(503).json({error:"Online payment is not configured"});const {orderId}=z.object({orderId:z.string()}).parse(req.body);const order=await prisma.order.findFirst({where:{id:orderId,userId:req.user!.sub,paymentMethod:"ONLINE",paymentStatus:"PENDING"}});if(!order)return res.status(404).json({error:"Order not found"});const rz=new Razorpay({key_id:config.RAZORPAY_KEY_ID,key_secret:config.RAZORPAY_KEY_SECRET});const paymentOrder=await rz.orders.create({amount:order.total*100,currency:"INR",receipt:order.trackingCode});await prisma.order.update({where:{id:order.id},data:{paymentOrderId:paymentOrder.id}});res.json({keyId:config.RAZORPAY_KEY_ID,order:paymentOrder});});
paymentsRouter.post("/razorpay/verify",requireAuth,async(req,res)=>{const body=z.object({orderId:z.string(),razorpayOrderId:z.string(),razorpayPaymentId:z.string(),razorpaySignature:z.string()}).parse(req.body);const expected=createHmac("sha256",config.RAZORPAY_KEY_SECRET||"").update(`${body.razorpayOrderId}|${body.razorpayPaymentId}`).digest("hex");if(expected!==body.razorpaySignature)return res.status(400).json({error:"Invalid payment signature"});const order=await prisma.order.update({where:{id:body.orderId,userId:req.user!.sub},data:{paymentStatus:"PAID",status:"CONFIRMED",paymentId:body.razorpayPaymentId,paymentOrderId:body.razorpayOrderId,statusEvents:{create:{status:"CONFIRMED",note:"Online payment received"}}}});res.json(order);});


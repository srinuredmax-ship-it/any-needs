import { Router } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";
import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
export const paymentsRouter=Router();
function validSignature(payload: string | Buffer, signature: string, secret: string) {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(payload).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
async function confirmPayment(orderId: string, paymentId: string) {
  await prisma.$transaction(async tx => {
    const changed = await tx.order.updateMany({where:{id:orderId,paymentStatus:"PENDING",status:"AWAITING_PAYMENT"},data:{paymentStatus:"PAID",status:"CONFIRMED",paymentId}});
    if(changed.count) await tx.orderStatusEvent.create({data:{orderId,status:"CONFIRMED",note:"Online payment confirmed by Razorpay"}});
  });
}
paymentsRouter.post("/razorpay/webhook",async(req,res)=>{
  if(!config.RAZORPAY_WEBHOOK_SECRET)return res.status(503).json({error:"Webhook is not configured"});
  if(!Buffer.isBuffer(req.body)||!validSignature(req.body,req.get("x-razorpay-signature")||"",config.RAZORPAY_WEBHOOK_SECRET))return res.status(400).json({error:"Invalid webhook signature"});
  let event;try{event=JSON.parse(req.body.toString("utf8"))}catch{return res.status(400).json({error:"Invalid webhook body"})}
  if(event.event==="payment.captured"){
    const payment=event.payload?.payment?.entity;
    if(typeof payment?.order_id!=="string"||typeof payment?.id!=="string")return res.status(400).json({error:"Missing payment details"});
    const order=await prisma.order.findFirst({where:{paymentOrderId:payment.order_id,paymentMethod:"ONLINE"}});
    if(!order)return res.status(404).json({error:"Order not found"});
    if(payment.amount!==order.total*100||payment.currency!=="INR"||payment.status!=="captured")return res.status(400).json({error:"Payment details do not match"});
    await confirmPayment(order.id,payment.id);
  }
  res.json({ok:true});
});
paymentsRouter.post("/razorpay/order",requireAuth,async(req,res)=>{if(!config.RAZORPAY_KEY_ID||!config.RAZORPAY_KEY_SECRET)return res.status(503).json({error:"Online payment is not configured"});const {orderId}=z.object({orderId:z.string()}).parse(req.body);const order=await prisma.order.findFirst({where:{id:orderId,userId:req.user!.sub,paymentMethod:"ONLINE",paymentStatus:"PENDING"}});if(!order)return res.status(404).json({error:"Order not found"});const rz=new Razorpay({key_id:config.RAZORPAY_KEY_ID,key_secret:config.RAZORPAY_KEY_SECRET});const paymentOrder=await rz.orders.create({amount:order.total*100,currency:"INR",receipt:order.trackingCode});await prisma.order.update({where:{id:order.id},data:{paymentOrderId:paymentOrder.id}});res.json({keyId:config.RAZORPAY_KEY_ID,order:paymentOrder});});
paymentsRouter.post("/razorpay/verify",requireAuth,async(req,res)=>{
  if(!config.RAZORPAY_KEY_SECRET)return res.status(503).json({error:"Online payment is not configured"});
  const body=z.object({orderId:z.string(),razorpayOrderId:z.string(),razorpayPaymentId:z.string(),razorpaySignature:z.string()}).parse(req.body);
  const order=await prisma.order.findFirst({where:{id:body.orderId,userId:req.user!.sub,paymentMethod:"ONLINE",paymentOrderId:body.razorpayOrderId}});
  if(!order)return res.status(404).json({error:"Order not found"});
  if(!validSignature(`${body.razorpayOrderId}|${body.razorpayPaymentId}`,body.razorpaySignature,config.RAZORPAY_KEY_SECRET))return res.status(400).json({error:"Invalid payment signature"});
  await confirmPayment(order.id,body.razorpayPaymentId);
  res.json(await prisma.order.findUnique({where:{id:order.id}}));
});

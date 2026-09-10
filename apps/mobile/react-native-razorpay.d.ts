declare module "react-native-razorpay" {
  type Options={key:string;order_id:string;amount:number|string;currency:string;name:string;description?:string;image?:string;theme?:{color:string}};
  type Success={razorpay_payment_id:string;razorpay_order_id:string;razorpay_signature:string};
  const RazorpayCheckout:{open(options:Options):Promise<Success>};
  export default RazorpayCheckout;
}

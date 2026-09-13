import type { Metadata,Viewport } from "next";import "./globals.css";
export const metadata:Metadata={title:"Any Needs — One Cart. Every Need.",description:"Everyday groceries and essentials delivered to your door.",manifest:"/manifest.webmanifest",icons:{icon:"/any-needs-logo.jpg",apple:"/any-needs-logo.jpg"}};
export const viewport:Viewport={themeColor:"#ff7a1a",width:"device-width",initialScale:1,viewportFit:"cover"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<script src="https://checkout.razorpay.com/v1/checkout.js"></script><script dangerouslySetInnerHTML={{__html:`if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}`}}/></body></html>}


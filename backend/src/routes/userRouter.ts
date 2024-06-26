import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { hashPassword } from "../utils/pwdUtils";
import { sign, verify } from 'hono/jwt'
import { signinInput,signupInput } from "@k_harsh777/commonzod";
export const userRouter=new Hono<{
    Bindings: {
      DATABASE_URL: string;
      JWT_SECRET: string;
    },
    Variables:{
      prisma:any
    };
  }>()
userRouter.post("/signup", async (c) => {
    try {
       const prisma=c.get('prisma');
      const body=await c.req.json()
      const {success}=signupInput.safeParse(body)

      if(!success){
        return c.json({
          msg:"Invalid Inputs"
        })
      }
      const {email,password,name}=body
      const hashPwd=await hashPassword(password)
      const user=await prisma.user.create({
        data:{
          email,
          password:hashPwd,
          name
        }}
      )
      const token=await sign({id:user.id},c.env.JWT_SECRET)
      return c.json({
        msg:"Signed up Successfully",
        token
      });
    } catch (error) {
      console.log(error)
      return c.json({
        msg:"Something Went wrong!!!!!"
      })
    }
  });
  
  userRouter.post("/signin", async (c) => {
    try {
       const prisma=c.get('prisma');
      const body=await c.req.json()
      const success=signinInput.safeParse(body)
      if(!success){
        return c.json({
          msg:"Invalid Inputs"
        })
      }
      const {email,password}=body
      const hashPwd=await hashPassword(password)
      const existingUser=await prisma.user.findFirst({
        where:{
          email,
          password:hashPwd
        }
      })
      if (existingUser){
        const token=await sign({id:existingUser.id},c.env.JWT_SECRET)
        return c.json({sucess:true,msg:"Signed in Successfully",token});
      }
      else{
        return c.json({sucess:false,msg:" Incorrect Credentials"});
      }
    } catch (error) {
      console.log(error)
      return c.json({
        msg:"Something went wrong"
      })
    }
  });
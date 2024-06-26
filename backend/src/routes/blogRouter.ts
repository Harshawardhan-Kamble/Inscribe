import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";
import { CreateBlogInput,createBlogInput,updateBlogInput } from "@k_harsh777/commonzod";
export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
    prisma: any;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  const authHeader = c.req.header("authorization") || "";
  const [, token] = authHeader.split(" ");
  const user = await verify(token, c.env.JWT_SECRET);
  if (user) {
    c.set("userId", user.id as string);
    await next();
  } else {
    c.status(403);
    return c.json({
      msg: "You're not Logged in",
    });
  }
});
blogRouter.post("/", async (c) => {
  try {
    const prisma = c.get("prisma");
    const userId = c.get("userId");
    const body = await c.req.json();
    const success=createBlogInput.safeParse(body)
      if(!success){
        return c.json({
          msg:"Invalid inputs"
        })
      }
    const { title, content } = body
    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId: userId,
        published:true
      },
    });
    return c.json({
      post: post,
      id:post.id
    });
  } catch (error) {
    console.log(error);
    return c.json({
      msg: "Something went wrong",
    });
  }
});

blogRouter.put("/", async (c) => {
try {
  const prisma = c.get("prisma");
  const userId = c.get("userId");
  const body = await c.req.json();
  const success=updateBlogInput.safeParse(body)
      if(!success){
        return c.json({
          msg:"Invalid Inputs"
        })
      }
  const { id, title, content } =body
  const update=await prisma.post.update({
    where: {
      id,
      authorId: userId,
    },
    data: {
      title,
      content,
    },
  });
  return c.json({ msg: "Blog Updated Succesfully!" });
} catch (error) {
  console.log(error)
  c.json({
  msg:"Something went Wrong"
  })
}
});
// pagination needs to be added
blogRouter.get("/bulk", async (c) => {
  const prisma = c.get("prisma");
  const posts = await prisma.post.findMany();
  console.log(posts)
  return c.json({ posts });
});
blogRouter.get("/:id", async (c) => {
  const prisma = c.get("prisma");
  try {
    const id = c.req.param("id");
    const postById = await prisma.post.findFirst({
      where: {
        id,
      },
    });
    return c.json({
      postById,
    });
  } catch (error) {
    console.log(error);
    c.status(411);
    return c.json({
      message: "Error while fetching post",
    });
  }
});



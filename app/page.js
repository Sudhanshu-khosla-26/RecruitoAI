import { Button } from "@/components/button";
import Link from "next/link";



export default function Home() {
  return (
    <div className="bg-black flex flex-col gap-4 items-center justify-center h-screen w-screen  ">
      <h1 className="text-white text-7xl">Welcome to HireLog</h1>
      <Link href="/signin">
        <Button className="mt-8 p-4 bg-purple-600" >
          Get Started
        </Button>
      </Link>
    </div>
  );
}



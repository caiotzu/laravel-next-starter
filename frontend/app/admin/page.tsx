import { GalleryVerticalEnd, Monitor, UserCog, ShieldUser } from "lucide-react"
import Image from "next/image"

import { LoginForm } from "@/components/forms/login-form"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Monitor className="size-4" />
            </div>
            Área Administrativa
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted flex flex-1 items-center justify-center hidden lg:block">
         <Image  
            src="/next.svg" 
            alt="logo" 
            width={100}
            height={100}
            className="inset-0 px-32 h-full w-full dark:brightness-[0.2] dark:grayscale"
          />
      </div>
    </div>
  )
}

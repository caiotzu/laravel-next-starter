"use client"

import axios from 'axios';
import Image from "next/image"
import { useState } from 'react'
import { useRouter } from "next/navigation";

import { 
  Monitor,
   CircleAlert 
} from "lucide-react"

import { 
  Alert,
  AlertTitle,
  AlertDescription
} from "@/components/ui/alert"

import { LoginForm } from "@/components/forms/login-form"

import { type LoginData } from "@/lib/validations/auth/login-schema"

export default function LoginPage() {
  const [errors, setErrors] = useState<string[]>([]);
  const router = useRouter();

  async function handleSubmit(data: LoginData) {
    try {
      const response = await axios.post("/api/auth/admin/login", {
        email: data.email,
        senha: data.password,
      });

      if(response.status !== 200)
        throw new Error('Credenciais informadas são inválidas');

      router.push("/admin/dashboard");
    } catch (err: unknown) {
      console.error("Erro no login:", err)

      if (axios.isAxiosError(err)) {
        const msgs =
          err.response?.data?.messages ||
          [err.response?.statusText || "Erro ao se conectar ao servidor"];
        setErrors(msgs);
      } else if (err instanceof Error) {
        setErrors([err.message]);
      } else {
        setErrors(["Erro interno desconhecido."]);
      }
    }
  }

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
            {errors.length > 0 && (
              <Alert variant="destructive" className="relative mb-8">
                <CircleAlert className="h-5 w-5" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>
                  <ul className="list-inside list-disc text-sm">
                    {errors.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <LoginForm onSubmit={handleSubmit} />
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

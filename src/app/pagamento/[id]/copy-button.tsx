"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
export function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copiado!",
      description: "Código PIX copiado com sucesso!",
      variant: "success",
    })
  };

  return (
    <Button
      onClick={handleCopy}
      className="w-full bg-green-400 hover:bg-green-500 text-xs p-2 h-auto"
    >
      {copied ? "Copiado!" : "Copiar"}
    </Button>
  );
} 
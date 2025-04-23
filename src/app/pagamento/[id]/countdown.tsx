"use client";

import { useEffect, useState } from "react";

type CountdownProps = {
  expirationDate: Date;
};

export function Countdown({ expirationDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Função para calcular o tempo restante
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = expirationDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setIsExpired(true);
        return { hours: 0, minutes: 0, seconds: 0 };
      }
      
      // Converter para horas, minutos e segundos
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      return { hours, minutes, seconds };
    };
    
    // Calcular inicialmente
    setTimeLeft(calculateTimeLeft());
    
    // Atualizar a cada segundo
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      // Se expirou, limpar o intervalo
      if (newTimeLeft.hours === 0 && newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        setIsExpired(true);
        clearInterval(timer);
        
        // Recarregar a página após 2 segundos para mostrar o estado de expirado
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    }, 1000);
    
    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(timer);
  }, [expirationDate]);
  
  // Formatar com zeros à esquerda
  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };
  
  if (isExpired) {
    return (
      <div className="text-red-400 font-bold">
        Expirado
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center space-x-1 font-mono text-xs md:text-sm bg-[#1a1a1a] rounded-md p-2 mt-2">
      <div className="flex flex-col items-center">
        <span className="bg-[#252525] px-2 py-1 rounded">{formatNumber(timeLeft.hours)}</span>
        <span className="text-[10px] text-gray-500 mt-1">horas</span>
      </div>
      <span className="text-gray-500">:</span>
      <div className="flex flex-col items-center">
        <span className="bg-[#252525] px-2 py-1 rounded">{formatNumber(timeLeft.minutes)}</span>
        <span className="text-[10px] text-gray-500 mt-1">min</span>
      </div>
      <span className="text-gray-500">:</span>
      <div className="flex flex-col items-center">
        <span className="bg-[#252525] px-2 py-1 rounded">{formatNumber(timeLeft.seconds)}</span>
        <span className="text-[10px] text-gray-500 mt-1">seg</span>
      </div>
    </div>
  );
} 
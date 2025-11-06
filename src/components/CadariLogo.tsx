import React from 'react';
import cadariLogo from 'figma:asset/16f657ce6761d16645467f5c1a6c88bc73467247.png';

export function CadariLogo() {
  return (
    <div className="h-16 flex items-center">
      <img 
        src={cadariLogo} 
        alt="Cadari Engenharia" 
        className="h-full w-auto object-contain"
      />
    </div>
  );
}
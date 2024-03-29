import React from "preact/compat";

type ButtonProps = {
  text: string;
  onClick?: (event: Event) => void;
  className?: string;
};
export default function Button({ text, onClick, className = "" }: ButtonProps) {
  return (
    <button
      className={className + " rounded-md border border-[#85786C] bg-[#EADDCC] pb-[4px] pl-[9px] pr-[9px] pt-[4px] shadow-xl"}
      onClick={onClick}
    >
      {text}
    </button>
  );
}

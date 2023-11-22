import clsx from "clsx"
import React from "react"
import { SwitchProps } from "./stuff"

export const ToggleSwitchWithLabel = (props: SwitchProps) => {
  return (
    <div className={clsx("flex items-center justify-between")}>
      <div className="mr-4 mb-2">
        <label className={clsx("text-lg text-white dark:text-gray-400")}>
          {props.switchTitle}
        </label>
        <p className={clsx("text-gray-500", "text-left")}>
          {props.switchDescription}
        </p>
      </div>
      <input
        type="checkbox"
        checked={props.manualSkip}
        onChange={() => props.setManualSkip(!props.manualSkip)}
        className={clsx(
          "relative",
          "shrink-0",
          "rounded-md",
          "w-4",
          "h-5",
          "p-3",
          "bg-gray-600",
          "border-gray-400",
          "text-blue-950",
        )}
      />
    </div>
  )
}

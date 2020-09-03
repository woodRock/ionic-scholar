import React from "react";

/**
 * This is a wrapper a child component.
 * It puts that child in the center of the screen.
 * Both vertically and horizontally.
 *
 * @param children a child component to be centered
 * @constructor
 */
const CenterChild = ({ children }: Props) => {
  return (
    <div
      style={{
        height: "80%",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {children}
    </div>
  );
};

type Props = {
  children?: React.ReactNode;
};

export default CenterChild;

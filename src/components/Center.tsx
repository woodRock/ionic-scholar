import React from "react";
type Props = {
  children?: React.ReactNode;
};
const CenterChild: React.FC = ({ children }: Props) => {
  return (
    <div
      style={{
        height: "80%",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      {children}
    </div>
  );
};

export default CenterChild;

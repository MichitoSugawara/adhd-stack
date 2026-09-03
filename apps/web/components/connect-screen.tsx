"use client";

import { useConnectBoard } from "../lib/use-connect-board";
import { DesktopConnectScreen } from "./desktop-connect-screen";
import { MobileConnectScreen } from "./mobile-connect-screen";

export const ConnectScreen = () => {
  const board = useConnectBoard();
  return (
    <>
      <DesktopConnectScreen board={board} />
      <MobileConnectScreen board={board} />
    </>
  );
};

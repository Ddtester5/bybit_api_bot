import WebSocket from "ws";

export const publicWs = new WebSocket("wss://stream.bybit.com/v5/public/linear");

export const privateWs = new WebSocket("wss://stream.bybit.com/v5/private");

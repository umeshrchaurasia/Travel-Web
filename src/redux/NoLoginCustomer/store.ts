import { configureStore } from "@reduxjs/toolkit";
import agentReducer from "./agentSlice";

export const store = configureStore({
  reducer: {
    agent: agentReducer, 
  },
});

// Important: Export these types for use in components
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
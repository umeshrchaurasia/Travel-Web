import { configureStore } from "@reduxjs/toolkit";
import agentReducer from "./agentSlice";

export const agentStore = configureStore({
  reducer: {
    agentDashboard: agentReducer, 
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type AgentRootState = ReturnType<typeof agentStore.getState>;
export type AgentAppDispatch = typeof agentStore.dispatch;
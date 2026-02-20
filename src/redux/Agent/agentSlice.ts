import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// 1. Define the shape of your data for the Logged-in Agent
interface AgentState {
  PlanSelection: string;
  agentEmail: string;
  UId: string;
  agentId: number | null;
  FullName: string;
  Agent_Code: string;
  MobileNumber: string;
}

const initialState: AgentState = {
  PlanSelection: "",
  agentEmail: "",
  UId: "",
  agentId: null,
  FullName: "",
  Agent_Code: "",
  MobileNumber: "",
};

const agentSlice = createSlice({
  name: "agentDashboard", // Unique name for the store
  initialState,
  reducers: {
    // Action to set agent data (Using Partial to allow updating specific fields)
    setAgentData: (state, action: PayloadAction<Partial<AgentState>>) => {
      Object.assign(state, action.payload);
    },
    // Action to clear agent data (e.g., on logout)
    resetAgentData: () => initialState,
  },
});

// Export actions
export const { setAgentData, resetAgentData } = agentSlice.actions;

// Export reducer
export default agentSlice.reducer;
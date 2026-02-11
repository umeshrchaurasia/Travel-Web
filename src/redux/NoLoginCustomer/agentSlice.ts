import { createSlice, PayloadAction } from "@reduxjs/toolkit"; 

// 1. Define the shape of your data
interface AgentState {
  PlanSelection: string;
  agentEmail: string;
  UId: string;
  agentId: number | null;
  FullName: string;
}

const initialState: AgentState = {
  PlanSelection: "",
  agentEmail: "",
  UId: "",
  agentId: null,
  FullName: "",
};

const agentSlice = createSlice({
  name: "agent",
  initialState,
  reducers: {
    // RENAMED: Changed from setAgentData to customerAgentData
    customerAgentData: (state, action: PayloadAction<Partial<AgentState>>) => {
      Object.assign(state, action.payload);
    },
    clearAgentData: () => initialState,
  },
});

// Export the renamed action
export const { customerAgentData, clearAgentData } = agentSlice.actions;
export default agentSlice.reducer;
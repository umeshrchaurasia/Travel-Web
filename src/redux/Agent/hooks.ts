import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { AgentRootState, AgentAppDispatch } from './store';

// Use these hooks throughout your AGENT app instead of plain `useDispatch` and `useSelector`
export const useAgentDispatch: () => AgentAppDispatch = useDispatch;
export const useAgentSelector: TypedUseSelectorHook<AgentRootState> = useSelector;
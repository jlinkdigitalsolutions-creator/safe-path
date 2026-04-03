import { create } from "zustand";

type CaseUiState = {
  selectedCaseId: string | null;
  assignmentOpen: boolean;
  setSelectedCase: (id: string | null) => void;
  setAssignmentOpen: (open: boolean) => void;
};

export const useCaseStore = create<CaseUiState>((set) => ({
  selectedCaseId: null,
  assignmentOpen: false,
  setSelectedCase: (id) => set({ selectedCaseId: id }),
  setAssignmentOpen: (open) => set({ assignmentOpen: open }),
}));

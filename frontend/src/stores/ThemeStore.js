import { create } from "zustand"

const useThemeStore = create((set) => ({
  darkMode: true,
  toggleDarkMode: () =>
    set((state) => ({ darkMode: !state.darkMode })),
}))

export default useThemeStore

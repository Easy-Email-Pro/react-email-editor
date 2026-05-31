import { useWindowSize } from "react-use";

export const useCompactMode = () => {
  const { width } = useWindowSize();

  const compact = width >= 1400;

  return compact;
};
